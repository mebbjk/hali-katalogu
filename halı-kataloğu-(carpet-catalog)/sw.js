// sw.js

const CACHE_NAME = 'hali-katalogu-cache-v4'; // Incremented version
// These are the essential files for the app shell to work offline.
// The paths are relative to the root of the GitHub Pages site.
const URLS_TO_CACHE = [
  '/hali-katalogu/',
  '/hali-katalogu/index.html',
  '/hali-katalogu/manifest.json',
  '/hali-katalogu/carpet-icon.svg'
];

// Install the service worker and cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
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
    })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Not in cache - perform a network request
        return fetch(event.request);
      }
    )
  );
});
