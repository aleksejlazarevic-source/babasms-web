/* Moj seznam. Loaded after the store tiles are drawn, so it does not share the
   stylesheet download. The stores screen has one button. Opening it shows the
   ticked lines. Sizes are guesses, 12 Nov 2026, until seen on a phone. */
(function (root) {
  'use strict';

  var host = null;
  var on = false;

  function clearButton() {
    var btn = host.$('mine-open');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }

  function clearLines() {
    var mine = host.$('mine');
    if (mine && mine.parentNode) mine.parentNode.removeChild(mine);
  }

  /* On the stores screen, one button. It opens every ticked line. */
  function paint() {
    var btn;
    if (!host) return;
    on = false;
    clearButton();
    if (!host.listOn || host.cur()) return;
    if (!host.tick().list().length) return;
    btn = host.el('button', 'shop', 'Moj seznam');
    btn.type = 'button';
    btn.id = 'mine-open';
    btn.style.marginBottom = '12px';
    btn.addEventListener('click', openMine);
    host.$('list').parentNode.insertBefore(btn, host.$('list'));
  }

  function openMine() {
    on = true;
    host.setCur(null);
    clearButton();
    if (host.listOn) host.clearSum();
    host.$('list').hidden = true;
    host.$('text').hidden = true;
    host.$('text').textContent = '';
    host.$('back').hidden = false;
    host.$('store').textContent = 'Moj seznam';
    host.$('store').hidden = false;
    paintLines();
    window.scrollTo(0, 0);
  }

  /* Untick takes the row off this screen now, and the total with it. */
  function drop(row, store) {
    var block = row.parentNode;
    var mine;
    var tot;
    var sum;
    var rest;
    if (block) block.removeChild(row);
    if (block && !block.querySelector('.pick')) {
      if (block.parentNode) block.parentNode.removeChild(block);
    } else if (block && store) {
      tot = host.tick().total(store.id);
      sum = block.querySelector('.mine-sum');
      if (sum) sum.textContent = 'Skupaj ' + root.KinDealsPrice.euroCents(tot.cents);
      rest = block.querySelector('.mine-rest');
      if (tot.unsummed > 0) {
        if (rest) rest.textContent = tot.unsummed + ' brez seštevka';
        else block.appendChild(host.el('p', 'mine-rest', tot.unsummed + ' brez seštevka'));
      } else if (rest && rest.parentNode) rest.parentNode.removeChild(rest);
    }
    mine = host.$('mine');
    if (!mine || !mine.querySelector('.pick')) host.showList();
  }

  function paintLines() {
    var groups;
    var mine;
    var i;
    var j;
    var group;
    var store;
    var block;
    var tot;
    clearLines();
    if (!host.listOn || host.cur()) return;
    groups = host.tick().list();
    if (!groups.length) return;
    mine = host.el('div');
    mine.id = 'mine';
    for (i = 0; i < groups.length; i++) {
      group = groups[i];
      store = host.byId(group.storeId);
      if (!store) store = {id: group.storeId, name: group.storeId};
      block = host.el('section', 'mine-store');
      block.appendChild(host.el('h3', 'mine-name', store.name));
      for (j = 0; j < group.lines.length; j++) {
        block.appendChild(pickRow(group.lines[j].line, store, true));
      }
      tot = host.tick().total(group.storeId);
      block.appendChild(host.el('p', 'mine-sum', 'Skupaj ' + root.KinDealsPrice.euroCents(tot.cents)));
      if (tot.unsummed > 0) {
        block.appendChild(host.el('p', 'mine-rest', tot.unsummed + ' brez seštevka'));
      }
      mine.appendChild(block);
    }
    host.$('list').parentNode.insertBefore(mine, host.$('list'));
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
    if (!store) store = host.cur();
    row.type = 'button';
    row.className = 'deal pick';
    row.setAttribute('data-line', line);
    row.setAttribute('aria-pressed', host.tick().has(store.id, line) ? 'true' : 'false');
    row.appendChild(host.el('span', 'tick'));
    if (!parsed) {
      row.appendChild(host.el('span', 'what', line));
      if (store && store.card === true) row.appendChild(host.el('span', 'who', 's kartico'));
    } else {
      row.appendChild(host.el('span', 'what', parsed.name));
      cost = host.el('span', 'cost');
      nowNum = parsed.who === 'voucher' ? parsed.till : parsed.now;
      nowUnit = parsed.who === 'voucher' ? '' : parsed.nowUnit;
      cost.appendChild(host.el('span', 'now', host.euroUnit(nowNum, nowUnit)));
      if (parsed.was && parsed.who !== 'voucher') {
        was = host.el('s', 'was');
        was.appendChild(host.el('span', null, 'prej '));
        was.appendChild(document.createTextNode(host.euroUnit(parsed.was, parsed.wasUnit)));
        cost.appendChild(was);
      }
      if (parsed.who === 'plus') cost.appendChild(host.el('span', 'who', 'z Lidl Plus'));
      if (parsed.who === 'voucher') {
        cost.appendChild(host.el('span', 'who', 'z bonom ' + root.KinDealsPrice.euro(parsed.now)));
      }
      if (store && store.card === true) cost.appendChild(host.el('span', 'who', 's kartico'));
      whenText = parsed.when || '';
      if (parsed.cond) whenText = whenText ? whenText + ', ' + parsed.cond : parsed.cond;
      if (whenText) cost.appendChild(host.el('span', 'when', whenText));
      row.appendChild(cost);
    }
    /* The leaflet end, read while the store still has it. A retick after the
       last line was removed must not store until null. */
    var keptUntil = keep ? host.untilOf(store.id) : null;
    row.addEventListener('click', function () {
      var until = keep ? keptUntil : host.batch();
      var pressed = host.tick().toggle(store.id, line, cents, until);
      if (keep) {
        if (!pressed) drop(row, store);
        return;
      }
      host.markLine(line, pressed);
      host.paintSum();
    });
    return row;
  }

  var api = {
    ready: false,
    use: function (h) { host = h; api.ready = true; },
    paint: paint,
    leave: function () { on = false; if (host) clearButton(); },
    drop: drop,
    row: pickRow,
    isOn: function () { return on; }
  };
  root.KinDealsMine = api;
})(typeof window !== 'undefined' ? window : globalThis);
