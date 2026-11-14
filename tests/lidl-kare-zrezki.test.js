'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

/* kw46 page 2: 3,39 (4,29) is Naša mesnica Sveži svinjski kare zrezki, 550 g.
   "Svinjski kare brez kosti" is the other tile, about 3,2 kg at 3,99/kg. */
const ROOT = path.join(__dirname, '..');
/* Price and date snapshots are of this frozen copy. A publish may rewrite t/. */
const FIX = path.join(__dirname, 'fixtures', 'lidl-kare');
const OLD = 'Svinjski kare brez kosti 3,39 (4,29)';
const NEW = 'Svinjski kare zrezki 550 g 3,39 (4,29)';
const PRICE = /\d+,\d{2}/g;
const DATE = /\d{1,2}\.\d{1,2}\./g;
const TEXT = /\.(txt|js|json|html|md|css)$/;

const expected = require('./lidl-kare-zrezki.expected.json');

function walk(dir, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '.git' || ent.name === 'node_modules') continue;
      walk(full, out);
    } else if (ent.isFile() && TEXT.test(ent.name)) {
      out.push(full);
    }
  }
}

test('live Lidl files do not name 3,39 (4,29) as Svinjski kare brez kosti', () => {
  const hits = [];
  for (const name of ['t', 'site', 't2']) {
    const files = [];
    walk(path.join(ROOT, name), files);
    for (const file of files) {
      if (fs.readFileSync(file, 'utf8').includes(OLD)) hits.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(hits, []);
});

test('3,39 (4,29) is Svinjski kare zrezki 550 g', () => {
  for (const rel of Object.keys(expected.files)) {
    const lines = fs.readFileSync(path.join(FIX, rel), 'utf8').split('\n')
      .filter((line) => line.includes('kare') && line.includes('3,39 (4,29)'));
    assert.deepEqual(lines, [NEW], rel);
  }
});

test('no other Lidl price or date changed', () => {
  for (const [rel, id] of Object.entries(expected.files)) {
    const text = fs.readFileSync(path.join(FIX, rel), 'utf8');
    const snap = expected.snapshots[id];
    assert.deepEqual(text.match(PRICE), snap.prices, rel + ' prices');
    assert.deepEqual(text.match(DATE) || [], snap.dates, rel + ' dates');
  }
});
