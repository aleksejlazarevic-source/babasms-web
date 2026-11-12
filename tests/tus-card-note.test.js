'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

/* Before the card-mark fix, line 5 said every price needs the Tuš klub card.
   The A45 leaflet does not: lines with a previous price in parentheses are card
   prices, and the dated lines with no previous price are not. Prices, names,
   sizes and dates are frozen in tus-a45-price-dates.json (the files with the
   card phrase and the closing note taken back off). */
const snapshot = require('./tus-a45-price-dates.json');
const NOTE = snapshot.note;
const OLD_NOTE = 'Vse cene veljajo s kartico Tuš klub, v oklepaju je prejšnja cena.';
const ROOT = path.join(__dirname, '..', 't', 'tus');

function readBrief(day) {
  return fs.readFileSync(path.join(ROOT, day, 'brief-sl.txt'), 'utf8').replace(/\r\n/g, '\n');
}

function withoutCardMark(line) {
  return line.replace(/ s kartico(?= do \d{1,2}\.\d{1,2}\.$)/, '');
}

/* Same lines as before the wording edit: drop only the closing note, and the card mark. */
function frozenLines(text) {
  return text.split('\n')
    .filter((line) => line !== NOTE && line !== OLD_NOTE)
    .map(withoutCardMark);
}

test('Tuš prices, names, sizes and dates match the pre-edit briefs', () => {
  const seen = new Set();
  for (const group of snapshot.groups) {
    assert.ok(group.days.length > 0);
    for (const day of group.days) {
      seen.add(day);
      assert.deepEqual(frozenLines(readBrief(day)), group.lines, day);
    }
  }
  const onDisk = fs.readdirSync(ROOT).filter((name) => /^2026-11-\d{2}$/.test(name)).sort();
  assert.deepEqual(onDisk, [...seen].sort());
});

test('only card-marked Tuš lines say s kartico, and the note no longer covers every price', () => {
  const days = fs.readdirSync(ROOT).filter((name) => /^2026-11-\d{2}$/.test(name)).sort();
  assert.ok(days.length >= 14);
  for (const day of days) {
    const lines = readBrief(day).split('\n');
    const notes = lines.filter((line) => line.includes('Tuš klub') || line.includes('Vse cene'));
    assert.deepEqual(notes, [NOTE], day);
    assert.equal(lines.some((line) => line.startsWith('Vse cene veljajo')), false, day);
    const priced = lines.filter((line) => /\d,\d{2}/.test(line));
    assert.ok(priced.length > 0, day);
    for (const line of priced) {
      const card = /\([^)]*\d/.test(line);
      assert.equal(line.includes('s kartico'), card, day + ': ' + line);
    }
  }
});
