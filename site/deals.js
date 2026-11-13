/* The icon: Lidl's approved lines, one store on the screen, no name (Aleksej, 9 Nov 2026).
   The look is the shelf price tag (Aleksej approved Fable's page, 10 Nov 2026).
   Lidl stays live. Spar is live. Tuš, Hofer and E.Leclerc say kmalu until a leaflet recheck signs them off (t807u).
   A private preview parameter opens one kmalu store the way it would look live. The page reads it and never writes it into a link.
   The page hides a line that is not valid on the viewer's today. The pipeline has its own cut.
   The send day follows store.days. */
(function (root) {
  'use strict';

  var PRICE = /\d,\d{2}/;
  /* A brief line's own dates (D8). Same four forms as babasms/message.py. */
  var SAMO_ON = / samo (\d{1,2})\.(\d{1,2})\./;
  var RANGE_ON = / od (\d{1,2})\.(\d{1,2})\. do (\d{1,2})\.(\d{1,2})\./;
  var END_ON = / do (\d{1,2})\.(\d{1,2})\./;
  var START_ON = / od (\d{1,2})\.(\d{1,2})\./;
  var HEADER_SL = /od (\d{1,2})\.(\d{1,2})\. do (\d{1,2})\.(\d{1,2})\./;
  var HEADER_EN = /from (\d{1,2})\.(\d{1,2})\. to (\d{1,2})\.(\d{1,2})\./;
  /* Approved public files (T2.3). Her gist is not on this machine. */
  var PUBLIC = 'https://aleksejlazarevic-source.github.io/babasms-web/t/';
  /* The words on the screen that are not deal lines. Aleksej approved these with the look, 10 Nov 2026. */
  var MISSING = 'Novih popustov še\u00a0ni.'; /* the last two words stay on one line */
  var OFFLINE = 'Popustov ni mogoče naložiti.';
  var OFFLINE_HOW = 'Preverite, ali ima telefon internet.';
  var LATER = 'Poglejte malo pozneje.';
  var RETRY = 'Poskusi znova';
  var RETRYING = 'Preverjam …';
  var CHECKED = 'Preverjeno ob ';
  var STORES = 'Trgovine';
  var SHUT = 'še ni na voljo';
  /* "od ponedeljka", "od četrtka": Sunday is 0, as in getUTCDay. */
  var WEEKDAY_FROM = ['nedelje', 'ponedeljka', 'torka', 'srede', 'četrtka', 'petka', 'sobote'];
  /* Used only when the file probe cannot run (no network). A published store is one whose file answered. */
  var READABLE = {lidl: true};
  /* Shown when stores.json cannot be read. Same ids, live and days as t2/stores.json. */
  var KNOWN = [
    {id: 'lidl', name: 'Lidl', days: ['mon', 'thu'], live: true, order: 1},
    {id: 'tus', name: 'Tuš', days: ['wed', 'fri'], live: true, order: 2, card: true},
    {id: 'hofer', name: 'Hofer', days: ['mon', 'thu'], live: false, soon: true, order: 3},
    {id: 'spar', name: 'Spar', days: ['wed'], live: true, order: 4},
    {id: 'leclerc', name: 'E.Leclerc', days: ['wed'], live: false, soon: true, order: 5},
    {id: 'mercator', name: 'Mercator', days: ['wed'], live: false, soon: true, order: 6}
  ];
  /* Coming back to the icon asks the network again after this long. One minute is a guess, 9 Nov 2026. */
  var STALE_MS = 60000;
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

  var DAY_NAME = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  function validSendDay(today, store) {
    var names = store && store.days && store.days.length ? store.days : null;
    if (!names) {
      var py0 = (today.getUTCDay() + 6) % 7; /* Monday is 0, as in Python */
      var thursday = addDays(today, -((py0 - 3 + 7) % 7));
      var monday = addDays(thursday, 4); /* Monday is 4 days after Thursday */
      return monday.getTime() <= today.getTime() ? monday : thursday;
    }
    for (var back = 0; back < 7; back++) {
      var day = addDays(today, -back);
      if (names.indexOf(DAY_NAME[(day.getUTCDay() + 6) % 7]) >= 0) return day;
    }
    return today;
  }

  function leafletDate(day, month, year, anchor) {
    var found = new Date(Date.UTC(year, +month - 1, +day));
    if (found.getTime() < addDays(anchor, -200).getTime()) { /* crossed into January; message.py */
      found = new Date(Date.UTC(year + 1, +month - 1, +day));
    } else if (found.getTime() > addDays(anchor, 200).getTime()) { /* December, read after New Year */
      found = new Date(Date.UTC(year - 1, +month - 1, +day));
    }
    return found;
  }

  function liveStores(list) {
    return (list || []).filter(function (s) { return s && s.live === true; })
      .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  /* carried: the asked day's own file is missing and this is an earlier batch (T3.4b).
     A line is shown on the viewer's today when that day is inside its own dates.
     No token means the leaflet's first morning through its last day.
     "od D.M." starts that morning. "do D.M." ends that day.
     "od D.M. do D.M." ends on the do date. "samo D.M." is that one day.
     Once that last day is past, a carried file keeps only a line with its own later end. */
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

    /* Leftmost token wins. A range starts where "od" does, so the longer form wins that tie. */
    function spanOf(line) {
      var year = today.getUTCFullYear();
      var found = [
        {m: SAMO_ON.exec(line), kind: 'samo', rank: 0},
        {m: RANGE_ON.exec(line), kind: 'range', rank: 1},
        {m: START_ON.exec(line), kind: 'od', rank: 2},
        {m: END_ON.exec(line), kind: 'do', rank: 3}
      ];
      var best = null;
      for (var i = 0; i < found.length; i++) {
        var item = found[i];
        if (!item.m) continue;
        if (!best || item.m.index < best.m.index ||
            (item.m.index === best.m.index && item.rank < best.rank)) best = item;
      }
      if (!best) return {from: windowStart, to: windowEnd, ownEnd: false};
      if (best.kind === 'samo') {
        var one = leafletDate(best.m[1], best.m[2], year, windowStart);
        return {from: one, to: one, ownEnd: true};
      }
      if (best.kind === 'range') {
        return {
          from: leafletDate(best.m[1], best.m[2], year, windowStart),
          to: leafletDate(best.m[3], best.m[4], year, windowStart),
          ownEnd: true
        };
      }
      if (best.kind === 'od') {
        return {
          from: leafletDate(best.m[1], best.m[2], year, windowStart),
          to: windowEnd,
          ownEnd: false
        };
      }
      return {
        from: windowStart,
        to: leafletDate(best.m[1], best.m[2], year, windowStart),
        ownEnd: true
      };
    }

    function keep(line) {
      if (!PRICE.test(line)) return true;
      var span = spanOf(line);
      /* Past the leaflet, a carried line with no end day ended with the leaflet. */
      if (carry && !span.ownEnd) return false;
      var ok = span.to >= today && span.from <= today;
      if (ok && span.to > lastEnd) lastEnd = span.to;
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

    var hideBatch = false;
    for (var i = 1; i < body.length; i++) {
      var line = body[i];
      if (line === '') continue;
      /* A preview batch header hides its own deals until the next batch header.
         A loose internal line is dropped on its own. */
      if (isInternal(line)) {
        if (isValidity(line) || /^\s*\d+\)/.test(line)) hideBatch = true;
        continue;
      }
      if (hideBatch) {
        if (isValidity(line) || /^\s*\d+\)/.test(line)) hideBatch = false;
        continue;
      }
      if (PRICE.test(line)) {
        if (keep(line)) section.push(line);
        continue;
      }
      if (isValidity(line)) continue;
      /* "Babi, …" is the preamble. The greeting already names the store. */
      if (line.indexOf('Babi,') === 0) continue;
      if (isHeading(line)) {
        flush();
        section.push(line);
        continue;
      }
      flush();
      footer = line;
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
    /* until is the last day this draw already worked out: the leaflet end, or the
       carried batch's last kept day. lines and kind stay as they were. */
    return {kind: 'deals', lines: out, until: isoOf(carry ? lastEnd : windowEnd)};
  }

  function fresh(url) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'fresh=' + Date.now();
  }

  function previousSendDay(dayIso, store) {
    return isoOf(validSendDay(addDays(parseIso(dayIso), -1), store));
  }

  function fileUrl(store, fileDay) {
    if (store && store.id) return PUBLIC + store.id + '/' + fileDay + '/brief-sl.txt';
    return PUBLIC + fileDay + '/brief-sl.txt';
  }

  /* The asked day's file, or when it is missing the newest earlier batch, cut to the lines
     still valid on the asked day (T3.4b, 10 Nov 2026). CLAUDE.md: a missed morning does
     not leave the page empty. fetcher is window.fetch on the page and a fake in the test. */
  function loadBatch(dayIso, fetcher, store) {
    var missing = {kind: 'missing', lines: [MISSING]};
    /* A 404 is "this day was not published". A 503 is the same question offline:
       the service worker has no saved copy of that file, so it cannot be a 404.
       Friday asks for Friday's file, which was never a send day, then has to
       walk back to Thursday's saved brief. Giving up on the 503 hides that brief.
       sawDown stays set so a phone with nothing saved still says it is offline,
       not that the week is missing. */
    var sawDown = false;
    function get(url) {
      return fetcher(fresh(url), {cache: 'no-store'}).then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) {
          sawDown = true;
          return null;
        }
        return res.text();
      }, function () {
        sawDown = true;
        return null;
      });
    }
    function getDay(fileDay) {
      return get(fileUrl(store, fileDay)).then(function (text) {
        if (text != null || !store || store.id !== 'lidl') return text;
        return get(PUBLIC + fileDay + '/brief-sl.txt');
      });
    }
    return getDay(dayIso).then(function (text) {
      if (text != null) return showText(text, dayIso);
      var fileDay = dayIso;
      var tries = 0;
      function earlier() {
        if (tries >= LOOK_BACK) {
          if (sawDown) return {kind: 'offline', lines: [OFFLINE]};
          return missing;
        }
        tries += 1;
        fileDay = previousSendDay(fileDay, store);
        return getDay(fileDay).then(function (old) {
          if (old == null) return earlier();
          var shown = showText(old, dayIso, true);
          return shown.kind === 'deals' ? shown : missing;
        });
      }
      return earlier();
    });
  }

  function pageSearch() {
    if (typeof location === 'undefined' || !location || location.search == null) return '';
    return location.search;
  }

  /* The preview parameter names one hidden store. A live id, or one that is not
     in the list, is ignored so the page stays as it is. */
  function askedPreview() {
    var q = new URLSearchParams(pageSearch()).get('preview');
    return q == null ? '' : q;
  }

  function previewTarget(list) {
    var id = askedPreview();
    if (!id) return null;
    var found = (list || []).filter(function (s) {
      return s && s.id === id && s.soon === true && s.live !== true;
    });
    return found.length === 1 ? found[0] : null;
  }

  function queryDay() {
    var q = new URLSearchParams(pageSearch()).get('day');
    return (q && DAY.test(q)) ? q : '';
  }

  function askedDay() {
    /* The morning in Ljubljana, not the send day. A line that starts Friday is
       hidden on Thursday and shown on Friday. Sunday drops a line that ended
       Saturday. The file is still the send day's: loadBatch looks back.
       A future ?day= would open Monday's list before Monday. Only today or a
       past morning is accepted. Anything later is the same as no query. */
    var today = isoOf(ljubljanaToday(new Date()));
    var q = queryDay();
    if (q && q <= today) return q;
    return today;
  }

  function byOrder(list) {
    return (list || []).filter(function (s) { return s && s.id && s.name; })
      .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  /* She can open a store when he has set it live, or when this page's private
     preview names that kmalu store, and this page can read its file. */
  function canOpen(store, files) {
    if (!store) return false;
    if (liveStores([store]).length !== 1 && !previewTarget([store])) return false;
    if (files) return files[store.id] === true;
    if (store && Object.prototype.hasOwnProperty.call(store, 'readable')) return store.readable === true;
    return READABLE[store.id] === true;
  }

  /* What to draw for one answer from the network. The deal lines are showText's, unchanged. */
  function viewOf(got, dayIso) {
    if (got.kind === 'deals') return {type: 'deals', lines: got.lines, until: got.until};
    if (got.kind === 'missing') {
      var d = parseIso(dayIso);
      return {type: 'message', title: MISSING, body:
        'Popusti od ' + WEEKDAY_FROM[d.getUTCDay()] + ', ' + shortDate(d) + ', še niso na strani. ' + LATER};
    }
    if (got.kind === 'offline') return {type: 'message', title: OFFLINE, body: OFFLINE_HOW};
    if (got.kind === 'outside') return {type: 'message', title: MISSING, body: got.lines.join(' ')};
    if (got.kind === 'none') return {type: 'message', title: MISSING, body: LATER};
    /* 'empty': "Danes ni več veljavnih … Naslednji pridejo v …" The first sentence is the heading. */
    var text = got.lines.join(' ');
    var cut = text.indexOf('. ');
    if (cut < 0) return {type: 'message', title: text, body: ''};
    return {type: 'message', title: text.slice(0, cut + 1), body: text.slice(cut + 2)};
  }

  /* "velja" as its own word. "veljajo" is a sentence, not a second date. */
  var INTERNAL = /samo za pregled|not valid|preview/i;
  var RANGE_ONLY = /^\s*\d{1,2}\.(\s*\d{1,2}\.)?(\s*\d{4})?\s*[–—-]\s*\d{1,2}\.\s*\d{1,2}\.(\s*\d{4})?\s*$/;

  function isInternal(line) {
    return INTERNAL.test(line);
  }

  function isValidity(line) {
    if (PRICE.test(line)) return false;
    return /velja(?![a-z])/i.test(line) || RANGE_ONLY.test(line);
  }

  function isHeading(line) {
    var t = line.trim();
    if (PRICE.test(t) || isInternal(t) || isValidity(t)) return false;
    if (t.toLowerCase() === t.toUpperCase()) return false;
    if (t.charAt(0) === '+' || /[.!?]$/.test(t)) return false;
    if (t.toUpperCase() === t) return true;
    return t.split(/\s+/).length <= 5; /* five words: guess, 11 Nov 2026, so Hofer's title lines count */
  }

  /* One of: first line, section name, deal line, store note. Blank lines are spacing, drawn by the CSS. */
  function kindOf(line, index) {
    if (index === 0) return 'greeting';
    if (PRICE.test(line)) return 'deal';
    return isHeading(line) ? 'section' : 'note';
  }

  function clock(now) {
    return now.getHours() + ':' + pad(now.getMinutes());
  }

  function $(id) { return document.getElementById(id); }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  var stores = [];
  var current = null; /* the store on the screen, or null on the list */
  var shown = '';     /* what is drawn now, so the same lines are not drawn twice */
  var lastLoad = 0;
  /* The screen stays awake while a leaflet is open. Nazaj, or the page going
     into the background, lets the phone lock. A phone without wakeLock, or a
     request it refuses, changes nothing on the screen. (Aleksej, 12 Nov 2026.) */
  var screenLock = null;
  var screenGen = 0;
  var screenAsked = false;
  /* preview.html sets data-list="1". deals.html does not, and then nothing is stored. */
  var LIST_ON = typeof document !== 'undefined' && document.body
    ? document.body.getAttribute('data-list') === '1' : false;
  var picks = null;
  var batchUntil = null;
  var placeBook = null;
  var placeOn = false;   /* false while a resume must not overwrite her place */
  var placeTimer = 0;
  var resumeHold = false;
  var resumeName = '';
  var drawnDay = '';
  var PLACE_MS = 250; /* guess: how often a scroll may write her place */

  function tickBook() {
    if (!picks) picks = root.KinDealsPicks.open(root.localStorage);
    return picks;
  }

  function placeApi() {
    if (!placeBook) placeBook = root.KinDealsPlace.open(root.localStorage);
    return placeBook;
  }

  function storeById(id) {
    var i;
    for (i = 0; i < stores.length; i++) {
      if (stores[i].id === id) return stores[i];
    }
    return null;
  }

  /* A live store whose file answered, or one the network could not check.
     A 404 is not openable. probeError is set only after a failed fetch. */
  function fileReady(store) {
    if (store && store.probeError === true && liveStores([store]).length === 1) return true;
    return canOpen(store);
  }

  function untilOf(storeId) {
    var raw;
    var data;
    try {
      raw = root.localStorage.getItem('kindeals.picks');
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    try {
      data = JSON.parse(raw);
    } catch (e2) {
      return null;
    }
    if (!data || !data.stores || !data.stores[storeId]) return null;
    return data.stores[storeId].until;
  }

  function sectionName() {
    var nodes = document.querySelectorAll('#text h2.section');
    var headings = [];
    var i;
    var bar = $('bar');
    var bottom = bar ? bar.getBoundingClientRect().bottom : 0;
    for (i = 0; i < nodes.length; i++) {
      headings.push({text: nodes[i].textContent, top: nodes[i].getBoundingClientRect().top});
    }
    return root.KinDealsPlace.sectionAt(headings, bottom);
  }

  function savePlace() {
    if (!LIST_ON || !placeOn || resumeHold || !current) return;
    placeApi().save(current.id, sectionName(), askedDay());
  }

  function onPlaceScroll() {
    if (!LIST_ON || !placeOn || resumeHold || !current) return;
    if (placeTimer) return;
    placeTimer = setTimeout(function () {
      placeTimer = 0;
      savePlace();
    }, PLACE_MS);
  }

  /* Put that section's heading flush with the underside of the bar.
     Returns false when the heading is not on the page. */
  function scrollSectionUnderBar(name) {
    var nodes = document.querySelectorAll('#text h2.section');
    var i;
    var node = null;
    var bar;
    var delta;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].textContent === name) {
        node = nodes[i];
        break;
      }
    }
    if (!node) return false;
    bar = $('bar').getBoundingClientRect().bottom;
    delta = node.getBoundingClientRect().top - bar;
    window.removeEventListener('scroll', onPlaceScroll);
    window.scrollTo(0, window.scrollY + delta);
    setTimeout(listenForPlace, PLACE_MS);
    return true;
  }

  function listenForPlace() {
    if (window.removeEventListener) window.removeEventListener('scroll', onPlaceScroll);
    if (LIST_ON) window.addEventListener('scroll', onPlaceScroll);
  }

  function settleResume(view) {
    var name;
    var found;
    if (!resumeHold) return;
    if (view.type !== 'deals') {
      /* The load failed. Her place stays as it was. Poskusi znova still
         scrolls to this section, and saving starts only after that scroll. */
      placeOn = false;
      return;
    }
    name = resumeName;
    resumeName = '';
    found = !name || scrollSectionUnderBar(name);
    if (!found) {
      resumeHold = false;
      placeOn = false;
      return;
    }
    resumeHold = false;
    placeOn = true;
  }

  function euroUnit(numeral, unit) {
    var text = root.KinDealsPrice.euro(numeral);
    if (unit === '/kg') text += '/kg';
    return text;
  }

  function markLine(line, on) {
    var rows = document.querySelectorAll('#text .pick');
    var i;
    for (i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-line') === line) {
        rows[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
  }

  function clearSum() {
    var bar = $('sum');
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    if (document.body) document.body.classList.remove('has-sum');
  }

  function paintSum() {
    var tot;
    var bar;
    var text;
    clearSum();
    if (!LIST_ON || !current || !picks) return;
    tot = picks.total(current.id);
    if (!tot.count) return;
    text = 'Moj seznam: ' + tot.count;
    if (tot.unsummed < tot.count) {
      text += ' · Skupaj ' + root.KinDealsPrice.euroCents(tot.cents);
    }
    if (tot.unsummed > 0) text += ' · ' + tot.unsummed + ' brez seštevka';
    bar = el('p', null, text);
    bar.id = 'sum';
    document.body.appendChild(bar);
    document.body.classList.add('has-sum');
  }

  function shownDeals(lines) {
    var out = [];
    var i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i] === '') continue;
      if (i > 0 && isInternal(lines[i])) continue;
      if (kindOf(lines[i], i) === 'deal') out.push(lines[i]);
    }
    return out;
  }

  function pickRow(line, store, keep) {
    var parsed = root.KinDealsPrice.parse(line);
    var cents = parsed ? root.KinDealsPrice.summable(parsed) : null;
    var row = document.createElement('button');
    var cost;
    var was;
    var whenText;
    var nowNum;
    var nowUnit;
    if (!store) store = current;
    row.type = 'button';
    row.className = 'deal pick';
    row.setAttribute('data-line', line);
    row.setAttribute('aria-pressed', tickBook().has(store.id, line) ? 'true' : 'false');
    row.appendChild(el('span', 'tick'));
    if (!parsed) {
      row.appendChild(el('span', 'what', line));
      if (store && store.card === true) row.appendChild(el('span', 'who', 's kartico'));
    } else {
      row.appendChild(el('span', 'what', parsed.name));
      cost = el('span', 'cost');
      nowNum = parsed.who === 'voucher' ? parsed.till : parsed.now;
      nowUnit = parsed.who === 'voucher' ? '' : parsed.nowUnit;
      cost.appendChild(el('span', 'now', euroUnit(nowNum, nowUnit)));
      if (parsed.was && parsed.who !== 'voucher') {
        was = el('s', 'was');
        was.appendChild(el('span', null, 'prej '));
        was.appendChild(document.createTextNode(euroUnit(parsed.was, parsed.wasUnit)));
        cost.appendChild(was);
      }
      if (parsed.who === 'plus') cost.appendChild(el('span', 'who', 'z Lidl Plus'));
      if (parsed.who === 'voucher') {
        cost.appendChild(el('span', 'who', 'z bonom ' + root.KinDealsPrice.euro(parsed.now)));
      }
      if (store && store.card === true) cost.appendChild(el('span', 'who', 's kartico'));
      whenText = parsed.when || '';
      if (parsed.cond) whenText = whenText ? whenText + ', ' + parsed.cond : parsed.cond;
      if (whenText) cost.appendChild(el('span', 'when', whenText));
      row.appendChild(cost);
    }
    /* The leaflet end, read while the store still has it. A retick after the
       last line was removed must not store until null. */
    var keptUntil = keep ? untilOf(store.id) : null;
    row.addEventListener('click', function () {
      var until = keep ? keptUntil : batchUntil;
      var on = tickBook().toggle(store.id, line, cents, until);
      if (keep) {
        /* Untick now. The row stays until this screen is drawn again. */
        row.setAttribute('aria-pressed', on ? 'true' : 'false');
        return;
      }
      markLine(line, on);
      paintSum();
    });
    return row;
  }

  function drawDeals(lines) {
    var host = $('text');
    var group = null;
    host.textContent = '';
    lines.forEach(function (line, i) {
      if (line === '') return;
      if (i > 0 && isInternal(line)) return;
      var kind = kindOf(line, i);
      var row = kind === 'deal' && LIST_ON ? pickRow(line) : el(kind === 'section' ? 'h2' : 'p', kind, line);
      if (kind === 'section') {
        group = el('section', 'group');
        host.appendChild(group);
      }
      if (group && (kind === 'section' || kind === 'deal')) group.appendChild(row);
      else host.appendChild(row);
    });
  }

  function drawMessage(view) {
    var host = $('text');
    var box = el('div', 'msg');
    var again = el('button', 'retry', RETRY);
    host.textContent = '';
    box.appendChild(el('p', 'msg-title', view.title));
    if (view.body) box.appendChild(el('p', 'msg-body', view.body));
    host.appendChild(box);
    again.type = 'button';
    again.addEventListener('click', function () {
      again.disabled = true;
      again.textContent = RETRYING;
      load(true);
    });
    host.appendChild(again);
    host.appendChild(el('p', 'checked', CHECKED + clock(new Date())));
  }

  function draw(view) {
    var key = JSON.stringify(view);
    if (view.type === 'deals' && key === shown) return; /* same lines: leave her place on the page */
    shown = key;
    if (view.type === 'deals') {
      batchUntil = view.until == null ? null : view.until;
      /* A failed load never reaches here, so a miss drops nothing. */
      if (LIST_ON) tickBook().sync(current.id, shownDeals(view.lines), batchUntil);
      drawDeals(view.lines);
      if (LIST_ON) paintSum();
    } else {
      drawMessage(view);
      if (LIST_ON) clearSum();
    }
    if (LIST_ON) settleResume(view);
  }

  function load(asked) {
    var store = current;
    if (!store) return;
    var day = askedDay();
    if (!asked && !shown) {
      $('text').textContent = '';
      $('text').appendChild(el('p', 'loading', 'Nalagam popuste …'));
    }
    lastLoad = Date.now();
    loadBatch(day, fetch.bind(root), store).then(function (got) {
      if (current !== store) return; /* she went back while it loaded */
      draw(viewOf(got, day));
    }).catch(function () {
      if (current !== store) return;
      draw(viewOf({kind: 'offline'}, day));
    });
  }

  function openStore(store) {
    current = store;
    shown = '';
    if (LIST_ON) clearSum();
    clearMine();
    $('list').hidden = true;
    $('store').textContent = store.name;
    $('store').hidden = false;
    $('back').hidden = false;
    $('text').textContent = '';
    $('text').hidden = false;
    window.scrollTo(0, 0);
    /* A resume open must not write a place. Saving starts after the restore. */
    if (LIST_ON && placeOn && !resumeHold) placeApi().save(store.id, '', askedDay());
    load(false);
    holdScreen();
  }

  /* Same two tiles as before. Open is button.shop. Closed is div.shop.shut plus a small.
     A live store with no file says there are no deals this week. Mercator says kmalu.
     A preview of one kmalu store uses the live tile, and only on that page. */
  function tileOf(store) {
    var preview = !!previewTarget([store]);
    if ((fileReady(store) && !store.soon) || (preview && canOpen(store))) {
      return {tag: 'button', className: 'shop', note: ''};
    }
    return {
      tag: 'div',
      className: 'shop shut',
      note: (store.soon && !preview) ? 'kmalu' : ((store.live || preview) ? 'Ta teden ni akcij' : SHUT)
    };
  }

  function clearMine() {
    var mine = $('mine');
    if (mine && mine.parentNode) mine.parentNode.removeChild(mine);
  }

  function paintMine() {
    var groups;
    var mine;
    var i;
    var j;
    var group;
    var store;
    var block;
    var tot;
    clearMine();
    if (!LIST_ON || current) return;
    groups = tickBook().list();
    if (!groups.length) return;
    mine = el('div');
    mine.id = 'mine';
    mine.appendChild(el('h2', 'mine-title', 'Moj seznam'));
    for (i = 0; i < groups.length; i++) {
      group = groups[i];
      store = storeById(group.storeId);
      if (!store) store = {id: group.storeId, name: group.storeId};
      block = el('section', 'mine-store');
      block.appendChild(el('h3', 'mine-name', store.name));
      for (j = 0; j < group.lines.length; j++) {
        block.appendChild(pickRow(group.lines[j].line, store, true));
      }
      tot = tickBook().total(group.storeId);
      block.appendChild(el('p', 'mine-sum', 'Skupaj ' + root.KinDealsPrice.euroCents(tot.cents)));
      if (tot.unsummed > 0) {
        block.appendChild(el('p', 'mine-rest', tot.unsummed + ' brez seštevka'));
      }
      mine.appendChild(block);
    }
    $('list').parentNode.insertBefore(mine, $('list'));
  }

  /* Nazaj only. The stores screen start shows must not clear a place. */
  function backToList() {
    if (LIST_ON) {
      placeOn = true;
      resumeHold = false;
      resumeName = '';
      placeApi().clear();
    }
    showList();
  }

  /* The store the icon opens. A readable kmalu preview wins. Anything else follows
     the usual rule: one open store, or the list. */
  function storeToOpen(list) {
    var rows = list || [];
    var hidden = previewTarget(rows);
    if (hidden && canOpen(hidden)) return hidden;
    var open = rows.filter(function (store) { return canOpen(store); });
    if (open.length === 1) return open[0];
    return null;
  }

  function showList() {
    var list = $('list');
    current = null;
    resumeHold = false;
    if (LIST_ON) clearSum();
    dropScreen();
    shown = '';
    list.textContent = '';
    stores.forEach(function (store) {
      var item = el('li');
      var spec = tileOf(store);
      var row = el(spec.tag, spec.className, store.name);
      if (spec.tag === 'button') {
        row.type = 'button';
        row.addEventListener('click', function () { openStore(store); });
      } else { /* not a button: it must not open */
        row.appendChild(document.createTextNode(' '));
        row.appendChild(el('small', '', spec.note));
      }
      item.appendChild(row);
      list.appendChild(item);
    });
    list.hidden = false;
    $('store').textContent = STORES;
    $('store').hidden = false;
    $('back').hidden = true;
    $('text').hidden = true;
    $('text').textContent = '';
    if (LIST_ON) paintMine();
    window.scrollTo(0, 0);
  }

  function openCount() {
    var open = [];
    var i;
    for (i = 0; i < stores.length; i++) {
      if (fileReady(stores[i]) && !stores[i].soon) open.push(stores[i]);
    }
    return open;
  }

  /* allowResume is false after the day has rolled: a fresh open, not yesterday's store.
     A future ?day= still shows today's deals, and it starts on the stores screen. */
  function chooseStart(allowResume) {
    var saved = null;
    var savedStore = null;
    var open;
    var named;
    drawnDay = askedDay();
    placeOn = true;
    resumeHold = false;
    resumeName = '';
    named = queryDay();
    if (LIST_ON && allowResume && !(named && named > drawnDay)) {
      saved = placeApi().read(drawnDay);
      if (saved) savedStore = storeById(saved.storeId);
      if (saved && savedStore && fileReady(savedStore) && !savedStore.soon) {
        resumeName = saved.section || '';
        resumeHold = true;
        placeOn = false;
        openStore(savedStore);
        return;
      }
      if (saved && savedStore && !fileReady(savedStore)) {
        /* The saved store is still listed, but its file is gone. The list, no error.
           Leave the place: this screen is not Nazaj. */
        showList();
        return;
      }
    }
    open = openCount();
    if (open.length === 1) openStore(open[0]);
    else showList();
  }

  /* The icon stays open in the background. When she comes back to it, ask again.
     A later Ljubljana day drops expired ticks and starts as a fresh open. */
  function wake() {
    var today;
    if (LIST_ON && drawnDay) {
      today = askedDay();
      if (today > drawnDay) {
        tickBook().expire(today);
        chooseStart(false);
        return;
      }
    }
    if (document.visibilityState === 'visible' && current && Date.now() - lastLoad > STALE_MS) load(false);
  }

  function releaseSentinel(held) {
    if (!held || typeof held.release !== 'function') return;
    try {
      var done = held.release();
      if (done && typeof done.then === 'function') done.then(function () {}, function () {});
    } catch (err) {}
  }

  function holdScreen() {
    if (!current || document.visibilityState === 'hidden') return;
    if (screenLock || screenAsked) return;
    if (typeof navigator === 'undefined' || !navigator.wakeLock) return;
    var ask;
    try {
      ask = navigator.wakeLock.request('screen');
    } catch (err) {
      return;
    }
    if (!ask || typeof ask.then !== 'function') return;
    var gen = ++screenGen;
    screenAsked = true;
    ask.then(function (lock) {
      if (gen !== screenGen) {
        releaseSentinel(lock);
        return;
      }
      screenAsked = false;
      if (!current || document.visibilityState === 'hidden') {
        releaseSentinel(lock);
        return;
      }
      screenLock = lock;
    }, function () {
      if (gen === screenGen) screenAsked = false;
    });
  }

  function dropScreen() {
    screenGen += 1;
    screenAsked = false;
    var held = screenLock;
    screenLock = null;
    releaseSentinel(held);
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') dropScreen();
    else if (current) holdScreen();
  }

  function start() {
    if (LIST_ON) tickBook().expire(askedDay());
    $('back').addEventListener('click', backToList);
    document.addEventListener('visibilitychange', wake);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', wake);
    listenForPlace();
    /* page/deals.html in this repo sits one folder below t2/. On babasms-web the
       same file is the site root, beside t2/. (Aleksej, 10 Nov 2026.) */
    var storesUrl = /\/page\/[^/]*$/.test(location.pathname) ? '../t2/stores.json' : 't2/stores.json';
    fetch(fresh(storesUrl), {cache: 'no-store'}).then(function (res) {
      if (!res.ok) throw new Error('stores');
      return res.json();
    }).then(function (list) {
      if (!byOrder(list).length) throw new Error('stores');
      return list;
    }).catch(function () {
      return KNOWN;
    }).then(function (list) {
      stores = byOrder(list);
      return Promise.all(stores.map(probeStore));
    }).then(function () {
      var hidden = previewTarget(stores);
      if (hidden && canOpen(hidden)) openStore(hidden); /* a private kmalu preview wins */
      else chooseStart(true);
    });
  }

  function probeStore(store) {
    var day = isoOf(validSendDay(ljubljanaToday(new Date()), store));
    var urls = [fileUrl(store, day)];
    if (store.id === 'lidl') urls.push(PUBLIC + day + '/brief-sl.txt');
    return urls.reduce(function (chain, url) {
      return chain.then(function (found) {
        if (found) return true;
        return fetch(fresh(url), {cache: 'no-store'}).then(function (res) {
          if (res.status === 200) return true;
          if (res.status === 404) return false;
          throw new Error('fetch');
        });
      });
    }, Promise.resolve(false)).then(function (found) {
      store.readable = found;
      store.probeError = false;
    }, function () {
      store.readable = READABLE[store.id] === true;
      store.probeError = true;
    });
  }

  var api = {
    showText: showText, loadBatch: loadBatch, validSendDay: validSendDay, ljubljanaToday: ljubljanaToday,
    isoOf: isoOf, liveStores: liveStores, canOpen: canOpen, viewOf: viewOf, kindOf: kindOf,
    isInternal: isInternal,
    KNOWN: KNOWN, LOOK_BACK: LOOK_BACK, previousSendDay: previousSendDay, fileUrl: fileUrl,
    tileOf: tileOf, storeToOpen: storeToOpen,
    MISSING: MISSING, OFFLINE: OFFLINE, PUBLIC: PUBLIC
  };
  root.KinDealsPage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && document.getElementById('text')) start();
})(typeof window !== 'undefined' ? window : globalThis);
