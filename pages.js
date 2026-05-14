// 머니플로우 — Pages

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

function ymSelect(year = 2026, month = 5) {
  const years = [2024, 2025, 2026, 2027];
  const yh = years.map(y => `<option ${y === year ? 'selected' : ''}>${y}</option>`).join('');
  const mh = [...Array(12)].map((_, i) => `<option ${i + 1 === month ? 'selected' : ''}>${i + 1}월</option>`).join('');
  return `<div class="ym-selects"><select class="ym-sel">${yh}</select><select class="ym-sel">${mh}</select></div>`;
}

// ===== Calendar =====
let _calYear = new Date().getFullYear();
let _calMonth = new Date().getMonth() + 1;
let _calCache = null;
let _calCacheKey = '';

function renderCalendar() {
  const cacheKey = `${_calYear}-${_calMonth}-${Object.keys(window.FB?.scheduleData||{}).length}-${Object.keys(window.FB?._procAll||{}).length}`;
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
  const weekHead = days.map((d, i) => `<div class="${i===0?'sun':i===6?'sat':''}">${d}</div>`).join('');

  const schedules = window.FB?.scheduleData || {};
  const evMap = {};

  Object.entries(schedules).forEach(([key, sc]) => {
    if (!sc.date) return;
    const d = parseInt(sc.date.slice(8, 10));
    const ym = sc.date.slice(0, 7);
    const curYm = _calYear + '-' + String(_calMonth).padStart(2, '0');
    if (ym !== curYm) return;
    if (!evMap[d]) evMap[d] = [];
    evMap[d].push({ t: (sc.time ? sc.time + ' ' : '') + sc.title, c: 'accent' });
  });

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
    const evHtml = ev.slice(0, 2).map(e => `<span class="cal-event" style="color:var(--${e.c});background:rgba(0,0,0,0.04);">${e.t}</span>`).join('');
    const hasMore = ev.length > 2;
    cells.push(`<div class="cal-day ${isToday?'today':''} ${col===0?'sun':col===6?'sat':''}" onclick="openCalDayPopup('${dateStr}')" style="cursor:pointer;">
      <span class="num">${d}</span>${evHtml}
      ${hasMore ? `<span style="font-size:11px;color:var(--muted);">+${ev.length-2}건</span>` : ''}
    </div>`);
  }

  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = Object.entries(schedules)
    .filter(([, sc]) => sc.date && new Date(sc.date) >= today)
    .sort((a, b) => a[1].date.localeCompare(b[1].date))
    .slice(0, 5)
    .map(([, sc]) => ({ d: sc.date.slice(5).replace('-', '/'), t: (sc.time ? sc.time + ' ' : '') + sc.title, c: 'accent' }));

  return `
    <div class="page-header">
      <div><div class="h-eyebrow">📅 일정 · 결제 · AS</div><h1 class="h-title">달력</h1></div>
      <button class="btn btn-primary btn-sm" data-modal="schedule">+ 일정</button>
    </div>
    <div style="padding:0 var(--pad) 12px;">${ymSelect(_calYear, _calMonth)}</div>
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
            <span class="num" style="font-size:13px;color:var(--muted);font-weight:600;min-width:30px;">${u.d}</span>
            <div><div class="lr-title">${u.t}</div></div>
            <span class="pill pill-${u.c}" style="font-size:11px;">●</span>
          </div>`).join('') : '<div class="empty">다가오는 일정이 없어요</div>'}
      </div>
    </div>`;
}

document.addEventListener('click', (e) => {
  if (e.target.closest('#cal-prev')) {
    _calMonth--; if (_calMonth < 1) { _calMonth = 12; _calYear--; }
    _calCache = null;
    if (window.navigate) window.navigate('calendar');
  }
  if (e.target.closest('#cal-next')) {
    _calMonth++; if (_calMonth > 12) { _calMonth = 1; _calYear++; }
    _calCache = null;
    if (window.navigate) window.navigate('calendar');
  }
});

function openCalDayPopup(dateStr) {
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr + 'T00:00:00');
  const mm = parseInt(dateStr.slice(5, 7));
  const dd = parseInt(dateStr.slice(8, 10));
  const title = `${mm}월 ${dd}일 (${dayNames[date.getDay()]})`;

  const schedules = window.FB?.scheduleData || {};
  const daySchedules = Object.entries(schedules)
    .filter(([, sc]) => sc.date === dateStr)
    .sort((a, b) => (a[1].time || '').localeCompare(b[1].time || ''));

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

  const procHtml = dayProcs.length > 0 ? `
    <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:10px;">🔨 공정 일정</div>
    ${dayProcs.map(p => {
      const stColor = p.status==='done'?'var(--accent)':p.status==='active'?'var(--warn)':'var(--faint)';
      const stLabel = p.status==='done'?'완료':p.status==='active'?'진행중':'대기';
      const dateRange = p.start===p.end ? p.start.slice(5).replace('-','.') : p.start.slice(5).replace('-','.')+' – '+p.end.slice(5).replace('-','.');
      return `<div style="background:var(--surface);border:1px solid var(--hair);border-radius:12px;padding:13px 14px;margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-size:14px;font-weight:700;">${p.siteName}</div>
          <span style="font-size:12px;font-weight:700;padding:3px 8px;border-radius:20px;background:${stColor}20;color:${stColor};">${stLabel}</span>
        </div>
        <div style="font-size:13px;color:var(--ink-2);">🔨 ${p.phName}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:3px;">📅 ${dateRange}</div>
      </div>`;
    }).join('')}` : '';

  const scheduleHtml = daySchedules.length > 0 ? `
    <div style="font-size:13px;font-weight:700;color:var(--muted);margin:${dayProcs.length>0?'16px':'0'} 0 10px;">📌 추가 일정</div>
    ${daySchedules.map(([key, sc]) => `
      <div style="background:var(--surface);border:1px solid var(--hair);border-left:3px solid var(--accent);border-radius:12px;padding:13px 14px;margin-bottom:8px;cursor:pointer;"
        onclick="closeCalDayPopup();modalSchedule('${key}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-size:14px;font-weight:700;">${sc.title||''}</div>
          ${sc.time ? `<span style="font-size:13px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:3px 10px;border-radius:20px;">${sc.time}</span>` : ''}
        </div>
        ${sc.memo ? `<div style="font-size:13px;color:var(--muted);margin-top:3px;">${sc.memo}</div>` : ''}
        ${sc.attendees&&sc.attendees.length ? `<div style="font-size:13px;color:var(--muted);margin-top:3px;">👥 ${sc.attendees.join(', ')}</div>` : ''}
      </div>`).join('')}` : '';

  const emptyHtml = (!dayProcs.length && !daySchedules.length) ?
    '<div style="text-align:center;padding:24px 0;color:var(--muted);font-size:13px;">이 날은 일정이 없어요</div>' : '';

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div style="position:fixed;inset:0;z-index:300;background:rgba(27,24,20,0.5);display:flex;align-items:flex-end;" onclick="closeCalDayPopup()">
      <div style="width:100%;max-height:85vh;background:var(--bg);border-radius:18px 18px 0 0;display:flex;flex-direction:column;" onclick="event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 18px 12px;border-bottom:1px solid var(--hair);">
          <div style="font-size:18px;font-weight:800;">${title}</div>
          <button onclick="closeCalDayPopup()" style="width:32px;height:32px;border-radius:50%;background:var(--hair-soft);display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--muted);">✕</button>
        </div>
        <div style="overflow-y:auto;flex:1;padding:16px 18px;">${procHtml}${scheduleHtml}${emptyHtml}</div>
        <div style="padding:12px 18px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--hair);">
          <button onclick="closeCalDayPopup();modalSchedule(null,'${dateStr}')"
            style="width:100%;padding:14px;background:var(--ink);color:var(--bg);border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;">
            + 이 날 일정 추가
          </button>
        </div>
      </div>
    </div>`;
  document.body.style.overflow = 'hidden';
}

