'use strict';

var fs = require('fs');
var path = require('path');

/* 18.11. is past the short window. A priced line that says "do 17.11." is not valid that day.
   Fixture briefs, not t/tus: a publish may rewrite the live day files. */
var day18 = path.join(__dirname, 'fixtures/tus-a45/2026-11-18/brief-sl.txt');
var day12 = path.join(__dirname, 'fixtures/tus-a45/2026-11-12/brief-sl.txt');

function priced(text) {
  return text.split('\n').filter(function (line) { return /\d,\d{2}/.test(line); });
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (err) {
    console.error('FAIL missing ' + file);
    process.exit(1);
  }
}

var late = priced(read(day18));
var ended = late.filter(function (line) { return line.indexOf('do 17.11.') !== -1; });
if (ended.length) {
  console.error('FAIL 2026-11-18: still has do 17.11. lines');
  ended.forEach(function (line) { console.error(line); });
  process.exit(1);
}
if (!late.some(function (line) { return line.indexOf('do 24.11.') !== -1; })) {
  console.error('FAIL 2026-11-18: priced lines have no end date, so a do 17.11. line cannot be kept out');
  process.exit(1);
}

var early = priced(read(day12));
if (!early.some(function (line) { return line.indexOf('do 17.11.') !== -1; })) {
  console.error('FAIL 2026-11-12: expected lines that end do 17.11.');
  process.exit(1);
}
if (!late.some(function (line) { return line.indexOf('4,69/kg (5,79/kg) s kartico do 24.11.') !== -1; })) {
  console.error('FAIL 2026-11-18: vaška peka must be priced per kg through 24.11.');
  process.exit(1);
}

console.log('PASS: 2026-11-18 has no do 17.11. lines; 2026-11-12 still has them');
