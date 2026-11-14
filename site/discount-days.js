/* Pensioner offers valid today, as one tile on the deals page.
   Dates come from discount-days.json. An offer is on the tile only when the
   viewer's today is inside from/to, inclusive. shown false, a missing date,
   and the not_included list stay off. The Slovenian frame words are the ones
   setup-lang.js swaps. (Aleksej, 12 Nov 2026.) */
(function (root) {
  'use strict';

  /* How many days after today may still list an offer. 0 is today only.
     Guess, plan D9, 12 Nov 2026. */
  var SHOW_DAYS_AHEAD = 0;
  /* The same words as KD_TEXT.sl.pensionerDays. setup-lang.js swaps them. */
  var TILE_SL = 'Dnevi za upokojence';
  var DAY = /^\d{4}-\d{2}-\d{2}$/;
  var cached = null;

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function addDays(iso, n) {
    var p = iso.split('-');
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + n));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  function ljubljanaToday(now) {
    var fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit'
    });
    return fmt.format(now || new Date());
  }

  function askedDay() {
    var q = '';
    if (typeof location !== 'undefined' && location && location.search) {
      q = new URLSearchParams(location.search).get('day') || '';
    }
    if (DAY.test(q)) return q;
    return ljubljanaToday(new Date());
  }

  function offerOn(offer, today) {
    var last;
    if (!offer || offer.shown === false) return false;
    if (!offer.from || !offer.to) return false;
    if (!DAY.test(offer.from) || !DAY.test(offer.to) || !DAY.test(today)) return false;
    last = addDays(today, SHOW_DAYS_AHEAD);
    if (last < offer.from) return false;
    if (today > offer.to) return false;
    return true;
  }

  function offersFor(data, today) {
    var out = [];
    var skip = {};
    var i;
    var row;
    var offer;
    if (!data || data.wired !== true || !data.offers || !today) return out;
    if (data.not_included) {
      for (i = 0; i < data.not_included.length; i++) {
        row = data.not_included[i];
        if (row && row.id) skip[row.id] = true;
      }
    }
    for (i = 0; i < data.offers.length; i++) {
      offer = data.offers[i];
      if (!offer || skip[offer.id]) continue;
      if (!offerOn(offer, today)) continue;
      out.push(offer);
    }
    return out;
  }

  function frame(slovenian) {
    var api = root.KinDealsLang;
    if (api && typeof api.text === 'function') return api.text(slovenian);
    return slovenian;
  }

  function lineOf(offer) {
    var lang = root.KinDealsLang && root.KinDealsLang.lang;
    if (lang === 'en' && offer.sentence_en) return offer.sentence_en;
    return offer.sentence || '';
  }

  function openDays(offers) {
    var list = document.getElementById('list');
    var store = document.getElementById('store');
    var back = document.getElementById('back');
    var text = document.getElementById('text');
    var mine = document.getElementById('mine');
    var i;
    var line;
    if (!text || !offers || !offers.length) return;
    if (mine && mine.parentNode) mine.parentNode.removeChild(mine);
    if (list) list.hidden = true;
    if (store) {
      store.textContent = frame(TILE_SL);
      store.hidden = false;
    }
    if (back) back.hidden = false;
    text.hidden = false;
    text.textContent = '';
    for (i = 0; i < offers.length; i++) {
      line = document.createElement('p');
      line.className = 'deal';
      line.textContent = lineOf(offers[i]);
      text.appendChild(line);
    }
    window.scrollTo(0, 0);
  }

  /* The language file and the offer file load when the store list is drawn.
     A page that opens one store never asks for them. */
  var loading = false;

  function loadLang(done) {
    var script;
    if (root.KinDealsLang) { done(); return; }
    script = document.createElement('script');
    script.src = 'setup-lang.js';
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
  }

  function begin() {
    if (loading || api.ready) return;
    loading = true;
    loadLang(function () {
      fetch('discount-days.json', {cache: 'no-store'}).then(function (res) {
        if (!res.ok) throw new Error('discount-days');
        return res.json();
      }).then(markReady).catch(function () { markReady(null); });
    });
  }

  function attachTile(list) {
    var today;
    var offers;
    var item;
    var button;
    if (!list) return;
    if (!api.ready) { begin(); return; }
    if (!cached) return;
    if (list.querySelector('[data-discount-days]')) return;
    today = askedDay();
    offers = offersFor(cached, today);
    if (!offers.length) return;
    item = document.createElement('li');
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'shop';
    button.setAttribute('data-discount-days', '1');
    button.textContent = frame(TILE_SL);
    button.addEventListener('click', function () { openDays(offers); });
    item.appendChild(button);
    list.appendChild(item);
  }

  function paintIfListed() {
    var list = document.getElementById('list');
    if (!list || list.hidden) return;
    attachTile(list);
  }

  function markReady(data) {
    cached = data;
    api.ready = true;
    paintIfListed();
  }

  var api = {
    offersFor: offersFor,
    attachTile: attachTile,
    ready: false,
    tileLabel: TILE_SL,
    SHOW_DAYS_AHEAD: SHOW_DAYS_AHEAD
  };
  root.KinDealsDiscountDays = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : global);
