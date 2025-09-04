const CACHE_NAME = 'quran-quest-cache-v2-' + (self && self.registration ? self.registration.scope : Date.now());
const OFFLINE_URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './output.css',
  './uthmanic.css',
  './Uthmanic_NeoCOLOR-Regular copy.woff2',
  './font.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // Return cached version or fallback to index.html
          return caches.match(request)
            .then((cached) => cached || caches.match('./index.html'));
        })
    );
    return;
  }
  
  // Handle static assets (CSS, JS, fonts, images) - Cache First Strategy
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            return cached;
          }
          
          return fetch(request)
            .then((response) => {
              // Cache successful responses
              if (response.status === 200) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              }
              return response;
            })
            .catch(() => {
              // Return cached version if available
              return caches.match(request);
            });
        })
    );
    return;
  }
  
  // Handle external requests (Google Fonts, etc.) - Network First Strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => {
        // Return cached version if available
        return caches.match(request);
      })
  );
});


