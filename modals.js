// 머니플로우 — Modals
// 8 modals: site, schedule, tip, staff, as, phase, txEdit, quickTip

const MODAL_BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

function openModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        ${html}
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
  document.body.style.overflow = '';
}

function modalHeader(title, sub) {
  return `
    <div class="modal-head">
      <div>
        <div class="modal-title">${title}</div>
        ${sub ? `<div class="modal-sub">${sub}</div>` : ''}
      </div>
      <button class="btn-icon" data-modal-close onclick="closeModal()" style="pointer-events:auto;">${MODAL_BACK}</button>
    </div>
  `;
}

// 1. Site register modal
function modalSiteRegister() {
  const stHtml = window.MOCK.siteStatuses.map((s, i) => `
    <button type="button" class="status-pick ${i === 0 ? 'is-active' : ''}" data-status="${s.key}" onclick="siteRegPickStatus(this)">
      <span class="pill status-${s.key}">${s.key}</span>
      <span class="status-desc">${s.desc}</span>
    </button>
  `).join('');

  const _now = new Date();
  const _yy = _now.getFullYear();
  const _mm = _now.getMonth() + 1;
  const yearOpts = [_yy, _yy - 1, _yy + 1].map(y => `<option value="${y}">${y}</option>`).join('');
  const monthOpts = [...Array(12)].map((_, i) => `<option value="${i + 1}" ${i + 1 === _mm ? 'selected' : ''}>${i + 1}월</option>`).join('');

  return openModal(`
    ${modalHeader('현장 등록', '신규 현장 정보를 입력하세요')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">현장명 <span class="req">*</span></label>
        <input class="input" id="site-reg-name" placeholder="예) 서초 래미안 32평">
      </div>
      <div class="field">
        <label class="field-label">고객명</label>
        <input class="input" id="site-reg-client" placeholder="예) 김상훈">
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">연도</label>
          <select class="input" id="site-reg-year">${yearOpts}</select>
        </div>
        <div class="field">
          <label class="field-label">월</label>
          <select class="input" id="site-reg-month">${monthOpts}</select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">현장 상태</label>
        <div class="status-pick-list">${stHtml}</div>
      </div>
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" id="site-reg-memo" rows="2" placeholder="선택사항"></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-modal-close>취소</button>
      <button class="btn btn-primary" onclick="saveSiteRegister()">저장</button>
    </div>
  `);
}

function siteRegPickStatus(el) {
  el.closest('.status-pick-list').querySelectorAll('.status-pick').forEach(b => b.classList.remove('is-active'));
  el.classList.add('is-active');
}

async function saveSiteRegister() {
  const name = document.getElementById('site-reg-name')?.value?.trim();
  if (!name) { alert('현장명을 입력해주세요'); return; }
  const client = document.getElementById('site-reg-client')?.value?.trim() || '';
  const year   = parseInt(document.getElementById('site-reg-year')?.value || '0') || new Date().getFullYear();
  const month  = parseInt(document.getElementById('site-reg-month')?.value || '0') || (new Date().getMonth() + 1);
  const memo   = document.getElementById('site-reg-memo')?.value?.trim() || '';
  const statusEl = document.querySelector('.status-pick.is-active');
  const status = statusEl ? statusEl.dataset.status : '계약완료';
  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
  try {
    await window.FB_API.saveSite({ name, client, status, year, month, memo });
    if (window.seedDefaultPhases) { try { await window.seedDefaultPhases(name); } catch (e) {} }
    closeModal();
    if (window.navigate) window.navigate(window.currentPage || 'sites');
  } catch (e) {
    alert('저장 실패. 다시 시도해주세요.');
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
  }
}

// 2. Schedule add modal
function modalSchedule(editKey = null, prefillDate = null) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = editKey ? (window.FB?.scheduleData?.[editKey] || {}) : {};
  const isEdit = !!editKey;

  const staffHtml = (window.MOCK?.inputters || []).map(n => `
    <label class="check-row" style="cursor:pointer;">
      <input type="checkbox" value="${n}" ${(existing.attendees||[]).includes(n) ? 'checked' : ''} onchange="schedUpdateAttendees()">
      <span>${n}</span>
    </label>
  `).join('');

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">${isEdit ? '✏️ 일정 수정' : '📅 일정 추가'}</div>
            <div class="modal-sub">캘린더에 표시됩니다</div>
          </div>
          <button class="btn-icon" onclick="closeModal()">${MODAL_BACK}</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">제목 <span class="req">*</span></label>
            <input class="input" id="sched-title" placeholder="예) 서초 래미안 점검" value="${existing.title || ''}">
          </div>
          <div class="grid-2">
            <div class="field">
              <label class="field-label">날짜 <span class="req">*</span></label>
              <input class="input" type="date" id="sched-date" value="${existing.date || prefillDate || today}">
            </div>
            <div class="field">
              <label class="field-label">시간</label>
              <input class="input" type="time" id="sched-time" value="${existing.time || ''}">
            </div>
          </div>
          <div class="field">
            <label class="field-label">메모</label>
            <textarea class="input" id="sched-memo" rows="2" placeholder="메모를 입력하세요">${existing.memo || ''}</textarea>
          </div>
          <div class="field">
            <label class="field-label">참석자</label>
            <div class="check-list" id="sched-staff">${staffHtml}</div>
          </div>
        </div>
        <div class="modal-foot">
          ${isEdit
            ? `<button class="btn btn-ghost danger" onclick="schedDelete('${editKey}')">🗑️ 삭제</button>`
            : `<button class="btn btn-ghost" onclick="closeModal()">취소</button>`
          }
          <button class="btn btn-primary" onclick="schedSave('${editKey || ''}')">저장</button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
}

async function schedSave(editKey) {
  const title = document.getElementById('sched-title')?.value?.trim();
  const date = document.getElementById('sched-date')?.value;
  const time = document.getElementById('sched-time')?.value || '';
  const memo = document.getElementById('sched-memo')?.value?.trim() || '';

  if (!title) { alert('제목을 입력해주세요'); return; }
  if (!date) { alert('날짜를 선택해주세요'); return; }

  // 참석자 수집
  const attendees = [];
  document.querySelectorAll('#sched-staff input[type=checkbox]:checked').forEach(cb => {
    attendees.push(cb.value);
  });

  const data = { title, date, time, memo, attendees };
  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    if (editKey) {
      await db.ref('scheduleData/' + editKey).update(data);
    } else {
      await db.ref('scheduleData').push({ ...data, createdAt: Date.now() });
    }
    closeModal();
    if (window.navigate) window.navigate('calendar');
  } catch(e) {
    alert('저장 실패. 다시 시도해주세요.');
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
  }
}

async function schedDelete(editKey) {
  if (!confirm('이 일정을 삭제할까요?')) return;
  try {
    await db.ref('scheduleData/' + editKey).remove();
    closeModal();
    if (window.navigate) window.navigate('calendar');
  } catch(e) { alert('삭제 실패'); }
}

