const CACHE_NAME = 'hali-katalogu-cache-v1';

// This is not an exhaustive list, but the core shell of the app.
// The fetch handler will cache other assets dynamically.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/carpet-icon.svg',
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate the new service worker immediately
  );
});

// Clean up old caches when a new service worker is activated
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients
  );
});

// Serve assets from cache with a stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  // We only want to cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 1. Try to get the response from the cache
      const cachedResponse = await cache.match(event.request);

      // 2. In the background, fetch a fresh version from the network
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // If the fetch is successful, update the cache with the new version
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // Fetch failed, probably offline. This is okay if we have a cached response.
        console.warn('Fetch failed; serving from cache if available.', err);
      });

      // 3. Return the cached response immediately if it exists, otherwise wait for the network
      // This makes the app feel incredibly fast ("instant loading")
      return cachedResponse || fetchPromise;
    })
  );
});
