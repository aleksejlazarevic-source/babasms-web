/* The icon: Lidl's approved lines, one store on the screen, no name (Aleksej, 9 Nov 2026).
   The look is the shelf price tag (Aleksej approved Fable's page, 10 Nov 2026).
   Lidl stays live. Spar is live. Tuš, Hofer and E.Leclerc say kmalu until a leaflet recheck signs them off (t807u).
   A private preview parameter opens one kmalu store the way it would look live. The page reads it and never writes it into a link.
   The date reader is babasms/dates.py read_span. readSpan here is the same function.
   The page hides a line that is not valid on the viewer's today. The pipeline has its own cut.
   The send day follows store.days. */
(function (root) {
  'use strict';

  var PRICE = /\d,\d{2}/;
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
  /* Nominative, for the closed-day line. Sunday is 0, as in getUTCDay. Not WEEKDAY_FROM. */
  var WEEKDAY = ['nedelja', 'ponedeljek', 'torek', 'sreda', 'četrtek', 'petek', 'sobota'];
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
  /* Aleksej, 12 Nov 2026: hide a brief once it is more than 7 days past the
     leaflet's own printed end. The seventh day is still shown. */
  var BRIEF_KEEP_DAYS = 7;
  /* Same slack as babasms/dates.py. A day further than this from the anchor is the other year. */
  var SLACK_DAYS = 200;

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

  /* Printed day.month. The twin of babasms/dates.py read_span.
     tests/fixtures/date-spans.json is the list both must pass.
     'samo D.M.' is that one day. The end of a range is read from the range's start. */
  function placed(day, month, anchor) {
    var year = anchor.getUTCFullYear();
    function at(y) {
      var found = new Date(Date.UTC(y, month - 1, day));
      if (found.getUTCFullYear() !== y || found.getUTCMonth() !== month - 1 || found.getUTCDate() !== day) {
        throw new Error('bad date');
      }
      return found;
    }
    var found = at(year);
    var slack = SLACK_DAYS * 86400000;
    if (found.getTime() < anchor.getTime() - slack) found = at(year + 1);
    else if (found.getTime() > anchor.getTime() + slack) found = at(year - 1);
    return found;
  }

  function readSpan(text, anchor, windowStart, windowEnd) {
    var samo = /(?:^|\s)samo (\d{1,2})\.(\d{1,2})\./.exec(text);
    var rangeSl, rangeEn, range, od, done, start, end;
    if (samo) {
      start = placed(+samo[1], +samo[2], anchor);
      return {from: start, to: start, token: 'samo'};
    }
    rangeSl = /(?:^|\s)od (\d{1,2})\.(\d{1,2})\. do (\d{1,2})\.(\d{1,2})\./.exec(text);
    rangeEn = rangeSl ? null : /(?:^|\s)from (\d{1,2})\.(\d{1,2})\. to (\d{1,2})\.(\d{1,2})\./.exec(text);
    range = rangeSl || rangeEn;
    if (range) {
      start = placed(+range[1], +range[2], anchor);
      end = placed(+range[3], +range[4], start);
      return {from: start, to: end, token: 'range'};
    }
    od = /(?:^|\s)od (\d{1,2})\.(\d{1,2})\./.exec(text);
    if (od) {
      start = placed(+od[1], +od[2], anchor);
      end = windowStart && windowEnd ? windowEnd : null;
      return {from: start, to: end, token: 'od'};
    }
    done = /(?:^|\s)do (\d{1,2})\.(\d{1,2})\./.exec(text);
    if (done) {
      end = placed(+done[1], +done[2], anchor);
      start = windowStart && windowEnd ? windowStart : null;
      return {from: start, to: end, token: 'do'};
    }
    if (windowStart && windowEnd) return {from: windowStart, to: windowEnd, token: ''};
    return null;
  }

  /* True once today is more than BRIEF_KEEP_DAYS past the printed end.
     A file with no header is not hidden here. */
  function pastBriefCap(text, todayIso) {
    var today = parseIso(todayIso);
    var lines, body, header;
    if (!text) return false;
    lines = String(text).replace(/\n$/, '').split('\n');
    if (!lines.length || lines[0].trim() !== 'BABASMS1') return false;
    body = lines.slice(1);
    while (body.length && body[0] === '') body.shift();
    if (!body.length) return false;
    header = readSpan(body[0], today, null, null);
    if (!header || header.token !== 'range' || !header.to) return false;
    return today.getTime() > addDays(header.to, BRIEF_KEEP_DAYS).getTime();
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
    var header = readSpan(greeting, today, null, null);
    if (!header || header.token !== 'range') throw new Error('no window');
    var windowStart = header.from;
    var windowEnd = header.to;
    var sl = !/(?:^|\s)from \d{1,2}\.\d{1,2}\. to /.test(greeting);
    var carry = !!carried && today > windowEnd;
    if (today < windowStart || (today > windowEnd && !carry)) {
      return {kind: 'outside', lines: [
        'Ti popusti veljajo od ' + shortDate(windowStart) + ' do ' + shortDate(windowEnd)
      ]};
    }
    var lastEnd = windowStart;

    function keep(line) {
      if (!PRICE.test(line)) return true;
      var span = readSpan(line, windowStart, windowStart, windowEnd);
      /* Past the leaflet, a carried line with no end day ended with the leaflet.
         samo, a printed range, and do each name their own last day. */
      if (carry && span.token !== 'samo' && span.token !== 'range' && span.token !== 'do') return false;
      var validFrom = span.from;
      var validTo = span.to;
      var ok = validTo >= today && validFrom <= today;
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
    /* The header stays the leaflet's own printed dates. (Aleksej, 12 Nov 2026.) */
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
     not leave the page empty. fetcher is window.fetch on the page and a fake in the test.
     A 404 is a missing file and may look back. A 503 is the worker's never-saved answer
     and may look back; the offline message is only when every looked-up day came back 503.
     Any other status, a rejected fetch, or a rejected body throws before the legacy URL
     and before an earlier leaflet. A server error must not be drawn as an older batch. */
  function loadBatch(dayIso, fetcher, store) {
    var missing = {kind: 'missing', lines: [MISSING]};
    /* A 404 is "this day was not published". A 503 is the same question offline:
       the service worker has no saved copy of that file, so it cannot be a 404.
       Friday asks for Friday's file, which was never a send day, then has to
       walk back to Thursday's saved brief. Giving up on the 503 hides that brief.
       down stays set so a phone with nothing saved still says it is offline,
       not that the week is missing. */
    function get(url) {
      return fetcher(fresh(url), {cache: 'no-store'}).then(function (res) {
        if (res.status === 404) return {text: null, down: false};
        if (res.status === 503) return {text: null, down: true};
        if (!res.ok) throw new Error('fetch');
        return res.text().then(function (body) {
          return {text: body, down: false};
        });
      }, function () {
        return {text: null, down: true};
      });
    }
    function getDay(fileDay) {
      return get(fileUrl(store, fileDay)).then(function (got) {
        if (got.text != null || !store || store.id !== 'lidl') return got;
        return get(PUBLIC + fileDay + '/brief-sl.txt').then(function (alt) {
          if (alt.text != null) return alt;
          return {text: null, down: got.down || alt.down};
        });
      });
    }
    return getDay(dayIso).then(function (got) {
      if (got.text != null && !pastBriefCap(got.text, dayIso)) return showText(got.text, dayIso);
      var fileDay = dayIso;
      var tries = 0;
      var down = got.down;
      function earlier() {
        if (tries >= LOOK_BACK) {
          if (down) return {kind: 'offline', lines: [OFFLINE]};
          return missing;
        }
        tries += 1;
        fileDay = previousSendDay(fileDay, store);
        return getDay(fileDay).then(function (old) {
          down = down || old.down;
          if (old.text == null || pastBriefCap(old.text, dayIso)) return earlier();
          var shown = showText(old.text, dayIso, true);
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
  /* page/closed-days.json once it has arrived. Null until then, and after a failed read. */
  var closedDoc = null;
  /* The deals view on the screen. A message view leaves this empty, so a late file
     does not touch #text while she is reading "missing" or "offline". */
  var dealsView = null;
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
    return root.KinDealsMine.row(line, store, keep);
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

  function dotTime(value) {
    var m;
    if (typeof value !== 'string') return '';
    m = /^(\d{1,2}):(\d{2})$/.exec(value);
    if (!m) return '';
    return m[1] + '.' + m[2];
  }

  function capFirst(word) {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /* One day. A store row wins. The law adds a holiday only, and never a plain Sunday. */
  function dayClause(date, row, lawOn, isHoliday) {
    var when = WEEKDAY[date.getUTCDay()] + ', ' + shortDate(date);
    var hm;
    if (row) {
      if (row.closed === true) return when + ': zaprto';
      hm = dotTime(row.open_until);
      if (hm) return when + ': odprto do ' + hm;
      return '';
    }
    if (lawOn && isHoliday) return when + ': zaprto';
    return '';
  }

  /* The sentence for this store from the asked day through the batch's last day, or ''. */
  function closedLine(doc, storeId, fromIso, untilIso) {
    var from, until, lawOn, holiday, notice, parts, day, iso, list, one, i, clause;
    try {
      if (!doc || typeof doc !== 'object' || !storeId || !fromIso || !untilIso) return '';
      if (!DAY.test(fromIso) || !DAY.test(untilIso)) return '';
      from = parseIso(fromIso);
      until = parseIso(untilIso);
      if (isNaN(from.getTime()) || isNaN(until.getTime()) || until.getTime() < from.getTime()) return '';
      lawOn = !!(doc.law && doc.law.closed_sundays_and_holidays === true);
      holiday = {};
      list = doc.holidays && doc.holidays.days;
      if (list && typeof list.length === 'number') {
        for (i = 0; i < list.length; i++) {
          one = list[i];
          if (one && one.date) holiday[one.date] = true;
        }
      }
      notice = {};
      list = doc.stores;
      if (list && typeof list.length === 'number') {
        for (i = 0; i < list.length; i++) {
          one = list[i];
          if (one && one.store === storeId && one.date) notice[one.date] = one;
        }
      }
      parts = [];
      for (day = from; day.getTime() <= until.getTime(); day = addDays(day, 1)) {
        iso = isoOf(day);
        clause = dayClause(day, notice[iso], lawOn, !!holiday[iso]);
        if (clause) parts.push(clause);
      }
      if (!parts.length) return '';
      parts[0] = capFirst(parts[0]);
      return parts.join('; ') + '.';
    } catch (err) {
      return '';
    }
  }

  function closedLineText(view) {
    if (!view || view.type !== 'deals' || !current) return '';
    return closedLine(closedDoc, current.id, askedDay(), view.until || '');
  }

  /* After the greeting, before the first section. Not a deal line, so it is not in view.lines. */
  function placeClosedLine(text) {
    var host, i, greet, node;
    if (!text) return;
    host = $('text');
    if (!host || !host.children) return;
    greet = null;
    for (i = 0; i < host.children.length; i++) {
      if (host.children[i].className === 'greeting') {
        greet = host.children[i];
        break;
      }
    }
    if (!greet || !greet.parentNode) return;
    node = el('p', 'closed-day', text);
    if (greet.nextSibling) greet.parentNode.insertBefore(node, greet.nextSibling);
    else greet.parentNode.appendChild(node);
  }

  function draw(view) {
    /* The tick rows live in mine-list.js, fetched after this file, so they are
       not on the wire while the stylesheet is still arriving. */
    if (LIST_ON && !(root.KinDealsMine && root.KinDealsMine.row)) {
      ensureMine(function () { draw(view); });
      return;
    }
    var line = closedLineText(view);
    var key = JSON.stringify(view) + '\n' + line;
    if (view.type === 'deals' && key === shown) return; /* same lines: leave her place on the page */
    shown = key;
    if (view.type === 'deals') {
      dealsView = view;
      batchUntil = view.until == null ? null : view.until;
      /* A failed load never reaches here, so a miss drops nothing. */
      if (LIST_ON) tickBook().sync(current.id, shownDeals(view.lines), batchUntil);
      drawDeals(view.lines);
      placeClosedLine(line);
      if (LIST_ON) paintSum();
    } else {
      dealsView = null;
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
    dealsView = null;
    if (LIST_ON) clearSum();
    clearMine();
    if (root.KinDealsMine) root.KinDealsMine.leave();
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

  function mineHost() {
    return {
      el: el, $: $, tick: tickBook, byId: storeById, listOn: LIST_ON,
      cur: function () { return current; },
      setCur: function (v) { current = v; },
      setDealsView: function (v) { dealsView = v; },
      setResumeHold: function (v) { resumeHold = v; },
      setShown: function (v) { shown = v; },
      clearSum: clearSum, clearMine: clearMine, dropScreen: dropScreen,
      tileOf: tileOf, openStore: openStore,
      stores: function () { return stores; },
      STORES: STORES, euroUnit: euroUnit, untilOf: untilOf,
      markLine: markLine, paintSum: paintSum,
      batch: function () { return batchUntil; },
      showList: showList
    };
  }

  /* mine-list.js is not a script tag: it must not share the stylesheet's download. */
  function ensureMine(done) {
    var mine = root.KinDealsMine;
    var s;
    if (mine && mine.row && mine.ready) {
      if (done) done();
      return;
    }
    if (done) {
      if (!ensureMine.wait) ensureMine.wait = [];
      ensureMine.wait.push(done);
    }
    if (ensureMine.begun) return;
    ensureMine.begun = true;
    s = document.createElement('script');
    s.src = 'mine-list.js';
    s.onload = function () {
      var q = ensureMine.wait || [];
      var i;
      root.KinDealsMine.use(mineHost());
      ensureMine.wait = null;
      for (i = 0; i < q.length; i++) q[i]();
    };
    document.head.appendChild(s);
  }

  /* Nazaj only. The ticked list keeps the saved place. A store clears it. */
  function backToList() {
    if (root.KinDealsMine && root.KinDealsMine.isOn()) {
      showList();
      return;
    }
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

  /* The store tiles are drawn here. mine-list.js is only the tick button and the
     tick rows, and it is not on the wire while the stylesheet is still arriving.
     A page that never opens the list does not fetch that file. */
  function showList() {
    var list = $('list');
    current = null;
    dealsView = null;
    resumeHold = false;
    if (LIST_ON) clearSum();
    clearMine();
    if (root.KinDealsMine) root.KinDealsMine.leave();
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
    /* Pensioner offers valid today. One more tile; the script owns the dates.
       The file loads here, so a page that opens one store does not fetch it.
       A throw here must not reject start(): the store list is already drawn,
       including when stores.json fell back to KNOWN. */
    try {
      if (root.KinDealsDiscountDays && root.KinDealsDiscountDays.attachTile) {
        root.KinDealsDiscountDays.attachTile(list);
      } else if (typeof document.querySelector === 'function' && document.head
          && !document.querySelector('script[data-discount-days]')) {
        var days = document.createElement('script');
        days.src = 'discount-days.js';
        days.setAttribute('data-discount-days', '1');
        days.onload = function () {
          if (root.KinDealsDiscountDays && root.KinDealsDiscountDays.attachTile) {
            root.KinDealsDiscountDays.attachTile(list);
          }
        };
        document.head.appendChild(days);
      }
    } catch (err) {}
    list.hidden = false;
    $('store').textContent = STORES;
    $('store').hidden = false;
    $('back').hidden = true;
    $('text').hidden = true;
    $('text').textContent = '';
    if (LIST_ON) paintMineWhenReady();
    window.scrollTo(0, 0);
  }

  /* The button waits for mine-list.js. The tiles above are already on the screen. */
  function paintMineWhenReady() {
    if (root.KinDealsMine && root.KinDealsMine.ready && root.KinDealsMine.paint) {
      root.KinDealsMine.paint();
      return;
    }
    ensureMine(function () {
      if (!current && root.KinDealsMine && root.KinDealsMine.paint) root.KinDealsMine.paint();
    });
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

  /* Same folder as the HTML. Not the storesUrl folder test: that would ask for ../closed-days.json. */
  function loadClosedDays() {
    var pending;
    try {
      pending = fetch(fresh('closed-days.json'), {cache: 'no-store'});
    } catch (err) {
      return;
    }
    if (!pending || typeof pending.then !== 'function') return;
    pending.then(function (res) {
      if (!res || !res.ok || typeof res.json !== 'function') return null;
      return res.json();
    }).then(function (doc) {
      if (!doc || typeof doc !== 'object') return;
      closedDoc = doc;
      /* A message view has no dealsView, so this does not touch #text. */
      if (!dealsView || !current) return;
      draw(dealsView);
    }).catch(function () {});
  }

  function start() {
    if (LIST_ON) {
      tickBook().expire(askedDay());
      ensureMine(null);
    }
    $('back').addEventListener('click', backToList);
    document.addEventListener('visibilitychange', wake);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', wake);
    loadClosedDays();
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
    readSpan: readSpan, pastBriefCap: pastBriefCap,
    isoOf: isoOf, liveStores: liveStores, canOpen: canOpen, viewOf: viewOf, kindOf: kindOf,
    isInternal: isInternal,
    KNOWN: KNOWN, LOOK_BACK: LOOK_BACK, previousSendDay: previousSendDay, fileUrl: fileUrl,
    tileOf: tileOf, storeToOpen: storeToOpen, closedLine: closedLine,
    MISSING: MISSING, OFFLINE: OFFLINE, PUBLIC: PUBLIC
  };
  root.KinDealsPage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && document.getElementById('text')) start();
})(typeof window !== 'undefined' ? window : globalThis);
