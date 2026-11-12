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

/** PWA entry from manifest plus install page assets (sw shell list). */
const REQUIRED_SW_SHELL = ['look.css', 'deals.js', 'deals.html'];

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
  assert.ok(
    list.length >= MIN_LOCAL_REFS,
    `sw shell must list at least ${MIN_LOCAL_REFS} paths, got ${list.length}`
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
