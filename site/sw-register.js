/* Ask the network first (page/sw.js). A saved copy is used only when the network fails. */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
