'use strict';

var path = require('path');
var api = require(path.join(__dirname, '../site/deals.js'));

/* Minimal batch: one priced line starting 16.11. inside a wider leaflet window. */
var FIXTURE = [
  'BABASMS1',
  'Babi, to so Lidlovi popusti za kuhanje od 12.11. do 18.11.:',
  '',
  'MESO',
  'Kruh z začetkom 1,99 (2,49) od 16.11.',
  'Drugo brez datuma 0,99 (1,49)'
].join('\n');

var TARGET = 'od 16.11.';

function dealLines(dayIso) {
  var shown = api.showText(FIXTURE, dayIso);
  if (shown.kind !== 'deals') return [];
  return shown.lines.filter(function (line) { return /\d,\d{2}/.test(line); });
}

function hasStartLine(dayIso) {
  return dealLines(dayIso).some(function (line) { return line.indexOf(TARGET) >= 0; });
}

var hiddenOn12 = !hasStartLine('2026-11-12');
var shownOn16 = hasStartLine('2026-11-16');

if (!hiddenOn12) {
  console.error('FAIL 2026-11-12: line with "' + TARGET + '" should be hidden');
  console.error('got:', dealLines('2026-11-12'));
  process.exit(1);
}
if (!shownOn16) {
  console.error('FAIL 2026-11-16: line with "' + TARGET + '" should be shown');
  console.error('got:', dealLines('2026-11-16'));
  process.exit(1);
}

console.log('PASS: "' + TARGET + '" hidden on 2026-11-12, shown on 2026-11-16');
