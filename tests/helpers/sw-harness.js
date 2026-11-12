'use strict';

const fs = require('node:fs');
const vm = require('node:vm');

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
      return Promise.resolve({
        match(req) {
          const raw = typeof req === 'string' ? req : req.url;
          const u = new URL(raw);
          u.searchParams.delete('fresh');
          const key = u.toString();
          const hit = store.get(key);
          if (!hit) return Promise.resolve(undefined);
          return Promise.resolve(new Response(hit.body, { status: hit.status }));
        },
        put(url, res) {
          return res.clone().text().then((body) => {
            const u = new URL(url);
            u.searchParams.delete('fresh');
            store.set(u.toString(), { body, status: res.status });
          });
        },
      });
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

  async function runLifecycle() {
    for (const fn of listeners.install || []) {
      fn({ waitUntil: (p) => p });
    }
    for (const fn of listeners.activate || []) {
      await new Promise((resolve) => {
        fn({ waitUntil: (p) => Promise.resolve(p).then(() => resolve()) });
      });
    }
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
