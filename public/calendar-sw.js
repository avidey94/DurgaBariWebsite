/* Only a neutral offline page is stored. Authenticated pages and API data always use the network. */
const CALENDAR_CACHE = "durga-bari-calendar-shell-v1";
const OFFLINE_PAGE = "/calendar-offline.html";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CALENDAR_CACHE).then((cache) => cache.add(OFFLINE_PAGE)));
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("durga-bari-calendar-shell-") && key !== CALENDAR_CACHE).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode !== "navigate" || url.origin !== self.location.origin || (url.pathname !== "/calendar" && !url.pathname.startsWith("/calendar/"))) return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(OFFLINE_PAGE)) || Response.error()));
});
