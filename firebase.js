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
  sites: {},
  entries: {},
  pending: {},
  staffData: {},
  asData: {},
  fixedCosts: {},
  knowhow: {},
  scheduleData: {},
  photoData: {},
  connected: false,
};

// ── 유틸 ──
function encKey(s) { return s.replace(/[.#$/ \[\]]/g, '_'); }
function toToday() { return new Date().toISOString().slice(0, 10); }

// ── MOCK 데이터를 Firebase 실제 데이터로 동기화 ──
window.syncMockFromFirebase = function syncMockFromFirebase() {
  const M = window.MOCK;
  if (!M) return;

  // 현장별 합계 1회 패스 (기존 O(현장수×거래수) → O(현장수+거래수))
  const _agg = {};
  const _A = n => (_agg[n] || (_agg[n] = { rev: 0, cost: 0, as: 0 }));
  Object.values(FB.entries).forEach(e => {
    if (!e || !e.site) return;
    const a = _A(e.site);
    if (e.type === 'revenue') a.rev += e.amount || 0;
    else if (e.type === 'cost') a.cost += e.amount || 0;
    else if (e.type === 'as') a.as += e.amount || 0;
  });
  Object.values(FB.pending).forEach(p => {
    if (!p || p.status !== 'done') return;
    (p.allocations || []).forEach(al => {
      if (!al || !al.site) return;
      const a = _A(al.site);
      if (p.type === 'revenue') a.rev += al.amount || 0;
      else if (p.type === 'cost') a.cost += al.amount || 0;
      else if (p.type === 'as') a.as += al.amount || 0;
    });
  });

  // 현장 목록
  const siteArr = Object.entries(FB.sites).map(([key, s]) => {
    const _a = _agg[s.name] || { rev: 0, cost: 0, as: 0 };
    const rev = _a.rev, cost = _a.cost, as = _a.as;
    const profit = rev - cost - as;
    const margin = rev > 0 ? Math.round(profit / rev * 100) : 0;
    const statusMap = {
      consult: '상담중', contract: '계약완료', active: '공사중',
      settle: '정산중', balance: '잔금대기', done: '마감', as: 'AS관리'
    };
    return {
      id: key,
      _key: key,
      _createdAt: s.createdAt || 0,
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

  // 모든 공정 완료된 공사중 현장을 AS관리로 자동 전환
  const _procAll = FB._procAll || {};
  const _todayStr = new Date().toISOString().slice(0, 10);
  function _phSt(s, e) {
    if (!s && !e) return 'wait';
    if (s && _todayStr < s) return 'wait';
    if (e && _todayStr > e) return 'done';
    return 'active';
  }
  siteArr.forEach(site => {
    if (site.status !== '공사중') return;
    const procKey = (site.name || '').replace(/[.#$/ \[\]]/g, '_');
    const phases = Object.values(_procAll[procKey] || {});
    if (!phases.length) return;
    const allDone = phases.every(ph => _phSt(ph.startDate, ph.doneDate) === 'done');
    if (allDone) {
      site.status = 'AS관리';
      db.ref('siteInfo/' + site._key).update({ status: 'AS관리' }).catch(() => {});
    }
  });

  // 계약완료 현장 중 첫 공정이 시작됐으면 자동으로 공사중으로 전환
  // (공사일정만 잡고 상태 변경 깜빡한 경우 자동으로 따라잡아 줌)
  siteArr.forEach(site => {
    if (site.status !== '계약완료') return;
    const procKey = (site.name || '').replace(/[.#$/ \[\]]/g, '_');
    const phases = Object.values(_procAll[procKey] || {});
    if (!phases.length) return;
    // 시작일이 입력된 공정 중 가장 빠른 시작일
    const startDates = phases.map(p => p.startDate).filter(Boolean).sort();
    if (!startDates.length) return;
    if (startDates[0] <= _todayStr) {
      site.status = '공사중';
      db.ref('siteInfo/' + site._key).update({ status: '공사중' }).catch(() => {});
    }
  });

  // 다가오는 공사 — 첫 공정 시작일이 오늘 이후인 현장 (D-day 카운트다운용)
  // 공사중·계약완료 현장만 대상 (마감/AS관리/잔금대기 제외)
  const upcoming = [];
  siteArr.forEach(site => {
    if (site.status !== '공사중' && site.status !== '계약완료') return;
    const procKey = (site.name || '').replace(/[.#$/ \[\]]/g, '_');
    const phases = Object.values(_procAll[procKey] || {});
    if (!phases.length) return;
    // 시작일이 있는 공정 중 가장 빠른 것
    const startDates = phases.map(p => p.startDate).filter(Boolean).sort();
    if (!startDates.length) return;
    const firstStart = startDates[0];
    if (firstStart <= _todayStr) return; // 이미 시작했거나 오늘 시작
    // D-day 계산 (UTC 기준 일수 차)
    const t1 = Date.parse(firstStart);
    const t0 = Date.parse(_todayStr);
    const dDays = Math.round((t1 - t0) / 86400000);
    if (dDays > 21) return; // 3주 전부터만 표시 (그 이전엔 챙길 필요 없음)
    upcoming.push({
      name: site.name,
      client: site.client,
      firstStart,
      dDays,
      _key: site._key,
    });
  });
  upcoming.sort((a, b) => a.dDays - b.dDays);
  M.upcomingSites = upcoming;

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
  // 입력자 후보 — 직원 목록 + 현재 로그인한 사용자(사장은 staffData에 없을 수 있어서 안전망)
  // 역할명을 한글로 통일 ('staff' → '대리', 'manager' → '팀장', 'boss' → '대표')
  const ROLE_KR = { boss: '대표', manager: '팀장', staff: '대리' };
  function roleToKr(r) {
    if (!r) return '';
    return ROLE_KR[r] || r; // 이미 한글이거나 알 수 없는 값이면 그대로
  }
  // 이름 기준으로 중복 제거 — 같은 사람이 두 번 들어가지 않게
  const inputterByName = new Map();
  staffArr.forEach(s => {
    if (!s.name) return;
    const label = s.name + (s.role ? ' ' + roleToKr(s.role) : '');
    inputterByName.set(s.name, label);
  });
  // 로그인된 사용자도 포함 (사장이거나, staffData 등록 전이거나, 데모 로그인이거나)
  try {
    const cur = window.AUTH?.current?.();
    if (cur?.name && !inputterByName.has(cur.name)) {
      const roleLabel = window.AUTH?.roleLabel?.() || '';
      inputterByName.set(cur.name, cur.name + (roleLabel ? ' ' + roleLabel : ''));
    }
  } catch(e) {}
  M.inputters = Array.from(inputterByName.values());

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
    .map(([key, kh]) => {
      // 사진은 두 가지 저장 형식 모두 지원 (구버전/신버전 호환)
      const photosObj = kh.photos || {};
      const pPhotos = Array.isArray(kh.problemPhotos) ? kh.problemPhotos
                    : (Array.isArray(photosObj.problem) ? photosObj.problem : []);
      const sPhotos = Array.isArray(kh.solutionPhotos) ? kh.solutionPhotos
                    : (Array.isArray(photosObj.solution) ? photosObj.solution : []);
      return {
        _key: key,
        cat: kh.cat === 'mistake' ? '실수' : kh.cat === 'tip' ? '팁' : kh.cat === 'material' ? '자재' : '고객',
        _catRaw: kh.cat || '',
        title: kh.title || '',
        site: kh.site || '—',
        by: kh.writer || '',
        pinned: kh.pinned || false,
        problem: kh.problem || '',
        solution: kh.solution || '',
        problemPhotos: pPhotos,
        solutionPhotos: sPhotos,
        createdAt: kh.createdAt || 0,
      };
    });
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
  // 다가오는 공사 — D-day 카운트다운 (3주 전부터 표시, 직원들이 미리 챙기도록)
  const upcomingArr = M.upcomingSites || [];
  upcomingArr.forEach(u => {
    const dLabel = u.dDays === 0 ? 'D-day' : `D-${u.dDays}`;
    // 시급도 색상: 2일 이내 빨강(warn), 7일 이내 강조(pin), 그 이상 일반(accent)
    const color = u.dDays <= 2 ? 'warn' : (u.dDays <= 7 ? 'pin' : 'accent');
    briefing.push({
      kind: 'task',
      icon: '🚧',
      label: `${dLabel} · ${u.name} 공사 시작`,
      meta: `${u.firstStart.slice(5).replace('-', '.')} 첫 공정 시작${u.client ? ' · ' + u.client : ''}`,
      color,
    });
  });
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
  // 즉시-페인트 캐시 저장 (두 번째 접속부터 0.1초 안에 화면 표시)
  // ⚠️ base64 사진 데이터를 빼고 저장 — localStorage 5MB 한도 안 넘기게
  try {
    // tips에서 무거운 사진 필드 제거 (메타데이터만 캐시)
    const lightTips = (M.tips || []).map(t => {
      const { problemPhotos, solutionPhotos, ...rest } = t;
      return rest;
    });
    const snapshot = {
      sites: M.sites, totals: M.totals, tax: M.tax, briefing: M.briefing,
      unsorted: M.unsorted, staff: M.staff, inputters: M.inputters,
      tips: lightTips,
      upcomingSites: M.upcomingSites,
      _cachedAt: Date.now(),
    };
    const serialized = JSON.stringify(snapshot);
    localStorage.setItem('mf_snapshot', serialized);
    // 디버깅용 (콘솔에서 캐시 크기 확인 가능)
    if (window._cacheDebug) console.log(`[캐시 저장] ${(serialized.length / 1024).toFixed(1)}KB`);
  } catch (e) {
    // localStorage 용량 초과 등 — 다음 접속에 캐시 효과 없음
    console.warn('[캐시 저장 실패]', e.message, '— 다음 접속에 즉시 페인트가 작동 안 할 수 있어요');
    try { localStorage.removeItem('mf_snapshot'); } catch(e2) {}
  }
}

function formatWhen(dateStr) {
  if (!dateStr) return '';
  const today = toToday();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return '오늘';
  if (dateStr === yesterday) return '어제';
  return dateStr.slice(5).replace('-', '/');
}

// ── 거래 사진 로드 (entryPhotos 우선, 옛 entries 내장은 폴백 + 자동 분리) ──
window.loadEntryPhotos = async function(key, entry) {
  entry = entry || {};
  const embedded = [];
  if (entry.imageBase64) embedded.push(entry.imageBase64);
  if (Array.isArray(entry.extraPhotos)) entry.extraPhotos.forEach(p => { if (p) embedded.push(p); });
  if (embedded.length) {
    try {
      await db.ref('entryPhotos/' + key).set({ photos: embedded });
      await db.ref('entries/' + key).update({ imageBase64: null, extraPhotos: null, photoCount: embedded.length, hasPhoto: true });
    } catch (e) {}
    return embedded;
  }
  try {
    const snap = await db.ref('entryPhotos/' + key).once('value');
    const v = snap.val();
    return (v && Array.isArray(v.photos)) ? v.photos : [];
  } catch (e) { return []; }
};

// ── 1회 마이그레이션: 기존 entries 내장 사진을 entryPhotos로 분리 (안전·재실행 가능) ──
window.migrateEntryPhotos = async function(onProgress) {
  const all = FB.entries || {};
  const keys = Object.keys(all).filter(k => {
    const e = all[k] || {};
    return e.imageBase64 || (Array.isArray(e.extraPhotos) && e.extraPhotos.length);
  });
  let done = 0;
  for (const k of keys) {
    const e = all[k] || {};
    const photos = [];
    if (e.imageBase64) photos.push(e.imageBase64);
    if (Array.isArray(e.extraPhotos)) e.extraPhotos.forEach(p => { if (p) photos.push(p); });
    try {
      if (photos.length) await db.ref('entryPhotos/' + k).set({ photos });
      await db.ref('entries/' + k).update({ imageBase64: null, extraPhotos: null, photoCount: photos.length, hasPhoto: photos.length > 0 });
    } catch (err) {}
    done++;
    if (onProgress) onProgress(done, keys.length);
  }
  return { migrated: done, total: keys.length };
};

window.runPhotoMigration = async function(btn) {
  if (!window.migrateEntryPhotos) return;
  const all = FB.entries || {};
  const pending = Object.keys(all).filter(k => { const e = all[k] || {}; return e.imageBase64 || (Array.isArray(e.extraPhotos) && e.extraPhotos.length); }).length;
  if (pending === 0) { alert('이미 최적화되어 있어요. 옮길 사진이 없습니다.'); return; }
  if (!confirm(pending + '건의 거래 사진을 분리합니다. 잠시 걸릴 수 있어요. 진행할까요?')) return;
  if (btn) btn.disabled = true;
  try {
    const r = await window.migrateEntryPhotos((d, t) => { if (btn) btn.textContent = '이전 중… ' + d + '/' + t; });
    alert('완료! ' + r.migrated + '건 정리했습니다. 화면이 한층 빨라집니다.');
  } catch (e) {
    alert('일부만 처리됐을 수 있어요. 버튼을 다시 눌러 이어서 진행하세요.');
  }
  if (btn) { btn.disabled = false; btn.textContent = '⚡ 사진 저장방식 최적화 (1회 실행)'; }
};

// ── 기본 공정 일괄 등록 (신규 현장 등록 시 / 빈 현장 채울 때) ──
window.seedDefaultPhases = async function(siteName) {
  const list = (window.MOCK && window.MOCK.defaultSitePhases) || [];
  if (!list.length) return;
  const procKey = (siteName || '').replace(/[.#$/ \[\]]/g, '_');
  let maxOrder = 0;
  try {
    const snap = await db.ref('procData/' + procKey).once('value');
    Object.values(snap.val() || {}).forEach(p => { if (p && (p.order || 0) > maxOrder) maxOrder = p.order; });
  } catch (e) {}
  const tasks = list.map((name, i) => db.ref('procData/' + procKey).push({
    name, status: 'wait', startDate: null, doneDate: null, order: maxOrder + i + 1,
  }));
  await Promise.all(tasks);
};

// ── Firebase 리스너 초기화 ──
function initFirebase() {
  // 연결 상태
  db.ref('.info/connected').on('value', snap => {
    FB.connected = !!snap.val();
    updateConnStatus();
  });

  // 핵심 데이터 — 실시간 리스너로 한 번만 로드 + 변경 감지
  // (.once() 중복 다운로드 제거: 무거운 entries 노드를 두 번 받지 않음)
  db.ref('siteInfo').on('value', snap => { FB.sites = snap.val() || {}; onDataChange(); });
  db.ref('entries').on('value', snap => { FB.entries = snap.val() || {}; onDataChange(); });
  db.ref('pending').on('value', snap => { FB.pending = snap.val() || {}; onDataChange(); });
  db.ref('staffData').on('value', snap => { FB.staffData = snap.val() || {}; onDataChange(); });
  db.ref('asData').on('value', snap => { FB.asData = snap.val() || {}; onDataChange(); });
  db.ref('fixedCosts').on('value', snap => { FB.fixedCosts = snap.val() || {}; onDataChange(); });
  db.ref('knowhow').on('value', snap => { FB.knowhow = snap.val() || {}; onDataChange(); });
  db.ref('scheduleData').on('value', snap => { FB.scheduleData = snap.val() || {}; onDataChange(); });

  // procData 대량 캐시(_procAll) — 다른 데이터와 병렬로 즉시 로드
  // 공사진행률, 달력 등에서 사용되므로 첫 화면에 바로 필요함
  FB._procAllLoaded = false;
  window.ensureProcAll = function() {
    if (FB._procAllLoaded) return;
    FB._procAllLoaded = true;
    db.ref('procData').once('value').then(snap => {
      FB._procAll = snap.val() || {};
      onDataChange();
    });
  };
  // 다른 노드들과 동시에 즉시 시작 (setTimeout 제거 — 진행률/달력 즉시 표시)
  window.ensureProcAll();

  // photoData(사진 — 용량 큼) — 사진 페이지를 열 때만 로드
  FB._photoLoaded = false;
  window.ensurePhotoData = function() {
    if (FB._photoLoaded) return;
    FB._photoLoaded = true;
    db.ref('photoData').once('value').then(snap => {
      FB.photoData = snap.val() || {};
      onDataChange();
    });
  };
}

let _debounce = null;
function onDataChange() {
  clearTimeout(_debounce);
  _debounce = setTimeout(() => {
    window.syncMockFromFirebase();
    const page = window.currentPage || 'home';
    if (window.navigate) window.navigate(page);
  }, 100);
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
    const hasPhotoField = ('imageBase64' in data) || ('extraPhotos' in data);
    const { imageBase64, extraPhotos, ...rest } = data;
    const photos = [];
    if (imageBase64) photos.push(imageBase64);
    if (Array.isArray(extraPhotos)) extraPhotos.forEach(p => { if (p) photos.push(p); });
    if (hasPhotoField) { rest.photoCount = photos.length; rest.hasPhoto = photos.length > 0; }
    if (key) {
      await db.ref('entries/' + key).update(rest);
      if (hasPhotoField) {
        if (photos.length) await db.ref('entryPhotos/' + key).set({ photos });
        else await db.ref('entryPhotos/' + key).remove();
      }
    } else {
      const ref = db.ref('entries').push();
      await ref.set({ ...rest, createdAt: Date.now() });
      if (photos.length) await db.ref('entryPhotos/' + ref.key).set({ photos });
    }
  },

  // 거래 삭제
  async deleteEntry(key) {
    await db.ref('entries/' + key).remove();
    db.ref('entryPhotos/' + key).remove();
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
    const _pend = FB.pending[key] || {};
    const _pendPhotos = [];
    if (_pend.imageBase64) _pendPhotos.push(_pend.imageBase64);
    if (Array.isArray(_pend.extraPhotos)) _pend.extraPhotos.forEach(p => { if (p) _pendPhotos.push(p); });
    allocations.forEach(a => {
      const ref = db.ref('entries').push();
      batch.push(ref.set({
        type: updates.type, site: a.site, amount: a.amount,
        date: _pend.date || toToday(),
        process: updates.process || '',
        writer: _pend.writer || '',
        fromPending: key,
        photoCount: _pendPhotos.length,
        hasPhoto: _pendPhotos.length > 0,
        createdAt: Date.now(),
      }));
      if (_pendPhotos.length) batch.push(db.ref('entryPhotos/' + ref.key).set({ photos: _pendPhotos }));
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
    try {
      const snap = JSON.parse(localStorage.getItem('mf_snapshot') || 'null');
      // 24시간 지난 캐시는 무시 (혼란 방지)
      const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;
      const isFresh = snap && snap._cachedAt && (Date.now() - snap._cachedAt < MAX_CACHE_AGE);
      if (isFresh && window.MOCK) {
        Object.assign(window.MOCK, snap);
        if (window.navigate) window.navigate(window.currentPage || 'home');
        const ls = document.getElementById('loading-screen');
        if (ls) ls.style.display = 'none';
        if (window._cacheDebug) {
          const ageMin = Math.round((Date.now() - snap._cachedAt) / 60000);
          console.log(`[캐시 복원] ${ageMin}분 전 데이터로 즉시 표시`);
        }
      } else if (snap && !isFresh) {
        // 오래된 캐시는 삭제
        try { localStorage.removeItem('mf_snapshot'); } catch(e2) {}
      }
    } catch (e) {
      console.warn('[캐시 복원 실패]', e.message);
    }
    initFirebase();
  }
  return result;
};
