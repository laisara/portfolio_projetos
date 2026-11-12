// Service worker — app shell offline + cache dos últimos dados (local-first).
const VERSION = "ast-v3.0.0";
const SHELL = [
  "/", "/index.html", "/css/app.css", "/manifest.webmanifest",
  "/js/app.js", "/js/core.js", "/js/focus.js",
  "/js/views/dashboard.js", "/js/views/calendar.js", "/js/views/catalog.js", "/js/views/course.js",
  "/js/views/skills.js", "/js/views/achievements.js",
  "/js/views/sessions.js", "/js/views/plan.js", "/js/views/settings.js", "/js/views/reviews.js", "/js/views/projects.js", "/js/views/lab.js",
  "/icons/sprite.svg", "/icons/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png", "/icons/apple-touch-icon.png",
  "/fonts/inter-latin-400-normal.woff2", "/fonts/inter-latin-500-normal.woff2",
  "/fonts/inter-latin-600-normal.woff2", "/fonts/inter-latin-700-normal.woff2",
  "/fonts/jetbrains-mono-latin-400-normal.woff2", "/fonts/jetbrains-mono-latin-500-normal.woff2",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    // rede primeiro; offline → última resposta salva
    e.respondWith(fetch(e.request).then((res) => {
      if (res.ok && !url.pathname.startsWith("/api/backup") && !url.pathname.startsWith("/api/export")) {
        const copy = res.clone(); caches.open(VERSION + "-api").then((c) => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || new Response(JSON.stringify({ detail: "Servidor local indisponível (offline)." }), { status: 503, headers: { "Content-Type": "application/json", "X-Offline": "1" } }))));
    return;
  }
  // app shell: cache primeiro, atualiza em segundo plano
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((cached) => {
    const net = fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => cached || caches.match("/index.html"));
    return cached || net;
  }));
});
