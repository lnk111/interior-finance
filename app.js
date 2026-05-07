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

function ymRow(year = 2026, month = 5) {
  const years = [2024, 2025, 2026, 2027];
  const yh = years.map(y => `<option ${y === year ? 'selected' : ''}>${y}</option>`).join('');
  const mh = [...Array(12)].map((_, i) => `<option ${i + 1 === month ? 'selected' : ''}>${i + 1}월</option>`).join('');
  return `<div class="ym-selects"><select class="ym-sel">${yh}</select><select class="ym-sel">${mh}</select></div>`;
}

// ===== HOME =====
function renderHome() {
  const t = M.totals;
  const briefingHtml = M.briefing.map(b => `
    <div class="briefing-item">
      <div class="dot" style="background: var(--${b.color}-soft); color: var(--${b.color});">${b.icon}</div>
      <div>
        <div class="label">${b.label}</div>
        <div class="meta">${b.meta}</div>
      </div>
      <span style="color: var(--muted); font-size: 16px;">›</span>
    </div>
  `).join('');

  const topSites = M.sites.filter(s => s.profit > 0).sort((a, b) => b.profit - a.profit).slice(0, 3);
  const ranksHtml = AUTH.can('top3') ? topSites.map((s, i) => `
    <div class="rank-row">
      <span class="rk-num num">0${i + 1}</span>
      <div>
        <div class="rk-title">${s.name}</div>
        <div class="rk-meta">${s.client} · 이익률 ${s.margin}%</div>
      </div>
      <span class="rk-amount num">+${fmtSlim(s.profit)}</span>
    </div>
  `).join('') : '';

  const recentHtml = M.recent.slice(0, 5).map(r => {
    const cls = r.kind === '매출' ? 'pill-accent' : r.kind === 'AS' ? 'pill-pin' : 'pill-warn';
    const sign = r.kind === '매출' ? '+' : '−';
    return `
      <button class="list-row" data-modal="txEdit" style="width: 100%; text-align: left;">
        <span class="pill ${cls}">${r.kind}</span>
        <div>
          <div class="lr-title">${r.site}</div>
          <div class="lr-meta">${r.stage || r.phase} · ${r.pay || ''} · ${r.when}</div>
        </div>
        <span class="lr-amount num">${sign}${fmtSlim(r.amount)}</span>
      </button>
    `;
  }).join('');

  const asActive = M.asList.filter(a => a.status !== '완료');
  const asHtml = asActive.map(a => `
    <div class="as-row">
      <div class="as-status">
        <span class="pill ${a.status === '예정' ? 'pill-warn' : 'pill-muted'}">${a.status}</span>
      </div>
      <div>
        <div class="as-title">${a.site}</div>
        <div class="as-issue">${a.issue}</div>
        <div class="as-meta">${a.client} · ${a.phone} · ${a.staff} · ${a.date}</div>
      </div>
    </div>
  `).join('');

  const pinnedTips = M.tips.filter(t => t.pinned);
  const otherTips = M.tips.filter(t => !t.pinned).slice(0, 2);
  const tipCard = (tp) => {
    const cls = tp.cat === '실수' ? 'pill-warn' : tp.cat === '팁' ? 'pill-accent' : tp.cat === '자재' ? 'pill-pin' : 'pill-info';
    const ic = tp.cat === '실수' ? '😓' : tp.cat === '팁' ? '💡' : tp.cat === '자재' ? '🔩' : '🤝';
    return `
      <div class="tip-card ${tp.pinned ? 'pinned' : ''}">
        <div class="tip-head">
          <span class="pill ${cls}">${ic} ${tp.cat}</span>
          <span class="tip-meta">${tp.by} · ${tp.site}</span>
        </div>
        <div class="tip-title">${tp.title}</div>
      </div>
    `;
  };

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">2026년 5월 · ${M.company}</div>
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

      <!-- Year/Month filter for 손익 -->
      <div class="section-label">손익 현황 <span class="more"><span class="pill pill-muted" style="font-size: 9px;">${AUTH.roleLabel()} 모드</span></span></div>
      ${ymRow(2026, 5)}

      ${AUTH.can('finalProfit') ? `
      <div class="hero" style="margin-top: 10px;">
        <div class="hero-eyebrow">🏢 이번 달 최종 영업이익</div>
        <div class="hero-amount num">${fmtSlim(t.finalProfit)}<span class="unit">원</span></div>
        <div class="hero-meta">순이익 − 고정비(임대료·급여 등) − 부가세</div>
        <div class="hero-trend">
          <span class="pill pill-accent">↑ 8.2%</span>
          <span>전월 대비</span>
        </div>
        <div class="stack-bar">
          <span style="flex:${t.finalProfit}; background: var(--accent);"></span>
          <span style="flex:${t.fixed}; background: var(--faint);"></span>
          <span style="flex:${t.vat}; background: var(--warn); opacity: .85;"></span>
        </div>
        <div class="stack-legend">
          <div><div class="lk"><span class="ldot" style="background: var(--accent);"></span>이익</div><span class="lv num">${fmtSlim(t.finalProfit)}</span></div>
          <div><div class="lk"><span class="ldot" style="background: var(--faint);"></span>고정비</div><span class="lv num">${fmtSlim(t.fixed)}</span></div>
          <div><div class="lk"><span class="ldot" style="background: var(--warn);"></span>부가세</div><span class="lv num">${fmtSlim(t.vat)}</span></div>
        </div>
      </div>
      ` : ''}

      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">총 매출</div>
          <div class="stat-value num">${fmtSlim(t.revenue)}</div>
          <div class="stat-delta flat">고객에게 받은 금액</div>
        </div>
        <div class="stat">
          <div class="stat-label">총 매입</div>
          <div class="stat-value num">${fmtSlim(t.cost)}</div>
          <div class="stat-delta flat">업체에 지급한 금액</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">현장 순이익</div>
          <div class="stat-value num" style="color: var(--accent);">+${fmtSlim(t.siteProfit)}</div>
          <div class="stat-delta flat">매출 − 매입 − AS</div>
        </div>
        <div class="stat">
          <div class="stat-label">이익률</div>
          <div class="stat-value num">${t.margin}%</div>
          <div class="stat-delta flat">목표 ${t.targetMargin}%</div>
        </div>
      </div>

      ${AUTH.can('tax') ? `
      <button class="alert" data-goto="tax" style="width: 100%; text-align: left;">
        <div>
          <div class="alert-eyebrow">D-${M.tax.daysLeft} · 부가세 납부</div>
          <div class="alert-amount num">${fmtSlim(M.tax.vatPayable)}</div>
          <div class="alert-meta">${M.tax.nextDue}</div>
        </div>
        <span class="alert-arrow">›</span>
      </button>
      ` : ''}

      <!-- AS 관리 -->
      <div class="section-label">🔧 AS 관리 <span class="more"><span data-modal="as">+ 등록</span></span></div>
      <div class="as-list">${asHtml || '<div class="empty">진행중 AS가 없습니다</div>'}</div>

      <!-- Quick actions -->
      <div class="section-label">빠른 작업</div>
      <div class="quick-actions">
        <button class="quick" data-goto="input">${ICON.plus}<span>거래 입력</span></button>
        <button class="quick" data-modal="quickTip"><span style="font-size: 18px;">⚡</span><span>빠른 기록</span></button>
        <button class="quick" data-modal="as"><span style="font-size: 18px;">🔧</span><span>AS 등록</span></button>
        <button class="quick" data-modal="site"><span style="font-size: 18px;">🏗️</span><span>현장 등록</span></button>
      </div>

      <div class="section-label">현장 순이익 TOP 3 <span class="more" data-goto="sites">전체 ›</span></div>
      ${AUTH.can('top3') ? `<div class="rank-list">${ranksHtml}</div>` : `<div class="locked">🔒 권한이 있는 사용자만 볼 수 있어요</div>`}

      <div class="section-label">최근 거래 <span class="pill pill-warn">미정리 ${M.unsorted}건</span></div>
      <div class="list">${recentHtml}</div>

      <!-- 노하우 섹션 (홈에 통합) -->
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
    </div>
  `;
}

// ===== INPUT (거래 입력) =====
let inputState = {
  tab: '매입',
  mode: 'quick',
  stage: '중도금',
  payMethod: '계좌이체',
  phase: '도배',
  amount: '18000000',
  invoice: true,
  inputter: '김실장',
  site: '',
};

// 최근 선택 현장 (localStorage)
function getRecentSites() {
  try { return JSON.parse(localStorage.getItem('recent_sites') || '[]'); } catch { return []; }
}
function addRecentSite(name) {
  let arr = getRecentSites().filter(s => s !== name);
  arr.unshift(name);
  localStorage.setItem('recent_sites', JSON.stringify(arr.slice(0, 5)));
}

function openSiteDropdown() {
  const dd = document.getElementById('site-dropdown');
  if (!dd) return;
  dd.style.display = 'block';
  filterSiteDropdown(document.getElementById('site-input')?.value || '');
}

function closeSiteDropdown() {
  const dd = document.getElementById('site-dropdown');
  if (dd) dd.style.display = 'none';
}

function filterSiteDropdown(query) {
  const dd = document.getElementById('site-dropdown-list');
  if (!dd) return;
  const allSites = (window.MOCK?.sites || []).map(s => s.name);
  const recent = getRecentSites().filter(s => allSites.includes(s));
  const q = query.trim().toLowerCase();

  let html = '';

  // 최근 선택
  const recentFiltered = recent.filter(s => !q || s.toLowerCase().includes(q));
  if (recentFiltered.length > 0) {
    html += `<div style="padding:6px 12px;font-size:11px;font-weight:700;color:var(--muted);background:var(--surface-2);">🕐 최근 선택</div>`;
    html += recentFiltered.map(s => `
      <div onclick="selectSite('${s.replace(/'/g,"\\'")}');event.stopPropagation();"
        style="padding:12px 16px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--hair-soft);"
        onmousedown="event.preventDefault()">
        ${s}
      </div>`).join('');
  }

  // 전체 현장
  const others = allSites.filter(s => !recent.includes(s) && (!q || s.toLowerCase().includes(q)));
  if (others.length > 0) {
    html += `<div style="padding:6px 12px;font-size:11px;font-weight:700;color:var(--muted);background:var(--surface-2);">전체 현장</div>`;
    html += others.map(s => `
      <div onclick="selectSite('${s.replace(/'/g,"\\'")}');event.stopPropagation();"
        style="padding:12px 16px;font-size:14px;cursor:pointer;border-bottom:1px solid var(--hair-soft);"
        onmousedown="event.preventDefault()">
        ${s}
      </div>`).join('');
  }

  if (!html) {
    html = `<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">검색 결과 없음</div>`;
  }

  dd.innerHTML = html;
  document.getElementById('site-dropdown').style.display = 'block';
}

