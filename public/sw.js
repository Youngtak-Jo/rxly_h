// Self-unregistering service worker
// This replaces the old caching SW to clean up existing installations
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    ).then(() => self.registration.unregister())
  );
});
