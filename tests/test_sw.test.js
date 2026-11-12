'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const { SITE, localAssetRefs, siteFileExists } = require('./helpers/site-paths');

const SW_PATH = path.join(SITE, 'sw.js');
const INDEX_PATH = path.join(SITE, 'index.html');

function readSw() {
  return fs.readFileSync(SW_PATH, 'utf8');
}

function parseCacheName(source) {
  const m = source.match(/var\s+CACHE\s*=\s*['"]([^'"]+)['"]/);
  return m ? m[1] : null;
}

/** Quoted site paths inside cache.addAll([...]) if present. */
function extractInstallPrecachePaths(source) {
  const paths = [];
  const addAll = /(?:cache\.addAll|addAll)\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
  let block;
  while ((block = addAll.exec(source)) !== null) {
    const inner = block[1];
    const strRe = /['"]([^'"]+)['"]/g;
    let s;
    while ((s = strRe.exec(inner)) !== null) paths.push(s[1]);
  }
  return paths;
}

/** Paths the install page pulls in; offline shell when no explicit precache list. */
function shellPathsFromIndex() {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const fromHtml = localAssetRefs(html);
  return [...new Set(['index.html', 'sw.js', ...fromHtml])];
}

function normalizeSitePath(p) {
  return p.replace(/^\//, '').split('?')[0];
}

test('site/sw.js: CACHE name is present', () => {
  const name = parseCacheName(readSw());
  assert.ok(name && name.length > 0, 'sw.js must define var CACHE');
  assert.match(name, /^kindeals-/, 'CACHE name should use the kindeals- prefix');
});

test('site/sw.js: precached / shell paths exist under site/', () => {
  const source = readSw();
  let paths = extractInstallPrecachePaths(source).map(normalizeSitePath);
  if (paths.length === 0) paths = shellPathsFromIndex().map(normalizeSitePath);
  const missing = paths.filter((p) => !siteFileExists(p));
  assert.deepEqual(
    missing,
    [],
    `missing site file(s) for sw shell/precache: ${missing.join(', ')}`
  );
});

test('site/sw.js: activate handler deletes caches other than CACHE', () => {
  const source = readSw();
  assert.match(source, /addEventListener\s*\(\s*['"]activate['"]/);
  assert.match(source, /caches\.keys\s*\(/);
  assert.match(source, /caches\.delete\s*\(/);
  assert.match(source, /key\s*!==\s*CACHE|CACHE\s*!==\s*key/);
});

test('site/sw.js: activate removes stale cache names (runtime)', async () => {
  const source = readSw();
  const cacheName = parseCacheName(source);
  assert.ok(cacheName);

  const deleted = [];
  const keys = ['kindeals-stale-a', cacheName, 'kindeals-stale-b'];
  const caches = {
    keys: async () => keys.slice(),
    delete: async (k) => {
      deleted.push(k);
      return true;
    },
    open: async () => ({ match: async () => null, put: async () => {} }),
  };

  let activateListener;
  const self = {
    addEventListener(type, fn) {
      if (type === 'activate') activateListener = fn;
    },
    skipWaiting() {},
    clients: { claim: async () => {} },
  };

  const ctx = vm.createContext({ self, caches, URL, Response, Promise, Date, console });
  vm.runInContext(source, ctx, { filename: 'site/sw.js' });
  assert.equal(typeof activateListener, 'function');

  const event = {
    waitUntil(p) {
      this._p = p;
      return p;
    },
  };
  activateListener(event);
  await event._p;

  assert.deepEqual(deleted.sort(), ['kindeals-stale-a', 'kindeals-stale-b'].sort());
});
