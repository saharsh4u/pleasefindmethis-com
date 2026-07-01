import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { Webhook } from "standardwebhooks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const env = await loadLocalEnv(mode, root);

for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const isProduction = mode === "production";
const host = process.env.HOST ?? "127.0.0.1";
let port = Number(process.env.PORT ?? 5173);
const distRoot = path.resolve(root, "dist");
const supabaseAdmin = createSupabaseAdminClient();
const paymentProviderTimeoutMs = 20000;
const minimumReward = 10;
const platformServiceFeeRate = 0.12;
const trustProtectionRate = 0.03;
const minimumPlatformFee = 6;
const minimumTrustProtectionFee = 1;

const vite = isProduction ? null : await createDevViteServer();

export async function handleRequest(req, res) {
  try {
    const requestUrl = new URL(req.url ?? "/", getRequestOrigin(req));

    if (requestUrl.pathname === "/api/dodo/checkout") {
      await handleCreateDodoCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/lemonsqueezy/checkout") {
      await handleCreateLemonSqueezyCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/payments/checkout") {
      await handleCreatePaymentCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/dodo/webhook") {
      await handleDodoWebhook(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/lemonsqueezy/webhook") {
      await handleLemonSqueezyWebhook(req, res);
      return;
    }

    if (vite) {
      vite.middlewares(req, res, () => {
        sendText(res, 404, "Not found");
      });
      return;
    }

    await serveStaticAsset(requestUrl.pathname, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: error instanceof Error ? error.message : "Unexpected server error." });
    } else {
      res.end();
    }
  }
}

const shouldListen = process.env.VERCEL !== "1";
const server = shouldListen ? http.createServer(handleRequest) : null;

if (server) {
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && !process.env.PORT) {
      port += 1;
      listen();
      return;
    }

    console.error(error);
    process.exit(1);
  });

  server.on("listening", () => {
    console.log(`Server listening at http://${host}:${port}`);
  });

  listen();
}

function listen() {
  server?.listen(port, host);
}

async function createDevViteServer() {
  const { createServer } = await import("vite");
  const hmrPort = await findOpenPort(Number(process.env.HMR_PORT ?? 24678));

  return createServer({
    root,
    appType: "spa",
    server: {
      host,
      hmr: {
        port: hmrPort,
      },
      middlewareMode: true,
    },
  });
}

function findOpenPort(startPort) {
  const normalizedStartPort = Number.isFinite(startPort) && startPort > 0 ? Math.round(startPort) : 24678;

  return new Promise((resolve, reject) => {
    const tryPort = (candidatePort) => {
      const probe = http.createServer();

      probe.once("error", (error) => {
        probe.close();

        if (error.code === "EADDRINUSE") {
          tryPort(candidatePort + 1);
          return;
        }

        reject(error);
      });

      probe.once("listening", () => {
        probe.close(() => resolve(candidatePort));
      });

      probe.listen(candidatePort);
    };

    tryPort(normalizedStartPort);
  });
}

async function loadLocalEnv(currentMode, rootDir) {
  const files = [".env", ".env.local", `.env.${currentMode}`, `.env.${currentMode}.local`];
  const values = {};

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(rootDir, file), "utf8");
      Object.assign(values, parseEnvFile(content));
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return values;
}

