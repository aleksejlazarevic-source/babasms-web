/* KinDeals: namestitev na domači zaslon (Android gumb, iOS vodič). */
(function () {
  'use strict';

  var KEY = 'kindeals.install.dismissed';
  var OTHER_IOS = /OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo|Ddg\/|Brave|FBAN|FBAV|FBIOS|Instagram|Line\/|Snapchat|Twitter|MicroMessenger|UCBrowser|Focus\//;

  var LINES = {
    chrome: {
      iphone: 'Tapni puščico iz kvadratka ob naslovu, na desni.',
      ipad: 'Tapni puščico iz kvadratka zgoraj desno.',
      aside: 'Odpre se seznam.',
      rest: ['Tapni Dodaj na domači zaslon.', 'Ime pusti KinDeals. Tapni Dodaj.', 'Nato tapni ikono.']
    },
    firefox: {
      iphone: 'Odpri meni s tremi črtami.',
      ipad: 'Odpri meni s tremi črtami zgoraj desno.',
      aside: 'Tapni Dodaj na domači zaslon. Če te vrstice ni, tapni Deli in nato Dodaj na domači zaslon.',
      rest: ['Ime pusti KinDeals. Tapni Dodaj.', 'Nato tapni ikono.']
    },
    edge: {
      iphone: 'Odpri meni s tremi pikami.',
      ipad: 'Odpri meni s tremi pikami zgoraj desno.',
      aside: 'Tapni Dodaj na domači zaslon.',
      rest: ['Ime pusti KinDeals. Tapni Dodaj.', 'Nato tapni ikono.']
    }
  };

  var IPAD_FIRST_ASIDE = 'Je zgoraj desno, ne spodaj.';
  var CANNOT_ADD = 'Ta brskalnik na tej napravi ne zna dodati ikone. Odpri to stran v Safariju. Če je stran odprta v sporočilu, tapni ikono Safari.';
  var BUTTON_LABEL = 'Dodaj na domači zaslon';
  var BUTTON_NOTE = 'Doda ikono KinDeals na zaslon. Nato tapni ikono.';
  var LATER = 'Ne zdaj';

  function iosBrowser(ua) {
    if (/CriOS/.test(ua)) return 'chrome';
    if (/FxiOS/.test(ua)) return 'firefox';
    if (/EdgiOS/.test(ua)) return 'edge';
    if (OTHER_IOS.test(ua) || !/Safari\//.test(ua)) return 'other';
    return 'safari';
  }

  function iosVersion(ua, browser) {
    var m = /OS (\d+)[_.](\d+)/.exec(ua);
    if (!m && browser === 'safari') m = /Version\/(\d+)\.(\d+)/.exec(ua);
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
  }

  function installChoice(env) {
    env = env || {};
    var ua = String(env.ua || '');
    var mtp = Number(env.maxTouchPoints) || 0;
    var dismissed = env.dismissed === true;
    var out = { kind: 'desktop', showButton: false, showGuide: true, dismissible: false, guide: null };

    if (env.standalone === true || env.displayModeStandalone === true) {
      out.kind = 'installed';
      out.showGuide = false;
      return out;
    }

    /* A touchscreen Mac is still a desktop. iPadOS desktop mode is Safari (Version/) or CriOS/FxiOS/EdgiOS. */
    var desktopMac = /Macintosh/.test(ua) && !/iPad|iPhone|iPod/.test(ua) &&
      /Chrome\/|Firefox\/|Edg\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    var isIPad = /iPad/.test(ua) || (/Macintosh/.test(ua) && mtp > 1 && !desktopMac);
    var isIPhone = !isIPad && /iPhone|iPod/.test(ua);

    if (isIPad || isIPhone) {
      var device = isIPad ? 'ipad' : 'iphone';
      var browser = iosBrowser(ua);
      var share, canAdd;
      if (browser === 'safari') {
        share = isIPad ? 'top' : 'bottom';
        canAdd = true;
      } else {
        share = 'menu';
        var v = browser === 'other' ? null : iosVersion(ua, browser);
        canAdd = !!v && (v[0] > 16 || (v[0] === 16 && v[1] >= 4));
      }
      out.kind = 'ios';
      out.showGuide = !dismissed;
      out.dismissible = out.showGuide;
      out.guide = { device: device, browser: browser, share: share, canAdd: canAdd };
      return out;
    }

    if (/Android/.test(ua)) {
      out.kind = 'android';
      out.showGuide = false;
      out.showButton = !dismissed && env.beforeInstallPrompt === true;
      out.dismissible = out.showButton;
      return out;
    }

    return out; // desktop: page stays as it is
  }

  /* ---------- page ---------- */

  function hide(el) { if (el) el.setAttribute('hidden', ''); }
  function show(el) { if (el) el.removeAttribute('hidden'); }

  function readDismissed() {
    try { return window.localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }
  function writeDismissed() {
    try { window.localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
  }

  function whenReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function findDom() {
    var firstSay = document.querySelector('.say');
    var list = firstSay && firstSay.closest ? firstSay.closest('ol, ul') : null;
    var setup = document.getElementById('setup') || document.querySelector('.setup') ||
      (list && list.closest('section')) || (list && list.parentNode) || null;
    var where = (setup && setup.querySelector('.where')) || document.querySelector('.where');
    var items = [];
    if (list) {
      for (var c = list.firstElementChild; c; c = c.nextElementSibling) {
        if (c.tagName === 'LI') items.push(c);
      }
    }
    return { setup: setup, list: list, items: items, where: where };
  }

  function hidePictures(el) {
    for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
      if (c.matches('.say, .aside')) continue;
      if (c.querySelector('.say, .aside')) hidePictures(c);
      else hide(c);
    }
  }

  function setAside(li, text) {
    var a = li.querySelector('.aside');
    if (!text) { hide(a); return; }
    if (!a) {
      a = document.createElement('p');
      a.className = 'aside';
      var say = li.querySelector('.say');
      if (say && say.parentNode) say.parentNode.insertBefore(a, say.nextSibling);
      else li.appendChild(a);
    }
    a.textContent = text;
    show(a);
  }

  function setLine(li, say, aside) {
    var s = li.querySelector('.say');
    if (s) s.textContent = say;
    setAside(li, aside);
  }

  function laterButton(onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'kd-later';
    b.textContent = LATER;
    b.addEventListener('click', onClick);
    return b;
  }

  function applyIos(dom, guide) {
    var items = dom.items;
    if (!guide.canAdd) {
      hide(dom.list);
      var w = dom.where;
      if (!w && dom.setup) {
        w = document.createElement('p');
        w.className = 'where';
        dom.setup.insertBefore(w, dom.list || dom.setup.firstChild);
      }
      if (w) { w.textContent = CANNOT_ADD; show(w); }
      return;
    }
    if (guide.browser === 'safari') {
      if (guide.device === 'ipad' && items[0]) {
        hidePictures(items[0]);
        setAside(items[0], IPAD_FIRST_ASIDE);
      }
      return; // iPhone Safari: steps untouched so setup-lang.js swap survives
    }
    var t = LINES[guide.browser];
    if (!t) return;
    var lines = [[t[guide.device], t.aside]];
    for (var i = 0; i < t.rest.length; i++) lines.push([t.rest[i], null]);
    for (var j = 0; j < items.length; j++) {
      if (j < lines.length) {
        hidePictures(items[j]);
        setLine(items[j], lines[j][0], lines[j][1]);
      } else {
        hide(items[j]);
      }
    }
  }

  function boot() {
    var nav = window.navigator || {};
    var mm = false;
    try { mm = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch (e) { mm = false; }
    var env = {
      ua: nav.userAgent || '',
      maxTouchPoints: nav.maxTouchPoints || 0,
      standalone: nav.standalone === true,
      displayModeStandalone: mm,
      dismissed: readDismissed(),
      beforeInstallPrompt: false
    };
    var choice = installChoice(env);
    if (choice.kind === 'desktop') return;

    if (choice.kind === 'installed') {
      whenReady(function () { hide(findDom().setup); });
      return;
    }

    if (choice.kind === 'ios') {
      whenReady(function () {
        var dom = findDom();
        if (!choice.showGuide) { hide(dom.setup); return; }
        applyIos(dom, choice.guide);
        if (choice.dismissible && dom.setup) {
          dom.setup.appendChild(laterButton(function () {
            writeDismissed();
            hide(dom.setup);
          }));
        }
      });
      return;
    }

    // android
    var deferred = null, ready = false, dom = null, block = null;

    function renderButton() {
      if (block || !dom || !deferred) return;
      if (!installChoice(env).showButton) return;
      show(dom.setup);
      hide(dom.where);
      hide(dom.list);
      block = document.createElement('div');
      block.className = 'kd-install';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kd-install-btn';
      btn.textContent = BUTTON_LABEL;
      btn.addEventListener('click', function () {
        var ev = deferred;
        deferred = null;
        if (ev) { try { ev.prompt(); } catch (e) { /* ignore */ } }
        hide(block);
      });
      var note = document.createElement('p');
      note.className = 'kd-install-note';
      note.textContent = BUTTON_NOTE;
      block.appendChild(btn);
      block.appendChild(note);
      block.appendChild(laterButton(function () {
        writeDismissed();
        env.dismissed = true;
        hide(block);
        hide(dom.setup);
      }));
      if (dom.list && dom.list.parentNode) dom.list.parentNode.insertBefore(block, dom.list);
      else if (dom.setup) dom.setup.appendChild(block);
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      env.beforeInstallPrompt = true;
      if (ready) renderButton();
    });
    window.addEventListener('appinstalled', function () {
      deferred = null;
      hide(block);
    });

    whenReady(function () {
      ready = true;
      dom = findDom();
      /* No iPhone steps, and no "open in Safari" line, until Chrome offers the button. */
      hide(dom.setup);
      hide(dom.where);
      hide(dom.list);
      if (env.dismissed) return;
      renderButton();
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { installChoice: installChoice };
  }
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    boot();
  }
})();
