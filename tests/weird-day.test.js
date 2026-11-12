'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const api = require(path.join(__dirname, '../site/deals.js'));

const LJ = 'Europe/Ljubljana';

function pad(n) {
  return (n < 10 ? '0' : '') + n;
}

/** Wall clock in Ljubljana as a real Date (faked phone instant). */
function instantLjubljana(year, month, day, hour, minute) {
  const lo = Date.UTC(year, month - 1, day, 0, 0) - 4 * 3600000;
  const hi = Date.UTC(year, month - 1, day, 23, 59) + 4 * 3600000;
  for (let t = lo; t <= hi; t += 60_000) {
    const cand = new Date(t);
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: LJ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
        .formatToParts(cand)
        .filter((p) => p.type !== 'literal')
        .map((p) => [p.type, p.value])
    );
    if (
      Number(parts.year) === year &&
      Number(parts.month) === month &&
      Number(parts.day) === day &&
      Number(parts.hour) === hour &&
      Number(parts.minute) === minute
    ) {
      return cand;
    }
  }
  return null;
}

function ljDay(now) {
  return api.isoOf(api.ljubljanaToday(now));
}

function priced(lines) {
  return (lines || []).filter((line) => /\d,\d{2}/.test(line));
}

function show(approved, dayIso, carried) {
  return api.showText(approved, dayIso, carried);
}

const LIDL_HEADER = (from, to) =>
  `Babi, to so Lidlovi popusti za kuhanje od ${from} do ${to}:`;

function lidlBrief(from, to, bodyLines) {
  return ['BABASMS1', LIDL_HEADER(from, to), '', ...bodyLines].join('\n');
}

test('Ljubljana calendar day at 23:59 and 00:00 (NYE)', () => {
  const late = instantLjubljana(2026, 12, 31, 23, 59);
  const early = instantLjubljana(2027, 1, 1, 0, 0);
  assert.ok(late && early, 'both instants exist');
  assert.equal(ljDay(late), '2026-12-31');
  assert.equal(ljDay(early), '2027-01-01');
});

test('deal with do 31.12. is still valid at 23:59 Ljubljana, gone after midnight', () => {
  const brief = lidlBrief('31.12.', '31.12.', [
    'MESO',
    'Kruh z mesom 2,49 (3,49) do 31.12.',
  ]);
  const lastMinute = show(brief, ljDay(instantLjubljana(2026, 12, 31, 23, 59)));
  const nextDay = show(brief, ljDay(instantLjubljana(2027, 1, 1, 0, 0)));
  assert.equal(lastMinute.kind, 'deals');
  assert.ok(priced(lastMinute.lines).some((l) => l.includes('do 31.12.')));
  assert.notEqual(nextDay.kind, 'deals');
});

test('year-span leaflet still valid on 1 Jan (30.12.–2.1.)', {
  todo: 'showText marks 1 Jan outside a 30.12.–2.1. window',
}, () => {
  const brief = lidlBrief('30.12.', '2.1.', [
    'PEKARNA',
    'Palačinke 1,99 (2,49)',
    'Rogovček 0,99 (1,49) do 31.12.',
  ]);
  assert.equal(show(brief, '2026-12-31').kind, 'deals');
  const got = show(brief, '2027-01-01');
  assert.equal(got.kind, 'deals');
  assert.ok(priced(got.lines).length > 0);
});

test('line whose until day is today stays in the list', () => {
  const brief = lidlBrief('10.11.', '12.11.', [
    'SADJE',
    'Mandarina 1,69/kg (2,19/kg) do 12.11.',
  ]);
  const onLast = show(brief, '2026-11-12');
  assert.equal(onLast.kind, 'deals');
  assert.equal(
    priced(onLast.lines).filter((l) => l.includes('do 12.11.')).length,
    1
  );
});

