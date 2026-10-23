// Offline support. Online: always fetch fresh (so updates and new icons show at once).
// Offline: fall back to the last copy saved here.
const CACHE = 'wol-mvl11csh';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];
self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's HTTP cache, so a new version never stores stale files.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, {cache: 'no-cache'})
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}))
  );
});
