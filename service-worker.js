const CACHE_NAME = "rage-training-v2.4.46";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./rage-logo.png",
  "./styles.css?v=2.3.0",
  "./modern-v2.4.css?v=2.4.1",
  "./responsive-v2.4.2.css?v=2.4.5",
  "./ajustes-v2.4.7.css?v=2.4.8",
  "./clientes-seguimiento-v2.4.9.css?v=2.4.9",
  "./cliente-detalle-v2.4.10.css?v=2.4.10",
  "./mediciones-extra-v2.4.11.css?v=2.4.11",
  "./clientes-mobile-v2.4.12.css?v=2.4.12",
  "./pagos-mobile-v2.4.14.css?v=2.4.14",
  "./modal-fix-v2.4.15.css?v=2.4.15",
  "./agenda-integrada-v2.4.16.css?v=2.4.16",
  "./agenda-mobile-v2.4.17.css?v=2.4.18",
  "./cliente-sesion-v2.4.19.css?v=2.4.19",
  "./alta-mobile-v2.4.20.css?v=2.4.20",
  "./splash-v2.4.25.css?v=2.4.28",
  "./facturas-v2.4.29.css?v=2.4.31",
  "./cliente-gestion-v2.4.39.css?v=2.4.39",
  "./mesociclo-ejercicios-v2.4.40.css?v=2.4.40",
  "./mesociclo-plan-editor-v2.4.43.css?v=2.4.43",
  "./calendar-zoom-v2.4.44.css?v=2.4.44",
  "./operativa-v2.4.46.css?v=2.4.46",
  "./app.js?v=2.4.4",
  "./ajustes-v2.4.7.js?v=2.4.8",
  "./clientes-seguimiento-v2.4.9.js?v=2.4.9",
  "./cliente-detalle-v2.4.10.js?v=2.4.10",
  "./mediciones-extra-v2.4.11.js?v=2.4.11",
  "./agenda-integrada-v2.4.16.js?v=2.4.16",
  "./cliente-sesion-v2.4.19.js?v=2.4.22",
  "./alta-integrada-v2.4.23.js?v=2.4.24",
  "./navegacion-v2.4.24.js?v=2.4.24",
  "./splash-v2.4.25.js?v=2.4.28",
  "./facturas-v2.4.29.js?v=2.4.31",
  "./facturas-print-v2.4.32.js?v=2.4.33",
  "./facturas-pdf-v2.4.33.js?v=2.4.35",
  "./fixes-v2.4.36.js?v=2.4.38",
  "./cliente-gestion-v2.4.39.js?v=2.4.39",
  "./mesociclo-ejercicios-v2.4.40.js?v=2.4.40",
  "./tablet-android-v2.4.41.js?v=2.4.43",
  "./mesociclo-plan-editor-v2.4.43.js?v=2.4.43",
  "./calendar-zoom-v2.4.44.js?v=2.4.45",
  "./operativa-v2.4.46.js?v=2.4.46"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  let networkRequest = request;
  if (url.pathname.endsWith("/calendar-zoom-v2.4.44.js")) {
    const freshUrl = new URL(request.url);
    freshUrl.searchParams.set("v", "2.4.45");
    networkRequest = new Request(freshUrl.toString(), request);
  }

  event.respondWith(
    fetch(networkRequest, { cache: "no-store" })
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") return caches.match("./index.html");
        return Response.error();
      })
  );
});