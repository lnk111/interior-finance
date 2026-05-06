// 머니플로우 — Mock data
window.MOCK = {
  user: '이재현',
  role: '실장',
  company: '하늘인테리어',

  totals: {
    revenue: 146_500_000,
    cost: 92_300_000,
    siteProfit: 54_200_000,
    fixed: 18_400_000,
    finalProfit: 35_800_000,
    vat: 14_650_000,
    margin: 24,
    targetMargin: 25,
  },

  briefing: [
    { kind: 'pay', icon: '₩', label: '서초 래미안 잔금 입금 예정', meta: '오늘 · ₩16,800,000', color: 'accent' },
    { kind: 'task', icon: '🔨', label: '판교 푸르지오 도배 시공', meta: '오늘 · 김반장', color: 'warn' },
    { kind: 'as', icon: '!', label: '마포 자이 누수 AS 접수', meta: '어제 · 1건', color: 'pin' },
    { kind: 'cal', icon: '📅', label: '신규 상담 (용산)', meta: '내일 14:00', color: 'info' },
  ],

  sites: [
    { id: 's1', name: '서초 래미안 32평', client: '김상훈', status: '공사중', start: '2026.04.18', end: '2026.05.22', revenue: 58_000_000, cost: 41_200_000, profit: 16_800_000, margin: 29, progress: 68, phase: '도배·타일' },
    { id: 's2', name: '판교 푸르지오 24평', client: '박지영', status: '공사중', start: '2026.04.25', end: '2026.05.30', revenue: 42_500_000, cost: 30_100_000, profit: 12_400_000, margin: 29, progress: 42, phase: '목공' },
    { id: 's3', name: '용산 한남더힐', client: '최민호', status: '계약완료', start: '2026.05.10', end: '2026.06.20', revenue: 86_000_000, cost: 0, profit: 0, margin: 0, progress: 0, phase: '대기' },
    { id: 's4', name: '마포 자이 18평', client: '정수아', status: '마감', start: '2026.03.15', end: '2026.04.20', revenue: 32_000_000, cost: 21_500_000, profit: 10_500_000, margin: 33, progress: 100, phase: '완료' },
    { id: 's5', name: '강남 아이파크', client: '한지훈', status: '잔금대기', start: '2026.04.01', end: '2026.05.05', revenue: 48_000_000, cost: 33_800_000, profit: 14_200_000, margin: 30, progress: 95, phase: '입주청소' },
    { id: 's6', name: '잠실 트리지움', client: '윤서연', status: '상담중', start: '—', end: '—', revenue: 0, cost: 0, profit: 0, margin: 0, progress: 0, phase: '상담' },
    { id: 's7', name: '분당 정자동', client: '강현우', status: 'AS관리', start: '2025.11.20', end: '2025.12.28', revenue: 0, cost: 800_000, profit: -800_000, margin: 0, progress: 100, phase: 'AS' },
  ],

  recent: [
    { id: 'r1', kind: '매출', site: '서초 래미안 32평', stage: '중도금', amount: 18_000_000, when: '오늘 14:32', invoice: true, pay: '계좌이체' },
    { id: 'r2', kind: '매입', site: '판교 푸르지오', phase: '목공자재', amount: 4_280_000, when: '오늘 11:08', invoice: true, pay: '계좌이체' },
    { id: 'r3', kind: '매출', site: '강남 아이파크', stage: '잔금', amount: 9_600_000, when: '어제', invoice: false, pay: '현금' },
    { id: 'r4', kind: 'AS', site: '마포 자이 18평', phase: '실리콘 재시공', amount: 350_000, when: '어제', invoice: false, pay: '현금' },
    { id: 'r5', kind: '매입', site: '서초 래미안', phase: '타일·접착제', amount: 2_140_000, when: '5/3', invoice: true, pay: '신용카드' },
    { id: 'r6', kind: '매출', site: '판교 푸르지오', stage: '착수금', amount: 12_750_000, when: '5/2', invoice: true, pay: '계좌이체' },
    { id: 'r7', kind: '매입', site: '판교 푸르지오', phase: '인건비 (목수 2인)', amount: 1_800_000, when: '5/2', invoice: false, pay: '계좌이체' },
  ],

  asList: [
    { id: 'a1', site: '마포 자이 18평', client: '정수아', phone: '010-2341-5678', issue: '욕실 타일 줄눈 사이 누수', staff: '김민수', date: '2026.05.07', status: '예정', cost: 350_000 },
    { id: 'a2', site: '분당 정자동', client: '강현우', phone: '010-7788-1234', issue: '주방 싱크대 하부장 경첩 불량', staff: '최도윤', date: '날짜 조율중', status: '대기', cost: 0 },
    { id: 'a3', site: '서초 래미안', client: '김상훈', phone: '010-3344-9988', issue: '거실 마루 들뜸 현상 1곳', staff: '미정', date: '2026.05.10', status: '예정', cost: 0 },
    { id: 'a4', site: '강남 아이파크', client: '한지훈', phone: '010-5566-7788', issue: '안방 도배지 모서리 들뜸', staff: '김민수', date: '2026.04.28', status: '완료', cost: 180_000 },
  ],

  tax: {
    vatPayable: 14_650_000,
    daysLeft: 82,
    nextDue: '2026.07.25',
    taxableRevenue: 146_500_000,
    invoiceCount: 18,
    quarters: [
      { q: '2025 1기', revenue: 132_000_000, vat: 13_200_000, status: 'paid' },
      { q: '2025 2기', revenue: 168_500_000, vat: 16_850_000, status: 'paid' },
      { q: '2026 1기', revenue: 146_500_000, vat: 14_650_000, status: 'pending' },
      { q: '2026 2기', revenue: 0, vat: 0, status: 'future' },
    ],
  },

  paymentStages: ['계약금', '착수금', '중도금', '잔금'],
  paymentMethods: ['현금', '계좌이체', '신용카드'],
  phases: ['철거', '창호', '전기', '욕실방수', '목공', '타일', '필름', '욕실설비', '바닥', '도배', '가구', '조명마감', '중문', '실리콘', '잔마감'],
  inputters: ['김실장', '이남경팀장', '김덕수대리'],
  siteStatuses: [
    { key: '상담중', desc: '고객과 상담 진행 중' },
    { key: '계약완료', desc: '계약서 작성 완료, 착공 대기' },
    { key: '공사중', desc: '실제 시공이 진행되고 있는 단계' },
    { key: '정산중', desc: '시공 완료, 비용 정산 진행' },
    { key: '잔금대기', desc: '잔금 입금 대기 중' },
    { key: '마감', desc: '모든 정산 완료, 종결' },
    { key: 'AS관리', desc: '하자보수 및 사후관리' },
  ],

  fixedCosts: [
    { label: '사무실 임대료', value: 2_800_000 },
    { label: '직원 급여', value: 12_500_000 },
    { label: '차량·유류', value: 1_400_000 },
    { label: '통신·관리비', value: 380_000 },
    { label: '보험·세무', value: 720_000 },
    { label: '기타 운영비', value: 600_000 },
  ],

  staff: [
    { name: '이재현', role: '실장', joined: '2018.03', status: '재직중' },
    { name: '김민수', role: '현장반장', joined: '2020.07', status: '재직중' },
    { name: '박서영', role: '경리', joined: '2022.01', status: '재직중' },
    { name: '최도윤', role: '시공팀', joined: '2024.05', status: '재직중' },
  ],

  tips: [
    { cat: '실수', title: '욕실 방수 후 24시간 양생 안 하고 타일 시공 → 누수 발생', site: '마포 자이', by: '김민수', pinned: true },
    { cat: '팁', title: '목공 시공 전 수직·수평 레이저 체크 필수 (재시공 비용 ↓)', site: '서초 래미안', by: '이재현', pinned: true },
    { cat: '자재', title: 'A사 도배지 가격 12% 인상, B사 동등급 대체 가능', site: '—', by: '박서영' },
    { cat: '고객', title: '계약 시 변경요청 횟수 명시 (3회 초과 시 추가 비용)', site: '판교 푸르지오', by: '이재현' },
    { cat: '실수', title: '전기 콘센트 위치 변경 도면 미반영 → 추가 작업', site: '강남 아이파크', by: '김민수' },
    { cat: '팁', title: '입주청소 외주 단가: 평당 8,000원이 시장가', site: '—', by: '박서영' },
  ],

  events: {
    1: [{ t: '5월 시작', c: 'muted' }],
    4: [{ t: '서초 도배', c: 'warn' }, { t: '미정리 6건', c: 'warn' }],
    5: [{ t: '판교 잔금', c: 'accent' }],
    8: [{ t: '용산 착공', c: 'pin' }],
    12: [{ t: '마포 AS 방문', c: 'info' }],
    15: [{ t: '신규 상담 2건', c: 'muted' }],
    20: [{ t: '서초 점검', c: 'warn' }],
    22: [{ t: '서초 잔금', c: 'accent' }],
    25: [{ t: '월말 정산', c: 'info' }],
    30: [{ t: '판교 마감', c: 'accent' }],
  },

  unsorted: 6,
};
