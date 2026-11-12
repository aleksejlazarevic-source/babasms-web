'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { SITE, localAssetRefs, siteFileExists } = require('./helpers/site-paths');
const { assertSwShellPaths } = require('./helpers/site-shell-assert');

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

/** Paths the install page and PWA start_url pull in when sw has no addAll list. */
function shellPathsFromIndex() {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const fromHtml = localAssetRefs(html);
  return [...new Set(['index.html', 'sw.js', 'deals.html', 'deals.js', ...fromHtml])];
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
  assertSwShellPaths(paths);
  const missing = paths.filter((p) => !siteFileExists(p));
  assert.deepEqual(
    missing,
    [],
    `missing site file(s) for sw shell/precache: ${missing.join(', ')}`
  );
});

test('sw shell validator fails on empty path list (deliberate broken copy)', () => {
  assert.throws(
    () => assertSwShellPaths([]),
    (err) => err && /at least 5 paths/.test(String(err.message))
  );
});

test('sw shell validator fails without deals.js (deliberate broken copy)', () => {
  assert.throws(
    () => assertSwShellPaths(['index.html', 'sw.js', 'look.css', 'setup-lang.js', 'install.js']),
    (err) => err && /deals\.js/.test(String(err.message))
  );
});

test('parseCacheName fails when CACHE is missing (deliberate broken copy)', () => {
  const broken = 'self.addEventListener("fetch", function () {});';
  assert.equal(parseCacheName(broken), null);
});
