'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const api = require(path.join(__dirname, '../site/deals.js'));

const TUS = { id: 'tus', days: ['wed', 'fri'] };

function priced(lines) {
  return lines.filter((line) => /\d,\d{2}/.test(line));
}

test('showText on the day file drops priced lines whose do date is already past', () => {
  const day = '2026-11-18';
  const text = [
    'BABASMS1',
    'Babi, to so Tušovi popusti za kuhanje od 11.11. do 24.11.:',
    '',
    'MESO',
    'Potekla akcija 1,99 (2,49) s kartico do 17.11.',
    'Še velja 2,49 (3,49) s kartico do 24.11.',
  ].join('\n');
  const shown = api.showText(text, day);
  assert.equal(shown.kind, 'deals');
  const deals = priced(shown.lines);
  assert.ok(
    !deals.some((line) => line.indexOf('do 17.11.') >= 0),
    'expired do 17.11. lines must not appear as current deals'
  );
  assert.ok(
    deals.some((line) => line.indexOf('do 24.11.') >= 0),
    'still-valid lines must remain'
  );
});

test('loadBatch carrying an older leaflet cuts expired deal lines on the asked day', async () => {
  const older = fs.readFileSync(path.join(__dirname, 'fixtures/tus-a45/2026-11-12/brief-sl.txt'), 'utf8');
  const day = '2026-11-18';
  const fetcher = (url) => {
    const u = String(url);
    if (u.includes(day)) {
      return Promise.resolve({ status: 404, ok: false, text: () => Promise.resolve('') });
    }
    /* Any earlier send day returns the same cached leaflet body (stale network cache). */
    return Promise.resolve({ status: 200, ok: true, text: () => Promise.resolve(older) });
  };
  const got = await api.loadBatch(day, fetcher, TUS);
  assert.equal(got.kind, 'deals');
  const deals = priced(got.lines);
  assert.ok(!deals.some((line) => line.indexOf('do 17.11.') >= 0));
  assert.ok(deals.some((line) => line.indexOf('do 24.11.') >= 0));
});

test('carried batch outside leaflet window shows none, not expired prices', () => {
  const fixture = [
    'BABASMS1',
    'Babi, popusti od 1.11. do 5.11.:',
    '',
    'TEST',
    'Star izdelek 1,99 do 5.11.',
  ].join('\n');
  const shown = api.showText(fixture, '2026-11-18', true);
  assert.notEqual(shown.kind, 'deals');
  assert.ok(
    shown.kind === 'none' || shown.kind === 'empty' || shown.kind === 'outside',
    'expected no current deals, got ' + shown.kind
  );
});
