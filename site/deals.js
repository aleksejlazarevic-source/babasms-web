/* The icon: Lidl's approved lines, one store on the screen, no name (Aleksej, 9 Nov 2026).
   The look is the shelf price tag (Aleksej approved Fable's page, 10 Nov 2026).
   Lidl stays live. Tuš, Hofer, Spar and E.Leclerc say kmalu until a leaflet recheck signs them off (t807u).
   The date cut is babasms/message.py filter_published. The send day follows store.days. */
(function (root) {
  'use strict';

  var PRICE = /\d,\d{2}/;
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
    {id: 'tus', name: 'Tuš', days: ['wed', 'fri'], live: false, soon: true, order: 2},
    {id: 'hofer', name: 'Hofer', days: ['mon', 'thu'], live: false, soon: true, order: 3},
    {id: 'spar', name: 'Spar', days: ['wed'], live: false, soon: true, order: 4},
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
      /* A carried file's undated line was built for its own send day. Drop it. */
      if (carried && !ended) return false;
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
    function get(url) {
      return fetcher(fresh(url), {cache: 'no-store'}).then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('fetch');
        return res.text();
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
        if (tries >= LOOK_BACK) return missing;
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

  function askedDay() {
    var q = new URLSearchParams(location.search).get('day');
    if (q && DAY.test(q)) return q;
    return isoOf(validSendDay(ljubljanaToday(new Date()), current));
  }

  function byOrder(list) {
    return (list || []).filter(function (s) { return s && s.id && s.name; })
      .slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  /* She can open a store only when he has set it live and this page can read its file. */
  function canOpen(store, files) {
    if (liveStores([store]).length !== 1) return false;
    if (files) return files[store.id] === true;
    if (store && Object.prototype.hasOwnProperty.call(store, 'readable')) return store.readable === true;
    return READABLE[store.id] === true;
  }

  /* What to draw for one answer from the network. The deal lines are showText's, unchanged. */
  function viewOf(got, dayIso) {
    if (got.kind === 'deals') return {type: 'deals', lines: got.lines};
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

  /* One of: first line, section name, deal line, store note. Blank lines are spacing, drawn by the CSS. */
  function kindOf(line, index) {
    if (index === 0) return 'greeting';
    if (PRICE.test(line)) return 'deal';
    return line.toUpperCase() === line ? 'section' : 'note';
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

  function drawDeals(lines) {
    var host = $('text');
    var group = null;
    host.textContent = '';
    lines.forEach(function (line, i) {
      if (line === '') return;
      var kind = kindOf(line, i);
      var row = el(kind === 'section' ? 'h2' : 'p', kind, line);
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
    if (view.type === 'deals') drawDeals(view.lines);
    else drawMessage(view);
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
    $('list').hidden = true;
    $('store').textContent = store.name;
    $('store').hidden = false;
    $('back').hidden = false;
    $('text').textContent = '';
    $('text').hidden = false;
    window.scrollTo(0, 0);
    load(false);
  }

  /* Same two tiles as before. Open is button.shop. Closed is div.shop.shut plus a small.
     A live store with no file says there are no deals this week. Mercator says kmalu. */
  function tileOf(store) {
    if (canOpen(store) && !store.soon) return {tag: 'button', className: 'shop', note: ''};
    return {
      tag: 'div',
      className: 'shop shut',
      note: store.soon ? 'kmalu' : (store.live ? 'Ta teden ni akcij' : SHUT)
    };
  }

  function showList() {
    var list = $('list');
    current = null;
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
    window.scrollTo(0, 0);
  }

  /* The icon stays open in the background. When she comes back to it, ask again. */
  function wake() {
    if (document.visibilityState === 'visible' && current && Date.now() - lastLoad > STALE_MS) load(false);
  }

  function start() {
    $('back').addEventListener('click', showList);
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('pageshow', wake);
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
      var open = stores.filter(function (store) { return canOpen(store); });
      if (open.length === 1) openStore(open[0]); /* one store: the icon opens its deals */
      else showList();
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
    }, function () {
      store.readable = READABLE[store.id] === true;
    });
  }

  var api = {
    showText: showText, loadBatch: loadBatch, validSendDay: validSendDay, ljubljanaToday: ljubljanaToday,
    isoOf: isoOf, liveStores: liveStores, canOpen: canOpen, viewOf: viewOf, kindOf: kindOf,
    KNOWN: KNOWN, LOOK_BACK: LOOK_BACK, previousSendDay: previousSendDay, fileUrl: fileUrl,
    tileOf: tileOf,
    MISSING: MISSING, OFFLINE: OFFLINE, PUBLIC: PUBLIC
  };
  root.KinDealsPage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document !== 'undefined' && document.getElementById('text')) start();
})(typeof window !== 'undefined' ? window : globalThis);
