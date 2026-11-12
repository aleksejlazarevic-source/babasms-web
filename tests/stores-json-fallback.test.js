'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const api = require(path.join(__dirname, '../site/deals.js'));

/* Same as deals.js start() — not exported on the page API. */
function byOrder(list) {
  return (list || [])
    .filter((s) => s && s.id && s.name)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function fresh(url) {
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'fresh=1';
}

/* Mirrors site/deals.js start() stores fetch + probeStore when the network is down. */
async function bootstrapStores(fetcher) {
  const storesUrl = 't2/stores.json';
  const list = await fetcher(fresh(storesUrl), { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error('stores');
      return res.json();
    })
    .then((rows) => {
      if (!byOrder(rows).length) throw new Error('stores');
      return rows;
    })
    .catch(() => api.KNOWN);

  const stores = byOrder(list);
  await Promise.all(
    stores.map((store) => {
      const day = api.isoOf(api.validSendDay(api.ljubljanaToday(new Date()), store));
      const url = api.fileUrl(store, day);
      return fetcher(fresh(url), { cache: 'no-store' })
        .then((res) => {
          store.readable = res.status === 200;
        })
        .catch(() => {
          store.readable = store.id === 'lidl';
        });
    })
  );
  return stores;
}

test('failed t2/stores.json fetch falls back to KNOWN and still builds a store list', async () => {
  const fetcher = () => Promise.reject(new Error('network'));
  const stores = await bootstrapStores(fetcher);
  assert.ok(stores.length >= 3);
  for (const store of stores) {
    assert.ok(store.name);
    const spec = api.tileOf(store);
    assert.ok(spec.tag === 'button' || spec.tag === 'div');
    assert.ok(spec.className);
  }
});

test('stores.json HTTP error does not yield an empty list', async () => {
  const fetcher = (url) => {
    if (String(url).includes('stores.json')) {
      return Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve([]) });
    }
    return Promise.reject(new Error('offline'));
  };
  const stores = await bootstrapStores(fetcher);
  assert.deepEqual(stores.map((s) => s.id), byOrder(api.KNOWN).map((s) => s.id));
});

test('offline batch load maps to a message view, not a blank screen', () => {
  const view = api.viewOf({ kind: 'offline' }, '2026-11-12');
  assert.equal(view.type, 'message');
  assert.equal(view.title, api.OFFLINE);
  assert.ok(view.body);
});
