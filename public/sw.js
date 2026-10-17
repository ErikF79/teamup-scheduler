/* TeamUp Scheduler — Service Worker
 * Strategia:
 *  - App shell / navigazioni: network-first con fallback alla cache (offline).
 *  - Asset statici (_next/static, icone): cache-first.
 *  - Altre GET same-origin: stale-while-revalidate.
 *
 * Il percorso base (es. "/teamup-scheduler/" su GitHub Pages, oppure "/" in
 * locale) viene ricavato dalla posizione dello stesso service worker, così il
 * file funziona sia alla radice sia in un sotto-percorso senza modifiche.
 */

const BASE = new URL("./", self.location).pathname;
const CACHE_NAME = "teamup-cache-v1";

const APP_SHELL = [
  BASE,
  BASE + "login/",
  BASE + "scheduler/",
  BASE + "admin/",
  BASE + "dashboard/",
  BASE + "print/",
  BASE + "manifest.webmanifest",
  BASE + "icons/icon-192.png",
  BASE + "icons/icon-512.png",
  BASE + "icons/maskable-512.png",
  BASE + "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          APP_SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith(BASE + "_next/static") ||
    url.pathname.startsWith(BASE + "icons/") ||
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|css|js)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigazioni: network-first, fallback offline alla cache / app shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return (
            cached ||
            (await caches.match(BASE + "scheduler/")) ||
            (await caches.match(BASE + "scheduler")) ||
            (await caches.match(BASE))
          );
        })
    );
    return;
  }

  // Asset statici: cache-first.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
    return;
  }

  // Resto: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
