const VERSION = 'san-castrese-v5.9.7';
const CORE = `${VERSION}-core`;
const RUNTIME = `${VERSION}-runtime`;

const CORE_FILES = [
  './',
  './index.html',
  './sede.html',
  './patrimonio.html',
  './attivita.html',
  './storia.html',
  './archivio.html',
  './partecipa.html',
  './natale.html',
  './pasqua.html',
  './urna-2025.html',
  './offline.html',
  './styles.css',
  './script-597.js',
  './manifest.webmanifest',
  './assets/logo-san-castrese-3d.png',
  './assets/app-icon-192.png',
  './assets/app-icon-512.png',
  './assets/app-icon-maskable-512.png',
  './assets/apple-touch-icon-180.png',
  './assets/pattern-san-castrese.svg',
  './assets/sfondo-san-castrese.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CORE)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => ![CORE, RUNTIME].includes(key)).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Navigazione: prova sempre la rete, poi usa cache/offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(RUNTIME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, {ignoreSearch: true});
          return cached || caches.match('./offline.html');
        })
    );
    return;
  }

  // Asset locali: cache-first, poi aggiorna la cache.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request, {ignoreSearch: true}).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME).then(cache => cache.put(request, copy));
          }
          return response;
        });
      })
    );
  }
});
