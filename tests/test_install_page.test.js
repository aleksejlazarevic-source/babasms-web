'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { SITE } = require('./helpers/site-paths');
const { createLocalStaticServer } = require('./helpers/local-static-server');
const { assertInstallPageHealthy } = require('./helpers/install-page-check');

function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    if (e && e.code === 'MODULE_NOT_FOUND') {
      return null;
    }
    throw e;
  }
}

function copySiteTree(destRoot) {
  fs.cpSync(SITE, destRoot, { recursive: true });
}

test('install page loads at iPhone 11 size with images and no console errors', async (t) => {
  const playwright = loadPlaywright();
  if (!playwright) {
    t.skip('playwright is not installed (run: npm install --no-save playwright && npx playwright install chromium)');
    return;
  }

  const server = await createLocalStaticServer(SITE);
  const browser = await playwright.chromium.launch({ headless: true });

  t.after(async () => {
    await browser.close();
    await server.close();
  });

  const page = await browser.newPage();
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') {
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });

  page.__installBaseUrl = server.baseUrl + 'index.html';
  await assertInstallPageHealthy(page);
});

test('install page check fails when hand.png is missing (deliberate broken copy)', async (t) => {
  const playwright = loadPlaywright();
  if (!playwright) {
    t.skip('playwright is not installed');
    return;
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'babasms-install-broken-'));
  copySiteTree(tmp);
  fs.rmSync(path.join(tmp, 'hand.png'));

  const server = await createLocalStaticServer(tmp);
  const browser = await playwright.chromium.launch({ headless: true });

  t.after(async () => {
    await browser.close();
    await server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  const page = await browser.newPage();
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') {
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });

  page.__installBaseUrl = server.baseUrl + 'index.html';

  await assert.rejects(
    () => assertInstallPageHealthy(page),
    (err) => err && /image|hand\.png|404/i.test(String(err.message))
  );
});
