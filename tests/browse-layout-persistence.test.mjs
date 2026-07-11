import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("request details retain the originating request-list route", () => {
  assert.match(mainSource, /requestListReturnRoute/);
  assert.match(mainSource, /visibleRoute === "browse" \|\| visibleRoute === "browse-all"/);
  assert.match(mainSource, /returnToRequestList/);
  assert.match(
    mainSource,
    /<RequestDetailPage[\s\S]*?request=\{activeRequest\}[\s\S]*?onBrowse=\{returnToRequestList\}/,
  );
});

test("browse history saves and restores the user's scroll position", () => {
  assert.match(mainSource, /saveCurrentHistoryScrollPosition/);
  assert.match(mainSource, /restoreCurrentHistoryScrollPosition/);
  assert.match(mainSource, /window\.history\.replaceState/);
  assert.match(mainSource, /behavior: "auto"/);
});

test("the compact request list has an explicit two-column mobile guard", () => {
  assert.match(
    mainSource,
    /className="request-square-grid full-gallery-grid request-list-grid"/,
  );
  assert.match(
    stylesSource,
    /\.browse-all-page \.request-list-grid[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/,
  );
});