function closeCalDayPopup() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
  document.body.style.overflow = '';
}

// ===== Settings =====
function renderSettings() {
  const fc = PMS.fixedCosts;
  const total = fc.reduce((a, b) => a + b.value, 0);
  const labels = ['직원급여', '임대료', '마케팅비', '관리비', '카드비', '기타'];
  const icons  = ['👥', '🏢', '📣', '⚙️', '💳', '📦'];
  const aligned = labels.map((l, i) => ({ label: l, icon: icons[i], value: fc[i] ? fc[i].value : 0 }));
  const canFC = AUTH.can('fixedCost');
  const canStaffMgmt = AUTH.can('staffMgmt');
  const canStaffSalary = AUTH.can('staffSalary');
  const canCsv = AUTH.can('csvExport');

  return `
    <div class="page-header">
      <div><div class="h-eyebrow">${AUTH.roleLabel()} · ${AUTH.current()?.name||''}</div><h1 class="h-title">설정</h1></div>
      <button class="btn-icon" id="logout-btn" title="로그아웃">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 4h4v12h-4M8 14l-4-4 4-4M4 10h10"/></svg>
      </button>
    </div>
    <div class="page-body">
      <button class="menu-card" data-goto="photos" style="width:100%;">
        <div class="mc-icon">📸</div>
        <div class="mc-body"><div class="mc-title">현장 사진 보관함</div><div class="mc-meta">현장별 시공 전·중·후 사진 모아보기</div></div>
        <span class="chev">›</span>
      </button>
      ${canFC ? `
      <div class="settings-group-label">📌 월 고정비</div>
      ${ymSelect(new Date().getFullYear(), new Date().getMonth()+1)}
      <div class="settings-group" style="margin-top:10px;">
        ${aligned.map(c => `
          <div class="settings-row">
            <span class="sr-key"><span class="fc-icon">${c.icon}</span> ${c.label}</span>
            <input class="fc-input num" value="${c.value.toLocaleString('ko-KR')}">
          </div>`).join('')}
      </div>
      <div class="total-bar"><span class="tb-k">합계</span><span class="tb-v num">${fmtFull2(total)}</span></div>
      <button class="btn btn-primary btn-block" style="margin-top:12px;">💾 저장</button>
      ` : `<div class="locked-card"><div class="lc-icon">🔒</div><div><div class="lc-title">월 고정비 (대표 전용)</div><div class="lc-meta">임대료·급여·마케팅 등 고정 지출은 대표 권한으로만 확인할 수 있어요.</div></div></div>`}
      ${canCsv ? `<div class="settings-group-label">📥 데이터 내보내기</div><button class="btn btn-ghost btn-block">현장별 손익 CSV 다운로드</button>` : ''}
      <div class="settings-group-label">👥 직원 관리</div>
      ${canStaffMgmt ? `
      <div class="tabs" style="margin-bottom:12px;">
        <button class="tab is-active">🟢 재직중 (${PMS.staff.length})</button>
        <button class="tab">🔴 퇴사자 (0)</button>
      </div>
      <div class="settings-group">
        ${PMS.staff.map(s => `
          <button class="settings-row" style="width:100%;text-align:left;" data-modal="staff">
            <div style="display:flex;gap:12px;align-items:center;">
              <div class="avatar" style="width:36px;height:36px;font-size:13px;background:#E8DFCD;border-radius:50%;display:grid;place-items:center;font-weight:700;">${s.name[0]}</div>
              <div>
                <div class="sr-key">${s.name} <span style="color:var(--muted);font-weight:400;font-size:13px;">${s.role}</span></div>
                <div style="font-size:13px;color:var(--muted);margin-top:2px;">입사 ${s.joined}${canStaffSalary ? ` · ${(s.salary||0).toLocaleString('ko-KR')}원` : ''}</div>
              </div>
            </div>
            <span class="pill pill-accent" style="font-size:12px;">${s.status}</span>
          </button>`).join('')}
      </div>
      <button class="btn btn-ghost btn-block" data-modal="staff" style="margin-top:8px;">+ 직원 추가</button>
      ` : `
      <div class="settings-group">
        ${PMS.staff.map(s => `
          <div class="settings-row">
            <div style="display:flex;gap:12px;align-items:center;">
              <div class="avatar" style="width:36px;height:36px;background:#E8DFCD;border-radius:50%;display:grid;place-items:center;font-weight:700;">${s.name[0]}</div>
              <div>
                <div class="sr-key">${s.name} <span style="color:var(--muted);font-weight:400;font-size:13px;">${s.role}</span></div>
                <div style="font-size:13px;color:var(--muted);margin-top:2px;">입사 ${s.joined}</div>
              </div>
            </div>
          </div>`).join('')}
      </div>
      ${!canStaffSalary ? '<div class="locked-inline">🔒 급여 정보는 대표만 볼 수 있어요</div>' : ''}`}
      <div style="text-align:center;padding:32px 0 8px;color:var(--faint);font-size:13px;">머니플로우 v1.2 · ${PMS.company} · ${AUTH.roleLabel()}</div>
    </div>`;
}

