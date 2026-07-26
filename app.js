// 머니플로우 — Main app
const M = window.MOCK;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function fmtSlim(n) {
  if (!n) return '0';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 100_000_000) return sign + (a / 100_000_000).toFixed(1).replace(/\.0$/, '') + '억';
  if (a >= 10_000) return sign + Math.round(a / 10_000).toLocaleString('ko-KR') + '만';
  return sign + a.toLocaleString('ko-KR');
}
// 이익/손실을 +/- 부호로 직관적으로 표시 (양수도 +를 명시, 0은 부호 없음)
function fmtSigned(n) {
  if (!n) return '0';
  const sign = n > 0 ? '+' : '-';
  const a = Math.abs(n);
  if (a >= 100_000_000) return sign + (a / 100_000_000).toFixed(1).replace(/\.0$/, '') + '억';
  if (a >= 10_000) return sign + Math.round(a / 10_000).toLocaleString('ko-KR') + '만';
  return sign + a.toLocaleString('ko-KR');
}
// 전체 자릿수 + 부호 표시 (예: +78,070,000원)
function fmtSignedFull(n) {
  if (!n) return '0원';
  const sign = n > 0 ? '+' : '-';
  return sign + Math.abs(n).toLocaleString('ko-KR') + '원';
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

// ===== 노하우 공통 헬퍼 =====
const TIP_PREVIEW_COUNT = 3;   // 홈에서 보여줄 미리보기 개수
const TIP_PAGE_SIZE = 20;      // 노하우 전용 페이지에서 "더보기" 단위
const TIP_FILTERS = [
  { key: 'pin',  label: '📌 핀 고정' },
  { key: 'all',  label: '전체' },
  { key: '실수', label: '😓 실수' },
  { key: '팁',   label: '💡 팁' },
  { key: '자재', label: '🔩 자재' },
  { key: '고객', label: '🤝 고객' },
];

// 필터 + 검색어로 노하우 목록 뽑기
function getVisibleTips(filter, query) {
  let list;
  if (filter === 'pin') {
    list = M.tips.filter(t => t.pinned);
  } else if (filter === 'all') {
    list = [...M.tips];
  } else {
    list = M.tips.filter(t => t.cat === filter);
  }
  const q = (query || '').trim().toLowerCase();
  if (q) {
    list = list.filter(t =>
      (t.title    || '').toLowerCase().includes(q) ||
      (t.site     || '').toLowerCase().includes(q) ||
      (t.by       || '').toLowerCase().includes(q) ||
      (t.problem  || '').toLowerCase().includes(q) ||
      (t.solution || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function tipCardHtml(tp) {
  const cls = tp.cat==='실수'?'pill-warn':tp.cat==='팁'?'pill-accent':tp.cat==='자재'?'pill-pin':'pill-info';
  const ic  = tp.cat==='실수'?'😓':tp.cat==='팁'?'💡':tp.cat==='자재'?'🔩':'🤝';
  return `<button class="tip-card ${tp.pinned?'pinned':''}" data-tip-key="${tp._key || ''}" style="display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--hair);border-radius:14px;padding:14px;cursor:pointer;font-family:inherit;margin-bottom:8px;">
    <div class="tip-head"><span class="pill ${cls}">${ic} ${tp.cat}</span><span class="tip-meta">${tp.by} · ${tp.site}</span></div>
    <div class="tip-title">${tp.title}</div></button>`;
}

function tipFilterChipsHtml(activeKey) {
  return TIP_FILTERS.map(f =>
    `<button class="filter-chip ${activeKey===f.key?'is-active':''}" data-tip-filter="${f.key}">${f.label}</button>`
  ).join('');
}

// ===== HOME =====
// 스와이프 시 하단 점 인디케이터 활성 위치 갱신 (인라인 onscroll에서 호출)
function updateHomeProcDots(track) {
  const wrap = track.parentElement;
  const dotsWrap = wrap && wrap.querySelector('.home-proc-dots');
  if (!dotsWrap) return;
  const dots = dotsWrap.children;
  const n = dots.length;
  if (!n) return;
  const raw = Math.round(track.scrollLeft / (track.scrollWidth / n));
  const idx = Math.max(0, Math.min(n - 1, raw));
  for (let k = 0; k < n; k++) dots[k].style.background = k === idx ? 'var(--ink)' : '#D1D6DB';
}

// 공사중 현장별 [오늘 공정 » 내일 공정] 카드 — 좌우 스와이프 + 하단 점 인디케이터
function renderHomeProgressHtml() {
  const activeSites = (M.sites || []).filter(s => s.status === '공사중');
  const cardShadow = '0 2px 8px rgba(0,0,0,0.05)';
  if (!activeSites.length) {
    return `<div style="background:#FAFCFB;border-radius:18px;padding:20px;box-shadow:${cardShadow};margin-bottom:16px;"><div style="padding:6px;text-align:center;color:var(--muted);font-size:13px;">진행중인 공사 현장이 없어요</div></div>`;
  }
  const multi = activeSites.length > 1;
  const cardBasis = multi ? '88%' : '100%';   // 여러 장은 다음 카드가 살짝 보이게, 한 장은 꽉 차게
  const todayStr = toToday();
  const calcSt = (s, e) => (!s && !e) ? 'wait' : (s && todayStr < s) ? 'wait' : (e && todayStr > e) ? 'done' : 'active';
  const cards = activeSites.map(s => {
    const key = (s.name || '').replace(/[.#$/ \[\]]/g, '_');
    const pd = window.FB?._procAll?.[key] || {};
    const phases = Object.entries(pd).map(([id, p]) => ({ ...p, id })).sort((a, b) => {
      const aHas = !!a.startDate, bHas = !!b.startDate;
      if (aHas && bHas) {
        if (a.startDate !== b.startDate) return a.startDate < b.startDate ? -1 : 1;
        return (a.order || 0) - (b.order || 0);
      }
      if (aHas) return -1;
      if (bHas) return 1;
      return (a.order || 0) - (b.order || 0);
    });
    let curIdx = phases.findIndex(ph => calcSt(ph.startDate, ph.doneDate) === 'active');
    if (curIdx === -1) curIdx = phases.findIndex(ph => calcSt(ph.startDate, ph.doneDate) === 'wait');
    if (curIdx === -1) curIdx = phases.length - 1;
    const curP  = phases[curIdx] || null;                                  // 오늘 공정 (진행 중)
    const nextP = curIdx < phases.length - 1 ? phases[curIdx + 1] : null;  // 내일 공정 (다음)
    const todayName    = curP  ? curP.name  : '공정 정보 없음';
    const tomorrowName = nextP ? nextP.name : '—';
    const nameEsc = (s.name || '').replace(/'/g, "\\'");
    return `
      <div style="scroll-snap-align:center;flex:0 0 ${cardBasis};box-sizing:border-box;background:#FAFCFB;border-radius:18px;padding:20px;box-shadow:${cardShadow};cursor:pointer;" onclick="openSiteDetail('${nameEsc}')">
        <div style="font-size:16px;font-weight:400;color:var(--muted);margin-bottom:6px;">${s.name}</div>
        <div style="display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 10px;min-width:0;">
          <span style="font-size:28px;font-weight:800;color:var(--ink);line-height:1.05;">${todayName}</span>
          <span style="font-size:22px;font-weight:700;color:var(--muted);">»</span>
          <span style="font-size:28px;font-weight:300;color:var(--muted);line-height:1.05;">${tomorrowName}</span>
        </div>
      </div>`;
  }).join('');
  const dotsHtml = `<div class="home-proc-dots" style="display:flex;justify-content:center;gap:7px;margin-top:12px;">
      ${activeSites.map((_, i) => `<span style="width:7px;height:7px;border-radius:50%;background:${i === 0 ? 'var(--ink)' : '#D1D6DB'};transition:background .2s;"></span>`).join('')}
    </div>`;
  return `
    <div style="margin-bottom:16px;">
      <div class="home-proc-track" onscroll="updateHomeProcDots(this)" style="display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:4px 2px 8px;">
        ${cards}
      </div>
      ${dotsHtml}
    </div>`;
}

// 홈 현장 노하우 — 가로 스크롤 카드 + 6등분 필터 + 하단 기록 버튼
const HOME_TIP_FILTERS = [
  { key: 'pin', label: '핀 고정' },
  { key: '실수', label: '실수' },
  { key: '팁',   label: '팁' },
  { key: '자재', label: '자재' },
  { key: '고객', label: '고객' },
];
const HOME_TIP_CAT_COLOR = {
  '실수': ['#F4E8E0', '#9A4B2E'],
  '팁':   ['#F4E9D9', '#B8895A'],
  '자재': ['#E2E8F2', '#5B7CB5'],
  '고객': ['#E1ECE5', '#2F6B47'],
};
function renderHomeTipsHtml() {
  const filter = window._tipsFilter || 'pin';
  const preview = getVisibleTips(filter).slice(0, TIP_PREVIEW_COUNT);
  const chips = HOME_TIP_FILTERS.map(f => {
    const inner = filter === f.key
      ? `<span style="font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-soft);border-radius:14px;padding:5px 10px;white-space:nowrap;">${f.label}</span>`
      : `<span style="font-size:13px;color:var(--muted);white-space:nowrap;">${f.label}</span>`;
    return `<button data-tip-filter="${f.key}" style="flex:1;min-width:0;display:flex;justify-content:center;align-items:center;background:none;border:0;padding:0;cursor:pointer;font-family:inherit;">${inner}</button>`;
  }).join('');
  const addCard = `<div data-modal="tip" style="flex:0 0 150px;height:158px;box-sizing:border-box;background:#fff;border:1px solid var(--hair);border-radius:4px;padding:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--accent);cursor:pointer;">
      <span style="font-size:24px;line-height:1;font-weight:400;">＋</span>
      <span style="font-size:14px;font-weight:700;">기록</span>
    </div>`;
  const tipCards = preview.length > 0
    ? preview.map(tp => {
        const cc = HOME_TIP_CAT_COLOR[tp.cat] || ['#F1F0EC', '#6B7684'];
        return `<div class="tip-hcard" data-tip-key="${tp._key || ''}" style="flex:0 0 150px;height:158px;box-sizing:border-box;background:#fff;border:1px solid var(--hair);border-radius:4px;padding:12px;text-align:left;display:flex;flex-direction:column;overflow:hidden;cursor:pointer;">
          <span style="align-self:flex-start;font-size:12px;font-weight:700;padding:2px 8px;border-radius:6px;background:${cc[0]};color:${cc[1]};">${tp.cat}</span>
          <div style="font-size:16px;font-weight:700;color:var(--ink);margin-top:4px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${tp.title}</div>
          <div style="font-size:12px;color:var(--faint);margin-top:auto;padding-top:10px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${tp.by} · ${tp.site}</div>
        </div>`;
      }).join('')
    : '';
  return `
    <div class="section-label">현장 노하우 <span class="more"><span data-goto="tips">모두보기</span></span></div>
    <div style="display:flex;margin-bottom:16px;">${chips}</div>
    <div class="home-tips-track" style="display:flex;gap:10px;overflow-x:auto;align-items:stretch;scrollbar-width:none;padding-bottom:8px;">${addCard}${tipCards}</div>`;
}

// 최근 거래 내역 — 은행앱 스타일, 월별 그룹(달 바뀔 때만 가로줄)
function renderRecentTxHtml() {
  const rows = (M.recent || []).slice(0, 5);
  if (!rows.length) return `<div class="empty" style="padding:20px;font-size:13px;">거래 내역이 없어요</div>`;
  const groups = [];
  rows.forEach(r => {
    const d = r.date || '';
    const ym = d ? d.slice(0, 7) : '기타';
    let g = groups.find(x => x.ym === ym);
    if (!g) {
      g = { ym, label: d ? `${d.slice(0, 4)}년 ${parseInt(d.slice(5, 7), 10)}월` : '날짜 미상', items: [] };
      groups.push(g);
    }
    g.items.push(r);
  });
  return groups.map((g, gi) => {
    const divider = gi > 0 ? `<div style="height:1px;background:var(--hair);margin:10px 0 0;"></div>` : '';
    const labelMargin = gi > 0 ? '15px 0 4px' : '4px 0 4px';
    const label = `<div style="font-size:14px;font-weight:500;color:var(--muted);margin:${labelMargin};">${g.label}</div>`;
    const items = g.items.map(r => {
      const isRev = r.kind === '매출';
      const circleBg = isRev ? 'var(--info-soft)' : 'var(--warn-soft)';
      const circleFg = isRev ? 'var(--info)' : 'var(--warn)';
      const amtColor = isRev ? '#2563EB' : 'var(--ink)';
      const amt = (r.amount || 0).toLocaleString('ko-KR') + '원';
      const dd = r.date ? `${parseInt(r.date.slice(5, 7), 10)}월 ${parseInt(r.date.slice(8, 10), 10)}일` : (r.when || '');
      const content = r.stage || r.phase || '거래';
      return `<div onclick="modalTxEdit('${r._key || r.id || ''}')" style="display:flex;align-items:center;gap:12px;padding:12px 2px;cursor:pointer;">
        <div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:${circleBg};color:${circleFg};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${r.kind}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:16px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${content}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;">${dd}</div>
        </div>
        <div style="flex-shrink:0;text-align:right;max-width:140px;">
          <div style="font-size:16px;font-weight:700;color:${amtColor};">${amt}</div>
          <div style="font-size:13px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.site || ''}</div>
        </div>
      </div>`;
    }).join('');
    return divider + label + items;
  }).join('');
}

function renderHome() {
  const t = M.totals;
  const now = new Date();

  // 손익 현황 섹션 — 대리(staff)에게는 숨김
  const pnlSection = `
      <div style="height:6px;background:#F1F1F5;margin:25px calc(-1 * var(--pad));"></div>
      <div class="section-label" style="margin-top:8px;">손익 현황
        <span class="more"><span class="pill pill-muted" style="font-size:11px;">${AUTH.roleLabel()} 모드</span></span>
      </div>
      ${ymRow(now.getFullYear(), now.getMonth()+1)}
      ${AUTH.can('finalProfit') ? `
      <div class="hero" style="margin-top:10px;">
        <div class="hero-eyebrow">🏢 이번 달 최종 영업이익</div>
        <div class="hero-amount num" style="color:var(--ink);">${fmtSignedFull(t.finalProfit)}</div>
        <div class="hero-meta">순이익 − 고정비(임대료·급여 등) − 부가세</div>
        <div class="stack-bar">
          <span style="flex:${Math.max(t.finalProfit,1)};background:var(--accent);"></span>
          <span style="flex:${Math.max(t.fixed,1)};background:var(--faint);"></span>
          <span style="flex:${Math.max(t.vat,1)};background:var(--warn);opacity:.85;"></span>
        </div>
        <div class="stack-legend">
          <div><div class="lk"><span class="ldot" style="background:var(--accent);"></span>이익</div><span class="lv num">${fmtSigned(t.finalProfit)}</span></div>
          <div><div class="lk"><span class="ldot" style="background:var(--faint);"></span>고정비</div><span class="lv num">${fmtSlim(t.fixed)}</span></div>
          <div><div class="lk"><span class="ldot" style="background:var(--warn);"></span>부가세</div><span class="lv num">${fmtSlim(t.vat)}</span></div>
        </div>
      </div>` : ''}
      <div class="stat-row">
        <div class="stat"><div class="stat-label">총 매출</div><div class="stat-value num">${fmtSlim(t.revenue)}</div><div class="stat-delta flat">고객에게 받은 금액</div></div>
        <div class="stat"><div class="stat-label">총 매입</div><div class="stat-value num">${fmtSlim(t.cost)}</div><div class="stat-delta flat">업체에 지급한 금액</div></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat-label">현장 순이익</div><div class="stat-value num" style="color:var(--ink);">${fmtSigned(t.siteProfit)}</div><div class="stat-delta flat">매출 − 매입 − AS</div></div>
        <div class="stat"><div class="stat-label">이익률</div><div class="stat-value num">${t.margin}%</div><div class="stat-delta flat">목표 ${t.targetMargin}%</div></div>
      </div>`;

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">${now.getFullYear()}년 ${now.getMonth()+1}월 · ${M.company}</div>
        <h1 class="h-title" style="font-weight:500;">안녕하세요, ${M.user} ${M.role}님</h1>
      </div>
    </div>
    <div class="page-body">
      <div style="height:6px;background:#F1F1F5;margin:11px calc(-1 * var(--pad)) 25px;"></div>
      <div class="briefing-eyebrow">오늘의 브리핑</div>
      ${renderHomeProgressHtml()}
      <div style="height:6px;background:#F1F1F5;margin:25px calc(-1 * var(--pad));"></div>
      <div id="home-tips-section">${renderHomeTipsHtml()}</div>
      <div style="height:6px;background:#F1F1F5;margin:25px calc(-1 * var(--pad));"></div>
      <div class="section-label" style="margin-bottom:16px;">최근거래내역</div>
      ${renderRecentTxHtml()}
      ${AUTH.role() !== 'staff' ? pnlSection : ''}
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

// ===== 노하우 전용 페이지 =====
// 결과 영역(개수 + 목록 + 더보기)만 만드는 헬퍼 — 검색 입력 시 이 부분만 갱신해 포커스 유지
function tipsResultsHtml() {
  const tipsFilter = window._tipsFilter || 'all';
  const query = window._tipsSearch || '';
  const limit = window._tipsPageLimit || TIP_PAGE_SIZE;

  const all = getVisibleTips(tipsFilter, query);
  const shown = all.slice(0, limit);

  const listHtml = shown.length > 0
    ? shown.map(tipCardHtml).join('')
    : `<div class="empty" style="padding:28px 20px;font-size:13px;text-align:center;">${query ? '검색 결과가 없어요' : '기록이 없어요'}</div>`;

  const moreHtml = all.length > limit
    ? `<button class="tip-more-btn" data-tips-more="1" style="width:100%;padding:12px;margin:4px 0 8px;border:1px solid var(--hair);border-radius:14px;background:var(--surface-2,#f6f7f9);color:var(--accent);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">더보기 (${all.length - limit}개 더)</button>`
    : '';

  return `<div style="font-size:12px;color:var(--muted);margin:2px 2px 10px;">${all.length}개${query ? ` · "${query}" 검색` : ''}</div>
    ${listHtml}
    ${moreHtml}`;
}

function renderTips() {
  const tipsFilter = window._tipsFilter || 'all';
  const query = window._tipsSearch || '';
  const filterHtml = tipFilterChipsHtml(tipsFilter);

  return `
    <div class="breadcrumb"><button class="back-btn" data-goto="home"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 홈</button></div>
    <div class="page-header">
      <div><div class="h-eyebrow">전체 ${M.tips.length}건 기록됨</div><h1 class="h-title">💡 현장 노하우</h1></div>
      <button class="btn-icon" data-modal="tip" title="기록 추가">＋</button>
    </div>
    <div class="page-body">
      <div class="tip-search-wrap" style="margin-bottom:12px;">
        <input id="tips-search-input" type="search" placeholder="제목·현장·작성자 검색" value="${(query || '').replace(/"/g,'&quot;')}"
          style="width:100%;box-sizing:border-box;padding:11px 14px;border:1px solid var(--hair);border-radius:12px;font-size:14px;font-family:inherit;background:#fff;outline:none;">
      </div>
      <div class="tip-filter-row">${filterHtml}</div>
      <div id="tips-results">${tipsResultsHtml()}</div>
    </div>`;
}

function tapSite(el, siteName) {
  if (el) el.classList.add('tapped');
  openSiteDetail(siteName);
}
function openSiteDetail(siteName) {
  window._siteDetailName = siteName;
  const found = (window.MOCK?.sites||[]).find(s=>s.name===siteName);
  if (found) window.MOCK.sites = [found, ...(window.MOCK.sites.filter(s=>s.name!==siteName))];
  const key = siteName.replace(/[.#$/ \[\]]/g,'_');

  // 캐시 우선 — _procAll에 이미 있으면 즉시 렌더 (네트워크 대기 X)
  const cached = window.FB?._procAll?.[key];
  if (cached) {
    window._procCache = cached;
    navigate('siteDetail');
    // 백그라운드에서 최신 데이터 받아 갱신 (다음 렌더에 반영)
    db.ref('procData/'+key).once('value').then(snap=>{
      const fresh = snap.val()||{};
      if (!window.FB) window.FB={};
      if (!window.FB._procAll) window.FB._procAll={};
      window.FB._procAll[key] = fresh;
      // 캐시와 다르면 다시 그려서 최신 반영
      if (JSON.stringify(fresh) !== JSON.stringify(cached)) {
        window._procCache = fresh;
        if (window._siteDetailName === siteName && window.currentPage === 'siteDetail') {
          navigate('siteDetail');
        }
      }
    }).catch(()=>{});
    return;
  }
  // 캐시 없으면 — 네트워크 받고 렌더 (기존 흐름)
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
  inputState.sub = 'proc';
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

const SITE_STATUS_ORDER = ['공사중','계약완료','AS관리','마감'];
const SITE_STATUS_ICON = {'공사중':'🔨','계약완료':'📋','AS관리':'🔧','마감':'📁'};

// Firebase 저장만 담당 (UI 없음) — 성공 시 true
async function doSaveEntry() {
  const st = inputState;
  const site = (st.site || '').trim();
  const amount = parseInt(String(st.amount || '').replace(/[^0-9]/g,'')) || 0;
  const date = st.date || toToday();
  const memo = st.memo || '';
  const writer = st.inputter || AUTH.current()?.name || '';
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
  try { await window.FB_API.saveEntry(entry); return true; }
  catch(e) { return false; }
}

// 완료하기 → 저장중 화면 → 저장 완료 화면 (토스식)
async function startSave() {
  const st = inputState;
  const site = (st.site || '').trim();
  const amount = parseInt(String(st.amount || '').replace(/[^0-9]/g,'')) || 0;
  if (!site)   { alert('현장을 선택해주세요'); return; }
  if (!amount) { alert('금액을 입력해주세요'); return; }
  st.step = 5; st._saveDone = false; navigate('input');       // "저장하고 있어요"
  const minWait = new Promise(r => setTimeout(r, 900));        // 최소 노출 시간
  const ok = await doSaveEntry();
  await minWait;
  if (ok) { st._saveDone = true; navigate('input'); }         // "저장 완료!"
  else    { alert('저장 실패. 다시 시도해주세요.'); st.step = 4; navigate('input'); }
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
  const sites = (M.sites||[]);
  const q = query.trim().toLowerCase();
  const filtered = sites.filter(s=>!q||s.name.toLowerCase().includes(q));
  let html='';
  SITE_STATUS_ORDER.forEach(st=>{
    const arr = filtered.filter(s=>s.status===st||(st==='마감'&&!SITE_STATUS_ORDER.includes(s.status)));
    if (!arr.length) return;
    const icon = SITE_STATUS_ICON[st]||'📁';
    html+=`<div style="padding:6px 12px;font-size:13px;font-weight:700;color:var(--muted);background:var(--surface-2);">${icon} ${st}</div>`;
    html+=arr.map(s=>`<div onclick="selectSite('${s.name.replace(/'/g,"\\'")}');event.stopPropagation();"
      style="padding:12px 16px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--hair-soft);"
      onmousedown="event.preventDefault()">${s.name}</div>`).join('');
  });
  if (!html) html=`<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">검색 결과 없음</div>`;
  dd.innerHTML=html;
  document.getElementById('site-dropdown').style.display='block';
}
function selectSite(name) {
  inputState.site=name;
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
  if (st.step === 1) return inputStepTypeSite();   // 거래내용 입력 = 거래 종류(탭) + 현장 선택 통합
  if (st.step === 2) return inputStepDetail();      // 공정 · 상세내용 · 금액 통합
  if (st.step === 3) return inputStepConfirm();     // 입력 내용 확인 + 인증하기
  if (st.step === 4) return inputStepReceipt();     // 영수증 사진 인증 → 완료하기
  return inputStepSaving();                         // 5단계 = 저장중 → 저장 완료
}

// 2단계 통합 — 공정/결제 선택 → 상세내용 → 금액 (진행형)
function inputStepDetail() {
  const st = inputState;
  if (!st.sub) st.sub = 'proc';
  const isRev = st.tab === '매출';
  const ctxWord = isRev ? '매출액' : st.tab === 'AS' ? 'AS비용' : '매입액';
  const midLabel = isRev ? '결제 단계' : '공정';
  const midVal = isRev ? (st.stage||'') : (st.phase||'');
  const items = isRev ? (M.paymentStages||[]) : (M.phases||[]);
  const pickAct = isRev ? 'stage2' : 'proc2';
  const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
  const name = st.site || '';
  const dm = name.match(/\d+동/);
  const siteHtml = dm ? `<span style="color:var(--ink);">${name.slice(0,name.indexOf(dm[0])).trim()}</span> <span style="color:var(--muted);">${name.slice(name.indexOf(dm[0])).trim()}</span>` : `<span style="color:var(--ink);">${name}</span>`;
  const PENCIL = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
  const LAB = 'font-size:18px;font-weight:400;color:var(--ink);';
  const VAL = 'font-size:18px;font-weight:600;color:var(--ink);';
  const fieldLine = (l, v) => `<span style="${LAB}">${l}</span> <span style="${VAL}">${v}</span>`;
  const esc = v => String(v || '').replace(/"/g, '&quot;');

  const head = `
    <div style="display:flex;align-items:center;padding:12px var(--pad) 8px;">
      <button data-iact="back" style="width:32px;height:32px;border-radius:50%;border:0;background:none;cursor:pointer;font-size:24px;color:var(--ink);padding:0;">‹</button>
    </div>
    <div style="padding:0 var(--pad);">
      <div><span style="font-size:21px;font-weight:700;color:var(--ink);">${ctxWord}</span><span style="font-size:21px;font-weight:400;color:var(--muted);">을 입력중입니다</span></div>
      <div style="font-size:18px;font-weight:400;margin-top:8px;">${siteHtml}</div>
    </div>`;

  let content = '', bottom = '';
  if (st.sub === 'proc') {
    const btns = items.map(p => `<button data-iact="${pickAct}" data-val="${esc(p)}" style="display:flex;align-items:center;justify-content:center;margin:4px 0;background:none;border:0;padding:16px 0;font-size:16px;font-weight:500;font-family:inherit;cursor:pointer;color:var(--ink);">${p}</button>`).join('');
    const direct = `<button data-iact="proc2-direct" style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;margin:4px 0;background:none;border:0;padding:16px 0;font-size:16px;font-weight:500;font-family:inherit;cursor:pointer;color:var(--ink);">직접입력 ${PENCIL}</button>`;
    content = `<div style="padding:22px var(--pad) 0;">
        <div style="${LAB}margin-bottom:20px;">${midLabel} 선택</div>
        <div style="border:1px solid var(--hair);border-radius:10px;overflow:hidden;">
          <div style="display:grid;grid-template-columns:repeat(3,1fr);">${btns}</div>
          <div style="width:40px;height:1px;background:var(--hair);margin:4px auto;"></div>
          ${direct}
        </div>
      </div>`;
  } else if (st.sub === 'detail') {
    content = `<div style="padding:22px var(--pad) 0;">
        <div>${fieldLine(midLabel, midVal)}</div>
        <div style="${LAB}margin-top:26px;">상세내용</div>
        <div style="position:relative;margin:12px 0;">
          <input id="iflow-detail" placeholder="예) 걸레받이 교체, 자재비" value="${esc(st.memo)}" onkeydown="if(event.key==='Enter'){event.preventDefault();handleInputFlow('detail-ok',this);}"
            style="width:100%;box-sizing:border-box;border:1.5px solid var(--hair);border-radius:12px;padding:14px 72px 14px 14px;font-size:19px;font-family:inherit;outline:none;">
          <button data-iact="detail-ok" id="iflow-detail-ok" style="display:${(st.memo||'').trim()?'block':'none'};position:absolute;right:8px;top:50%;transform:translateY(-50%);background:var(--ink);color:#fff;border:0;border-radius:9px;padding:8px 12px;font-size:17px;font-weight:700;font-family:inherit;cursor:pointer;">확인</button>
        </div>
      </div>`;
  } else {
    const keys = ['1','2','3','4','5','6','7','8','9','00','0','del'];
    const pad = `<div style="display:grid;grid-template-columns:repeat(3,1fr);">${keys.map(k => `<button data-iact="key2" data-val="${k}" style="background:none;border:0;padding:13px 0;font-size:27px;font-weight:500;font-family:inherit;cursor:pointer;color:var(--ink);">${k==='del'?'⌫':k}</button>`).join('')}</div>`;
    const nextBtn = amt ? `<button data-iact="detail-next" style="width:100%;background:var(--ink);color:#fff;border:0;border-radius:12px;padding:15px;font-size:19px;font-weight:700;font-family:inherit;cursor:pointer;margin-bottom:8px;">다음</button>` : '';
    content = `<div style="padding:22px var(--pad) 0;">
        <div>${fieldLine(midLabel, midVal)}</div>
        <div style="margin-top:20px;">${fieldLine('상세내용', (st.memo||'').trim()||'(없음)')}</div>
        <div style="margin-top:28px;font-size:27px;font-weight:${amt?'700':'500'};color:${amt?'var(--ink)':'#8B95A1'};">${amt ? amt.toLocaleString('ko-KR')+'원' : '금액을 입력해주세요'}</div>
      </div>`;
    bottom = `<div style="padding:0 var(--pad) 6px;">${nextBtn}${pad}</div>`;
  }

  return `<div style="display:flex;flex-direction:column;min-height:calc(100dvh - var(--tabbar-h) - env(safe-area-inset-top) - env(safe-area-inset-bottom));">${head}${content}<div style="flex:1;min-height:12px;"></div>${bottom}</div>`;
}

// 1단계 통합 화면 — 상단 매입/매출/AS 탭 + 현장 검색/목록
function inputStepTypeSite() {
  const st = inputState;
  const PIN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.686-6-10a6 6 0 0112 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
  const tabHtml = ['매입','매출','AS'].map(t => {
    const on = st.tab === t;
    return `<button data-iact="tab" data-val="${t}" style="flex:1;background:none;border:0;padding:0 0 10px;cursor:pointer;font-family:inherit;font-size:18px;font-weight:${on?'700':'500'};color:${on?'var(--ink)':'var(--muted)'};position:relative;text-align:center;">${t}<span style="position:absolute;left:0;right:0;bottom:-1px;height:2.5px;background:${on?'var(--ink)':'transparent'};border-radius:2px;"></span></button>`;
  }).join('');
  const cur = String(st.site||'').replace(/"/g,'&quot;');
  return `
    <div style="display:flex;align-items:center;gap:6px;padding:12px var(--pad) 8px;">
      <button onclick="navigate('home')" aria-label="닫기" style="width:32px;height:32px;border-radius:50%;border:0;background:none;cursor:pointer;font-size:22px;color:var(--ink);flex-shrink:0;padding:0;">‹</button>
    </div>
    <h1 class="h-title" style="font-weight:600;margin:0 var(--pad) 34px;">거래내용 입력</h1>
    <div style="display:flex;padding:0 var(--pad);border-bottom:1px solid var(--hair);">${tabHtml}</div>
    <div style="padding:16px var(--pad) 0;">
      <div style="display:flex;align-items:center;gap:8px;background:var(--surface-2,#F2F4F6);border-radius:12px;padding:14px;">
        <input id="iflow-site-search" placeholder="현장명 입력" autocomplete="off" value="${cur}"
          style="flex:1;border:0;background:none;outline:none;font-size:16px;font-family:inherit;color:var(--ink);">
        <span style="color:var(--faint);display:flex;">${ICON.search}</span>
      </div>
    </div>
    <div id="iflow-site-list" style="padding:8px var(--pad) 28px;">${inputSiteRowsNew('')}</div>`;
}

function inputSiteRowsNew(q) {
  const st = inputState;
  const sites = (M.sites||[]);
  const query = (q||'').trim().replace(/\s/g,'');
  const PIN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.686-6-10a6 6 0 0112 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
  const ava = `<div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:#fff;border:1px solid var(--hair);display:flex;align-items:center;justify-content:center;">${PIN}</div>`;
  const row = s => `<button data-iact="site" data-val="${String(s.name).replace(/"/g,'&quot;')}" style="display:flex;align-items:center;gap:14px;width:100%;background:none;border:0;padding:12px 2px;cursor:pointer;font-family:inherit;text-align:left;">
      ${ava}
      <span style="flex:1;min-width:0;">
        <span style="display:block;font-size:15px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
        <span style="display:block;font-size:13px;font-weight:400;color:var(--muted);margin-top:3px;">${s.status||''}</span>
      </span>
    </button>`;
  const label = t => `<div style="font-size:15px;font-weight:600;color:var(--ink);margin:16px 2px 2px;">${t}</div>`;
  if (query) {
    const all = sites.filter(s => String(s.name).replace(/\s/g,'').indexOf(query) > -1);
    const directBtn = `<button data-iact="site-direct" style="display:flex;align-items:center;gap:14px;width:100%;background:none;border:0;padding:12px 2px;cursor:pointer;font-family:inherit;text-align:left;">
        <span style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:400;">＋</span>
        <span style="font-size:15px;font-weight:600;color:var(--accent);">'${(q||'').trim()}'(으)로 새 현장 입력</span>
      </button>`;
    return (all.length ? label(`검색 결과 ${all.length}건`) + all.map(row).join('') : '') + directBtn;
  }
  const gongsa = sites.filter(s => s.status === '공사중');
  const recent = sites.filter(s => s.status !== '공사중');
  let html = '';
  if (gongsa.length) html += label('공사중 현장') + gongsa.map(row).join('');
  if (recent.length) html += label('최근 현장') + recent.map(row).join('');
  return html || `<div style="padding:20px 2px;color:var(--muted);font-size:14px;">등록된 현장이 없어요 · 위 입력창에 이름을 입력하세요</div>`;
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
      <div style="font-size:13.5px;color:var(--muted);margin-bottom:16px;">거래 종류를 먼저 선택하세요</div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${types.map(([k,ic,desc])=>`
          <button data-iact="type" data-val="${k}" style="display:flex;align-items:center;gap:13px;background:#fff;border:1.5px solid ${_iBorder(inputState.tab===k)};border-radius:14px;padding:16px 14px;cursor:pointer;font-family:inherit;text-align:left;">
            <span style="font-size:24px;">${ic}</span>
            <span style="flex:1;min-width:0;">
              <span style="display:block;font-size:15px;font-weight:700;">${k}</span>
              <span style="display:block;font-size:13px;color:var(--muted);margin-top:2px;">${desc}</span>
            </span>
            <span style="color:#ccc;font-size:18px;">›</span>
          </button>`).join('')}
      </div>
      <div style="margin-top:18px;background:var(--accent-soft);border:1px solid var(--accent);border-radius:12px;padding:12px 14px;display:flex;align-items:flex-start;gap:10px;">
        <span style="font-size:18px;line-height:1.2;">🧾</span>
        <span style="flex:1;font-size:13px;color:var(--ink);line-height:1.55;">
          <strong style="font-weight:700;">매입·매출 내용을 증빙할 수 있는 영수증 사진을 준비해주세요</strong>
          <span style="display:block;color:var(--muted);font-size:12.5px;margin-top:2px;">마지막 단계에서 첨부할 수 있어요</span>
        </span>
      </div>
    </div>`;
}

function inputSiteRows(q) {
  const sites = (M.sites||[]);
  const query = (q||'').trim();
  const filtered = sites.filter(s=>!query||s.name.indexOf(query)>-1);
  if (!filtered.length) return `<div style="font-size:13.5px;color:var(--muted);padding:10px 2px;line-height:1.5;">목록에 없어요. 위 버튼으로 입력한 이름을 그대로 쓸 수 있어요.</div>`;
  const grouped = {};
  SITE_STATUS_ORDER.forEach(st=>{ grouped[st]=[]; });
  filtered.forEach(s=>{
    const key = SITE_STATUS_ORDER.includes(s.status) ? s.status : '마감';
    grouped[key].push(s);
  });
  let html = '';
  SITE_STATUS_ORDER.forEach(st=>{
    const arr = grouped[st];
    if (!arr.length) return;
    const icon = SITE_STATUS_ICON[st]||'📁';
    html += `<div style="font-size:12px;color:var(--muted);font-weight:700;padding:6px 2px 4px;margin-top:4px;">${icon} ${st} <span style="font-weight:400;">(${arr.length})</span></div>`;
    arr.forEach(s=>{
      html += `<button data-iact="site" data-val="${String(s.name).replace(/"/g,'&quot;')}" style="display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid var(--hair);border-radius:12px;padding:13px;cursor:pointer;font-family:inherit;text-align:left;font-size:13.5px;">
        <span style="flex:1;min-width:0;">${s.name}</span>
        <span style="color:#ccc;font-size:16px;">›</span>
      </button>`;
    });
  });
  return html;
}

function inputStepSite() {
  const cur = String(inputState.site||'').replace(/"/g,'&quot;');
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">어느 현장이에요?</div>
      <div style="font-size:13.5px;color:var(--muted);margin-bottom:14px;">현장을 선택하거나 검색·직접 입력하세요</div>
      <div style="display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid var(--hair);border-radius:11px;padding:11px 13px;margin-bottom:8px;">
        <span style="color:var(--muted);display:flex;">${ICON.search}</span>
        <input id="iflow-site-search" placeholder="현장명 검색 또는 직접 입력" autocomplete="off" value="${cur}"
          style="border:0;background:transparent;font-family:inherit;font-size:13.5px;flex:1;outline:none;color:var(--ink);">
      </div>
      <button data-iact="site-direct" style="width:100%;text-align:left;background:var(--warn-soft);border:1.5px dashed var(--warn);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--warn);font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:16px;">
        ✏️ 입력한 이름으로 진행하기
      </button>
      <div style="font-size:13px;color:var(--muted);font-weight:700;margin-bottom:8px;">현장 목록</div>
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
        <div style="font-size:13.5px;color:var(--muted);margin-bottom:16px;">${st.site||''}</div>
        <div style="display:flex;flex-wrap:wrap;gap:9px;">
          ${(M.paymentStages||[]).map(s=>{
            const on = st.stage===s;
            return `<button data-iact="stage" data-val="${s}" style="display:flex;align-items:center;gap:6px;background:${on?'#191F28':'#fff'};color:${on?'#fff':'var(--ink)'};border:1.5px solid ${on?'#191F28':'var(--hair)'};border-radius:22px;padding:11px 16px;font-size:13.5px;font-family:inherit;cursor:pointer;">${stageIcons[s]||''} ${s}</button>`;
          }).join('')}
        </div>
      </div>`;
  }
  const customPhase = st.phase && !(M.phases||[]).includes(st.phase);
  return `
    <div style="padding:0 var(--pad);">
      <div style="font-size:15px;font-weight:700;margin-bottom:4px;">어떤 공정이에요?</div>
      <div style="font-size:13.5px;color:var(--muted);margin-bottom:16px;">${st.site||''}</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${(M.phases||[]).map(p=>{
          const on = st.phase===p;
          return `<button data-iact="proc" data-val="${p}" style="display:flex;align-items:center;justify-content:center;height:44px;background:${on?'#191F28':'#fff'};color:${on?'#fff':'var(--ink)'};border:1.5px solid ${on?'#191F28':'var(--hair)'};border-radius:12px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;">${p}</button>`;
        }).join('')}
        <button data-iact="proc-direct" style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;gap:6px;height:44px;background:${customPhase?'#2F6B47':'var(--accent-soft)'};color:${customPhase?'#fff':'var(--accent)'};border:1.5px dashed ${customPhase?'#2F6B47':'var(--accent)'};border-radius:12px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;">✏️ ${customPhase?st.phase:'직접입력'}</button>
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
      <div style="font-size:13.5px;color:var(--muted);margin-bottom:6px;">${st.tab}${midV?' · '+midV:''}</div>
      <div style="text-align:center;font-size:34px;font-weight:800;margin:16px 0 6px;">
        <span id="iflow-amount" style="color:${amt?'var(--ink)':'#cbc3b4'};">${amt.toLocaleString('ko-KR')}</span><span style="font-size:18px;margin-left:3px;">원</span>
      </div>
      <div style="display:flex;gap:7px;justify-content:center;margin-bottom:14px;">
        ${[['+1만',10000],['+10만',100000],['+100만',1000000]].map(([l,v])=>`<button data-iact="quick" data-val="${v}" style="background:#fff;border:1.5px solid var(--hair);border-radius:18px;padding:7px 13px;font-size:13px;font-family:inherit;cursor:pointer;color:var(--accent);font-weight:700;">${l}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:16px;">
        ${keys.map(k=>`<button data-iact="key" data-val="${k}" style="background:#fff;border:1.5px solid var(--hair);border-radius:12px;padding:15px 0;font-size:19px;font-weight:700;font-family:inherit;cursor:pointer;">${k==='del'?'⌫':k}</button>`).join('')}
      </div>
      <button data-iact="amount-next" id="iflow-next" class="btn btn-primary btn-block"${amt?'':' disabled'} style="${amt?'':'opacity:.5;'}">다음</button>
    </div>`;
}

// 4단계 — 영수증 사진 촬영 인증 (1장) → 완료하기
function inputStepReceipt() {
  const photos = window._entryPhotos || [];
  const has = photos.length > 0;
  const camBox = `<button type="button" onclick="entryOpenCamera()" style="width:250px;height:250px;margin:0 auto;background:var(--surface-2);border:0;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;font-family:inherit;">
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <span style="font-size:16px;font-weight:700;color:var(--ink);">카메라로 촬영</span>
    </button>`;
  const photoBox = `<div style="position:relative;width:250px;height:250px;margin:0 auto;">
      <img src="${has?photos[0]:''}" style="width:250px;height:250px;object-fit:cover;border-radius:16px;border:1px solid var(--hair);">
      <button onclick="entryRemovePhoto(0)" aria-label="사진 삭제" style="position:absolute;top:-8px;right:-8px;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;border:0;font-size:14px;cursor:pointer;line-height:1;">✕</button>
    </div>`;
  return `
    <div style="display:flex;flex-direction:column;min-height:calc(100dvh - var(--tabbar-h) - env(safe-area-inset-top) - env(safe-area-inset-bottom));">
      <div style="display:flex;align-items:center;padding:12px var(--pad) 8px;">
        <button data-iact="back" style="width:32px;height:32px;border-radius:50%;border:0;background:none;cursor:pointer;font-size:24px;color:var(--ink);padding:0;">‹</button>
      </div>
      <div style="padding:0 var(--pad);">
        <div><span style="font-size:21px;font-weight:700;color:var(--ink);">영수증</span><span style="font-size:21px;font-weight:400;color:var(--muted);">을 촬영해 인증해주세요</span></div>
      </div>
      <div style="padding:24px var(--pad) 0;">
        ${has ? photoBox : camBox}
        <button type="button" onclick="entryOpenGallery()" style="width:100%;background:none;border:0;margin-top:8px;padding:0;font-size:15px;font-weight:500;color:var(--ink);cursor:pointer;font-family:inherit;">갤러리에서 엘범 선택</button>
        <input type="file" id="entry-file-camera" accept="image/*" capture="environment" style="display:none" onchange="entryHandleFile(event)">
        <input type="file" id="entry-file-gallery" accept="image/*" style="display:none" onchange="entryHandleFile(event)">
      </div>
      <div style="flex:1;min-height:16px;"></div>
      <div style="padding:0 var(--pad) 12px;min-height:20px;">
        ${has ? `<button data-iact="submit" style="width:100%;background:var(--ink);color:#fff;border:0;border-radius:14px;padding:17px;font-size:19px;font-weight:700;font-family:inherit;cursor:pointer;">완료하기</button>` : ''}
      </div>
    </div>`;
}

// 5단계 — 저장중 → 저장 완료
function inputStepSaving() {
  const st = inputState;
  const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
  const amtStr = amt.toLocaleString('ko-KR');
  const site = st.site || '';
  const done = !!st._saveDone;
  const full = 'min-height:calc(100dvh - var(--tabbar-h) - env(safe-area-inset-top) - env(safe-area-inset-bottom));';
  const center = inner => `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px;">${inner}</div>`;
  const coin = `<div style="width:72px;height:72px;border-radius:50%;border:1.5px solid var(--hair);box-shadow:0 6px 16px rgba(0,0,0,0.16);display:flex;align-items:center;justify-content:center;box-sizing:border-box;"><span style="font-size:34px;font-weight:800;color:var(--ink);line-height:1;">₩</span></div>`;
  const check = `<svg width="72" height="72" viewBox="0 0 72 72" fill="none"><circle cx="36" cy="36" r="36" fill="var(--accent)"/><path d="M22 37l10 10 18-20" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  // 현장명: 아파트명 700/ink + 동·호수 400/muted
  const dm = site.match(/\d+동/);
  const siteHtml = dm
    ? `<span style="font-weight:300;color:var(--ink);">${site.slice(0,site.indexOf(dm[0])).trim()}</span> <span style="font-weight:300;color:var(--muted);">${site.slice(site.indexOf(dm[0])).trim()}</span>`
    : `<span style="font-weight:300;color:var(--ink);">${site}</span>`;
  // [입력값] 800/ink + 원을 500/muted
  const amtLine = `<span style="font-weight:800;color:var(--ink);">${amtStr}</span><span style="font-weight:500;color:var(--muted);">원을</span>`;
  // 현장명 + 금액 (22px 한 블록, 줄바꿈)
  const block = `<div style="font-size:22px;line-height:1.4;margin-top:22px;">${siteHtml}<br>${amtLine}</div>`;
  if (!done) {
    return `<div style="display:flex;flex-direction:column;${full}">${center(`
      <div>${coin}</div>
      ${block}
      <div style="display:flex;align-items:center;gap:8px;margin-top:10px;">
        <span style="width:16px;height:16px;border:2px solid var(--hair);border-top-color:var(--accent);border-radius:50%;display:inline-block;animation:spin .7s linear infinite;"></span>
        <span style="font-size:22px;font-weight:500;color:var(--faint);">저장하고 있어요</span>
      </div>`)}</div>`;
  }
  return `<div style="display:flex;flex-direction:column;${full}">
      ${center(`
        <div>${check}</div>
        <div style="font-size:22px;line-height:1.4;margin-top:22px;">${siteHtml}<br>${amtLine}<br><span style="font-weight:500;color:var(--ink);">저장 완료!</span></div>`)}
      <div style="padding:0 var(--pad) 12px;">
        <button data-iact="save-done-ok" style="width:100%;background:var(--ink);color:#fff;border:0;border-radius:14px;padding:17px;font-size:19px;font-weight:700;font-family:inherit;cursor:pointer;">확인</button>
      </div>
    </div>`;
}

// 3단계 — 입력 내용 확인 (현장·공정·상세·금액 + 작성자 자동) → 인증하기
function inputStepConfirm() {
  const st = inputState;
  if (!st.date) st.date = toToday();
  const isRev = st.tab === '매출';
  const ctxWord = isRev ? '매출액' : st.tab === 'AS' ? 'AS비용' : '매입액';
  const midLabel = isRev ? '결제 단계' : '공정';
  const midVal = isRev ? (st.stage||'-') : (st.phase||'-');
  const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
  const memo = (st.memo||'').trim() || '(없음)';
  // 작성자(입력자) = 로그인한 사용자 아이디 자동 지정
  const writer = (window.AUTH && AUTH.current && AUTH.current()?.name) || st.inputter || '';
  st.inputter = writer;
  const name = st.site || '';
  const dm = name.match(/\d+동/);
  const siteHtml = dm
    ? `<span style="color:var(--ink);">${name.slice(0,name.indexOf(dm[0])).trim()}</span> <span style="color:var(--muted);">${name.slice(name.indexOf(dm[0])).trim()}</span>`
    : `<span style="color:var(--ink);">${name}</span>`;
  const LAB = 'font-size:18px;font-weight:400;color:var(--ink);';
  const VAL = 'font-size:18px;font-weight:600;color:var(--ink);';
  const fieldLine = (l, v) => `<span style="${LAB}">${l}</span> <span style="${VAL}">${v}</span>`;
  return `
    <div style="display:flex;flex-direction:column;min-height:calc(100dvh - var(--tabbar-h) - env(safe-area-inset-top) - env(safe-area-inset-bottom));">
      <div style="display:flex;align-items:center;padding:12px var(--pad) 8px;">
        <button data-iact="back" style="width:32px;height:32px;border-radius:50%;border:0;background:none;cursor:pointer;font-size:24px;color:var(--ink);padding:0;">‹</button>
      </div>
      <div style="padding:0 var(--pad);">
        <div><span style="font-size:21px;font-weight:700;color:var(--ink);">입력 내용</span><span style="font-size:21px;font-weight:400;color:var(--muted);">을 확인해주세요</span></div>
      </div>
      <div style="padding:26px var(--pad) 0;">
        <div style="font-size:18px;font-weight:400;">${siteHtml}</div>
        <div style="margin-top:18px;">${fieldLine(midLabel, midVal)}</div>
        <div style="margin-top:16px;">${fieldLine('상세내용', memo)}</div>
        <div style="margin-top:30px;font-size:15px;font-weight:400;color:var(--muted);">${ctxWord}</div>
        <div style="margin-top:2px;font-size:32px;font-weight:800;letter-spacing:-0.03em;color:var(--ink);">${amt.toLocaleString('ko-KR')}<span style="font-size:20px;font-weight:700;">원</span></div>
      </div>
      <div style="flex:1;min-height:16px;"></div>
      <div style="padding:0 var(--pad) 6px;">
        <div style="text-align:center;font-size:13px;color:var(--faint);margin-bottom:14px;">작성자 · ${writer||'-'}</div>
        <button data-iact="to-receipt" style="width:100%;background:var(--ink);color:#fff;border:0;border-radius:14px;padding:17px;font-size:19px;font-weight:700;font-family:inherit;cursor:pointer;">인증하기</button>
      </div>
    </div>`;
}

function handleInputFlow(act, el) {
  const st = inputState;
  if (act==='tab') {
    st.tab = el.dataset.val; st.phase=''; st.stage=''; navigate('input');   // 종류 탭 변경 (같은 화면 유지)
  } else if (act==='site') {
    st.site = el.dataset.val; st.step=2; st.sub='proc'; navigate('input');
  } else if (act==='site-direct') {
    const inp = document.getElementById('iflow-site-search');
    const v = (inp && inp.value.trim()) || '';
    if (!v) { alert('현장명을 입력하거나 목록에서 선택해주세요'); return; }
    st.site = v; st.step=2; st.sub='proc'; navigate('input');
  } else if (act==='proc2') {
    st.phase = el.dataset.val; st.sub='detail'; navigate('input');
    setTimeout(()=>document.getElementById('iflow-detail')?.focus(), 60);
  } else if (act==='stage2') {
    st.stage = el.dataset.val; st.sub='detail'; navigate('input');
    setTimeout(()=>document.getElementById('iflow-detail')?.focus(), 60);
  } else if (act==='proc2-direct') {
    const v = (prompt('공정명을 직접 입력하세요') || '').trim();
    if (!v) return;
    st.phase = v; st.sub='detail'; navigate('input');
    setTimeout(()=>document.getElementById('iflow-detail')?.focus(), 60);
  } else if (act==='detail-ok') {
    const inp = document.getElementById('iflow-detail');
    st.memo = (inp && inp.value.trim()) || '';
    st.sub='amount'; navigate('input');
  } else if (act==='key2') {
    let cur = String(st.amount||'').replace(/[^0-9]/g,'');
    const v = el.dataset.val;
    if (v==='del') cur = cur.slice(0,-1); else cur = cur + v;
    cur = cur.replace(/^0+/,''); if (cur.length>12) cur = cur.slice(0,12);
    st.amount = cur; navigate('input');
  } else if (act==='detail-next') {
    const amt = parseInt(String(st.amount||'').replace(/[^0-9]/g,'')) || 0;
    if (!amt) { alert('금액을 입력해주세요'); return; }
    st.step=3; st.sub=undefined; navigate('input');
  } else if (act==='proc') {
    st.phase = el.dataset.val; st.step=3; navigate('input');
  } else if (act==='proc-direct') {
    const v = (prompt('공정명을 직접 입력하세요') || '').trim();
    if (!v) return;
    st.phase = v; st.step=3; navigate('input');
  } else if (act==='stage') {
    st.stage = el.dataset.val; st.step=3; navigate('input');
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
    st.step=4; navigate('input');
  } else if (act==='to-receipt') {
    st.step=4; navigate('input');
  } else if (act==='back') {
    if (st.step===2) {
      if (st.sub==='amount') { st.sub='detail'; navigate('input'); setTimeout(()=>document.getElementById('iflow-detail')?.focus(),60); }
      else if (st.sub==='detail') { st.sub='proc'; navigate('input'); }
      else { st.step=1; navigate('input'); }
    } else if (st.step===3) { st.step=2; st.sub='amount'; navigate('input'); }
    else if (st.step===4) { st.step=3; navigate('input'); }
    else if (st.step>1) { st.step--; navigate('input'); }
  } else if (act==='next') {
    st.step++; navigate('input');
  } else if (act==='goto') {
    const gs = parseInt(el.dataset.step,10) || 1;
    st.step = gs; if (gs===2) st.sub='proc'; navigate('input');
  } else if (act==='invoice') {
    st.invoice = !st.invoice; navigate('input');
  } else if (act==='pending') {
    openPendingList();
  } else if (act==='submit') {
    startSave();
  } else if (act==='save-done-ok') {
    resetInputFlow(); inputState.step=1; navigate('input');
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
  const files = Array.from(e.target.files||[]);
  if (files.length && (window._entryPhotos||[]).length < 1) {   // 영수증 1장만
    const r=new FileReader();
    r.onload=ev=>{
      window._entryPhotos=[ev.target.result];
      if (currentPage==='input' && inputState.step===4) navigate('input');
    };
    r.readAsDataURL(files[0]);
  }
  e.target.value='';
}
// 영수증 미리보기는 inputStepReceipt가 window._entryPhotos에서 직접 렌더 (navigate 재호출 시 no-op)
function entryRenderPhotos() {}
function entryRemovePhoto(idx) {
  window._entryPhotos.splice(idx,1);
  if (currentPage==='input' && inputState.step===4) navigate('input');
}

// ===== SITES =====
let sitesFilter='공사중';
let _siteYear = new Date().getFullYear();
let _siteMonth = new Date().getMonth() + 1;
let _siteSortDesc = true;

function siteMonthShift(delta) {
  let m = _siteMonth + delta, y = _siteYear;
  if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
  _siteMonth = m; _siteYear = y;
  navigate('sites');
}
function siteSortToggle() {
  _siteSortDesc = !_siteSortDesc;
  navigate('sites');
}

// 현장 관리 — 월별 일정 리스트 (scheduleData 기반)
function renderSites() {
  const y = _siteYear, mo = _siteMonth;
  const ymNum = y * 100 + mo;
  const schedules = window.FB?.scheduleData || {};
  const PIN = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.686-6-10a6 6 0 0112 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>';
  const SORT = '<svg width="15" height="15" viewBox="0 0 12 14" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 5V12M3.5 12L1.5 10M3.5 12L5.5 10"/><path d="M8.5 9V2M8.5 2L6.5 4M8.5 2L10.5 4"/></svg>';
  const FILTER = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>';
  const PENCIL = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>';
  const fmtD = ds => `${parseInt(ds.slice(5, 7), 10)}월 ${parseInt(ds.slice(8, 10), 10)}일`;

  // 1) 직접 입력한 일정 (현장 지정된 것만)
  const schedRows = Object.entries(schedules).map(([key, sc]) => ({
    kind: 'sched', key, site: sc.site || '', title: sc.title || '',
    start: sc.date || '', end: sc.endDate || sc.date || '',
  })).filter(r => r.site && r.start);

  // 2) 모든 현장의 실제 공사 기간 — "A/S(AS)" 공정은 제외하고 "공사중"으로 표기
  const isASphase = nm => (nm || '').toUpperCase().replace(/[\s/]/g, '').includes('AS');
  const constRows = (M.sites || []).map(s => {
    const pk = (s.name || '').replace(/[.#$/ \[\]]/g, '_');
    const pd = window.FB?._procAll?.[pk] || {};
    const starts = [], ends = [];
    Object.values(pd).forEach(p => {
      if (isASphase(p.name)) return;   // A/S(AS) 공정은 공사 기간에서 제외
      if (p.startDate) { starts.push(p.startDate); ends.push(p.doneDate || p.startDate); }
      else if (p.doneDate) ends.push(p.doneDate);
    });
    if (!starts.length) return null;
    starts.sort(); ends.sort();
    return { kind: 'const', key: s.name, site: s.name, title: '공사중', active: true, start: starts[0], end: ends[ends.length - 1] };
  }).filter(Boolean);

  const filtered = [...constRows, ...schedRows].filter(r => {
    if (!r.start) return false;
    const sYM = parseInt(r.start.slice(0, 4), 10) * 100 + parseInt(r.start.slice(5, 7), 10);
    const eYM = r.end ? parseInt(r.end.slice(0, 4), 10) * 100 + parseInt(r.end.slice(5, 7), 10) : sYM;
    return sYM <= ymNum && ymNum <= eYM;
  });

  // 현장별 그룹핑 — 공사중 현장을 맨 위로, 그 다음 최근 일정순
  const gmap = {};
  filtered.forEach(r => { (gmap[r.site] = gmap[r.site] || []).push(r); });
  const groups = Object.entries(gmap).map(([site, items]) => {
    items.sort((a, b) => { const d = a.start < b.start ? -1 : a.start > b.start ? 1 : 0; return _siteSortDesc ? -d : d; });
    const ds = items.map(i => i.start).sort();
    return { site, items, active: items.some(i => i.kind === 'const' && i.active), latest: ds[ds.length - 1], earliest: ds[0] };
  });
  groups.sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    const ka = _siteSortDesc ? a.latest : a.earliest, kb = _siteSortDesc ? b.latest : b.earliest;
    const d = ka < kb ? -1 : ka > kb ? 1 : 0;
    return _siteSortDesc ? -d : d;
  });

  const listHtml = groups.length ? groups.map((g, gi) => {
    const evHtml = g.items.map(r => {
      const crossY = r.end && r.start.slice(0, 4) !== r.end.slice(0, 4);
      const fD = ds => crossY ? `${ds.slice(2, 4)}.${parseInt(ds.slice(5, 7), 10)}.${parseInt(ds.slice(8, 10), 10)}` : fmtD(ds);
      const period = (!r.end || r.end === r.start) ? fmtD(r.start) : `${fD(r.start)} ~ ${fD(r.end)}`;
      const onclick = r.kind === 'const' ? `openSiteDetail('${r.site.replace(/'/g, "\\'")}')` : `modalSchedule('${r.key}')`;
      const c = (r.kind === 'const' && r.active) ? 'var(--accent)' : 'var(--ink-2)';
      const w = '700';
      return `<div onclick="${onclick}" style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:7px 0;cursor:pointer;">
          <span style="font-size:13px;color:var(--muted);white-space:nowrap;">${period}</span>
          <span style="display:flex;align-items:center;gap:6px;min-width:0;">
            <span style="font-size:13px;font-weight:${w};color:${c};text-align:right;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.title}</span>
            ${r.kind !== 'const' ? PENCIL : ''}
          </span>
        </div>`;
    }).join('');
    return `
      ${gi > 0 ? '<div style="height:1px;background:var(--hair-soft);margin:6px 0;"></div>' : ''}
      <div onclick="openSiteDetail('${g.site.replace(/'/g, "\\'")}')" style="display:flex;align-items:center;gap:12px;padding:8px 2px 2px;cursor:pointer;">
        <div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;background:#fff;border:1px solid var(--hair);display:flex;align-items:center;justify-content:center;">${PIN}</div>
        <div style="flex:1;min-width:0;font-size:15px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${g.site}</div>
        <span style="flex-shrink:0;color:var(--faint);width:25px;height:25px;display:inline-flex;align-items:center;justify-content:center;font-size:25px;">›</span>
      </div>
      <div style="padding-left:52px;">${evHtml}</div>`;
  }).join('') : `<div class="empty" style="padding:40px 20px;font-size:15px;">${mo}월 일정이 없어요</div>`;

  return `
    <div class="page-header">
      <div><h1 class="h-title" style="font-weight:600;">현장 관리</h1></div>
    </div>
    <div class="page-body">
      <div style="display:flex;align-items:center;justify-content:center;gap:28px;margin:4px 0 16px;">
        <button onclick="siteMonthShift(-1)" aria-label="이전 달" style="background:none;border:0;cursor:pointer;color:var(--faint);font-size:35px;line-height:1;padding:0 4px;font-family:inherit;">‹</button>
        <span style="font-size:25px;font-weight:700;color:var(--ink);min-width:70px;text-align:center;">${mo}월</span>
        <button onclick="siteMonthShift(1)" aria-label="다음 달" style="background:none;border:0;cursor:pointer;color:var(--faint);font-size:35px;line-height:1;padding:0 4px;font-family:inherit;">›</button>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding:0 2px;">
        <button onclick="siteSortToggle()" style="background:none;border:0;cursor:pointer;font-size:13px;color:var(--muted);display:flex;align-items:center;gap:5px;font-family:inherit;">${_siteSortDesc ? '최근과거순' : '과거최근순'} ${SORT}</button>
        <button style="background:none;border:0;cursor:pointer;font-size:13px;color:var(--muted);display:flex;align-items:center;gap:5px;font-family:inherit;">상세검색 ${FILTER}</button>
      </div>
      <div style="height:1px;background:var(--hair);margin:10px 0;"></div>
      ${listHtml}
    </div>
    <button data-modal="site" class="site-fab">현장추가</button>`;
}

// ===== Router =====
const routes={
  home:       { render:renderHome,   tab:'home' },
  tips:       { render:renderTips,   tab:'home' },
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
  const enteringDetail = page==='siteDetail' && currentPage!=='siteDetail';
  // 노하우 페이지에 새로 진입할 때 검색어·더보기 상태 초기화
  if (page==='tips' && currentPage!=='tips') { window._tipsPageLimit=TIP_PAGE_SIZE; window._tipsSearch=''; }
  currentPage=page; window.currentPage=page;
  const activeTab=routes[page].tab;
  $$('.tabbar-item,.tabbar-fab').forEach(b=>b.classList.toggle('is-active',b.dataset.page===activeTab));
  $('#app').innerHTML=`<div class="page is-active${enteringDetail?' page-enter':''}">${routes[page].render()}</div>`;
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
  const tipFilter=e.target.closest('[data-tip-filter]');
  if (tipFilter&&(currentPage==='home'||currentPage==='tips')) {
    window._tipsFilter=tipFilter.dataset.tipFilter;
    window._tipsPageLimit=TIP_PAGE_SIZE;
    if (currentPage==='tips') {
      // 필터칩 활성 상태 + 결과만 갱신 (전체 리렌더로 검색창 포커스 잃지 않게)
      document.querySelectorAll('[data-tip-filter]').forEach(c=>c.classList.toggle('is-active', c.dataset.tipFilter===window._tipsFilter));
      const box=document.getElementById('tips-results'); if (box) box.innerHTML=tipsResultsHtml();
    } else {
      // 홈: 노하우 섹션만 제자리 갱신 (전체 리렌더로 스크롤이 위로 튀지 않게)
      const box=document.getElementById('home-tips-section');
      if (box) box.innerHTML=renderHomeTipsHtml();
      else navigate('home');
    }
    return;
  }
  const tipsMore=e.target.closest('[data-tips-more]');
  if (tipsMore&&currentPage==='tips') {
    window._tipsPageLimit=(window._tipsPageLimit||TIP_PAGE_SIZE)+TIP_PAGE_SIZE;
    const box=document.getElementById('tips-results'); if (box) box.innerHTML=tipsResultsHtml();
    return;
  }
  const tipCardEl=e.target.closest('[data-tip-key]');
  if (tipCardEl) { e.preventDefault(); openTipDetail(tipCardEl.dataset.tipKey); return; }
  const iact=e.target.closest('[data-iact]');
  if (iact) { e.preventDefault(); handleInputFlow(iact.dataset.iact, iact); return; }
  if (e.target.closest('#logout-btn')) { uiConfirm('로그아웃 하시겠어요?', '로그아웃', false).then(ok=>{ if(ok){ AUTH.logout(); location.reload(); } }); return; }
});

document.addEventListener('input',e=>{
  if (e.target.id==='tips-search-input') {
    window._tipsSearch=e.target.value;
    window._tipsPageLimit=TIP_PAGE_SIZE;   // 검색 바뀌면 더보기 초기화
    const box=document.getElementById('tips-results'); if (box) box.innerHTML=tipsResultsHtml();
    return;
  }
  if (e.target.id==='iflow-site-search') {
    inputState.site=e.target.value;
    const list=document.getElementById('iflow-site-list');
    if (list) list.innerHTML=inputSiteRowsNew(e.target.value);
    return;
  }
  if (e.target.id==='iflow-detail') {
    const ok=document.getElementById('iflow-detail-ok');
    if (ok) ok.style.display = e.target.value.trim() ? 'block' : 'none';
    return;
  }
  if (e.target.id==='iflow-memo') {
    inputState.memo=e.target.value;
    const mb=document.getElementById('iflow-memo-next');
    if (mb) mb.textContent = e.target.value.trim() ? '다음' : '메모 없이 계속';
    return;
  }
  if (e.target.id==='iflow-date') { inputState.date=e.target.value; return; }
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
            <div style="font-size:13px;color:var(--muted);">${p.date||''} · ${p.writer||''}</div>
          </div>
          <span style="background:${statusBg};color:${statusColor};border-radius:20px;padding:3px 10px;font-size:13px;font-weight:700;flex-shrink:0;margin-left:8px;">${statusLabel}</span>
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
  if (!(await uiConfirm('이 미정리 내역을 삭제할까요?'))) return;
  try { await db.ref('pending/'+key).remove(); openPendingList(); }
  catch(e) { alert('삭제 실패'); }
}
// 미정리 수정에서 쓰는 공정 목록 (사진 보관함과 동일하게 유지)
const PEND_PHASES = ['시공 전', '철거', '창호', '전기', '욕실방수', '목공', '타일', '필름', '욕실설비', '바닥', '도배', '가구', '조명마감', '중문', '실리콘', '잔마감', '시공 후', 'AS'];

function editPending(key) {
  const p=window.FB?.pending?.[key]||{};
  const sitesOpts=(M.sites||[]).map(s=>`<option value="${s.name}" ${p.site===s.name?'selected':''}>${s.name}</option>`).join('');

  // 저장된 사진 모으기 — 새 형식(photos URL 배열) 우선, 옛 형식(imageBase64 + extraPhotos)도 호환
  const allPhotos = [];
  if (Array.isArray(p.photos) && p.photos.length) {
    p.photos.forEach(u => { if (u) allPhotos.push(u); });
  } else {
    if (p.imageBase64) allPhotos.push(p.imageBase64);
    if (Array.isArray(p.extraPhotos)) p.extraPhotos.forEach(u => { if (u) allPhotos.push(u); });
  }
  const photosEnc = encodeURIComponent(JSON.stringify(allPhotos));
  const photosBlock = allPhotos.length > 0 ? `
    <div class="field">
      <label class="field-label">첨부 사진 <span class="muted">(${allPhotos.length}장 · 탭하면 크게 보기)</span></label>
      <div style="display:flex;gap:8px;overflow-x:auto;padding:4px 2px 8px;">
        ${allPhotos.map((src, i) => `
          <img src="${src}" data-pend-photos="${photosEnc}" data-pend-photo-idx="${i}"
            style="width:96px;height:96px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);cursor:pointer;flex-shrink:0;">
        `).join('')}
      </div>
    </div>` : '';

  // 공정 칩 — data-* 패턴
  // Firebase 필드명은 'process' (기존 데이터와 호환), 혹시 'phase'로 저장된 경우도 fallback
  const currentPhase = p.process || p.phase || '';
  const phaseChipsHtml = `
    <button type="button" class="chip ${!currentPhase?'is-active':''}" data-pend-phase="">선택 안함</button>
    ${PEND_PHASES.map(ph =>
      `<button type="button" class="chip ${currentPhase===ph?'is-active':''}" data-pend-phase="${ph}">${ph}</button>`
    ).join('')}`;

  const root=document.getElementById('modal-root');
  root.innerHTML=`
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div><div class="modal-title">✏️ 미정리 수정 <span style="font-size:10px;color:var(--muted);font-weight:400;">v3</span></div></div>
          <button class="btn-icon" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          ${photosBlock}
          <div class="field"><label class="field-label">현장</label>
            <select class="input" id="pend-site"><option value="">선택</option>${sitesOpts}</select></div>
          <div class="field"><label class="field-label">공정 <span class="muted">(어떤 공정인가요?)</span></label>
            <div class="chip-group" id="pend-phase-group" style="flex-wrap:wrap;gap:6px;">${phaseChipsHtml}</div>
            <input type="hidden" id="pend-phase" value="${currentPhase}">
          </div>
          <div class="field"><label class="field-label">금액 (원)</label>
            <input class="input" type="number" id="pend-amount" value="${p.totalAmount||''}" placeholder="총 금액"></div>
          <div class="field"><label class="field-label">날짜</label>
            <input class="input" type="date" id="pend-date" value="${p.date||''}"></div>
          <div class="field"><label class="field-label">메모 <span class="muted">(상세 내용 · 자유롭게)</span></label>
            <textarea class="input" id="pend-memo" rows="5" placeholder="예: 삼미사 거울도어 / 색상 무광 블랙 / 김사장님과 통화 완료" style="min-height:110px;line-height:1.6;">${p.memo||''}</textarea></div>
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

  // 사진 클릭 → 큰 뷰어로
  root.querySelectorAll('[data-pend-photos]').forEach(img => {
    img.addEventListener('click', e => {
      e.stopPropagation();
      const enc = img.getAttribute('data-pend-photos');
      if (window.openPhotoAlbum) window.openPhotoAlbum(enc);
    });
  });

  // 공정 칩 클릭 — 이벤트 위임, 따옴표 충돌 없는 안전 패턴
  const phaseGroup = root.querySelector('#pend-phase-group');
  if (phaseGroup) {
    phaseGroup.addEventListener('click', e => {
      const chip = e.target.closest('[data-pend-phase]');
      if (!chip) return;
      phaseGroup.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      const inp = document.getElementById('pend-phase');
      if (inp) inp.value = chip.dataset.pendPhase || '';
    });
  }
}
function pendChip(el,val) {
  el.closest('.chip-group').querySelectorAll('.chip').forEach(b=>b.classList.remove('is-active'));
  el.classList.add('is-active');
  document.getElementById('pend-status').value=val;
}
async function savePending(key) {
  const site=document.getElementById('pend-site')?.value||'';
  const process=document.getElementById('pend-phase')?.value||'';
  const amount=parseInt(document.getElementById('pend-amount')?.value)||null;
  const date=document.getElementById('pend-date')?.value||'';
  const memo=document.getElementById('pend-memo')?.value?.trim()||'';
  const status=document.getElementById('pend-status')?.value||'temp';
  const btn=document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='저장 중...'; }
  try {
    await db.ref('pending/'+key).update({site,process,totalAmount:amount,date,memo,status});
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