function parseEnvFile(content) {
  const values = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const entry = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const separatorIndex = entry.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = entry.slice(0, separatorIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }

    let value = entry.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

async function handleCreateDodoCheckout(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const productId = process.env.DODO_PRODUCT_ID;

  if (!apiKey || !productId) {
    sendJson(res, 503, {
      error: "Dodo Payments is not configured. Create an API key and a one-time pay-what-you-want product in your own Dodo dashboard, then set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.",
    });
    return;
  }

  const checkoutRequest = await readCheckoutRequest(req, res);

  if (!checkoutRequest) {
    return;
  }

  const { breakdown, category, details, durationDays, email, itemName, name, requestId } = checkoutRequest;
  const origin = getRequestOrigin(req);
  const checkoutPayload = {
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: breakdown.total * 100,
      },
    ],
    billing_currency: "USD",
    allowed_payment_method_types: getAllowedPaymentMethodTypes(),
    customer: {
      email,
      ...(name ? { name } : {}),
    },
    metadata: {
      ...(requestId ? { request_id: requestId } : {}),
      item_name: itemName,
      category,
      details,
      finder_payout_usd: String(breakdown.reward),
      platform_service_fee_usd: String(breakdown.platformFee),
      refund_protection_reserve_usd: String(breakdown.protection),
      platform_share_usd: String(breakdown.platformShare),
      total_usd: String(breakdown.total),
      duration_days: String(durationDays),
      source: "pleasefindmethis-post-paywall",
    },
    return_url: `${origin}/#/poster-dashboard?checkout=success`,
    cancel_url: `${origin}/#/post/pay?checkout=cancelled`,
  };

  let dodoResponse;

  try {
    dodoResponse = await fetchWithTimeout(
      `${getDodoApiBase()}/checkouts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      },
      paymentProviderTimeoutMs,
    );
  } catch (error) {
    console.error("Dodo checkout creation timed out or failed", error);
    await updateRequestPaymentState(requestId, {
      status: "checkout_failed",
      payment_status: "failed",
    });
    sendJson(res, 504, { error: "The payment provider took too long to create checkout. Please try again." });
    return;
  }

  const responseText = await dodoResponse.text();
  const dodoPayload = parseJson(responseText);

  if (!dodoResponse.ok) {
    console.error("Dodo checkout creation failed", dodoResponse.status, dodoPayload ?? responseText);
    await updateRequestPaymentState(requestId, {
      status: "checkout_failed",
      payment_status: "failed",
    });
    const checkoutError = getDodoCheckoutError(dodoResponse.status, dodoPayload);
    sendJson(res, checkoutError.status, { error: checkoutError.message });
    return;
  }

  if (!isRecord(dodoPayload) || typeof dodoPayload.checkout_url !== "string") {
    console.error("Dodo checkout response did not include checkout_url", dodoPayload);
    sendJson(res, 502, { error: "Dodo did not return a checkout URL." });
    return;
  }

  const sessionId = typeof dodoPayload.session_id === "string" ? dodoPayload.session_id : null;
  await updateRequestPaymentState(requestId, {
    payment_provider: "dodo",
    ...(sessionId ? { checkout_session_id: sessionId } : {}),
    checkout_url: dodoPayload.checkout_url,
    status: "checkout_started",
    payment_status: "checkout_started",
  });

  sendJson(res, 200, {
    checkoutUrl: dodoPayload.checkout_url,
    sessionId,
    total: breakdown.total,
    split: {
      finderPayout: breakdown.reward,
      platformServiceFee: breakdown.platformFee,
      refundProtectionReserve: breakdown.protection,
      platformShare: breakdown.platformShare,
    },
  });
}

async function handleCreatePaymentCheckout(req, res) {
  const provider = getPaymentProvider();

  if (provider === "lemonsqueezy") {
    await handleCreateLemonSqueezyCheckout(req, res);
    return;
  }

  await handleCreateDodoCheckout(req, res);
}

async function handleCreateLemonSqueezyCheckout(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    sendJson(res, 503, {
      error: "Lemon Squeezy is not configured. Create an API key, store, and one-time product variant, then set LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, and LEMONSQUEEZY_VARIANT_ID.",
    });
    return;
  }

  const checkoutRequest = await readCheckoutRequest(req, res);

  if (!checkoutRequest) {
    return;
  }

  const { breakdown, category, details, durationDays, email, itemName, name, requestId } = checkoutRequest;
  const origin = getRequestOrigin(req);
  const checkoutPayload = {
    data: {
      type: "checkouts",
      attributes: {
        custom_price: breakdown.total * 100,
        product_options: {
          name: `Fund request: ${itemName}`,
          description: `Finder reward: US$${breakdown.reward}. Service and protection fees: US$${breakdown.platformShare}. Category: ${category}.`,
          redirect_url: `${origin}/#/poster-dashboard?checkout=success`,
          enabled_variants: [parseLemonSqueezyVariantId(variantId)],
          receipt_button_text: "View your request",
          receipt_link_url: `${origin}/#/poster-dashboard?checkout=success`,
        },
        checkout_options: {
          embed: false,
          media: false,
          logo: true,
          desc: true,
          discount: false,
          button_color: "#0a6d3b",
        },
        checkout_data: {
          email,
          name,
          custom: {
            ...(requestId ? { request_id: requestId } : {}),
            item_name: itemName,
            category,
            details,
            finder_payout_usd: String(breakdown.reward),
            platform_service_fee_usd: String(breakdown.platformFee),
            refund_protection_reserve_usd: String(breakdown.protection),
            platform_share_usd: String(breakdown.platformShare),
            total_usd: String(breakdown.total),
            duration_days: String(durationDays),
            source: "pleasefindmethis-post-paywall",
            payment_provider: "lemonsqueezy",
          },
        },
        test_mode: parseBooleanEnv("LEMONSQUEEZY_TEST_MODE", false),
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: storeId,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    },
  };

  let lemonResponse;

  try {
    lemonResponse = await fetchWithTimeout(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify(checkoutPayload),
      },
      paymentProviderTimeoutMs,
    );
  } catch (error) {
    console.error("Lemon Squeezy checkout creation timed out or failed", error);
    await updateRequestPaymentState(requestId, {
      status: "checkout_failed",
      payment_status: "failed",
    });
    sendJson(res, 504, { error: "The payment provider took too long to create checkout. Please try again." });
    return;
  }

  const responseText = await lemonResponse.text();
  const lemonPayload = parseJson(responseText);

  if (!lemonResponse.ok) {
    console.error("Lemon Squeezy checkout creation failed", lemonResponse.status, getLemonSqueezyErrorSummary(lemonPayload, responseText));
    await updateRequestPaymentState(requestId, {
      status: "checkout_failed",
      payment_status: "failed",
    });
    sendJson(res, 502, {
      error: getLemonSqueezyCheckoutError(lemonResponse.status, lemonPayload),
    });
    return;
  }

  const checkoutData = isRecord(lemonPayload) && isRecord(lemonPayload.data) ? lemonPayload.data : {};
  const checkoutAttributes = isRecord(checkoutData.attributes) ? checkoutData.attributes : {};
  const checkoutUrl = parseString(checkoutAttributes.url, 1000);
  const checkoutId = parseString(checkoutData.id, 160);

  if (!checkoutUrl) {
    console.error("Lemon Squeezy checkout response did not include a URL", getLemonSqueezyErrorSummary(lemonPayload, responseText));
    sendJson(res, 502, { error: "Lemon Squeezy did not return a checkout URL." });
    return;
  }

  await updateRequestPaymentState(requestId, {
    payment_provider: "lemonsqueezy",
    ...(checkoutId ? { checkout_session_id: checkoutId } : {}),
    checkout_url: checkoutUrl,
    status: "checkout_started",
    payment_status: "checkout_started",
  });

  sendJson(res, 200, {
    provider: "lemonsqueezy",
    checkoutUrl,
    sessionId: checkoutId || null,
    total: breakdown.total,
    split: {
      finderPayout: breakdown.reward,
      platformServiceFee: breakdown.platformFee,
      refundProtectionReserve: breakdown.protection,
      platformShare: breakdown.platformShare,
    },
  });
}

