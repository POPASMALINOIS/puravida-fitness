const CACHE_NAME = "rage-training-v2.4.10";
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
  "./app.js?v=2.4.4",
  "./ajustes-v2.4.7.js?v=2.4.8",
  "./clientes-seguimiento-v2.4.9.js?v=2.4.9",
  "./cliente-detalle-v2.4.10.js?v=2.4.10"
];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;event.respondWith(fetch(request,{cache:"no-store"}).then(response=>{if(response&&response.status===200){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;}).catch(async()=>{const cached=await caches.match(request);if(cached)return cached;if(request.mode==="navigate")return caches.match("./index.html");return Response.error();}));});