/* Network first, so a saved copy does not hide a correction (Aleksej, 9 Nov 2026).
   GitHub Pages also caches a file for 600 seconds (seen 9 Nov 2026). The fresh
   query asks for a new copy. CACHE is the shell hash from tests/test_page_shell.py.
   A changed page file changes this name, so the installed icon drops the old shell. */
var CACHE = 'kindeals-311f4ca72953';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () { return self.clients.claim(); }));
});

function stable(url) {
  var u = new URL(url);
  u.searchParams.delete('fresh');
  return u.toString();
}

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (/\/fonts\/[^/]+\.woff2$/.test(new URL(event.request.url).pathname)) {
    event.respondWith(savedFirst(event.request));
    return;
  }
  event.respondWith(networkFirst(event.request));
});

/* A font file never carries a correction, so the saved copy is used first (74 KB not fetched on every open). */
function savedFirst(req) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(req.url).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok) cache.put(req.url, res.clone());
        return res;
      });
    });
  });
}

function networkFirst(req) {
  var key = stable(req.url);
  var sep = key.indexOf('?') >= 0 ? '&' : '?';
  return fetch(key + sep + 'fresh=' + Date.now(), {cache: 'no-store'}).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      return caches.open(CACHE).then(function (cache) {
        return cache.put(key, copy);
      }).then(function () { return res; });
    }
    return res; /* a 404 is the answer; do not show an older batch instead */
  }).catch(function () {
    return caches.open(CACHE).then(function (cache) { return cache.match(key); }).then(function (hit) {
      if (hit) return hit;
      return new Response('', {status: 503});
    });
  });
}
