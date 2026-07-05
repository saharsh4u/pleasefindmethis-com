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