async function handleDodoWebhook(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

  if (!webhookSecret) {
    sendJson(res, 503, { error: "Dodo webhook secret is not configured." });
    return;
  }

  const rawBody = await readRawBody(req);

  try {
    const webhook = new Webhook(webhookSecret);
    const event = webhook.verify(rawBody.toString("utf8"), {
      "webhook-id": firstHeader(req.headers["webhook-id"]),
      "webhook-signature": firstHeader(req.headers["webhook-signature"]),
      "webhook-timestamp": firstHeader(req.headers["webhook-timestamp"]),
    });

    const eventType = getDodoEventType(event);
    const eventData = getDodoEventData(event);
    await syncDodoEventToRequest(eventType, eventData, event);
    console.log("Verified Dodo webhook", {
      type: eventType,
      paymentId: eventData.payment_id,
      sessionId: eventData.session_id,
    });

    sendJson(res, 200, { received: true });
  } catch (error) {
    console.error("Invalid Dodo webhook signature", error);
    sendJson(res, 400, { error: "Invalid webhook signature." });
  }
}

async function handleLemonSqueezyWebhook(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    sendJson(res, 503, { error: "Lemon Squeezy webhook secret is not configured." });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = firstHeader(req.headers["x-signature"]);

  if (!verifyLemonSqueezySignature(rawBody, signature, webhookSecret)) {
    console.error("Invalid Lemon Squeezy webhook signature");
    sendJson(res, 400, { error: "Invalid webhook signature." });
    return;
  }

  const event = parseJson(rawBody.toString("utf8"));

  if (!isRecord(event)) {
    sendJson(res, 400, { error: "Webhook body must be valid JSON." });
    return;
  }

  const eventType = getLemonSqueezyEventType(event);
  const eventData = isRecord(event.data) ? event.data : {};
  await syncLemonSqueezyEventToRequest(eventType, eventData, event);
  console.log("Verified Lemon Squeezy webhook", {
    type: eventType,
    orderId: eventData.id,
  });

  sendJson(res, 200, { received: true });
}

