'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SITE = path.join(__dirname, '..', '..', 'site');
const BASE = 'https://kindeals.example/';

function cacheKey(req) {
  const raw = typeof req === 'string' ? req : req.url;
  const u = new URL(raw, BASE);
  u.searchParams.delete('fresh');
  return u.toString();
}

function siteFileFor(url) {
  const rel = new URL(typeof url === 'string' ? url : url, BASE).pathname.replace(/^\//, '');
  const file = path.resolve(SITE, rel);
  if (!file.startsWith(SITE + path.sep) && file !== SITE) return null;
  return fs.existsSync(file) ? file : null;
}

/** Run site/sw.js in a minimal service-worker sandbox for fetch-handler tests. */
function loadServiceWorker(swPath) {
  const listeners = {};
  let fetchImpl = () => Promise.reject(new Error('fetch not set'));

  const self = {
    addEventListener(type, fn) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(fn);
    },
    skipWaiting() {},
    clients: { claim: () => Promise.resolve() },
  };

  const cacheData = new Map();

  const caches = {
    keys() {
      return Promise.resolve([...cacheData.keys()]);
    },
    delete(name) {
      cacheData.delete(name);
      return Promise.resolve(true);
    },
    open(name) {
      if (!cacheData.has(name)) cacheData.set(name, new Map());
      const store = cacheData.get(name);
      const cache = {
        match(req) {
          const hit = store.get(cacheKey(req));
          if (!hit) return Promise.resolve(undefined);
          return Promise.resolve(new Response(hit.body, { status: hit.status }));
        },
        put(url, res) {
          return res.clone().text().then((body) => {
            store.set(cacheKey(url), { body, status: res.status });
          });
        },
        addAll(urls) {
          return Promise.all(urls.map((url) => {
            const file = siteFileFor(url);
            if (file) {
              store.set(cacheKey(url), { body: fs.readFileSync(file), status: 200 });
              return null;
            }
            return Promise.resolve(fetchImpl(url)).then((res) => {
              if (!res || !res.ok) throw new TypeError('Failed to fetch ' + url);
              return cache.put(url, res);
            });
          }));
        },
      };
      return Promise.resolve(cache);
    },
  };

  const context = {
    self,
    caches,
    fetch: (...args) => fetchImpl(...args),
    URL,
    Response,
    Promise,
    Date,
    console,
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(swPath, 'utf8'), context);

  const cacheName = fs.readFileSync(swPath, 'utf8').match(/var CACHE = '([^']+)'/)[1];

  async function waitFor(fn) {
    await new Promise((resolve, reject) => {
      let pending = Promise.resolve();
      fn({
        waitUntil(p) {
          pending = Promise.resolve(p);
        },
      });
      Promise.resolve(pending).then(resolve, reject);
    });
  }

  async function runLifecycle() {
    for (const fn of listeners.install || []) await waitFor(fn);
    for (const fn of listeners.activate || []) await waitFor(fn);
  }

  function respondFor(request) {
    const handlers = listeners.fetch || [];
    let pending;
    const event = {
      request,
      respondWith(p) {
        pending = Promise.resolve(p);
      },
    };
    for (const fn of handlers) fn(event);
    if (!pending) throw new Error('fetch handler did not call respondWith');
    return pending;
  }

  return {
    cacheName,
    runLifecycle,
    respondFor,
    setFetch(fn) {
      fetchImpl = fn;
    },
  };
}

module.exports = { loadServiceWorker };
