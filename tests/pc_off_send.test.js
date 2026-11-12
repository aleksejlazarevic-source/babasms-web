'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const pyTest = path.join(__dirname, 'pc_off_send_test.py');

test('pc_off.send redacts Telegram errors (no token or URL in output)', () => {
  const r = spawnSync('python3', [pyTest], {
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
  });
  const out = [r.stdout, r.stderr].filter(Boolean).join('\n');
  assert.equal(
    r.status,
    0,
    out || `python3 exited ${r.status}`,
  );
});
