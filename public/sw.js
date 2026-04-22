const SHELL_CACHE = 'travel-planner-shell-v1';
const ASSET_CACHE = 'travel-planner-asset-v1';
const SHELL_URLS = ['/', '/dashboard', '/manifest.webmanifest', '/icons/icon-192.svg', '/icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.put(request, cloned)));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          const fallback = await caches.match('/');
          if (fallback) {
            return fallback;
          }
          return new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }),
    );
    return;
  }

  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const cloned = response.clone();
            event.waitUntil(caches.open(ASSET_CACHE).then((cache) => cache.put(request, cloned)));
            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      }),
    );
  }
});
