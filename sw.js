/* Dinduy service worker: aplikasi tetap jalan tanpa internet */
const V = 'dinduy-v1';
const FONT = 'dinduy-font-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V && k !== FONT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* tampilkan dari cache dulu, perbarui diam-diam di belakang layar */
function swr(req, name, fallback) {
  return caches.open(name).then(c =>
    c.match(req, { ignoreSearch: false }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
        return res;
      }).catch(() => null);
      return hit || net.then(r => r || (fallback ? c.match(fallback) : Response.error()));
    })
  );
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(swr(r, FONT));
    return;
  }
  if (u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    e.respondWith(caches.open(V).then(c => c.match('index.html').then(hit => {
      const net = fetch(r).then(res => { if (res.ok) c.put('index.html', res.clone()); return res; }).catch(() => null);
      return hit || net.then(x => x || Response.error());
    })));
    return;
  }
  e.respondWith(swr(r, V));
});
