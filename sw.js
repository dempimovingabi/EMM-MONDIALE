// ============================================
// SERVICE WORKER — EMM MONDIAL v18
// ============================================

const CACHE_NAME = 'emm-mondial-v18';
const CACHE_RUNTIME = 'emm-mondial-runtime-v18';

const URLS_PRECACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(
        URLS_PRECACHE.map(function(url) {
          return cache.add(url).catch(function(e) { console.warn('Pré-cache KO:', url, e); });
        })
      );
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME && k !== CACHE_RUNTIME; })
            .map(function(k) { console.log('Suppr cache:', k); return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;
  var url = event.request.url;
  if (url.indexOf('http') === 0 && url.indexOf(self.location.origin) !== 0) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        fetch(event.request).then(function(response) {
          if (response && response.status === 200) {
            caches.open(CACHE_RUNTIME).then(function(cache) { cache.put(event.request, response.clone()); });
          }
        }).catch(function() {});
        return cached;
      }
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        var clone = response.clone();
        caches.open(CACHE_RUNTIME).then(function(cache) { cache.put(event.request, clone); });
        return response;
      }).catch(function() {
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 503, statusText: 'Hors ligne' });
      });
    })
  );
});

self.addEventListener('message', function(event) {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
