// 머니플로우 — Demo auth (frontend-only, localStorage)
// Real backend can be added later by replacing checkLogin / saveSession.

const AUTH_KEY = 'mf_auth_v1';

// 권한 매트릭스 — true = 볼 수 있음
const ROLE_PERMS = {
  boss:    { fixedCost: true,  staffSalary: true,  tax: true,  top3: true,  finalProfit: true,  allSites: true,  staffMgmt: true,  csvExport: true },
  manager: { fixedCost: false, staffSalary: false, tax: true,  top3: true,  finalProfit: true,  allSites: true,  staffMgmt: false, csvExport: true },
  staff:   { fixedCost: false, staffSalary: false, tax: false, top3: false, finalProfit: false, allSites: true,  staffMgmt: false, csvExport: false },
};

const ROLE_LABEL = { boss: '대표', manager: '팀장', staff: '직원' };

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
  loginDemo(role = 'boss') {
    const names = { boss: '이재현', manager: '이남경', staff: '김덕수' };
    return this.login(names[role], '0000', role);
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
    return ROLE_LABEL[this.role()] || '직원';
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

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const demoBtn = document.getElementById('login-demo');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('login-name').value;
      const pin = document.getElementById('login-pin').value;
      const roleEl = document.querySelector('input[name="login-role"]:checked');
      const role = roleEl ? roleEl.value : 'staff';
      if (!name || pin.length < 4) return;
      AUTH.login(name, pin, role);
      bootAuth();
      if (window.navigate) window.navigate('home');
    });
  }
  document.addEventListener('click', (e) => {
    const demo = e.target.closest('[data-demo-role]');
    if (demo) {
      AUTH.loginDemo(demo.dataset.demoRole);
      bootAuth();
      if (window.navigate) window.navigate('home');
    }
  });
});
