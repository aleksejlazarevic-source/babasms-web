'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');

const api = require(path.join(__dirname, '../site/deals.js'));
const { runDealsStart, storesOnScreen, byOrder, press } = require('./helpers/deals-page-harness');

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

/* The probe answers 200 for every brief, so each live store is openable.
   One live store opens that store (page/deals.js: one store on the screen).
   Two or more live stores draw the list. Both paths still have to show every
   KNOWN store once the list is the screen. */
function liveOf(known) {
  return (known || []).filter((s) => s && s.live === true);
}

function assertListScreen(screen, page) {
  const { list, back, store } = screen;
  assert.equal(list.hidden, false);
  assert.equal(back.hidden, true);
  assert.equal(store.hidden, false);
  assert.equal(store.textContent, 'Trgovine');
  const stores = storesOnScreen(list, page.KNOWN);
  assert.ok(stores.length >= 3);
  for (const row of stores) {
    assert.ok(row.name);
    const spec = page.tileOf(row);
    assert.ok(spec.tag === 'button' || spec.tag === 'div');
    assert.ok(spec.className);
  }
  assert.deepEqual(stores.map((s) => s.id), byOrder(api.KNOWN).map((s) => s.id));
}

function assertOneStoreThenList(screen, page) {
  const live = liveOf(page.KNOWN);
  assert.equal(live.length, 1);
  assert.equal(screen.list.hidden, true);
  assert.equal(screen.list.children.length, 0);
  assert.equal(screen.back.hidden, false);
  assert.equal(screen.store.hidden, false);
  assert.equal(screen.store.textContent, live[0].name);
  assert.equal(screen.text.hidden, false);
  press(screen.back);
  assertListScreen(screen, page);
}

async function assertFallback(fetcher) {
  const screen = await runDealsStart({ fetch: fetcher });
  const { api: page } = screen;
  const live = liveOf(page.KNOWN);
  assert.ok(live.length >= 1);
  if (live.length === 1) assertOneStoreThenList(screen, page);
  else assertListScreen(screen, page);
}

test('failed t2/stores.json fetch falls back to KNOWN and still builds a store list', async () => {
  const fetcher = probeOkFetcher(() => Promise.reject(new Error('network')));
  await assertFallback(fetcher);
});

test('stores.json HTTP error does not yield an empty list', async () => {
  const fetcher = probeOkFetcher(() =>
    Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve([]) })
  );
  await assertFallback(fetcher);
});

test('offline batch load maps to a message view, not a blank screen', () => {
  const view = api.viewOf({ kind: 'offline' }, '2026-11-12');
  assert.equal(view.type, 'message');
  assert.equal(view.title, api.OFFLINE);
  assert.ok(view.body);
});
