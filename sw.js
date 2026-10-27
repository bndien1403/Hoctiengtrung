// Service worker: cho phép cài lên màn hình chính và mở nhanh, dùng được bài học khi mạng yếu.
const CACHE = 'hanngu-202610272212';
const CORE = ['./', 'index.html', 'config.js', 'platform.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'data/core.json', 'vendor/pinyin-pro.js', 'vendor/hanzi-writer.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('hanngu-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase, Gemini, Google: luôn đi thẳng ra mạng
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /config\.js$/.test(url.pathname);
  if (isPage) {
    // Trang chính và cấu hình: ưu tiên bản mới trên mạng
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // Dữ liệu và thư viện: dùng bản đã lưu, tải ngầm bản mới
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
