// bump version string to bust cache on new deployments
const CACHE_VERSION = "v5";
const CACHE_NAME = `flightcore-${CACHE_VERSION}`;
const FONT_CACHE = `flightcore-fonts-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./core.js",
  "./app.js",
  "./styles.css",
  "./manifest.json",
  "./config.example.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== FONT_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  if (url.pathname.endsWith("/config.js") || url.pathname.includes("/api/") || url.hostname.includes("supabase.co") || url.hostname.includes("stripe.com") || url.hostname.includes("plausible.io") || url.hostname.includes("posthog.")) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Stale-while-revalidate for Google Fonts (serves cached font instantly, updates in background)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          const networkFetch = fetch(e.request).then((response) => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          });
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  // Cache-first for all other local assets
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
