/* Which store and section she had open, for this calendar day only.
   Nothing on the page loads this file. */
(function (root) {
  'use strict';

  var KEY = 'kindeals.place';
  var CLEARED = {};

  function parseStored(raw) {
    var data;
    if (typeof raw !== 'string' || raw === '') return null;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return null;
    }
    if (!data || typeof data !== 'object') return null;
    if (Object.prototype.toString.call(data) !== '[object Object]') return null;
    if (data.v !== 1) return null;
    if (typeof data.day !== 'string') return null;
    if (typeof data.storeId !== 'string') return null;
    if (typeof data.section !== 'string') return null;
    return data;
  }

  function shown(data, dayIso) {
    if (!data || data.day !== dayIso) return null;
    return {storeId: data.storeId, section: data.section};
  }

  function open(storage) {
    /* null: read storage. A record: setItem failed, so this open keeps it.
       CLEARED: clear() won, even if storage could not drop the key. */
    var held = null;

    function save(storeId, section, dayIso) {
      var record = {v: 1, day: dayIso, storeId: storeId, section: section};
      try {
        storage.setItem(KEY, JSON.stringify(record));
        held = null;
      } catch (e) {
        held = record;
      }
    }

    function clear() {
      try {
        storage.removeItem(KEY);
      } catch (e) {
        try {
          storage.setItem(KEY, '');
        } catch (e2) {}
      }
      held = CLEARED;
    }

    function read(dayIso) {
      var data;
      if (held === CLEARED) return null;
      if (held) return shown(held, dayIso);
      try {
        data = storage.getItem(KEY);
      } catch (e) {
        return null;
      }
      return shown(parseStored(data), dayIso);
    }

    return {save: save, clear: clear, read: read};
  }

  /* Last heading in array order whose top has reached the bar. Do not sort. */
  function sectionAt(headings, barBottom) {
    var i;
    var found = '';
    if (!headings || !headings.length) return '';
    for (i = 0; i < headings.length; i++) {
      if (headings[i] && headings[i].top <= barBottom) found = headings[i].text;
    }
    return found;
  }

  root.KinDealsPlace = { open: open, sectionAt: sectionAt };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.KinDealsPlace;
})(typeof window !== 'undefined' ? window : globalThis);
