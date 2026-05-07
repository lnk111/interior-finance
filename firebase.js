// 머니플로우 — Firebase 실제 데이터 연동
// data.js의 MOCK 데이터를 Firebase 실제 데이터로 교체

const firebaseConfig = {
  apiKey: "AIzaSyC3ePaFaHhNKLiKBmkEuAGMmHc3aqOxUEM",
  authDomain: "design-for-money-flow.firebaseapp.com",
  databaseURL: "https://design-for-money-flow-default-rtdb.firebaseio.com",
  projectId: "design-for-money-flow",
  storageBucket: "design-for-money-flow.appspot.com",
  messagingSenderId: "567890123456",
  appId: "1:567890123456:web:abcdef1234567890"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ── 전역 상태 ──
window.FB = {
  sites: {},       // siteInfo
  entries: {},     // entries
  pending: {},     // pending
  staffData: {},   // staffData
  asData: {},      // asData
  fixedCosts: {},  // fixedCosts
  knowhow: {},     // knowhow
  scheduleData: {},// scheduleData
  connected: false,
};

// ── 유틸 ──
function encKey(s) { return s.replace(/[.#$/ \[\]]/g, '_'); }
function toToday() { return new Date().toISOString().slice(0, 10); }

// ── MOCK 데이터를 Firebase 실제 데이터로 동기화 ──
window.syncMockFromFirebase = function syncMockFromFirebase() {
  const M = window.MOCK;
  if (!M) return;

  // 현장 목록
  const siteArr = Object.entries(FB.sites).map(([key, s]) => {
    let rev = 0, cost = 0, as = 0;
    Object.values(FB.entries).forEach(e => {
      if (e.site !== s.name) return;
      if (e.type === 'revenue') rev += e.amount || 0;
      else if (e.type === 'cost') cost += e.amount || 0;
      else if (e.type === 'as') as += e.amount || 0;
    });
    // 완료된 미정리 내역도 포함
    Object.values(FB.pending).forEach(p => {
      if (p.status !== 'done') return;
      (p.allocations || []).forEach(a => {
        if (a.site !== s.name) return;
        if (p.type === 'revenue') rev += a.amount || 0;
        else if (p.type === 'cost') cost += a.amount || 0;
        else if (p.type === 'as') as += a.amount || 0;
      });
    });
    const profit = rev - cost - as;
    const margin = rev > 0 ? Math.round(profit / rev * 100) : 0;
    const statusMap = {
      consult: '상담중', contract: '계약완료', active: '공사중',
      settle: '정산중', balance: '잔금대기', done: '마감', as: 'AS관리'
    };
    return {
      id: key,
      _key: key,
      name: s.name || '',
      client: s.client || '',
      status: statusMap[s.status] || s.status || '상담중',
      start: s.year && s.month ? `${s.year}.${String(s.month).padStart(2,'0')}` : '—',
      end: '—',
      revenue: rev,
      cost: cost,
      profit: profit,
      margin: margin,
      progress: 0,
      phase: '',
    };
  });
  M.sites = siteArr;

  // 총합 계산
  let totalRev = 0, totalCost = 0, totalAs = 0;
  Object.values(FB.entries).forEach(e => {
    if (e.type === 'revenue') totalRev += e.amount || 0;
    else if (e.type === 'cost') totalCost += e.amount || 0;
    else if (e.type === 'as') totalAs += e.amount || 0;
  });
  Object.values(FB.pending).forEach(p => {
    if (p.status !== 'done') return;
    (p.allocations || []).forEach(a => {
      if (p.type === 'revenue') totalRev += a.amount || 0;
      else if (p.type === 'cost') totalCost += a.amount || 0;
      else if (p.type === 'as') totalAs += a.amount || 0;
    });
  });
  const siteProfit = totalRev - totalCost - totalAs;
  const margin = totalRev > 0 ? Math.round(siteProfit / totalRev * 100) : 0;

  // 현재 월 고정비
  const now = new Date();
  const ymKey = encKey(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`);
  const fc = FB.fixedCosts[ymKey] || {};
  const fixed = (fc.salary||0) + (fc.rent||0) + (fc.marketing||0) + (fc.mgmt||0) + (fc.card||0) + (fc.etc||0);
  const vat = Math.round(totalRev * 0.1);
  const finalProfit = siteProfit - fixed - vat;

  M.totals = {
    revenue: totalRev,
    cost: totalCost,
    siteProfit: siteProfit,
    fixed: fixed,
    finalProfit: finalProfit,
    vat: vat,
    margin: margin,
    targetMargin: 25,
  };

  // 최근 거래
  const entryArr = Object.entries(FB.entries)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .slice(0, 7)
    .map(([key, e]) => ({
      id: key,
      _key: key,
      kind: e.type === 'revenue' ? '매출' : e.type === 'cost' ? '매입' : 'AS',
      site: e.site || '',
      stage: e.payStage || '',
      phase: e.process || '',
      amount: e.amount || 0,
      when: formatWhen(e.date),
      invoice: e.taxInvoice || false,
      pay: e.payMethod || '',
    }));
  M.recent = entryArr;

  // AS 목록
  const asArr = Object.entries(FB.asData)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .map(([key, a]) => ({
      id: key,
      _key: key,
      site: a.site || '',
      client: a.phone || '',
      phone: a.phone || '',
      issue: a.content || '',
      staff: a.manager || '',
      date: a.date || '',
      status: a.done ? '완료' : '예정',
      cost: 0,
    }));
  M.asList = asArr;

  // 직원 목록
  const staffArr = Object.entries(FB.staffData)
    .filter(([, s]) => !s.resignDate)
    .map(([key, s]) => ({
      name: s.name || '',
      role: s.role || '',
      joined: s.joinDate ? s.joinDate.replace(/-/g, '.') : '',
      salary: s.salary || 0,
      status: '재직중',
    }));
  M.staff = staffArr;
  M.inputters = staffArr.map(s => s.name + (s.role ? ' ' + s.role : ''));

  // 미정리 수
  M.unsorted = Object.values(FB.pending).filter(p => p.status !== 'done').length;

  // 부가세 정보
  const curQ = Math.ceil((now.getMonth()+1) / 3);
  const yr = now.getFullYear();
  const qDeadlines = [
    { q: 1, dd: `${yr}-04-25`, deadline: '4월 25일' },
    { q: 2, dd: `${yr}-07-25`, deadline: '7월 25일' },
    { q: 3, dd: `${yr}-10-25`, deadline: '10월 25일' },
    { q: 4, dd: `${yr+1}-01-25`, deadline: '내년 1/25' },
  ];
  const ci = qDeadlines[curQ - 1];
  const daysLeft = Math.ceil((new Date(ci.dd) - new Date().setHours(0,0,0,0)) / 86400000);
  let taxableRev = 0, invoiceCount = 0;
  Object.values(FB.entries).forEach(e => {
    if (e.type === 'revenue' && e.taxInvoice && e.date && e.date.startsWith(String(yr))) {
      const q = Math.ceil(parseInt(e.date.slice(5,7)) / 3);
      if (q === curQ) { taxableRev += e.amount || 0; invoiceCount++; }
    }
  });
  M.tax = {
    vatPayable: Math.round(taxableRev * 0.1),
    daysLeft: Math.max(0, daysLeft),
    nextDue: ci.dd.replace(/-/g, '.'),
    taxableRevenue: taxableRev,
    invoiceCount: invoiceCount,
    quarters: qDeadlines.map(info => {
      let qRev = 0, qVat = 0;
      Object.values(FB.entries).forEach(e => {
        if (e.type==='revenue' && e.taxInvoice && e.date?.startsWith(String(yr))) {
          if (Math.ceil(parseInt(e.date.slice(5,7))/3) === info.q) qRev += e.amount||0;
        }
      });
      qVat = Math.round(qRev * 0.1);
      const isPast = info.q < curQ;
      const isFuture = info.q > curQ;
      return {
        q: `${yr} ${info.q}기`,
        revenue: qRev,
        vat: qVat,
        status: isFuture ? 'future' : isPast ? 'paid' : 'pending',
      };
    }),
  };

  // 노하우
  const khArr = Object.entries(FB.knowhow)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0))
    .map(([key, kh]) => ({
      cat: kh.cat === 'mistake' ? '실수' : kh.cat === 'tip' ? '팁' : kh.cat === 'material' ? '자재' : '고객',
      title: kh.title || '',
      site: kh.site || '—',
      by: kh.writer || '',
      pinned: kh.pinned || false,
    }));
  M.tips = khArr;

  // 회사명 & 사용자명
  const session = AUTH.current();
  if (session) {
    M.user = session.name;
    M.role = AUTH.roleLabel();
  }

  // 브리핑 — 오늘의 주요 이슈
  const briefing = [];
  // 미정리 건수
  if (M.unsorted > 0) {
    briefing.push({ kind: 'task', icon: '📋', label: `미정리 ${M.unsorted}건 정리 필요`, meta: '지금 바로 정리하세요', color: 'warn' });
  }
  // 미처리 AS
  const pendingAs = asArr.filter(a => a.status !== '완료').length;
  if (pendingAs > 0) {
    briefing.push({ kind: 'as', icon: '🔧', label: `AS 미처리 ${pendingAs}건`, meta: 'AS 탭에서 확인', color: 'pin' });
  }
  // 공사중 현장
  const activeSites = siteArr.filter(s => s.status === '공사중');
  if (activeSites.length > 0) {
    briefing.push({ kind: 'task', icon: '🔨', label: `공사중 ${activeSites.length}개 현장`, meta: activeSites[0]?.name || '', color: 'warn' });
  }
  // 잔금 대기
  const balanceSites = siteArr.filter(s => s.status === '잔금대기');
  if (balanceSites.length > 0) {
    briefing.push({ kind: 'pay', icon: '₩', label: `잔금 대기 ${balanceSites.length}개 현장`, meta: balanceSites[0]?.name || '', color: 'accent' });
  }
  if (briefing.length === 0) {
    briefing.push({ kind: 'task', icon: '✅', label: '오늘은 처리할 일이 없어요', meta: '좋은 하루 되세요!', color: 'accent' });
  }
  M.briefing = briefing;
}

function formatWhen(dateStr) {
  if (!dateStr) return '';
  const today = toToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return '오늘';
  if (dateStr === yesterday) return '어제';
  return dateStr.slice(5).replace('-', '/');
}

// ── Firebase 리스너 초기화 ──
function initFirebase() {
  // 연결 상태
  db.ref('.info/connected').on('value', snap => {
    FB.connected = !!snap.val();
    updateConnStatus();
  });

  // 현장 정보
  db.ref('siteInfo').on('value', snap => {
    FB.sites = snap.val() || {};
    // 모든 현장 procData 한번에 로드
    db.ref('procData').once('value').then(procSnap => {
      if (!window.FB) window.FB = {};
      window.FB._procAll = procSnap.val() || {};
      onDataChange();
    });
    onDataChange();
  });

  // 거래 내역
  db.ref('entries').on('value', snap => {
    FB.entries = snap.val() || {};
    onDataChange();
  });

  // 미정리
  db.ref('pending').on('value', snap => {
    FB.pending = snap.val() || {};
    onDataChange();
  });

  // 직원
  db.ref('staffData').on('value', snap => {
    FB.staffData = snap.val() || {};
    onDataChange();
  });

  // AS 데이터
  db.ref('asData').on('value', snap => {
    FB.asData = snap.val() || {};
    onDataChange();
  });

  // 고정비
  db.ref('fixedCosts').on('value', snap => {
    FB.fixedCosts = snap.val() || {};
    onDataChange();
  });

  // 노하우
  db.ref('knowhow').on('value', snap => {
    FB.knowhow = snap.val() || {};
    onDataChange();
  });

  // 일정
  db.ref('scheduleData').on('value', snap => {
    FB.scheduleData = snap.val() || {};
    onDataChange();
  });
}

let _debounce = null;
function onDataChange() {
  clearTimeout(_debounce);
  _debounce = setTimeout(() => {
    window.syncMockFromFirebase();
    // 현재 페이지 재렌더
    const page = window.currentPage || 'home';
    if (window.navigate) {
      window.navigate(page);
    }
  }, 300);
}

function updateConnStatus() {
  // 연결 상태 표시 (앱에 conn 요소가 있으면 업데이트)
  const connEls = document.querySelectorAll('.conn-status');
  connEls.forEach(el => {
    el.textContent = FB.connected ? '🟢 연결됨' : '🔴 오프라인';
  });
}

// ── 거래 저장 (app.js에서 호출) ──
window.FB_API = {
  // 현장 등록/수정
  async saveSite(data, key = null) {
    if (key) {
      await db.ref('siteInfo/' + key).update(data);
    } else {
      await db.ref('siteInfo').push({ ...data, createdAt: Date.now() });
    }
  },

  // 거래 저장
  async saveEntry(data, key = null) {
    if (key) {
      await db.ref('entries/' + key).update(data);
    } else {
      await db.ref('entries').push({ ...data, createdAt: Date.now() });
    }
  },

  // 거래 삭제
  async deleteEntry(key) {
    await db.ref('entries/' + key).remove();
  },

  // 빠른기록 저장
  async savePending(data) {
    await db.ref('pending').push({ ...data, createdAt: Date.now(), status: 'temp' });
  },

  // 미정리 완료처리
  async completePending(key, updates, allocations) {
    const batch = [];
    batch.push(db.ref('pending/' + key).update({
      ...updates, status: 'done', completedAt: Date.now()
    }));
    allocations.forEach(a => {
      batch.push(db.ref('entries').push({
        type: updates.type, site: a.site, amount: a.amount,
        date: FB.pending[key]?.date || toToday(),
        process: updates.process || '',
        writer: FB.pending[key]?.writer || '',
        fromPending: key,
        imageBase64: FB.pending[key]?.imageBase64 || null,
        createdAt: Date.now(),
      }));
    });
    await Promise.all(batch);
  },

  // AS 저장
  async saveAs(data, key = null) {
    if (key) {
      await db.ref('asData/' + key).update(data);
    } else {
      await db.ref('asData').push({ ...data, done: false, createdAt: Date.now() });
    }
  },

  // AS 완료
  async completeAs(key) {
    await db.ref('asData/' + key).update({ done: true, doneAt: Date.now() });
  },

  // AS 삭제
  async deleteAs(key) {
    await db.ref('asData/' + key).remove();
  },

  // 고정비 저장
  async saveFixedCosts(ym, data) {
    await db.ref('fixedCosts/' + encKey(ym)).set(data);
  },

  // 직원 저장
  async saveStaff(data, key = null) {
    if (key) {
      await db.ref('staffData/' + key).update(data);
    } else {
      await db.ref('staffData').push(data);
    }
  },

  // 노하우 저장
  async saveKnowhow(data, key = null) {
    if (key) {
      await db.ref('knowhow/' + key).update(data);
    } else {
      await db.ref('knowhow').push({ ...data, createdAt: Date.now() });
    }
  },

  // 일정 저장
  async saveSchedule(data, key = null) {
    if (key) {
      await db.ref('scheduleData/' + key).update(data);
    } else {
      await db.ref('scheduleData').push({ ...data, createdAt: Date.now() });
    }
  },

  // 일정 삭제
  async deleteSchedule(key) {
    await db.ref('scheduleData/' + key).remove();
  },

  // 현장명 일괄 변경
  async renameSite(oldName, newName, siteKey) {
    const updates = {};
    Object.entries(FB.entries).forEach(([k, e]) => {
      if (e.site === oldName) updates['entries/' + k + '/site'] = newName;
    });
    Object.entries(FB.pending).forEach(([k, p]) => {
      if (p.site === oldName) updates['pending/' + k + '/site'] = newName;
      (p.allocations || []).forEach((a, i) => {
        if (a.site === oldName) updates['pending/' + k + '/allocations/' + i + '/site'] = newName;
      });
    });
    const oldKey = encKey(oldName), newKey = encKey(newName);
    if (oldKey !== newKey) {
      const procSnap = await db.ref('procData/' + oldKey).once('value');
      const procData = procSnap.val();
      if (procData) { updates['procData/' + newKey] = procData; updates['procData/' + oldKey] = null; }
    }
    if (Object.keys(updates).length > 0) await db.ref('/').update(updates);
  },

  // 공정 데이터
  async getProc(siteName) {
    const snap = await db.ref('procData/' + encKey(siteName)).once('value');
    return snap.val() || {};
  },

  async saveProc(siteName, updates) {
    await db.ref('procData/' + encKey(siteName)).update(updates);
  },

  async deleteProcPhase(siteName, phaseKey) {
    await db.ref('procData/' + encKey(siteName) + '/' + phaseKey).remove();
  },

  // 보스 계정 확인 (PIN 검증)
  async checkBossPin(name, pin) {
    const snap = await db.ref('bossAccount').once('value');
    const boss = snap.val();
    return boss && boss.pin === pin && boss.name === name;
  },

  // 직원 PIN 검증
  async checkStaffPin(name, pin) {
    const snap = await db.ref('staffData').once('value');
    const staffData = snap.val() || {};
    return Object.values(staffData).find(s => s.name === name && s.pin === pin && !s.resignDate);
  },
};

// auth.js 로그인을 Firebase PIN 검증으로 교체
window._originalBootAuth = window.bootAuth;
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  // 기존 이벤트 제거 후 새로 등록
  const newForm = form.cloneNode(true);
  form.parentNode.replaceChild(newForm, form);

  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('login-name').value.trim();
    const pin = document.getElementById('login-pin').value;
    const roleEl = document.querySelector('input[name="login-role"]:checked');
    const selectedRole = roleEl ? roleEl.value : 'staff';

    if (!name || pin.length < 4) {
      alert('이름과 PIN 4자리를 입력해주세요.');
      return;
    }

    const btn = newForm.querySelector('button[type=submit]');
    if (btn) { btn.disabled = true; btn.textContent = '확인 중...'; }

    try {
      // 보스 체크
      const isBoss = await FB_API.checkBossPin(name, pin);
      if (isBoss) {
        AUTH.login(name, pin, 'boss');
        bootAuth();
        if (window.navigate) window.navigate('home');
        return;
      }
      // 직원 체크
      const staff = await FB_API.checkStaffPin(name, pin);
      if (staff) {
        const role = staff.role || 'staff';
        AUTH.login(name, pin, role);
        bootAuth();
        if (window.navigate) window.navigate('home');
        return;
      }
      alert('이름 또는 PIN이 올바르지 않아요.');
    } catch (err) {
      // Firebase 연결 실패 시 기존 PIN(3073/1212)으로 fallback
      if (pin === '3073') { AUTH.login(name, pin, 'boss'); bootAuth(); if (window.navigate) window.navigate('home'); return; }
      if (pin === '1212') { AUTH.login(name, pin, 'staff'); bootAuth(); if (window.navigate) window.navigate('home'); return; }
      alert('연결 오류. 잠시 후 다시 시도해주세요.');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '로그인'; }
    }
  });
});

// 앱 초기화 시 Firebase 시작
const _origBootAuth = window.bootAuth;
window.bootAuth = function() {
  const result = _origBootAuth ? _origBootAuth() : false;
  if (result) {
    initFirebase();
  }
  return result;
};
