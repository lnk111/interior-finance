// 디자인포 머니플로우 — 캐시 우선 전략 (빠른 로딩)
// 파일이 바뀔 때마다 CACHE_NAME의 버전을 올리면 사용자 기기에서 새 파일을 받음
const CACHE_NAME = 'designfor-v4';

// 앱 셸 — 설치 시 미리 캐싱 (다음 접속부터 즉시 로딩)
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './data.js',
  './auth.js',
  './firebase.js',
  './modals.js',
  './pages.js',
  './app.js',
];

// 설치: 앱 셸 전체 캐시
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // 일부 파일이 실패해도 install이 막히지 않도록 개별 처리
      return Promise.all(ASSETS.map(function(url) {
        return cache.add(url).catch(function(err) {
          console.warn('[SW] 캐시 실패:', url, err.message);
        });
      }));
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제 (CACHE_NAME이 바뀌면 자동으로 옛 버전 정리)
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// 요청 처리: 네트워크 우선 (Network-First) + 오프라인 시 캐시 폴백
// 1) 온라인이면 항상 최신 파일을 받고 캐시도 갱신 → 배포 즉시 반영
// 2) 네트워크 실패(오프라인)면 캐시로 폴백 → 오프라인에서도 동작
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  // Firebase·Cloudinary 등 외부 API는 캐싱 안 함 (실시간 데이터)
  var url = new URL(e.request.url);
  var isExternalAPI = url.hostname.includes('firebaseio.com') ||
                      url.hostname.includes('cloudinary.com') ||
                      url.hostname.includes('gstatic.com');
  if (isExternalAPI) {
    // 외부 API는 그냥 네트워크 통과 (SW가 관여 안 함)
    return;
  }

  e.respondWith(
    fetch(e.request).then(function(res) {
      // 정상 응답이면 캐시 갱신 후 반환
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, copy); });
      }
      return res;
    }).catch(function() {
      // 오프라인 — 캐시에서 폴백
      return caches.open(CACHE_NAME).then(function(cache) { return cache.match(e.request); });
    })
  );
});
