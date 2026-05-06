// 머니플로우 — Pages (calendar, settings, staff, tips, txList, etc.)

const PMS = window.MOCK;
const fmtSlim2 = (n) => {
  if (!n) return '₩0';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (a >= 100_000_000) return sign + '₩' + (a / 100_000_000).toFixed(1).replace(/\.0$/, '') + '억';
  if (a >= 10_000) return sign + '₩' + Math.round(a / 10_000).toLocaleString('ko-KR') + '만';
  return sign + '₩' + a.toLocaleString('ko-KR');
};
const fmtFull2 = (n) => '₩' + n.toLocaleString('ko-KR');

// Year/Month select markup helper
function ymSelect(year = 2026, month = 5) {
  const years = [2024, 2025, 2026, 2027];
  const yh = years.map(y => `<option ${y === year ? 'selected' : ''}>${y}</option>`).join('');
  const mh = [...Array(12)].map((_, i) => `<option ${i + 1 === month ? 'selected' : ''}>${i + 1}월</option>`).join('');
  return `
    <div class="ym-selects">
      <select class="ym-sel">${yh}</select>
      <select class="ym-sel">${mh}</select>
    </div>
  `;
}

// ===== Calendar =====
function renderCalendar() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const firstDay = 5; // May 1, 2026 = Friday
  const totalDays = 31;
  const weekHead = days.map((d, i) => `<div class="${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${d}</div>`).join('');

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push('<div class="cal-day empty"></div>');
  for (let d = 1; d <= totalDays; d++) {
    const col = (firstDay + d - 1) % 7;
    const ev = PMS.events[d] || [];
    const isToday = d === 6;
    const evHtml = ev.slice(0, 2).map(e => `<span class="cal-event" style="color: var(--${e.c}); background: rgba(0,0,0,0.04);">${e.t}</span>`).join('');
    cells.push(`<div class="cal-day ${isToday ? 'today' : ''} ${col === 0 ? 'sun' : col === 6 ? 'sat' : ''}">
      <span class="num">${d}</span>${evHtml}
    </div>`);
  }

  const upcoming = [
    { d: '5/8', t: '용산 한남더힐 착공', c: 'pin' },
    { d: '5/12', t: '마포 자이 AS 방문', c: 'info' },
    { d: '5/22', t: '서초 래미안 잔금', c: 'accent' },
    { d: '5/30', t: '판교 푸르지오 마감', c: 'accent' },
  ];

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">📅 일정 · 결제 · AS</div>
        <h1 class="h-title">달력</h1>
      </div>
      <button class="btn btn-primary btn-sm" data-modal="schedule">+ 일정</button>
    </div>
    <div style="padding: 0 var(--pad) 12px;">${ymSelect(2026, 5)}</div>
    <div class="cal-head">
      <div class="cal-title num">2026년 5월</div>
      <div class="nav-btns">
        <button class="btn-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg></button>
        <button class="btn-icon"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M6 4l4 4-4 4"/></svg></button>
      </div>
    </div>
    <div class="cal-grid">
      <div class="cal-week-head">${weekHead}</div>
      <div class="cal-grid-days">${cells.join('')}</div>
    </div>
    <div class="cal-list">
      <div class="section-label">다가오는 일정 <button class="more" data-modal="schedule">+ 추가</button></div>
      <div class="list">
        ${upcoming.map(u => `
          <div class="list-row">
            <span class="num" style="font-size: 12px; color: var(--muted); font-weight: 600; min-width: 30px;">${u.d}</span>
            <div><div class="lr-title">${u.t}</div></div>
            <span class="pill pill-${u.c}" style="font-size: 9px;">●</span>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top: 12px;">📤 구글 캘린더 연동</button>
    </div>
  `;
}

// ===== Settings (fixed costs + staff + export) =====
function renderSettings() {
  const fc = PMS.fixedCosts;
  const total = fc.reduce((a, b) => a + b.value, 0);
  const labels = ['직원급여', '임대료', '마케팅비', '관리비', '카드비', '기타'];
  const icons = ['👥', '🏢', '📣', '⚙️', '💳', '📦'];
  const aligned = labels.map((l, i) => ({ label: l, icon: icons[i], value: fc[i] ? fc[i].value : 0 }));
  const canFC = AUTH.can('fixedCost');
  const canStaffMgmt = AUTH.can('staffMgmt');
  const canStaffSalary = AUTH.can('staffSalary');
  const canCsv = AUTH.can('csvExport');

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">${AUTH.roleLabel()} · ${AUTH.current()?.name || ''}</div>
        <h1 class="h-title">설정</h1>
      </div>
      <button class="btn-icon" id="logout-btn" title="로그아웃">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 4h4v12h-4M8 14l-4-4 4-4M4 10h10"/></svg>
      </button>
    </div>
    <div class="page-body">
      <!-- 현장 사진 보관함 진입 -->
      <button class="menu-card" data-goto="photos" style="width: 100%;">
        <div class="mc-icon">📸</div>
        <div class="mc-body">
          <div class="mc-title">현장 사진 보관함</div>
          <div class="mc-meta">현장별 시공 전·중·후 사진 모아보기</div>
        </div>
        <span class="chev">›</span>
      </button>

      ${canFC ? `
      <div class="settings-group-label">📌 월 고정비</div>
      ${ymSelect(2026, 5)}
      <div class="settings-group" style="margin-top: 10px;">
        ${aligned.map(c => `
          <div class="settings-row">
            <span class="sr-key"><span class="fc-icon">${c.icon}</span> ${c.label}</span>
            <input class="fc-input num" value="${c.value.toLocaleString('ko-KR')}" />
          </div>
        `).join('')}
      </div>
      <div class="total-bar">
        <span class="tb-k">합계</span>
        <span class="tb-v num">${fmtFull2(total)}</span>
      </div>
      <button class="btn btn-primary btn-block" style="margin-top: 12px;">💾 저장</button>
      ` : `
      <div class="locked-card">
        <div class="lc-icon">🔒</div>
        <div>
          <div class="lc-title">월 고정비 (대표 전용)</div>
          <div class="lc-meta">임대료·급여·마케팅 등 고정 지출은 대표 권한으로만 확인할 수 있어요.</div>
        </div>
      </div>
      `}

      ${canCsv ? `
      <div class="settings-group-label">📥 데이터 내보내기</div>
      <button class="btn btn-ghost btn-block">현장별 손익 CSV 다운로드</button>
      ` : ''}

      <div class="settings-group-label">👥 직원 관리</div>
      ${canStaffMgmt ? `
      <div class="tabs" style="margin-bottom: 12px;">
        <button class="tab is-active">🟢 재직중 (${PMS.staff.length})</button>
        <button class="tab">🔴 퇴사자 (0)</button>
      </div>
      <div class="settings-group">
        ${PMS.staff.map(s => `
          <button class="settings-row" style="width: 100%; text-align: left;" data-modal="staff">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div class="avatar" style="width: 36px; height: 36px; font-size: 13px; background: #E8DFCD; border-radius: 50%; display: grid; place-items: center; font-weight: 700;">${s.name[0]}</div>
              <div>
                <div class="sr-key">${s.name} <span style="color: var(--muted); font-weight: 400; font-size: 12px;">${s.role}</span></div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">입사 ${s.joined}${canStaffSalary ? ` · ${(s.salary || 0).toLocaleString('ko-KR')}원` : ''}</div>
              </div>
            </div>
            <span class="pill pill-accent" style="font-size: 10px;">${s.status}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn btn-ghost btn-block" data-modal="staff" style="margin-top: 8px;">+ 직원 추가</button>
      ` : `
      <div class="settings-group">
        ${PMS.staff.map(s => `
          <div class="settings-row">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div class="avatar" style="width: 36px; height: 36px; background: #E8DFCD; border-radius: 50%; display: grid; place-items: center; font-weight: 700;">${s.name[0]}</div>
              <div>
                <div class="sr-key">${s.name} <span style="color: var(--muted); font-weight: 400; font-size: 12px;">${s.role}</span></div>
                <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">입사 ${s.joined}</div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      ${!canStaffSalary ? '<div class="locked-inline">🔒 급여 정보는 대표만 볼 수 있어요</div>' : ''}
      `}

      <div style="text-align: center; padding: 32px 0 8px; color: var(--faint); font-size: 11px;">
        머니플로우 v1.2 · ${PMS.company} · ${AUTH.roleLabel()}
      </div>
    </div>
  `;
}

// ===== Tax page =====
function renderTax() {
  const qHtml = PMS.tax.quarters.map(q => `
    <div class="list-row">
      <div></div>
      <div>
        <div class="lr-title">${q.q}</div>
        <div class="lr-meta">매출 ${q.revenue > 0 ? fmtSlim2(q.revenue) : '—'}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="num" style="font-weight: 600; font-size: 13px;">${q.vat > 0 ? fmtSlim2(q.vat) : '—'}</span>
        <span class="pill ${q.status === 'paid' ? 'pill-accent' : q.status === 'pending' ? 'pill-warn' : 'pill-muted'}" style="font-size: 9px;">
          ${q.status === 'paid' ? '납부' : q.status === 'pending' ? '대기' : '예정'}
        </span>
      </div>
    </div>
  `).join('');

  return `
    <div class="breadcrumb">
      <button class="back-btn" data-goto="home">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 홈
      </button>
    </div>
    <div class="page-header">
      <div>
        <div class="h-eyebrow">2026 1기 · D-${PMS.tax.daysLeft}</div>
        <h1 class="h-title">세금 · 부가세</h1>
      </div>
    </div>
    <div class="page-body">
      <div class="tax-hero">
        <div class="th-eyebrow">다가오는 달에 내야 할 세금은</div>
        <div class="th-amount num">${fmtSlim2(PMS.tax.vatPayable)}</div>
        <div class="th-meta">
          <span class="pill pill-warn">D-${PMS.tax.daysLeft}</span>
          <span>납부 마감 · ${PMS.tax.nextDue}</span>
        </div>
      </div>

      <div class="tax-card-row">
        <div class="tax-card">
          <div class="tax-icon">🧾</div>
          <div>
            <div class="tax-card-key">세금계산서 포함 매출</div>
            <div class="tax-card-val num">${fmtSlim2(PMS.tax.taxableRevenue)}</div>
          </div>
          <span class="chev">›</span>
        </div>
        <div class="tax-card">
          <div class="tax-icon">📋</div>
          <div>
            <div class="tax-card-key">발행 건수</div>
            <div class="tax-card-val num">${PMS.tax.invoiceCount}건</div>
          </div>
          <span class="chev">›</span>
        </div>
        <div class="tax-card">
          <div class="tax-icon">🏦</div>
          <div>
            <div class="tax-card-key">부가세 (10%)</div>
            <div class="tax-card-val num">${fmtSlim2(PMS.tax.vatPayable)}</div>
          </div>
          <span class="chev">›</span>
        </div>
      </div>

      <div class="section-label">분기별 납부 현황</div>
      <div class="list">${qHtml}</div>

      <div class="callout" style="margin-top: 14px;">
        <div class="callout-icon">💡</div>
        <div>
          <div class="callout-body">
            📌 거래 입력 시 <b>📄 세금계산서 발행</b> 체크한 매출만 집계됩니다<br>
            💡 기업은행에 미리 적립해두면 납부일에 당황하지 않아요!
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== Site Detail (with phase modal trigger) =====
function renderSiteDetail() {
  const s = PMS.sites[0];
  const phases = [
    { name: '철거', status: 'done', start: '04.18', end: '04.20', cost: 2_400_000 },
    { name: '창호', status: 'done', start: '04.21', end: '04.23', cost: 8_400_000 },
    { name: '전기', status: 'done', start: '04.22', end: '04.25', cost: 3_200_000 },
    { name: '욕실방수', status: 'done', start: '04.24', end: '04.26', cost: 1_800_000 },
    { name: '목공', status: 'now', start: '04.27', end: '05.02', cost: 6_500_000 },
    { name: '타일', status: 'now', start: '04.30', end: '05.05', cost: 4_800_000 },
    { name: '도배', status: 'todo', start: '05.06', end: '05.10', cost: 0 },
    { name: '바닥', status: 'todo', start: '05.08', end: '05.12', cost: 0 },
  ];
  const stLabel = { done: '완료', now: '진행중', todo: '대기' };
  const stClass = { done: 'pill-accent', now: 'pill-warn', todo: 'pill-muted' };

  const tlHtml = phases.map(p => `
    <button class="tl-row" data-modal="phase" style="width: 100%; text-align: left;">
      <span class="tl-dot ${p.status}"></span>
      <div>
        <div class="tl-name">${p.name} <span class="pill ${stClass[p.status]}" style="margin-left: 6px; font-size: 9px; padding: 1px 6px;">${stLabel[p.status]}</span></div>
        <div class="tl-meta">${p.start} – ${p.end}</div>
      </div>
      <span class="tl-cost num ${p.cost === 0 ? 'empty' : ''}">${p.cost > 0 ? fmtSlim2(p.cost) : '—'}</span>
    </button>
  `).join('');

  const payments = [
    { stage: '계약금', amount: 5_800_000, paid: true, date: '04.10' },
    { stage: '착수금', amount: 17_400_000, paid: true, date: '04.18' },
    { stage: '중도금', amount: 18_000_000, paid: true, date: '05.04' },
    { stage: '잔금', amount: 16_800_000, paid: false, date: '05.22 예정' },
  ];
  const payHtml = payments.map(p => `
    <div class="pay-row">
      <div>
        <div class="pay-stage ${!p.paid ? 'unpaid' : ''}">${p.stage}</div>
        <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">${p.date}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="pay-amount num ${!p.paid ? 'unpaid' : ''}">${fmtSlim2(p.amount)}</span>
        <span class="pill ${p.paid ? 'pill-accent' : 'pill-muted'}" style="font-size: 9px;">${p.paid ? '완료' : '예정'}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="breadcrumb">
      <button class="back-btn" data-goto="sites">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 현장
      </button>
    </div>
    <div class="page-header">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <h1 class="h-title">${s.name}</h1>
          <span class="pill status-${s.status}">${s.status}</span>
        </div>
        <div class="h-sub">${s.client} · ${s.start} – ${s.end}</div>
      </div>
    </div>
    <div class="page-body">
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">매출</div>
          <div class="stat-value num">${fmtSlim2(s.revenue)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">매입</div>
          <div class="stat-value num">${fmtSlim2(s.cost)}</div>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat">
          <div class="stat-label">순이익</div>
          <div class="stat-value num" style="color: var(--accent);">+${fmtSlim2(s.profit)}</div>
        </div>
        <div class="stat">
          <div class="stat-label">이익률</div>
          <div class="stat-value num">${s.margin}%</div>
        </div>
      </div>

      <div class="section-label">공정 진행 <span class="more">${s.progress}% · 탭하면 수정</span></div>
      <div class="timeline">${tlHtml}</div>

      <div class="section-label">결제 일정</div>
      <div class="pay-list">${payHtml}</div>

      <button class="btn btn-ghost btn-block" data-modal="as" style="margin-top: 14px;">🔧 AS 등록</button>
    </div>
  `;
}

// ===== Photos (현장 사진 보관함) =====
function renderPhotos() {
  const samples = [
    { id: 'p1', site: '서초 래미안 32평', phase: '목공', date: '2026.05.04', count: 8, tone: '#D8C9A8' },
    { id: 'p2', site: '서초 래미안 32평', phase: '타일', date: '2026.05.02', count: 12, tone: '#C8B89A' },
    { id: 'p3', site: '판교 푸르지오', phase: '철거', date: '2026.04.28', count: 6, tone: '#B8A98C' },
    { id: 'p4', site: '강남 아이파크', phase: '도배', date: '2026.04.22', count: 14, tone: '#D2C5A6' },
    { id: 'p5', site: '마포 자이 18평', phase: 'AS', date: '2026.04.18', count: 4, tone: '#C5B8A0' },
    { id: 'p6', site: '용산 한남더힐', phase: '계약 전', date: '2026.04.15', count: 3, tone: '#DBCFB2' },
  ];

  const sites = [...new Set(samples.map(s => s.site))];
  const filterHtml = ['전체', ...sites].map((s, i) => `
    <button class="filter-chip ${i === 0 ? 'is-active' : ''}">${s}</button>
  `).join('');

  const phases = ['전체', '시공 전', '철거', '목공', '타일', '도배', '시공 후', 'AS'];
  const phaseHtml = phases.map((p, i) => `
    <button class="filter-chip ${i === 0 ? 'is-active' : ''}">${p}</button>
  `).join('');

  // build a 2-col gallery of "albums"
  const albumHtml = samples.map(s => `
    <button class="photo-album" style="text-align: left;">
      <div class="pa-thumb" style="background: linear-gradient(135deg, ${s.tone} 0%, ${s.tone}cc 100%);">
        <span class="pa-count">📷 ${s.count}</span>
      </div>
      <div class="pa-title">${s.site}</div>
      <div class="pa-meta">${s.phase} · ${s.date}</div>
    </button>
  `).join('');

  return `
    <div class="breadcrumb">
      <button class="back-btn" data-goto="settings">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 설정
      </button>
    </div>
    <div class="page-header">
      <div>
        <div class="h-eyebrow">📸 시공 전·중·후 기록</div>
        <h1 class="h-title">현장 사진 보관함</h1>
      </div>
      <button class="btn btn-primary btn-sm" data-modal="quickTip">+ 업로드</button>
    </div>
    <div style="padding: 0 var(--pad) 12px;">
      <div class="search-box">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="16" height="16"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>
        <input class="search-input" placeholder="현장명·공정 검색">
      </div>
    </div>
    <div class="filter-row" style="padding-bottom: 4px;">${filterHtml}</div>
    <div class="filter-row">${phaseHtml}</div>
    <div class="page-body">
      <div class="photo-gallery">${albumHtml}</div>
    </div>
  `;
}

// Expose
window.PAGES_EXTRA = { renderCalendar, renderSettings, renderTax, renderSiteDetail, renderPhotos };
