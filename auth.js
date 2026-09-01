// 머니플로우 — Demo auth (frontend-only, localStorage)
// Real backend can be added later by replacing checkLogin / saveSession.

const AUTH_KEY = 'mf_auth_v1';

// 권한 매트릭스 — true = 볼 수 있음
const ROLE_PERMS = {
  boss:    { fixedCost: true,  staffSalary: true,  tax: true,  top3: true,  finalProfit: true,  allSites: true,  staffMgmt: true,  csvExport: true },
  manager: { fixedCost: false, staffSalary: false, tax: true,  top3: true,  finalProfit: true,  allSites: true,  staffMgmt: false, csvExport: true },
  staff:   { fixedCost: false, staffSalary: false, tax: false, top3: false, finalProfit: false, allSites: true,  staffMgmt: false, csvExport: false },
};

// 표시용 호칭 — 권한(role) 자체는 boss/manager/staff 유지, 화면에 보이는 직함만 매핑
// boss = 실장(대표 권한 그대로, 호칭만 '실장')
const ROLE_LABEL = { boss: '실장', manager: '팀장', staff: '대리' };

window.AUTH = {
  current() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
  },
  login(name, pin, role = 'staff') {
    if (!name) return false;
    const session = { name: name.trim(), pin: pin || '0000', role, loggedAt: Date.now() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  },
  logout() {
    localStorage.removeItem(AUTH_KEY);
  },
  can(perm) {
    const s = this.current();
    if (!s) return false;
    const role = s.role || 'staff';
    return ROLE_PERMS[role]?.[perm] ?? false;
  },
  role() {
    return this.current()?.role || 'staff';
  },
  roleLabel() {
    return ROLE_LABEL[this.role()] || '대리';
  },
};

function bootAuth() {
  const session = AUTH.current();
  const loginEl = document.getElementById('login-screen');
  const appEl = document.getElementById('app');
  const tabbar = document.getElementById('tabbar');

  if (session) {
    loginEl.style.display = 'none';
    appEl.style.display = 'block';
    tabbar.style.display = 'flex';
    if (window.MOCK) {
      window.MOCK.user = session.name;
      window.MOCK.role = ROLE_LABEL[session.role || 'staff'];
    }
    return true;
  }

  loginEl.style.display = 'flex';
  appEl.style.display = 'none';
  tabbar.style.display = 'none';
  return false;
}

// 로그인 폼 제출은 firebase.js에서 실제 계정(PIN) 검증과 함께 처리합니다.