// ===== Tax =====
function renderTax() {
  const qHtml = PMS.tax.quarters.map(q => `
    <div class="list-row">
      <div></div>
      <div><div class="lr-title">${q.q}</div><div class="lr-meta">매출 ${q.revenue>0?fmtSlim2(q.revenue):'—'}</div></div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="num" style="font-weight:600;font-size:13px;">${q.vat>0?fmtSlim2(q.vat):'—'}</span>
        <span class="pill ${q.status==='paid'?'pill-accent':q.status==='pending'?'pill-warn':'pill-muted'}" style="font-size:11px;">
          ${q.status==='paid'?'납부':q.status==='pending'?'대기':'예정'}
        </span>
      </div>
    </div>`).join('');
  return `
    <div class="breadcrumb"><button class="back-btn" data-goto="home"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 홈</button></div>
    <div class="page-header"><div><div class="h-eyebrow">2026 1기 · D-${PMS.tax.daysLeft}</div><h1 class="h-title">세금 · 부가세</h1></div></div>
    <div class="page-body">
      <div class="tax-hero">
        <div class="th-eyebrow">다가오는 달에 내야 할 세금은</div>
        <div class="th-amount num">${fmtSlim2(PMS.tax.vatPayable)}</div>
        <div class="th-meta"><span class="pill pill-warn">D-${PMS.tax.daysLeft}</span><span>납부 마감 · ${PMS.tax.nextDue}</span></div>
      </div>
      <div class="section-label">분기별 납부 현황</div>
      <div class="list">${qHtml}</div>
    </div>`;
}

