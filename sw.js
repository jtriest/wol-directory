// Offline support. Online: always fetch fresh (so updates and new icons show at once).
// Offline: fall back to the last copy saved here.
const CACHE = 'wol-mvss307n';
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
// On a weak signal, don't keep the app waiting: after 3s use the saved copy (the fresh one still saves for next time).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const net = fetch(e.request, {cache: 'no-cache'}).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    const saved = await cache.match(e.request, {ignoreSearch: true});
    if (!saved) return net;
    return Promise.race([net.catch(() => saved), new Promise(res => setTimeout(() => res(saved), 3000))]);
  })());
});