function getEscrowBreakdown(reward) {
  const normalizedReward = Math.max(minimumReward, Math.round(reward));
  const platformFee = Math.max(minimumPlatformFee, Math.round(normalizedReward * platformServiceFeeRate));
  const protection = Math.max(minimumTrustProtectionFee, Math.round(normalizedReward * trustProtectionRate));
  const platformShare = platformFee + protection;

  return {
    reward: normalizedReward,
    platformFee,
    protection,
    platformShare,
    total: normalizedReward + platformFee + protection,
  };
}

function getDodoCheckoutError(status, payload) {
  const code = isRecord(payload) ? parseString(payload.code, 80) : "";
  const upstreamMessage = isRecord(payload) ? parseString(payload.message ?? payload.error, 240) : "";

  if (code === "MERCHANT_NOT_LIVE") {
    return {
      status: 503,
      message: "Dodo live payments are not enabled for this merchant yet. Product review and payout verification must finish before posters can pay.",
    };
  }

  if (status === 401) {
    return {
      status: 502,
      message: "Dodo rejected the API key for the selected environment. Check that the API key, product id, and DODO_PAYMENTS_ENVIRONMENT all come from the same Dodo mode.",
    };
  }

  return {
    status: 502,
    message:
      upstreamMessage ||
      "Dodo rejected the checkout request. Check that the API key and product id come from your Dodo account and the product supports custom amounts.",
  };
}

function getLemonSqueezyCheckoutError(status, payload) {
  const errors = isRecord(payload) && Array.isArray(payload.errors) ? payload.errors : [];
  const firstError = errors.find(isRecord);
  const title = isRecord(firstError) ? parseString(firstError.title, 160) : "";
  const detail = isRecord(firstError) ? parseString(firstError.detail, 240) : "";
  const fallback = detail || title;

  if (status === 401) {
    return "Lemon Squeezy rejected the API key. Create a fresh API key and confirm it is stored in LEMONSQUEEZY_API_KEY.";
  }

  if (status === 422) {
    return fallback || "Lemon Squeezy rejected the checkout configuration. Check the store id, variant id, and custom price settings.";
  }

  return fallback || "Lemon Squeezy rejected the checkout request.";
}

function getLemonSqueezyErrorSummary(payload, responseText) {
  if (!isRecord(payload)) {
    return responseText.slice(0, 500);
  }

  if (Array.isArray(payload.errors)) {
    return payload.errors.map((error) => {
      if (!isRecord(error)) {
        return error;
      }

      return {
        status: error.status,
        title: error.title,
        detail: error.detail,
      };
    });
  }

  return payload;
}

async function syncDodoEventToRequest(eventType, eventData, rawEvent) {
  if (!supabaseAdmin) {
    return;
  }

  const metadata = isRecord(eventData.metadata) ? eventData.metadata : {};
  const requestId = parseString(metadata.request_id, 64);

  if (!requestId) {
    return;
  }

  await supabaseAdmin.from("request_payment_events").insert({
    provider: "dodo",
    request_id: requestId,
    event_type: eventType,
    dodo_payment_id: parseString(eventData.payment_id, 160) || null,
    checkout_session_id: parseString(eventData.session_id, 160) || null,
    payload: rawEvent,
  });

  const paymentUpdate = getPaymentUpdateForEvent(eventType, eventData);

  if (!paymentUpdate) {
    return;
  }

  const { error } = await supabaseAdmin.from("requests").update(paymentUpdate).eq("id", requestId);

  if (error) {
    console.error("Could not sync Dodo webhook to request", { requestId, eventType, error });
  }
}

