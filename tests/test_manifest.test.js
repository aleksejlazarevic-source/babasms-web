'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { SITE } = require('./helpers/site-paths');
const { manifestErrors, loadManifestFile } = require('./helpers/manifest-assert');

const MANIFEST_PATH = path.join(SITE, 'manifest.webmanifest');

test('site manifest.webmanifest: parses; name, start_url, display standalone, icons on disk', () => {
  const manifest = loadManifestFile(MANIFEST_PATH);
  assert.deepEqual(manifestErrors(manifest, SITE), []);
});

test('manifest validator fails when name is empty (deliberate broken copy)', () => {
  const manifest = loadManifestFile(MANIFEST_PATH);
  manifest.name = '';
  const errors = manifestErrors(manifest, SITE);
  assert.ok(errors.some((e) => e.includes('name')));
});

test('manifest validator fails when display is not standalone (deliberate broken copy)', () => {
  const manifest = loadManifestFile(MANIFEST_PATH);
  manifest.display = 'browser';
  const errors = manifestErrors(manifest, SITE);
  assert.ok(errors.some((e) => e.includes('display')));
});

test('manifest validator fails when start_url is not deals.html (deliberate broken copy)', () => {
  const manifest = loadManifestFile(MANIFEST_PATH);
  manifest.start_url = 'index.html';
  const errors = manifestErrors(manifest, SITE);
  assert.ok(errors.some((e) => e.includes('start_url')));
});

test('manifest validator fails when a listed icon file is missing (deliberate broken copy)', () => {
  const manifest = loadManifestFile(MANIFEST_PATH);
  manifest.icons = manifest.icons.concat([
    { src: 'icon-missing-for-test.png', sizes: '64x64', type: 'image/png' },
  ]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'babasms-manifest-'));
  try {
    const errors = manifestErrors(manifest, tmp);
    assert.ok(errors.some((e) => e.includes('icon-missing-for-test.png')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
