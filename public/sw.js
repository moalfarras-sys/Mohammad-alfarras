self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("mf-app-v1").then((cache) =>
      cache.addAll(["/ar", "/en", "/ar/contact", "/en/contact", "/offline.html"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open("mf-app-v1");
      return (await cache.match("/offline.html")) ?? Response.error();
    }),
  );
});
