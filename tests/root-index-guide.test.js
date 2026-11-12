'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');
const ROOT_INDEX = path.join(ROOT, 'index.html');
const SETUP_LANG = path.join(ROOT, 'site', 'setup-lang.js');

const STALE_ENGLISH = ['<li>More</li>', '<li>Share</li>', '<li>Add to Home Screen</li>'];

/** Slovenian setup step lines (s1–s4) from site/setup-lang.js — source of truth for the guide. */
function slovenianSetupStepsFromSite() {
  const src = fs.readFileSync(SETUP_LANG, 'utf8');
  const steps = [];
  for (let n = 1; n <= 4; n++) {
    const re = new RegExp(`\\bs${n}:\\s*"([^"]+)"`);
    const m = src.match(re);
    assert.ok(m, `site/setup-lang.js must define sl s${n}`);
    steps.push(m[1]);
  }
  return steps;
}

test('root index.html: Slovenian setup guide matches site (GitHub Pages copy)', () => {
  const html = fs.readFileSync(ROOT_INDEX, 'utf8');
  const steps = slovenianSetupStepsFromSite();

  assert.ok(
    html.includes('Tapni puščico iz kvadratka.'),
    'root index.html must include the Slovenian install guide marker'
  );

  for (const step of steps) {
    assert.ok(html.includes(step), `root index.html must include setup step: ${step}`);
  }

  for (const stale of STALE_ENGLISH) {
    assert.ok(!html.includes(stale), `root index.html must not contain stale English: ${stale}`);
  }
});
