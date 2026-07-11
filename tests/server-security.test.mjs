import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";

const originalEnv = { ...process.env };
let importCounter = 0;

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test("deployment hostnames normalize to trusted HTTPS app origins", async () => {
  const { normalizeDeploymentAppUrl } = await loadSecurityHelpers({});

  assert.equal(normalizeDeploymentAppUrl("pleasefindmethis.com"), "https://pleasefindmethis.com");
  assert.equal(normalizeDeploymentAppUrl("javascript:alert(1)"), "");
});

test("public comment helpers normalize identity, content, URLs, and request ids", async () => {
  const {
    getPublicRequestCommentIdentity,
    isUuid,
    normalizePublicCommentSourceUrl,
    sanitizePublicCommentBody,
  } = await loadSecurityHelpers({});
  const commentIdentity = getPublicRequestCommentIdentity("visitor-seed-123");
  const sameCommentIdentity = getPublicRequestCommentIdentity("visitor-seed-123");
  const scopedCommentIdentity = getPublicRequestCommentIdentity("visitor-seed-123", "fingerprint-a", "request-a");
  const samePublicIdentity = getPublicRequestCommentIdentity("visitor-seed-123", "fingerprint-b", "request-a");
  const expectedScopedAlias = uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: " ",
    seed: "visitor-seed-123:request-a",
  });

  assert.equal(commentIdentity.alias, sameCommentIdentity.alias);
  assert.equal(commentIdentity.seedHash.length, 64);
  assert.match(commentIdentity.alias, /^[a-z]+ [a-z]+$/);
  assert.equal(scopedCommentIdentity.alias, samePublicIdentity.alias);
  assert.equal(scopedCommentIdentity.alias, expectedScopedAlias);
  assert.notEqual(scopedCommentIdentity.seedHash, samePublicIdentity.seedHash);
  assert.equal(sanitizePublicCommentBody(" clue   with   spaces \n\n\n and lines "), "clue with spaces \n\n and lines");
  assert.equal(normalizePublicCommentSourceUrl("example.com/item?utm_source=x&color=red#details"), "https://example.com/item?color=red");
  assert.equal(normalizePublicCommentSourceUrl("javascript:alert(1)"), "");
  assert.equal(isUuid("550e8400-e29b-41d4-a716-446655440000"), true);
  assert.equal(isUuid("not-a-request"), false);
});

test("public request comments reject invalid request ids before Supabase lookup", async () => {
  const { handleRequest } = await loadServer({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
  });
  const req = fakeRequest({ host: "pleasefindmethis.com" });
  const res = fakeResponse();

  req.method = "GET";
  req.url = "/api/requests/not-a-request/comments";

  await handleRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(JSON.parse(res.body), {
    error: "A valid request id is required.",
  });
});

test("public request lookup rejects invalid request ids before Supabase lookup", async () => {
  const { handleRequest } = await loadServer({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
  });
  const req = fakeRequest({ host: "pleasefindmethis.com" });
  const res = fakeResponse();

  req.method = "GET";
  req.url = "/api/requests/public?request_id=not-a-request";

  await handleRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(JSON.parse(res.body), {
    error: "A valid request id is required.",
  });
});

test("public request lookup rejects an explicitly empty request id", async () => {
  const { handleRequest } = await loadServer({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
  });
  const req = fakeRequest({ host: "pleasefindmethis.com" });
  const res = fakeResponse();

  req.method = "GET";
  req.url = "/api/requests/public?request_id=";

  await handleRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(JSON.parse(res.body), {
    error: "A valid request id is required.",
  });
});

