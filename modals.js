// 머니플로우 — Modals
// 8 modals: site, schedule, tip, staff, as, phase, txEdit, quickTip

const MODAL_BACK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" width="14" height="14"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

function openModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" data-modal-close>
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
      <button class="btn-icon" data-modal-close>${MODAL_BACK}</button>
    </div>
  `;
}

// 1. Site register modal
function modalSiteRegister() {
  const stHtml = window.MOCK.siteStatuses.map((s, i) => `
    <button type="button" class="status-pick ${i === 1 ? 'is-active' : ''}" data-status="${s.key}">
      <span class="pill status-${s.key}">${s.key}</span>
      <span class="status-desc">${s.desc}</span>
    </button>
  `).join('');

  return openModal(`
    ${modalHeader('현장 등록', '신규 현장 정보를 입력하세요')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">현장명 <span class="req">*</span></label>
        <input class="input" placeholder="예) 서초 래미안 32평">
      </div>
      <div class="field">
        <label class="field-label">고객명</label>
        <input class="input" placeholder="예) 김상훈">
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">연도</label>
          <select class="input"><option>2026</option><option>2025</option><option>2027</option></select>
        </div>
        <div class="field">
          <label class="field-label">월</label>
          <select class="input">${[...Array(12)].map((_, i) => `<option ${i === 4 ? 'selected' : ''}>${i + 1}월</option>`).join('')}</select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">현장 상태</label>
        <div class="status-pick-list">${stHtml}</div>
      </div>
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" rows="2" placeholder="선택사항"></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-modal-close>취소</button>
      <button class="btn btn-primary" data-modal-close>저장</button>
    </div>
  `);
}

// 2. Schedule add modal
function modalSchedule() {
  const staffHtml = window.MOCK.staff.map(s => `
    <label class="check-row">
      <input type="checkbox" />
      <span>${s.name} <span class="muted">${s.role}</span></span>
    </label>
  `).join('');

  return openModal(`
    ${modalHeader('일정 추가', '캘린더에 표시됩니다')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">제목 <span class="req">*</span></label>
        <input class="input" placeholder="예) 서초 래미안 점검">
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">날짜 <span class="req">*</span></label>
          <input class="input" type="date" value="2026-05-08">
        </div>
        <div class="field">
          <label class="field-label">시간</label>
          <input class="input" type="time" value="14:00">
        </div>
      </div>
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" rows="2"></textarea>
      </div>
      <div class="field">
        <label class="field-label">참석자</label>
        <div class="check-list">${staffHtml}</div>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost danger" data-modal-close>🗑️ 삭제</button>
      <button class="btn btn-primary" data-modal-close>저장</button>
    </div>
  `);
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
      <button onclick="tipRemovePhoto('${type}',${i})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.55);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
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
function modalAS() {
  return openModal(`
    ${modalHeader('🔧 AS 등록', '하자보수 일정 및 내용')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">현장 <span class="req">*</span></label>
        <select class="input">
          ${window.MOCK.sites.map(s => `<option>${s.name}</option>`).join('')}
          <option>+ 직접 입력</option>
        </select>
      </div>
      <div class="field">
        <label class="field-label">AS 내용 <span class="req">*</span></label>
        <textarea class="input" rows="3" placeholder="예) 욕실 타일 줄눈 누수"></textarea>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">고객 전화번호</label>
          <input class="input" type="tel" placeholder="010-0000-0000">
        </div>
        <div class="field">
          <label class="field-label">AS 담당자</label>
          <select class="input">
            ${window.MOCK.staff.map(s => `<option>${s.name}</option>`).join('')}
            <option>직접 입력</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label class="field-label">날짜</label>
        <div class="chip-group">
          <button type="button" class="chip is-active">📅 날짜 선택</button>
          <button type="button" class="chip">🕐 날짜 조율중</button>
        </div>
        <input class="input" type="date" style="margin-top: 8px;" value="2026-05-10">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost danger" data-modal-close>🗑️ 삭제</button>
      <button class="btn btn-primary" data-modal-close>저장</button>
    </div>
  `);
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
function modalTxEdit() {
  return openModal(`
    ${modalHeader('✏️ 거래 수정', '입력한 거래 내용을 수정합니다')}
    <div class="modal-body">
      <div class="tabs">
        <button class="tab is-active">💰 매출</button>
        <button class="tab">📦 매입</button>
        <button class="tab">🔧 AS</button>
      </div>
      <div class="field">
        <label class="field-label">현장 <span class="req">*</span></label>
        <select class="input">
          ${window.MOCK.sites.map(s => `<option>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">금액 (원) <span class="req">*</span></label>
        <input class="input input-amount num" value="18,000,000">
      </div>
      <div class="field">
        <label class="field-label">날짜</label>
        <input class="input" type="date" value="2026-05-06">
      </div>
      <div class="field">
        <label class="field-label">결제 단계</label>
        <div class="chip-group">
          <button type="button" class="chip">📋 계약금</button>
          <button type="button" class="chip">🔨 착수금</button>
          <button type="button" class="chip is-active">💼 중도금</button>
          <button type="button" class="chip">✅ 잔금</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">결제 방법</label>
        <div class="chip-group">
          <button type="button" class="chip">💵 현금</button>
          <button type="button" class="chip is-active">🏦 계좌이체</button>
          <button type="button" class="chip">💳 신용카드</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">메모</label>
        <textarea class="input" rows="2"></textarea>
      </div>
      <div class="field">
        <label class="field-label">첨부 사진</label>
        <div class="photo-row">
          <div class="photo-thumb"></div>
          <button type="button" class="photo-add">📷</button>
        </div>
        <div class="muted small">탭하면 전체화면</div>
      </div>
      <div class="invoice-toggle">
        <div class="checkbox">
          <svg viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4 7.5L11 1" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div>
          <div class="it-title">📄 세금계산서 발행</div>
          <div class="it-meta">체크하면 부가세(10%)가 자동 계산됩니다</div>
        </div>
      </div>
      <div class="field">
        <label class="field-label">입력자</label>
        <select class="input">${window.MOCK.inputters.map(n => `<option>${n}</option>`).join('')}</select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-modal-close>취소</button>
      <button class="btn btn-primary" data-modal-close>✅ 수정 완료</button>
    </div>
  `);
}

// 8. Quick tip / quick record modal
function modalQuickTip() {
  window._qtPhotos = [];
  const today = new Date().toISOString().slice(0, 10);
  const sitesOpts = (window.MOCK?.sites || []).map(s => `<option value="${s.name}">${s.name}</option>`).join('');
  const writersOpts = (window.MOCK?.inputters || []).map(n => `<option value="${n}">${n}</option>`).join('');

  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" onclick="closeModal()">
      <div class="modal-sheet" onclick="event.stopPropagation()">
        <div class="modal-head">
          <div>
            <div class="modal-title">⚡ 빠른 기록</div>
            <div class="modal-sub">현장에서 즉석으로 메모, 나중에 정리</div>
          </div>
          <button class="btn-icon" onclick="closeModal()" style="background:var(--surface-2);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">${MODAL_BACK}</button>
        </div>
        <div class="modal-body">
          <div class="callout warm">
            <div class="callout-icon">⚡</div>
            <div>
              <div class="callout-title">자동 설정</div>
              <div class="callout-body">현장을 선택하고 사진·메모만 남기세요. 금액·공정은 나중에 미정리 탭에서 정리할 수 있어요.</div>
            </div>
          </div>

          <div class="field">
            <label class="field-label">현장 선택 <span class="req">*</span></label>
            <select class="input" id="qt-site">
              <option value="">현장을 선택해주세요</option>
              ${sitesOpts}
            </select>
          </div>

          <div class="field">
            <label class="field-label">날짜</label>
            <input class="input" type="date" id="qt-date" value="${today}">
          </div>

          <div class="field">
            <label class="field-label">📎 사진 첨부 <span class="muted">선택사항</span></label>
            <div class="grid-2" style="margin-bottom:10px;">
              <button type="button" class="attach" onclick="qtOpenCamera()">📷 카메라 촬영</button>
              <button type="button" class="attach" onclick="qtOpenGallery()">🖼️ 갤러리 업로드</button>
            </div>
            <input type="file" id="qt-file-camera" accept="image/*" capture="environment" style="display:none" onchange="qtHandleFile(event)">
            <input type="file" id="qt-file-gallery" accept="image/*" multiple style="display:none" onchange="qtHandleFile(event)">
            <div id="qt-photo-preview" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
          </div>

          <div class="field">
            <label class="field-label">작성자 <span class="req">*</span></label>
            <select class="input" id="qt-writer">
              ${writersOpts}
            </select>
          </div>

          <div class="field">
            <label class="field-label">메모 <span class="muted">선택</span></label>
            <textarea class="input" id="qt-memo" rows="3" placeholder="현장 상황을 빠르게 기록"></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" onclick="closeModal()">취소</button>
          <button class="btn btn-primary" onclick="qtSave()">⚡ 임시 저장</button>
        </div>
      </div>
    </div>
  `;
  document.body.style.overflow = 'hidden';
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
  if (!wrap) return;
  wrap.innerHTML = window._qtPhotos.map((p, i) => `
    <div style="position:relative;width:80px;height:80px;flex-shrink:0;">
      <img src="${p}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;border:1.5px solid var(--hair);">
      <button onclick="qtRemovePhoto(${i})"
        style="position:absolute;top:-6px;right:-6px;background:#1B1814;color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;line-height:1;">✕</button>
    </div>
  `).join('');
}

function qtRemovePhoto(idx) {
  window._qtPhotos.splice(idx, 1);
  qtRenderPhotos();
}

async function qtSave() {
  const site = document.getElementById('qt-site')?.value;
  const date = document.getElementById('qt-date')?.value;
  const writer = document.getElementById('qt-writer')?.value;
  const memo = document.getElementById('qt-memo')?.value?.trim();

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
  if (e.target.closest('[data-modal-close]')) {
    const inSheet = e.target.closest('.modal-sheet');
    if (e.target.matches('[data-modal-close]') || !inSheet) {
      closeModal();
    }
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
