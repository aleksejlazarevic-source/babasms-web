'use strict';

var fs = require('fs');
var path = require('path');
var api = require(path.join(__dirname, '../site/deals.js'));

/* Hofer KT46, checked 12 Nov 2026. The page must use each line's own dates. */
var BRIEF = path.join(__dirname, '../t/hofer/2026-11-12/brief-sl.txt');

var FROM_4 = [
  'VANILJEVI ROGLJIČKI, 400 g',
  'POLNJENA ČOKOLADA jagoda, nugat ali mlečna krema, 100 g',
  'FLIPS Z ARAŠIDI, 200 g',
  'BIO MANDLJEV NAPITEK nesladkan, 1 l',
  'SALAMA S PARMEZANOM, 100 g',
  'ARAŠIDI praženi in nesoljeni, 500 g',
  'BIO OVSENI KOSMIČI BREZ GLUTENA fino ali grobo mleti, 500 g',
  'KROMPIRČEK IZ SLADKEGA KROMPIRJA, 500 g',
  'KORUZA, 3 x 165 g',
  'BIO HRUSTLJAVI KRUHKI več vrst, 200/150 g',
  'RDEČA PESA, 650 g',
  'SADNI GRŠKI JOGURT 0 % m. m. vanilja, breskev ali kava, 3 x 150 g',
  'GRANOLA KLASIK sadje ali čokolada, 350 g',
  'JAJČNI MLINCI, 250 g',
  'SLOVENSKO RDEČE ZELJE',
  'COLA, 330 ml',
  'DELIKATESNE KISLE KUMARICE, 720 ml/670 g',
  'KMEČKI NAREZEK kmečka salama ali kmečki želodec, 100 g'
];

var FROM_9 = [
  'NAPOLITANKE latte macchiato, temna čokolada, mlečna čokolada ali mango, 300 g',
  'PANDORO S PISTACIJEVO KREMO, 750 g',
  'SADNI KRUH s 65 % sadnega deleža, 450 g',
  'ČOKOLADA S POMARANČO temna ali mlečna, 157 g',
  'VAFLJI KNOPPERS Black & White, jogurt ali arašidi, 8 x 25 g',
  'BOŽIČNI OBESEK s čokolado',
  'ČIČERIKINA MOKA BREZ GLUTENA, 500 g',
  'ŠIROKI JAJČNI REZANCI, 500 g',
  'BIO BASMATI RIŽ, 500 g',
  'KUHANE BELE TIGRASTE KOZICE, 500 g',
  'TURISTIČNA PAŠTETA, 3 x 95 g',
  'RIBJA SOLATA orada, 170 g',
  'KUHAN PRŠUT/PEČENA ŠUNKA',
  'MIE REZANCI klasični ali polnozrnati, 250 g',
  'KOKOSOV NAPITEK, 1 l',
  'ANANASOV SOK, 1 l',
  'CHIPSY DOMAĆINSKI sir ali kajmak, 145 g',
  'COCA COLA/FANTA več različnih okusov, 330 ml'
];

var FRESH = [
  'KOSTANJ, 500 g 2,99',
  'MOTOVILEC, 125 g 1,39',
  'KUMARA 0,75',
  'MANDARINE IZ DOLINE NERETVE 1,69/kg',
  'SLOVENSKI SLADKI KROMPIR 2,49/kg'
];

function deals(dayIso) {
  var text = fs.readFileSync(BRIEF, 'utf8');
  var shown = api.showText(text, dayIso);
  if (shown.kind !== 'deals') return [];
  return shown.lines.filter(function (line) { return /\d,\d{2}/.test(line); });
}

function one(lines, needle) {
  var hit = lines.filter(function (line) { return line.indexOf(needle) >= 0; });
  if (hit.length !== 1) return null;
  return hit[0];
}

function fail(msg) {
  console.error('FAIL: ' + msg);
  process.exitCode = 1;
}

var on12 = deals('2026-11-12');
var on13 = deals('2026-11-13');

FROM_4.forEach(function (name) {
  var line = one(on12, name);
  if (!line) fail('12.11. missing full name: ' + name);
  else if (line.indexOf(' od 4.11.') < 0) fail('12.11. ' + name + ' is not od 4.11.: ' + line);
  else if (/ do \d/.test(line)) fail('12.11. ' + name + ' has an end the leaflet does not print: ' + line);
});

FROM_9.forEach(function (name) {
  var line = one(on12, name);
  if (!line) fail('12.11. missing full name: ' + name);
  else if (line.indexOf(' od 9.11.') < 0) fail('12.11. ' + name + ' is not od 9.11.: ' + line);
  else if (line.indexOf(' do 14.11.') >= 0) fail('12.11. ' + name + ' still ends 14.11.: ' + line);
});

FRESH.forEach(function (exact) {
  if (on12.indexOf(exact) < 0) fail('12.11. fresh line changed: ' + exact);
});

var herbs12 = one(on12, 'ITALIJANSKA ZELIŠČA');
if (!herbs12) fail('12.11. herbs are hidden on their only day');
else if (herbs12.indexOf('v ca. 14-cm lončku') < 0) fail('12.11. herbs pack missing: ' + herbs12);
else if (herbs12.indexOf(' od 12.11. do 12.11.') < 0) fail('12.11. herbs are not only Thu 12.11.: ' + herbs12);

if (on13.some(function (line) { return line.indexOf('ITALIJANSKA ZELIŠČA') >= 0; })) {
  fail('13.11. herbs must be hidden, got: ' + on13.filter(function (line) {
    return line.indexOf('ITALIJANSKA ZELIŠČA') >= 0;
  }).join(' | '));
}

if (process.exitCode) process.exit(process.exitCode);
console.log('PASS: Hofer lines keep their own dates; herbs hidden on 2026-11-13; 6 names restored');