async function syncLemonSqueezyEventToRequest(eventType, eventData, rawEvent) {
  if (!supabaseAdmin) {
    return;
  }

  const meta = isRecord(rawEvent.meta) ? rawEvent.meta : {};
  const customData = isRecord(meta.custom_data) ? meta.custom_data : {};
  const requestId = parseString(customData.request_id, 64);

  if (!requestId) {
    return;
  }

  const checkoutId = parseString(customData.checkout_id, 160);
  const orderId = parseString(eventData.id, 160);
  await supabaseAdmin.from("request_payment_events").insert({
    provider: "lemonsqueezy",
    request_id: requestId,
    event_type: eventType,
    lemon_squeezy_order_id: orderId || null,
    checkout_session_id: checkoutId || null,
    payload: rawEvent,
  });

  const paymentUpdate = getLemonSqueezyPaymentUpdateForEvent(eventType, eventData, customData);

  if (!paymentUpdate) {
    return;
  }

  const { error } = await supabaseAdmin.from("requests").update(paymentUpdate).eq("id", requestId);

  if (error) {
    console.error("Could not sync Lemon Squeezy webhook to request", { requestId, eventType, error });
  }
}

async function updateRequestPaymentState(requestId, updates) {
  if (!supabaseAdmin || !requestId) {
    return;
  }

  const { error } = await supabaseAdmin.from("requests").update(updates).eq("id", requestId);

  if (error) {
    console.error("Could not update request payment state", { requestId, updates, error });
  }
}

function getPaymentUpdateForEvent(eventType, eventData) {
  const paymentId = parseString(eventData.payment_id, 160);
  const sessionId = parseString(eventData.session_id, 160);
  const paymentFields = {
    payment_provider: "dodo",
    ...(paymentId ? { dodo_payment_id: paymentId } : {}),
    ...(sessionId ? { checkout_session_id: sessionId } : {}),
  };

  if (eventType === "payment.succeeded") {
    return {
      ...paymentFields,
      status: "paid",
      payment_status: "paid",
      payout_status: "pending_acceptance",
      platform_fee_status: "earned",
      paid_at: new Date().toISOString(),
    };
  }

  if (eventType === "payment.failed") {
    return {
      ...paymentFields,
      status: "checkout_failed",
      payment_status: "failed",
    };
  }

  if (eventType === "payment.cancelled") {
    return {
      ...paymentFields,
      status: "cancelled",
      payment_status: "cancelled",
      payout_status: "cancelled",
      platform_fee_status: "unearned",
    };
  }

  if (eventType === "refund.succeeded") {
    return {
      ...paymentFields,
      status: "refunded",
      payment_status: "refunded",
      payout_status: "refunded",
      platform_fee_status: "refunded",
    };
  }

  if (eventType.startsWith("dispute.")) {
    return {
      ...paymentFields,
      status: "disputed",
      payment_status: "disputed",
      payout_status: "disputed",
      platform_fee_status: "disputed",
    };
  }

  return null;
}

function getLemonSqueezyPaymentUpdateForEvent(eventType, eventData, customData) {
  const orderId = parseString(eventData.id, 160);
  const checkoutId = parseString(customData.checkout_id, 160);
  const paymentFields = {
    payment_provider: "lemonsqueezy",
    ...(orderId ? { lemon_squeezy_order_id: orderId } : {}),
    ...(checkoutId ? { checkout_session_id: checkoutId } : {}),
  };

  if (eventType === "order_created") {
    return {
      ...paymentFields,
      status: "paid",
      payment_status: "paid",
      payout_status: "pending_acceptance",
      platform_fee_status: "earned",
      paid_at: new Date().toISOString(),
    };
  }

  if (eventType === "order_refunded") {
    return {
      ...paymentFields,
      status: "refunded",
      payment_status: "refunded",
      payout_status: "refunded",
      platform_fee_status: "refunded",
    };
  }

  return null;
}

function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function readCheckoutRequest(req, res) {
  let body;

  try {
    body = await readJson(req);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Request body must be valid JSON." });
    return null;
  }

  const draft = isRecord(body.draft) ? body.draft : {};
  const customer = isRecord(body.customer) ? body.customer : {};
  const email = parseString(customer.email, 160);
  const name = parseString(customer.name, 100);
  const itemName = parseString(draft.itemName, 120) || "Hard-to-find item";
  const requestId = parseString(draft.requestId, 64);
  const category = parseString(draft.category, 80) || "General";
  const details = parseString(draft.details, 500) || "No additional details provided.";
  const durationDays = parseDuration(draft.durationDays);
  let reward;

  try {
    reward = parseReward(draft.reward);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Invalid reward amount." });
    return null;
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(res, 400, { error: "A valid customer email is required before checkout." });
    return null;
  }

  return {
    breakdown: getEscrowBreakdown(reward),
    category,
    details,
    durationDays,
    email,
    itemName,
    name,
    requestId,
    reward,
  };
}

