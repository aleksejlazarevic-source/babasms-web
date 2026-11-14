'use strict';

/* babasms/sitepublish.py SHELL_FILES, the one list publish hashes.
   This repo's tests run without that file, so the same names and order live here.
   sw.js is not included. preview.html is not part of the list. */
const SHELL_FILES = [
  'index.html', 'deals.html', 'offline.html', 'deals.js',
  'price.js', 'picks.js', 'place.js', 'look.css', 'motion.css',
  'install.js', 'setup-lang.js', 'sw-register.js', 'manifest.webmanifest',
  'discount-days.js', 'mine-list.js',
];

module.exports = { SHELL_FILES };
