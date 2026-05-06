// 머니플로우 — Demo auth (frontend-only, localStorage)
// Real backend can be added later by replacing checkLogin / saveSession.

const AUTH_KEY = 'mf_auth_v1';

window.AUTH = {
  current() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
  },
  login(name, pin) {
    if (!name) return false;
    const session = { name: name.trim(), pin: pin || '0000', loggedAt: Date.now() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  },
  loginDemo() {
    return this.login('이재현', '0000');
  },
  logout() {
    localStorage.removeItem(AUTH_KEY);
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
    if (window.MOCK) window.MOCK.user = session.name;
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
      if (!name || pin.length < 4) return;
      AUTH.login(name, pin);
      bootAuth();
      if (window.navigate) window.navigate('home');
    });
  }
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      AUTH.loginDemo();
      bootAuth();
      if (window.navigate) window.navigate('home');
    });
  }
});
