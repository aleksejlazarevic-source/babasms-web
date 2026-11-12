/* Split one printed deal line into name and prices. Nothing on the page loads this file. */
(function (root) {
  'use strict';

  var DATE = / (od|do) (\d{1,2})\.(\d{1,2})\.$/;
  var COND = ', ob nakupu';
  var VOUCHER = /^(.*) (\d+,\d{2}) po odštetem bonu \(cena, ki jo plačate (\d+,\d{2})\)$/;
  var PER_KILO_PAIR = /^(.*) (\d+,\d{2})\/kg \((\d+,\d{2})\/kg\)$/;
  var PAIR = /^(.*) (\d+,\d{2}) \((\d+,\d{2})\)$/;
  var PER_KILO = /^(.*) (\d+,\d{2})\/kg$/;
  var BARE = /^(.*) (\d+,\d{2})$/;

  function cents(str) {
    var parts = String(str).split(',');
    return parseInt(parts[0], 10) * 100 + parseInt(parts[1], 10);
  }

  function euroCents(n) {
    var frac = n % 100;
    var whole = (n - frac) / 100;
    var fracText = String(frac);
    if (fracText.length < 2) fracText = '0' + fracText;
    return String(whole) + ',' + fracText + '\u00a0€';
  }

  function euro(str) {
    return euroCents(cents(str));
  }

  /* The five tails the contract names, most specific first. Name is not trimmed yet. */
  function matchPrice(rest) {
    var m = rest.match(VOUCHER);
    if (m) {
      return {name: m[1], now: m[2], nowUnit: '', was: '', wasUnit: '', till: m[3], voucher: true};
    }
    m = rest.match(PER_KILO_PAIR);
    if (m) {
      return {name: m[1], now: m[2], nowUnit: '/kg', was: m[3], wasUnit: '/kg', till: '', voucher: false};
    }
    m = rest.match(PAIR);
    if (m) {
      return {name: m[1], now: m[2], nowUnit: '', was: m[3], wasUnit: '', till: '', voucher: false};
    }
    m = rest.match(PER_KILO);
    if (m) {
      return {name: m[1], now: m[2], nowUnit: '/kg', was: '', wasUnit: '', till: '', voucher: false};
    }
    m = rest.match(BARE);
    if (m) {
      return {name: m[1], now: m[2], nowUnit: '', was: '', wasUnit: '', till: '', voucher: false};
    }
    return null;
  }

  /* ", ob nakupu …" only when the text before it is a real price tail.
     A numeral inside the condition stays in the condition. */
  function peelCond(rest) {
    var from = rest.length;
    while (from > 0) {
      var at = rest.lastIndexOf(COND, from - 1);
      if (at < 0) break;
      var condText = rest.slice(at + 2);
      var left = rest.slice(0, at);
      if (matchPrice(left)) {
        return {rest: left, cond: condText};
      }
      from = at;
    }
    return {rest: rest, cond: ''};
  }

  function parse(line) {
    if (typeof line !== 'string' || line.length === 0) return null;

    var rest = line;
    var who = '';
    var when = '';

    if (rest.charAt(rest.length - 1) === '+') {
      who = 'plus';
      rest = rest.slice(0, -1);
    }

    var date = rest.match(DATE);
    if (date) {
      when = date[1] + ' ' + date[2] + '.' + date[3] + '.';
      rest = rest.slice(0, date.index);
    }

    var peeled = peelCond(rest);
    rest = peeled.rest;
    var hit = matchPrice(rest);
    if (!hit) return null;

    var name = hit.name;
    if (!name.replace(/^\s+|\s+$/g, '')) return null;
    if (hit.voucher && who === 'plus') return null;
    if (hit.was) {
      if (hit.nowUnit !== hit.wasUnit) return null;
      if (!(cents(hit.was) > cents(hit.now))) return null;
    }
    if (hit.till && cents(hit.till) < cents(hit.now)) return null;

    return {
      name: name,
      now: hit.now,
      nowUnit: hit.nowUnit,
      was: hit.was,
      wasUnit: hit.wasUnit,
      who: hit.voucher ? 'voucher' : who,
      till: hit.till,
      when: when,
      cond: peeled.cond
    };
  }

  function summable(parsed) {
    if (!parsed) return null;
    if (parsed.nowUnit === '/kg' || parsed.wasUnit === '/kg') return null;
    if (parsed.cond) return null;
    if (parsed.who === 'voucher') return cents(parsed.till);
    return cents(parsed.now);
  }

  var api = {
    parse: parse,
    cents: cents,
    euro: euro,
    euroCents: euroCents,
    summable: summable
  };
  root.KinDealsPrice = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
