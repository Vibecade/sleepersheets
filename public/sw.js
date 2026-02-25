
const CACHE_NAME = 'sleepersheets-v3';
const API_CACHE_NAME = 'sleepersheets-api-v2';
const OFFLINE_URL = '/offline.html';
const MAX_CACHE_SIZE = 50; // Maximum number of cached responses per cache
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Core files to cache for offline functionality
const CORE_CACHE_FILES = [
  '/',
  '/offline.html',
  '/football.svg',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  {
    pattern: /^https:\/\/api\.sleeper\.app\/v1\/players\/nfl$/,
    strategy: 'cache-first', // Players data changes rarely
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  {
    pattern: /^https:\/\/api\.sleeper\.app\/v1\/league\/[^/]+$/,
    strategy: 'stale-while-revalidate', // League info
    maxAge: 60 * 60 * 1000 // 1 hour
  },
  {
    pattern: /^https:\/\/api\.sleeper\.app\/v1\/league\/[^/]+\/(rosters|users|transactions|drafts)/,
    strategy: 'network-first', // Dynamic data
    maxAge: 5 * 60 * 1000 // 5 minutes
  }
];

// Background sync for offline actions
const BACKGROUND_SYNC_TAG = 'sleepersheets-sync';
const ASSET_FILE_PATTERN = /\/assets\/.+\.(js|css|map)$/;

// Utility functions
const isExpired = (response) => {
  const dateHeader = response.headers.get('date');
  const cacheControl = response.headers.get('cache-control');
  if (!dateHeader) return true;
  
  const responseTime = new Date(dateHeader).getTime();
  const maxAge = cacheControl && cacheControl.includes('max-age=') 
    ? parseInt(cacheControl.split('max-age=')[1]) * 1000 
    : CACHE_EXPIRY;
  
  return Date.now() - responseTime > maxAge;
};

const limitCacheSize = async (cacheName, maxSize) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxSize);
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache files individually to prevent one failure from breaking all
        return Promise.allSettled(
          CORE_CACHE_FILES.map(file => 
            cache.add(file).catch(err => {
              console.warn('Failed to cache:', file, err);
              return null;
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Allow clients to force activate a waiting worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle background sync
self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'BACKGROUND_SYNC' });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // Never serve hashed JS/CSS bundles from the SW cache.
  // This avoids stale chunk/version mismatch issues after deployments.
  if (requestUrl.origin === self.location.origin && ASSET_FILE_PATTERN.test(requestUrl.pathname)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('Network error', { status: 408 });
      })
    );
    return;
  }

  // Keep scripts/styles/workers network-first to reduce stale-client risk.
  if (['script', 'style', 'worker'].includes(event.request.destination)) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('Network error', { status: 408 });
      })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Handle API requests with different caching strategies
  const apiConfig = API_CACHE_PATTERNS.find(config => 
    config.pattern.test(event.request.url)
  );

  if (apiConfig) {
    event.respondWith(handleAPIRequest(event.request, apiConfig));
    return;
  }

  // Default cache-first strategy for other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
      .catch(() => {
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
        return new Response('Network error', { status: 408 });
      })
  );
});

async function handleAPIRequest(request, config) {
  const cache = await caches.open(API_CACHE_NAME);
  
  switch (config.strategy) {
    case 'cache-first':
      return handleCacheFirst(request, cache, config);
    case 'network-first':
      return handleNetworkFirst(request, cache, config);
    case 'stale-while-revalidate':
      return handleStaleWhileRevalidate(request, cache, config);
    default:
      return fetch(request);
  }
}

async function handleCacheFirst(request, cache, config) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      await limitCacheSize(API_CACHE_NAME, MAX_CACHE_SIZE);
    }
    return response;
  } catch (error) {
    return cachedResponse || new Response('Network error', { status: 408 });
  }
}

async function handleNetworkFirst(request, cache, config) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      await limitCacheSize(API_CACHE_NAME, MAX_CACHE_SIZE);
    }
    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Network error', { status: 408 });
  }
}

async function handleStaleWhileRevalidate(request, cache, config) {
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
      limitCacheSize(API_CACHE_NAME, MAX_CACHE_SIZE);
    }
    return response;
  }).catch(() => null);
  
  return cachedResponse || await fetchPromise;
}
