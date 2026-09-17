/* Service worker Charbon — écrit à la main, chemins RELATIFS au scope
 * (fonctionne à la racine en dev et sous /app/ en production).
 * Stratégies :
 * - navigation  : réseau d'abord, repli sur le shell en cache (mode hors-ligne) ;
 * - /api/*      : jamais mis en cache (données toujours fraîches) ;
 * - assets      : cache d'abord + revalidation en arrière-plan.
 */
const CACHE = 'charbon-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // pas de cache cross-origin
  if (url.pathname.includes('/api/')) return; // API : réseau uniquement

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match('./index.html')
          .then((cached) => cached ?? Response.error()),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached ?? network;
    }),
  );
});
