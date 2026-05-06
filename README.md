# 머니플로우 (MoneyFlow)

인테리어 시공 현장의 손익을 한 눈에 관리하는 모바일 우선 웹앱입니다.

## 🚀 빠르게 시작하기

이 폴더를 그대로 GitHub 저장소에 업로드하고 GitHub Pages를 켜면 바로 사용할 수 있습니다.

### GitHub Pages 배포

1. 새 저장소를 만들고 `dist/` 폴더의 모든 파일을 저장소 루트에 업로드
2. Settings → Pages → Source: `main` branch / `/ (root)` 선택
3. 몇 분 후 `https://<your-username>.github.io/<repo-name>/` 에서 확인

### 로컬 실행

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx serve .

# 그냥 index.html 더블클릭으로도 동작합니다
```

## 📁 파일 구조

```
.
├── index.html      # 진입점 (앱 셸 + 탭바)
├── style.css       # 디자인 시스템 + 모든 컴포넌트 스타일
├── data.js         # 목업 데이터 (실제 연동 시 API로 교체)
└── app.js          # 라우팅 + 화면 렌더링 로직
```

## 🎨 디자인 시스템

- **컬러**: 따뜻한 아이보리 베이스(`#FAF7F1`) + 잉크 텍스트 + 절제된 그린(수익) / 클레이(지출) 액센트
- **폰트**: Pretendard (한글 가독성, tabular nums)
- **모바일 우선**: 480px 이상에서는 중앙 정렬, 그 외 풀폭
- **20–65세 모두 편안**: 큰 숫자, 충분한 hit 영역, 명확한 위계

## 📱 화면 목록

- 홈 (오늘의 브리핑 + 손익 요약 + TOP 3 + 최근 거래)
- 거래 입력 (매출/매입/AS · 영수증·음성 첨부)
- 현장 (필터 + 카드 리스트)
- 현장 상세 (공정 타임라인 + 결제 일정)
- 캘린더 (월간 그리드 + 다가오는 일정)
- 더보기 (메뉴 허브)
  - 세금 · 부가세
  - 노하우
  - 리포트 · 분석
  - 직원 관리
  - 고정비 · 설정

## 🔧 데이터 연동

`data.js`의 `window.MOCK` 객체를 실제 API 응답으로 교체하면 됩니다.

```js
// 예시
fetch('/api/dashboard').then(r => r.json()).then(data => {
  window.MOCK = data;
  navigate('home');
});
```

## 📝 라이선스

내부 사용 목적.
