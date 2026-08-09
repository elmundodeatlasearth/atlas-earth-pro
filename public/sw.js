// Service Worker — Atlas Earth PRO v2
// Offline caching de assets estáticos (GitHub Pages subpath /atlas-earth-pro)
// IMPORTANTE: con basePath, el SW debe registrarse con la ruta y scope correctos:
//   navigator.serviceWorker.register('/atlas-earth-pro/sw.js', { scope: '/atlas-earth-pro/' })

var CACHE_NAME = "atlas-pro-v2";
var BASE = "/atlas-earth-pro";
var STATIC_ASSETS = [
  BASE + "/",
  BASE + "/manifest.json",
  BASE + "/icons/icon-192.svg",
  BASE + "/icons/icon-512.svg",
];

// Install
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS).catch(function() {
        // No fallar si algún asset aún no existe
        console.warn("[SW] Algunos assets no se pudieron precachear");
      });
    })
  );
});

// Activate
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
});

// Fetch: network first, cache fallback
self.addEventListener("fetch", function(event) {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;

  // Solo manejar peticiones dentro de nuestro scope (no interferir con Supabase)
  var url = new URL(event.request.url);
  if (!url.pathname.startsWith(BASE)) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        if (response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cached) {
          if (cached) return cached;
          // Fallback a la página principal para navegaciones offline
          if (event.request.mode === "navigate") {
            return caches.match(BASE + "/");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
