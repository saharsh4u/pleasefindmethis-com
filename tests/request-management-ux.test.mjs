import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");

function getSection(startMarker, endMarker) {
  const start = mainSource.indexOf(startMarker);
  const end = mainSource.indexOf(endMarker, start + startMarker.length);

  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return mainSource.slice(start, end);
}

test("post-success page keeps only the live confirmation, image, description, and live-request action", () => {
  const sharePage = getSection("function ShareRequestPage", "function BrowsePage");

  assert.match(sharePage, />Your search is live\.<\/h1>/);
  assert.match(sharePage, /<img src=\{publishedRequest\.image\} alt=\{`\$\{publishedRequest\.itemName\} reference`\} \/>/);
  assert.match(sharePage, /requestDescription/);
  assert.match(sharePage, /✅ Check Live Request/);
  assert.doesNotMatch(sharePage, /Give it a head start|fastest finds|Looking for:|Must Match/i);
  assert.doesNotMatch(sharePage, /share-actions-panel|share-progress|share-page-footer|Copy link|WhatsApp|Reddit/);
});

test("browse-all page has no search UI while retaining sorting and incremental loading", () => {
  const browseAllPage = getSection("function BrowseAllPage", "function RequestSquareCard");

  assert.doesNotMatch(browseAllPage, /search-field|Search all requests|placeholder=/);
  assert.doesNotMatch(browseAllPage, /const \[query, setQuery\]/);
  assert.match(browseAllPage, /\.sort\(/);
  assert.match(browseAllPage, /visibleCount/);
  assert.match(browseAllPage, /Loading more requests as you scroll/);
});

test("homepage aligns the desktop side rails and removes the mobile bottom ticker", () => {
  const landingPage = getSection("function LandingPage", "function AuthPage");

  assert.match(landingPage, /mobile-find-ticker-top/);
  assert.doesNotMatch(landingPage, /mobile-find-ticker-bottom|mobile-find-ticker-track-right/);
  assert.match(landingPage, /className="side-find-rail side-find-rail-right"/);
  assert.doesNotMatch(landingPage, /className="[^"]*side-find-rail-bottom/);
});

test("dashboard deletion uses the authenticated server boundary and clears app-level state", () => {
  const dashboardPage = getSection("function PosterDashboardPage", "function PolicyPage");

  assert.match(dashboardPage, /resource=delete/);
  assert.match(dashboardPage, /method: "DELETE"/);
  assert.match(dashboardPage, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(dashboardPage, /onRequestDeleted\(request\.id\)/);
  assert.match(dashboardPage, /setRequests[\s\S]+onRequestDeleted[\s\S]+notifyRequestFeedChanged[\s\S]+storage[\s\S]+\.from/);
  assert.doesNotMatch(dashboardPage, /\.from\("requests"\)[\s\S]{0,120}\.delete\(\)/);
});
