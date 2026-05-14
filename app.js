// 머니플로우 — Main app
const M = window.MOCK;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function fmtSlim(n) {
  if (!n) return '₩0';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 100_000_000) return sign + '₩' + (a / 100_000_000).toFixed(1).replace(/\.0$/, '') + '억';
  if (a >= 10_000) return sign + '₩' + Math.round(a / 10_000).toLocaleString('ko-KR') + '만';
  return sign + '₩' + a.toLocaleString('ko-KR');
}
function fmtFull(n) { return '₩' + n.toLocaleString('ko-KR'); }

const ICON = {
  chevR: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M6 4l4 4-4 4"/></svg>',
  chevL: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg>',
  bell: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 8a5 5 0 0110 0v3l1.5 3h-13L5 11z"/><path d="M8 17a2 2 0 004 0"/></svg>',
  plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
  camera: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="5" width="16" height="12" rx="2"/><circle cx="10" cy="11" r="3"/><path d="M7 5l1-2h4l1 2"/></svg>',
  mic: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="7" y="2" width="6" height="10" rx="3"/><path d="M4 10a6 6 0 0012 0M10 16v3"/></svg>',
  search: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>',
};

function ymRow(year, month) {
  const years = [2024, 2025, 2026, 2027];
  const yh = years.map(y => `<option ${y === year ? 'selected' : ''}>${y}</option>`).join('');
  const mh = [...Array(12)].map((_, i) => `<option ${i + 1 === month ? 'selected' : ''}>${i + 1}월</option>`).join('');
  return `<div class="ym-selects"><select class="ym-sel">${yh}</select><select class="ym-sel">${mh}</select></div>`;
}

