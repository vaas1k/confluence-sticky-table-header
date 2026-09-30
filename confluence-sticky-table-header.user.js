// ==UserScript==
// @name         Confluence editor: sticky table header
// @description  Keeps the table header row visible while scrolling in the Confluence 7.x editor. Style lives in the editor iframe head, so it is never saved into the page.
// @version      0.1
// @author       @vaas1k
// @match        https://confluence.e-kama.com/*
// @match        https://confluence-dev.int.e-kama.com/*
// @run-at       document-idle
// @grant        none
// @homepageURL  https://github.com/vaas1k/confluence-sticky-table-header
// ==/UserScript==

(function () {
  const ID = 'sticky-th-style';
  // First row only: th of a header column must not stick to the top and cover the header row.
  const CSS = 'table.confluenceTable tr:first-child>th{position:sticky;top:0;z-index:5}';

  // ponytail: 1s polling instead of MutationObserver; quick-edit recreates the iframe
  // without a page load, polling covers that in 3 lines. Switch to an observer if it ever shows up in a profile.
  setInterval(() => {
    const doc = document.getElementById('wysiwygTextarea_ifr')?.contentDocument;
    if (!doc?.head || doc.getElementById(ID)) return;
    const style = doc.createElement('style');
    style.id = ID;
    style.textContent = CSS;
    doc.head.appendChild(style);
  }, 1000);
})();
