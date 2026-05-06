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
  return openModal(`
    ${modalHeader('💡 노하우 기록', '실수·팁·자재·고객 노하우를 남겨두세요')}
    <div class="modal-body">
      <div class="field">
        <label class="field-label">카테고리</label>
        <div class="chip-group">
          <button type="button" class="chip is-active">😓 실수</button>
          <button type="button" class="chip">💡 팁</button>
          <button type="button" class="chip">🔩 자재</button>
          <button type="button" class="chip">🤝 고객</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">제목 <span class="req">*</span></label>
        <input class="input" placeholder="예) 욕실 방수 24시간 양생 누락">
      </div>
      <div class="field">
        <label class="field-label">문제 상황</label>
        <textarea class="input" rows="3" placeholder="어떤 일이 있었는지"></textarea>
      </div>
      <div class="field">
        <label class="field-label">해결 방법</label>
        <textarea class="input" rows="3" placeholder="어떻게 해결했는지"></textarea>
      </div>
      <div class="grid-2">
        <div class="field">
          <label class="field-label">현장</label>
          <select class="input">
            <option>—</option>
            ${window.MOCK.sites.map(s => `<option>${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label class="field-label">작성자</label>
          <select class="input">
            ${window.MOCK.inputters.map(n => `<option>${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <label class="check-row">
        <input type="checkbox" checked>
        <span>📌 주의사항으로 핀 고정</span>
      </label>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost danger" data-modal-close>🗑️ 삭제</button>
      <button class="btn btn-primary" data-modal-close>저장</button>
    </div>
  `);
}

// 4. Staff add modal — PIN + 역할 필드 추가
function modalStaff() {
  const isBoss = window.AUTH && AUTH.role() === 'boss';
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
      ${isBoss ? `
      <div class="grid-2">
        <div class="field">
          <label class="field-label">PIN <span class="req">*</span> <span class="muted">4자리</span></label>
          <input class="input num" type="password" inputmode="numeric" maxlength="4" placeholder="••••" id="staff-pin">
        </div>
        <div class="field">
          <label class="field-label">역할 <span class="req">*</span></label>
          <select class="input" id="staff-role-sel">
            <option value="staff">직원</option>
            <option value="manager">팀장</option>
            <option value="boss">보스</option>
          </select>
        </div>
      </div>
      <div class="callout" style="margin-bottom: 12px;">
        <div class="callout-icon">🔐</div>
        <div class="callout-body">
          <b>직원</b>: 고정비·급여·세금·TOP3 비공개<br>
          <b>팀장</b>: 고정비만 비공개<br>
          <b>보스</b>: 전체 공개
        </div>
      </div>
      ` : ''}
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
          <div class="callout-body">시작일·완료일을 입력하면 <b>오늘 날짜 기준</b>으로 상태가 자동으로 바뀌어요.</div>
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
        <label class="field-label">메모</label>
        <textarea class="input" rows="2"></textarea>
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

// 8. Quick record modal
function modalQuickTip() {
  return openModal(`
    ${modalHeader('⚡ 빠른 기록', '현장에서 즉석으로 메모, 나중에 정리')}
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
        <select class="input">
          <option>현장을 선택해주세요</option>
          ${window.MOCK.sites.map(s => `<option>${s.name}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field-label">날짜</label>
        <input class="input" type="date" value="2026-05-06">
      </div>
      <div class="field">
        <label class="field-label">📎 사진 첨부 <span class="muted">선택사항</span></label>
        <div class="grid-2">
          <button type="button" class="attach">📷 카메라 촬영</button>
          <button type="button" class="attach">🖼️ 갤러리 업로드</button>
        </div>
      </div>
      <div class="field">
        <label class="field-label">작성자 <span class="req">*</span></label>
        <select class="input">${window.MOCK.inputters.map(n => `<option>${n}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label class="field-label">메모 <span class="muted">선택</span></label>
        <textarea class="input" rows="3" placeholder="현장 상황을 빠르게 기록"></textarea>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-modal-close>취소</button>
      <button class="btn btn-primary" data-modal-close>⚡ 임시 저장</button>
    </div>
  `);
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
