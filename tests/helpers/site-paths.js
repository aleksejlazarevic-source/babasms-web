'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site');

/** Local href/src targets from HTML (not external, not hash-only). */
function localAssetRefs(html) {
  const refs = [];
  const re = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const raw = m[1].trim();
    if (!raw || raw.startsWith('#')) continue;
    if (/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(raw)) continue;
    const cleaned = raw.split('#')[0].split('?')[0];
    if (cleaned) refs.push(cleaned);
  }
  return [...new Set(refs)];
}

function siteFileExists(rel) {
  const norm = rel.replace(/^\.\//, '');
  return fs.existsSync(path.join(SITE, norm));
}

module.exports = { ROOT, SITE, localAssetRefs, siteFileExists };
