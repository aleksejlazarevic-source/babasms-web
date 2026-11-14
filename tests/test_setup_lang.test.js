'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createBrowserStub, runSiteScript, USER_AGENTS } = require('./helpers/site-vm');
const {
  loadKdText,
  assertKeysInSlAndEn,
  requiredKdKeysForInstallPage,
  collectRequiredKdKeys,
} = require('./helpers/kd-text-keys');

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

test('site/setup-lang.js: required KD keys exist in sl and en', () => {
  const kd = loadKdText();
  const keys = requiredKdKeysForInstallPage();
  assert.ok(keys.includes('pitch'), 'required keys must include pitch (h1 / to.pitch)');
  assert.ok(keys.includes('heading'), 'required keys must include heading');
  assertKeysInSlAndEn(keys, kd);
});

test('validator fails when required key heading is missing from sl (temp)', () => {
  const kd = loadKdText();
  const keys = requiredKdKeysForInstallPage();
  const broken = { sl: { ...kd.sl }, en: { ...kd.en } };
  delete broken.sl.heading;
  assert.throws(
    () => assertKeysInSlAndEn(keys, broken),
    (err) => err && /sl\.heading/.test(String(err.message))
  );
});

test('required keys include pitch even without matching Slovenian headline on page (temp)', () => {
  const setupSrc = 'const x = 1;\n// to.pitch\n';
  const indexHtml = '<h1>All your discounts, in one place.</h1>';
  const keys = collectRequiredKdKeys(setupSrc, indexHtml);
  assert.ok(keys.includes('pitch'));
  const kd = loadKdText();
  const broken = { sl: { ...kd.sl }, en: { ...kd.en } };
  delete broken.sl.pitch;
  assert.throws(
    () => assertKeysInSlAndEn(keys.filter((k) => k === 'pitch'), broken),
    (err) => err && /sl\.pitch/.test(String(err.message))
  );
});
