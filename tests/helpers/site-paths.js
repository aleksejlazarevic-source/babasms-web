'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');
const SITE = path.join(ROOT, 'site');

/** Local href/src targets from HTML (not external, not hash-only).
    Also picks up files loaded with add('file.js') after stylesheets (the
    current install page does not put those scripts in src= attributes). */
function localAssetRefs(html) {
  const refs = [];
  function push(raw) {
    raw = String(raw || '').trim();
    if (!raw || raw.startsWith('#')) return;
    if (/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(raw)) return;
    const cleaned = raw.split('#')[0].split('?')[0];
    if (cleaned) refs.push(cleaned);
  }
  const re = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) push(m[1]);
  /* Do not match classList.add('fr'): require a filename with an extension. */
  const addRe = /(?<![\w.])add\s*\(\s*['"]([^'"]+\.(?:js|css|webmanifest|html|json|png|woff2))['"]/g;
  while ((m = addRe.exec(html)) !== null) push(m[1]);
  return [...new Set(refs)];
}

function siteFileExists(rel) {
  const norm = rel.replace(/^\.\//, '');
  return fs.existsSync(path.join(SITE, norm));
}

module.exports = { ROOT, SITE, localAssetRefs, siteFileExists };
