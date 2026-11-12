'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const api = require(path.join(__dirname, '../site/deals.js'));
const { runDealsStart, storesOnScreen, byOrder } = require('./helpers/deals-page-harness');

function probeOkFetcher(storesJsonImpl) {
  return (url) => {
    const u = String(url);
    if (u.includes('stores.json')) return storesJsonImpl(url);
    if (u.includes('brief-sl.txt')) {
      return Promise.resolve({ status: 200, ok: true, text: () => Promise.resolve('') });
    }
    return Promise.reject(new Error('offline'));
  };
}

test('failed t2/stores.json fetch falls back to KNOWN and still builds a store list', async () => {
  const fetcher = probeOkFetcher(() => Promise.reject(new Error('network')));
  const { api: page, list } = await runDealsStart({ fetch: fetcher });
  const stores = storesOnScreen(list, page.KNOWN);
  assert.ok(stores.length >= 3);
  for (const store of stores) {
    assert.ok(store.name);
    const spec = page.tileOf(store);
    assert.ok(spec.tag === 'button' || spec.tag === 'div');
    assert.ok(spec.className);
  }
});

test('stores.json HTTP error does not yield an empty list', async () => {
  const fetcher = probeOkFetcher(() =>
    Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve([]) })
  );
  const { api: page, list } = await runDealsStart({ fetch: fetcher });
  const stores = storesOnScreen(list, page.KNOWN);
  assert.deepEqual(stores.map((s) => s.id), byOrder(api.KNOWN).map((s) => s.id));
});

test('offline batch load maps to a message view, not a blank screen', () => {
  const view = api.viewOf({ kind: 'offline' }, '2026-11-12');
  assert.equal(view.type, 'message');
  assert.equal(view.title, api.OFFLINE);
  assert.ok(view.body);
});
