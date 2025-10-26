
const CACHE_NAME = 'hali-katalogu-cache-v1';
// This list should include the essential files for the app shell to load.
const URLS_TO_CACHE = [
  '/hali-katalogu/',
  '/hali-katalogu/index.html',
  '/hali-katalogu/manifest.json',
  '/hali-katalogu/carpet-icon.svg',
];

// Install event: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('ServiceWorker: Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('ServiceWorker: Failed to cache app shell', err);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('ServiceWorker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: serve from cache, fall back to network, and cache new requests
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET' || event.request.url.includes('generativelanguage.googleapis.com')) {
    // For non-GET requests or API calls, just use the network.
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        // Return response from cache if found
        if (response) {
          // Asynchronously update the cache in the background
          const fetchRequest = event.request.clone();
          fetch(fetchRequest).then(res => {
              if (res && res.status === 200) {
                  cache.put(event.request, res);
              }
          }).catch(err => {
              // Network failed, which is fine, we served from cache.
          });
          return response;
        }

        // If not in cache, fetch from network
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200) {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once.
            const responseToCache = response.clone();
            cache.put(event.request, responseToCache);

            return response;
          }
        ).catch(err => {
            console.error('ServiceWorker: Fetch failed', err);
            // You could return a custom offline page here if you had one.
        });
      });
    })
  );
});
