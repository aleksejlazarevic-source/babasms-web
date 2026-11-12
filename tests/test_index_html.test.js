'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { SITE, localAssetRefs, siteFileExists } = require('./helpers/site-paths');

const INDEX_PATH = path.join(SITE, 'index.html');

test('site/index.html: every local src/href points to an existing file under site/', () => {
  const html = fs.readFileSync(INDEX_PATH, 'utf8');
  const refs = localAssetRefs(html);
  const missing = refs.filter((ref) => !siteFileExists(ref));
  assert.deepEqual(
    missing,
    [],
    `broken local refs in site/index.html: ${missing.join(', ')}`
  );
});
