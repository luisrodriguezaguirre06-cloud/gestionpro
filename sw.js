const CACHE_NAME = 'gestionpro-v1.0.0';
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Instalación: pre-cachea recursos esenciales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activación: elimina cachés antiguos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first para assets, network-first para API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Siempre va a red para llamadas a API de IA
  if (url.hostname === 'api.anthropic.com') {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first para todo lo demás
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Solo cachea respuestas válidas
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, resClone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});