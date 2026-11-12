'use strict';

const assert = require('node:assert/strict');

const MIN_LOCAL_REFS = 5;

/** Install index.html must keep linking the core shell (vacuous empty page must fail). */
const REQUIRED_INDEX_LOCAL = [
  'look.css',
  'setup-lang.js',
  'install.js',
  'sw-register.js',
  'manifest.webmanifest',
];

/** Files site/sw.js must save on install (offline page, look, fonts).
    Deal files are saved later, on the first online visit. */
const REQUIRED_SW_SHELL = [
  'offline.html',
  'look.css',
  'fonts/lexend-latin-wght-normal.woff2',
  'fonts/lexend-latin-ext-wght-normal.woff2',
];

function assertInstallPageLocalRefs(refs) {
  const list = refs || [];
  assert.ok(
    list.length >= MIN_LOCAL_REFS,
    `index.html must have at least ${MIN_LOCAL_REFS} local src/href refs, got ${list.length}`
  );
  for (const must of REQUIRED_INDEX_LOCAL) {
    assert.ok(list.includes(must), `index.html must link ${must}`);
  }
}

function assertSwShellPaths(paths) {
  const list = paths || [];
  const min = REQUIRED_SW_SHELL.length;
  assert.ok(
    list.length >= min,
    `sw shell must list at least ${min} paths, got ${list.length}`
  );
  for (const must of REQUIRED_SW_SHELL) {
    assert.ok(list.includes(must), `sw shell paths must include ${must}`);
  }
}

module.exports = {
  MIN_LOCAL_REFS,
  REQUIRED_INDEX_LOCAL,
  REQUIRED_SW_SHELL,
  assertInstallPageLocalRefs,
  assertSwShellPaths,
};
