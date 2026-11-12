/* Finorra Finance redesigned release — keeps the existing account-aware sync code intact. */
const CACHE_NAME = 'finorra-v3-visual-refresh-v1';
const CORE_FILES = ['./', './index.html', './manifest.json',
  './fonts/Finorra-Interface-Regular.otf', './fonts/Finorra-Interface-Medium.otf',
  './fonts/Finorra-Interface-Semibold.otf', './fonts/Finorra-Interface-Bold.otf',
  './fonts/Finorra-Display-Semibold.otf', './fonts/Finorra-Display-Bold.otf'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const file of CORE_FILES) { try { await cache.add(file); } catch (e) { /* retry on first visit */ } }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('finorra-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(req);
      if (response && response.ok) { const cache = await caches.open(CACHE_NAME); cache.put(req, response.clone()).catch(() => {}); }
      return response;
    } catch (e) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return (await caches.match('./index.html')) || new Response('Offline page unavailable.', {status:503});
      return new Response('Offline asset unavailable.', {status:503});
    }
  })());
});
