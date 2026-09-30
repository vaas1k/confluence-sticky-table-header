# Dev notes: confluence-sticky-table-header

The repo is for development only. Users get everything from the Confluence article; all they need from the repo is the raw install link.

## Artefacts

| What | Where |
|---|---|
| Script | `confluence-sticky-table-header.user.js` (the only code) |
| Install URL | `https://raw.githubusercontent.com/vaas1k/confluence-sticky-table-header/main/confluence-sticky-table-header.user.js`. The article links to it, so never rename the file or the `main` branch |
| User article | confluence.e-kama.com, page `236308920`, space `~aleksei.vasik` (under Home `225562570`), labels `userscript`, `tampermonkey`, `howto`. The `demo.gif` attachment is a copy of `docs/demo.gif` |
| Demo GIF source | `docs/demo.gif` (recorded on dev, space TEST) |

## How it works

- Confluence 7.19 edits pages in a TinyMCE iframe `#wysiwygTextarea_ifr`. The script polls every 1 s and puts `<style id="sticky-th-style">` into that iframe's `<head>`. Because the style sits outside the editor body, it is never saved into the page (checked: `tinymce.activeEditor.getContent()` contains no `sticky`/`<style`).
- The iframe document scrolls by itself (`scrollingElement`), so `position:sticky; top:0` inside it sticks to the top of the editor area, under the toolbar.
- Selector `table.confluenceTable tr:first-child>th`: sticks only the first row. The first version used a plain `th`, so row-header cells (`th` in column 1) also stuck to the top and covered the header. Tables usually start with `<colgroup>`, so `tbody:first-child` would not match.
- Header cells already have an opaque background (`#f4f5f7`), so rows don't show through.
- View mode is not the script's job: Confluence has its own floating header there (`.tableFloatingHeader*`).

## Metadata decisions

- Script updates are deliberately out of scope: no `@updateURL`/`@downloadURL`, and neither the article nor the README mentions updates. Don't bring them back unless asked.
- No `@namespace`, and `@name` stays as is. Tampermonkey identifies a script by `@name` + `@namespace`, so a reinstall from the link replaces the copy instead of adding a second one.
- `@version` starts at `0.1`.
- `@grant none`: no Tampermonkey APIs are needed.

## Release checklist

1. Edit the script, bump `@version`, `node --check confluence-sticky-table-header.user.js`.
2. Test on dev (below), then commit, push `main`, tag `vX.Y`.
3. If user-visible behaviour or installation changed, update article `236308920` (via REST from a logged-in browser tab, see below).

## Testing

- Browser: Yandex Browser with the Claude extension, in a **separate window/tab group**. Never touch the user's working window. Chrome with the extension has no work sessions.
- Logins are done by the user. Dev uses its own SSO realm, `sso-dev.e-kama.com`, with a password.
- Dev: open `https://confluence-dev.int.e-kama.com/pages/createpage.action?spaceKey=TEST`. That creates a private draft; dev autosaves drafts (collaborative editing).
- Prod: the classic editor, no collaborative drafts. `createpage` in `~aleksei.vasik` leaves nothing behind if the page is not saved.
- Fill the editor with a long table through `tinymce.activeEditor.setContent(...)`. Use `class="confluenceTh"`/`confluenceTd` cells; without them the editor draws no borders or background. Add a header row **and** a header column.
- Then scroll the iframe (`scrollingElement.scrollTop = 1000`) and check:
  - the first-row `th` has `getBoundingClientRect().top === 0`;
  - a row-header `th` has `position: static`;
  - `elementFromPoint(…, 10)` hits a header cell.
- Before navigating away from the editor, run `setContent('')`, `isNotDirty = true`, `jQuery(window).off('beforeunload')`. Otherwise a native "leave page?" dialog blocks automation.
- Extension-store pages and Tampermonkey's own pages (install, Dashboard) can't be automated; the user clicks there.

## Writing to Confluence

- The Atlassian MCP is a service account on prod. It cannot see or write the personal space.
- Write as the user: `fetch` from a logged-in tab on the same origin with header `X-Atlassian-Token: no-check`. Examples: `PUT /rest/api/content/236308920` with `version.number+1`, or `POST …/child/attachment` with FormData.
