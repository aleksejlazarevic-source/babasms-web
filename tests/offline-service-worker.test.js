'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { loadServiceWorker } = require('./helpers/sw-harness');

const SW = path.join(__dirname, '../site/sw.js');
const SHELL = fs.readFileSync(path.join(__dirname, '../site/deals.html'), 'utf8');

const PAGE_URL = 'https://kindeals.example/deals.html';

test('after a first online visit, offline fetch serves cached deals shell from the service worker', async () => {
  const sw = loadServiceWorker(SW);
  await sw.runLifecycle();

  let visits = 0;
  sw.setFetch((url) => {
    visits += 1;
    const u = String(url);
    if (u.indexOf('deals.html') >= 0) {
      return Promise.resolve(new Response(SHELL, { status: 200 }));
    }
    return Promise.reject(new Error('offline'));
  });

  const req = { method: 'GET', url: PAGE_URL };
  const online = await sw.respondFor(req);
  assert.equal(online.status, 200);
  assert.match(await online.text(), /KinDeals/);

  sw.setFetch(() => Promise.reject(new Error('offline')));
  const offline = await sw.respondFor(req);
  assert.equal(offline.status, 200);
  assert.match(await offline.text(), /id="text"/);
  assert.equal(visits, 1, 'second load must not hit the network');
});

test.todo(
  'first visit while offline returns an empty 503 from the service worker instead of a usable shell'
);

test('woff2 font requests prefer cache first (offline font still loads)', async () => {
  const sw = loadServiceWorker(SW);
  await sw.runLifecycle();
  const fontUrl = 'https://kindeals.example/fonts/lexend-latin-wght-normal.woff2';
  let visits = 0;
  sw.setFetch(() => {
    visits += 1;
    return Promise.reject(new Error('offline'));
  });
  const offline = await sw.respondFor({ method: 'GET', url: fontUrl });
  assert.equal(offline.status, 200);
  const body = Buffer.from(await offline.arrayBuffer());
  assert.ok(body.length > 0, 'precached font must not be empty');
  assert.equal(visits, 0, 'precached font must not hit the network');
});
