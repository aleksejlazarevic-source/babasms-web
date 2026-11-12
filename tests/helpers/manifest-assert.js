'use strict';

const fs = require('node:fs');
const path = require('node:path');

/** Read-only checks for PWA manifest fields and on-disk icon assets. */
function manifestErrors(manifest, assetsDir) {
  const errors = [];
  const name = manifest && manifest.name;
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('name must be a non-empty string');
  }
  if (manifest.start_url !== 'deals.html') {
    errors.push('start_url must be deals.html, got ' + JSON.stringify(manifest.start_url));
  }
  if (manifest.display !== 'standalone') {
    errors.push('display must be standalone, got ' + JSON.stringify(manifest.display));
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

function loadManifestFile(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

module.exports = { manifestErrors, loadManifestFile };
