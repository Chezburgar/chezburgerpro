/*global UVServiceWorker, __uv$config*/
// Ultraviolet service worker. Registered with a scope of <base>/uv/service/,
// so it only ever intercepts proxied traffic — the rest of ChezburgerPRO is
// untouched by it.
importScripts('uv.bundle.js');
importScripts('uv.config.js');
importScripts(__uv$config.sw || 'uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      if (uv.route(event)) return await uv.fetch(event);
      return await fetch(event.request);
    })(),
  );
});
