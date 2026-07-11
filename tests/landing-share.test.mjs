import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("the landing page offers website sharing below the hero trust content", () => {
  assert.match(
    mainSource,
    /trust-line[\s\S]*?hero-share-prompt[\s\S]*?help someone find something ![\s\S]*?Share2/,
  );
  assert.match(
    mainSource,
    /className="hero-share-button"[\s\S]*?onClick=\{\(\) => void handleLandingShare\(\)\}/,
  );
  assert.match(mainSource, /navigator\.share\(\{[\s\S]*?url: landingShareUrl[\s\S]*?\}\)/);
  assert.match(mainSource, /copyTextToClipboard\(landingShareUrl\)/);
  assert.match(stylesSource, /\.hero-share-prompt\s*\{/);
  assert.match(stylesSource, /\.hero-share-button\s*\{/);
});
