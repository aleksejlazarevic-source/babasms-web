/* Network first, so a saved copy does not hide a correction (Aleksej, 9 Nov 2026).
   GitHub Pages also caches a file for 600 seconds (seen 9 Nov 2026). The fresh
   query asks for a new copy. One cache name is a guess. */
var CACHE = 'kindeals-page';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

function stable(url) {
  var u = new URL(url);
  u.searchParams.delete('fresh');
  return u.toString();
}

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(networkFirst(event.request));
});

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
