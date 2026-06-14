// Service Worker — siempre sirve HTML/JS/CSS fresco de la red (network-first)
// Bump CACHE para forzar reemplazo de service workers viejos.
const CACHE = 'polla2026-v2';

// Instalar de inmediato sin esperar a que se cierren las pestañas viejas
self.addEventListener('install', () => self.skipWaiting());

// Tomar control de las pestañas abiertas apenas se activa, y limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Solo gestionamos navegaciones (la propia página). Todo lo demás pasa directo.
  if (req.mode !== 'navigate') return;
  e.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(r => {
        const clone = r.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return r;
      })
      .catch(() => caches.match(req))
  );
});
