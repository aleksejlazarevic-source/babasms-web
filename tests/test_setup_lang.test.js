'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { SITE } = require('./helpers/site-paths');
const { createBrowserStub, runSiteScript, USER_AGENTS } = require('./helpers/site-vm');

const SETUP_LANG_PATH = path.join(SITE, 'setup-lang.js');
const INDEX_PATH = path.join(SITE, 'index.html');

function loadKdText() {
  const src = fs.readFileSync(SETUP_LANG_PATH, 'utf8');
  const start = src.indexOf('const KD_TEXT = ');
  assert.ok(start >= 0, 'KD_TEXT object not found');
  const end = src.indexOf('\n};\n\n(function', start);
  assert.ok(end > start, 'KD_TEXT object end not found');
  const literal = src.slice(start + 'const KD_TEXT = '.length, end + 2);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${literal});`)();
}

function norm(s) {
  return s.replace(/\s*…$/, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('sl');
}

/** Keys whose Slovenian strings appear in site/index.html. */
function keysUsedInIndex(kd) {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const text = html.replace(/<[^>]+>/g, '\n');
  const chunks = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const index = new Map();
  for (const key of Object.keys(kd.sl)) {
    for (const v of [].concat(kd.sl[key])) index.set(norm(v), key);
  }
  const used = new Set();
  const PITCH_PARTS = ['All your', 'discounts, in', 'one place.'];
  for (const chunk of chunks) {
    if (PITCH_PARTS.includes(chunk)) used.add('pitch');
    const k = index.get(norm(chunk));
    if (k) used.add(k);
  }
  return [...used];
}

for (const [label, ua] of Object.entries(USER_AGENTS)) {
  test(`site/setup-lang.js: loads without throw (${label} UA)`, () => {
    assert.doesNotThrow(() => {
      const stub = createBrowserStub(ua, { languages: ['sl', 'en'] });
      runSiteScript('setup-lang.js', {
        window: stub.window,
        document: stub.document,
        navigator: stub.navigator,
        location: stub.window.location,
      });
    });
  });
}

test('site/setup-lang.js: text keys used on index.html exist in sl and en', () => {
  const kd = loadKdText();
  const keys = keysUsedInIndex(kd);
  assert.ok(keys.length > 0, 'expected at least one KD_TEXT key used in index.html');
  const missing = [];
  for (const key of keys) {
    if (kd.sl[key] == null) missing.push(`sl.${key}`);
    if (kd.en[key] == null) missing.push(`en.${key}`);
  }
  assert.deepEqual(missing, [], `missing translations: ${missing.join(', ')}`);
});

test('site/setup-lang.js: every sl key has an en entry', () => {
  const kd = loadKdText();
  const missing = Object.keys(kd.sl).filter((k) => kd.en[k] == null);
  assert.deepEqual(missing, [], `sl keys without en: ${missing.join(', ')}`);
});
