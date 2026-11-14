'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { SITE } = require('./site-paths');

const SETUP_LANG_PATH = path.join(SITE, 'setup-lang.js');
const INDEX_PATH = path.join(SITE, 'index.html');

/**
 * KD_TEXT keys the install page and setup-lang runner use — fixed from page structure
 * and script reads, not from reverse lookup in KD_TEXT.sl.
 */
const INDEX_PAGE_KD_KEYS = [
  'pitch',
  'heading',
  'where',
  's1',
  'a1',
  's2',
  'a2',
  's3',
  'a3',
  's4',
  'addHome',
  'installNote',
  'menuHint',
  'i26s1',
  'i26a1',
  'i26s2',
  'i26a2',
  'i26s5',
  'i26a5',
  'i26web',
  'options',
  'messages',
  'showMore',
  'addFavorites',
  'quickNote',
  'find',
  'markup',
  'print',
  'share',
  'newTab',
  'bookmarks',
  'allTabs',
  'add',
];

function readSetupLang() {
  return fs.readFileSync(SETUP_LANG_PATH, 'utf8');
}

function readIndexHtml() {
  return fs.readFileSync(INDEX_PATH, 'utf8');
}

/** Keys required from setup-lang.js to.* reads, data-kd-key on index, and install page layout. */
function collectRequiredKdKeys(setupLangSrc, indexHtml) {
  const keys = new Set(INDEX_PAGE_KD_KEYS);
  for (const m of setupLangSrc.matchAll(/\bto\.([a-z][a-zA-Z0-9_]*)/g)) {
    keys.add(m[1]);
  }
  for (const m of indexHtml.matchAll(/\bdata-kd-key=["']([^"']+)["']/g)) {
    keys.add(m[1]);
  }
  return [...keys].sort();
}

function loadKdTextFromSource(setupLangSrc) {
  const start = setupLangSrc.indexOf('const KD_TEXT = ');
  assert.ok(start >= 0, 'KD_TEXT object not found');
  const end = setupLangSrc.indexOf('\n};\n\n(function', start);
  assert.ok(end > start, 'KD_TEXT object end not found');
  const literal = setupLangSrc.slice(start + 'const KD_TEXT = '.length, end + 2);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

function loadKdText() {
  return loadKdTextFromSource(readSetupLang());
}

function assertKeysInSlAndEn(requiredKeys, kd) {
  const missing = [];
  for (const key of requiredKeys) {
    if (kd.sl[key] == null) missing.push(`sl.${key}`);
    if (kd.en[key] == null) missing.push(`en.${key}`);
  }
  assert.deepEqual(missing, [], `missing translations: ${missing.join(', ')}`);
}

function requiredKdKeysForInstallPage() {
  return collectRequiredKdKeys(readSetupLang(), readIndexHtml());
}

module.exports = {
  INDEX_PAGE_KD_KEYS,
  collectRequiredKdKeys,
  loadKdText,
  loadKdTextFromSource,
  assertKeysInSlAndEn,
  requiredKdKeysForInstallPage,
};
