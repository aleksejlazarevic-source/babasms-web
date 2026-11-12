'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const MANIFEST_PATH = path.join(SITE, 'manifest.webmanifest');

/** Read-only checks for PWA manifest fields and on-disk icon assets. */
function manifestErrors(manifest, assetsDir) {
  const errors = [];
  if (manifest.start_url !== 'deals.html') {
    errors.push('start_url must be deals.html, got ' + JSON.stringify(manifest.start_url));
  }
  if (manifest.lang !== 'sl') {
    errors.push('lang must be sl, got ' + JSON.stringify(manifest.lang));
  }
  const seen = new Set();
  for (const icon of manifest.icons || []) {
    const src = icon && icon.src;
    if (!src || seen.has(src)) continue;
    seen.add(src);
    const iconPath = path.join(assetsDir, src);
    if (!fs.existsSync(iconPath)) {
      errors.push('missing icon file: ' + src);
    }
  }
  return errors;
}

function loadSiteManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

test('site manifest.webmanifest: start_url deals.html, lang sl, icons on disk', () => {
  const manifest = loadSiteManifest();
  assert.deepEqual(manifestErrors(manifest, SITE), []);
});

test('validator fails when start_url is not deals.html (temp edit)', () => {
  const manifest = loadSiteManifest();
  manifest.start_url = 'index.html';
  const errors = manifestErrors(manifest, SITE);
  assert.ok(errors.some((e) => e.includes('start_url')));
});

test('validator fails when lang is not sl (temp edit)', () => {
  const manifest = loadSiteManifest();
  manifest.lang = 'en';
  const errors = manifestErrors(manifest, SITE);
  assert.ok(errors.some((e) => e.includes('lang')));
});

test('validator fails when a listed icon file is missing (temp edit)', () => {
  const manifest = loadSiteManifest();
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
