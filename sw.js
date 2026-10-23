const CACHE_NAME = 'emm-mondial-v23-' + Date.now();
const URLS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './manifest.json',
  './logo.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// STRATÉGIE CACHE-FIRST (ULTRA RAPIDE)
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Si c'est dans le cache, on l'affiche IMMÉDIATEMENT (sans internet)
      if (cached) {
        return cached;
      }
      // Sinon, on va sur internet
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200 && event.request.method === 'GET') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      });
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});
