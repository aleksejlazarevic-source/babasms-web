'use strict';

const assert = require('node:assert/strict');

const IPHONE_11 = { width: 414, height: 896 };

function urlsFromCssImage(value, base) {
  if (!value || value === 'none') return [];
  const out = [];
  const re = /url\(["']?([^"')]+)["']?\)/g;
  let m;
  while ((m = re.exec(value)) !== null) {
    const raw = m[1].trim();
    if (raw.startsWith('data:')) continue;
    try {
      out.push(new URL(raw, base).href);
    } catch {
      /* skip */
    }
  }
  return out;
}

/** Collect same-origin image URLs referenced by the install page (HTML + loaded CSS). */
async function collectInstallImageUrls(page) {
  return page.evaluate(() => {
    const urls = new Set();
    const add = (u) => {
      if (u && !u.startsWith('data:')) urls.add(u);
    };

    for (const img of document.images) {
      if (img.currentSrc) add(img.currentSrc);
    }
    for (const link of document.querySelectorAll('link[href]')) {
      const rel = (link.getAttribute('rel') || '').toLowerCase();
      const href = link.getAttribute('href') || '';
      if (rel.includes('icon') || /\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(href)) {
        try {
          add(new URL(href, location.href).href);
        } catch {
          /* skip */
        }
      }
    }

    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of rules) {
        const style = rule.style;
        if (!style) continue;
        for (const prop of ['backgroundImage', 'background', 'listStyleImage', 'borderImageSource']) {
          const val = style.getPropertyValue(prop);
          if (!val) continue;
          const re = /url\(["']?([^"')]+)["']?\)/g;
          let m;
          while ((m = re.exec(val)) !== null) {
            const raw = m[1].trim();
            if (raw.startsWith('data:')) continue;
            try {
              urls.add(new URL(raw, sheet.href || location.href).href);
            } catch {
              /* skip */
            }
          }
        }
      }
    }

    return [...urls];
  });
}

/** Run install-page assertions in an already-open Playwright page (localhost only). */
async function assertInstallPageHealthy(page) {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(String(err));
  });

  await page.setViewportSize(IPHONE_11);
  await page.goto(page.__installBaseUrl, { waitUntil: 'networkidle' });

  assert.ok(
    (await page.locator('main').count()) > 0,
    'install page must expose a main landmark'
  );

  const imageUrls = await collectInstallImageUrls(page);
  assert.ok(imageUrls.length > 0, 'install page must reference at least one image');

  const broken = [];
  for (const url of imageUrls) {
    try {
      const host = new URL(url).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') {
        broken.push(`${url} → blocked external host`);
        continue;
      }
      const res = await page.request.get(url);
      if (!res.ok()) broken.push(`${url} → ${res.status()}`);
    } catch (e) {
      broken.push(`${url} → ${e.message}`);
    }
  }
  assert.deepEqual(broken, [], `image(s) failed to load: ${broken.join('; ')}`);

  const benignSw = (t) => /service worker|sw\.js|Failed to register/i.test(t);
  const badConsole = consoleErrors.filter((t) => !benignSw(t));
  assert.deepEqual(
    badConsole,
    [],
    `unexpected console errors: ${badConsole.join(' | ')}`
  );
}

module.exports = {
  IPHONE_11,
  collectInstallImageUrls,
  assertInstallPageHealthy,
  urlsFromCssImage,
};
