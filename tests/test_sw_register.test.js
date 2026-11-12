'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const { SITE } = require('./helpers/site-paths');

const REGISTER_PATH = path.join(SITE, 'sw-register.js');

test('site/sw-register.js: registers sw.js when serviceWorker is available', () => {
  const source = fs.readFileSync(REGISTER_PATH, 'utf8');
  assert.match(
    source,
    /serviceWorker\.register\s*\(\s*['"]\/?sw\.js['"]\s*\)/
  );

  let registered;
  const navigator = {
    serviceWorker: {
      register(swUrl) {
        registered = swUrl;
        return Promise.resolve({});
      },
    },
  };

  vm.runInContext(source, vm.createContext({ navigator }), { filename: 'site/sw-register.js' });
  assert.equal(registered, 'sw.js');
});
