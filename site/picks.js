/* Ticks on this phone only (localStorage key kindeals.picks). Nothing on the page loads this file. */
(function (root) {
  'use strict';

  var KEY = 'kindeals.picks';

  function emptyState() {
    return { stores: Object.create(null), nextSeq: 1 };
  }

  function findIndex(lines, line) {
    var i;
    for (i = 0; i < lines.length; i++) {
      if (lines[i].line === line) return i;
    }
    return -1;
  }

  function normalCents(cents) {
    if (typeof cents === 'number') return cents;
    return null;
  }

  function normalUntil(untilIso) {
    if (untilIso === null || typeof untilIso === 'string') return untilIso;
    return null;
  }

  function earliestSeq(store) {
    var min = store.lines[0].seq;
    var i;
    for (i = 1; i < store.lines.length; i++) {
      if (store.lines[i].seq < min) min = store.lines[i].seq;
    }
    return min;
  }

  function linesInOrder(lines) {
    return lines.slice().sort(function (a, b) { return a.seq - b.seq; });
  }

  function storeIds(state) {
    var ids = Object.keys(state.stores);
    ids.sort(function (a, b) {
      return earliestSeq(state.stores[a]) - earliestSeq(state.stores[b]);
    });
    return ids;
  }

  function knownSeq(value) {
    if (typeof value !== 'number') return null;
    if (value !== value || value === Infinity || value === -Infinity) return null;
    return value;
  }

  function parseState(text) {
    var state = emptyState();
    var data, ids, i, j, id, raw, lines, item, until, seq, maxSeq, pending, row;
    if (typeof text !== 'string' || text === '') return state;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return emptyState();
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return emptyState();
    if (data.v !== 1) return emptyState();
    if (!data.stores || typeof data.stores !== 'object' || Array.isArray(data.stores)) return emptyState();
    ids = Object.keys(data.stores);
    maxSeq = 0;
    pending = [];
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      raw = data.stores[id];
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
      if (!Array.isArray(raw.lines)) continue;
      lines = [];
      for (j = 0; j < raw.lines.length; j++) {
        item = raw.lines[j];
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        if (typeof item.line !== 'string') continue;
        if (item.cents !== null && typeof item.cents !== 'number') continue;
        if (findIndex(lines, item.line) !== -1) continue;
        seq = knownSeq(item.seq);
        row = { line: item.line, cents: item.cents, seq: seq === null ? 0 : seq };
        lines.push(row);
        if (seq === null) pending.push(row);
        else if (seq > maxSeq) maxSeq = seq;
      }
      if (lines.length === 0) continue;
      until = raw.until === null || typeof raw.until === 'string' ? raw.until : null;
      state.stores[id] = { until: until, lines: lines };
    }
    for (i = 0; i < pending.length; i++) {
      maxSeq += 1;
      pending[i].seq = maxSeq;
    }
    state.nextSeq = maxSeq + 1;
    return state;
  }

  function readState(storage) {
    try {
      if (!storage || typeof storage.getItem !== 'function') return emptyState();
      return parseState(storage.getItem(KEY));
    } catch (err) {
      return emptyState();
    }
  }

  function serialize(state) {
    var ids = storeIds(state);
    var stores = {};
    var i, j, id, ordered, outLines;
    for (i = 0; i < ids.length; i++) {
      id = ids[i];
      ordered = linesInOrder(state.stores[id].lines);
      outLines = [];
      for (j = 0; j < ordered.length; j++) {
        outLines.push({ line: ordered[j].line, cents: ordered[j].cents, seq: ordered[j].seq });
      }
      stores[id] = { until: state.stores[id].until, lines: outLines };
    }
    return JSON.stringify({ v: 1, stores: stores });
  }

  function open(storage) {
    var state = readState(storage);

    function persist() {
      try {
        if (!storage || typeof storage.setItem !== 'function') return;
        storage.setItem(KEY, serialize(state));
      } catch (err) {}
    }

    function toggle(storeId, line, cents, untilIso) {
      var store = state.stores[storeId];
      var idx;
      if (!store) {
        state.stores[storeId] = {
          until: normalUntil(untilIso),
          lines: [{ line: line, cents: normalCents(cents), seq: state.nextSeq }]
        };
        state.nextSeq += 1;
        persist();
        return true;
      }
      idx = findIndex(store.lines, line);
      if (idx === -1) {
        store.until = normalUntil(untilIso);
        store.lines.push({ line: line, cents: normalCents(cents), seq: state.nextSeq });
        state.nextSeq += 1;
        persist();
        return true;
      }
      store.lines.splice(idx, 1);
      if (store.lines.length === 0) delete state.stores[storeId];
      else store.until = normalUntil(untilIso);
      persist();
      return false;
    }

    function has(storeId, line) {
      var store = state.stores[storeId];
      if (!store) return false;
      return findIndex(store.lines, line) !== -1;
    }

    function sync(storeId, shownLines, untilIso) {
      var store = state.stores[storeId];
      var shown = Array.isArray(shownLines) ? shownLines : [];
      var keep = [];
      var dropped = 0;
      var i;
      if (!store) return 0;
      for (i = 0; i < store.lines.length; i++) {
        if (shown.indexOf(store.lines[i].line) !== -1) keep.push(store.lines[i]);
        else dropped += 1;
      }
      if (keep.length === 0) delete state.stores[storeId];
      else {
        store.lines = keep;
        store.until = normalUntil(untilIso);
      }
      persist();
      return dropped;
    }

    function expire(todayIso) {
      var ids = Object.keys(state.stores);
      var dropped = 0;
      var i;
      for (i = 0; i < ids.length; i++) {
        if (state.stores[ids[i]].until !== null && todayIso > state.stores[ids[i]].until) {
          dropped += state.stores[ids[i]].lines.length;
          delete state.stores[ids[i]];
        }
      }
      if (dropped > 0) persist();
      return dropped;
    }

    function list() {
      var ids = storeIds(state);
      var out = [];
      var i, j, ordered, copy;
      for (i = 0; i < ids.length; i++) {
        ordered = linesInOrder(state.stores[ids[i]].lines);
        copy = [];
        for (j = 0; j < ordered.length; j++) {
          copy.push({ line: ordered[j].line, cents: ordered[j].cents });
        }
        out.push({ storeId: ids[i], lines: copy });
      }
      return out;
    }

    function total(storeId) {
      var store = state.stores[storeId];
      var count = 0;
      var cents = 0;
      var unsummed = 0;
      var i;
      if (!store) return { count: 0, cents: 0, unsummed: 0 };
      for (i = 0; i < store.lines.length; i++) {
        count += 1;
        if (store.lines[i].cents === null) unsummed += 1;
        else cents += store.lines[i].cents;
      }
      return { count: count, cents: cents, unsummed: unsummed };
    }

    return {
      toggle: toggle,
      has: has,
      sync: sync,
      expire: expire,
      list: list,
      total: total
    };
  }

  root.KinDealsPicks = { open: open };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.KinDealsPicks;
})(typeof window !== 'undefined' ? window : globalThis);
