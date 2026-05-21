const CACHE_NAME = 'tictacbestie-v1';
const FONT_CACHE_NAME = 'tictacbestie-fonts-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './image/rose-flower-cartoon-cute-pink-cartoon-flower-with-adorable-expression-kuNzw8k8_t-removebg-preview.png',
  './image/rose-flower-cartoon-cute-cartoon-rose-with-cheerful-expression-qFPyqk1g_t-removebg-preview.png'
];

// Install Event - cache core static resources
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching all static shell assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clean up obsolete cache versions
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== FONT_CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - network first / stale-while-revalidate fallbacks & dynamic font caching
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Cache Google Fonts stylesheet and font files dynamically
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(e.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(e.request).then((networkResponse) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Standard cache-first strategy for other static shell assets
  e.respondWith(
    caches.match(e.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Serve cached version immediately
          return cachedResponse;
        }
        // Fallback to fetch from network
        return fetch(e.request);
      })
  );
});

// Support SKIP_WAITING message for active manual service worker update trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

