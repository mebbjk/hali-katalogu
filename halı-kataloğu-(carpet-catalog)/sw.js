// This service worker is intentionally left minimal to disable a previous,
// faulty caching service worker. It ensures that the browser always
// fetches the latest content from the network.

self.addEventListener('install', () => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Ensure the new service worker takes control of the page immediately.
  event.waitUntil(self.clients.claim());
});
