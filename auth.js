// 머니플로우 — Auth with role-based access control
// 역할: boss(보스) / manager(팀장) / staff(직원)

const AUTH_KEY = 'mf_auth_v1';

window.AUTH = {
  current() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
  },
  setSession(session) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ ...session, loggedAt: Date.now() }));
  },
  logout() {
    localStorage.removeItem(AUTH_KEY);
  },
  role() {
    const s = this.current();
    return s ? s.role : null;
  },
  // 권한 체크 헬퍼
  // feature: 'fixedCost' | 'salary' | 'tax' | 'top3'
  can(feature) {
    const role = this.role();
    if (role === 'boss') return true;
    if (role === 'manager') {
      return !['fixedCost'].includes(feature);
    }
    if (role === 'staff') {
      return !['fixedCost', 'salary', 'tax', 'top3'].includes(feature);
    }
    return false;
  }
};

// Firebase에서 계정 조회 후 로그인
async function loginWithFirebase(name, pin) {
  const trimName = name.trim();

  // 보스 계정 체크
  try {
    const bossSnap = await firebase.database().ref('bossAccount').once('value');
    const boss = bossSnap.val();
    if (boss && boss.pin === pin && boss.name === trimName) {
      AUTH.setSession({ name: boss.name, pin, role: 'boss' });
      return { success: true };
    }
  } catch(e) {}

  // 직원 계정 조회
  try {
    const snap = await firebase.database().ref('staffData').once('value');
    const staffData = snap.val() || {};
    const match = Object.values(staffData).find(
      s => s.name === trimName && s.pin === pin && !s.resignDate
    );
    if (match) {
      AUTH.setSession({ name: match.name, pin, role: match.role || 'staff' });
      return { success: true };
    }
  } catch(e) {}

  return { success: false, error: '이름 또는 PIN이 올바르지 않습니다.' };
}

function bootAuth() {
  const session = AUTH.current();
  const loginEl = document.getElementById('login-screen');
  const appEl = document.getElementById('app');
  const tabbar = document.getElementById('tabbar');

  if (session) {
    loginEl.style.display = 'none';
    appEl.style.display = 'block';
    tabbar.style.display = 'flex';
    return true;
  }

  loginEl.style.display = 'flex';
  appEl.style.display = 'none';
  tabbar.style.display = 'none';
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const errEl = document.getElementById('login-error');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('login-name').value;
      const pin  = document.getElementById('login-pin').value;
      if (!name || pin.length < 4) {
        if (errEl) errEl.textContent = '이름과 PIN 4자리를 입력해주세요.';
        return;
      }
      const btn = form.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.textContent = '확인 중...'; }
      try {
        const result = await loginWithFirebase(name, pin);
        if (result.success) {
          bootAuth();
          if (window.navigate) window.navigate('home');
        } else {
          if (errEl) errEl.textContent = result.error || '로그인 실패';
        }
      } catch(err) {
        if (errEl) errEl.textContent = 'Firebase 연결 오류. 잠시 후 다시 시도해주세요.';
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '로그인'; }
      }
    });
  }
});
