import assert from "node:assert/strict";
import { test } from "node:test";

import { authenticatedRequestPages, canLoadRequestData } from "../src/lib/request-access.mjs";
import { mergeRequestListings } from "../src/lib/request-listings.mjs";

test("browse and request-detail routes are public read-only surfaces", () => {
  assert.deepEqual(authenticatedRequestPages, []);

  for (const page of ["landing", "browse", "browse-all", "request-detail"]) {
    assert.equal(canLoadRequestData(page, { authResolved: false, signedIn: false }), true);
    assert.equal(canLoadRequestData(page, { authResolved: true, signedIn: false }), true);
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