// ===== HOME =====
function renderHome() {
  const t = M.totals;
  const now = new Date();

  const briefingHtml = M.briefing.map(b => {
    const clickAction = b.kind === 'as'
      ? `onclick="navigate('home');setTimeout(()=>switchSiteTab('as'),100)"`
      : b.kind === 'task' ? `onclick="navigate('sites')"`
      : b.kind === 'pay'  ? `onclick="navigate('sites')"`
      : b.kind === 'cal'  ? `onclick="navigate('calendar')"`
      : b.kind === 'unsorted' ? `onclick="openPendingList()"` : '';
    return `
    <div class="briefing-item" style="cursor:pointer;" ${clickAction}>
      <div class="dot" style="background:var(--${b.color}-soft);color:var(--${b.color});">${b.icon}</div>
      <div><div class="label">${b.label}</div><div class="meta">${b.meta}</div></div>
      <span style="color:var(--muted);font-size:16px;">›</span>
    </div>`;
  }).join('');

  const recentHtml = M.recent.slice(0, 5).map(r => {
    const cls = r.kind === '매출' ? 'pill-accent' : r.kind === 'AS' ? 'pill-pin' : 'pill-warn';
    const sign = r.kind === '매출' ? '+' : '−';
    return `
      <button class="list-row" onclick="modalTxEdit('${r._key||r.id||''}')" style="width:100%;text-align:left;">
        <span class="pill ${cls}">${r.kind}</span>
        <div><div class="lr-title">${r.site}</div><div class="lr-meta">${r.stage||r.phase||''} · ${r.pay||''} · ${r.when||''}</div></div>
        <span class="lr-amount num">${sign}${fmtSlim(r.amount)}</span>
      </button>`;
  }).join('');

  const pinnedTips = M.tips.filter(t => t.pinned);
  const otherTips  = M.tips.filter(t => !t.pinned).slice(0, 2);
  const tipCard = tp => {
    const cls = tp.cat==='실수'?'pill-warn':tp.cat==='팁'?'pill-accent':tp.cat==='자재'?'pill-pin':'pill-info';
    const ic  = tp.cat==='실수'?'😓':tp.cat==='팁'?'💡':tp.cat==='자재'?'🔩':'🤝';
    return `<div class="tip-card ${tp.pinned?'pinned':''}">
      <div class="tip-head"><span class="pill ${cls}">${ic} ${tp.cat}</span><span class="tip-meta">${tp.by} · ${tp.site}</span></div>
      <div class="tip-title">${tp.title}</div></div>`;
  };

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">${now.getFullYear()}년 ${now.getMonth()+1}월 · ${M.company}</div>
        <h1 class="h-title">안녕하세요, ${M.user} ${M.role}님</h1>
      </div>
      <button class="btn-icon">${ICON.bell}</button>
    </div>
    <div class="page-body">
      <div class="briefing">
        <div class="briefing-eyebrow">오늘의 브리핑</div>
        <div class="briefing-title">오늘 챙길 일 <span class="num">${M.briefing.length}</span>건</div>
        <div class="briefing-list">${briefingHtml}</div>
      </div>
      <div class="section-label">현장 현황 <span class="more" data-goto="sites">전체 ›</span></div>
      <div style="background:#fff;border-radius:16px;border:1px solid var(--hair);overflow:hidden;margin-bottom:16px;">
        <div style="display:flex;border-bottom:1px solid var(--hair);">
          <button id="site-tab-active" onclick="switchSiteTab('active')"
            style="flex:1;padding:12px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">
            🔨 공사중 <span style="background:rgba(255,255,255,0.3);border-radius:10px;padding:1px 7px;font-size:11px;">${(M.sites||[]).filter(s=>s.status==='공사중').length}</span>
          </button>
          <button id="site-tab-as" onclick="switchSiteTab('as')"
            style="flex:1;padding:12px;border:none;background:#fff;color:var(--muted);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">
            🔧 AS관리 <span id="as-badge" style="background:var(--warn-soft);color:var(--warn);border-radius:10px;padding:1px 7px;font-size:11px;">${(M.asList||[]).filter(a=>!a.done&&a.status!=='완료').length}</span>
          </button>
        </div>
        <div id="site-tab-content" style="padding:0;">${renderActiveSitesHtml()}</div>
      </div>
      <div class="section-label">💡 현장 노하우 <span class="more"><span data-modal="tip">+ 기록</span></span></div>
      <div class="tip-filter-row">
        <button class="filter-chip is-active">📌 핀 고정</button>
        <button class="filter-chip">전체</button>
        <button class="filter-chip">😓 실수</button>
        <button class="filter-chip">💡 팁</button>
        <button class="filter-chip">🔩 자재</button>
        <button class="filter-chip">🤝 고객</button>
      </div>
      ${pinnedTips.map(tipCard).join('')}
      ${otherTips.map(tipCard).join('')}
      <div class="section-label" style="margin-top:8px;">손익 현황
        <span class="more"><span class="pill pill-muted" style="font-size:9px;">${AUTH.roleLabel()} 모드</span></span>
      </div>
      ${ymRow(now.getFullYear(), now.getMonth()+1)}
      ${AUTH.can('finalProfit') ? `
      <div class="hero" style="margin-top:10px;">
        <div class="hero-eyebrow">🏢 이번 달 최종 영업이익</div>
        <div class="hero-amount num">${fmtSlim(t.finalProfit)}<span class="unit">원</span></div>
        <div class="hero-meta">순이익 − 고정비(임대료·급여 등) − 부가세</div>
        <div class="stack-bar">
          <span style="flex:${Math.max(t.finalProfit,1)};background:var(--accent);"></span>
          <span style="flex:${Math.max(t.fixed,1)};background:var(--faint);"></span>
          <span style="flex:${Math.max(t.vat,1)};background:var(--warn);opacity:.85;"></span>
        </div>
        <div class="stack-legend">
          <div><div class="lk"><span class="ldot" style="background:var(--accent);"></span>이익</div><span class="lv num">${fmtSlim(t.finalProfit)}</span></div>
          <div><div class="lk"><span class="ldot" style="background:var(--faint);"></span>고정비</div><span class="lv num">${fmtSlim(t.fixed)}</span></div>
          <div><div class="lk"><span class="ldot" style="background:var(--warn);"></span>부가세</div><span class="lv num">${fmtSlim(t.vat)}</span></div>
        </div>
      </div>` : ''}
      <div class="stat-row">
        <div class="stat"><div class="stat-label">총 매출</div><div class="stat-value num">${fmtSlim(t.revenue)}</div><div class="stat-delta flat">고객에게 받은 금액</div></div>
        <div class="stat"><div class="stat-label">총 매입</div><div class="stat-value num">${fmtSlim(t.cost)}</div><div class="stat-delta flat">업체에 지급한 금액</div></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat-label">현장 순이익</div><div class="stat-value num" style="color:var(--accent);">+${fmtSlim(t.siteProfit)}</div><div class="stat-delta flat">매출 − 매입 − AS</div></div>
        <div class="stat"><div class="stat-label">이익률</div><div class="stat-value num">${t.margin}%</div><div class="stat-delta flat">목표 ${t.targetMargin}%</div></div>
      </div>
      <div class="section-label">최근 거래 <span class="pill pill-warn" style="cursor:pointer;" onclick="openPendingList()">미정리 ${M.unsorted}건</span></div>
      <div class="list">${recentHtml}</div>
      ${AUTH.can('tax') ? `
      <button class="alert" data-goto="tax" style="width:100%;text-align:left;margin-top:8px;">
        <div>
          <div class="alert-eyebrow">D-${M.tax.daysLeft} · 부가세 납부</div>
          <div class="alert-amount num">${fmtSlim(M.tax.vatPayable)}</div>
          <div class="alert-meta">${M.tax.nextDue}</div>
        </div>
        <span class="alert-arrow">›</span>
      </button>` : ''}
    </div>`;
}

let _siteTab = 'active';

function renderActiveSitesHtml() {
  const activeSites = (M.sites||[]).filter(s => s.status==='공사중');
  if (!activeSites.length) return '<div class="empty" style="padding:24px;">진행중인 공사 현장이 없어요</div>';
  const todayStr = new Date().toISOString().slice(0,10);
  function calcSt(s,e) {
    if (!s&&!e) return 'wait';
    if (s&&todayStr<s) return 'wait';
    if (e&&todayStr>e) return 'done';
    return 'active';
  }
  return activeSites.map(s => {
    const key = (s.name||'').replace(/[.#$/ \[\]]/g,'_');
    const pd = window.FB?._procAll?.[key] || {};
    const phases = Object.values(pd).sort((a,b)=>(a.order||0)-(b.order||0));
    const done  = phases.filter(p=>calcSt(p.startDate,p.doneDate)==='done').length;
    const total = phases.length;
    const pct   = total>0 ? Math.round(done/total*100) : 0;
    const actPh = phases.find(p=>calcSt(p.startDate,p.doneDate)==='active');
    return `
      <div style="padding:14px 16px;border-bottom:1px solid var(--hair);cursor:pointer;"
        onclick="openSiteDetail('${s.name.replace(/'/g,"\\'")}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-size:14px;font-weight:700;">${s.name}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">${actPh?'🔨 '+actPh.name+' 진행중':s.start&&s.start!=='—'?s.start:'공정 정보 없음'}</div>
          </div>
          <span style="font-size:13px;font-weight:800;color:var(--accent);">${pct}%</span>
        </div>
        <div style="height:8px;background:var(--hair);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:4px;transition:width .4s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:8px;">
          <span style="font-size:11px;color:var(--muted);">${done}/${total} 공정 완료</span>
          <span style="font-size:11px;color:var(--accent);font-weight:700;">${s.profit>0?'+':''}${fmtSlim(s.profit)}</span>
        </div>
      </div>`;
  }).join('');
}

function renderAsSitesHtml() {
  const asData = window.FB?.asData || {};
  if (!Object.keys(asData).length) return '<div class="empty" style="padding:24px;">AS 데이터가 없어요</div>';
  const grouped = {};
  Object.entries(asData).forEach(([key,a]) => {
    const site = a.site||'현장 미지정';
    if (!grouped[site]) grouped[site]=[];
    grouped[site].push({...a,_key:key});
  });
  const sorted = Object.entries(grouped).sort((a,b)=>{
    const ap=a[1].filter(x=>!x.done).length, bp=b[1].filter(x=>!x.done).length;
    if(ap!==bp) return bp-ap;
    return Math.max(...b[1].map(x=>x.createdAt||0))-Math.max(...a[1].map(x=>x.createdAt||0));
  });
  return sorted.map(([siteName,items])=>{
    const pending=items.filter(a=>!a.done);
    const done=items.filter(a=>a.done);
    const pendHtml=pending.map(a=>`
      <div style="padding:10px 16px 10px 32px;border-bottom:1px solid var(--hair-soft);background:#fffdf8;cursor:pointer;"
        onclick="modalAS('${a._key}')">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;margin-bottom:3px;">${a.content||'내용 없음'}</div>
            <div style="font-size:11px;color:var(--muted);line-height:1.6;">
              ${a.phone&&a.phone!=='없음'?'📞 '+a.phone+'<br>':''}
              ${a.manager?'👤 '+a.manager:''}${a.worker?' · 작업자: '+a.worker:''}<br>
              📅 ${a.date==='날짜 조율중'?'🕐 날짜 조율중':(a.date||'날짜 미정')}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
            <span style="background:#fff3cd;color:#b07d00;border-radius:20px;padding:3px 8px;font-size:10px;font-weight:700;">미처리</span>
            <span style="font-size:10px;color:var(--muted);">탭하여 수정 ›</span>
          </div>
        </div>
      </div>`).join('');
    const doneHtml=done.map(a=>`
      <div style="padding:10px 16px 10px 32px;border-bottom:1px solid var(--hair-soft);background:#f8faf8;opacity:.7;cursor:pointer;"
        onclick="modalAS('${a._key}')">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;color:var(--muted);text-decoration:line-through;">${a.content||''}</div>
            <div style="font-size:11px;color:var(--muted);">${a.date||''}</div>
          </div>
          <span style="background:#e8f5e9;color:#2e7d32;border-radius:20px;padding:3px 8px;font-size:10px;font-weight:700;flex-shrink:0;">✅ 완료</span>
        </div>
      </div>`).join('');
    return `
      <div style="border-bottom:2px solid var(--hair);">
        <div style="padding:13px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:#fff;"
          onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none'">
          <div>
            <div style="font-size:14px;font-weight:700;">${siteName}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">전체 ${items.length}건 · 미처리 ${pending.length}건</div>
          </div>
          ${pending.length>0
            ?`<span style="background:#fff3cd;color:#b07d00;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;">미처리 ${pending.length}건</span>`
            :`<span style="background:#e8f5e9;color:#2e7d32;border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;">✅ 완료</span>`}
        </div>
        <div style="${pending.length>0?'':'display:none;'}">${pendHtml}${doneHtml}</div>
      </div>`;
  }).join('');
}

function switchSiteTab(tab) {
  _siteTab = tab;
  const content = document.getElementById('site-tab-content');
  const btnActive = document.getElementById('site-tab-active');
  const btnAs = document.getElementById('site-tab-as');
  if (!content||!btnActive||!btnAs) return;
  if (tab==='active') {
    btnActive.style.cssText='flex:1;padding:12px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;';
    btnAs.style.cssText='flex:1;padding:12px;border:none;background:#fff;color:var(--muted);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;';
    content.innerHTML = renderActiveSitesHtml();
  } else {
    btnAs.style.cssText='flex:1;padding:12px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;';
    btnActive.style.cssText='flex:1;padding:12px;border:none;background:#fff;color:var(--muted);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;';
    content.innerHTML = renderAsSitesHtml();
  }
}

function openSiteDetail(siteName) {
  const found = (window.MOCK?.sites||[]).find(s=>s.name===siteName);
  if (found) window.MOCK.sites = [found, ...(window.MOCK.sites.filter(s=>s.name!==siteName))];
  const key = siteName.replace(/[.#$/ \[\]]/g,'_');
  db.ref('procData/'+key).once('value').then(snap=>{
    if (!window.FB) window.FB={};
    if (!window.FB._procAll) window.FB._procAll={};
    window.FB._procAll[key] = snap.val()||{};
    window._procCache = snap.val()||{};
    navigate('siteDetail');
  }).catch(()=>navigate('siteDetail'));
}

// ===== INPUT =====
let inputState = {
  step:1, tab:'매입', mode:'detail', stage:'', payMethod:'계좌이체',
  phase:'', amount:'', invoice:true, inputter:'', site:'', memo:'', date:'',
};
function resetInputFlow() {
  inputState.step = 1;
  inputState.tab = '매입';
  inputState.stage = '';
  inputState.phase = '';
  inputState.amount = '';
  inputState.payMethod = '계좌이체';
  inputState.invoice = true;
  inputState.inputter = '';
  inputState.site = '';
  inputState.memo = '';
  inputState.date = '';
  window._entryPhotos = [];
}

function getRecentSites() {
  try { return JSON.parse(localStorage.getItem('recent_sites')||'[]'); } catch { return []; }
}
function addRecentSite(name) {
  let arr = getRecentSites().filter(s=>s!==name);
  arr.unshift(name);
  localStorage.setItem('recent_sites', JSON.stringify(arr.slice(0,5)));
}

async function submitEntry() {
  const st = inputState;
  const site = (st.site || '').trim();
  const amount = parseInt(String(st.amount || '').replace(/[^0-9]/g,'')) || 0;
  const dateInp = document.getElementById('iflow-date');
  const date = (dateInp && dateInp.value) || st.date || new Date().toISOString().slice(0,10);
  const memoInp = document.getElementById('iflow-memo');
  const memo = (memoInp && memoInp.value.trim()) || st.memo || '';
  const writer = st.inputter || AUTH.current()?.name || '';
  if (!site)   { alert('현장을 선택해주세요'); return; }
  if (!amount) { alert('금액을 입력해주세요'); return; }
  const entry = {
    type: st.tab==='매출'?'revenue':st.tab==='AS'?'as':'cost',
    site, amount, date,
    process: st.tab==='매출' ? '' : (st.phase||''),
    memo, writer,
    payMethod: st.payMethod||'',
    payStage: st.tab==='매출' ? (st.stage||'') : '',
    taxInvoice: !!st.invoice && st.tab==='매출',
    imageBase64: window._entryPhotos?.[0]||null,
    extraPhotos: window._entryPhotos?.slice(1)||[],
  };
  const btn = document.querySelector('[data-iact="submit"]');
  if (btn) { btn.disabled=true; btn.textContent='저장 중...'; }
  try {
    await window.FB_API.saveEntry(entry);
    if (site) addRecentSite(site);
    resetInputFlow();
    navigate('input');
    setTimeout(()=>alert('✅ 저장 완료!'),100);
  } catch(e) {
    alert('저장 실패. 다시 시도해주세요.');
    if (btn) { btn.disabled=false; btn.textContent='✅ 저장하기'; }
  }
}

function openSiteDropdown() {
  const dd = document.getElementById('site-dropdown');
  if (!dd) return;
  dd.style.display='block';
  filterSiteDropdown(document.getElementById('site-input')?.value||'');
}
function closeSiteDropdown() {
  const dd = document.getElementById('site-dropdown');
  if (dd) dd.style.display='none';
}
function filterSiteDropdown(query) {
  const dd = document.getElementById('site-dropdown-list');
  if (!dd) return;
  const allSites = (M.sites||[]).map(s=>s.name);
  const recent = getRecentSites().filter(s=>allSites.includes(s));
  const q = query.trim().toLowerCase();
  let html='';
  const rF = recent.filter(s=>!q||s.toLowerCase().includes(q));
  if (rF.length) {
    html+=`<div style="padding:6px 12px;font-size:11px;font-weight:700;color:var(--muted);background:var(--surface-2);">🕐 최근 선택</div>`;
    html+=rF.map(s=>`<div onclick="selectSite('${s.replace(/'/g,"\\'")}');event.stopPropagation();"
      style="padding:12px 16px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--hair-soft);"
      onmousedown="event.preventDefault()">${s}</div>`).join('');
  }
  const others = allSites.filter(s=>!recent.includes(s)&&(!q||s.toLowerCase().includes(q)));
  if (others.length) {
    html+=`<div style="padding:6px 12px;font-size:11px;font-weight:700;color:var(--muted);background:var(--surface-2);">전체 현장</div>`;
    html+=others.map(s=>`<div onclick="selectSite('${s.replace(/'/g,"\\'")}');event.stopPropagation();"
      style="padding:12px 16px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--hair-soft);"
      onmousedown="event.preventDefault()">${s}</div>`).join('');
  }
  if (!html) html=`<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">검색 결과 없음</div>`;
  dd.innerHTML=html;
  document.getElementById('site-dropdown').style.display='block';
}
function selectSite(name) {
  inputState.site=name; addRecentSite(name);
  const inp=document.getElementById('site-input');
  if (inp) inp.value=name;
  closeSiteDropdown();
}
document.addEventListener('click',e=>{
  const inp=document.getElementById('site-input');
  const dd=document.getElementById('site-dropdown');
  if (dd&&inp&&!inp.contains(e.target)&&!dd.contains(e.target)) closeSiteDropdown();
});