// ===== Site Detail =====
let _entryGrouped = true;

function toggleEntryGrouping() {
  _entryGrouped = !_entryGrouped;
  const btn = document.getElementById('group-toggle-btn');
  if (btn) {
    btn.textContent = _entryGrouped ? '공정별 묶기 ON' : '공정별 묶기 OFF';
    btn.style.background = _entryGrouped ? 'var(--accent)' : 'var(--surface-2)';
    btn.style.color = _entryGrouped ? '#fff' : 'var(--ink)';
  }
  const siteName = window.MOCK?.sites?.[0]?.name || '';
  const wrap = document.getElementById('entry-list-wrap');
  if (wrap) wrap.innerHTML = renderEntryList(siteName, _entryGrouped);
}

function renderEntryList(siteName, grouped) {
  const entries = Object.entries(window.FB?.entries || {})
    .filter(([, e]) => e.site === siteName)
    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));

  if (!entries.length) return '<div class="empty" style="padding:16px;">거래 내역이 없어요</div>';

  function entryRow([key, e]) {
    const cls = e.type==='revenue'?'pill-accent':e.type==='as'?'pill-pin':'pill-warn';
    const label = e.type==='revenue'?'매출':e.type==='as'?'AS':'매입';
    const isRev = e.type==='revenue';
    const sign = isRev ? '' : '−';
    const amtStyle = isRev ? 'color:#2563EB;' : '';
    const date = e.date ? e.date.slice(5).replace('-', '/') : '';
    return `
      <button class="list-row" onclick="modalTxEdit('${key}')" style="width:100%;text-align:left;">
        <span class="pill ${cls}">${label}</span>
        <div style="min-width:0;">
          <div class="lr-title">${e.process||e.payStage||'기타'}</div>
          <div class="lr-meta">${e.writer||''} · ${date}</div>
          ${e.memo ? `<div style="font-size:13px;color:var(--muted);margin-top:2px;white-space:normal;line-height:1.4;">💬 ${e.memo}</div>` : ''}
        </div>
        <span class="lr-amount num" style="flex-shrink:0;${amtStyle}">${sign}${(e.amount||0).toLocaleString('ko-KR')}</span>
      </button>`;
  }

  if (!grouped) return `<div class="list">${entries.map(entryRow).join('')}</div>`;

  const groups = {};
  entries.forEach(([key, e]) => {
    const g = e.process || e.payStage || '기타';
    if (!groups[g]) groups[g] = { entries: [], total: 0 };
    groups[g].entries.push([key, e]);
    groups[g].total += (e.amount||0) * (e.type==='revenue' ? 1 : -1);
  });

  return Object.entries(groups).map(([groupName, g]) => {
    const totalColor = g.total >= 0 ? 'var(--accent)' : 'var(--warn)';
    const totalSign = g.total >= 0 ? '' : '−';
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;background:var(--surface-2);border-radius:10px 10px 0 0;border:1px solid var(--hair);border-bottom:none;">
          <div style="font-size:13px;font-weight:700;color:var(--ink);">📦 ${groupName}</div>
          <div style="font-size:13px;font-weight:800;color:${totalColor};">${totalSign}${Math.abs(g.total).toLocaleString('ko-KR')}</div>
        </div>
        <div class="list" style="border-radius:0 0 10px 10px;">${g.entries.map(entryRow).join('')}</div>
      </div>`;
  }).join('');
}

function toggleProcList() {
  const list = document.getElementById('proc-full-list');
  if (!list) return;
  const open = list.style.display === 'none';
  list.style.display = open ? 'block' : 'none';
  const arrow = document.getElementById('proc-toggle-arrow');
  const label = document.getElementById('proc-toggle-label');
  const btn = document.getElementById('proc-toggle-btn');
  const cnt = btn ? (btn.dataset.count || '') : '';
  if (arrow) arrow.textContent = open ? '▴' : '▾';
  if (label) label.textContent = open ? '전체 공정 접기' : `전체 공정 ${cnt}개 펼치기`;
}

function renderSiteDetail() {
  const s = PMS.sites.find(x => x && x.name === window._siteDetailName) || PMS.sites[0];
  const procRaw = window._procCache || {};
  const phases = Object.values(procRaw).sort((a, b) => (a.order||0) - (b.order||0));
  const todayStr = new Date().toISOString().slice(0, 10);

  function calcStatus(startDate, endDate) {
    if (!startDate && !endDate) return 'wait';
    if (startDate && todayStr < startDate) return 'wait';
    if (endDate && todayStr > endDate) return 'done';
    return 'active';
  }

  const stLabel = { done:'완료', active:'진행중', wait:'대기' };
  const stClass = { done:'pill-accent', active:'pill-warn', wait:'pill-muted' };
  const dotClass = { done:'done', active:'now', wait:'todo' };

  const tlHtml = phases.length > 0 ? phases.map(p => {
    const st = calcStatus(p.startDate, p.doneDate);
    const startStr = p.startDate ? p.startDate.slice(5).replace('-', '.') : '';
    const endStr   = p.doneDate  ? p.doneDate.slice(5).replace('-', '.')  : '';
    const dateStr  = startStr && endStr ? startStr + ' – ' + endStr : startStr || endStr || '';
    return `
    <button class="tl-row" onclick="openProcEditModal('${p.id}','${(s.name||'').replace(/'/g,"\\'")}')  " style="width:100%;text-align:left;">
      <span class="tl-dot ${dotClass[st]||'todo'}"></span>
      <div>
        <div class="tl-name">${p.name} <span class="pill ${stClass[st]||'pill-muted'}" style="margin-left:6px;font-size:11px;padding:1px 6px;">${stLabel[st]||'대기'}</span></div>
        ${dateStr ? `<div class="tl-meta">${dateStr}</div>` : ''}
      </div>
      <span style="color:var(--muted);font-size:14px;">›</span>
    </button>`;
  }).join('') : '<div style="padding:16px;text-align:center;color:var(--muted);font-size:13px;">등록된 공정이 없어요</div>';

  const done = phases.filter(p => calcStatus(p.startDate, p.doneDate) === 'done').length;
  const pct  = phases.length > 0 ? Math.round(done / phases.length * 100) : 0;

  // 지하철 노선도식 — 이전 / 진행 중 / 다음 공정 3개만 상단 노출
  let curIdx = phases.findIndex(ph => calcStatus(ph.startDate, ph.doneDate) === 'active');
  if (curIdx === -1) curIdx = phases.findIndex(ph => calcStatus(ph.startDate, ph.doneDate) === 'wait');
  if (curIdx === -1) curIdx = phases.length - 1;
  const prevP = curIdx > 0 ? phases[curIdx - 1] : null;
  const curP  = phases[curIdx] || null;
  const nextP = curIdx < phases.length - 1 ? phases[curIdx + 1] : null;
  const curIsActive = curP && calcStatus(curP.startDate, curP.doneDate) === 'active';

  function mmdd(d) { return d ? d.slice(5).replace('-', '.') : ''; }
  function procMeta(ph) {
    const st = calcStatus(ph.startDate, ph.doneDate);
    const a = mmdd(ph.startDate), b = mmdd(ph.doneDate);
    if (st === 'done')   return b || a || '완료';
    if (st === 'active') return a ? a + ' ~' : '진행 중';
    return a ? a + ' 예정' : '예정';
  }
  function subwayStation(ph, role, lineL, lineR) {
    const labelMap = { prev: '이전', cur: curIsActive ? '진행 중' : '다음 차례', next: '다음' };
    const labelColor = role === 'cur' ? 'var(--accent)' : 'var(--muted)';
    if (!ph) {
      const txt = role === 'prev' ? '시작 전' : role === 'next' ? '마지막 공정' : '-';
      return `<div style="flex:1;text-align:center;opacity:.45;">
        <div style="font-size:12px;font-weight:700;color:var(--muted);margin-bottom:4px;">${labelMap[role]}</div>
        <div style="display:flex;align-items:center;height:20px;">
          <div style="flex:1;height:2px;background:${lineL};"></div>
          <span style="width:11px;height:11px;border-radius:50%;background:var(--faint);flex-shrink:0;"></span>
          <div style="flex:1;height:2px;background:${lineR};"></div>
        </div>
        <div style="font-size:13px;font-weight:700;color:var(--muted);margin-top:5px;">${txt}</div>
        <div style="font-size:12px;color:var(--muted);margin-top:1px;">&nbsp;</div>
      </div>`;
    }
    const st = calcStatus(ph.startDate, ph.doneDate);
    const isCur = role === 'cur';
    let dot;
    if (st === 'active') dot = 'width:15px;height:15px;border-radius:50%;background:var(--warn);box-shadow:0 0 0 3px rgba(154,75,46,.18);flex-shrink:0;';
    else if (st === 'done') dot = `width:${isCur ? 14 : 11}px;height:${isCur ? 14 : 11}px;border-radius:50%;background:var(--accent);flex-shrink:0;`;
    else dot = `width:${isCur ? 14 : 11}px;height:${isCur ? 14 : 11}px;border-radius:50%;background:var(--faint);flex-shrink:0;`;
    const nameColor = isCur ? 'var(--ink)' : 'var(--muted)';
    const nameWeight = isCur ? '800' : '700';
    return `<button onclick="openProcEditModal('${ph.id}','${(s.name || '').replace(/'/g, "\\'")}')" style="flex:1;background:none;border:0;padding:0;cursor:pointer;font-family:inherit;text-align:center;">
      <div style="font-size:12px;font-weight:700;color:${labelColor};margin-bottom:4px;">${labelMap[role]}</div>
      <div style="display:flex;align-items:center;height:20px;">
        <div style="flex:1;height:2px;background:${lineL};"></div>
        <span style="${dot}"></span>
        <div style="flex:1;height:2px;background:${lineR};"></div>
      </div>
      <div style="font-size:13.5px;font-weight:${nameWeight};color:${nameColor};margin-top:5px;line-height:1.3;">${ph.name}</div>
      <div style="font-size:12px;color:var(--muted);margin-top:1px;">${procMeta(ph)}</div>
    </button>`;
  }
  const _segL = prevP ? 'var(--accent)' : 'var(--hair)';
  const _segR = 'var(--hair)';
  const subwayBar = `
    <div style="background:#fff;border:1.5px solid var(--hair);border-radius:14px;padding:14px 8px 12px;margin-bottom:8px;display:flex;">
      ${subwayStation(prevP, 'prev', 'transparent', _segL)}
      ${subwayStation(curP, 'cur', _segL, _segR)}
      ${subwayStation(nextP, 'next', _segR, 'transparent')}
    </div>`;

  return `
    <div class="breadcrumb">
      <button class="back-btn" data-goto="sites">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 현장
      </button>
    </div>
    <div class="page-header">
      <div>
        <div style="display:flex;align-items:center;gap:8px;">
          <h1 class="h-title">${s.name}</h1>
          <span class="pill status-${s.status}">${s.status}</span>
        </div>
        <div class="h-sub">${s.client} · ${s.start} – ${s.end}</div>
      </div>
    </div>
    <div class="page-body">
      <div class="stat-row">
        <div class="stat"><div class="stat-label">매출</div><div class="stat-value num">${fmtSlim2(s.revenue)}</div></div>
        <div class="stat"><div class="stat-label">매입</div><div class="stat-value num">${fmtSlim2(s.cost)}</div></div>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="stat-label">순이익</div><div class="stat-value num" style="color:${s.profit>0?'#DC2626':s.profit<0?'#2563EB':'var(--ink)'};">${fmtSlim2(s.profit)}</div></div>
        <div class="stat"><div class="stat-label">이익률</div><div class="stat-value num">${s.margin}%</div></div>
      </div>
      <div class="section-label">공정 진행 <span class="more">${pct}% 완료</span></div>
      ${phases.length > 0 ? `
        ${subwayBar}
        <button onclick="toggleProcList()" id="proc-toggle-btn" data-count="${phases.length}" style="width:100%;background:#fff;border:1.5px solid var(--hair);border-radius:12px;padding:11px;font-size:13.5px;font-weight:700;color:var(--muted);cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span id="proc-toggle-label">전체 공정 ${phases.length}개 펼치기</span>
          <span id="proc-toggle-arrow" style="font-size:12px;">▾</span>
        </button>
        <div id="proc-full-list" style="display:none;margin-top:8px;">
          <div class="timeline">${tlHtml}</div>
        </div>
      ` : `<div class="timeline">${tlHtml}</div>`}
      <div class="section-label" style="margin-top:8px;">거래 내역
        <span style="display:flex;gap:6px;align-items:center;">
          <button onclick="toggleEntryGrouping()" id="group-toggle-btn"
            style="background:var(--accent);color:#fff;border:none;border-radius:20px;padding:3px 10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">
            공정별 묶기 ON
          </button>
          <span class="more" onclick="navigate('input')" style="cursor:pointer;">+ 입력</span>
        </span>
      </div>
      <div id="entry-list-wrap">${renderEntryList(s.name, true)}</div>
      <button class="btn btn-ghost btn-block" onclick="modalAS(null)" style="margin-top:14px;">🔧 AS 등록</button>
    </div>`;
}

// ===== Photos =====
function renderPhotos() {
  const sites = Object.values(window.FB?.sites||{}).map(s=>s.name).filter(Boolean);
  const photoData = window.FB?.photoData || {};
  const albums = [];
  Object.entries(photoData).forEach(([, phaseMap]) => {
    if (typeof phaseMap !== 'object') return;
    Object.entries(phaseMap).forEach(([, record]) => {
      if (record && record.photos && record.photos.length) albums.push(record);
    });
  });
  albums.sort((a, b) => (b.createdAt||0) - (a.createdAt||0));

  const searchQ = window._photoSearch || '';
  const siteF   = window._photoSiteFilter  || '전체';
  const phaseF  = window._photoPhaseFilter || '전체';

  const display = albums
    .filter(a => !searchQ || (a.site||'').includes(searchQ) || (a.phase||'').includes(searchQ))
    .filter(a => siteF==='전체' || a.site===siteF)
    .filter(a => phaseF==='전체' || a.phase===phaseF);

  function thumbUrl(url) {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/w_400,h_400,c_fill,q_auto,f_auto/');
  }

  const filterHtml = ['전체', ...sites].map(s =>
    `<button class="filter-chip ${siteF===s?'is-active':''}" onclick="setPhotoFilter('${s}')">${s}</button>`
  ).join('');
  const phaseHtml = ['전체','시공 전','철거','목공','타일','도배','시공 후','AS'].map(p =>
    `<button class="filter-chip ${phaseF===p?'is-active':''}" onclick="setPhotoPhaseFilter('${p}')">${p}</button>`
  ).join('');

  const albumHtml = display.length > 0 ? display.map(a => {
    const thumb = thumbUrl(a.photos[0]);
    const date  = a.createdAt ? new Date(a.createdAt).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'}) : '';
    const enc   = encodeURIComponent(JSON.stringify(a.photos));
    return `
      <div style="cursor:pointer;" onclick="openPhotoAlbum('${enc}')">
        <div style="width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;position:relative;background:var(--surface-2);">
          <img src="${thumb}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" decoding="async">
          <div style="position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.55);color:#fff;font-size:12px;font-weight:700;padding:2px 7px;border-radius:10px;">📷 ${a.photos.length}</div>
        </div>
        <div style="font-size:13px;font-weight:700;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${a.site||''}</div>
        <div style="font-size:13px;color:var(--muted);">${a.phase||''} · ${date}</div>
      </div>`;
  }).join('') : `<div class="empty" style="grid-column:span 2;padding:40px 0;text-align:center;">📷 ${searchQ?'"'+searchQ+'" 검색 결과 없음':'등록된 사진이 없어요'}</div>`;

  return `
    <div class="breadcrumb"><button class="back-btn" data-goto="settings"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M10 4l-4 4 4 4"/></svg> 설정</button></div>
    <div class="page-header">
      <div><div class="h-eyebrow">📸 시공 전·중·후 기록</div><h1 class="h-title">현장 사진 보관함</h1></div>
      <button class="btn btn-primary btn-sm" onclick="openPhotoUploadModal()">+ 업로드</button>
    </div>
    <div style="padding:0 var(--pad) 12px;">
      <div class="search-box">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" width="16" height="16"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg>
        <input class="search-input" placeholder="현장명·공정 검색" value="${searchQ}" oninput="window._photoSearch=this.value;navigate('photos')">
      </div>
    </div>
    <div class="filter-row" style="padding-bottom:4px;overflow-x:auto;">${filterHtml}</div>
    <div class="filter-row" style="overflow-x:auto;">${phaseHtml}</div>
    <div class="page-body">
      <div style="font-size:13px;color:var(--muted);margin-bottom:10px;">총 ${display.length}개 앨범</div>
      <div class="photo-gallery">${albumHtml}</div>
    </div>`;
}

function setPhotoFilter(site)  { window._photoSiteFilter=site;  window.navigate('photos'); }
function setPhotoPhaseFilter(p){ window._photoPhaseFilter=p;    window.navigate('photos'); }

function openPhotoAlbum(photosEncoded) {
  const photos = JSON.parse(decodeURIComponent(photosEncoded));
  if (!photos.length) return;
  let currentIdx = 0;

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div id="photo-viewer" style="position:fixed;inset:0;z-index:999;background:#000;display:flex;flex-direction:column;touch-action:none;overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;padding-top:calc(44px + env(safe-area-inset-top));flex-shrink:0;">
        <span id="photo-counter" style="color:rgba(255,255,255,0.7);font-size:14px;font-weight:600;">1 / ${photos.length}</span>
        <button onclick="closeModal()" style="background:rgba(255,255,255,0.2);border:none;color:#fff;border-radius:50%;width:44px;height:44px;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div style="flex:1;overflow:hidden;position:relative;min-height:0;" id="slide-container">
        <div id="slide-track" style="display:flex;transition:transform .25s ease;height:100%;will-change:transform;">
          ${photos.map(p => `
            <div style="min-width:100vw;width:100vw;height:100%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#000;">
              <img src="${p}" style="max-width:100vw;max-height:100%;width:auto;height:auto;object-fit:contain;display:block;user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none;">
            </div>`).join('')}
        </div>
      </div>
      <div style="display:flex;justify-content:center;gap:6px;padding:14px 0;padding-bottom:calc(14px + env(safe-area-inset-bottom));flex-shrink:0;">
        ${photos.map((_, i) => `<div id="dot-${i}" style="width:${i===0?'20px':'6px'};height:6px;border-radius:3px;background:${i===0?'#fff':'rgba(255,255,255,0.4)'};transition:all .2s;"></div>`).join('')}
      </div>
    </div>`;
  document.body.style.overflow = 'hidden';

  function goTo(idx) {
    if (idx < 0 || idx >= photos.length) return;
    currentIdx = idx;
    const track = document.getElementById('slide-track');
    if (track) { track.style.transition='transform .25s ease'; track.style.transform=`translateX(-${idx*100}vw)`; }
    photos.forEach((_, i) => {
      const dot = document.getElementById('dot-'+i);
      if (!dot) return;
      dot.style.width = i===idx ? '20px' : '6px';
      dot.style.background = i===idx ? '#fff' : 'rgba(255,255,255,0.4)';
    });
    const counter = document.getElementById('photo-counter');
    if (counter) counter.textContent = `${idx+1} / ${photos.length}`;
  }

  let touchStartX=0, touchStartY=0, isDragging=false;
  const container = document.getElementById('slide-container');
  container.addEventListener('touchstart', e=>{ touchStartX=e.touches[0].clientX; touchStartY=e.touches[0].clientY; isDragging=true; },{passive:true});
  container.addEventListener('touchmove', e=>{
    if (!isDragging) return;
    const dx=e.touches[0].clientX-touchStartX, dy=e.touches[0].clientY-touchStartY;
    if (Math.abs(dx)>Math.abs(dy)) {
      e.preventDefault();
      const track=document.getElementById('slide-track');
      if (track) { track.style.transition='none'; track.style.transform=`translateX(calc(-${currentIdx*100}vw + ${dx}px))`; }
    }
  },{passive:false});
  container.addEventListener('touchend', e=>{
    if (!isDragging) return;
    isDragging=false;
    const dx=e.changedTouches[0].clientX-touchStartX;
    const track=document.getElementById('slide-track');
    if (track) track.style.transition='transform .25s ease';
    if (dx<-50 && currentIdx<photos.length-1) goTo(currentIdx+1);
    else if (dx>50 && currentIdx>0) goTo(currentIdx-1);
    else goTo(currentIdx);
  },{passive:true});
}

