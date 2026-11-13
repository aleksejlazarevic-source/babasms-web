'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

/* Live t/<store>/<day>/brief-sl.txt, any day the tree publishes.
   showText keeps a priced line for that directory day only when the line is
   dated through the day: its own printed end (do, a range, or samo) is that
   day or later, or the line sits under "N) VELJA a–b" / "VELJA a–b" with
   a ≤ day ≤ b. A "ŠE NE VELJA" header must not cover the day. A line with
   no printed end and no such header takes the leaflet window; showText
   already drops it when that window does not include the day (Lidl, Hofer,
   E.Leclerc). The directory name is the day. Nothing here reads the clock. */
const api = require(path.join(__dirname, '../site/deals.js'));
const ROOT = path.join(__dirname, '..', 't');
const PRICE = /\d,\d{2}/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HEADER = /^\s*(?:\d+\)\s*)?VELJA\s+(\d{1,2})\.(?:\s*(\d{1,2})\.)?\s*[–—-]\s*(\d{1,2})\.(?:\s*(\d{1,2})\.)?/i;

function parseIso(iso) {
  const p = iso.split('-');
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
}

function isoOf(d) {
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

function briefs() {
  const out = [];
  for (const store of fs.readdirSync(ROOT)) {
    const storePath = path.join(ROOT, store);
    if (!fs.statSync(storePath).isDirectory()) continue;
    for (const day of fs.readdirSync(storePath)) {
      if (!DAY.test(day)) continue;
      const file = path.join(storePath, day, 'brief-sl.txt');
      if (fs.existsSync(file)) out.push({store, day, file, rel: path.posix.join('t', store, day, 'brief-sl.txt')});
    }
  }
  out.sort((a, b) => a.rel.localeCompare(b.rel));
  return out;
}

/* Printed end only. "od D.M." names a start; the leaflet window is not an end on the line. */
function printedEnd(line, anchor) {
  const span = api.readSpan(line, anchor, null, null);
  if (!span) return null;
  if (span.token === 'do' || span.token === 'range' || span.token === 'samo') return span.to;
  return null;
}

function veljaHeader(line, anchor) {
  const preview = /ŠE NE VELJA/.test(line);
  const m = HEADER.exec(line);
  if (!m) return preview ? {preview: true, from: null, to: null, raw: line} : null;
  const startMonth = m[2] || m[4];
  const endMonth = m[4] || m[2];
  if (!startMonth || !endMonth) return {preview, from: null, to: null, raw: line};
  const span = api.readSpan(
    'od ' + m[1] + '.' + startMonth + '. do ' + m[3] + '.' + endMonth + '.',
    anchor,
    null,
    null
  );
  if (!span || !span.from || !span.to) return {preview, from: null, to: null, raw: line};
  return {preview, from: span.from, to: span.to, raw: line};
}

function covers(header, day) {
  if (!header.from || !header.to) return true;
  return header.from.getTime() <= day.getTime() && day.getTime() <= header.to.getTime();
}

function check(brief) {
  const problems = [];
  const text = fs.readFileSync(brief.file, 'utf8');
  const day = parseIso(brief.day);
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  let header = null;
  const priced = [];
  for (const line of lines) {
    const next = veljaHeader(line, day);
    if (next) {
      header = next;
      if (next.preview && covers(next, day)) {
        problems.push(brief.rel + ': ŠE NE VELJA covers ' + brief.day + ': ' + line);
      }
      continue;
    }
    if (!PRICE.test(line)) continue;
    const end = printedEnd(line, day);
    if (end && end.getTime() < day.getTime()) {
      problems.push(brief.rel + ': ends ' + isoOf(end) + ' before ' + brief.day + ': ' + line);
    }
    priced.push({line, header, end});
  }

  let shown;
  try {
    shown = api.showText(text, brief.day);
  } catch (err) {
    problems.push(brief.rel + ': showText: ' + err.message);
    return problems;
  }
  if (!shown || shown.kind !== 'deals') {
    problems.push(brief.rel + ': showText kind ' + (shown && shown.kind));
    return problems;
  }
  const kept = shown.lines.filter((line) => PRICE.test(line));
  let k = 0;
  for (const src of priced) {
    if (k >= kept.length || kept[k] !== src.line) continue;
    const ownOk = src.end && src.end.getTime() >= day.getTime();
    const block = src.header && !src.header.preview ? src.header : null;
    if (src.header && src.header.preview && covers(src.header, day)) {
      problems.push(brief.rel + ': showText keeps a ŠE NE VELJA line on ' + brief.day + ': ' + src.line);
    } else if (block && !covers(block, day) && !ownOk) {
      problems.push(brief.rel + ': showText keeps a line under ' + block.raw + ' on ' + brief.day + ': ' + src.line);
    }
    k += 1;
  }
  if (k !== kept.length) {
    problems.push(brief.rel + ': showText kept ' + kept.length + ' priced lines, matched ' + k);
  }
  return problems;
}

test('every live day brief keeps only offers dated through that day', () => {
  const found = briefs();
  assert.ok(found.length > 0, 'no t/<store>/<day>/brief-sl.txt');
  const problems = found.flatMap(check);
  assert.equal(problems.join('\n'), '');
});