function renderInput() {
  const st = inputState;
  if (!st.step) st.step = 1;
  const total = 9;
  const stepLabel = ['거래 종류', '현장 선택', st.tab==='매출' ? '결제 단계' : '공정 선택', '금액 입력', '결제 방법', '입력자', '메모', '영수증 첨부', '입력 확인'];
  const header = `
    <div style="display:flex;align-items:center;gap:10px;padding:14px var(--pad) 8px;">
      <button data-iact="back" style="width:32px;height:32px;border-radius:50%;border:1.5px solid var(--hair);background:#fff;cursor:pointer;font-size:17px;flex-shrink:0;${st.step===1?'visibility:hidden;':''}">‹</button>
      <div style="flex:1;min-width:0;">
        <div class="h-eyebrow">새 거래 · ${st.step}/${total}</div>
        <div style="font-size:18px;font-weight:800;">${stepLabel[st.step-1]}</div>
      </div>
      <button onclick="window.MODALS.quickTip()" style="background:var(--warn-soft);color:var(--warn);border:1.5px solid var(--warn);border-radius:20px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;">⚡ 빠른입력</button>
    </div>
    <div style="padding:0 var(--pad);margin-bottom:16px;">
      <div style="height:4px;background:var(--hair);border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${st.step/total*100}%;background:var(--accent);border-radius:2px;transition:width .25s;"></div>
      </div>
    </div>`;
  let body = '';
  if (st.step===1) body = inputStepType();
  else if (st.step===2) body = inputStepSite();
  else if (st.step===3) body = inputStepMid();
  else if (st.step===4) body = inputStepAmount();
  else if (st.step===5) body = inputStepPay();
  else if (st.step===6) body = inputStepWriter();
  else if (st.step===7) body = inputStepMemo();
  else if (st.step===8) body = inputStepReceipt();
  else body = inputStepConfirm();
  return `${header}<div style="padding:0 0 28px;">${body}</div>`;
}