// 공정 수정 모달
function openProcEditModal(phaseId, siteName) {
  const procKey = siteName.replace(/[.#$/ \[\]]/g, '_');
  db.ref('procData/' + procKey + '/' + phaseId).once('value').then(snap => {
    const ph = snap.val() || {};
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeModal()">
        <div class="modal-sheet" onclick="event.stopPropagation()">
          <div class="modal-head">
            <div><div class="modal-title">⚙️ 공정 수정</div><div class="modal-sub">${ph.name||''}</div></div>
            <button class="btn-icon" onclick="closeModal()"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>
          </div>
          <div class="modal-body">
            <div class="field"><label class="field-label">공정명</label><input class="input" id="proc-name" value="${ph.name||''}"></div>
            <div class="field"><label class="field-label">상태</label>
              <div class="chip-group">
                <button type="button" class="chip ${(ph.status||'wait')==='wait'?'is-active':''}" onclick="procEditChip(this,'wait')">⏳ 대기</button>
                <button type="button" class="chip ${ph.status==='active'?'is-active':''}" onclick="procEditChip(this,'active')">🔨 진행중</button>
                <button type="button" class="chip ${ph.status==='done'?'is-active':''}" onclick="procEditChip(this,'done')">✅ 완료</button>
              </div>
            </div>
            <div class="grid-2">
              <div class="field"><label class="field-label">🟢 시작일</label><input class="input" type="date" id="proc-start" value="${ph.startDate||''}"></div>
              <div class="field"><label class="field-label">🔴 완료일</label><input class="input" type="date" id="proc-end" value="${ph.doneDate||''}"></div>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" onclick="closeModal()">취소</button>
            <button class="btn btn-primary" onclick="saveProcEdit('${procKey}','${phaseId}')">저장</button>
          </div>
        </div>
      </div>`;
    document.body.style.overflow = 'hidden';
    window._procEditStatus = ph.status || 'wait';
  });
}

function procEditChip(el, status) {
  el.closest('.chip-group').querySelectorAll('.chip').forEach(b=>b.classList.remove('is-active'));
  el.classList.add('is-active');
  window._procEditStatus = status;
}

async function saveProcEdit(procKey, phaseId) {
  const name      = document.getElementById('proc-name')?.value?.trim();
  const startDate = document.getElementById('proc-start')?.value || null;
  const doneDate  = document.getElementById('proc-end')?.value   || null;
  const status    = window._procEditStatus || 'wait';
  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='저장 중...'; }
  try {
    await db.ref('procData/'+procKey+'/'+phaseId).update({ name, status, startDate:startDate||null, doneDate:doneDate||null });
    closeModal();
    if (window.navigate) window.navigate('siteDetail');
  } catch(e) {
    alert('저장 실패');
    if (btn) { btn.disabled=false; btn.textContent='저장'; }
  }
}

window.PAGES_EXTRA = { renderCalendar, renderSettings, renderTax, renderSiteDetail, renderPhotos };