test('DST spring (last Sunday of March): Ljubljana day at 23:59 and 00:00', () => {
  const before = instantLjubljana(2026, 3, 28, 23, 59);
  const after = instantLjubljana(2026, 3, 29, 0, 0);
  assert.ok(before && after);
  assert.equal(ljDay(before), '2026-03-28');
  assert.equal(ljDay(after), '2026-03-29');
});

test('DST fall (last Sunday of October): Ljubljana day at 23:59 and 00:00', () => {
  const before = instantLjubljana(2026, 10, 24, 23, 59);
  const after = instantLjubljana(2026, 10, 25, 0, 0);
  assert.ok(before && after);
  assert.equal(ljDay(before), '2026-10-24');
  assert.equal(ljDay(after), '2026-10-25');
});

test('on DST transition Sunday, same leaflet rules as any other day', () => {
  const brief = lidlBrief('28.3.', '30.3.', ['DEZERT', 'Torta 4,99 (5,99) do 30.3.']);
  const march29 = show(brief, '2026-03-29');
  assert.equal(march29.kind, 'deals');
  const briefOct = lidlBrief('24.10.', '26.10.', ['DEZERT', 'Torta 4,99 (5,99) do 26.10.']);
  const oct25 = show(briefOct, '2026-10-25');
  assert.equal(oct25.kind, 'deals');
});

test('Sunday with no new leaflet: carried batch hides expired lines', () => {
  const brief = lidlBrief('10.11.', '14.11.', ['MESO', 'Kare 3,39 (4,29) do 14.11.']);
  assert.equal(show(brief, '2026-11-15', true).kind, 'none');
  assert.equal(show(brief, '2026-11-15', false).kind, 'outside');
});

test('Sunday loadBatch falls back to Thursday file, not empty', () => {
  const lidlPath = path.join(__dirname, '../t/2026-11-12/brief-sl.txt');
  const text = fs.readFileSync(lidlPath, 'utf8');
  const store = { id: 'lidl', days: ['mon', 'thu'] };
  return api
    .loadBatch(
      '2026-11-15',
      (url) => {
        if (url.includes('/2026-11-15/')) {
          return Promise.resolve({ status: 404, ok: false });
        }
        if (url.includes('/2026-11-12/')) {
          return Promise.resolve({
            status: 200,
            ok: true,
            text: () => Promise.resolve(text),
          });
        }
        return Promise.resolve({ status: 404, ok: false });
      },
      store
    )
    .then((got) => {
      assert.equal(got.kind, 'deals');
      assert.ok(priced(got.lines).length > 0);
    });
});

test('wrong calendar year on 31 Dec still shows do 2.1. inside Dec–Jan window', () => {
  const brief = lidlBrief('29.12.', '2.1.', ['KOS', 'Olje 5,99 (6,99) do 2.1.']);
  const got = show(brief, '2025-12-31');
  assert.equal(got.kind, 'deals');
  assert.ok(priced(got.lines).some((l) => l.includes('do 2.1.')));
});

test('wrong calendar year on 1 Jan after Dec–Jan leaflet (29.12.–2.1.)', {
  todo: 'dayIso 2027-01-01 is outside 29.12.–2.1. because windowStart uses that year',
}, () => {
  const brief = lidlBrief('29.12.', '2.1.', ['KOS', 'Olje 5,99 (6,99) do 2.1.']);
  const got = show(brief, '2027-01-01');
  assert.equal(got.kind, 'deals');
  assert.ok(priced(got.lines).some((l) => l.includes('do 2.1.')));
});

test('must not show a deal whose until day has passed', () => {
  const brief = lidlBrief('10.11.', '18.11.', [
    'MESO',
    'Star 1,99 (2,49) do 12.11.',
    'Nov 1,99 (2,49) od 16.11.',
  ]);
  const on16 = show(brief, '2026-11-16');
  assert.equal(on16.kind, 'deals');
  const lines = priced(on16.lines);
  assert.ok(!lines.some((l) => l.includes('Star')));
  assert.ok(lines.some((l) => l.includes('Nov')));
});
