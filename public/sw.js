
const CACHE_NAME = 'sleepersheets-v1';
const OFFLINE_URL = '/offline.html';

// Core files to cache for offline functionality
const CORE_CACHE_FILES = [
  '/',
  '/offline.html',
  '/football.svg',
  '/src/main.tsx',
  '/src/index.css'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.sleeper\.app\/v1\//
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_CACHE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Handle API requests with cache-first strategy for better offline support
  const isAPIRequest = API_CACHE_PATTERNS.some(pattern => 
    pattern.test(event.request.url)
  );

  if (isAPIRequest) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version immediately, then update cache in background
            fetch(event.request)
              .then((response) => {
                if (response.ok) {
                  const responseClone = response.clone();
                  caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, responseClone));
                }
              })
              .catch(() => {}); // Ignore background update errors
            
            return cachedResponse;
          }
          
          // If not in cache, fetch and cache
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(event.request, responseClone));
              }
              return response;
            });
        })
    );
    return;
  }

  // Default cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
