'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

/* Leaflet: Katalog E.Leclerc Slovenija, 4. 11.–14. 11. 2026.
   These four lines are the ones the 12 Nov recheck marked wrong. */
const brief = path.join(__dirname, '..', 't', 'leclerc', '2026-11-11', 'brief-sl.txt');

function only(prefix) {
  const found = fs.readFileSync(brief, 'utf8').split('\n').filter((line) => line.startsWith(prefix));
  assert.equal(found.length, 1, found.join('\n') || '(none)');
  return found[0];
}

test('File postrvi/šarenke says gojena, as the leaflet prints it', () => {
  assert.equal(
    only('File postrvi/šarenke'),
    'File postrvi/šarenke, gojena v Sloveniji 16,99/kg'
  );
});

test('Sirova štručka keeps the spelling and shows no previous price', () => {
  const line = only('Sirova štručka x 4');
  assert.equal(line, 'Sirova štručka x 4, 320 g 2,96');
  assert.equal(/štučka/i.test(line), false);
  assert.deepEqual(line.match(/\d,\d{2}/g), ['2,96']);
});

test('Mini francoski rogljički name both fillings', () => {
  assert.equal(
    only('Mini francoski rogljički Pekarna Pečjak s'),
    'Mini francoski rogljički Pekarna Pečjak s čokoladno-lešnikovim ali mareličnim nadevom, 510 g 3,55 (5,08)'
  );
});

test('Skuša Rio Mare: 2,30 needs the bon, 3,28 is the till price', () => {
  const line = only('Skuša na žaru Rio Mare');
  assert.equal(
    line,
    'Skuša na žaru Rio Mare v ekstradeviškem oljčnem olju ali v naravnem soku, 120 g 2,30 z bonom, na blagajni 3,28'
  );
  assert.equal(line.includes('(3,28)'), false);
});
