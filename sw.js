// Service Worker — siempre sirve HTML fresco de la red
const CACHE = 'polla2026-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  // Para navegación (carga de página): red primero, caché como fallback offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' })
        .then(r => {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
