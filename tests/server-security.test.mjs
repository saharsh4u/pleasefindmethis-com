import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

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

function fakeRequest(headers) {
  return {
    headers,
    socket: {
      encrypted: false,
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
