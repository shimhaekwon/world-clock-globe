// World Clock Climate - Service Worker
// Cache same-origin static assets so the app loads fast on revisit and works offline.
// External APIs (Nominatim, Open-Meteo, CDN globe.gl, raw.githubusercontent.com) pass through —
// they need fresh data and shouldn't be served from a stale cache.

const CACHE = 'wcc-v1';
const CORE = [
    './',
    './index.html',
    './app.js',
    './api.js',
    './style.css',
    './manifest.json',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './img/earth-8k-daymap.jpg',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then(cache =>
            // Settle individually so one failure (e.g. icon variant missing) doesn't abort install
            Promise.all(CORE.map(u => cache.add(u).catch(() => {})))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);
    if (url.origin !== self.location.origin) return; // let cross-origin pass through

    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
            // Cache same-origin successful GETs lazily so future-added assets get picked up
            if (e.request.method === 'GET' && res.ok) {
                const clone = res.clone();
                caches.open(CACHE).then(c => c.put(e.request, clone));
            }
            return res;
        }))
    );
});
