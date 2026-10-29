// Opens instantly from the saved copy, then quietly fetches any update for next time.
const CACHE = "brain-dump-v3";
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  // cache: "reload" skips the browser's HTTP cache so a new version never installs old files
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  const network = fetch(req)
    .then(async (res) => {
      if (res && res.ok) {
        const copy = res.clone();
        const cache = await caches.open(CACHE);
        await cache.put(req, copy);
      }
      return res;
    })
    .catch(() => null);

  e.waitUntil(network);
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) =>
      cached ||
      network.then((res) => res || caches.match("index.html")).then((res) => res || Response.error())
    )
  );
});