// 3. Tip (노하우) modal
function modalTip() {
  const tipId = 'tip_' + Date.now();
  return openModal(`
    ${modalHeader('💡 노하우 기록', '실수·팁·자재·고객 노하우를 남겨두세요')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">카테고리</label>
        <div class="chip-group">
          <button type="button" class="chip is-active" onclick="tipPickCat(this,'mistake')">😓 실수</button>
          <button type="button" class="chip" onclick="tipPickCat(this,'tip')">💡 팁</button>
          <button type="button" class="chip" onclick="tipPickCat(this,'material')">🔩 자재</button>
          <button type="button" class="chip" onclick="tipPickCat(this,'client')">🤝 고객</button>
        </div>
        <input type="hidden" id="tip-cat" value="mistake">
      </div>
      <div class="field">
        <label class="field-label">제목 <span class="req">*</span></label>
        <input class="input" id="tip-title" placeholder="예) 욕실 방수 24시간 양생 누락">
      </div>
      <div class="field">
        <label class="field-label">문제 상황</label>
        <textarea class="input" id="tip-problem" rows="3" placeholder="어떤 일이 있었는지"></textarea>
      </div>
      <div class="field">
        <label class="field-label">사진 (문제) <span class="muted">최대 3장</span></label>
        <div class="photo-row" id="tip-photos-problem">
          <button type="button" class="photo-add" onclick="tipAddPhoto('problem',0)">📷</button>
          <button type="button" class="photo-add" onclick="tipAddPhoto('problem',1)">📷</button>
          <button type="button" class="photo-add" onclick="tipAddPhoto('problem',2)">📷</button>
        </div>
        <input type="file" id="tip-file-problem" accept="image/*" capture="environment" style="display:none" onchange="tipFileSelected(event,'problem')">
      </div>
      <div class="field">
        <label class="field-label">해결 방법</label>
        <textarea class="input" id="tip-solution" rows="3" placeholder="어떻게 해결했는지"></textarea>
      </div>
      <div class="field">
        <label class="field-label">사진 (해결) <span class="muted">최대 3장</span></label>
        <div class="photo-row" id="tip-photos-solution">
          <button type="button" class="photo-add" onclick="tipAddPhoto('solution',0)">📷</button>
          <button type="button" class="photo-add" onclick="tipAddPhoto('solution',1)">📷</button>
          <button type="button" class="photo-add" onclick="tipAddPhoto('solution',2)">📷</button>
        </div>
        <input type="file" id="tip-file-solution" accept="image/*" capture="environment" style="display:none" onchange="tipFileSelected(event,'solution')">
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">현장</label>
          <select class="input" id="tip-site">
            <option value="">—</option>
            ${(window.MOCK?.sites || []).map(s => `<option>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">작성자</label>
          <select class="input" id="tip-writer">
            ${(window.MOCK?.inputters || []).map(n => `<option>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <label class="check-row">
        <input type="checkbox" id="tip-pinned">
        <span>📌 주의사항으로 핀 고정</span>
      </label>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-modal-close onclick="closeModal()">취소</button>
      <button class="btn btn-primary" onclick="saveTip()">저장</button>
    </div>
  `);
}

// 사진 첨부 - 선택창 표시
let _tipPhotoTarget = null;
function tipAddPhoto(type, idx) {
  _tipPhotoTarget = { type, idx };
  // 사진 선택창 표시
  const sheet = document.createElement('div');
  sheet.id = 'tip-photo-sheet';
  sheet.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,0.5);';
  sheet.innerHTML = `
    <div style="background:#fff;border-radius:20px 20px 0 0;padding:20px 16px 40px;">
      <div style="width:36px;height:4px;background:#e0e0e0;border-radius:2px;margin:0 auto 20px;"></div>
      <div style="font-size:16px;font-weight:700;margin-bottom:16px;">사진 추가</div>
      <button onclick="tipTakePhoto('${type}')" style="width:100%;padding:16px;background:#f5f5f5;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px;font-family:inherit;">📷 카메라 촬영</button>
      <button onclick="tipSelectPhoto('${type}')" style="width:100%;padding:16px;background:#f5f5f5;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:10px;font-family:inherit;">🖼️ 갤러리에서 선택</button>
      <button onclick="document.getElementById('tip-photo-sheet').remove()" style="width:100%;padding:16px;background:none;border:none;border-radius:12px;font-size:15px;color:#999;cursor:pointer;font-family:inherit;">취소</button>
    </div>
  `;
  sheet.addEventListener('click', e => { if(e.target === sheet) sheet.remove(); });
  document.body.appendChild(sheet);
}

function tipTakePhoto(type) {
  document.getElementById('tip-photo-sheet')?.remove();
  const inp = document.getElementById('tip-file-' + type);
  if(inp) { inp.setAttribute('capture','environment'); inp.click(); }
}
function tipSelectPhoto(type) {
  document.getElementById('tip-photo-sheet')?.remove();
  const inp = document.getElementById('tip-file-' + type);
  if(inp) { inp.removeAttribute('capture'); inp.click(); }
}

window._tipPhotos = { problem: [], solution: [] };
function tipFileSelected(e, type) {
  const file = e.target.files[0]; if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const base64 = ev.target.result;
    if(window._tipPhotos[type].length < 3) window._tipPhotos[type].push(base64);
    tipRenderPhotos(type);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}
function tipRenderPhotos(type) {
  const row = document.getElementById('tip-photos-' + type); if(!row) return;
  const photos = window._tipPhotos[type];
  let html = photos.map((p, i) => `
    <div style="position:relative;width:80px;height:80px;">
      <img src="${p}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1.5px solid #e0e0e0;">
      <button onclick="tipRemovePhoto('${type}',${i})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
    </div>`).join('');
  if(photos.length < 3) html += `<button type="button" class="photo-add" onclick="tipAddPhoto('${type}',${photos.length})">📷</button>`;
  row.innerHTML = html;
}
function tipRemovePhoto(type, idx) {
  window._tipPhotos[type].splice(idx, 1);
  tipRenderPhotos(type);
}
function tipPickCat(el, cat) {
  el.closest('.chip-group').querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
  el.classList.add('is-active');
  document.getElementById('tip-cat').value = cat;
}
async function saveTip() {
  const title = document.getElementById('tip-title')?.value?.trim();
  if(!title) { alert('제목을 입력해주세요'); return; }
  const data = {
    cat: document.getElementById('tip-cat')?.value || 'mistake',
    title,
    problem: document.getElementById('tip-problem')?.value?.trim() || '',
    solution: document.getElementById('tip-solution')?.value?.trim() || '',
    site: document.getElementById('tip-site')?.value || '',
    writer: document.getElementById('tip-writer')?.value || '',
    pinned: document.getElementById('tip-pinned')?.checked || false,
    photos: window._tipPhotos,
    createdAt: Date.now(),
  };
  try {
    await window.FB_API.saveKnowhow(data);
    window._tipPhotos = { problem: [], solution: [] };
    closeModal();
  } catch(e) { alert('저장 실패. 다시 시도해주세요.'); }
}

// 4. Staff add modal
function modalStaff() {
  return openModal(`
    ${modalHeader('👤 직원 추가', '재직 정보를 등록합니다')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">이름 <span class="req">*</span></label>
        <input class="input" placeholder="홍길동">
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">직책</label>
          <input class="input" placeholder="현장반장">
        </div>
        <div class="field">
          <label class="field-label">입사일</label>
          <input class="input" type="date" value="2026-05-01">
        </div>
      </div>
      <div class="field">
        <label class="field-label">월급 (원)</label>
        <input class="input num" placeholder="3,500,000">
      </div>
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" rows="2" placeholder="담당 공정, 연락처 등"></textarea>
      </div>
      <div class="field">
        <label class="field-label">퇴사일 <span class="muted">선택사항</span></label>
        <input class="input" type="date">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost danger" data-modal-close>🚪 퇴사 처리</button>
      <button class="btn btn-primary" data-modal-close>저장</button>
    </div>
  `);
}

// 5. AS register modal
function modalAS(editKey = null) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = editKey ? (window.FB?.asData?.[editKey] || {}) : {};
  const isEdit = !!editKey;

  const sitesOpts = (window.MOCK?.sites || []).map(s =>
    `<option value="${s.name}" ${existing.site === s.name ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  const staffOpts = (window.MOCK?.inputters || []).map(n =>
    `<option value="${n}" ${existing.manager === n ? 'selected' : ''}>${n}</option>`
  ).join('');

  const isTbd = existing.date === '날짜 조율중' || existing.date === 'tbd';
  const dateVal = (!isEdit || isTbd) ? today : (existing.date || today);

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">${isEdit ? '🔧 AS 수정' : '🔧 AS 등록'}</div>
            <div class="modal-sub">하자보수 일정 및 내용</div>
          </div>
          <button class="btn-icon" onclick="closeModal()">${MODAL_BACK}</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">현장 <span class="req">*</span></label>
            <select class="input" id="as-site">
              <option value="">현장을 선택해주세요</option>
              ${sitesOpts}
              ${isEdit && existing.site && !(window.MOCK?.sites||[]).find(s=>s.name===existing.site)
                ? `<option value="${existing.site}" selected>${existing.site}</option>` : ''}
            </select>
            <input class="input" id="as-site-direct" placeholder="목록에 없으면 직접 입력"
              value="${isEdit && existing.site && !(window.MOCK?.sites||[]).find(s=>s.name===existing.site) ? existing.site : ''}"
              style="margin-top:6px;">
          </div>
          <div class="field">
            <label class="field-label">AS 내용 <span class="req">*</span></label>
            <textarea class="input" id="as-content" rows="3" placeholder="예) 욕실 타일 줄눈 누수">${existing.content || ''}</textarea>
          </div>
          <div class="grid-2">
            <div class="field">
              <label class="field-label">고객 전화번호</label>
              <input class="input" id="as-phone" type="tel" placeholder="010-0000-0000" value="${existing.phone || ''}">
            </div>
            <div class="field">
              <label class="field-label">AS 담당자</label>
              <select class="input" id="as-manager">
                <option value="">선택</option>
                ${staffOpts}
              </select>
              <input class="input" id="as-manager-direct" placeholder="직접 입력" value="${existing.manager || ''}" style="margin-top:6px;">
            </div>
          </div>
          <div class="field">
            <label class="field-label">작업자</label>
            <input class="input" id="as-worker" placeholder="작업자명" value="${existing.worker || ''}">
          </div>
          <div class="field">
            <label class="field-label">날짜</label>
            <div class="chip-group" style="margin-bottom:8px;">
              <button type="button" class="chip ${!isTbd ? 'is-active' : ''}" id="as-date-btn" onclick="asToggleDate(false)">📅 날짜 선택</button>
              <button type="button" class="chip ${isTbd ? 'is-active' : ''}" id="as-tbd-btn" onclick="asToggleDate(true)">🕐 날짜 조율중</button>
            </div>
            <input class="input" type="date" id="as-date" value="${dateVal}" style="${isTbd ? 'display:none;' : ''}">
          </div>
          ${isEdit ? `
          <div class="field">
            <label class="field-label">처리 상태</label>
            <div class="chip-group">
              <button type="button" class="chip ${!existing.done ? 'is-active' : ''}" id="as-undone-btn" onclick="asToggleDone(false)">⏳ 미처리</button>
              <button type="button" class="chip ${existing.done ? 'is-active' : ''}" id="as-done-btn" onclick="asToggleDone(true)">✅ 완료</button>
            </div>
          </div>` : ''}
        </div>
        <div class="modal-foot">
          ${isEdit ? `<button class="btn btn-ghost danger" onclick="asDelete('${editKey}')">🗑️ 삭제</button>` : `<button class="btn btn-ghost" onclick="closeModal()">취소</button>`}
          <button class="btn btn-primary" onclick="asSave('${editKey || ''}')">저장</button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  window._asDone = existing.done || false;
  window._asTbd = isTbd;
}

function asToggleDate(isTbd) {
  window._asTbd = isTbd;
  document.getElementById('as-date-btn').classList.toggle('is-active', !isTbd);
  document.getElementById('as-tbd-btn').classList.toggle('is-active', isTbd);
  const dateInp = document.getElementById('as-date');
  if (dateInp) dateInp.style.display = isTbd ? 'none' : '';
}

function asToggleDone(isDone) {
  window._asDone = isDone;
  document.getElementById('as-done-btn').classList.toggle('is-active', isDone);
  document.getElementById('as-undone-btn').classList.toggle('is-active', !isDone);
}

async function asSave(editKey) {
  const siteSelect = document.getElementById('as-site')?.value;
  const siteDirect = document.getElementById('as-site-direct')?.value?.trim();
  const site = siteDirect || siteSelect;
  const content = document.getElementById('as-content')?.value?.trim();

  if (!site) { alert('현장을 선택해주세요'); return; }
  if (!content) { alert('AS 내용을 입력해주세요'); return; }

  const managerSelect = document.getElementById('as-manager')?.value;
  const managerDirect = document.getElementById('as-manager-direct')?.value?.trim();
  const manager = managerDirect || managerSelect;
  const phone = document.getElementById('as-phone')?.value?.trim() || '';
  const worker = document.getElementById('as-worker')?.value?.trim() || '';
  const date = window._asTbd ? '날짜 조율중' : (document.getElementById('as-date')?.value || '');
  const done = window._asDone || false;

  const data = { site, content, phone, manager, worker, date, done };

  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    if (editKey) {
      await db.ref('asData/' + editKey).update(data);
    } else {
      await db.ref('asData').push({ ...data, createdAt: Date.now() });
    }
    closeModal();
    setTimeout(() => navigate('home'), 100);
  } catch(e) {
    alert('저장 실패. 다시 시도해주세요.');
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
  }
}

async function asDelete(editKey) {
  if (!confirm('이 AS 항목을 삭제할까요?')) return;
  try {
    await db.ref('asData/' + editKey).remove();
    closeModal();
  } catch(e) {
    alert('삭제 실패');
  }
}

// 6. Phase status modal
function modalPhase() {
  return openModal(`
    ${modalHeader('⚙️ 공정 상태 수정', '시작·완료일 입력 시 자동 상태 전환')}
    <div class="modal-body">
      <div class="callout">
        <div class="callout-icon">🤖</div>
        <div>
          <div class="callout-title">날짜 자동 상태</div>
          <div class="callout-body">시작일·완료일을 입력하면 <b>오늘 날짜 기준</b>으로 상태가 자동으로 바뀌어요.<br>시작 전→대기 / 진행 중→진행중 / 완료일 지남→완료</div>
        </div>
      </div>
      <div class="field">
        <label class="field-label">공정명</label>
        <input class="input" value="목공" readonly>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">시작일</label>
          <input class="input" type="date" value="2026-04-27">
        </div>
        <div class="field">
          <label class="field-label">완료일</label>
          <input class="input" type="date" value="2026-05-02">
        </div>
      </div>
      <div class="field">
        <label class="field-label">상태 (자동)</label>
        <div class="chip-group">
          <button type="button" class="chip">대기</button>
          <button type="button" class="chip is-active">진행중</button>
          <button type="button" class="chip">완료</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" rows="2"></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-modal-close>취소</button>
      <button class="btn btn-primary" data-modal-close>✅ 저장</button>
    </div>
  `);
}

// 7. Transaction edit modal
function modalTxEdit(entryKey) {
  const entry = window.FB?.entries?.[entryKey] || {};
  const typeMap = { revenue: '매출', cost: '매입', as: 'AS' };
  const curType = typeMap[entry.type] || '매입';
  const sitesOpts = (window.MOCK?.sites || []).map(s =>
    `<option value="${s.name}" ${entry.site === s.name ? 'selected' : ''}>${s.name}</option>`
  ).join('');
  const writersOpts = (window.MOCK?.inputters || []).map(n =>
    `<option value="${n}" ${entry.writer === n ? 'selected' : ''}>${n}</option>`
  ).join('');
  const phases = ['철거','창호','전기','욕실방수','목공','타일','필름','욕실설비','바닥','도배','가구','조명마감','중문','실리콘','잔마감'];
  const stages = ['계약금','착수금','중도금','잔금'];
  const pays = ['현금','계좌이체','신용카드'];
  const stageIcons = {'계약금':'📋','착수금':'🔨','중도금':'💼','잔금':'✅'};
  const payIcons = {'현금':'💵','계좌이체':'🏦','신용카드':'💳'};

  window._txEditType = curType;
  window._txEditKey = entryKey;

  // 사진은 entryPhotos 노드에서 지연 로드 (목록·홈 속도 위해 entries에서 분리)
  window._txeViewPhotos = [];
  const _expectPhoto = entry.hasPhoto || entry.photoCount || entry.imageBase64 || (Array.isArray(entry.extraPhotos) && entry.extraPhotos.length);
  const txePhotoSection = `
          <div class="field" id="txe-photo-field" style="${_expectPhoto ? '' : 'display:none;'}">
            <label class="field-label">사진 <span class="muted" id="txe-photo-cap">불러오는 중…</span></label>
            <div id="txe-photo-strip" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
          </div>`;

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">✏️ 거래 수정</div>
            <div class="modal-sub">입력한 거래 내용을 수정합니다</div>
          </div>
          <button class="btn-icon" onclick="closeModal()">${MODAL_BACK}</button>
        </div>
        <div class="modal-body">
          <div class="tabs">
            <button class="tab ${curType==='매출'?'is-active':''}" onclick="txEditSetType('매출',this)">💰 매출</button>
            <button class="tab ${curType==='매입'?'is-active':''}" onclick="txEditSetType('매입',this)">📦 매입</button>
            <button class="tab ${curType==='AS'?'is-active':''}" onclick="txEditSetType('AS',this)">🔧 AS</button>
          </div>
          <div class="field">
            <label class="field-label">현장 <span class="req">*</span></label>
            <select class="input" id="txe-site">
              <option value="">선택</option>
              ${sitesOpts}
            </select>
          </div>
          <div class="field">
            <label class="field-label">금액 (원) <span class="req">*</span></label>
            <div class="input-wrap">
              <input class="input input-amount num" id="txe-amount"
                value="${(entry.amount||0).toLocaleString('ko-KR')}"
                oninput="this.value=this.value.replace(/[^0-9]/g,'').replace(/\\B(?=(\\d{3})+(?!\\d))/g,',')">
              <span class="input-suffix">원</span>
            </div>
          </div>
          <div class="field">
            <label class="field-label">날짜</label>
            <input class="input" type="date" id="txe-date" value="${entry.date || ''}">
          </div>
          <div id="txe-stage-wrap" style="${curType==='매출'?'':'display:none;'}">
            <div class="field">
              <label class="field-label">결제 단계</label>
              <div class="chip-group">
                ${stages.map(s=>`<button type="button" class="chip ${entry.payStage===s?'is-active':''}" onclick="txEditChip(this,'stage','${s}')">${stageIcons[s]} ${s}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="field">
            <label class="field-label">결제 방법</label>
            <div class="chip-group">
              ${pays.map(p=>`<button type="button" class="chip ${entry.payMethod===p?'is-active':''}" onclick="txEditChip(this,'pay','${p}')">${payIcons[p]} ${p}</button>`).join('')}
            </div>
          </div>
          <div id="txe-phase-wrap" style="${curType==='매입'||curType==='AS'?'':'display:none;'}">
            <div class="field">
              <label class="field-label">공정</label>
              <div class="chip-group" style="flex-wrap:wrap;">
                ${phases.map(p=>`<button type="button" class="chip ${entry.process===p?'is-active':''}" onclick="txEditChip(this,'phase','${p}')">${p}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="field">
            <label class="field-label">메모</label>
            <textarea class="input" id="txe-memo" rows="2">${entry.memo||''}</textarea>
          </div>
          ${txePhotoSection}
          <div class="field">
            <label class="field-label">입력자</label>
            <select class="input" id="txe-writer">
              ${writersOpts}
            </select>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost danger" onclick="txEditDelete()">🗑️ 삭제</button>
          <button class="btn btn-primary" onclick="txEditSave()">✅ 수정 완료</button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
  window._txStage = entry.payStage || '';
  window._txPay = entry.payMethod || '';
  window._txPhase = entry.process || '';
  if (_expectPhoto) txeFillPhotos(entryKey, entry);
}

async function txeFillPhotos(key, entry) {
  let photos = [];
  try { photos = await window.loadEntryPhotos(key, entry); } catch (e) { photos = []; }
  window._txeViewPhotos = photos;
  const field = document.getElementById('txe-photo-field');
  const strip = document.getElementById('txe-photo-strip');
  const cap = document.getElementById('txe-photo-cap');
  if (!field || !strip) return;
  if (!photos.length) { field.style.display = 'none'; return; }
  field.style.display = '';
  if (cap) cap.textContent = photos.length + '장 · 탭하면 크게 보기';
  strip.innerHTML = photos.map((p, i) => `<img src="${p}" onclick="txeViewPhoto(${i})" style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);cursor:pointer;">`).join('');
}

// 거래 수정 화면에서 사진을 탭하면 전체화면으로 크게 보기
function txeViewPhoto(idx) {
  const photos = window._txeViewPhotos || [];
  const src = photos[idx];
  if (!src) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:zoom-out;';
  overlay.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:8px;">`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}

function txEditSetType(type, el) {
  window._txEditType = type;
  document.querySelectorAll('.modal-sheet .tab').forEach(b => b.classList.remove('is-active'));
  el.classList.add('is-active');
  document.getElementById('txe-stage-wrap').style.display = type === '매출' ? '' : 'none';
  document.getElementById('txe-phase-wrap').style.display = (type === '매입' || type === 'AS') ? '' : 'none';
}

function txEditChip(el, kind, val) {
  const group = el.closest('.chip-group');
  group.querySelectorAll('.chip').forEach(b => b.classList.remove('is-active'));
  el.classList.add('is-active');
  if (kind === 'stage') window._txStage = val;
  if (kind === 'pay') window._txPay = val;
  if (kind === 'phase') window._txPhase = val;
}

async function txEditSave() {
  const key = window._txEditKey;
  const site = document.getElementById('txe-site')?.value;
  const rawAmt = document.getElementById('txe-amount')?.value?.replace(/[^0-9]/g,'') || '0';
  const amount = parseInt(rawAmt) || 0;
  const date = document.getElementById('txe-date')?.value || '';
  const memo = document.getElementById('txe-memo')?.value?.trim() || '';
  const writer = document.getElementById('txe-writer')?.value || '';
  const typeMap = {'매출':'revenue','매입':'cost','AS':'as'};

  if (!site) { alert('현장을 선택해주세요'); return; }
  if (!amount) { alert('금액을 입력해주세요'); return; }

  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    await db.ref('entries/' + key).update({
      type: typeMap[window._txEditType] || 'cost',
      site, amount, date, memo, writer,
      payStage: window._txStage || '',
      payMethod: window._txPay || '',
      process: window._txPhase || '',
    });
    closeModal();
  } catch(e) {
    alert('저장 실패');
    if (btn) { btn.disabled = false; btn.textContent = '✅ 수정 완료'; }
  }
}

async function txEditDelete() {
  if (!confirm('이 거래를 삭제할까요?')) return;
  try {
    await db.ref('entries/' + window._txEditKey).remove();
    db.ref('entryPhotos/' + window._txEditKey).remove();
    closeModal();
  } catch(e) { alert('삭제 실패'); }
}

// 8. Quick tip / quick record modal — 토스식 단계 입력
function modalQuickTip() {
  window._qtPhotos = [];
  window._qtState = {
    step: 1,
    site: '',
    date: new Date().toISOString().slice(0, 10),
    writer: (window.MOCK?.inputters || [])[0] || '',
    memo: '',
  };
  qtRender();
  document.body.style.overflow = 'hidden';
}

function qtRender() {
  const s = window._qtState;
  const stepLabel = ['현장 선택', '사진 첨부', '메모 · 작성자'];
  let body = '';
  if (s.step === 1) body = qtStepSite();
  else if (s.step === 2) body = qtStepPhoto();
  else body = qtStepMemo();
  const prog = `<div style="height:4px;background:var(--hair);border-radius:2px;overflow:hidden;margin-bottom:16px;"><div style="height:100%;width:${Math.round(s.step / 3 * 100)}%;background:var(--accent);border-radius:2px;transition:width .25s;"></div></div>`;
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div style="display:flex;align-items:center;gap:8px;">
            ${s.step > 1 ? `<button class="btn-icon" onclick="qtBack()" style="background:var(--surface-2);border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:17px;">‹</button>` : ''}
            <div>
              <div class="modal-title">⚡ 빠른 기록 · ${s.step}/3</div>
              <div class="modal-sub">${stepLabel[s.step - 1]}</div>
            </div>
          </div>
          <button class="btn-icon" onclick="closeModal()" style="background:var(--surface-2);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">${MODAL_BACK}</button>
        </div>
        <div class="modal-body">${prog}${body}</div>
        ${qtFooter()}
      </div>
    </div>
  `;
  if (s.step === 2) qtRenderPhotos();
}

function qtStepSite() {
  const cur = (window._qtState.site || '').replace(/"/g, '&quot;');
  return `
    <div class="callout warm" style="margin-bottom:14px;">
      <div class="callout-icon">⚡</div>
      <div>
        <div class="callout-title">자동 설정</div>
        <div class="callout-body">현장만 고르면 끝이에요. 금액·공정은 나중에 미정리 탭에서 정리할 수 있어요.</div>
      </div>
    </div>
    <div class="field" style="margin-bottom:8px;">
      <label class="field-label">현장 <span class="req">*</span></label>
      <input class="input" id="qt-site-search" placeholder="현장명 검색 또는 직접 입력" autocomplete="off" value="${cur}" oninput="qtFilterSites(this.value)">
    </div>
    <div style="font-size:13px;color:var(--muted);font-weight:700;margin:14px 0 8px;">현장 목록 · 탭하면 다음으로</div>
    <div id="qt-site-list" style="display:flex;flex-direction:column;gap:8px;">${qtSiteRows('')}</div>
  `;
}

function qtSiteRows(q) {
  const sites = window.MOCK?.sites || [];
  const query = (q || '').trim();
  let html = '';
  sites.forEach((site, i) => {
    if (query && site.name.indexOf(query) === -1) return;
    html += `<button onclick="qtPickSite(${i})" style="display:flex;align-items:center;gap:9px;background:#fff;border:1.5px solid var(--hair);border-radius:11px;padding:12px;cursor:pointer;font-family:inherit;text-align:left;font-size:13px;">
      <span>📁</span><span style="flex:1;min-width:0;">${site.name}</span><span style="color:#ccc;">›</span>
    </button>`;
  });
  if (!html) html = `<div style="font-size:13.5px;color:var(--muted);padding:8px 2px;line-height:1.5;">목록에 없어요. 입력한 이름 그대로 "다음"을 누르면 진행돼요.</div>`;
  return html;
}

function qtFilterSites(v) {
  window._qtState.site = v;
  const list = document.getElementById('qt-site-list');
  if (list) list.innerHTML = qtSiteRows(v);
}

function qtPickSite(i) {
  const site = window.MOCK?.sites?.[i];
  if (!site) return;
  window._qtState.site = site.name;
  window._qtState.step = 2;
  qtRender();
}

function qtStepPhoto() {
  return `
    <div style="font-size:14px;font-weight:700;margin-bottom:4px;">사진을 첨부할까요?</div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:14px;">${window._qtState.site} · 사진은 선택사항이에요</div>
    <div class="grid-2" style="margin-bottom:12px;">
      <button type="button" class="attach" onclick="qtOpenCamera()">📷 카메라 촬영</button>
      <button type="button" class="attach" onclick="qtOpenGallery()">🖼️ 갤러리 업로드</button>
    </div>
    <input type="file" id="qt-file-camera" accept="image/*" capture="environment" style="display:none" onchange="qtHandleFile(event)">
    <input type="file" id="qt-file-gallery" accept="image/*" multiple style="display:none" onchange="qtHandleFile(event)">
    <div id="qt-photo-preview" style="display:flex;flex-wrap:wrap;gap:8px;min-height:44px;"></div>
  `;
}

function qtStepMemo() {
  const s = window._qtState;
  const writers = window.MOCK?.inputters || [];
  const n = (window._qtPhotos || []).length;
  return `
    <div style="background:#fff;border:1.5px solid var(--hair);border-radius:12px;padding:2px 14px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;border-bottom:1px solid var(--hair-soft);font-size:13px;"><span style="color:var(--muted);">현장</span><span style="font-weight:700;max-width:64%;text-align:right;">${s.site}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 0;font-size:13px;"><span style="color:var(--muted);">사진</span><span style="font-weight:700;">${n ? n + '장' : '없음'}</span></div>
    </div>
    <div class="field">
      <label class="field-label">날짜</label>
      <input class="input" type="date" id="qt-date" value="${s.date}" oninput="window._qtState.date=this.value">
    </div>
    <div class="field">
      <label class="field-label">작성자 <span class="req">*</span></label>
      <div class="chip-group">${writers.map(w => `<button class="chip ${s.writer === w ? 'is-active' : ''}" onclick="qtSetWriter('${w}')">${w}</button>`).join('')}</div>
    </div>
    <div class="field">
      <label class="field-label">메모 <span class="muted">선택</span></label>
      <textarea class="input" id="qt-memo" rows="3" placeholder="현장 상황을 빠르게 기록" oninput="window._qtState.memo=this.value">${s.memo || ''}</textarea>
    </div>
  `;
}

function qtSetWriter(w) {
  window._qtState.writer = w;
  qtRender();
}

function qtFooter() {
  const s = window._qtState;
  if (s.step === 1) {
    return `<div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">취소</button>
      <button class="btn btn-primary" onclick="qtNext()">다음</button>
    </div>`;
  }
  if (s.step === 2) {
    const n = (window._qtPhotos || []).length;
    return `<div class="modal-foot">
      <button class="btn btn-ghost" onclick="qtBack()">이전</button>
      <button class="btn btn-primary" onclick="qtNext()">${n ? `다음 · 사진 ${n}장` : '사진 없이 계속'}</button>
    </div>`;
  }
  return `<div class="modal-foot">
    <button class="btn btn-ghost" onclick="qtBack()">이전</button>
    <button class="btn btn-primary" onclick="qtSave()">⚡ 임시 저장</button>
  </div>`;
}

function qtBack() {
  if (window._qtState.step > 1) {
    window._qtState.step--;
    qtRender();
  }
}

function qtNext() {
  const s = window._qtState;
  if (s.step === 1) {
    const inp = document.getElementById('qt-site-search');
    const v = (inp && inp.value.trim()) || s.site || '';
    if (!v) { alert('현장을 선택하거나 입력해주세요'); return; }
    s.site = v;
    s.step = 2;
    qtRender();
  } else if (s.step === 2) {
    s.step = 3;
    qtRender();
  }
}

function qtOpenCamera() {
  document.getElementById('qt-file-camera')?.click();
}
function qtOpenGallery() {
  document.getElementById('qt-file-gallery')?.click();
}

function qtHandleFile(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  files.forEach(file => {
    if (window._qtPhotos.length >= 5) return;
    const reader = new FileReader();
    reader.onload = ev => {
      window._qtPhotos.push(ev.target.result);
      qtRenderPhotos();
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function qtRenderPhotos() {
  const wrap = document.getElementById('qt-photo-preview');
  if (wrap) {
    wrap.innerHTML = window._qtPhotos.map((p, i) => `
      <div style="position:relative;width:80px;height:80px;flex-shrink:0;">
        <img src="${p}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);">
        <button onclick="qtRemovePhoto(${i})"
          style="position:absolute;top:-6px;right:-6px;background:#191F28;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;">✕</button>
      </div>
    `).join('');
  }
  const s = window._qtState;
  if (s && s.step === 2) {
    const nb = document.querySelector('.modal-foot .btn-primary');
    if (nb) {
      const n = window._qtPhotos.length;
      nb.textContent = n ? `다음 · 사진 ${n}장` : '사진 없이 계속';
    }
  }
}

function qtRemovePhoto(idx) {
  window._qtPhotos.splice(idx, 1);
  qtRenderPhotos();
}

async function qtSave() {
  const s = window._qtState || {};
  const dateInp = document.getElementById('qt-date');
  const memoInp = document.getElementById('qt-memo');
  const site = s.site || '';
  const date = (dateInp && dateInp.value) || s.date || new Date().toISOString().slice(0, 10);
  const writer = s.writer || '';
  const memo = (memoInp && memoInp.value.trim()) || s.memo || '';

  if (!site) { alert('현장을 선택해주세요'); return; }

  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    await window.FB_API.savePending({
      site, date, writer, memo,
      imageBase64: window._qtPhotos[0] || null,
      extraPhotos: window._qtPhotos.slice(1),
      status: 'temp',
    });
    window._qtPhotos = [];
    closeModal();
    alert('✅ 임시 저장 완료! 미정리 탭에서 금액을 입력하세요 😊');
  } catch(e) {
    alert('저장 실패. 다시 시도해주세요.');
    if (btn) { btn.disabled = false; btn.textContent = '⚡ 임시 저장'; }
  }
}

// ===== 현장 사진 보관함 업로드 모달 =====
const PHOTO_PHASES = ['시공 전', '철거', '창호', '전기', '욕실방수', '목공', '타일', '필름', '욕실설비', '바닥', '도배', '가구', '조명마감', '중문', '실리콘', '잔마감', '시공 후', 'AS'];

window._photoUploadState = { site: '', phase: '', photos: [] };

function openPhotoUploadModal() {
  // 이전 세션에서 남은 ObjectURL 정리
  try {
    (window._photoUploadState?.photos || []).forEach(u => {
      if (u && u.startsWith && u.startsWith('blob:')) URL.revokeObjectURL(u);
    });
  } catch(e) {}
  window._photoUploadState = { site: '', phase: '', photos: [] };
  const sites = (window.MOCK?.sites || []).map(s => s.name);
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">📸 현장 사진 업로드</div>
            <div class="modal-sub">현장별 공정 사진을 보관해요</div>
          </div>
          <button class="btn-icon" onclick="closeModal()">${MODAL_BACK}</button>
        </div>
        <div class="modal-body">

          <!-- STEP 1: 현장 선택 -->
          <div id="photo-step-1">
            <div style="font-size:13px;font-weight:700;color:var(--muted);margin-bottom:12px;">STEP 1 · 현장 선택</div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;">
              ${sites.map(s => `
                <button onclick="photoSelectSite('${s.replace(/'/g,"\\'")}', this)"
                  style="padding:14px 16px;background:#fff;border:1.5px solid var(--hair);border-radius:12px;text-align:left;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;">
                  📁 ${s}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- STEP 2: 공정 선택 -->
          <div id="photo-step-2" style="display:none;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <button onclick="photoBackToStep1()" style="background:var(--surface-2);border:none;border-radius:8px;padding:5px 10px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted);">‹ 현장</button>
              <div style="font-size:13px;font-weight:700;color:var(--muted);">STEP 2 · 공정 선택</div>
            </div>
            <div id="photo-site-label" style="font-size:15px;font-weight:800;margin-bottom:14px;color:var(--accent);"></div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${PHOTO_PHASES.map(p => `
                <button onclick="photoSelectPhase('${p}', this)"
                  style="padding:9px 14px;background:#fff;border:1.5px solid var(--hair);border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;">
                  ${p}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- STEP 3: 사진 업로드 -->
          <div id="photo-step-3" style="display:none;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <button onclick="photoBackToStep2()" style="background:var(--surface-2);border:none;border-radius:8px;padding:5px 10px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted);">‹ 공정</button>
              <div style="font-size:13px;font-weight:700;color:var(--muted);">STEP 3 · 사진 업로드</div>
            </div>
            <div id="photo-upload-label" style="font-size:15px;font-weight:800;margin-bottom:14px;"></div>
            <div class="grid-2" style="margin-bottom:12px;">
              <button type="button" class="attach" onclick="document.getElementById('photo-file-camera').click()">📷 카메라 촬영</button>
              <button type="button" class="attach" onclick="document.getElementById('photo-file-gallery').click()">🖼️ 갤러리 업로드</button>
            </div>
            <input type="file" id="photo-file-camera" accept="image/*" capture="environment" style="display:none" onchange="photoHandleFile(event)">
            <input type="file" id="photo-file-gallery" accept="image/*" multiple style="display:none" onchange="photoHandleFile(event)">
            <div id="photo-upload-preview" style="display:flex;flex-wrap:wrap;gap:8px;min-height:40px;"></div>
          </div>

        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" onclick="closeModal()">취소</button>
          <button class="btn btn-primary" id="photo-save-btn" style="display:none;" onclick="photoSave()">💾 저장</button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
}

function photoSelectSite(name, el) {
  window._photoUploadState.site = name;
  document.querySelectorAll('#photo-step-1 button').forEach(b => {
    b.style.borderColor = 'var(--hair)'; b.style.background = '#fff'; b.style.color = 'var(--text)';
  });
  el.style.borderColor = 'var(--accent)'; el.style.background = 'rgba(47,107,71,0.06)'; el.style.color = 'var(--accent)';
  setTimeout(() => {
    document.getElementById('photo-step-1').style.display = 'none';
    document.getElementById('photo-step-2').style.display = 'block';
    document.getElementById('photo-site-label').textContent = '📁 ' + name;
  }, 200);
}

function photoBackToStep1() {
  document.getElementById('photo-step-2').style.display = 'none';
  document.getElementById('photo-step-1').style.display = 'block';
}

function photoSelectPhase(phase, el) {
  window._photoUploadState.phase = phase;
  document.querySelectorAll('#photo-step-2 button:not(:first-child)').forEach(b => {
    b.style.borderColor = 'var(--hair)'; b.style.background = '#fff'; b.style.color = 'var(--text)';
  });
  el.style.borderColor = 'var(--accent)'; el.style.background = 'rgba(47,107,71,0.06)'; el.style.color = 'var(--accent)';
  setTimeout(() => {
    document.getElementById('photo-step-2').style.display = 'none';
    document.getElementById('photo-step-3').style.display = 'block';
    document.getElementById('photo-save-btn').style.display = 'block';
    document.getElementById('photo-upload-label').innerHTML =
      `<span style="color:var(--accent);">${window._photoUploadState.site}</span> · <span style="color:var(--muted);">${phase}</span>`;
  }, 200);
}

function photoBackToStep2() {
  document.getElementById('photo-step-3').style.display = 'none';
  document.getElementById('photo-step-2').style.display = 'block';
  document.getElementById('photo-save-btn').style.display = 'none';
}

function photoHandleFile(e) {
  const newFiles = Array.from(e.target.files || []);
  if (!newFiles.length) return;
  if (!window._photoUploadState.files) window._photoUploadState.files = [];
  if (!window._photoUploadState.photos) window._photoUploadState.photos = [];

  newFiles.forEach(file => {
    // 미리보기는 ObjectURL (즉시 생성, base64 변환 없음 — 16장도 한순간에)
    window._photoUploadState.files.push(file);
    window._photoUploadState.photos.push(URL.createObjectURL(file));
  });
  photoRenderPreview();
  e.target.value = '';
}

function photoRenderPreview() {
  const wrap = document.getElementById('photo-upload-preview');
  if (!wrap) return;
  const photos = window._photoUploadState.photos;
  wrap.innerHTML = photos.map((p, i) => `
    <div style="position:relative;width:80px;height:80px;flex-shrink:0;">
      <img src="${p}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);">
      <button onclick="photoRemove(${i})"
        style="position:absolute;top:-6px;right:-6px;background:#191F28;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;">✕</button>
    </div>
  `).join('');
}

function photoRemove(idx) {
  // ObjectURL 메모리 해제 (createObjectURL 대응)
  const u = window._photoUploadState.photos[idx];
  if (u && u.startsWith && u.startsWith('blob:')) {
    try { URL.revokeObjectURL(u); } catch(e) {}
  }
  window._photoUploadState.photos.splice(idx, 1);
  if (window._photoUploadState.files) window._photoUploadState.files.splice(idx, 1);
  photoRenderPreview();
}

// ===== Cloudinary 설정 =====
const CLOUDINARY = {
  cloudName: 'dirocerek',
  uploadPreset: 'designfor_site_photos',
  uploadUrl: 'https://api.cloudinary.com/v1_1/dirocerek/image/upload',
};

// 이미지 압축 (업로드 전 - 속도/용량 절약)
// createImageBitmap 기반: 모바일에서 new Image()보다 2~3배 빠른 디코딩, 메인 쓰레드 부담 적음
async function compressImage(file, maxWidth = 1280, quality = 0.75) {
  // HEIC 등 createImageBitmap 미지원 포맷 대비 fallback
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (err) {
    // fallback: 기존 방식
    return new Promise(resolve => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
      img.src = url;
    });
  }

  const scale = Math.min(1, maxWidth / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  // OffscreenCanvas 가능하면 사용 (메인 쓰레드 부담 최소)
  let canvas, ctx;
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(w, h);
    ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close && bitmap.close();
    try {
      return await canvas.convertToBlob({ type: 'image/jpeg', quality });
    } catch (e) {
      // convertToBlob 미지원 브라우저 fallback
    }
  }
  canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close && bitmap.close();
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality);
  });
}

// Cloudinary 단일 파일 업로드 (압축 → 업로드 파이프라인)
async function uploadToCloudinary(file, folder, tags = []) {
  const compressed = await compressImage(file);
  const fd = new FormData();
  fd.append('file', compressed);
  fd.append('upload_preset', CLOUDINARY.uploadPreset);
  fd.append('folder', folder);
  // 서버측 추가 최적화 — 자동 품질 조정으로 추가 ~20-30% 용량 절감
  fd.append('quality', 'auto:good');
  if (tags.length) fd.append('tags', tags.join(','));
  const res = await fetch(CLOUDINARY.uploadUrl, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('업로드 실패');
  const data = await res.json();
  return data.secure_url;
}

async function photoSave() {
  const { site, phase, files } = window._photoUploadState;
  if (!site || !phase) { alert('현장과 공정을 선택해주세요'); return; }
  if (!files || !files.length) { alert('사진을 1장 이상 추가해주세요'); return; }

  const btn = document.getElementById('photo-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = `⏫ 0/${files.length} 업로드 중...`; }

  try {
    const encKey = s => s.replace(/[.#$/ \[\]]/g, '_');
    const folder = `designfor/${encKey(site)}/${encKey(phase)}`;
    const tags = [encKey(site), encKey(phase), new Date().toISOString().slice(0, 10)];

    // 동시 업로드 개수 제한 (모바일 안정성) — 6개씩 슬롯 굴림
    const CONCURRENCY = 6;
    const total = files.length;
    let done = 0;
    const urls = new Array(total);

    const updateProgress = () => {
      if (btn) btn.textContent = `⏫ ${done}/${total} 업로드 중...`;
    };

    // 파이프라인 워커: 다음 인덱스 가져와서 압축+업로드, 반복
    let nextIdx = 0;
    async function worker() {
      while (true) {
        const i = nextIdx++;
        if (i >= total) return;
        urls[i] = await uploadToCloudinary(files[i], folder, tags);
        done++;
        updateProgress();
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, total) }, worker));

    // Firebase에는 URL만 저장 (용량 거의 없음!)
    const key = encKey(site) + '_' + encKey(phase) + '_' + Date.now();
    await db.ref('photoData/' + encKey(site) + '/' + key).set({
      site, phase,
      photos: urls,           // Cloudinary URL 배열
      createdAt: Date.now(),
      writer: window.AUTH?.current()?.name || '',
    });

    // ObjectURL 메모리 해제
    try {
      (window._photoUploadState.photos || []).forEach(u => {
        if (u && u.startsWith && u.startsWith('blob:')) URL.revokeObjectURL(u);
      });
    } catch(e) {}
    window._photoUploadState = { site: '', phase: '', files: [], photos: [] };
    closeModal();
    alert(`✅ ${phase} 사진 ${urls.length}장 저장 완료!`);
    if (window.navigate) window.navigate('photos');
  } catch(e) {
    console.error(e);
    alert('저장 실패: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '💾 저장'; }
  }
}

// ===== 공정 수정 모달 =====
function openProcEditModal(phaseId, siteName) {
  // 현재 공정 데이터 찾기
  const encKey = s => s.replace(/[.#$/ \[\]]/g, '_');
  const procData = window.FB?._procAll?.[encKey(siteName)] || {};
  const ph = procData[phaseId] || {};

  const statusOpts = [
    { val: 'wait', label: '대기', color: 'var(--muted)' },
    { val: 'active', label: '진행중', color: 'var(--warn)' },
    { val: 'done', label: '완료', color: 'var(--accent)' },
  ];

  // 현재 상태 자동 계산
  const todayStr = new Date().toISOString().slice(0, 10);
  let autoStatus = ph.status || 'wait';
  if (ph.startDate && todayStr >= ph.startDate) autoStatus = 'active';
  if (ph.doneDate && todayStr > ph.doneDate) autoStatus = 'done';

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">⚙️ ${ph.name || '공정'} 수정</div>
            <div class="modal-sub">${siteName}</div>
          </div>
          <button class="btn-icon" onclick="closeModal()">${window.MODAL_BACK || '✕'}</button>
        </div>
        <div class="modal-body">

          <div class="field">
            <label class="field-label">상태</label>
            <div class="chip-group">
              ${statusOpts.map(s => `
                <button type="button" class="chip ${autoStatus === s.val ? 'is-active' : ''}"
                  onclick="procEditChipStatus(this,'${s.val}')"
                  style="${autoStatus === s.val ? 'color:'+s.color+';border-color:'+s.color+';' : ''}">
                  ${s.label}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="proc-edit-status" value="${autoStatus}">
          </div>

          <div class="grid-2">
            <div class="field">
              <label class="field-label">🟢 시작일</label>
              <input class="input" type="date" id="proc-edit-start" value="${ph.startDate || ''}" onchange="autofillProcEditEndDate()">
            </div>
            <div class="field">
              <label class="field-label">🔴 완료일</label>
              <input class="input" type="date" id="proc-edit-end" value="${ph.doneDate || ''}">
            </div>
          </div>

          <div style="background:rgba(91,124,181,0.08);border:1px solid rgba(91,124,181,0.2);border-radius:10px;padding:10px 12px;font-size:13px;color:#5B7CB5;line-height:1.6;">
            💡 날짜를 입력하면 오늘 기준으로 상태가 자동으로 계산돼요
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" onclick="closeModal()">취소</button>
          <button class="btn btn-primary" onclick="saveProcEdit('${phaseId}','${siteName.replace(/'/g,"\\'")}')">저장</button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
}

function procEditChipStatus(el, val) {
  el.closest('.chip-group').querySelectorAll('.chip').forEach(b => {
    b.classList.remove('is-active');
    b.style.color = '';
    b.style.borderColor = '';
  });
  el.classList.add('is-active');
  const colorMap = { wait: 'var(--muted)', active: 'var(--warn)', done: 'var(--accent)' };
  el.style.color = colorMap[val] || '';
  el.style.borderColor = colorMap[val] || '';
  const inp = document.getElementById('proc-edit-status');
  if (inp) inp.value = val;
}

// 시작일 입력 시 종료일이 비어있으면 같은 날짜로 자동 채움 (대부분 당일시공)
// 종료일에 이미 값이 있으면 덮어쓰지 않음 — 사용자가 직접 수정 가능
function autofillProcEditEndDate() {
  const startEl = document.getElementById('proc-edit-start');
  const endEl   = document.getElementById('proc-edit-end');
  if (!startEl || !endEl) return;
  if (startEl.value && !endEl.value) {
    endEl.value = startEl.value;
  }
}

async function saveProcEdit(phaseId, siteName) {
  const encKey = s => s.replace(/[.#$/ \[\]]/g, '_');
  const startDate = document.getElementById('proc-edit-start')?.value || null;
  const doneDate = document.getElementById('proc-edit-end')?.value || null;

  // 날짜 기준 자동 상태 계산
  const todayStr = new Date().toISOString().slice(0, 10);
  let status = document.getElementById('proc-edit-status')?.value || 'wait';
  if (startDate && doneDate) {
    if (todayStr < startDate) status = 'wait';
    else if (todayStr > doneDate) status = 'done';
    else status = 'active';
  }

  const updates = { status };
  if (startDate) updates.startDate = startDate;
  else updates.startDate = null;
  if (doneDate) updates.doneDate = doneDate;
  else updates.doneDate = null;

  const btn = document.querySelector('.modal-foot .btn-primary');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }

  try {
    await db.ref('procData/' + encKey(siteName) + '/' + phaseId).update(updates);
    // 캐시 업데이트
    if (window.FB?._procAll?.[encKey(siteName)]?.[phaseId]) {
      Object.assign(window.FB._procAll[encKey(siteName)][phaseId], updates);
    }
    closeModal();
    // 현장 상세 새로고침
    if (window.navigate) window.navigate('siteDetail');
  } catch(e) {
    alert('저장 실패. 다시 시도해주세요.');
    if (btn) { btn.disabled = false; btn.textContent = '저장'; }
  }
}

// ===== 노하우 상세 보기 =====
window.openTipDetail = function(tipKey) {
  const tips = window.MOCK?.tips || [];
  const tip = tips.find(t => t._key === tipKey);
  if (!tip) { console.warn('노하우를 찾을 수 없어요:', tipKey); return; }

  const pillCls = tip.cat==='실수'?'pill-warn':tip.cat==='팁'?'pill-accent':tip.cat==='자재'?'pill-pin':'pill-info';
  const ic  = tip.cat==='실수'?'😓':tip.cat==='팁'?'💡':tip.cat==='자재'?'🔩':'🤝';
  const dateStr = tip.createdAt ? new Date(tip.createdAt).toISOString().slice(0,10).replace(/-/g,'.') : '';
  const pPhotos = tip.problemPhotos || [];
  const sPhotos = tip.solutionPhotos || [];

  function photoStrip(label, photos) {
    if (!photos.length) return '';
    const enc = encodeURIComponent(JSON.stringify(photos));
    return `
      <div class="field">
        <label class="field-label">${label}</label>
        <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
          ${photos.map((p,i) => `
            <img src="${p}" data-tip-photos="${enc}" data-tip-photo-idx="${i}"
              style="width:88px;height:88px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);cursor:pointer;flex-shrink:0;">
          `).join('')}
        </div>
      </div>`;
  }

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">${ic} 노하우</div>
            <div class="modal-sub">
              <span class="pill ${pillCls}" style="margin-right:6px;">${tip.cat}</span>
              ${tip.pinned ? '<span class="pill pill-warn" style="margin-right:6px;">📌 핀고정</span>' : ''}
              ${dateStr}
            </div>
          </div>
          <button class="btn-icon" onclick="closeModal()">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M4 4l8 8M12 4l-8 8"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="field-label">제목</label>
            <div style="font-size:15px;font-weight:700;line-height:1.5;">${tip.title || '(제목 없음)'}</div>
          </div>
          ${tip.problem ? `
            <div class="field">
              <label class="field-label">문제 상황</label>
              <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--ink);">${tip.problem}</div>
            </div>` : ''}
          ${photoStrip('문제 사진', pPhotos)}
          ${tip.solution ? `
            <div class="field">
              <label class="field-label">해결 방법</label>
              <div style="font-size:14px;line-height:1.6;white-space:pre-wrap;color:var(--ink);">${tip.solution}</div>
            </div>` : ''}
          ${photoStrip('해결 사진', sPhotos)}
          <div class="grid-2">
            <div class="field">
              <label class="field-label">현장</label>
              <div style="font-size:14px;color:var(--ink);">${tip.site || '—'}</div>
            </div>
            <div class="field">
              <label class="field-label">작성자</label>
              <div style="font-size:14px;color:var(--ink);">${tip.by || '—'}</div>
            </div>
          </div>
        </div>
        <div class="modal-foot" style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost" data-tip-pin-toggle="${tip._key}" data-tip-pinned="${tip.pinned ? '1' : '0'}" style="${tip.pinned ? 'background:var(--warn-soft);color:var(--warn);border-color:var(--warn);' : ''}">
            ${tip.pinned ? '📌 핀고정 해제' : '📌 핀 고정하기'}
          </button>
          <button class="btn btn-ghost danger" onclick="deleteTip('${tip._key}')">🗑️ 삭제</button>
          <button class="btn btn-primary" style="margin-left:auto;" onclick="closeModal()">닫기</button>
        </div>
      </div>
    </div>`;
  document.body.style.overflow = 'hidden';

  // 사진 클릭 → 기존 사진 뷰어로
  root.querySelectorAll('[data-tip-photos]').forEach(img => {
    img.addEventListener('click', e => {
      e.stopPropagation();
      const enc = img.getAttribute('data-tip-photos');
      if (window.openPhotoAlbum) {
        window.openPhotoAlbum(enc);
      }
    });
  });

  // 핀 고정 토글 — 대표/팀장/대리 모두 가능
  const pinBtn = root.querySelector('[data-tip-pin-toggle]');
  if (pinBtn) {
    pinBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const key = pinBtn.getAttribute('data-tip-pin-toggle');
      const wasPinned = pinBtn.getAttribute('data-tip-pinned') === '1';
      const newVal = !wasPinned;
      // 낙관적 UI: 즉시 버튼 비활성화로 중복 클릭 방지
      pinBtn.disabled = true;
      pinBtn.textContent = '저장 중...';
      try {
        await db.ref('knowhow/' + key + '/pinned').set(newVal);
        // Firebase의 .on('value') 리스너가 자동으로 M.tips를 갱신함
        // 모달을 닫고 다시 열어서 최신 상태 반영
        closeModal();
        // 약간의 지연 후 다시 열기 (firebase 리스너가 M.tips를 업데이트할 시간을 줌)
        setTimeout(() => { window.openTipDetail(key); }, 150);
      } catch(err) {
        alert('핀 고정 변경에 실패했어요. 다시 시도해주세요.');
        pinBtn.disabled = false;
        pinBtn.textContent = wasPinned ? '📌 핀고정 해제' : '📌 핀 고정하기';
      }
    });
  }
};

// 노하우 삭제
window.deleteTip = async function(tipKey) {
  if (!confirm('이 노하우를 삭제할까요?')) return;
  try {
    await db.ref('knowhow/' + tipKey).remove();
    closeModal();
  } catch(e) {
    alert('삭제 실패: ' + e.message);
  }
};

// Modal dispatcher
window.MODALS = {
  site: modalSiteRegister,
  schedule: modalSchedule,
  tip: modalTip,
  staff: modalStaff,
  as: modalAS,
  phase: modalPhase,
  txEdit: modalTxEdit,
  quickTip: modalQuickTip,
};

// Close handlers
document.addEventListener('click', (e) => {
  // data-modal-close 버튼 또는 그 안의 SVG/path 클릭 모두 처리
  if (e.target.closest('[data-modal-close]')) {
    closeModal();
    return;
  }
  const opener = e.target.closest('[data-modal]');
  if (opener) {
    e.preventDefault();
    e.stopPropagation();
    const fn = window.MODALS[opener.dataset.modal];
    if (fn) fn();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
