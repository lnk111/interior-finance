// 디자인포 머니플로우 — 캐시 우선 전략 (빠른 로딩)
// 파일이 바뀔 때마다 CACHE_NAME의 버전을 올리면 사용자 기기에서 새 파일을 받음
const CACHE_NAME = 'designfor-v3';

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

// 요청 처리: 캐시 우선 + 백그라운드 갱신 (Stale-While-Revalidate)
// 1) 캐시에 있으면 즉시 반환 (체감 속도 ↑)
// 2) 동시에 백그라운드에서 네트워크로 새 버전 받아 캐시 갱신
// 3) 다음 접속 때 새 버전 사용
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
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        // 백그라운드 갱신 (응답을 기다리지 않음)
        var networkPromise = fetch(e.request).then(function(res) {
          // 200 OK인 정상 응답만 캐시에 저장
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(e.request, res.clone());
          }
          return res;
        }).catch(function() {
          // 네트워크 실패는 무시 — 캐시가 있으면 그걸 쓰면 됨
        });

        // 캐시 있으면 즉시 반환, 없으면 네트워크 응답 기다림
        return cached || networkPromise;
      });
    })
  );
});
