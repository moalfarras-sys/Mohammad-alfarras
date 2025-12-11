const CACHE_NAME = "moalfarras-cache-v3";
const OFFLINE_URLS = [
  "/",
  "/index.html",
  "/cv.html",
  "/blog.html",
  "/youtube.html",
  "/contact.html",
  "/privacy.html",
  "/en/index.html",
  "/en/cv.html",
  "/en/blog.html",
  "/en/youtube.html",
  "/en/contact.html",
  "/en/privacy.html",
  "/assets/css/style.css",
  "/assets/js/main.js",
  "/assets/js/youtube-local.js",
  "/data/videos.json",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(() => {
        // fallback: offline home for navigation requests
        if (req.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