function _iBorder(active) { return active ? 'var(--accent)' : 'var(--hair)'; }

function inputStepType() {
  const types = [
    ['매입','📦','자재·인건비 등 지출'],
    ['매출','💰','고객에게 받은 금액'],
    ['AS','🔧','시공 후 사후관리'],
  ];
  const banner = M.unsorted>0
    ? `<button class="unsorted-banner" data-iact="pending" style="margin-bottom:14px;">
        <span class="pill pill-warn">📋 미정리 ${M.unsorted}</span>
        <span>탭해서 정리하기</span>
        <span style="margin-left:auto;">›</span>
      </button>`
    : '';
  return `
    <div style="padding:0 var(--pad);">
      ${banner}
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">어떤 거래인가요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:16px;">거래 종류를 먼저 선택하세요</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${types.map(([k,ic,desc])=>`
          <button data-iact="type" data-val="${k}" style="display:flex;align-items:center;gap:13px;background:#fff;border:1.5px solid ${_iBorder(inputState.tab===k)};border-radius:14px;padding:16px 14px;cursor:pointer;font-family:inherit;text-align:left;">
            <span style="font-size:24px;">${ic}</span>
            <span style="flex:1;min-width:0;">
              <span style="display:block;font-size:15px;font-weight:700;">${k}</span>
              <span style="display:block;font-size:11.5px;color:var(--muted);margin-top:2px;">${desc}</span>
            </span>
            <span style="color:#ccc;font-size:18px;">›</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function inputSiteRows(q) {
  const allSites = (M.sites||[]).map(s=>s.name);
  const recent = getRecentSites().filter(s=>allSites.includes(s));
  const ordered = [...recent, ...allSites.filter(s=>!recent.includes(s))];
  const query = (q||'').trim();
  const list = ordered.filter(s=>!query||s.indexOf(query)>-1);
  if (!list.length) return `<div style="font-size:12.5px;color:var(--muted);padding:10px 2px;line-height:1.5;">목록에 없어요. 위 버튼으로 입력한 이름을 그대로 쓸 수 있어요.</div>`;
  return list.map(s=>{
    const isRecent = recent.indexOf(s)>-1;
    return `<button data-iact="site" data-val="${String(s).replace(/"/g,'&quot;')}" style="display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid var(--hair);border-radius:12px;padding:13px;cursor:pointer;font-family:inherit;text-align:left;font-size:13.5px;">
      <span style="font-size:16px;">${isRecent?'🕐':'📁'}</span>
      <span style="flex:1;min-width:0;">${s}</span>
      <span style="color:#ccc;font-size:16px;">›</span>
    </button>`;
  }).join('');
}

function inputStepSite() {
  const cur = String(inputState.site||'').replace(/"/g,'&quot;');
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">어느 현장이에요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;">최근 현장에서 고르거나 검색·직접 입력하세요</div>
      <div style="display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid var(--hair);border-radius:11px;padding:11px 13px;margin-bottom:8px;">
        <span style="color:var(--muted);display:flex;">${ICON.search}</span>
        <input id="iflow-site-search" placeholder="현장명 검색 또는 직접 입력" autocomplete="off" value="${cur}"
          style="border:0;background:transparent;font-family:inherit;font-size:13.5px;flex:1;outline:none;color:var(--ink);">
      </div>
      <button data-iact="site-direct" style="width:100%;text-align:left;background:var(--warn-soft);border:1.5px dashed var(--warn);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--warn);font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px;">
        ✏️ 입력한 이름으로 진행하기
      </button>
      <div style="font-size:11.5px;color:var(--muted);font-weight:700;margin-bottom:8px;">현장 목록</div>
      <div id="iflow-site-list" style="display:flex;flex-direction:column;gap:8px;">${inputSiteRows('')}</div>
    </div>`;
}

function inputStepMid() {
  const st = inputState;
  if (st.tab==='매출') {
    const stageIcons={'계약금':'📋','착수금':'🔨','중도금':'💼','잔금':'✅'};
    return `
      <div style="padding:0 var(--pad);">
        <div style="font-size:15px;font-weight:700;margin-bottom:4px;">어떤 결제 단계예요?</div>
        <div style="font-size:12.5px;color:var(--muted);margin-bottom:16px;">${st.site||''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:9px;">
          ${(M.paymentStages||[]).map(s=>{
            const on = st.stage===s;
            return `<button data-iact="stage" data-val="${s}" style="display:flex;align-items:center;gap:6px;background:${on?'#1B1814':'#fff'};color:${on?'#fff':'var(--ink)'};border:1.5px solid ${on?'#1B1814':'var(--hair)'};border-radius:22px;padding:11px 16px;font-size:13.5px;font-family:inherit;cursor:pointer;">${stageIcons[s]||''} ${s}</button>`;
          }).join('')}
        </div>
      </div>`;
  }
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">어떤 공정이에요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:16px;">${st.site||''}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(M.phases||[]).map(p=>{
          const on = st.phase===p;
          return `<button data-iact="proc" data-val="${p}" style="background:${on?'#1B1814':'#fff'};color:${on?'#fff':'var(--ink)'};border:1.5px solid ${on?'#1B1814':'var(--hair)'};border-radius:20px;padding:9px 14px;font-size:13px;font-family:inherit;cursor:pointer;">${p}</button>`;
        }).join('')}
      </div>
    </div>`;
}

function inputStepAmount() {
  const st = inputState;
  const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
  const midV = st.tab==='매출' ? (st.stage||'') : (st.phase||'');
  const keys = ['7','8','9','4','5','6','1','2','3','00','0','del'];
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">금액을 입력하세요</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:6px;">${st.tab}${midV?' · '+midV:''}</div>
      <div style="text-align:center;font-size:34px;font-weight:800;margin:16px 0 6px;">
        <span id="iflow-amount" style="color:${amt?'var(--ink)':'#cbc3b4'};">${amt.toLocaleString('ko-KR')}</span><span style="font-size:18px;margin-left:3px;">원</span>
      </div>
      <div style="display:flex;gap:7px;justify-content:center;margin-bottom:14px;">
        ${[['+1만',10000],['+10만',100000],['+100만',1000000]].map(([l,v])=>`<button data-iact="quick" data-val="${v}" style="background:#fff;border:1.5px solid var(--hair);border-radius:18px;padding:7px 13px;font-size:12px;font-family:inherit;cursor:pointer;color:var(--accent);font-weight:700;">${l}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px;">
        ${keys.map(k=>`<button data-iact="key" data-val="${k}" style="background:#fff;border:1.5px solid var(--hair);border-radius:12px;padding:15px 0;font-size:19px;font-weight:700;font-family:inherit;cursor:pointer;">${k==='del'?'⌫':k}</button>`).join('')}
      </div>
      <button data-iact="amount-next" id="iflow-next" class="btn btn-primary btn-block"${amt?'':' disabled'} style="${amt?'':'opacity:.5;'}">다음</button>
    </div>`;
}

function _confRow(k, v, step, last) {
  return `<button data-iact="goto" data-step="${step}" style="display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:0;${last?'':'border-bottom:1px solid var(--hair-soft);'}padding:12px 0;font-size:13px;font-family:inherit;cursor:pointer;text-align:left;">
    <span style="color:var(--muted);">${k}</span>
    <span style="display:flex;align-items:center;gap:6px;font-weight:700;max-width:64%;justify-content:flex-end;"><span style="text-align:right;">${v}</span><span style="color:#ccc;font-size:13px;">›</span></span>
  </button>`;
}

function inputStepPay() {
  const st = inputState;
  const payIcons={'현금':'💵','계좌이체':'🏦','신용카드':'💳'};
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">결제 방법은요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:16px;">기본값은 계좌이체예요 · 탭하면 다음으로</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${(M.paymentMethods||[]).map(p=>{
          const on = st.payMethod===p;
          return `<button data-iact="pay" data-val="${p}" style="display:flex;align-items:center;gap:11px;background:#fff;border:1.5px solid ${on?'var(--accent)':'var(--hair)'};border-radius:13px;padding:15px 14px;cursor:pointer;font-family:inherit;text-align:left;">
            <span style="font-size:20px;">${payIcons[p]||''}</span>
            <span style="flex:1;font-size:14.5px;font-weight:700;">${p}</span>
            <span style="color:${on?'var(--accent)':'#ccc'};font-size:16px;">${on?'✓':'›'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
}

function inputStepWriter() {
  const st = inputState;
  if (!st.inputter) st.inputter = (window.AUTH && AUTH.current && AUTH.current()?.name) || (M.inputters||[])[0] || '';
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">누가 입력하나요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:16px;">탭하면 다음으로</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${(M.inputters||[]).map(n=>{
          const on = st.inputter===n;
          return `<button data-iact="inputter" data-val="${n}" style="display:flex;align-items:center;gap:11px;background:#fff;border:1.5px solid ${on?'var(--accent)':'var(--hair)'};border-radius:13px;padding:13px 14px;cursor:pointer;font-family:inherit;text-align:left;">
            <span style="width:34px;height:34px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;">${String(n).slice(0,1)}</span>
            <span style="flex:1;font-size:14.5px;font-weight:700;">${n}</span>
            <span style="color:${on?'var(--accent)':'#ccc'};font-size:16px;">${on?'✓':'›'}</span>
          </button>`;
        }).join('')}
      </div>
    </div>`;
}

function inputStepMemo() {
  const st = inputState;
  const has = (st.memo||'').trim();
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">메모를 남길까요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;">선택사항이에요 · 비워두고 넘어가도 돼요</div>
      <textarea class="input" id="iflow-memo" rows="4" placeholder="예: 락카 1개, 자재 추가 구매" style="margin-bottom:16px;">${st.memo||''}</textarea>
      <button data-iact="next" id="iflow-memo-next" class="btn btn-primary btn-block">${has?'다음':'메모 없이 계속'}</button>
    </div>`;
}

function inputStepReceipt() {
  const n = (window._entryPhotos||[]).length;
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">영수증을 첨부할까요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;">선택사항이에요 · 최대 5장</div>
      <div class="grid-2" style="margin-bottom:12px;">
        <button type="button" class="attach" onclick="entryOpenCamera()">📷 카메라 촬영</button>
        <button type="button" class="attach" onclick="entryOpenGallery()">🖼️ 갤러리 업로드</button>
      </div>
      <input type="file" id="entry-file-camera" accept="image/*" capture="environment" style="display:none" onchange="entryHandleFile(event)">
      <input type="file" id="entry-file-gallery" accept="image/*" multiple style="display:none" onchange="entryHandleFile(event)">
      <div id="entry-photo-preview" style="display:flex;flex-wrap:wrap;gap:8px;min-height:44px;margin-bottom:16px;"></div>
      <button data-iact="next" id="iflow-receipt-next" class="btn btn-primary btn-block">${n?`다음 · 영수증 ${n}장`:'영수증 없이 계속'}</button>
    </div>`;
}

function inputStepConfirm() {
  const st = inputState;
  if (!st.date) st.date = new Date().toISOString().slice(0,10);
  if (!st.inputter) st.inputter = (window.AUTH && AUTH.current && AUTH.current()?.name) || (M.inputters||[])[0] || '';
  const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
  const midK = st.tab==='매출' ? '결제 단계' : '공정';
  const midV = st.tab==='매출' ? (st.stage||'-') : (st.phase||'-');
  const nPhoto = (window._entryPhotos||[]).length;
  const vat = Math.round(amt*0.1);
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">이대로 저장할까요?</div>
      <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;">각 항목을 탭하면 그 단계로 돌아가 수정할 수 있어요</div>
      <div style="background:#fff;border:1.5px solid var(--hair);border-radius:14px;padding:2px 14px;margin-bottom:16px;">
        ${_confRow('종류', st.tab, 1)}
        ${_confRow('현장', st.site||'-', 2)}
        ${_confRow(midK, midV, 3)}
        ${_confRow('금액', `<span style="font-size:18px;font-weight:800;">${amt.toLocaleString('ko-KR')}원</span>`, 4)}
        ${_confRow('결제 방법', st.payMethod||'-', 5)}
        ${_confRow('입력자', st.inputter||'-', 6)}
        ${_confRow('메모', (st.memo||'').trim()||'없음', 7)}
        ${_confRow('영수증', nPhoto?nPhoto+'장':'없음', 8, true)}
      </div>
      <div class="field">
        <label class="field-label">날짜</label>
        <input class="input" type="date" id="iflow-date" value="${st.date}">
      </div>
      ${st.tab==='매출'?`
      <div class="invoice-toggle ${st.invoice?'':'off'}" id="invoice-toggle" data-iact="invoice">
        <div class="checkbox"><svg viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div>
          <div class="it-title">📄 세금계산서 발행</div>
          <div class="it-meta">${st.invoice?`부가세 ₩${vat.toLocaleString('ko-KR')} 자동 계산`:'체크하면 부가세(10%) 자동 계산됩니다'}</div>
        </div>
      </div>`:''}
      <div class="form-submit" style="margin-top:10px;">
        <button class="btn btn-primary btn-block" data-iact="submit">✅ 저장하기</button>
      </div>
    </div>`;
}

function handleInputFlow(act, el) {
  const st = inputState;
  if (act==='type') {
    st.tab = el.dataset.val; st.phase=''; st.stage=''; st.step=2; navigate('input');
  } else if (act==='site') {
    st.site = el.dataset.val; addRecentSite(st.site); st.step=3; navigate('input');
  } else if (act==='site-direct') {
    const inp = document.getElementById('iflow-site-search');
    const v = (inp && inp.value.trim()) || '';
    if (!v) { alert('현장명을 입력하거나 목록에서 선택해주세요'); return; }
    st.site = v; addRecentSite(v); st.step=3; navigate('input');
  } else if (act==='proc') {
    st.phase = el.dataset.val; st.step=4; navigate('input');
  } else if (act==='stage') {
    st.stage = el.dataset.val; st.step=4; navigate('input');
  } else if (act==='key') {
    let cur = String(st.amount||'').replace(/[^0-9]/g,'');
    if (el.dataset.val==='del') cur = cur.slice(0,-1);
    else cur = (cur + el.dataset.val);
    cur = cur.replace(/^0+/,'');
    if (cur.length>12) cur = cur.slice(0,12);
    st.amount = cur;
    updateAmountDisplay();
  } else if (act==='quick') {
    let cur = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
    cur += parseInt(el.dataset.val,10) || 0;
    st.amount = String(cur);
    updateAmountDisplay();
  } else if (act==='amount-next') {
    const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
    if (!amt) { alert('금액을 입력해주세요'); return; }
    st.step=5; navigate('input');
  } else if (act==='back') {
    if (st.step>1) { st.step--; navigate('input'); }
  } else if (act==='pay') {
    st.payMethod = el.dataset.val; st.step=6; navigate('input');
  } else if (act==='inputter') {
    st.inputter = el.dataset.val; st.step=7; navigate('input');
  } else if (act==='next') {
    st.step++; navigate('input');
  } else if (act==='goto') {
    st.step = parseInt(el.dataset.step,10) || 1; navigate('input');
  } else if (act==='invoice') {
    st.invoice = !st.invoice; navigate('input');
  } else if (act==='pending') {
    openPendingList();
  } else if (act==='submit') {
    submitEntry();
  }
}

function updateAmountDisplay() {
  const amt = parseInt(String(inputState.amount||'').replace(/[^0-9]/g,'')) || 0;
  const el = document.getElementById('iflow-amount');
  if (el) { el.textContent = amt.toLocaleString('ko-KR'); el.style.color = amt ? 'var(--ink)' : '#cbc3b4'; }
  const nx = document.getElementById('iflow-next');
  if (nx) { nx.disabled = !amt; nx.style.opacity = amt ? '1' : '.5'; }
}

window._entryPhotos=[];
function entryOpenCamera() { document.getElementById('entry-file-camera')?.click(); }
function entryOpenGallery() { document.getElementById('entry-file-gallery')?.click(); }
function entryHandleFile(e) {
  Array.from(e.target.files||[]).forEach(file=>{
    if (window._entryPhotos.length>=5) return;
    const r=new FileReader();
    r.onload=ev=>{ window._entryPhotos.push(ev.target.result); entryRenderPhotos(); };
    r.readAsDataURL(file);
  });
  e.target.value='';
}
function entryRenderPhotos() {
  const wrap=document.getElementById('entry-photo-preview');
  if (wrap) {
  wrap.innerHTML=window._entryPhotos.map((p,i)=>`
    <div style="position:relative;width:80px;height:80px;flex-shrink:0;">
      <img src="${p}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);">
      <button onclick="entryRemovePhoto(${i})"
        style="position:absolute;top:-6px;right:-6px;background:#1B1814;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;">✕</button>
    </div>`).join('');
  }
  const rb=document.getElementById('iflow-receipt-next');
  if (rb) {
    const n=window._entryPhotos.length;
    rb.textContent = n ? `다음 · 영수증 ${n}장` : '영수증 없이 계속';
  }
}
function entryRemovePhoto(idx) { window._entryPhotos.splice(idx,1); entryRenderPhotos(); }

// ===== SITES =====
let sitesFilter='공사중', sitesQuery='';

function renderSites() {
  const filters=['공사중','전체','계약완료','AS관리'];
  let list = sitesFilter==='전체'?[...M.sites]:M.sites.filter(s=>s.status===sitesFilter);
  list.sort((a,b)=>{
    const aa=a.status==='공사중'?1:0, bb=b.status==='공사중'?1:0;
    if(aa!==bb) return bb-aa;
    return (b._createdAt||0)-(a._createdAt||0);
  });
  if (sitesQuery) list=list.filter(s=>s.name.includes(sitesQuery)||s.client.includes(sitesQuery));
  const filterHtml=filters.map(f=>`<button class="filter-chip ${sitesFilter===f?'is-active':''}" data-filter="${f}">${f}</button>`).join('');
  const cardsHtml=list.map(s=>`
    <div class="site-card" onclick="openSiteDetail('${s.name.replace(/'/g,"\\'")}')">
      <div class="site-card-head">
        <div>
          <div class="site-card-name">${s.name}</div>
          <div class="site-card-meta">${s.client} · ${s.start}${s.end&&s.end!=='—'?' – '+s.end:''}</div>
        </div>
        <span class="pill status-${s.status}">${s.status}</span>
      </div>
      <div class="site-card-stats">
        <div><div class="s-k">매출</div><div class="s-v num">${fmtSlim(s.revenue)}</div></div>
        <div><div class="s-k">매입</div><div class="s-v num">${fmtSlim(s.cost)}</div></div>
        <div><div class="s-k">이익</div><div class="s-v num ${s.profit>0?'profit':''}">${s.profit>0?'+':''}${fmtSlim(s.profit)}</div></div>
      </div>
      ${s.progress>0?`<div class="progress-row">
        <span class="p-label">${s.phase}</span>
        <div class="p-track"><div class="p-fill" style="width:${s.progress}%"></div></div>
        <span class="p-pct num">${s.progress}%</span>
      </div>`:''}
    </div>`).join('')||'<div class="empty">결과가 없습니다</div>';
  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">현장 ${M.sites.length}개 · 진행중 ${M.sites.filter(x=>x.status==='공사중').length}</div>
        <h1 class="h-title">현장 관리</h1>
      </div>
      <button class="btn btn-primary btn-sm" data-modal="site">+ 등록</button>
    </div>
    <div style="padding:0 var(--pad) 12px;">
      <div class="search-box">${ICON.search}<input class="search-input" placeholder="현장명·고객명 검색" id="sites-search" value="${sitesQuery}"></div>
    </div>
    <div class="filter-row">${filterHtml}</div>
    <div class="page-body">
      <div class="cal-mini-bar">
        <button class="btn btn-ghost btn-sm" data-goto="calendar">📅 현장 달력</button>
        <button class="btn btn-ghost btn-sm">📤 구글 캘린더</button>
      </div>
      ${cardsHtml}
    </div>`;
}

// ===== Router =====
const routes={
  home:       { render:renderHome,   tab:'home' },
  sites:      { render:renderSites,  tab:'sites' },
  siteDetail: { render:()=>window.PAGES_EXTRA.renderSiteDetail(), tab:'sites' },
  input:      { render:renderInput,  tab:'input' },
  quickInput: { render:renderInput,  tab:'input' },
  calendar:   { render:()=>window.PAGES_EXTRA.renderCalendar(),  tab:'calendar' },
  settings:   { render:()=>window.PAGES_EXTRA.renderSettings(),  tab:'settings' },
  photos:     { render:()=>window.PAGES_EXTRA.renderPhotos(),    tab:'settings' },
  tax:        { render:()=>window.PAGES_EXTRA.renderTax(),       tab:'home' },
};

let currentPage='home';
function navigate(page) {
  if (!routes[page]) return;
  if (page==='input' && currentPage!=='input' && currentPage!=='quickInput') {
    resetInputFlow();
  }
  currentPage=page; window.currentPage=page;
  const activeTab=routes[page].tab;
  $$('.tabbar-item,.tabbar-fab').forEach(b=>b.classList.toggle('is-active',b.dataset.page===activeTab));
  $('#app').innerHTML=`<div class="page is-active">${routes[page].render()}</div>`;
  // 로딩 화면 숨기기
  const ls=document.getElementById('loading-screen');
  if (ls) ls.style.display='none';
  // 탭바 보이기
  const tb=document.getElementById('tabbar');
  if (tb) tb.style.display='flex';
  window.scrollTo(0,0);
  if (page==='input') { try { entryRenderPhotos(); } catch(e){} }
}
// 즉시 전역 등록 (DOMContentLoaded 이전에도 firebase.js 에서 호출 가능)
window.navigate=navigate;

// ===== Events =====
document.addEventListener('click',e=>{
  if (e.target.closest('[data-modal]')||e.target.closest('[data-modal-close]')) return;
  const tab=e.target.closest('[data-page]');
  if (tab) { e.preventDefault(); navigate(tab.dataset.page); return; }
  const goto=e.target.closest('[data-goto]');
  if (goto) { e.preventDefault(); navigate(goto.dataset.goto); return; }
  const filter=e.target.closest('[data-filter]');
  if (filter&&currentPage==='sites') { sitesFilter=filter.dataset.filter; navigate('sites'); return; }
  const iact=e.target.closest('[data-iact]');
  if (iact) { e.preventDefault(); handleInputFlow(iact.dataset.iact, iact); return; }
  if (e.target.closest('#logout-btn')) { if(confirm('로그아웃 하시겠어요?')) { AUTH.logout(); location.reload(); } return; }
});

document.addEventListener('input',e=>{
  if (e.target.id==='iflow-site-search') {
    inputState.site=e.target.value;
    const list=document.getElementById('iflow-site-list');
    if (list) list.innerHTML=inputSiteRows(e.target.value);
    return;
  }
  if (e.target.id==='iflow-memo') {
    inputState.memo=e.target.value;
    const mb=document.getElementById('iflow-memo-next');
    if (mb) mb.textContent = e.target.value.trim() ? '다음' : '메모 없이 계속';
    return;
  }
  if (e.target.id==='iflow-date') { inputState.date=e.target.value; return; }
  if (e.target.id==='sites-search') {
    sitesQuery=e.target.value;
    navigate('sites');
    const s=$('#sites-search');
    if (s) { s.focus(); s.setSelectionRange(sitesQuery.length,sitesQuery.length); }
  }
});

// ===== 미정리 목록 =====
function openPendingList() {
  const pending=window.FB?.pending||{};
  const list=Object.entries(pending)
    .filter(([,p])=>p.status!=='done')
    .sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
  const renderList=()=>list.map(([key,p])=>{
    const amount=p.totalAmount?p.totalAmount.toLocaleString('ko-KR')+'원':'금액 미입력';
    const statusColor=p.status==='progress'?'#b07d00':'#9A4B2E';
    const statusBg=p.status==='progress'?'#fff3cd':'#fdecea';
    const statusLabel=p.status==='progress'?'정리중':'임시저장';
    return `
      <div style="background:#fff;border-radius:14px;border:1px solid var(--hair);padding:14px 16px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;margin-bottom:3px;">${p.site||'현장 미지정'}</div>
            <div style="font-size:12px;color:var(--muted);">${p.date||''} · ${p.writer||''}</div>
          </div>
          <span style="background:${statusBg};color:${statusColor};border-radius:20px;padding:3px 10px;font-size:11px;font-weight:700;flex-shrink:0;margin-left:8px;">${statusLabel}</span>
        </div>
        ${p.memo?`<div style="font-size:13px;color:var(--ink-2);margin-bottom:8px;">${p.memo}</div>`:''}
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">${amount}</div>
        <div style="display:flex;gap:8px;">
          <button onclick="editPending('${key}')"
            style="flex:1;padding:10px;background:var(--surface-2);border:1px solid var(--hair);border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">✏️ 수정</button>
          <button onclick="deletePending('${key}')"
            style="flex:1;padding:10px;background:#fdecea;border:1px solid #f5c6c6;border-radius:10px;font-size:13px;font-weight:600;color:#9A4B2E;cursor:pointer;font-family:inherit;">🗑️ 삭제</button>
        </div>
      </div>`;
  }).join('')||'<div style="text-align:center;padding:40px;color:var(--muted);">미정리 내역이 없어요 ✅</div>';
  const root=document.getElementById('modal-root');
  root.innerHTML=`
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" style="max-height:90vh;" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div><div class="modal-title">📋 미정리 내역</div><div class="modal-sub">총 ${list.length}건</div></div>
          <button class="btn-icon" onclick="closeModal()">✕</button>
        </div>
        <div style="overflow-y:auto;max-height:70vh;padding:0 var(--pad) var(--pad);">${renderList()}</div>
      </div>
    </div>`;
  document.body.style.overflow='hidden';
}
async function deletePending(key) {
  if (!confirm('이 미정리 내역을 삭제할까요?')) return;
  try { await db.ref('pending/'+key).remove(); openPendingList(); }
  catch(e) { alert('삭제 실패'); }
}
function editPending(key) {
  const p=window.FB?.pending?.[key]||{};
  const sitesOpts=(M.sites||[]).map(s=>`<option value="${s.name}" ${p.site===s.name?'selected':''}>${s.name}</option>`).join('');
  const root=document.getElementById('modal-root');
  root.innerHTML=`
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div><div class="modal-title">✏️ 미정리 수정</div></div>
          <button class="btn-icon" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="field"><label class="field-label">현장</label>
            <select class="input" id="pend-site"><option value="">선택</option>${sitesOpts}</select></div>
          <div class="field"><label class="field-label">금액 (원)</label>
            <input class="input" type="number" id="pend-amount" value="${p.totalAmount||''}" placeholder="총 금액"></div>
          <div class="field"><label class="field-label">날짜</label>
            <input class="input" type="date" id="pend-date" value="${p.date||''}"></div>
          <div class="field"><label class="field-label">메모</label>
            <textarea class="input" id="pend-memo" rows="2">${p.memo||''}</textarea></div>
          <div class="field"><label class="field-label">상태</label>
            <div class="chip-group">
              <button type="button" class="chip ${p.status==='temp'||!p.status?'is-active':''}" onclick="pendChip(this,'temp')">임시저장</button>
              <button type="button" class="chip ${p.status==='progress'?'is-active':''}" onclick="pendChip(this,'progress')">정리중</button>
              <button type="button" class="chip ${p.status==='done'?'is-active':''}" onclick="pendChip(this,'done')">완료</button>
            </div>
            <input type="hidden" id="pend-status" value="${p.status||'temp'}">
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" onclick="openPendingList()">← 목록</button>
          <button class="btn btn-primary" onclick="savePending('${key}')">저장</button>
        </div>
      </div>
    </div>`;
  document.body.style.overflow='hidden';
}
function pendChip(el,val) {
  el.closest('.chip-group').querySelectorAll('.chip').forEach(b=>b.classList.remove('is-active'));
  el.classList.add('is-active');
  document.getElementById('pend-status').value=val;
}
async function savePending(key) {
  const site=document.getElementById('pend-site')?.value||'';
  const amount=parseInt(document.getElementById('pend-amount')?.value)||null;
  const date=document.getElementById('pend-date')?.value||'';
  const memo=document.getElementById('pend-memo')?.value?.trim()||'';
  const status=document.getElementById('pend-status')?.value||'temp';
  const btn=document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='저장 중...'; }
  try {
    await db.ref('pending/'+key).update({site,totalAmount:amount,date,memo,status});
    openPendingList();
  } catch(e) {
    alert('저장 실패');
    if (btn) { btn.disabled=false; btn.textContent='저장'; }
  }
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  // window.navigate 즉시 등록 (firebase.js initFirebase 에서 호출 가능하도록)
  window.navigate = navigate;
  window.currentPage = 'home';

  const loggedIn = bootAuth();

  if (!loggedIn) {
    // 로그인 안된 경우 로딩 화면 숨기기
    const ls = document.getElementById('loading-screen');
    if (ls) ls.style.display = 'none';
  } else {
    // 로그인된 경우 Firebase 데이터 로드 후 navigate 호출됨
    // 최대 5초 후 강제로 로딩 화면 숨기기 (안전장치)
    setTimeout(() => {
      const ls = document.getElementById('loading-screen');
      if (ls && ls.style.display !== 'none') {
        ls.style.display = 'none';
        if (!document.querySelector('.page.is-active')) {
          navigate('home');
        }
      }
    }, 5000);
  }
});

// ===== Pull to Refresh =====
(function(){
  let startY=0, pulling=false, threshold=80;
  const indicator=document.getElementById('pull-indicator');
  document.addEventListener('touchstart',e=>{
    if (window.scrollY===0) { startY=e.touches[0].clientY; pulling=true; }
  },{passive:true});
  document.addEventListener('touchmove',e=>{
    if (!pulling) return;
    const dy=e.touches[0].clientY-startY;
    if (dy>0&&window.scrollY===0) {
      const h=Math.min(dy*.5,56);
      if (indicator) { indicator.style.height=h+'px'; indicator.textContent=dy>threshold?'🔄 놓으면 새로고침!':'↓ 당겨서 새로고침'; }
    }
  },{passive:true});
  document.addEventListener('touchend',e=>{
    if (!pulling) return;
    pulling=false;
    const dy=e.changedTouches[0].clientY-startY;
    if (indicator) indicator.style.height='0';
    if (dy>threshold&&window.scrollY===0) location.reload();
  },{passive:true});
})();
