// Bump the version whenever the caching strategy changes; old caches are deleted on activate.
const CACHE_NAME = 'kumpul-cafe-v2';

// Every entry MUST exist: cache.addAll() rejects (and the SW fails to install) on any 404.
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function putInCache(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
}

function cacheFirst(request) {
  return caches
    .match(request)
    .then((cached) => cached || fetch(request).then((res) => putInCache(request, res)));
}

function networkFirst(request) {
  return fetch(request)
    .then((res) => putInCache(request, res))
    .catch(() => caches.match(request));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only plain GETs to this origin are cacheable. Everything else goes straight to the
  // network: mutations, and the backend API (a different origin, with authenticated and
  // encrypted responses that must never be stored on a shared POS device).
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Next.js build assets are content-hashed, so a cached copy can never be stale.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Static images from /public (icons, banners, illustrations).
  if (request.destination === 'image' || /\.(png|jpe?g|svg|webp|gif|ico)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages and everything else: always try the network first so a new deploy is picked up
  // immediately; fall back to the cached copy only when offline.
  event.respondWith(networkFirst(request));
});
