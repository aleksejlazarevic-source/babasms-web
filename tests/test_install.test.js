'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const { createBrowserStub, runSiteScript, USER_AGENTS } = require('./helpers/site-vm');

function loadInstall(ua, extra) {
  const stub = createBrowserStub(ua, extra);
  runSiteScript('install.js', {
    window: stub.window,
    document: stub.document,
    navigator: stub.navigator,
    module: stub.module,
    exports: stub.module.exports,
  });
  return stub.module.exports;
}

for (const [label, ua] of Object.entries(USER_AGENTS)) {
  test(`site/install.js: loads without throw (${label} UA)`, () => {
    assert.doesNotThrow(() => {
      loadInstall(ua, label === 'iphone' ? { maxTouchPoints: 5 } : {});
    });
  });
}

test('site/install.js: installChoice is exported for all three UAs', () => {
  const mod = loadInstall(USER_AGENTS.iphone, { maxTouchPoints: 5 });
  assert.equal(typeof mod.installChoice, 'function');
  const iphone = mod.installChoice({ ua: USER_AGENTS.iphone, maxTouchPoints: 5 });
  assert.equal(iphone.kind, 'ios');
  const android = mod.installChoice({ ua: USER_AGENTS.android });
  assert.equal(android.kind, 'android');
  const desktop = mod.installChoice({ ua: USER_AGENTS.desktop });
  assert.equal(desktop.kind, 'desktop');
});