function selectSite(name) {
  inputState.site = name;
  addRecentSite(name);
  const inp = document.getElementById('site-input');
  if (inp) inp.value = name;
  closeSiteDropdown();
}

// 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', (e) => {
  const inp = document.getElementById('site-input');
  const dd = document.getElementById('site-dropdown');
  if (dd && inp && !inp.contains(e.target) && !dd.contains(e.target)) {
    closeSiteDropdown();
  }
});

function renderInput() {
  const tabsHtml = [
    { k: '매입', i: '📦' },
    { k: '매출', i: '💰' },
    { k: 'AS', i: '🔧' },
  ].map(t => `
    <button class="tab ${inputState.tab === t.k ? 'is-active' : ''}" data-tab="${t.k}">${t.i} ${t.k}</button>
  `).join('');

  const stageIcons = { '계약금': '📋', '착수금': '🔨', '중도금': '💼', '잔금': '✅' };
  const stagesHtml = M.paymentStages.map(s => `
    <button class="chip ${inputState.stage === s ? 'is-active' : ''}" data-stage="${s}">${stageIcons[s]} ${s}</button>
  `).join('');

  const payIcons = { '현금': '💵', '계좌이체': '🏦', '신용카드': '💳' };
  const payHtml = M.paymentMethods.map(p => `
    <button class="chip ${inputState.payMethod === p ? 'is-active' : ''}" data-pay="${p}">${payIcons[p]} ${p}</button>
  `).join('');

  const phasesHtml = M.phases.map(p => `
    <button class="chip ${inputState.phase === p ? 'is-active' : ''}" data-phase="${p}">${p}</button>
  `).join('') + '<button class="chip">✏️ 직접</button>';

  const inputtersHtml = M.inputters.map(n => `
    <button class="chip ${inputState.inputter === n ? 'is-active' : ''}" data-inputter="${n}">${n}</button>
  `).join('') + '<button class="chip">✏️ 직접</button>';

  const formattedAmount = Number(inputState.amount || 0).toLocaleString('ko-KR');
  const vat = Math.round(Number(inputState.amount || 0) * 0.1);

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">새 거래</div>
        <h1 class="h-title">거래 입력</h1>
      </div>
    </div>
    <div class="page-body">
      <!-- Mode toggle: 빠른 입력 vs 상세 -->
      <div class="mode-toggle">
        <button class="mt-btn ${inputState.mode === 'quick' ? 'is-active' : ''}" data-mode="quick">⚡ 빠른 입력 <span class="muted">사진 선택사항</span></button>
        <button class="mt-btn ${inputState.mode === 'detail' ? 'is-active' : ''}" data-mode="detail">📋 상세 직접 입력</button>
      </div>

      <button class="unsorted-banner" data-modal="quickTip">
        <span class="pill pill-warn">📋 미정리 ${M.unsorted}</span>
        <span>탭해서 정리하기</span>
        <span style="margin-left: auto;">›</span>
      </button>

      <div class="tabs">${tabsHtml}</div>

      <div class="field" style="position:relative;">
        <label class="field-label">현장 <span class="req">*</span></label>
        <input class="input" id="site-input" placeholder="현장을 선택하거나 직접 입력" autocomplete="off"
          value="${inputState.site || ''}"
          oninput="filterSiteDropdown(this.value)"
          onfocus="openSiteDropdown()"
        >
        <div id="site-dropdown" style="display:none;position:absolute;left:0;right:0;top:100%;z-index:200;background:#fff;border:1.5px solid var(--hair);border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.12);max-height:220px;overflow-y:auto;margin-top:4px;">
          <div id="site-dropdown-list"></div>
        </div>
      </div>

      <div class="field">
        <label class="field-label">금액 (원) <span class="req">*</span></label>
        <div class="input-wrap">
          <input class="input input-amount num" id="amount-input" value="${formattedAmount}">
          <span class="input-suffix">원</span>
        </div>
      </div>

      <div class="field">
        <label class="field-label">날짜</label>
        <input class="input" type="date" value="2026-05-06">
      </div>

      ${inputState.tab === '매출' ? `
        <div class="field">
          <label class="field-label">결제 단계</label>
          <div class="chip-group">${stagesHtml}</div>
        </div>
        <div class="field">
          <label class="field-label">결제 방법</label>
          <div class="chip-group">${payHtml}</div>
        </div>
      ` : `
        <div class="field">
          <label class="field-label">공정</label>
          <div class="chip-group">${phasesHtml}</div>
        </div>
        <div class="field">
          <label class="field-label">결제 방법</label>
          <div class="chip-group">${payHtml}</div>
        </div>
      `}

      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" rows="2" placeholder="선택사항"></textarea>
      </div>

      <div class="attach-row">
        <button class="attach">📷 영수증</button>
        <button class="attach">🎤 음성 메모</button>
      </div>

      ${inputState.tab === '매출' ? `
      <div class="invoice-toggle ${inputState.invoice ? '' : 'off'}" id="invoice-toggle">
        <div class="checkbox">
          <svg viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="it-title">📄 세금계산서 발행</div>
          <div class="it-meta">${inputState.invoice ? `부가세 ₩${vat.toLocaleString('ko-KR')} 자동 계산` : '체크하면 부가세(10%) 자동 계산됩니다'}</div>
        </div>
      </div>` : ''}

      <div class="field">
        <label class="field-label">입력자</label>
        <div class="chip-group">${inputtersHtml}</div>
      </div>

      <div class="form-submit">
        <button class="btn btn-primary btn-block">+ 입력 완료</button>
      </div>

      <div class="section-label">📌 최근 입력 내역</div>
      <div class="list">
        ${M.recent.slice(0, 4).map(r => {
          const cls = r.kind === '매출' ? 'pill-accent' : r.kind === 'AS' ? 'pill-pin' : 'pill-warn';
          const sign = r.kind === '매출' ? '+' : '−';
          return `
            <button class="list-row" data-modal="txEdit" style="width: 100%; text-align: left;">
              <span class="pill ${cls}">${r.kind}</span>
              <div>
                <div class="lr-title">${r.site}</div>
                <div class="lr-meta">${r.stage || r.phase} · ${r.pay || ''} · ${r.when}</div>
              </div>
              <span class="lr-amount num">${sign}${fmtSlim(r.amount)}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// ===== SITES =====
let sitesFilter = '전체';
let sitesQuery = '';
function renderSites() {
  const filters = ['전체', '계약완료', '공사중', 'AS관리'];
  let list = sitesFilter === '전체' ? M.sites : M.sites.filter(s => s.status === sitesFilter);
  if (sitesQuery) list = list.filter(s => s.name.includes(sitesQuery) || s.client.includes(sitesQuery));

  const filterHtml = filters.map(f => `
    <button class="filter-chip ${sitesFilter === f ? 'is-active' : ''}" data-filter="${f}">${f}</button>
  `).join('');

  const cardsHtml = list.map(s => `
    <div class="site-card" data-site="${s.name}">
      <div class="site-card-head">
        <div>
          <div class="site-card-name">${s.name}</div>
          <div class="site-card-meta">${s.client} · ${s.start}${s.end !== '—' ? ' – ' + s.end : ''}</div>
        </div>
        <span class="pill status-${s.status}">${s.status}</span>
      </div>
      <div class="site-card-stats">
        <div><div class="s-k">매출</div><div class="s-v num">${fmtSlim(s.revenue)}</div></div>
        <div><div class="s-k">매입</div><div class="s-v num">${fmtSlim(s.cost)}</div></div>
        <div><div class="s-k">이익</div><div class="s-v num ${s.profit > 0 ? 'profit' : ''}">${s.profit > 0 ? '+' : ''}${fmtSlim(s.profit)}</div></div>
      </div>
      ${s.progress > 0 ? `
      <div class="progress-row">
        <span class="p-label">${s.phase}</span>
        <div class="p-track"><div class="p-fill" style="width: ${s.progress}%"></div></div>
        <span class="p-pct num">${s.progress}%</span>
      </div>` : ''}
    </div>
  `).join('') || '<div class="empty">결과가 없습니다</div>';

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">현장 ${M.sites.length}개 · 진행중 ${M.sites.filter(x => x.status === '공사중').length}</div>
        <h1 class="h-title">현장 관리</h1>
      </div>
      <button class="btn btn-primary btn-sm" data-modal="site">+ 등록</button>
    </div>
    <div style="padding: 0 var(--pad) 12px;">
      <div class="search-box">
        ${ICON.search}
        <input class="search-input" placeholder="현장명·고객명 검색" id="sites-search" value="${sitesQuery}">
      </div>
    </div>
    <div class="filter-row">${filterHtml}</div>
    <div class="page-body">
      <div class="cal-mini-bar">
        <button class="btn btn-ghost btn-sm" data-goto="calendar">📅 현장 달력</button>
        <button class="btn btn-ghost btn-sm">📤 구글 캘린더</button>
      </div>
      ${cardsHtml}
    </div>
  `;
}

// ===== Router =====
const routes = {
  home: { render: renderHome, tab: 'home' },
  sites: { render: renderSites, tab: 'sites' },
  siteDetail: { render: () => window.PAGES_EXTRA.renderSiteDetail(), tab: 'sites' },
  input: { render: renderInput, tab: 'input' },
  quickInput: { render: renderInput, tab: 'input' },
  calendar: { render: () => window.PAGES_EXTRA.renderCalendar(), tab: 'calendar' },
  settings: { render: () => window.PAGES_EXTRA.renderSettings(), tab: 'settings' },
  photos: { render: () => window.PAGES_EXTRA.renderPhotos(), tab: 'settings' },
  tax: { render: () => window.PAGES_EXTRA.renderTax(), tab: 'home' },
};

let currentPage = 'home';
function navigate(page) {
  if (!routes[page]) return;
  currentPage = page;
  window.currentPage = page;
  $('#app').innerHTML = `<div class="page is-active">${routes[page].render()}</div>`;
  const activeTab = routes[page].tab;
  $$('.tabbar-item, .tabbar-fab').forEach(b => {
    b.classList.toggle('is-active', b.dataset.page === activeTab);
  });
  window.scrollTo(0, 0);
}
window.navigate = navigate;

// ===== Events =====
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-modal]') || e.target.closest('[data-modal-close]')) return;

  const tab = e.target.closest('[data-page]');
  if (tab) { e.preventDefault(); navigate(tab.dataset.page); return; }

  const goto = e.target.closest('[data-goto]');
  if (goto) { e.preventDefault(); navigate(goto.dataset.goto); return; }

  const filter = e.target.closest('[data-filter]');
  if (filter && currentPage === 'sites') { sitesFilter = filter.dataset.filter; navigate('sites'); return; }

  const siteCard = e.target.closest('[data-site]');
  if (siteCard && currentPage === 'sites') {
    const siteName = siteCard.dataset.site;
    // PMS.sites[0] 을 선택한 현장으로 설정
    const found = (window.MOCK?.sites || []).find(s => s.name === siteName);
    if (found) window.MOCK.sites = [found, ...(window.MOCK.sites.filter(s => s.name !== siteName))];
    // Firebase procData 로드
    window._procCache = {};
    const key = siteName.replace(/[.#$/ \[\]]/g, '_');
    db.ref('procData/' + key).once('value').then(snap => {
      window._procCache = snap.val() || {};
      navigate('siteDetail');
    }).catch(() => navigate('siteDetail'));
    return;
  }

  const inputTab = e.target.closest('[data-tab]');
  if (inputTab && (currentPage === 'input' || currentPage === 'quickInput')) {
    inputState.tab = inputTab.dataset.tab; navigate('input'); return;
  }
  const stage = e.target.closest('[data-stage]');
  if (stage) { inputState.stage = stage.dataset.stage; navigate('input'); return; }
  const pay = e.target.closest('[data-pay]');
  if (pay) { inputState.payMethod = pay.dataset.pay; navigate('input'); return; }
  const phase = e.target.closest('[data-phase]');
  if (phase) { inputState.phase = phase.dataset.phase; navigate('input'); return; }
  const inputter = e.target.closest('[data-inputter]');
  if (inputter) { inputState.inputter = inputter.dataset.inputter; navigate('input'); return; }
  const mode = e.target.closest('[data-mode]');
  if (mode) { inputState.mode = mode.dataset.mode; navigate('input'); return; }

  if (e.target.closest('#invoice-toggle')) { inputState.invoice = !inputState.invoice; navigate('input'); return; }

  if (e.target.closest('#logout-btn')) {
    if (confirm('로그아웃 하시겠어요?')) { AUTH.logout(); location.reload(); }
    return;
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'amount-input') {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    inputState.amount = raw;
    e.target.value = Number(raw || 0).toLocaleString('ko-KR');
    const meta = $('.invoice-toggle .it-meta');
    if (meta && inputState.invoice) {
      const vat = Math.round(Number(raw || 0) * 0.1);
      meta.textContent = `부가세 ₩${vat.toLocaleString('ko-KR')} 자동 계산`;
    }
  }
  if (e.target.id === 'sites-search') {
    sitesQuery = e.target.value;
    // partial re-render to keep focus
    const body = $('.page-body');
    if (body) {
      navigate('sites');
      const search = $('#sites-search');
      if (search) { search.focus(); search.setSelectionRange(sitesQuery.length, sitesQuery.length); }
    }
  }
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  const loggedIn = bootAuth();
  if (loggedIn) {
    navigate('home');
  }
});
