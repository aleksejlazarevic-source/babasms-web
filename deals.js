/* The icon: one live store, the approved Lidl lines, no name (Aleksej, 9 Nov 2026).
   The date cut is babasms/message.py filter_published. The send day is
   web/tools/latest.py valid_send_day. */
(function (root) {
  'use strict';

  var PRICE = /\d,\d{2}/;
  var END_ON = / do (\d{1,2})\.(\d{1,2})\./;
  var START_ON = / od (\d{1,2})\.(\d{1,2})\./;
  var HEADER_SL = /od (\d{1,2})\.(\d{1,2})\. do (\d{1,2})\.(\d{1,2})\./;
  var HEADER_EN = /from (\d{1,2})\.(\d{1,2})\. to (\d{1,2})\.(\d{1,2})\./;
  /* Approved public files (T2.3). Her gist is not on this machine. */
  var PUBLIC = 'https://aleksejlazarevic-source.github.io/babasms-web/t/';
  /* Guess, 9 Nov 2026, until Aleksej writes these two lines. */
  var MISSING = 'Ta sveženj še ni na strani.';
  var OFFLINE = 'Stran ne more prenesti popustov.';
  var DAY = /^\d{4}-\d{2}-\d{2}$/;
  /* How many earlier send days the page looks back when a day's file is missing (T3.4b).
     Guess, 10 Nov 2026: two weeks of Monday and Thursday files. */
  var LOOK_BACK = 4;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function parseIso(iso) {
    var p = iso.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }

  function isoOf(d) {
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  function addDays(d, n) {
    return new Date(d.getTime() + n * 86400000); /* one day in ms */
  }

  function shortDate(d) {
    return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.';
  }

  function ljubljanaToday(now) {
    var fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return parseIso(fmt.format(now || new Date()));
  }

  function validSendDay(today) {
    var py = (today.getUTCDay() + 6) % 7; /* Monday is 0, as in Python */
    var thursday = addDays(today, -((py - 3 + 7) % 7));
    var monday = addDays(thursday, 4); /* Monday is 4 days after Thursday */
    return monday.getTime() <= today.getTime() ? monday : thursday;
  }

  function leafletDate(day, month, year, anchor) {
    var found = new Date(Date.UTC(year, +month - 1, +day));
    if (found.getTime() < addDays(anchor, -200).getTime()) { /* crossed into January; message.py */
      found = new Date(Date.UTC(year + 1, +month - 1, +day));
    }
    return found;
  }

  function liveStores(list) {
    return (list || []).filter(function (s) { return s && s.live === true; })
      .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  /* carried: the asked day's own file is missing and this is an earlier batch (T3.4b).
     Only lines whose own end day reaches the asked day are kept. */
  function showText(approved, dayIso, carried) {
    var today = parseIso(dayIso);
    var lines = approved.replace(/\n$/, '').split('\n');
    if (!lines.length || lines[0].trim() !== 'BABASMS1') throw new Error('no marker');
    var body = lines.slice(1);
    while (body.length && body[0] === '') body.shift();
    if (!body.length) throw new Error('no greeting');
    var greeting = body[0];
    var sl = HEADER_SL.exec(greeting);
    var en = HEADER_EN.exec(greeting);
    var found = sl || en;
    if (!found) throw new Error('no window');
    var windowStart = leafletDate(found[1], found[2], today.getUTCFullYear(), today);
    var windowEnd = leafletDate(found[3], found[4], today.getUTCFullYear(), windowStart);
    var carry = !!carried && today > windowEnd;
    if (today < windowStart || (today > windowEnd && !carry)) {
      return {kind: 'outside', lines: [
        'Ti popusti veljajo od ' + shortDate(windowStart) + ' do ' + shortDate(windowEnd)
      ]};
    }
    var lastEnd = windowStart;

    function keep(line) {
      if (!PRICE.test(line)) return true;
      var begun = START_ON.exec(line);
      var ended = END_ON.exec(line);
      var validFrom = begun ? leafletDate(begun[1], begun[2], today.getUTCFullYear(), windowStart) : windowStart;
      var validTo = ended ? leafletDate(ended[1], ended[2], today.getUTCFullYear(), windowStart) : windowEnd;
      var ok = validTo >= today && validFrom <= windowEnd;
      if (ok && validTo > lastEnd) lastEnd = validTo;
      return ok;
    }

    var kept = false;
    var out = [greeting];
    var section = [];
    var footer = '';

    function flush() {
      var any = section.some(function (line) { return PRICE.test(line); });
      if (any) {
        kept = true;
        if (out.length && out[out.length - 1] !== '') out.push('');
        out = out.concat(section);
      }
      section = [];
    }

    for (var i = 1; i < body.length; i++) {
      var line = body[i];
      if (line === '') continue;
      if (PRICE.test(line)) {
        if (keep(line)) section.push(line);
        continue;
      }
      if (section.length && line.toUpperCase() !== line) {
        flush();
        footer = line;
        continue;
      }
      flush();
      section.push(line);
    }
    flush();
    if (!kept && carry) return {kind: 'none', lines: [MISSING]};
    var startS = shortDate(today);
    /* A carried batch runs to its last kept line's end day, not past it. */
    var endS = shortDate(carry ? lastEnd : windowEnd);
    if (sl) out[0] = out[0].replace(HEADER_SL, 'od ' + startS + ' do ' + endS);
    else out[0] = out[0].replace(HEADER_EN, 'from ' + startS + ' to ' + endS);
    out[0] = out[0].replace('{IME}, ', '').replace('Babi, ', '');
    if (!kept) {
      var nxt = addDays(windowEnd, 1);
      var sentence;
      if (nxt.getUTCDay() === 1) {
        sentence = sl ? 'Danes ni več veljavnih Lidlovih popustov. Naslednji pridejo v ponedeljek.'
          : 'No Lidl deals are still on today. The next ones come on Monday.';
      } else if (nxt.getUTCDay() === 4) {
        sentence = sl ? 'Danes ni več veljavnih Lidlovih popustov. Naslednji pridejo v četrtek.'
          : 'No Lidl deals are still on today. The next ones come on Thursday.';
      } else {
        throw new Error('the next day is not a send day');
      }
      return {kind: 'empty', lines: [sentence]};
    }
    if (footer) out = out.concat(['', footer]);
    return {kind: 'deals', lines: out};
  }

  function fresh(url) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'fresh=' + Date.now();
  }

  function previousSendDay(dayIso) {
    return isoOf(validSendDay(addDays(parseIso(dayIso), -1)));
  }

  /* The asked day's file, or when it is missing the newest earlier batch, cut to the lines
     still valid on the asked day (T3.4b, 10 Nov 2026). CLAUDE.md: a missed morning does
     not leave the page empty. fetcher is window.fetch on the page and a fake in the test. */
  function loadBatch(dayIso, fetcher) {
    var missing = {kind: 'missing', lines: [MISSING]};
    function get(fileDay) {
      return fetcher(fresh(PUBLIC + fileDay + '/brief-sl.txt'), {cache: 'no-store'}).then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('fetch');
        return res.text();
      });
    }
    return get(dayIso).then(function (text) {
      if (text != null) return showText(text, dayIso);
      var fileDay = dayIso;
      var tries = 0;
      function earlier() {
        if (tries >= LOOK_BACK) return missing;
        tries += 1;
        fileDay = previousSendDay(fileDay);
        return get(fileDay).then(function (old) {
          if (old == null) return earlier();
          var shown = showText(old, dayIso, true);
          return shown.kind === 'deals' ? shown : missing;
        });
      }
      return earlier();
    });
  }

  function askedDay() {
    var q = new URLSearchParams(location.search).get('day');
    if (q && DAY.test(q)) return q;
    return isoOf(validSendDay(ljubljanaToday(new Date())));
  }

  function show(lines) {
    document.getElementById('text').textContent = lines.join('\n');
  }

  function showDeals(name) {
    document.getElementById('list').hidden = true;
    document.getElementById('store').hidden = false;
    document.getElementById('store').textContent = name;
    document.getElementById('text').hidden = false;
    document.getElementById('back').hidden = false;
  }

  function showList(stores) {
    var list = document.getElementById('list');
    list.hidden = false;
    list.textContent = '';
    stores.forEach(function (store) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = store.name;
      b.addEventListener('click', function () { openStore(store); });
      list.appendChild(b);
    });
    document.getElementById('store').hidden = true;
    document.getElementById('text').hidden = true;
    document.getElementById('back').hidden = true;
  }

  function openStore(store) {
    showDeals(store.name);
    if (store.id !== 'lidl') {
      show([MISSING]); /* only Lidl's approved file is read in this version */
      return;
    }
    loadBatch(askedDay(), fetch.bind(root)).then(function (shown) {
      show(shown.lines);
    }).catch(function () { show([OFFLINE]); });
  }

  function start() {
    var back = document.getElementById('back');
    /* page/deals.html in this repo sits one folder below t2/. On babasms-web the
       same file is the site root, beside t2/. (Aleksej, 10 Nov 2026.) */
    var storesUrl = /\/page\/[^/]*$/.test(location.pathname) ? '../t2/stores.json' : 't2/stores.json';
    fetch(fresh(storesUrl), {cache: 'no-store'}).then(function (res) {
      if (!res.ok) throw new Error('stores');
      return res.json();
    }).then(liveStores).catch(function () {
      return [{id: 'lidl', name: 'Lidl', live: true, order: 1}];
    }).then(function (stores) {
      if (!stores.length) stores = [{id: 'lidl', name: 'Lidl', live: true, order: 1}];
      back.addEventListener('click', function () { showList(stores); });
      if (stores.length === 1) openStore(stores[0]);
      else showList(stores);
    });
  }

  var api = {
    showText: showText, loadBatch: loadBatch, validSendDay: validSendDay, ljubljanaToday: ljubljanaToday,
    isoOf: isoOf, liveStores: liveStores, MISSING: MISSING, OFFLINE: OFFLINE, PUBLIC: PUBLIC
  };
  root.KinDealsPage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && document.getElementById('text')) start();
})(typeof window !== 'undefined' ? window : globalThis);
