'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SITE = path.join(__dirname, '..', '..', 'site');

function makeElement(tag, id) {
  const el = {
    tagName: String(tag).toUpperCase(),
    id: id || '',
    attributes: {},
    className: '',
    classList: { add() {}, remove() {} },
    style: {},
    textContent: '',
    nodeValue: '',
    parentNode: null,
    firstElementChild: null,
    nextElementSibling: null,
    childNodes: [],
    children: [],
    hidden: false,
    ownerSVGElement: { getBoundingClientRect: () => ({ left: 0, right: 100, width: 100 }) },
    matches() { return false; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    closest() { return null; },
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, val) { this.attributes[name] = val; },
    removeAttribute(name) { delete this.attributes[name]; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    insertBefore() {},
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      if (!this.firstElementChild) this.firstElementChild = child;
    },
    addEventListener() {},
    getBoundingClientRect: () => ({ left: 0, right: 100, width: 50, height: 20 }),
  };
  return el;
}

/** Minimal DOM enough for site/install.js and site/setup-lang.js boot paths. */
function createBrowserStub(userAgent, opts) {
  opts = opts || {};
  const elementsById = Object.create(null);
  const setup = makeElement('section', 'setup');
  setup.id = 'setup';
  const say = makeElement('p');
  say.className = 'say';
  const li = makeElement('li');
  li.appendChild(say);
  li.querySelector = (sel) => {
    if (sel === '.say') return say;
    if (sel === '.aside') return null;
    return null;
  };
  const ol = makeElement('ol');
  ol.appendChild(li);
  ol.firstElementChild = li;
  setup.appendChild(ol);
  say.closest = (sel) => (sel && /ol|ul/.test(sel) ? ol : null);
  setup.querySelector = (sel) => {
    if (sel === '.say') return say;
    if (sel === '.where') return null;
    return null;
  };
  setup.querySelectorAll = () => [];
  setup.firstChild = ol;

  const kdGo = makeElement('section', 'kd-go');
  kdGo.id = 'kd-go';
  const offer = makeElement('div');
  offer.id = 'kd-offer';
  const btn = makeElement('button');
  btn.className = 'kd-install-btn';
  const note = makeElement('p');
  note.className = 'kd-install-note';
  const hint = makeElement('p');
  hint.id = 'kd-hint';
  hint.className = 'kd-install-note';
  offer.appendChild(btn);
  offer.appendChild(note);
  offer.appendChild(hint);
  kdGo.appendChild(offer);
  offer.querySelector = (sel) => {
    if (sel === '.kd-install-btn') return btn;
    if (sel === '.kd-install-note:not(#kd-hint)') return note;
    return null;
  };

  elementsById.setup = setup;
  elementsById['kd-go'] = kdGo;
  elementsById['kd-offer'] = offer;
  elementsById['kd-hint'] = hint;
  elementsById['setup-ios26'] = makeElement('section', 'setup-ios26');

  const body = makeElement('body');
  body.appendChild(setup);
  body.appendChild(kdGo);

  const documentElement = makeElement('html');
  documentElement.lang = 'sl';
  documentElement.dir = 'ltr';
  documentElement.appendChild = () => {};

  const head = makeElement('head');

  const document = {
    readyState: 'complete',
    body,
    head,
    documentElement,
    getElementById(id) { return elementsById[id] || null; },
    querySelector(sel) {
      if (sel === '.setup:not(#kd-go)') return setup;
      if (sel === '.where') return null;
      return null;
    },
    querySelectorAll() { return []; },
    createElement(tag) {
      const el = makeElement(tag);
      if (tag === 'style') return el;
      if (tag === 'p') return el;
      return el;
    },
    createTreeWalker() {
      return { nextNode() { return null; } };
    },
    fonts: { ready: Promise.resolve() },
    addEventListener() {},
  };

  const location = { search: opts.search || '', href: 'https://kindeals.vercel.app/' };
  const navigator = {
    userAgent,
    maxTouchPoints: opts.maxTouchPoints != null ? opts.maxTouchPoints : 0,
    standalone: !!opts.standalone,
    language: opts.language || 'sl',
    languages: opts.languages || ['sl', 'en'],
    serviceWorker: opts.serviceWorker,
  };

  const window = {
    document,
    navigator,
    location,
    localStorage: {
      removeItem() {},
      getItem() { return null; },
    },
    matchMedia() { return { matches: !!opts.displayModeStandalone }; },
    addEventListener() {},
    setTimeout(fn, ms) { return setTimeout(fn, ms); },
    clearTimeout,
    getComputedStyle() {
      return { fontSize: '16px', overflow: 'visible' };
    },
    Event: function Event() {},
  };
  window.window = window;
  window.self = window;

  return { window, document, navigator, module: { exports: {} } };
}

function runSiteScript(filename, context) {
  const code = fs.readFileSync(path.join(SITE, filename), 'utf8');
  const ctx = vm.createContext({
    ...context,
    URLSearchParams,
    Intl,
    NodeFilter: { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 },
    setTimeout,
    clearTimeout,
    console,
  });
  vm.runInContext(code, ctx, { filename: path.join('site', filename) });
  return ctx;
}

const USER_AGENTS = {
  iphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  android:
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  desktop:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

module.exports = {
  SITE,
  createBrowserStub,
  runSiteScript,
  USER_AGENTS,
};
