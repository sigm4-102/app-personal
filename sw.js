const CACHE_NAME = 'karaagechan-v1';

// キャッシュするファイル（自分のファイルだけ）
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icon.svg',
];

// インストール時：静的アセットをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// フェッチ戦略
// - 自分のファイル（index.html等）: Network First → Cache Fallback
// - 外部リソース（Firebase・Fonts・CDN等）: Network Only（キャッシュしない）
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    // 外部リソースはそのままネットワークへ
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(res => {
        // 成功したらキャッシュも更新
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return res;
      })
      .catch(() => {
        // オフライン時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
