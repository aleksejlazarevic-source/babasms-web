'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

/* A45 leaflet 11.11.–24.11.2026. Each day's file holds only offers valid that day.
   Lavazza Crema e Gusto is 11.11.–17.11. Instant Nescafé is the same window.
   Vikend bum (svinjski laks kare, pečenice, limone, prekajeno pleče) is 13.11. and 14.11. only.
   The day files are a fixture: a publish may rewrite t/tus. */
const ROOT = path.join(__dirname, 'fixtures', 'tus-a45');

const LAVAZZA = 'Kava Lavazza Crema e Gusto, kapsule Nespresso, 12 × 57 g 4,63 do 17.11.';
const INSTANT = 'Instant kava Nescafé, Classic, Mild, Kräftig, Nestlé, 200 g 7,99 (10,49) s kartico do 17.11.';
const WEEKEND = [
  'Svinjski laks kare EU, postrežno, 1 kg 3,99 (9,49) s kartico do 14.11.',
  'Pečenice, pripravljeno v mesnici, postrežno, 1 kg 5,89 (10,49) s kartico do 14.11.',
  'Limone, 1 kg 1,19 (2,49) s kartico do 14.11.',
  'Prekajeno pleče Ave, Panvita, 1 kg 5,49 (11,99) s kartico do 14.11.'
];

function read(day) {
  return fs.readFileSync(path.join(ROOT, day, 'brief-sl.txt'), 'utf8').replace(/\r\n/g, '\n');
}

function days() {
  return fs.readdirSync(ROOT).filter((name) => /^2026-11-\d{2}$/.test(name)).sort();
}

test('Lavazza is do 17.11. on 12.11. and absent from 18.11.', () => {
  assert.equal(read('2026-11-18').includes('Lavazza'), false);
  const early = read('2026-11-12').split('\n').filter((line) => line.includes('Lavazza'));
  assert.deepEqual(early, [LAVAZZA]);
});

test('instant Nescafé 7,99 (10,49) s kartico is on 12.11. and not on 18.11.', () => {
  const on12 = read('2026-11-12').split('\n').filter((line) => line.includes('Instant kava Nescafé'));
  assert.deepEqual(on12, [INSTANT]);
  assert.equal(read('2026-11-18').includes('Instant kava Nescafé'), false);
});

test('Friday–Saturday 13.–14.11. lines are only on those days', () => {
  for (const day of days()) {
    const text = read(day);
    const weekend = day === '2026-11-13' || day === '2026-11-14';
    for (const line of WEEKEND) {
      assert.equal(text.includes(line), weekend, day + ': ' + line);
    }
  }
});
