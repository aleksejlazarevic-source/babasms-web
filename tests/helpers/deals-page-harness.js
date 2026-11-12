'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const DEALS = path.join(__dirname, '../../site/deals.js');

function makeNode(tag) {
  const node = {
    tagName: String(tag).toUpperCase(),
    className: '',
    textContent: '',
    hidden: false,
    type: '',
    disabled: false,
    children: [],
    childNodes: [],
    appendChild(ch) {
      this.children.push(ch);
      this.childNodes.push(ch);
    },
    addEventListener(type, fn) {
      this._listeners = this._listeners || {};
      this._listeners[type] = fn;
    },
  };
  return node;
}

/** Run site/deals.js with a minimal DOM so start() runs (same path as the live page). */
async function runDealsStart(options) {
  const pathname = options.pathname || '/';
  const elements = new Map();
  for (const id of ['back', 'text', 'list', 'store']) {
    const el = makeNode('div');
    el.id = id;
    elements.set(id, el);
  }

  const document = {
    getElementById(id) {
      return elements.get(id) || null;
    },
    createElement(tag) {
      return makeNode(tag);
    },
    createTextNode(text) {
      return { nodeType: 3, textContent: text };
    },
    addEventListener() {},
    visibilityState: 'visible',
  };

  const location = { pathname };
  const window = {
    scrollTo() {},
    addEventListener() {},
    location,
  };

  const context = {
    window,
    location,
    document,
    fetch: options.fetch,
    Intl,
    Date,
    Promise,
    console,
    setTimeout,
    clearTimeout,
    Error,
    JSON,
    RegExp,
    Array,
    Object,
    String,
    Number,
    Math,
    URL,
    URLSearchParams,
  };
  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(DEALS, 'utf8'), context);

  for (let i = 0; i < 30; i += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }

  const api = context.window.KinDealsPage;
  if (!api) throw new Error('KinDealsPage missing after load');

  return { api, list: elements.get('list') };
}

function storesOnScreen(listEl, known) {
  const out = [];
  for (const li of listEl.children) {
    const row = li.children[0];
    if (!row) continue;
    const label = row.textContent.trim();
    const hit = (known || []).find((s) => label === s.name || label.startsWith(s.name + ' '));
    if (hit) out.push(hit);
  }
  return out;
}

function byOrder(list) {
  return (list || [])
    .filter((s) => s && s.id && s.name)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

module.exports = { runDealsStart, storesOnScreen, byOrder };
