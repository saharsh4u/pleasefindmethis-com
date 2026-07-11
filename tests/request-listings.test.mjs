import assert from "node:assert/strict";
import { test } from "node:test";

import { authenticatedRequestPages, canLoadRequestData } from "../src/lib/request-access.mjs";
import { mergeRequestListings } from "../src/lib/request-listings.mjs";

test("every route that renders posted request data requires a resolved authenticated session", () => {
  assert.deepEqual(authenticatedRequestPages, [
    "landing",
    "browse",
    "browse-all",
    "request-detail",
  ]);

  for (const page of authenticatedRequestPages) {
    assert.equal(canLoadRequestData(page, { authResolved: false, signedIn: false }), false);
    assert.equal(canLoadRequestData(page, { authResolved: true, signedIn: false }), false);
    assert.equal(canLoadRequestData(page, { authResolved: true, signedIn: true }), true);
  }
});

test("live requests are added ahead of homepage defaults without replacing them", () => {
  const live = [
    { id: "live-1", name: "User request" },
    { id: "shared", name: "Updated shared request" },
  ];
  const defaults = [
    { id: "default-1", name: "Default request" },
    { id: "shared", name: "Old shared request" },
    { id: "default-2", name: "Another default" },
  ];

  assert.deepEqual(mergeRequestListings(live, defaults), [
    live[0],
    live[1],
    defaults[0],
    defaults[2],
  ]);
});

test("homepage defaults remain unchanged when there are no live requests", () => {
  const defaults = [
    { id: "default-1" },
    { id: "default-2" },
  ];

  assert.deepEqual(mergeRequestListings([], defaults), defaults);
});
