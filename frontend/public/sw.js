// FLOVA Service Worker (Cloud-Connected Only — No Offline Mutating or Queuing Claims)
const CACHE_NAME = "flova-shell-v4";
const SHARED_CACHE_NAME = "flova-shared-cache";
const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/favicon.svg",
  "/favicon-48x48.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/manifest.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME && key !== SHARED_CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle PWA Web Share Target POST requests
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get("media");
        const text = formData.get("text") || formData.get("url") || formData.get("title") || "";
        const cache = await caches.open(SHARED_CACHE_NAME);

        if (file && typeof file === "object" && "size" in file && file.size > 0) {
          const headers = new Headers();
          headers.set("Content-Type", file.type || "image/jpeg");
          headers.set("X-File-Name", file.name || "shared-image.jpg");
          await cache.put("/shared-file", new Response(file, { headers }));
        }

        if (text && typeof text === "string" && text.trim().length > 0) {
          await cache.put(
            "/shared-text",
            new Response(JSON.stringify({ text: text.trim() }), {
              headers: { "Content-Type": "application/json" },
            })
          );
        }
      } catch (err) {
        console.error("Failed to process share target in service worker:", err);
      }
      return Response.redirect("/catch?shared=1", 303);
    })());
    return;
  }

  // Strictly skip caching for all API, Auth, and Supabase database requests
  if (
    event.request.method !== "GET" ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("supabase")
  ) {
    return;
  }

  // Network-first strategy for app navigation & assets with fallback to shell cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
