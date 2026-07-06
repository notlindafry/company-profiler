// Minimal service worker. Its purpose is to make the site installable as a real
// app (a WebAPK) on Android Chrome — that upgrade is what lets the home-screen
// icon use the maskable icon edge-to-edge, instead of Chrome drawing a plain
// bookmark shortcut (an icon inset on a white circle).
//
// It intentionally does NOT cache anything: the research API streams responses
// and the app is auth-gated, so caching would risk serving stale or wrong data.
// Only top-level navigations are handled, and they go straight to the network;
// every other request (API, auth, assets) is left untouched. The mere presence
// of a fetch handler that responds is what satisfies the installability check.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
  }
});
