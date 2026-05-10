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
let _calYear = new Date().getFullYear();
let _calMonth = new Date().getMonth() + 1;

// 달력 HTML 캐시
let _calCache = null;
let _calCacheKey = '';

function renderCalendar() {
  const cacheKey = `${_calYear}-${_calMonth}-${Object.keys(window.FB?.scheduleData||{}).length}-${Object.keys(window.FB?._procAll||{}).length}`;

  // 캐시가 있으면 즉시 반환 (이후 백그라운드 업데이트)
  if (_calCache && _calCacheKey === cacheKey) return _calCache;

  const html = _buildCalendarHtml();
  _calCache = html;
  _calCacheKey = cacheKey;
  return html;
}

function _buildCalendarHtml() {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const firstDay = new Date(_calYear, _calMonth - 1, 1).getDay();
  const totalDays = new Date(_calYear, _calMonth, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekHead = days.map((d, i) => `<div class="${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}">${d}</div>`).join('');

  const schedules = window.FB?.scheduleData || {};
  const evMap = {};

  // 1) 일정 데이터
  Object.entries(schedules).forEach(([key, sc]) => {
    if (!sc.date) return;
    const d = parseInt(sc.date.slice(8, 10));
    const ym = sc.date.slice(0, 7);
    const curYm = _calYear + '-' + String(_calMonth).padStart(2, '0');
    if (ym !== curYm) return;
    if (!evMap[d]) evMap[d] = [];
    evMap[d].push({ t: (sc.time ? sc.time + ' ' : '') + sc.title, c: 'accent' });
  });

  // 2) 공정 데이터
  const sites = window.FB?.sites || {};
  const curYm = _calYear + '-' + String(_calMonth).padStart(2, '0');
  Object.values(sites).forEach(site => {
    if (site.status === 'as' || site.status === 'AS관리') return;
    const procKey = (site.name || '').replace(/[.#$/ \[\]]/g, '_');
    const procData = window.FB?._procAll?.[procKey] || {};
    Object.values(procData).forEach(ph => {
      if (!ph.startDate && !ph.doneDate) return;
      const start = ph.startDate || ph.doneDate;
      const end = ph.doneDate || ph.startDate;
      let cur = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T00:00:00');
      while (cur <= endDate) {
        const ds = cur.toISOString().slice(0, 10);
        if (ds.startsWith(curYm)) {
          const d = cur.getDate();
          if (!evMap[d]) evMap[d] = [];
          const label = site.name.length > 6 ? site.name.slice(0, 6) + '..' : site.name;
          const already = evMap[d].some(e => e.t.includes(ph.name));
          if (!already) {
            const stColor = ph.status === 'done' ? 'accent' : ph.status === 'active' ? 'warn' : 'muted';
            evMap[d].push({ t: label + ' ' + ph.name, c: stColor });
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
    });
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push('<div class="cal-day empty"></div>');
  for (let d = 1; d <= totalDays; d++) {
    const col = (firstDay + d - 1) % 7;
    const dateStr = _calYear + '-' + String(_calMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const isToday = dateStr === todayStr;
    const ev = evMap[d] || [];
    const evHtml = ev.slice(0, 2).map(e => `<span class="cal-event" style="color: var(--${e.c}); background: rgba(0,0,0,0.04);">${e.t}</span>`).join('');
    const hasMore = ev.length > 2;
    cells.push(`<div class="cal-day ${isToday ? 'today' : ''} ${col === 0 ? 'sun' : col === 6 ? 'sat' : ''}"
      onclick="openCalDayPopup('${dateStr}')" style="cursor:pointer;">
      <span class="num">${d}</span>${evHtml}
      ${hasMore ? `<span style="font-size:9px;color:var(--muted);">+${ev.length-2}건</span>` : ''}
    </div>`);
  }

  // 다가오는 일정 (오늘 이후 scheduleData)
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = Object.entries(schedules)
    .filter(([, sc]) => sc.date && new Date(sc.date) >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date))
    .slice(0, 5)
    .map(([, sc]) => ({
      d: sc.date.slice(5).replace('-', '/'),
      t: (sc.time ? sc.time + ' ' : '') + sc.title,
      c: 'accent',
    }));

  return `
    <div class="page-header">
      <div>
        <div class="h-eyebrow">📅 일정 · 결제 · AS</div>
        <h1 class="h-title">달력</h1>
      </div>
      <button class="btn btn-primary btn-sm" data-modal="schedule">+ 일정</button>
    </div>
    <div style="padding: 0 var(--pad) 12px;">${ymSelect(_calYear, _calMonth)}</div>
    <div class="cal-head">
      <div class="cal-title num">${_calYear}년 ${_calMonth}월</div>
      <div class="nav-btns">
        <button class="btn-icon" id="cal-prev"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg></button>
        <button class="btn-icon" id="cal-next"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M6 4l4 4-4 4"/></svg></button>
      </div>
    </div>
    <div class="cal-grid">
      <div class="cal-week-head">${weekHead}</div>
      <div class="cal-grid-days">${cells.join('')}</div>
    </div>
    <div class="cal-list">
      <div class="section-label">다가오는 일정 <button class="more" data-modal="schedule">+ 추가</button></div>
      <div class="list">
        ${upcoming.length > 0 ? upcoming.map(u => `
          <div class="list-row">
            <span class="num" style="font-size: 12px; color: var(--muted); font-weight: 600; min-width: 30px;">${u.d}</span>
            <div><div class="lr-title">${u.t}</div></div>
            <span class="pill pill-${u.c}" style="font-size: 9px;">●</span>
          </div>
        `).join('') : '<div class="empty">다가오는 일정이 없어요</div>'}
      </div>
      <button class="btn btn-ghost btn-block" style="margin-top: 12px;">📤 구글 캘린더 연동</button>
    </div>
  `;
}

// 달력 이전/다음 월 이벤트
document.addEventListener('click', (e) => {
  if (e.target.closest('#cal-prev')) {
    _calMonth--; if (_calMonth < 1) { _calMonth = 12; _calYear--; }
    _calCache = null; // 캐시 초기화
    if (window.navigate) window.navigate('calendar');
  }
  if (e.target.closest('#cal-next')) {
    _calMonth++; if (_calMonth > 12) { _calMonth = 1; _calYear++; }
    _calCache = null; // 캐시 초기화
    if (window.navigate) window.navigate('calendar');
  }
});

// 날짜 클릭 시 일별 팝업
function openCalDayPopup(dateStr) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr + 'T00:00:00');
  const mm = parseInt(dateStr.slice(5, 7));
  const dd = parseInt(dateStr.slice(8, 10));
  const dayName = dayNames[date.getDay()];
  const title = `${mm}월 ${dd}일 (${dayName})`;

  // 일정 수집
  const schedules = window.FB?.scheduleData || {};
  const daySchedules = Object.entries(schedules)
    .filter(([, sc]) => sc.date === dateStr)
    .sort((a, b) => (a[1].time || '').localeCompare(b[1].time || ''));

  // 공정 수집
  const sites = window.FB?.sites || {};
  const dayProcs = [];
  Object.values(sites).forEach(site => {
    if (site.status === 'as' || site.status === 'AS관리') return;
    const procKey = (site.name || '').replace(/[.#$/ \[\]]/g, '_');
    const procData = window.FB?._procAll?.[procKey] || {};
    Object.values(procData).forEach(ph => {
      const start = ph.startDate || ph.doneDate;
      const end = ph.doneDate || ph.startDate;
      if (!start) return;
      if (dateStr >= start && dateStr <= end) {
        const todayStr = new Date().toISOString().slice(0, 10);
        let status = 'wait';
        if (todayStr >= start && todayStr <= end) status = 'active';
        if (todayStr > end) status = 'done';
        dayProcs.push({ siteName: site.name, phName: ph.name, start, end, status });
      }
    });
  });

  // HTML 구성
  const procHtml = dayProcs.length > 0 ? `
    <div style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.04em;text-transform:uppercase;margin-bottom:10px;">🔨 공정 일정</div>
    ${dayProcs.map(p => {
      const stColor = p.status === 'done' ? 'var(--accent)' : p.status === 'active' ? 'var(--warn)' : 'var(--faint)';
      const stLabel = p.status === 'done' ? '완료' : p.status === 'active' ? '진행중' : '대기';
      const dateRange = p.start === p.end ? p.start.slice(5).replace('-','.') : p.start.slice(5).replace('-','.') + ' – ' + p.end.slice(5).replace('-','.');
      return `
        <div style="background:var(--surface);border:1px solid var(--hair);border-radius:12px;padding:13px 14px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <div style="font-size:14px;font-weight:700;">${p.siteName}</div>
            <span style="font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:${stColor}20;color:${stColor};">${stLabel}</span>
          </div>
          <div style="font-size:13px;color:var(--ink-2);">🔨 ${p.phName}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:3px;">📅 ${dateRange}</div>
        </div>`;
    }).join('')}
  ` : '';

  const scheduleHtml = daySchedules.length > 0 ? `
    <div style="font-size:11px;font-weight:700;color:var(--muted);letter-spacing:.04em;text-transform:uppercase;margin:${dayProcs.length>0?'16px':'0'} 0 10px;">📌 추가 일정</div>
    ${daySchedules.map(([key, sc]) => `
      <div style="background:var(--surface);border:1px solid var(--hair);border-left:3px solid var(--accent);border-radius:12px;padding:13px 14px;margin-bottom:8px;cursor:pointer;"
        onclick="closeCalDayPopup();modalSchedule('${key}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-size:14px;font-weight:700;">${sc.title || ''}</div>
          ${sc.time ? `<span style="font-size:12px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:3px 10px;border-radius:20px;">${sc.time}</span>` : ''}
        </div>
        ${sc.memo ? `<div style="font-size:12px;color:var(--muted);margin-top:3px;">${sc.memo}</div>` : ''}
        ${sc.attendees && sc.attendees.length ? `<div style="font-size:11px;color:var(--muted);margin-top:3px;">👥 ${sc.attendees.join(', ')}</div>` : ''}
      </div>
    `).join('')}
  ` : '';

  const emptyHtml = (!dayProcs.length && !daySchedules.length) ?
    '<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px;">이 날은 일정이 없어요</div>' : '';

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div style="position:fixed;inset:0;z-index:300;background:rgba(27,24,20,0.5);display:flex;align-items:flex-end;"
      onclick="closeCalDayPopup()">
      <div style="width:100%;max-height:85vh;background:var(--bg);border-radius:18px 18px 0 0;display:flex;flex-direction:column;animation:sheetIn .25s ease;"
        onclick="event.stopPropagation()">
        <!-- 헤더 -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 18px 12px;border-bottom:1px solid var(--hair);">
          <div style="font-size:18px;font-weight:800;">${title}</div>
          <button onclick="closeCalDayPopup()" style="width:32px;height:32px;border-radius:50%;background:var(--hair-soft);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--muted);">✕</button>
        </div>
        <!-- 내용 -->
        <div style="overflow-y:auto;flex:1;padding:16px 18px;">
          ${procHtml}
          ${scheduleHtml}
          ${emptyHtml}
        </div>
        <!-- 일정 추가 버튼 -->
        <div style="padding:12px 18px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--hair);">
          <button onclick="closeCalDayPopup();modalSchedule(null, '${dateStr}')"
            style="width:100%;padding:14px;background:var(--ink);color:var(--bg);border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
            + 이 날 일정 추가
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
}

function closeCalDayPopup() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  document.body.style.overflow = '';
}

function openScheduleForDate(dateStr) {
  // 일정 추가 모달을 해당 날짜로 열기
  if (window.MODALS && window.MODALS.schedule) {
    window.MODALS.schedule();
    // 날짜 인풋 자동 설정
    setTimeout(() => {
      const dateInp = document.getElementById('sched-date');
      if (dateInp) dateInp.value = dateStr;
    }, 100);
  }
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
function encKey(s) { return s.replace(/[.#$/ \[\]]/g, '_'); }

function renderSiteDetail() {
  const s = PMS.sites[0];

  // Firebase procData 에서 공정 데이터 로드
  const procRaw = window._procCache || {};
  const phases = Object.values(procRaw).sort((a, b) => (a.order || 0) - (b.order || 0));

  const todayStr = new Date().toISOString().slice(0, 10);

  function calcStatus(startDate, endDate) {
    if (!startDate && !endDate) return 'wait';
    const today = todayStr;
    if (startDate && today < startDate) return 'wait';
    if (endDate && today > endDate) return 'done';
    return 'active';
  }

  const stLabel = { done: '완료', active: '진행중', wait: '대기' };
  const stClass = { done: 'pill-accent', active: 'pill-warn', wait: 'pill-muted' };
  const dotClass = { done: 'done', active: 'now', wait: 'todo' };

  const tlHtml = phases.length > 0 ? phases.map(p => {
    const st = calcStatus(p.startDate, p.doneDate);
    const startStr = p.startDate ? p.startDate.slice(5).replace('-', '.') : '';
    const endStr = p.doneDate ? p.doneDate.slice(5).replace('-', '.') : '';
    const dateStr = startStr && endStr ? startStr + ' – ' + endStr : startStr || endStr || '';
    return `
    <button class="tl-row" data-modal="phase" style="width: 100%; text-align: left;">
      <span class="tl-dot ${dotClass[st] || 'todo'}"></span>
      <div>
        <div class="tl-name">${p.name} <span class="pill ${stClass[st] || 'pill-muted'}" style="margin-left: 6px; font-size: 9px; padding: 1px 6px;">${stLabel[st] || '대기'}</span></div>
        ${dateStr ? `<div class="tl-meta">${dateStr}</div>` : ''}
      </div>
      <span class="tl-cost num"></span>
    </button>`;
  }).join('') : '<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">등록된 공정이 없어요</div>';

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

      <div class="section-label">공정 진행
        <span class="more">
          ${(() => {
            const total = phases.length;
            const done = phases.filter(p => calcStatus(p.startDate, p.doneDate) === 'done').length;
            const pct = total > 0 ? Math.round(done / total * 100) : 0;
            return pct + '% · 탭하면 수정';
          })()}
        </span>
      </div>
      <div class="timeline">${tlHtml}</div>

      <!-- 거래 내역 -->
      <div class="section-label" style="margin-top:8px;">거래 내역
        <span class="more" onclick="modalTxEdit && navigate('input')" style="cursor:pointer;">+ 입력</span>
      </div>
      <div class="list">
        ${(() => {
          const entries = Object.entries(window.FB?.entries || {})
            .filter(([, e]) => e.site === s.name)
            .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
          if (!entries.length) return '<div class="empty" style="padding:16px;">거래 내역이 없어요</div>';
          return entries.map(([key, e]) => {
            const cls = e.type === 'revenue' ? 'pill-accent' : e.type === 'as' ? 'pill-pin' : 'pill-warn';
            const label = e.type === 'revenue' ? '매출' : e.type === 'as' ? 'AS' : '매입';
            const sign = e.type === 'revenue' ? '+' : '−';
            const date = e.date ? e.date.slice(5).replace('-','/') : '';
            return `
              <button class="list-row" onclick="modalTxEdit('${key}')" style="width:100%;text-align:left;">
                <span class="pill ${cls}">${label}</span>
                <div>
                  <div class="lr-title">${e.process || e.payStage || ''}</div>
                  <div class="lr-meta">${e.writer||''} · ${date}</div>
                </div>
                <span class="lr-amount num">${sign}${fmtSlim2(e.amount||0)}</span>
              </button>`;
          }).join('');
        })()}
      </div>

      <button class="btn btn-ghost btn-block" onclick="modalAS(null)" style="margin-top: 14px;">🔧 AS 등록</button>
    </div>
  `;
}

// ===== Photos (현장 사진 보관함) =====
function renderPhotos() {
  const sites = Object.values(window.FB?.sites || {}).map(s => s.name).filter(Boolean);
  const photoData = window.FB?.photoData || {};

  const albums = [];
  Object.entries(photoData).forEach(([siteKey, phaseMap]) => {
    if (typeof phaseMap !== 'object') return;
    Object.entries(phaseMap).forEach(([recordKey, record]) => {
      if (record && record.photos && record.photos.length) albums.push(record);
    });
  });
  albums.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  // 검색어 필터
  const searchQ = window._photoSearch || '';
  const filtered = searchQ
    ? albums.filter(a => (a.site||'').includes(searchQ) || (a.phase||'').includes(searchQ))
    : albums;

  const filterHtml = ['전체', ...sites].map((s, i) => `
    <button class="filter-chip ${(window._photoSiteFilter||'전체') === s ? 'is-active' : ''}"
      onclick="setPhotoFilter('${s}')">${s}</button>
  `).join('');

  const phases = ['전체', '시공 전', '철거', '목공', '타일', '도배', '시공 후', 'AS'];
  const phaseHtml = phases.map(p => `
    <button class="filter-chip ${(window._photoPhaseFilter||'전체') === p ? 'is-active' : ''}"
      onclick="setPhotoPhaseFilter('${p}')">${p}</button>
  `).join('');

  // 사이트/공정 필터 적용
  const siteF = window._photoSiteFilter || '전체';
  const phaseF = window._photoPhaseFilter || '전체';
  const display = filtered.filter(a =>
    (siteF === '전체' || a.site === siteF) &&
    (phaseF === '전체' || a.phase === phaseF)
  );

  const albumHtml = display.length > 0 ? display.map(a => {
    const thumb = a.photos[0];
    const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString('ko-KR', {month:'numeric',day:'numeric'}) : '';
    const photosEncoded = encodeURIComponent(JSON.stringify(a.photos));
    return `
      <div style="cursor:pointer;" onclick="openPhotoAlbum('${photosEncoded}')">
        <div style="width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;position:relative;background:var(--surface-2);">
          <img src="${thumb}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
          <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.55);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;">📷 ${a.photos.length}</div>
        </div>
        <div style="font-size:12px;font-weight:700;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.site || ''}</div>
        <div style="font-size:11px;color:var(--muted);">${a.phase || ''} · ${date}</div>
      </div>
    `;
  }).join('') : `<div class="empty" style="grid-column:span 2;padding:40px 0;text-align:center;">
    📷 ${searchQ ? `"${searchQ}" 검색 결과 없음` : '등록된 사진이 없어요'}
    <br><span style="font-size:12px;color:var(--muted);">위 업로드 버튼으로 추가하세요</span>
  </div>`;

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
      <button class="btn btn-primary btn-sm" onclick="openPhotoUploadModal()">+ 업로드</button>
    </div>
    <div style="padding: 0 var(--pad) 12px;">
      <div class="search-box">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="16" height="16"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>
        <input class="search-input" placeholder="현장명·공정 검색"
          value="${searchQ}"
          oninput="window._photoSearch=this.value;navigate('photos')">
      </div>
    </div>
    <div class="filter-row" style="padding-bottom:4px;overflow-x:auto;">${filterHtml}</div>
    <div class="filter-row" style="overflow-x:auto;">${phaseHtml}</div>
    <div class="page-body">
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;">총 ${display.length}개 앨범</div>
      <div class="photo-gallery">${albumHtml}</div>
    </div>
  `;
}

function setPhotoFilter(site) {
  window._photoSiteFilter = site;
  if (window.navigate) window.navigate('photos');
}
function setPhotoPhaseFilter(phase) {
  window._photoPhaseFilter = phase;
  if (window.navigate) window.navigate('photos');
}

function openPhotoAlbum(photosEncoded) {
  const photos = JSON.parse(decodeURIComponent(photosEncoded));
  if (!photos.length) return;

  let currentIdx = 0;

  function renderViewer() {
    return `
      <div id="photo-viewer" style="position:fixed;inset:0;z-index:999;background:#000;display:flex;flex-direction:column;touch-action:pan-y;">
        <!-- 상단 헤더 -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 20px;padding-top:calc(52px + env(safe-area-inset-top));">
          <span style="color:rgba(255,255,255,0.7);font-size:14px;font-weight:600;">${currentIdx+1} / ${photos.length}</span>
          <button onclick="closeModal()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:50%;width:44px;height:44px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <!-- 슬라이드 영역 -->
        <div style="flex:1;display:flex;align-items:center;overflow:hidden;position:relative;" id="slide-container">
          <div id="slide-track" style="display:flex;transition:transform .25s ease;width:${photos.length*100}%;height:100%;">
            ${photos.map((p, i) => `
              <div style="width:${100/photos.length}%;height:100%;display:flex;align-items:center;justify-content:center;padding:0 4px;">
                <img src="${p}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;user-select:none;-webkit-user-drag:none;">
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 하단 인디케이터 -->
        <div style="display:flex;justify-content:center;gap:6px;padding:16px 0;padding-bottom:calc(16px + env(safe-area-inset-bottom));">
          ${photos.map((_, i) => `
            <div id="dot-${i}" style="width:${i===0?'20px':'6px'};height:6px;border-radius:3px;background:${i===0?'#fff':'rgba(255,255,255,0.4)'};transition:all .2s;"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  const root = document.getElementById('modal-root');
  root.innerHTML = renderViewer();
  document.body.style.overflow = 'hidden';

  // 슬라이드 함수
  function goTo(idx) {
    if (idx < 0 || idx >= photos.length) return;
    currentIdx = idx;
    const track = document.getElementById('slide-track');
    if (track) track.style.transform = `translateX(-${idx * (100/photos.length)}%)`;
    // 인디케이터 업데이트
    photos.forEach((_, i) => {
      const dot = document.getElementById('dot-' + i);
      if (!dot) return;
      dot.style.width = i === idx ? '20px' : '6px';
      dot.style.background = i === idx ? '#fff' : 'rgba(255,255,255,0.4)';
    });
  }

  // 터치 스와이프
  let touchStartX = 0, touchStartY = 0, isDragging = false;
  const container = document.getElementById('slide-container');

  container.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  container.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    // 수평 스와이프가 수직보다 크면 스크롤 막기
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
      const track = document.getElementById('slide-track');
      if (track) {
        const base = currentIdx * (100/photos.length);
        const offset = (dx / window.innerWidth) * (100/photos.length) * 100;
        track.style.transition = 'none';
        track.style.transform = `translateX(calc(-${base}% + ${dx}px))`;
      }
    }
  }, { passive: false });

  container.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const track = document.getElementById('slide-track');
    if (track) track.style.transition = 'transform .25s ease';

    if (dx < -50 && currentIdx < photos.length - 1) {
      goTo(currentIdx + 1);
    } else if (dx > 50 && currentIdx > 0) {
      goTo(currentIdx - 1);
    } else {
      goTo(currentIdx); // 원래 위치로
    }
  }, { passive: true });

  // 좌우 화살표 키보드 지원
  function onKey(e) {
    if (e.key === 'ArrowRight') goTo(currentIdx + 1);
    if (e.key === 'ArrowLeft') goTo(currentIdx - 1);
    if (e.key === 'Escape') closeModal();
  }
  document.addEventListener('keydown', onKey);

  // 모달 닫힐 때 이벤트 제거
  const origClose = window.closeModal;
  window.closeModal = function() {
    document.removeEventListener('keydown', onKey);
    window.closeModal = origClose;
    origClose();
  };
}

// Expose
window.PAGES_EXTRA = { renderCalendar, renderSettings, renderTax, renderSiteDetail, renderPhotos };
