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
      /* The guide is the whole page in Safari. It stays up, including after an
         older visit stored kindeals.install.dismissed. No Ne zdaj. */
      out.showGuide = true;
      out.dismissible = false;
      out.guide = { device: device, browser: browser, share: share, canAdd: canAdd };
      return out;
    }

    /* Android, and any other phone that is not iOS. */
    if (/Android/.test(ua) || /Mobile/.test(ua)) {
      out.kind = /Android/.test(ua) ? 'android' : 'mobile';
      out.showGuide = false;
      /* One button, always shown, so the page is never blank. No Ne zdaj:
         hiding the button would leave nothing to install with. */
      out.showButton = true;
      return out;
    }

    return out; // desktop: the iOS guide stays, nothing else
  }

  /* ---------- page ---------- */

  function hide(el) { if (el) el.setAttribute('hidden', ''); }
  function show(el) { if (el) el.removeAttribute('hidden'); }

  function clearDismissed() {
    try {
      var store = window.localStorage;
      if (store && typeof store.removeItem === 'function') store.removeItem(KEY);
    } catch (e) { /* ignore */ }
  }

  function whenReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function findDom() {
    var byId = document.getElementById('setup');
    var root = byId || document;
    var firstSay = root.querySelector('.say');
    var list = firstSay && firstSay.closest ? firstSay.closest('ol, ul') : null;
    var setup = byId || (list && list.closest('section')) ||
      document.querySelector('.setup:not(#kd-go)') || (list && list.parentNode) || null;
    var where = (setup && setup.querySelector('.where')) || (byId ? null : document.querySelector('.where'));
    var items = [];
    if (list) {
      for (var c = list.firstElementChild; c; c = c.nextElementSibling) {
        if (c.tagName === 'LI') items.push(c);
      }
    }
    return { setup: setup, list: list, items: items, where: where };
  }

  /* The second section: the one install button and its note. */
  function findGo() {
    var section = document.getElementById('kd-go');
    var offer = document.getElementById('kd-offer');
    return {
      section: section,
      offer: offer,
      button: offer ? offer.querySelector('.kd-install-btn') : null,
      note: offer ? offer.querySelector('.kd-install-note:not(#kd-hint)') : null,
      hint: document.getElementById('kd-hint')
    };
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
    clearDismissed();
    var nav = window.navigator || {};
    var mm = false;
    try { mm = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches); } catch (e) { mm = false; }
    var env = {
      ua: nav.userAgent || '',
      maxTouchPoints: nav.maxTouchPoints || 0,
      standalone: nav.standalone === true,
      displayModeStandalone: mm,
      beforeInstallPrompt: false
    };
    var choice = installChoice(env);
    if (choice.kind === 'desktop') {
      return;
    }

    if (choice.kind === 'installed') {
      whenReady(function () { hide(findDom().setup); hide(findGo().section); });
      return;
    }

    if (choice.kind === 'ios') {
      whenReady(function () {
        var dom = findDom();
        if (!choice.showGuide) { hide(dom.setup); return; }
        applyIos(dom, choice.guide);
      });
      return;
    }

    // android and other non-iOS phones: one install button, always shown
    var deferred = null, go = null, timer = null;

    /* Full Chrome on Android. A WebView, another browser, or Gmail's in-app tab is not. */
    function chromeProper(ua, referrer) {
      ua = String(ua || '');
      if (!/Android/.test(ua)) return false;
      if (/;\s*wv\b/.test(ua) || /Version\/4\.0/.test(ua)) return false;
      if (/SamsungBrowser|EdgA\/|Edg\/|OPR\/|UCBrowser|YaBrowser|DuckDuckGo|GSA\/|Instagram|FBAN|FBAV|FB_IAB|Line\/|Twitter|Snapchat|MicroMessenger|MiuiBrowser|Silk\//.test(ua)) return false;
      if (/^android-app:\/\/com\.google\.android\.gm\b/i.test(referrer || '')) return false;
      return /Chrome\/\d/.test(ua);
    }

    /* No captured event: the ⋮ line takes the note's place for a while. */
    function menuHint() {
      if (!go || !go.hint) return;
      hide(go.note);
      show(go.hint);
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        hide(go.hint);
        show(go.note);
      }, 8000);
    }

    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
    });
    window.addEventListener('appinstalled', function () {
      deferred = null;
      if (!go) return;
      if (timer) { clearTimeout(timer); timer = null; }
      hide(go.hint);
      hide(go.button);
      show(go.note);
    });

    whenReady(function () {
      hide(findDom().setup);
      go = findGo();
      if (go.button) {
        go.button.addEventListener('click', function () {
          var ev = deferred;
          deferred = null;
          if (!ev) {
            var ua = (window.navigator && window.navigator.userAgent) || '';
            var ref = '';
            try { ref = document.referrer || ''; } catch (err) { ref = ''; }
            /* Gmail's in-app browser has no install prompt. Open the same page in Chrome. */
            if (/Android/.test(ua) && !chromeProper(ua, ref)) {
              window.location.href = 'intent://kindeals.vercel.app/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Fkindeals.vercel.app%2F;end';
              return;
            }
            menuHint();
            return;
          }
          try {
            var p = ev.prompt();
            if (p && typeof p.then === 'function') p.then(null, menuHint);
          } catch (e) { menuHint(); }
        });
      }
      show(go.section);
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { installChoice: installChoice };
  }
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    boot();
  }
})();
