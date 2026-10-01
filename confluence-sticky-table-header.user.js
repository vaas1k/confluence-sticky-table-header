// ==UserScript==
// @name         Confluence editor: sticky table header
// @description  Keeps the table header row visible while scrolling in the Confluence 7.x editor. Style lives in the editor iframe head, so it is never saved into the page.
// @version      0.2
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
  // !important beats the inline top that Table Filter sets for its own floating header (broken in the editor).
  const BASE = 'table.confluenceTable tr:first-child>th{position:sticky!important;top:0!important;z-index:5}';

  // Lower header rows need a per-table offset. It goes into the head style via a CSS path:
  // an inline style on the cells would be saved with the page.
  const path = el => el === el.ownerDocument.body ? 'body'
    : `${path(el.parentElement)}>:nth-child(${[...el.parentElement.children].indexOf(el) + 1})`;

  // ponytail: 1s polling instead of MutationObserver; quick-edit recreates the iframe
  // without a page load, and header offsets change as the user types. Switch to an observer if it ever shows up in a profile.
  setInterval(() => {
    const doc = document.getElementById('wysiwygTextarea_ifr')?.contentDocument;
    if (!doc?.head) return;
    let css = BASE;
    // Multi-row header = rows covered by rowspan of the first row's th; each sticks below the rows above it.
    for (const t of doc.querySelectorAll('table.confluenceTable')) {
      const rows = t.tBodies[0]?.rows;
      if (!rows?.length) continue;
      const n = Math.max(...[...rows[0].querySelectorAll(':scope>th')].map(c => c.rowSpan));
      for (let k = 1; k < n && k < rows.length; k++)
        css += `${path(rows[k])}>th{position:sticky!important;top:${rows[k].offsetTop - rows[0].offsetTop}px!important;z-index:5}`;
    }
    let style = doc.getElementById(ID);
    if (!style) {
      style = doc.createElement('style');
      style.id = ID;
      doc.head.appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }, 1000);
})();
