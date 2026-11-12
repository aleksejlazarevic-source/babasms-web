'use strict';

/* node --test tests/ loads this folder as a module. Run every *.test.js from here. */
const fs = require('node:fs');
const path = require('node:path');

for (const name of fs.readdirSync(__dirname).sort()) {
  if (name.endsWith('.test.js')) require(path.join(__dirname, name));
}