test("request feeds and comment threads reject signed-out access before reading request data", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  let fetchCount = 0;

  globalThis.fetch = async () => {
    fetchCount += 1;
    throw new Error("Signed-out request access must fail before Supabase is called.");
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });

    for (const url of [
      "/api/requests/public",
      `/api/requests/public?request_id=${requestId}`,
      `/api/requests/public?resource=comments&request_id=${requestId}`,
    ]) {
      const req = fakeRequest({ host: "pleasefindmethis.com" });
      const res = fakeResponse();

      req.method = "GET";
      req.url = url;

      await handleRequest(req, res);

      assert.equal(res.statusCode, 401, url);
      assert.deepEqual(JSON.parse(res.body), {
        error: "Log in to view requests.",
      });
    }

    assert.equal(fetchCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public request lookup returns only the requested public card", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const matchingCard = {
    id: requestId,
    item_name: "Vintage green lamp",
    category: "Home",
    details: "Find this exact lamp",
    duration_days: 14,
    status: "open",
    created_at: "2026-07-09T00:00:00.000Z",
    closes_at: "2026-07-23T00:00:00.000Z",
    days_remaining: 14,
    primary_image_url: "/lamp.jpg",
    submission_count: 0,
  };
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl, options });

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    return new Response(JSON.stringify([matchingCard]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(authenticatedHeaders());
    const res = fakeResponse();

    req.method = "GET";
    req.url = `/api/requests/public?request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { requests: [matchingCard] });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url.pathname, "/auth/v1/user");
    const requestUrl = calls[1].url;
    assert.equal(requestUrl.searchParams.get("id"), `eq.${requestId}`);
    assert.doesNotMatch(
      requestUrl.searchParams.get("select") ?? "",
      /reward|payment|payout|provider|customer/i,
      "the public request card query excludes retired financial fields",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("signed-out shared request documents contain no request-specific data", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  let fetchCount = 0;

  globalThis.fetch = async () => {
    fetchCount += 1;
    throw new Error("A signed-out request document must not read request data.");
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest({ host: "pleasefindmethis.com" });
    const res = fakeResponse();

    req.method = "GET";
    req.url = `/api/requests/public?render=request_page&request_id=${requestId}`;
    await handleRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers["Content-Type"], "text/html; charset=utf-8");
    assert.equal(res.headers["Cache-Control"], "private, no-store");
    assert.equal(res.headers["X-Robots-Tag"], "noindex, nofollow");
    assert.doesNotMatch(res.body, /Help me find this rose blanket|Pink rose print|rose-blanket\.jpg/);
    assert.equal(fetchCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Vercel routes exact shared requests through the existing public function", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.ok(config.rewrites.some((rewrite) =>
    rewrite.source === "/requests/:requestId/:slug" &&
    rewrite.destination === "/api/requests/public?render=request_page&request_id=:requestId"),
  );
  assert.equal(Object.keys(config.functions).length, 1, "no additional serverless function pattern is introduced");
});

test("public requests endpoint serves comments through its resource query", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const comment = {
    id: "22222222-2222-4222-8222-222222222222",
    request_id: requestId,
    body: "I found a promising match.",
    source_url: "https://example.com/match",
    helper_alias: "amber trout",
    helper_avatar_tone: 2,
    created_at: "2026-07-09T01:00:00.000Z",
  };
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl, options });

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        email: "helper@example.com",
        is_anonymous: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        duration_days: 30,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/request_comments")) {
      return new Response(JSON.stringify([comment]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(authenticatedHeaders());
    const res = fakeResponse();

    req.method = "GET";
    req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { comments: [comment] });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/auth/v1/user",
      "/rest/v1/requests",
      "/rest/v1/request_comments",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("expired requests are not exposed as commentable", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const calls = [];

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    calls.push(requestUrl.pathname);

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        duration_days: 7,
        created_at: "2000-01-01T00:00:00.000Z",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(authenticatedHeaders());
    const res = fakeResponse();

    req.method = "GET";
    req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(calls, ["/auth/v1/user", "/rest/v1/requests"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("anonymous comment posts are rejected before request or comment data is accessed", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  let fetchCount = 0;

  globalThis.fetch = async () => {
    fetchCount += 1;
    throw new Error("Anonymous comment submission must fail before Supabase is called.");
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      { host: "pleasefindmethis.com" },
      JSON.stringify({ body: "A useful lead" }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(JSON.parse(res.body), {
      error: "Log in to post a comment.",
    });
    assert.equal(fetchCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public comment posts use one server-fingerprinted RPC without sending raw request signals", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const visitorSeed = "visitor-seed-123";
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl, options });

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        email: "helper@example.com",
        is_anonymous: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        duration_days: 30,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        id: "22222222-2222-4222-8222-222222222222",
        request_id: requestId,
        body: "A useful lead",
        source_url: null,
        helper_alias: "amber trout",
        helper_avatar_tone: 2,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "user-agent": "Test Browser/1.0",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({ body: "A useful lead", visitorSeed }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(JSON.parse(res.body).comment.body, "A useful lead");
    assert.doesNotMatch(res.body, /helper@example\.com|aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/);

    const rpcCalls = calls.filter(({ url }) => url.pathname.endsWith("/rpc/create_public_request_comment"));
    assert.equal(rpcCalls.length, 1);
    assert.equal(rpcCalls[0].options.method, "POST");

    const rpcPayload = JSON.parse(rpcCalls[0].options.body);
    assert.deepEqual(Object.keys(rpcPayload).sort(), [
      "p_body",
      "p_helper_alias",
      "p_helper_avatar_tone",
      "p_helper_seed_hash",
      "p_request_fingerprint_hash",
      "p_request_id",
      "p_source_url",
    ]);
    assert.equal(rpcPayload.p_request_id, requestId);
    assert.equal(rpcPayload.p_body, "A useful lead");
    assert.equal(rpcPayload.p_source_url, null);
    assert.match(rpcPayload.p_helper_seed_hash, /^[0-9a-f]{64}$/);
    assert.match(rpcPayload.p_request_fingerprint_hash, /^[0-9a-f]{64}$/);
    assert.doesNotMatch(rpcCalls[0].options.body, /203\.0\.113\.42|Test Browser/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("posting a clue emails the request owner once through Resend", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const ownerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const commentId = "22222222-2222-4222-8222-222222222222";
  const clueBody = `I found a possible match. ${"Useful matching details. ".repeat(20)}PRIVATE_TAIL`;
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl, options });

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith(`/auth/v1/admin/users/${ownerId}`)) {
      return new Response(JSON.stringify({
        id: ownerId,
        email: "owner@example.com",
        is_anonymous: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: ownerId,
        item_name: "Rose & star blanket",
        status: "open",
        duration_days: 30,
        email_clue_notifications: true,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        id: commentId,
        request_id: requestId,
        body: clueBody,
        source_url: "https://example.com/item",
        helper_alias: "amber trout",
        helper_avatar_tone: 2,
        status: "visible",
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.origin === "https://api.resend.com" && requestUrl.pathname === "/emails") {
      return new Response(JSON.stringify({ id: "email_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      RESEND_API_KEY: "resend-test-key",
      RESEND_EMAIL_DOMAIN: "pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({
        body: clueBody,
        sourceUrl: "https://example.com/item",
        visitorSeed: "visitor-seed-123",
      }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/${requestId}/comments`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 201);
    const resendCalls = calls.filter(({ url }) => url.origin === "https://api.resend.com");
    assert.equal(resendCalls.length, 1);
    assert.equal(resendCalls[0].options.headers["Idempotency-Key"], `request-clue/${commentId}`);
    assert.equal(resendCalls[0].options.headers.Authorization, "Bearer resend-test-key");

    const email = JSON.parse(resendCalls[0].options.body);
    assert.equal(email.from, "Please Find Me This <notifications@pleasefindmethis.com>");
    assert.deepEqual(email.to, ["owner@example.com"]);
    assert.equal(email.subject, "New clue for Rose & star blanket");
    assert.match(email.text, /^amber trout left a new clue/);
    assert.match(email.text, /I found a possible match\./);
    assert.match(email.text, /…/);
    assert.doesNotMatch(email.text, /PRIVATE_TAIL/);
    assert.match(email.text, /https:\/\/pleasefindmethis\.com\/requests\/11111111-1111-4111-8111-111111111111\/rose-and-star-blanket\//);
    assert.match(email.html, />View New Clue<\/a>/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("posting a clue does not email an owner who left request updates off", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const ownerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const paths = [];

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    paths.push(`${requestUrl.origin}${requestUrl.pathname}`);

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: ownerId,
        item_name: "Quiet request",
        status: "open",
        duration_days: 30,
        email_clue_notifications: false,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        id: "22222222-2222-4222-8222-222222222222",
        request_id: requestId,
        body: "A new clue",
        source_url: null,
        helper_alias: "amber trout",
        helper_avatar_tone: 2,
        status: "visible",
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Opted-out requests must not trigger notification lookups: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      RESEND_API_KEY: "resend-test-key",
      RESEND_EMAIL_DOMAIN: "pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({ body: "A new clue", visitorSeed: "visitor-seed-123" }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/${requestId}/comments`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(paths.some((path) => path.includes("/auth/v1/admin/users/")), false);
    assert.equal(paths.some((path) => path.startsWith("https://api.resend.com/")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("flagged clues do not trigger request notification emails", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const ownerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const paths = [];

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    paths.push(`${requestUrl.origin}${requestUrl.pathname}`);

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: ownerId,
        item_name: "Moderated request",
        status: "open",
        duration_days: 30,
        email_clue_notifications: true,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        id: "22222222-2222-4222-8222-222222222222",
        request_id: requestId,
        body: "Suspicious clue",
        source_url: null,
        helper_alias: "amber trout",
        helper_avatar_tone: 2,
        status: "flagged",
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Flagged clues must not trigger notification lookups: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      RESEND_API_KEY: "resend-test-key",
      RESEND_EMAIL_DOMAIN: "pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({ body: "Suspicious clue", visitorSeed: "visitor-seed-123" }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/${requestId}/comments`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(paths.some((path) => path.includes("/auth/v1/admin/users/")), false);
    assert.equal(paths.some((path) => path.startsWith("https://api.resend.com/")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("obvious spam clues are rejected before request notification emails", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const ownerId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const paths = [];
  const spamBody = "Buy followers and likes now for guaranteed results.";

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    paths.push(`${requestUrl.origin}${requestUrl.pathname}`);

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: ownerId,
        item_name: "Spam-targeted request",
        status: "open",
        duration_days: 30,
        email_clue_notifications: true,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        id: "22222222-2222-4222-8222-222222222222",
        request_id: requestId,
        body: spamBody,
        source_url: null,
        helper_alias: "amber trout",
        helper_avatar_tone: 2,
        status: "visible",
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Obvious spam clues must not trigger notification lookups: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      RESEND_API_KEY: "resend-test-key",
      RESEND_EMAIL_DOMAIN: "pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({ body: spamBody, visitorSeed: "visitor-seed-123" }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/${requestId}/comments`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(paths.some((path) => path.includes("/auth/v1/admin/users/")), false);
    assert.equal(paths.some((path) => path.startsWith("https://api.resend.com/")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("request owners do not receive an email for their own comments", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const ownerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const paths = [];

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));
    paths.push(`${requestUrl.origin}${requestUrl.pathname}`);

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: ownerId,
        item_name: "My own request",
        status: "open",
        duration_days: 30,
        email_clue_notifications: true,
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        id: "22222222-2222-4222-8222-222222222222",
        request_id: requestId,
        body: "An update from the owner",
        source_url: null,
        helper_alias: "amber trout",
        helper_avatar_tone: 2,
        status: "visible",
        created_at: new Date().toISOString(),
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Self-comments must not trigger notification lookups: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      RESEND_API_KEY: "resend-test-key",
      RESEND_EMAIL_DOMAIN: "pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({ body: "An update from the owner", visitorSeed: "owner-seed" }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/${requestId}/comments`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(paths.some((path) => path.includes("/auth/v1/admin/users/")), false);
    assert.equal(paths.some((path) => path.startsWith("https://api.resend.com/")), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rotated or missing visitor seeds cannot rotate a request-scoped fingerprint", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const rpcPayloads = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        email: "helper@example.com",
        is_anonymous: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        duration_days: 30,
        created_at: "2026-07-09T01:00:00.000Z",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      const payload = JSON.parse(options.body);
      rpcPayloads.push(payload);
      return new Response(JSON.stringify({
        id: crypto.randomUUID(),
        request_id: payload.p_request_id,
        body: payload.p_body,
        source_url: null,
        helper_alias: payload.p_helper_alias,
        helper_avatar_tone: payload.p_helper_avatar_tone,
        created_at: "2026-07-09T01:00:00.000Z",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });

    for (const [index, visitorSeed] of ["seed-one", "seed-two", undefined, undefined].entries()) {
      const req = fakeRequest(
        {
          authorization: "Bearer valid-comment-token",
          host: "pleasefindmethis.com",
          "user-agent": "Test Browser/1.0",
          "x-vercel-forwarded-for": "203.0.113.42",
        },
        JSON.stringify({ body: `Useful lead ${index}`, ...(visitorSeed ? { visitorSeed } : {}) }),
      );
      const res = fakeResponse();

      req.method = "POST";
      req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

      await handleRequest(req, res);
      assert.equal(res.statusCode, 201);
    }

    const otherRequestId = "33333333-3333-4333-8333-333333333333";
    const otherRequestReq = fakeRequest(
      {
        authorization: "Bearer valid-comment-token",
        host: "pleasefindmethis.com",
        "user-agent": "Test Browser/1.0",
        "x-vercel-forwarded-for": "203.0.113.42",
      },
      JSON.stringify({ body: "A lead on another request", visitorSeed: "seed-one" }),
    );
    const otherRequestRes = fakeResponse();

    otherRequestReq.method = "POST";
    otherRequestReq.url = `/api/requests/public?resource=comments&request_id=${otherRequestId}`;
    await handleRequest(otherRequestReq, otherRequestRes);
    assert.equal(otherRequestRes.statusCode, 201);

    assert.equal(rpcPayloads.length, 5);
    assert.equal(new Set(rpcPayloads.slice(0, 4).map((payload) => payload.p_request_fingerprint_hash)).size, 1);
    assert.notEqual(rpcPayloads[0].p_helper_seed_hash, rpcPayloads[1].p_helper_seed_hash);
    assert.equal(rpcPayloads[2].p_helper_seed_hash, rpcPayloads[3].p_helper_seed_hash);
    assert.equal(rpcPayloads[2].p_helper_alias, rpcPayloads[3].p_helper_alias);
    assert.notEqual(rpcPayloads[0].p_request_fingerprint_hash, rpcPayloads[4].p_request_fingerprint_hash);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("database comment rate limits are returned as HTTP 429", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return new Response(JSON.stringify({
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        email: "helper@example.com",
        is_anonymous: false,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        duration_days: 30,
        created_at: "2026-07-09T01:00:00.000Z",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/rpc/create_public_request_comment")) {
      return new Response(JSON.stringify({
        code: "P0001",
        details: null,
        hint: null,
        message: "public_comment_rate_limit",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      REQUEST_FINGERPRINT_SECRET: "fingerprint-secret",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(
      { authorization: "Bearer valid-comment-token", host: "pleasefindmethis.com", "x-vercel-forwarded-for": "203.0.113.42" },
      JSON.stringify({ body: "One lead too many", visitorSeed: "rotated-again" }),
    );
    const res = fakeResponse();

    req.method = "POST";
    req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 429);
    assert.deepEqual(JSON.parse(res.body), {
      error: "You're posting too quickly. Try again in a few minutes.",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public comment RPC is atomic and its terminal definition is least-privilege", async () => {
  const baseMigration = await readFile(
    new URL("../supabase/migrations/20260709183000_create_public_request_comments.sql", import.meta.url),
    "utf8",
  );
  const retirementMigration = await readFile(
    new URL("../supabase/migrations/20260710125608_retire_marketplace_payments.sql", import.meta.url),
    "utf8",
  );

  assert.match(baseMigration, /create or replace function public\.create_public_request_comment\s*\(/i);
  assert.match(baseMigration, /pg_advisory_xact_lock/i);
  assert.match(baseMigration, /request_fingerprint_hash\s*=\s*p_request_fingerprint_hash/i);
  assert.match(baseMigration, /insert into public\.request_comments/i);
  assert.match(baseMigration, /set search_path\s*=\s*pg_catalog,\s*pg_temp/i);
  assert.match(baseMigration, /revoke all on public\.request_comments from service_role/i);
  assert.match(baseMigration, /grant select on public\.request_comments to service_role/i);
  assert.doesNotMatch(baseMigration, /grant (?:insert|all)[^;]*on public\.request_comments to service_role/i);

  assert.match(retirementMigration, /create or replace function public\.create_public_request_comment[\s\S]+?security invoker/i);
  assert.match(retirementMigration, /created_at \+ make_interval\(days => duration_days\) > timezone\('utc', now\(\)\)/i);
  assert.match(retirementMigration, /grant select, insert on public\.request_comments to service_role/i);
  assert.match(retirementMigration, /revoke all on function public\.create_public_request_comment[\s\S]+from public, anon, authenticated/i);
  assert.match(retirementMigration, /retired_financial_obligations_require_manual_reconciliation/i);
  assert.match(retirementMigration, /lock table public\.requests in access exclusive mode[\s\S]+?lock table public\.request_payment_events in access exclusive mode/i);
  assert.match(retirementMigration, /active_checkout_count[\s\S]+?status = 'checkout_started'[\s\S]+?payment_status = 'checkout_started'/i);
  assert.match(retirementMigration, /'payment\.succeeded'[\s\S]+?'payment\.captured'[\s\S]+?'payment_link\.paid'/i);
  assert.match(retirementMigration, /create or replace function public\.is_free_request_board_ready\(\)/i);
  assert.match(retirementMigration, /grant execute on function public\.create_public_request_comment[\s\S]+to service_role/i);
  assert.doesNotMatch(retirementMigration, /grant execute on function public\.create_public_request_comment[\s\S]+to (anon|authenticated)/i);
});

test("request deletion is granted only to the authenticated request owner", async () => {
  const deletionMigration = await readFile(
    new URL("../supabase/migrations/20260710192303_allow_request_owner_deletion.sql", import.meta.url),
    "utf8",
  );

  assert.match(deletionMigration, /grant delete on table public\.requests to authenticated/i);
  assert.match(deletionMigration, /create policy "Users can delete their own requests"/i);
  assert.match(deletionMigration, /on public\.requests[\s\S]+?for delete[\s\S]+?to authenticated/i);
  assert.match(deletionMigration, /using\s*\(\s*\(select auth\.uid\(\)\)\s*=\s*user_id\s*\)/i);
  assert.doesNotMatch(deletionMigration, /to anon|using\s*\(\s*true\s*\)/i);
});

test("request deletion permanently deletes an authenticated owner's row", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const ownerId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl, options });

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests") && options.method === "DELETE") {
      return new Response(JSON.stringify({ id: requestId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: ownerId,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(authenticatedHeaders());
    const res = fakeResponse();

    req.method = "DELETE";
    req.url = `/api/requests/public?resource=delete&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { deletedRequestId: requestId });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/auth/v1/user",
      "/rest/v1/requests",
      "/rest/v1/requests",
    ]);
    assert.equal(calls[2].options.method, "DELETE");
    assert.equal(calls[2].url.searchParams.get("id"), `eq.${requestId}`);
    assert.equal(calls[2].url.searchParams.get("user_id"), `eq.${ownerId}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("request deletion refuses a signed-in non-owner before issuing DELETE", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));
    calls.push({ url: requestUrl, options });

    if (requestUrl.pathname.endsWith("/auth/v1/user")) {
      return authenticatedUserResponse();
    }

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unexpected Supabase request: ${requestUrl}`);
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest(authenticatedHeaders());
    const res = fakeResponse();

    req.method = "DELETE";
    req.url = `/api/requests/public?resource=delete&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 403);
    assert.deepEqual(JSON.parse(res.body), {
      error: "Only the person who posted this request can delete it.",
    });
    assert.equal(calls.length, 2);
    assert.equal(calls.some(({ options }) => options.method === "DELETE"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("public request comments fail closed without Supabase admin configuration", async () => {
  const { handleRequest } = await loadServer({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
    SUPABASE_SERVICE_ROLE_KEY: "",
    SUPABASE_URL: "",
  });
  const req = fakeRequest({ host: "pleasefindmethis.com" });
  const res = fakeResponse();

  req.method = "GET";
  req.url = "/api/requests/11111111-1111-4111-8111-111111111111/comments";

  await handleRequest(req, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(JSON.parse(res.body), {
    error: "Request comments are unavailable.",
  });
});

test("health check keeps publishing paused until the free-board migration is ready", async () => {
  const healthFunction = await readFile(new URL("../api/health.mjs", import.meta.url), "utf8");
  const originalFetch = globalThis.fetch;
  let migrationReady = false;

  assert.match(healthFunction, /handleRequest/);

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));

    if (requestUrl.pathname.endsWith("/rpc/is_free_request_board_ready")) {
      if (migrationReady) {
        return new Response("true", {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "function is_free_request_board_ready() does not exist" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 200,
      headers: { "Content-Range": "*/0" },
    });
  };

  try {
    const { handleRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      VITE_SUPABASE_URL: "https://example.supabase.co",
    });
    const req = fakeRequest({ host: "pleasefindmethis.com" });
    const res = fakeResponse();

    req.method = "GET";
    req.url = "/api/health";

    await handleRequest(req, res);

    assert.equal(res.statusCode, 503);
    assert.deepEqual(JSON.parse(res.body), {
      ok: false,
      app: "pleasefindmethis-com",
      free_request_board_ready: false,
    });

    migrationReady = true;
    const { handleRequest: handleReadyRequest } = await loadServer({
      PUBLIC_APP_URL: "https://pleasefindmethis.com",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      VITE_SUPABASE_URL: "https://example.supabase.co",
    });
    const readyReq = fakeRequest({ host: "pleasefindmethis.com" });
    const readyRes = fakeResponse();

    readyReq.method = "GET";
    readyReq.url = "/api/health";

    await handleReadyRequest(readyReq, readyRes);

    assert.equal(readyRes.statusCode, 200);
    assert.deepEqual(JSON.parse(readyRes.body), {
      ok: true,
      app: "pleasefindmethis-com",
      free_request_board_ready: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("retired checkout, webhook, and payout administration APIs return 404", async () => {
  const { handleRequest } = await loadServer({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
  });
  const retiredRoutes = [
    ["POST", "/api/payments/checkout"],
    ["POST", "/api/dodo/checkout"],
    ["POST", "/api/dodo/webhook"],
    ["POST", "/api/lemonsqueezy/checkout"],
    ["POST", "/api/lemonsqueezy/webhook"],
    ["POST", "/api/whop/checkout"],
    ["POST", "/api/whop/webhook"],
    ["POST", "/api/razorpay/checkout"],
    ["POST", "/api/razorpay/webhook"],
    ["GET", "/api/admin/payout-cases"],
  ];

  for (const [method, pathname] of retiredRoutes) {
    const req = fakeRequest({ host: "pleasefindmethis.com" });
    const res = fakeResponse();
    req.method = method;
    req.url = pathname;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 404, `${method} ${pathname} remains retired`);
    assert.equal(res.body, "Not found");
  }
});

async function loadSecurityHelpers(env) {
  const module = await loadServer(env);
  return module.__securityTest;
}

async function loadServer(env) {
  process.env = {
    ...originalEnv,
    REQUEST_NOTIFICATION_FROM_EMAIL: "",
    RESEND_API_KEY: "",
    RESEND_EMAIL_DOMAIN: "",
    WAITLIST_FROM_EMAIL: "",
    ...env,
    NODE_ENV: "production",
    VERCEL: "1",
  };

  return import(`../server.mjs?security-test=${++importCounter}`);
}

function fakeRequest(headers, body = "") {
  return {
    headers,
    socket: {
      encrypted: false,
    },
    async *[Symbol.asyncIterator]() {
      if (body) {
        yield Buffer.from(body);
      }
    },
  };
}

function authenticatedHeaders(headers = {}) {
  return {
    authorization: "Bearer valid-request-token",
    host: "pleasefindmethis.com",
    ...headers,
  };
}

function authenticatedUserResponse() {
  return new Response(JSON.stringify({
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    email: "helper@example.com",
    is_anonymous: false,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function fakeResponse() {
  return {
    body: "",
    headers: {},
    headersSent: false,
    statusCode: undefined,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      this.headersSent = true;
    },
    end(body = "") {
      this.body += body;
    },
  };
}