function getPaymentProvider() {
  const configuredProvider = parseString(process.env.PAYMENT_PROVIDER, 40).toLowerCase();

  if (configuredProvider === "lemonsqueezy" || configuredProvider === "lemon_squeezy" || configuredProvider === "lemon-squeezy") {
    return "lemonsqueezy";
  }

  if (configuredProvider === "dodo" || configuredProvider === "dodopayments" || configuredProvider === "dodo_payments") {
    return "dodo";
  }

  if (process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID && process.env.LEMONSQUEEZY_VARIANT_ID) {
    return "lemonsqueezy";
  }

  return "dodo";
}

function getAllowedPaymentMethodTypes() {
  return ["credit", "debit", "apple_pay", "google_pay", "paypal"];
}

function getDodoApiBase() {
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT ?? process.env.DODO_ENVIRONMENT ?? "test";
  return environment === "live" || environment === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

function parseLemonSqueezyVariantId(variantId) {
  const numericId = Number(variantId);
  return Number.isSafeInteger(numericId) ? numericId : variantId;
}

function parseBooleanEnv(key, fallback) {
  const value = process.env[key];

  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function verifyLemonSqueezySignature(rawBody, signature, webhookSecret) {
  if (!signature) {
    return false;
  }

  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

function parseReward(value) {
  const reward = Number(value);

  if (!Number.isFinite(reward)) {
    throw new Error("Reward must be a number.");
  }

  const rounded = Math.round(reward);

  if (rounded < minimumReward || rounded > 10000) {
    throw new Error(`Reward must be between ${minimumReward} and 10,000.`);
  }

  return rounded;
}

function parseDuration(value) {
  const days = Number(value);
  return [14, 30, 60].includes(days) ? days : 30;
}

function parseString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getDodoEventType(event) {
  if (!isRecord(event)) {
    return "unknown";
  }

  return parseString(event.type, 80) || parseString(event.event_type, 80) || parseString(event.eventType, 80) || "unknown";
}

function getDodoEventData(event) {
  if (!isRecord(event)) {
    return {};
  }

  if (isRecord(event.data)) {
    return event.data;
  }

  if (isRecord(event.payload) && isRecord(event.payload.data)) {
    return event.payload.data;
  }

  return {};
}

function getLemonSqueezyEventType(event) {
  if (!isRecord(event) || !isRecord(event.meta)) {
    return "unknown";
  }

  return parseString(event.meta.event_name, 100) || "unknown";
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJson(req) {
  const rawBody = await readRawBody(req);
  const parsed = parseJson(rawBody.toString("utf8"));

  if (!isRecord(parsed)) {
    throw new Error("Request body must be a JSON object.");
  }

  return parsed;
}

async function readRawBody(req) {
  const chunks = [];
  let size = 0;
  const maxSize = 1_000_000;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > maxSize) {
      throw new Error("Request body is too large.");
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function serveStaticAsset(pathname, res) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const requestedPath = path.resolve(distRoot, `.${decodeURIComponent(normalizedPath)}`);

  if (!requestedPath.startsWith(distRoot)) {
    sendText(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(requestedPath);
    const filePath = stat.isDirectory() ? path.join(requestedPath, "index.html") : requestedPath;
    const file = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(file);
  } catch {
    const indexFile = await fs.readFile(path.join(distRoot, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexFile);
  }
}

function getRequestOrigin(req) {
  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const protocol = forwardedProto || (req.socket.encrypted ? "https" : "http");
  const requestHost = forwardedHost || req.headers.host || `${host}:${port}`;
  return `${protocol}://${requestHost}`;
}

function firstHeader(value) {
  return Array.isArray(value) ? value[0] : typeof value === "string" ? value.split(",")[0].trim() : "";
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function getContentType(filePath) {
  const extension = path.extname(filePath);

  switch (extension) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
