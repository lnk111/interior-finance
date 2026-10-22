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
  login(name, pin, role = 'staff', position = '') {
    if (!name) return false;
    const session = { name: name.trim(), pin: pin || '0000', role, position: position || '', loggedAt: Date.now() };
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
  // 화면에 보이는 직함 — 직원 등록 때 입력한 직책(예: 사원)이 있으면 그것을, 없으면 권한 기본 호칭을 쓴다.
  // 대표(boss)는 항상 '실장'. 로그인 세션에 직책이 없는 기존 로그인은 직원 목록에서 이름으로 찾는다.
  roleLabel() {
    const s = this.current();
    const role = this.role();
    if (role !== 'boss') {
      const position = (s && s.position) || this._staffPosition(s && s.name);
      if (position) return position;
    }
    return ROLE_LABEL[role] || '대리';
  },
  _staffPosition(name) {
    if (!name) return '';
    const rec = Object.values(window.FB?.staffData || {}).find(r => r && r.name === name && !r.resignDate);
    return (rec && rec.position) || '';
  },
  // 입력자 표기 = 로그인한 사용자의 "이름 호칭" (예: '김영애 실장', '이남경 팀장', '김덕수 대리')
  // 입력/저장 시 이 값을 작성자(writer)로 자동 기록 → 로그인 사용자가 바뀌면 자동으로 반영됨
  inputterLabel() {
    const s = this.current();
    if (!s || !s.name) return '';
    const rl = this.roleLabel();
    return rl ? `${s.name} ${rl}` : s.name;
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
      window.MOCK.role = AUTH.roleLabel();
    }
    return true;
  }

  loginEl.style.display = 'flex';
  appEl.style.display = 'none';
  tabbar.style.display = 'none';
  return false;
}

// 로그인 폼 제출은 firebase.js에서 실제 계정(PIN) 검증과 함께 처리합니다.
