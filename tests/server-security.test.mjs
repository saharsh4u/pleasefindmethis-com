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

test("production checkout origin rejects attacker-controlled Host headers without a trusted app URL", async () => {
  const { getCheckoutRedirectOrigin } = await loadSecurityHelpers({
    PUBLIC_APP_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "",
    VITE_PUBLIC_APP_URL: "",
  });

  const origin = getCheckoutRedirectOrigin(fakeRequest({
    host: "evil.example",
    "x-forwarded-host": "evil.example",
    "x-forwarded-proto": "https",
  }));

  assert.equal(origin, "");
});

test("production checkout route fails closed when no trusted public origin is configured", async () => {
  const { handleRequest } = await loadServer({
    LEMONSQUEEZY_API_KEY: "test-api-key",
    LEMONSQUEEZY_STORE_ID: "123",
    LEMONSQUEEZY_TEST_MODE: "false",
    LEMONSQUEEZY_VARIANT_ID: "456",
    PAYMENT_PROVIDER: "lemonsqueezy",
    PUBLIC_APP_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "",
    VITE_PUBLIC_APP_URL: "",
  });
  const req = fakeRequest({
    authorization: "Bearer test-session",
    host: "evil.example",
    "x-forwarded-host": "evil.example",
    "x-forwarded-proto": "https",
  });
  const res = fakeResponse();

  req.method = "POST";
  req.url = "/api/lemonsqueezy/checkout";

  await handleRequest(req, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(JSON.parse(res.body), {
    error: "Checkout is unavailable until the public app URL is configured.",
  });
});

test("production checkout origin uses configured public app URL instead of request headers", async () => {
  const { getCheckoutRedirectOrigin } = await loadSecurityHelpers({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
    VERCEL_PROJECT_PRODUCTION_URL: "",
    VITE_PUBLIC_APP_URL: "",
  });

  const origin = getCheckoutRedirectOrigin(fakeRequest({
    host: "evil.example",
    "x-forwarded-host": "evil.example",
    "x-forwarded-proto": "https",
  }));

  assert.equal(origin, "https://pleasefindmethis.com");
});

test("production checkout origin can use Vercel production URL as a trusted fallback", async () => {
  const { getCheckoutRedirectOrigin, normalizeDeploymentAppUrl } = await loadSecurityHelpers({
    PUBLIC_APP_URL: "",
    VERCEL_PROJECT_PRODUCTION_URL: "pleasefindmethis.com",
    VITE_PUBLIC_APP_URL: "",
  });

  const origin = getCheckoutRedirectOrigin(fakeRequest({
    host: "evil.example",
    "x-forwarded-host": "evil.example",
    "x-forwarded-proto": "https",
  }));

  assert.equal(normalizeDeploymentAppUrl("pleasefindmethis.com"), "https://pleasefindmethis.com");
  assert.equal(origin, "https://pleasefindmethis.com");
});

test("payment provider selector supports Razorpay", async () => {
  const { getPaymentProvider } = await loadSecurityHelpers({
    PAYMENT_PROVIDER: "razorpay",
    RAZORPAY_KEY_ID: "rzp_test_123",
    RAZORPAY_KEY_SECRET: "test-secret",
  });

  assert.equal(getPaymentProvider(), "razorpay");
});

test("Razorpay webhook signatures are checked against the raw body", async () => {
  const { verifyRazorpaySignature } = await loadSecurityHelpers({});
  const body = Buffer.from(JSON.stringify({ event: "payment_link.paid", payload: { payment_link: { entity: { id: "plink_test" } } } }));
  const secret = "webhook-secret";
  const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

  assert.equal(verifyRazorpaySignature(body, signature, secret), true);
  assert.equal(verifyRazorpaySignature(body, signature, "wrong-secret"), false);
});

test("payment metadata preserves DataFast visitor attribution", async () => {
  const {
    getAnalyticsContextFromPaymentMetadata,
    getPaymentAnalyticsMetadata,
    getPublicRequestCommentIdentity,
    getRazorpayPaymentNotes,
    isUuid,
    normalizePublicCommentSourceUrl,
    sanitizeCheckoutAnalyticsContext,
    sanitizePublicCommentBody,
  } = await loadSecurityHelpers({});
  const analytics = sanitizeCheckoutAnalyticsContext({
    datafast_visitor_id: " dfv_test_123 ",
    ga_client_id: "ga-client",
    latest_source: "google",
  });
  const commentIdentity = getPublicRequestCommentIdentity("visitor-seed-123");
  const sameCommentIdentity = getPublicRequestCommentIdentity("visitor-seed-123");
  const scopedCommentIdentity = getPublicRequestCommentIdentity("visitor-seed-123", "fingerprint-a", "request-a");
  const samePublicIdentity = getPublicRequestCommentIdentity("visitor-seed-123", "fingerprint-b", "request-a");
  const expectedScopedAlias = uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: " ",
    seed: "visitor-seed-123:request-a",
  });

  const metadata = getPaymentAnalyticsMetadata(analytics);
  const restored = getAnalyticsContextFromPaymentMetadata(metadata);
  const razorpayNotes = getRazorpayPaymentNotes({
    analytics,
    category: "Fashion",
    durationDays: 30,
    itemName: "Rare jacket",
    requestId: "req_123",
  });

  assert.equal(metadata.datafast_visitor_id, "dfv_test_123");
  assert.equal(restored.datafast_visitor_id, "dfv_test_123");
  assert.equal(razorpayNotes.datafast_visitor_id, "dfv_test_123");
  assert.ok(Object.keys(razorpayNotes).length <= 15);
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

test("DataFast Payment API receives confirmed payment revenue", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response("", { status: 200 });
  };

  try {
    const { sendPaidRequestDataFastPayment } = await loadSecurityHelpers({
      DATAFAST_API_KEY: "test-datafast-key",
      DATAFAST_PAYMENT_API_URL: "https://datafa.st.test/api/v1/payments",
    });

    await sendPaidRequestDataFastPayment({
      analytics: { datafast_visitor_id: "dfv_test_123" },
      provider: "razorpay",
      providerEventId: "evt_test_123",
      request: {
        id: "req_123",
        total_due: 25,
        currency: "USD",
      },
      transactionId: "pay_test_123",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://datafa.st.test/api/v1/payments");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-datafast-key");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    amount: 25,
    currency: "USD",
    transaction_id: "razorpay:pay_test_123",
    datafast_visitor_id: "dfv_test_123",
  });
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

test("public request lookup returns only the requested public card", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const matchingCard = {
    id: requestId,
    item_name: "Vintage green lamp",
    category: "Home",
    details: "Find this exact lamp",
    reward: 25,
    duration_days: 14,
    status: "open",
    payment_status: "free",
    created_at: "2026-07-09T00:00:00.000Z",
    paid_at: null,
    closes_at: "2026-07-23T00:00:00.000Z",
    days_remaining: 14,
    primary_image_url: "/lamp.jpg",
    submission_count: 0,
  };
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
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
    const req = fakeRequest({ host: "pleasefindmethis.com" });
    const res = fakeResponse();

    req.method = "GET";
    req.url = `/api/requests/public?request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { requests: [matchingCard] });
    assert.equal(calls.length, 1);
    assert.equal(new URL(calls[0].url).searchParams.get("id"), `eq.${requestId}`);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("shared request documents contain request-specific social metadata", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const sourceIndex = await readFile(new URL("../index.html", import.meta.url), "utf8");

  globalThis.fetch = async (url) => {
    const requestUrl = new URL(String(url));

    if (requestUrl.pathname.endsWith("/public_request_cards")) {
      return new Response(JSON.stringify([{
        id: requestId,
        item_name: "Help me find this rose blanket",
        category: "Home goods",
        details: "Pink rose print & fringed edges. The exact pattern matters.",
        reward: 0,
        duration_days: 14,
        status: "open",
        payment_status: "free",
        created_at: "2026-07-09T01:00:00.000Z",
        paid_at: null,
        closes_at: "2026-07-23T01:00:00.000Z",
        days_remaining: 14,
        primary_image_url: "https://cdn.example/rose-blanket.jpg",
        submission_count: 2,
      }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (requestUrl.hostname === "pleasefindmethis.com" && requestUrl.pathname === "/index.html") {
      return new Response(sourceIndex, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }

    throw new Error(`Unexpected request document fetch: ${requestUrl}`);
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
    assert.match(res.headers["Cache-Control"], /s-maxage=60/);
    assert.match(res.body, /<title>Help me find this rose blanket \| pleasefindmethis<\/title>/);
    assert.match(res.body, /property="og:title" content="Help me find this rose blanket \| pleasefindmethis"/);
    assert.match(res.body, /property="og:description" content="[^"]*Pink rose print &amp; fringed edges/);
    assert.match(res.body, /property="og:image" content="https:\/\/cdn\.example\/rose-blanket\.jpg"/);
    assert.match(res.body, new RegExp(`property="og:url" content="https://pleasefindmethis\\.com/requests/${requestId}/help-me-find-this-rose-blanket"`));
    assert.match(res.body, new RegExp(`rel="canonical" href="https://pleasefindmethis\\.com/requests/${requestId}/help-me-find-this-rose-blanket"`));
    assert.doesNotMatch(res.body, /<title>Someone out there knows where it is \| pleasefindmethis<\/title>/);
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

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        payment_status: "free",
        paid_at: null,
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
    const req = fakeRequest({ host: "pleasefindmethis.com" });
    const res = fakeResponse();

    req.method = "GET";
    req.url = `/api/requests/public?resource=comments&request_id=${requestId}`;

    await handleRequest(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { comments: [comment] });
    assert.deepEqual(calls.map(({ url }) => url.pathname), [
      "/rest/v1/requests",
      "/rest/v1/request_comments",
    ]);
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

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        payment_status: "free",
        paid_at: null,
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
    const req = fakeRequest(
      {
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

test("rotated or missing visitor seeds cannot rotate a request-scoped fingerprint", async () => {
  const originalFetch = globalThis.fetch;
  const requestId = "11111111-1111-4111-8111-111111111111";
  const rpcPayloads = [];

  globalThis.fetch = async (url, options = {}) => {
    const requestUrl = new URL(String(url));

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        payment_status: "free",
        paid_at: null,
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

    if (requestUrl.pathname.endsWith("/requests")) {
      return new Response(JSON.stringify({
        id: requestId,
        status: "open",
        payment_status: "free",
        paid_at: null,
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
      { host: "pleasefindmethis.com", "x-vercel-forwarded-for": "203.0.113.42" },
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

test("public comment RPC atomically locks, counts, and inserts for service_role only", async () => {
  const migration = await readFile(
    new URL("../supabase/migrations/20260709183000_create_public_request_comments.sql", import.meta.url),
    "utf8",
  );

  assert.match(migration, /create or replace function public\.create_public_request_comment\s*\(/i);
  assert.match(migration, /pg_advisory_xact_lock/i);
  assert.match(migration, /request_fingerprint_hash\s*=\s*p_request_fingerprint_hash/i);
  assert.match(migration, /insert into public\.request_comments/i);
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path\s*=\s*pg_catalog,\s*pg_temp/i);
  assert.match(migration, /revoke all on public\.request_comments from service_role/i);
  assert.match(migration, /grant select on public\.request_comments to service_role/i);
  assert.doesNotMatch(migration, /grant (?:insert|all)[^;]*on public\.request_comments to service_role/i);
  assert.match(migration, /revoke all on function public\.create_public_request_comment[\s\S]+from public/i);
  assert.match(migration, /grant execute on function public\.create_public_request_comment[\s\S]+to service_role/i);
  assert.doesNotMatch(migration, /grant execute on function public\.create_public_request_comment[\s\S]+to (anon|authenticated)/i);
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

test("admin payout review route does not expose queues without an admin bearer token", async () => {
  const { handleRequest } = await loadServer({
    PUBLIC_APP_URL: "https://pleasefindmethis.com",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  });
  const req = fakeRequest({ host: "pleasefindmethis.com" });
  const res = fakeResponse();

  req.method = "GET";
  req.url = "/api/admin/payout-cases";

  await handleRequest(req, res);

  assert.equal(res.statusCode, 401);
  assert.deepEqual(JSON.parse(res.body), {
    error: "Sign in as a marketplace admin before opening payout review.",
  });
});

async function loadSecurityHelpers(env) {
  const module = await loadServer(env);
  return module.__securityTest;
}

async function loadServer(env) {
  process.env = {
    ...originalEnv,
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
