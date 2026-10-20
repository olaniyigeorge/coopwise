/* CoopWise service worker
 * Hand-written so it works with Next.js 16 / Turbopack (next-pwa's
 * webpack plugin does not run there). Strategies:
 *
 *   navigations      network-first, offline page fallback
 *   /_next/static    cache-first (content-hashed, immutable)
 *   images/fonts     stale-while-revalidate
 *   /api/*           never cached — money data must stay live
 */

const VERSION = "coopwise-v1";
const STATIC_CACHE = `${VERSION}-static`;
const MEDIA_CACHE = `${VERSION}-media`;
const FONT_CACHE = `${VERSION}-fonts`;

const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/",
  "/manifest.json",
  "/images/coopwise-logo.svg",
  "/icons/coopwise-logo-192x192.png",
  "/icons/coopwise-logo-512x512.png",
];

const MEDIA_LIMIT = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Add individually so one missing file can't fail the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => undefined)
        )
      );
      // Activation is deferred until the page asks for it (SKIP_WAITING), so
      // an open tab never swaps chunks underneath itself.
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => !key.startsWith(VERSION)).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheable(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  return true;
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/assets/icons/")
  );
}

function isMedia(url) {
  return (
    /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith("/_next/image")
  );
}

function isFont(url) {
  return (
    /\.(?:woff2?|ttf|otf)$/i.test(url.pathname) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
  );
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === "opaque")) {
        cache.put(request, response.clone());
        if (cacheName === MEDIA_CACHE) {
          trimCache(MEDIA_CACHE, MEDIA_LIMIT);
        }
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await network) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    // Keep a copy of the public shell only. Authenticated dashboards are
    // deliberately never stored on the device.
    const url = new URL(request.url);
    if (response.ok && (url.pathname === "/" || url.pathname === OFFLINE_URL)) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const cachedPage = await cache.match(request);
    if (cachedPage) return cachedPage;

    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;

    return new Response(
      "<!doctype html><meta name=\"viewport\" content=\"width=device-width\"><title>Offline</title><body style=\"font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#F7F4EC;color:#0B1712\"><div style=\"text-align:center\"><h1 style=\"font-size:1.25rem\">You're offline</h1><p style=\"color:#585858\">Reconnect and try again.</p></div></body>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (!isCacheable(request)) return;

  const url = new URL(request.url);

  // Money and identity data: always live, never cached by the SW.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin !== self.location.origin && !isFont(url)) return;

  if (isStaticAsset(url) && url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isFont(url)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  if (isMedia(url)) {
    event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE));
    return;
  }

  // Other same-origin GETs: network-first with a cache fallback.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(STATIC_CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        return cached || Response.error();
      }
    })()
  );
});
