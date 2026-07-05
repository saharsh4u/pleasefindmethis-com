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
const publicAppUrl = normalizeAppUrl(process.env.PUBLIC_APP_URL ?? process.env.VITE_PUBLIC_APP_URL ?? "");
const deploymentPublicAppUrl = normalizeDeploymentAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "");
const host = process.env.HOST ?? "127.0.0.1";
let port = Number(process.env.PORT ?? 5173);
const distRoot = path.resolve(root, "dist");
const publicRoot = path.resolve(root, "public");
const supabaseAdmin = createSupabaseAdminClient();
const paymentProviderTimeoutMs = 20000;
const minimumReward = 10;
const platformServiceFeeRate = 0.12;
const trustProtectionRate = 0.03;
const minimumPlatformFee = 6;
const minimumTrustProtectionFee = 1;
const ga4MeasurementId = parseString(process.env.GA4_MEASUREMENT_ID ?? process.env.VITE_GA4_MEASUREMENT_ID ?? process.env.VITE_GOOGLE_TAG_ID, 40);
const ga4ApiSecret = parseString(process.env.GA4_API_SECRET, 160);
const ga4MeasurementTimeoutMs = 6000;
const homeMarketCountry = sanitizeCountryCode(process.env.HOME_MARKET_COUNTRY) || "IN";
const waitlistRecipientEmail = parseString(process.env.WAITLIST_TO_EMAIL ?? process.env.OWNER_EMAIL ?? "saharashsharma3@gmail.com", 160);
const waitlistFromEmail = parseString(process.env.WAITLIST_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "pleasefindmethis <waitlist@pleasefindmethis.com>", 220);
const waitlistNotificationTimeoutMs = 10000;
const attributionAnalyticsKeys = [
  "first_landing_page",
  "first_referrer_host",
  "first_landed_at",
  "first_source",
  "first_channel",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
  "first_utm_content",
  "first_utm_term",
  "latest_landing_page",
  "latest_referrer_host",
  "latest_landed_at",
  "latest_source",
  "latest_channel",
  "latest_utm_source",
  "latest_utm_medium",
  "latest_utm_campaign",
  "latest_utm_content",
  "latest_utm_term",
];

const vite = isProduction ? null : await createDevViteServer();

export async function handleRequest(req, res) {
  try {
    const requestUrl = new URL(req.url ?? "/", getRequestOrigin(req));

    const canonicalRedirectUrl = getCanonicalRedirectUrl(req, requestUrl);
    if (canonicalRedirectUrl) {
      redirect(res, canonicalRedirectUrl, 308);
      return;
    }

    if (isBlockedPublicPath(requestUrl.pathname)) {
      sendText(res, 404, "Not found");
      return;
    }

    if (requestUrl.pathname === "/api/dodo/checkout") {
      await handleCreateDodoCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/lemonsqueezy/checkout") {
      await handleCreateLemonSqueezyCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/whop/checkout") {
      await handleCreateWhopCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/razorpay/checkout") {
      await handleCreateRazorpayCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/payments/checkout") {
      await handleCreatePaymentCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/waitlist") {
      await handleJoinWaitlist(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/requests/public") {
      await handlePublicRequests(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/admin/payout-cases") {
      await handleAdminPayoutCases(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/health") {
      await handleHealthCheck(req, res);
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

    if (requestUrl.pathname === "/api/whop/webhook") {
      await handleWhopWebhook(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/razorpay/webhook") {
      await handleRazorpayWebhook(req, res);
      return;
    }

    if (vite) {
      if (shouldServePublicStaticPath(requestUrl.pathname)) {
        const servedPublicAsset = await tryServeStaticAsset(publicRoot, requestUrl.pathname, res);

        if (servedPublicAsset) {
          return;
        }
      }

      vite.middlewares(req, res, () => {
        sendText(res, 404, "Not found");
      });
      return;
    }

    await serveStaticAsset(requestUrl.pathname, res);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      sendJson(res, 500, { error: "Unexpected server error." });
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

  if (getPaymentProvider() !== "dodo") {
    sendJson(res, 409, {
      error: "This checkout option is not available.",
    });
    return;
  }

  if (!isDodoMarketplaceCheckoutAllowed()) {
    sendJson(res, 409, {
      error: "This checkout option is not available for this request.",
    });
    return;
  }

  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  const productId = process.env.DODO_PRODUCT_ID;

  if (!apiKey || !productId) {
    sendJson(res, 503, {
      error: "Checkout is unavailable right now.",
    });
    return;
  }

  if (isProduction && !isDodoLiveMode()) {
    sendJson(res, 503, { error: "Checkout is not available in this deployment." });
    return;
  }

  const origin = ensureCheckoutRedirectOrigin(req, res);

  if (!origin) {
    return;
  }

  const checkoutRequest = await readCheckoutRequest(req, res);

  if (!checkoutRequest) {
    return;
  }

  const { analytics, breakdown, category, details, durationDays, email, itemName, name, requestId } = checkoutRequest;
  const claimed = await claimCheckoutRequest(requestId, "dodo");

  if (!claimed) {
    sendJson(res, 409, { error: "Checkout is already in progress for this request. Refresh your dashboard for the latest payment link." });
    return;
  }

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
      payment_handling_source_review_fee_usd: String(breakdown.protection),
      platform_share_usd: String(breakdown.platformShare),
      total_usd: String(breakdown.total),
      duration_days: String(durationDays),
      source: "pleasefindmethis-post-paywall",
      payment_provider: "dodo",
      payment_environment: getDodoEnvironment(),
      ...getPaymentAnalyticsMetadata(analytics),
    },
    return_url: `${origin}/poster-dashboard?checkout=success`,
    cancel_url: `${origin}/post/pay?checkout=cancelled`,
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
          "Idempotency-Key": `request:${requestId}:checkout`,
        },
        body: JSON.stringify(checkoutPayload),
      },
      paymentProviderTimeoutMs,
    );
  } catch (error) {
    console.error("Dodo checkout creation timed out or failed", error);
    await markCheckoutFailed(requestId, true);
    sendJson(res, 504, { error: "The payment provider took too long to create checkout. Please try again." });
    return;
  }

  const responseText = await dodoResponse.text();
  const dodoPayload = parseJson(responseText);

  if (!dodoResponse.ok) {
    console.error("Dodo checkout creation failed", dodoResponse.status, dodoPayload ?? responseText);
    await markCheckoutFailed(requestId, dodoResponse.status >= 500);
    const checkoutError = getDodoCheckoutError(dodoResponse.status, dodoPayload);
    sendJson(res, checkoutError.status, { error: checkoutError.message });
    return;
  }

  if (!isRecord(dodoPayload) || typeof dodoPayload.checkout_url !== "string") {
    console.error("Dodo checkout response did not include checkout_url", dodoPayload);
    await markCheckoutFailed(requestId, false);
    sendJson(res, 502, { error: "Checkout could not be started." });
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

  if (provider === "whop") {
    await handleCreateWhopCheckout(req, res);
    return;
  }

  if (provider === "razorpay") {
    await handleCreateRazorpayCheckout(req, res);
    return;
  }

  await handleCreateDodoCheckout(req, res);
}

async function handleCreateRazorpayCheckout(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (getPaymentProvider() !== "razorpay") {
    sendJson(res, 409, {
      error: "This checkout option is not available.",
    });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    sendJson(res, 503, {
      error: "Checkout is unavailable right now.",
    });
    return;
  }

  if (isProduction && !isRazorpayLiveMode()) {
    sendJson(res, 503, { error: "Checkout is not available in this deployment." });
    return;
  }

  const origin = ensureCheckoutRedirectOrigin(req, res);

  if (!origin) {
    return;
  }

  const checkoutRequest = await readCheckoutRequest(req, res);

  if (!checkoutRequest) {
    return;
  }

  const { analytics, breakdown, category, durationDays, email, itemName, name, requestId } = checkoutRequest;
  const claimed = await claimCheckoutRequest(requestId, "razorpay");

  if (!claimed) {
    sendJson(res, 409, { error: "Checkout is already in progress for this request. Refresh your dashboard for the latest payment link." });
    return;
  }

  const checkoutPayload = {
    amount: breakdown.total * 100,
    currency: "USD",
    accept_partial: false,
    expire_by: getRazorpayPaymentLinkExpiry(),
    reference_id: requestId,
    description: `pleasefindmethis request: ${itemName}`.slice(0, 2048),
    customer: stripEmpty({
      email,
      name,
    }),
    notify: {
      sms: false,
      email: false,
    },
    reminder_enable: false,
    notes: getRazorpayPaymentNotes({
      analytics,
      category,
      durationDays,
      itemName,
      requestId,
    }),
    callback_url: `${origin}/poster-dashboard?checkout=success`,
    callback_method: "get",
  };

  let razorpayResponse;

  try {
    razorpayResponse = await fetchWithTimeout(
      `${getRazorpayApiBase()}/payment_links`,
      {
        method: "POST",
        headers: {
          Authorization: getRazorpayAuthorizationHeader(keyId, keySecret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      },
      paymentProviderTimeoutMs,
    );
  } catch (error) {
    console.error("Razorpay payment link creation timed out or failed", error);
    await markCheckoutFailed(requestId, true);
    sendJson(res, 504, { error: "The payment provider took too long to create checkout. Please try again." });
    return;
  }

  const responseText = await razorpayResponse.text();
  const razorpayPayload = parseJson(responseText);

  if (!razorpayResponse.ok) {
    console.error("Razorpay payment link creation failed", razorpayResponse.status, getRazorpayErrorSummary(razorpayPayload, responseText));
    await markCheckoutFailed(requestId, razorpayResponse.status >= 500 || razorpayResponse.status === 429);
    sendJson(res, getRazorpayCheckoutErrorStatus(razorpayResponse.status), {
      error: getRazorpayCheckoutError(razorpayResponse.status, razorpayPayload),
    });
    return;
  }

  if (!isRecord(razorpayPayload) || typeof razorpayPayload.short_url !== "string") {
    console.error("Razorpay payment link response did not include short_url", getRazorpayErrorSummary(razorpayPayload, responseText));
    await markCheckoutFailed(requestId, false);
    sendJson(res, 502, { error: "Checkout could not be started." });
    return;
  }

  const paymentLinkId = parseString(razorpayPayload.id, 160);
  await updateRequestPaymentState(requestId, {
    payment_provider: "razorpay",
    ...(paymentLinkId ? { checkout_session_id: paymentLinkId, razorpay_payment_link_id: paymentLinkId } : {}),
    checkout_url: razorpayPayload.short_url,
    status: "checkout_started",
    payment_status: "checkout_started",
  });

  sendJson(res, 200, {
    provider: "razorpay",
    checkoutUrl: razorpayPayload.short_url,
    sessionId: paymentLinkId || null,
    total: breakdown.total,
    split: {
      finderPayout: breakdown.reward,
      platformServiceFee: breakdown.platformFee,
      refundProtectionReserve: breakdown.protection,
      platformShare: breakdown.platformShare,
    },
  });
}

async function handlePublicRequests(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (!supabaseAdmin) {
    sendJson(res, 503, { error: "Public request feed is unavailable." });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from("public_request_cards")
    .select("id,item_name,category,details,reward,duration_days,status,payment_status,created_at,paid_at,closes_at,days_remaining,primary_image_url,submission_count")
    .order("reward", { ascending: false })
    .limit(24);

  if (!error) {
    sendJson(res, 200, { requests: data ?? [] });
    return;
  }

  const schemaCacheMiss = error.code === "PGRST205" || /public_request_cards/.test(error.message ?? "");

  if (!schemaCacheMiss) {
    console.error("Could not load public request cards", error);
    sendJson(res, 503, { error: "Public request feed is unavailable." });
    return;
  }

  try {
    const fallback = await loadPublicRequestsFallback();
    sendJson(res, 200, { requests: fallback });
  } catch (fallbackError) {
    console.error("Could not load fallback public request feed", fallbackError);
    sendJson(res, 503, { error: "Public request feed is unavailable." });
  }
}

async function loadPublicRequestsFallback() {
  const { data: requestRows, error: requestError } = await supabaseAdmin
    .from("requests")
    .select("id,item_name,category,details,reward,duration_days,status,payment_status,reference_images,created_at,paid_at")
    .in("status", ["paid", "disputed"])
    .in("payment_status", ["paid", "disputed"])
    .not("paid_at", "is", null)
    .order("reward", { ascending: false })
    .limit(24);

  if (requestError) {
    console.error("Could not load fallback public request rows", requestError);
    throw new Error("Public request feed is unavailable.");
  }

  const requests = requestRows ?? [];
  const requestIds = requests.map((request) => request.id).filter(Boolean);
  const submissionCounts = await loadSubmissionCounts(requestIds);

  return requests.map((request) => {
    const createdAt = parseString(request.created_at, 80);
    const durationDays = parseDuration(request.duration_days);
    const closesAt = createdAt ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000) : null;
    const daysRemaining = closesAt ? Math.max(0, Math.ceil((closesAt.getTime() - Date.now()) / 86400000)) : null;
    const referenceImages = Array.isArray(request.reference_images) ? request.reference_images : [];
    const firstImage = referenceImages.find(isRecord);
    const primaryImageUrl = parseString(firstImage?.url, 1000) || "/find-requests/duck-wall-art.jpg";

    return {
      id: request.id,
      item_name: parseString(request.item_name, 120),
      category: parseString(request.category, 80),
      details: parseString(request.details, 500),
      reward: Number(request.reward) || minimumReward,
      duration_days: durationDays,
      status: request.status,
      payment_status: request.payment_status,
      created_at: createdAt,
      paid_at: request.paid_at,
      closes_at: closesAt ? closesAt.toISOString() : null,
      days_remaining: daysRemaining,
      primary_image_url: primaryImageUrl,
      submission_count: submissionCounts.get(request.id) ?? 0,
    };
  });
}

async function loadSubmissionCounts(requestIds) {
  const counts = new Map();

  if (!requestIds.length) {
    return counts;
  }

  const { data, error } = await supabaseAdmin
    .from("source_submissions")
    .select("request_id,status")
    .in("request_id", requestIds);

  if (error) {
    console.error("Could not load public submission counts", error);
    return counts;
  }

  for (const row of data ?? []) {
    if (row.status === "withdrawn" || row.status === "invalid") {
      continue;
    }

    counts.set(row.request_id, (counts.get(row.request_id) ?? 0) + 1);
  }

  return counts;
}

async function handleAdminPayoutCases(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (!supabaseAdmin) {
    sendJson(res, 503, { error: "Admin payout review requires Supabase server configuration." });
    return;
  }

  try {
    const adminUser = await requireMarketplaceAdmin(req);

    if (req.method === "GET") {
      const queues = await loadAdminPayoutQueues();
      sendJson(res, 200, {
        ...queues,
        admin: {
          email: adminUser.email ?? "",
          configured: hasMarketplaceAdminConfiguration(),
        },
      });
      return;
    }

    const body = await readJson(req);
    const caseType = normalizeAdminReviewCaseType(body.caseType);

    if (caseType === "source_dispute") {
      const result = await applyAdminSourceDisputeAction(body, adminUser);
      sendJson(res, 200, { dispute: result });
      return;
    }

    if (caseType === "support_ticket") {
      const result = await applyAdminSupportTicketAction(body, adminUser);
      sendJson(res, 200, { supportTicket: result });
      return;
    }

    if (caseType === "duplicate_source") {
      const result = await applyAdminDuplicateSourceFlagAction(body, adminUser);
      sendJson(res, 200, { duplicateFlag: result });
      return;
    }

    const result = await applyAdminPayoutCaseAction(body, adminUser);
    sendJson(res, 200, { payoutCase: result });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;

    if (statusCode >= 500) {
      console.error("Admin payout case action failed", error);
    }

    sendJson(res, statusCode, {
      error: error instanceof Error ? error.message : "Admin payout review is unavailable.",
    });
  }
}

async function requireMarketplaceAdmin(req) {
  const token = getBearerToken(req);

  if (!token) {
    throw new AdminApiError("Sign in as a marketplace admin before opening payout review.", 401);
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    throw new AdminApiError("Your session could not be verified for admin review.", 401);
  }

  if (!isMarketplaceAdminUser(user)) {
    throw new AdminApiError("This account is not allowed to manage payout review.", 403);
  }

  return user;
}

async function loadAdminPayoutQueues() {
  const [payoutResult, disputeResult, ticketResult, duplicateFlagResult] = await Promise.all([
    supabaseAdmin
      .from("finder_payout_cases")
      .select("id,submission_id,request_id,finder_id,amount,currency,status,release_after,processor,processor_transfer_id,admin_note,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("source_disputes")
      .select("id,submission_id,request_id,opened_by,opened_by_role,reason_code,evidence_summary,status,resolution_note,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("support_tickets")
      .select("id,user_id,category,subject,status,priority,related_request_id,related_submission_id,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("source_duplicate_flags")
      .select("id,request_id,finder_id,source_fingerprint,existing_submission_id,source_type,normalized_source,status,admin_note,created_at,updated_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const firstError = payoutResult.error || disputeResult.error || ticketResult.error || duplicateFlagResult.error;

  if (firstError) {
    console.error("Could not load admin payout queues", firstError);
    throw new AdminApiError("Admin queues need the latest marketplace migration before they can load.", 503);
  }

  return {
    payoutCases: payoutResult.data ?? [],
    disputes: disputeResult.data ?? [],
    supportTickets: ticketResult.data ?? [],
    duplicateFlags: duplicateFlagResult.data ?? [],
  };
}

async function applyAdminPayoutCaseAction(body, adminUser) {
  const payoutCaseId = parseString(body.payoutCaseId ?? body.id, 80);
  const action = normalizePayoutCaseAction(body.action);
  const adminNote = parseString(body.adminNote ?? body.note, 3000);
  const processor = sanitizePayoutProcessor(body.processor);
  const processorTransferId = parseString(body.processorTransferId ?? body.processor_transfer_id, 180);

  if (!payoutCaseId) {
    throw new AdminApiError("A payout case id is required.", 400);
  }

  if (!action) {
    throw new AdminApiError("Choose a valid payout action.", 400);
  }

  const { data: payoutCase, error } = await supabaseAdmin
    .from("finder_payout_cases")
    .select("id,submission_id,request_id,finder_id,amount,currency,status,release_after,processor,processor_transfer_id,admin_note,created_at,updated_at")
    .eq("id", payoutCaseId)
    .single();

  if (error || !payoutCase) {
    throw new AdminApiError("Payout case was not found.", 404);
  }

  validatePayoutCaseAction(action, payoutCase, { adminNote, processorTransferId, allowEarlyRelease: Boolean(body.allowEarlyRelease) });

  await ensurePayoutAuditTableReady();

  const nextStatus = getPayoutCaseStatusForAction(action);
  const updateRow = {
    admin_note: adminNote || payoutCase.admin_note || getDefaultAdminNoteForPayoutAction(action),
    ...(processor ? { processor } : {}),
    ...(processorTransferId ? { processor_transfer_id: processorTransferId } : {}),
    ...(nextStatus ? { status: nextStatus } : {}),
  };

  const { data: updatedCase, error: updateError } = await supabaseAdmin
    .from("finder_payout_cases")
    .update(updateRow)
    .eq("id", payoutCase.id)
    .select("id,submission_id,request_id,finder_id,amount,currency,status,release_after,processor,processor_transfer_id,admin_note,created_at,updated_at")
    .single();

  if (updateError || !updatedCase) {
    console.error("Could not update payout case", { payoutCaseId: payoutCase.id, action, updateError });
    throw new AdminApiError("Could not update this payout case.", 503);
  }

  await recordPayoutCaseEvent({
    payoutCase,
    updatedCase,
    adminUser,
    action,
    note: adminNote,
  });

  if (nextStatus === "paid") {
    await markRequestRewardPaid(updatedCase);
  }

  return updatedCase;
}

async function ensurePayoutAuditTableReady() {
  const { error } = await supabaseAdmin.from("payout_case_events").select("id").limit(1);

  if (error) {
    console.error("Payout audit table is not available", error);
    throw new AdminApiError("Payout audit logging needs the latest marketplace migration before staff actions can run.", 503);
  }
}

async function recordPayoutCaseEvent({ payoutCase, updatedCase, adminUser, action, note }) {
  const { error } = await supabaseAdmin.from("payout_case_events").insert({
    payout_case_id: payoutCase.id,
    request_id: payoutCase.request_id,
    submission_id: payoutCase.submission_id,
    actor_id: adminUser.id,
    action,
    from_status: payoutCase.status,
    to_status: updatedCase.status,
    processor: updatedCase.processor,
    processor_transfer_id: updatedCase.processor_transfer_id,
    note,
  });

  if (error) {
    console.error("Could not record payout case event", { payoutCaseId: payoutCase.id, action, error });
    throw new AdminApiError("Could not record the payout audit event.", 503);
  }
}

async function markRequestRewardPaid(payoutCase) {
  const { error: requestError } = await supabaseAdmin
    .from("requests")
    .update({ payout_status: "paid" })
    .eq("id", payoutCase.request_id)
    .in("payout_status", ["pending_acceptance", "payable", "disputed"]);

  if (requestError) {
    console.error("Could not mark request payout paid", { requestId: payoutCase.request_id, requestError });
    throw new AdminApiError("Payout case was updated, but the request payout status could not be reconciled.", 503);
  }

  const { error: submissionError } = await supabaseAdmin
    .from("source_submissions")
    .update({
      status: "awarded",
      awarded_at: new Date().toISOString(),
    })
    .eq("id", payoutCase.submission_id)
    .in("status", ["accepted", "awarded"]);

  if (submissionError) {
    console.error("Could not mark source submission awarded", { submissionId: payoutCase.submission_id, submissionError });
    throw new AdminApiError("Payout case was updated, but the source award status could not be reconciled.", 503);
  }
}

async function applyAdminSourceDisputeAction(body, adminUser) {
  const disputeId = parseString(body.disputeId ?? body.id, 80);
  const action = normalizeSourceDisputeAction(body.action);
  const note = parseString(body.resolutionNote ?? body.adminNote ?? body.note, 3000);

  if (!disputeId) {
    throw new AdminApiError("A source dispute id is required.", 400);
  }

  if (!action) {
    throw new AdminApiError("Choose a valid dispute action.", 400);
  }

  const { data: dispute, error } = await supabaseAdmin
    .from("source_disputes")
    .select("id,submission_id,request_id,opened_by,opened_by_role,reason_code,evidence_summary,status,resolution_note,created_at,updated_at")
    .eq("id", disputeId)
    .single();

  if (error || !dispute) {
    throw new AdminApiError("Source dispute was not found.", 404);
  }

  validateSourceDisputeAction(action, dispute, note);

  await ensureAdminAuditTableReady("source_dispute_events");

  const nextStatus = getSourceDisputeStatusForAction(action);
  const updateRow = {
    resolution_note: note || dispute.resolution_note || getDefaultSourceDisputeNote(action),
    ...(nextStatus ? { status: nextStatus } : {}),
  };

  const { data: updatedDispute, error: updateError } = await supabaseAdmin
    .from("source_disputes")
    .update(updateRow)
    .eq("id", dispute.id)
    .select("id,submission_id,request_id,opened_by,opened_by_role,reason_code,evidence_summary,status,resolution_note,created_at,updated_at")
    .single();

  if (updateError || !updatedDispute) {
    console.error("Could not update source dispute", { disputeId: dispute.id, action, updateError });
    throw new AdminApiError("Could not update this source dispute.", 503);
  }

  await recordSourceDisputeEvent({
    dispute,
    updatedDispute,
    adminUser,
    action,
    note,
  });

  await applySourceDisputeSideEffects(updatedDispute, action);

  return updatedDispute;
}

async function applyAdminSupportTicketAction(body, adminUser) {
  const ticketId = parseString(body.ticketId ?? body.id, 80);
  const action = normalizeSupportTicketAction(body.action);
  const note = parseString(body.adminNote ?? body.note, 3000);

  if (!ticketId) {
    throw new AdminApiError("A support ticket id is required.", 400);
  }

  if (!action) {
    throw new AdminApiError("Choose a valid support ticket action.", 400);
  }

  const { data: ticket, error } = await supabaseAdmin
    .from("support_tickets")
    .select("id,user_id,category,subject,status,priority,related_request_id,related_submission_id,created_at,updated_at")
    .eq("id", ticketId)
    .single();

  if (error || !ticket) {
    throw new AdminApiError("Support ticket was not found.", 404);
  }

  validateSupportTicketAction(action, ticket, note);

  await ensureAdminAuditTableReady("support_ticket_events");

  const nextStatus = getSupportTicketStatusForAction(action);
  const { data: updatedTicket, error: updateError } = await supabaseAdmin
    .from("support_tickets")
    .update({ status: nextStatus ?? ticket.status })
    .eq("id", ticket.id)
    .select("id,user_id,category,subject,status,priority,related_request_id,related_submission_id,created_at,updated_at")
    .single();

  if (updateError || !updatedTicket) {
    console.error("Could not update support ticket", { ticketId: ticket.id, action, updateError });
    throw new AdminApiError("Could not update this support ticket.", 503);
  }

  await recordSupportTicketEvent({
    ticket,
    updatedTicket,
    adminUser,
    action,
    note,
  });

  if (note && ["waiting_on_user", "resolved", "closed"].includes(updatedTicket.status)) {
    await addSupportTicketStaffMessage(updatedTicket.id, adminUser.id, note);
  }

  return updatedTicket;
}

async function applyAdminDuplicateSourceFlagAction(body, adminUser) {
  const duplicateFlagId = parseString(body.duplicateFlagId ?? body.id, 80);
  const action = normalizeDuplicateSourceFlagAction(body.action);
  const note = parseString(body.adminNote ?? body.note, 3000);

  if (!duplicateFlagId) {
    throw new AdminApiError("A duplicate source flag id is required.", 400);
  }

  if (!action) {
    throw new AdminApiError("Choose a valid duplicate source action.", 400);
  }

  const { data: duplicateFlag, error } = await supabaseAdmin
    .from("source_duplicate_flags")
    .select("id,request_id,finder_id,source_fingerprint,existing_submission_id,source_type,normalized_source,status,admin_note,created_at,updated_at")
    .eq("id", duplicateFlagId)
    .single();

  if (error || !duplicateFlag) {
    throw new AdminApiError("Duplicate source flag was not found.", 404);
  }

  validateDuplicateSourceFlagAction(action, duplicateFlag, note);

  await ensureAdminAuditTableReady("source_duplicate_flag_events");

  const nextStatus = getDuplicateSourceFlagStatusForAction(action);
  const updateRow = {
    admin_note: note || duplicateFlag.admin_note || getDefaultDuplicateSourceFlagNote(action),
    ...(nextStatus ? { status: nextStatus } : {}),
  };

  const { data: updatedFlag, error: updateError } = await supabaseAdmin
    .from("source_duplicate_flags")
    .update(updateRow)
    .eq("id", duplicateFlag.id)
    .select("id,request_id,finder_id,source_fingerprint,existing_submission_id,source_type,normalized_source,status,admin_note,created_at,updated_at")
    .single();

  if (updateError || !updatedFlag) {
    console.error("Could not update duplicate source flag", { duplicateFlagId: duplicateFlag.id, action, updateError });
    throw new AdminApiError("Could not update this duplicate source flag.", 503);
  }

  await recordDuplicateSourceFlagEvent({
    duplicateFlag,
    updatedFlag,
    adminUser,
    action,
    note,
  });

  return updatedFlag;
}

async function ensureAdminAuditTableReady(tableName) {
  const allowedTables = new Set(["payout_case_events", "source_dispute_events", "support_ticket_events", "source_duplicate_flag_events"]);

  if (!allowedTables.has(tableName)) {
    throw new AdminApiError("Unknown admin audit table.", 500);
  }

  const { error } = await supabaseAdmin.from(tableName).select("id").limit(1);

  if (error) {
    console.error("Admin audit table is not available", { tableName, error });
    throw new AdminApiError("Admin audit logging needs the latest marketplace migration before staff actions can run.", 503);
  }
}

async function recordSourceDisputeEvent({ dispute, updatedDispute, adminUser, action, note }) {
  const { error } = await supabaseAdmin.from("source_dispute_events").insert({
    dispute_id: dispute.id,
    request_id: dispute.request_id,
    submission_id: dispute.submission_id,
    actor_id: adminUser.id,
    action,
    from_status: dispute.status,
    to_status: updatedDispute.status,
    note,
  });

  if (error) {
    console.error("Could not record source dispute event", { disputeId: dispute.id, action, error });
    throw new AdminApiError("Could not record the source dispute audit event.", 503);
  }
}

async function recordSupportTicketEvent({ ticket, updatedTicket, adminUser, action, note }) {
  const { error } = await supabaseAdmin.from("support_ticket_events").insert({
    ticket_id: ticket.id,
    actor_id: adminUser.id,
    action,
    from_status: ticket.status,
    to_status: updatedTicket.status,
    note,
  });

  if (error) {
    console.error("Could not record support ticket event", { ticketId: ticket.id, action, error });
    throw new AdminApiError("Could not record the support ticket audit event.", 503);
  }
}

async function recordDuplicateSourceFlagEvent({ duplicateFlag, updatedFlag, adminUser, action, note }) {
  const { error } = await supabaseAdmin.from("source_duplicate_flag_events").insert({
    duplicate_flag_id: duplicateFlag.id,
    request_id: duplicateFlag.request_id,
    actor_id: adminUser.id,
    action,
    from_status: duplicateFlag.status,
    to_status: updatedFlag.status,
    note,
  });

  if (error) {
    console.error("Could not record duplicate source flag event", { duplicateFlagId: duplicateFlag.id, action, error });
    throw new AdminApiError("Could not record the duplicate source audit event.", 503);
  }
}

async function addSupportTicketStaffMessage(ticketId, adminUserId, note) {
  const { error } = await supabaseAdmin.from("support_ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: adminUserId,
    body: note,
  });

  if (error) {
    console.error("Could not add support ticket staff message", { ticketId, error });
    throw new AdminApiError("Could not add the support reply to this ticket.", 503);
  }
}

async function applySourceDisputeSideEffects(dispute, action) {
  if (action === "needs_evidence") {
    await markDisputedPayoutCase(dispute, "Dispute needs more evidence before payout release.");
    return;
  }

  if (action === "finder_wins") {
    await markDisputedPayoutCasePayable(dispute);
    return;
  }

  if (action === "poster_wins") {
    await markDisputedPayoutCaseCancelled(dispute);
  }
}

async function markDisputedPayoutCase(dispute, note) {
  const { error: payoutError } = await supabaseAdmin
    .from("finder_payout_cases")
    .update({
      status: "disputed",
      admin_note: note,
    })
    .eq("submission_id", dispute.submission_id)
    .in("status", ["payable", "hold", "processing", "disputed"]);

  if (payoutError) {
    console.error("Could not keep payout case disputed", { disputeId: dispute.id, payoutError });
    throw new AdminApiError("Could not update payout hold state for this dispute.", 503);
  }

  await updateRequestPayoutStatus(dispute.request_id, "disputed", ["pending_acceptance", "payable", "disputed"]);
}

async function markDisputedPayoutCasePayable(dispute) {
  const { error: payoutError } = await supabaseAdmin
    .from("finder_payout_cases")
    .update({
      status: "payable",
      admin_note: "Dispute resolved for the finder; reward can continue through payout review.",
    })
    .eq("submission_id", dispute.submission_id)
    .in("status", ["payable", "hold", "processing", "disputed"]);

  if (payoutError) {
    console.error("Could not mark disputed payout case payable", { disputeId: dispute.id, payoutError });
    throw new AdminApiError("Could not update payout state after dispute resolution.", 503);
  }

  await updateRequestPayoutStatus(dispute.request_id, "payable", ["pending_acceptance", "payable", "disputed"]);
}

async function markDisputedPayoutCaseCancelled(dispute) {
  const { error: payoutError } = await supabaseAdmin
    .from("finder_payout_cases")
    .update({
      status: "cancelled",
      admin_note: "Dispute resolved for the poster; finder reward is not payable from this source.",
    })
    .eq("submission_id", dispute.submission_id)
    .in("status", ["payable", "hold", "processing", "disputed"]);

  if (payoutError) {
    console.error("Could not cancel disputed payout case", { disputeId: dispute.id, payoutError });
    throw new AdminApiError("Could not update payout state after dispute resolution.", 503);
  }

  await updateRequestPayoutStatus(dispute.request_id, "cancelled", ["pending_acceptance", "payable", "disputed"]);
}

async function updateRequestPayoutStatus(requestId, payoutStatus, allowedCurrentStatuses) {
  const { error } = await supabaseAdmin
    .from("requests")
    .update({ payout_status: payoutStatus })
    .eq("id", requestId)
    .in("payout_status", allowedCurrentStatuses);

  if (error) {
    console.error("Could not update request payout status", { requestId, payoutStatus, error });
    throw new AdminApiError("Could not reconcile the request payout status.", 503);
  }
}

function normalizeAdminReviewCaseType(value) {
  const normalized = parseString(value, 80).toLowerCase().replace(/[\s-]+/g, "_");

  if (normalized === "source_dispute" || normalized === "dispute") {
    return "source_dispute";
  }

  if (normalized === "support_ticket" || normalized === "ticket" || normalized === "support") {
    return "support_ticket";
  }

  if (normalized === "duplicate_source" || normalized === "duplicate_flag" || normalized === "duplicate") {
    return "duplicate_source";
  }

  return "payout_case";
}

function normalizePayoutCaseAction(value) {
  const action = parseString(value, 80).toLowerCase().replace(/[\s-]+/g, "_");

  if (action === "hold" || action === "processing" || action === "paid" || action === "note") {
    return action;
  }

  if (action === "mark_processing") {
    return "processing";
  }

  if (action === "record_paid" || action === "mark_paid") {
    return "paid";
  }

  return "";
}

function getPayoutCaseStatusForAction(action) {
  if (action === "note") {
    return undefined;
  }

  return action;
}

function validatePayoutCaseAction(action, payoutCase, { adminNote, processorTransferId, allowEarlyRelease }) {
  const currentStatus = parseString(payoutCase.status, 40);
  const terminal = ["paid", "cancelled", "refunded"];

  if (action === "note" && !adminNote) {
    throw new AdminApiError("Add an admin note before saving a note-only update.", 400);
  }

  if (terminal.includes(currentStatus) && action !== "note") {
    throw new AdminApiError("Terminal payout cases can only receive an admin note.", 409);
  }

  if (action === "hold" && !adminNote) {
    throw new AdminApiError("Add a short note before placing a payout on hold.", 400);
  }

  if (action === "processing" && !["payable", "hold", "disputed"].includes(currentStatus)) {
    throw new AdminApiError("Only payable, held, or disputed cases can move to processing.", 409);
  }

  if (action === "paid") {
    if (!["payable", "hold", "processing"].includes(currentStatus)) {
      throw new AdminApiError("Only payable, held, or processing cases can be recorded as paid.", 409);
    }

    if (!processorTransferId) {
      throw new AdminApiError("Add the processor transfer or manual payout reference before marking paid.", 400);
    }

    if (!allowEarlyRelease && isFutureTimestamp(payoutCase.release_after)) {
      throw new AdminApiError("This payout is still inside the release window. Move it to processing now, then record paid after the window passes.", 409);
    }
  }
}

function getDefaultAdminNoteForPayoutAction(action) {
  if (action === "processing") {
    return "Staff marked the reward payout as processing.";
  }

  if (action === "paid") {
    return "Staff recorded the completed finder reward payout.";
  }

  if (action === "hold") {
    return "Staff placed the reward payout on hold for review.";
  }

  return "";
}

function sanitizePayoutProcessor(value) {
  const processor = parseString(value, 80).toLowerCase().replace(/[\s-]+/g, "_");
  return ["manual", "stripe_connect", "paypal", "wise", "other"].includes(processor) ? processor : "";
}

function isFutureTimestamp(value) {
  const timestamp = parseString(value, 80);

  if (!timestamp) {
    return false;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() > Date.now();
}

function normalizeSourceDisputeAction(value) {
  const action = parseString(value, 80).toLowerCase().replace(/[\s-]+/g, "_");

  if (["needs_evidence", "finder_wins", "poster_wins", "closed", "note"].includes(action)) {
    return action;
  }

  if (action === "need_evidence" || action === "request_evidence") {
    return "needs_evidence";
  }

  if (action === "finder" || action === "resolve_finder") {
    return "finder_wins";
  }

  if (action === "poster" || action === "resolve_poster") {
    return "poster_wins";
  }

  return "";
}

function getSourceDisputeStatusForAction(action) {
  if (action === "note") {
    return undefined;
  }

  return action;
}

function validateSourceDisputeAction(action, dispute, note) {
  const currentStatus = parseString(dispute.status, 40);
  const terminal = ["finder_wins", "poster_wins", "closed"];

  if (action === "note" && !note) {
    throw new AdminApiError("Add a note before saving a dispute note-only update.", 400);
  }

  if (terminal.includes(currentStatus) && action !== "note") {
    throw new AdminApiError("Resolved disputes can only receive an admin note.", 409);
  }

  if (["needs_evidence", "finder_wins", "poster_wins", "closed"].includes(action) && !note) {
    throw new AdminApiError("Add a resolution note before changing dispute status.", 400);
  }
}

function getDefaultSourceDisputeNote(action) {
  if (action === "needs_evidence") {
    return "Staff requested more evidence before resolving this dispute.";
  }

  if (action === "finder_wins") {
    return "Staff resolved this dispute in favor of the finder.";
  }

  if (action === "poster_wins") {
    return "Staff resolved this dispute in favor of the poster.";
  }

  if (action === "closed") {
    return "Staff closed this dispute.";
  }

  return "";
}

function normalizeSupportTicketAction(value) {
  const action = parseString(value, 80).toLowerCase().replace(/[\s-]+/g, "_");

  if (["in_review", "waiting_on_user", "resolved", "closed", "note"].includes(action)) {
    return action;
  }

  if (action === "review" || action === "start_review") {
    return "in_review";
  }

  if (action === "waiting" || action === "needs_user") {
    return "waiting_on_user";
  }

  if (action === "resolve") {
    return "resolved";
  }

  if (action === "close") {
    return "closed";
  }

  return "";
}

function getSupportTicketStatusForAction(action) {
  if (action === "note") {
    return undefined;
  }

  return action;
}

function validateSupportTicketAction(action, ticket, note) {
  const currentStatus = parseString(ticket.status, 40);
  const terminal = ["resolved", "closed"];

  if (action === "note" && !note) {
    throw new AdminApiError("Add a note before saving a support ticket note-only update.", 400);
  }

  if (terminal.includes(currentStatus) && action !== "note") {
    throw new AdminApiError("Resolved or closed tickets can only receive an admin note.", 409);
  }

  if (["waiting_on_user", "resolved", "closed"].includes(action) && !note) {
    throw new AdminApiError("Add a support note before sending this status update.", 400);
  }
}

function normalizeDuplicateSourceFlagAction(value) {
  const action = parseString(value, 80).toLowerCase().replace(/[\s-]+/g, "_");

  if (["reviewed", "linked", "dismissed", "note"].includes(action)) {
    return action;
  }

  if (action === "review") {
    return "reviewed";
  }

  if (action === "dismiss") {
    return "dismissed";
  }

  return "";
}

function getDuplicateSourceFlagStatusForAction(action) {
  if (action === "note") {
    return undefined;
  }

  return action;
}

function validateDuplicateSourceFlagAction(action, duplicateFlag, note) {
  const currentStatus = parseString(duplicateFlag.status, 40);
  const terminal = ["linked", "dismissed"];

  if (action === "note" && !note) {
    throw new AdminApiError("Add a note before saving a duplicate-source note-only update.", 400);
  }

  if (terminal.includes(currentStatus) && action !== "note") {
    throw new AdminApiError("Closed duplicate-source flags can only receive an admin note.", 409);
  }

  if (["reviewed", "linked", "dismissed"].includes(action) && !note) {
    throw new AdminApiError("Add a staff note before changing duplicate-source status.", 400);
  }
}

function getDefaultDuplicateSourceFlagNote(action) {
  if (action === "reviewed") {
    return "Staff reviewed the duplicate-source signal.";
  }

  if (action === "linked") {
    return "Staff linked this attempt to an earlier protected source.";
  }

  if (action === "dismissed") {
    return "Staff dismissed this duplicate-source signal.";
  }

  return "";
}

async function handleJoinWaitlist(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  let body;

  try {
    body = await readJson(req);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Request body must be valid JSON." });
    return;
  }

  const email = parseString(body.email, 160).toLowerCase();
  const intent = sanitizeWaitlistString(body.intent, 40) || "unknown";
  const source = sanitizeWaitlistString(body.source, 80) || "unknown";
  const pagePath = sanitizePagePath(body.pagePath) || "/";
  const referrer = sanitizeWaitlistString(body.referrer, 240);
  const accessNote = sanitizeWaitlistString(body.accessNote, 500);
  const userAgent = sanitizeWaitlistString(req.headers["user-agent"], 240);
  const submittedAt = new Date().toISOString();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(res, 400, { error: "Enter a valid email address." });
    return;
  }

  if (!waitlistRecipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistRecipientEmail)) {
    sendJson(res, 503, { error: "Waitlist is unavailable right now." });
    return;
  }

  const notification = {
    email,
    intent,
    accessNote,
    source,
    pagePath,
    referrer,
    userAgent,
    submittedAt,
  };

  const resendApiKey = parseString(process.env.RESEND_API_KEY, 240);

  if (!resendApiKey) {
    console.warn("Waitlist signup captured but RESEND_API_KEY is not configured, so no owner email was sent", notification);
    sendJson(res, 200, {
      ok: true,
      emailQueued: false,
    });
    return;
  }

  const text = [
    "New pleasefindmethis waitlist signup",
    "",
    `Email: ${email}`,
    accessNote ? `Access note: ${accessNote}` : "",
    `Intent: ${intent}`,
    `Source: ${source}`,
    `Page: ${pagePath}`,
    referrer ? `Referrer: ${referrer}` : "",
    `Submitted: ${submittedAt}`,
    userAgent ? `User agent: ${userAgent}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let response;

  try {
    response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: waitlistFromEmail,
          to: [waitlistRecipientEmail],
          reply_to: email,
          subject: `pleasefindmethis waitlist: ${email}`,
          text,
          html: renderWaitlistEmailHtml(notification),
        }),
      },
      waitlistNotificationTimeoutMs,
    );
  } catch (error) {
    console.error("Waitlist notification failed", error);
    sendJson(res, 504, { error: "The waitlist notification timed out. Please try again." });
    return;
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    console.error("Waitlist notification was rejected", response.status, responseText.slice(0, 500));
    sendJson(res, 502, { error: "Could not email the waitlist signup. Please try again." });
    return;
  }

  sendJson(res, 200, { ok: true, emailQueued: true });
}

async function handleHealthCheck(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const paymentProvider = getPaymentProvider();
  const whopSandboxProductionOverride =
    isProduction &&
    paymentProvider === "whop" &&
    !isWhopLiveMode() &&
    isWhopSandboxOnProductionAllowed();
  const productionCheckoutAllowed = !isProduction || isConfiguredPaymentProviderLive() || whopSandboxProductionOverride;

  let requestsTableAvailable = false;
  let publicRequestCardsAvailable = false;

  if (supabaseAdmin) {
    const [{ error: requestsError }, { error: publicCardsError }] = await Promise.all([
      supabaseAdmin.from("requests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("public_request_cards").select("id", { count: "exact", head: true }),
    ]);

    requestsTableAvailable = !requestsError;
    publicRequestCardsAvailable = !publicCardsError;
  }

  const healthy =
    Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY) &&
    Boolean(supabaseAdmin) &&
    requestsTableAvailable &&
    publicRequestCardsAvailable &&
    (!isDodoMarketplaceCheckoutAllowed() || paymentProvider === "dodo") &&
    (paymentProvider !== "dodo" || isDodoMarketplaceCheckoutAllowed()) &&
    productionCheckoutAllowed;

  sendJson(res, healthy ? 200 : 503, {
    ok: healthy,
    app: "pleasefindmethis-com",
  });
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
      error: "Checkout is unavailable right now.",
    });
    return;
  }

  if (isProduction && parseBooleanEnv("LEMONSQUEEZY_TEST_MODE", false)) {
    sendJson(res, 503, { error: "Checkout is not available in this deployment." });
    return;
  }

  const origin = ensureCheckoutRedirectOrigin(req, res);

  if (!origin) {
    return;
  }

  const checkoutRequest = await readCheckoutRequest(req, res);

  if (!checkoutRequest) {
    return;
  }

  const { analytics, breakdown, category, details, durationDays, email, itemName, name, requestId } = checkoutRequest;
  const claimed = await claimCheckoutRequest(requestId, "lemonsqueezy");

  if (!claimed) {
    sendJson(res, 409, { error: "Checkout is already in progress for this request. Refresh your dashboard for the latest payment link." });
    return;
  }

  const checkoutPayload = {
    data: {
      type: "checkouts",
      attributes: {
        custom_price: breakdown.total * 100,
        product_options: {
          name: `Fund request: ${itemName}`,
          description: `Finder reward: US$${breakdown.reward}. Platform service and source review fees: US$${breakdown.platformShare}. Category: ${category}.`,
          redirect_url: `${origin}/poster-dashboard?checkout=success`,
          enabled_variants: [parseLemonSqueezyVariantId(variantId)],
          receipt_button_text: "View your request",
          receipt_link_url: `${origin}/poster-dashboard?checkout=success`,
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
            payment_handling_source_review_fee_usd: String(breakdown.protection),
            platform_share_usd: String(breakdown.platformShare),
            total_usd: String(breakdown.total),
            duration_days: String(durationDays),
            source: "pleasefindmethis-post-paywall",
            payment_provider: "lemonsqueezy",
            payment_environment: parseBooleanEnv("LEMONSQUEEZY_TEST_MODE", false) ? "test" : "live",
            ...getPaymentAnalyticsMetadata(analytics),
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
          "Idempotency-Key": `request:${requestId}:checkout`,
        },
        body: JSON.stringify(checkoutPayload),
      },
      paymentProviderTimeoutMs,
    );
  } catch (error) {
    console.error("Lemon Squeezy checkout creation timed out or failed", error);
    await markCheckoutFailed(requestId, true);
    sendJson(res, 504, { error: "The payment provider took too long to create checkout. Please try again." });
    return;
  }

  const responseText = await lemonResponse.text();
  const lemonPayload = parseJson(responseText);

  if (!lemonResponse.ok) {
    console.error("Lemon Squeezy checkout creation failed", lemonResponse.status, getLemonSqueezyErrorSummary(lemonPayload, responseText));
    await markCheckoutFailed(requestId, lemonResponse.status >= 500);
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
    await markCheckoutFailed(requestId, false);
    sendJson(res, 502, { error: "Checkout could not be started." });
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

async function handleCreateWhopCheckout(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (getPaymentProvider() !== "whop") {
    sendJson(res, 409, {
      error: "This checkout option is not available.",
    });
    return;
  }

  const apiKey = process.env.WHOP_API_KEY;
  const companyId = process.env.WHOP_COMPANY_ID ?? process.env.WHOP_PLATFORM_COMPANY_ID;

  if (!apiKey || !companyId) {
    sendJson(res, 503, {
      error: "Checkout is unavailable right now.",
    });
    return;
  }

  if (isProduction && !isWhopLiveMode() && !isWhopSandboxOnProductionAllowed()) {
    sendJson(res, 503, { error: "Checkout is not available in this deployment." });
    return;
  }

  const origin = ensureCheckoutRedirectOrigin(req, res);

  if (!origin) {
    return;
  }

  const checkoutRequest = await readCheckoutRequest(req, res);

  if (!checkoutRequest) {
    return;
  }

  const { analytics, breakdown, category, details, durationDays, email, itemName, name, requestId } = checkoutRequest;
  const claimed = await claimCheckoutRequest(requestId, "whop");

  if (!claimed) {
    sendJson(res, 409, { error: "Checkout is already in progress for this request. Refresh your dashboard for the latest payment link." });
    return;
  }

  const checkoutPayload = {
    mode: "payment",
    company_id: companyId,
    currency: "usd",
    plan: {
      company_id: companyId,
      currency: "usd",
      initial_price: breakdown.total,
      plan_type: "one_time",
      title: "pleasefindmethis request",
      description: `Finder reward: US$${breakdown.reward}. Platform and review fees: US$${breakdown.platformShare}.`,
      force_create_new_plan: true,
      metadata: {
        ...(requestId ? { request_id: requestId } : {}),
        source: "pleasefindmethis-post-paywall",
      },
    },
    metadata: {
      ...(requestId ? { request_id: requestId } : {}),
      item_name: itemName,
      category,
      details,
      customer_email: email,
      ...(name ? { customer_name: name } : {}),
      finder_payout_usd: String(breakdown.reward),
      platform_service_fee_usd: String(breakdown.platformFee),
      payment_handling_source_review_fee_usd: String(breakdown.protection),
      platform_share_usd: String(breakdown.platformShare),
      total_usd: String(breakdown.total),
      duration_days: String(durationDays),
      source: "pleasefindmethis-post-paywall",
      payment_provider: "whop",
      payment_environment: getWhopEnvironment(),
      ...getPaymentAnalyticsMetadata(analytics),
    },
    redirect_url: `${origin}/poster-dashboard?checkout=success`,
  };

  let whopResponse;

  try {
    whopResponse = await fetchWithTimeout(
      `${getWhopApiBase()}/checkout_configurations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Api-Version-Date": parseString(process.env.WHOP_API_VERSION_DATE, 40) || "2026-07-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutPayload),
      },
      paymentProviderTimeoutMs,
    );
  } catch (error) {
    console.error("Whop checkout creation timed out or failed", error);
    await markCheckoutFailed(requestId, true);
    sendJson(res, 504, { error: "The payment provider took too long to create checkout. Please try again." });
    return;
  }

  const responseText = await whopResponse.text();
  const whopPayload = parseJson(responseText);

  if (!whopResponse.ok) {
    console.error("Whop checkout creation failed", whopResponse.status, getWhopErrorSummary(whopPayload, responseText));
    await markCheckoutFailed(requestId, whopResponse.status >= 500 || whopResponse.status === 429);
    sendJson(res, 502, {
      error: getWhopCheckoutError(whopResponse.status, whopPayload),
    });
    return;
  }

  if (!isRecord(whopPayload)) {
    console.error("Whop checkout response was not JSON", responseText.slice(0, 500));
    await markCheckoutFailed(requestId, false);
    sendJson(res, 502, { error: "Whop did not return a valid checkout response." });
    return;
  }

  const checkoutUrl = normalizeWhopPurchaseUrl(parseString(whopPayload.purchase_url, 1000));
  const checkoutId = parseString(whopPayload.id, 160);

  if (!checkoutUrl) {
    console.error("Whop checkout response did not include a purchase_url", getWhopErrorSummary(whopPayload, responseText));
    await markCheckoutFailed(requestId, false);
    sendJson(res, 502, { error: "Whop did not return a checkout URL." });
    return;
  }

  await updateRequestPaymentState(requestId, {
    payment_provider: "whop",
    ...(checkoutId ? { checkout_session_id: checkoutId } : {}),
    checkout_url: checkoutUrl,
    status: "checkout_started",
    payment_status: "checkout_started",
  });

  sendJson(res, 200, {
    provider: "whop",
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
    sendJson(res, 503, { error: "Webhook is not available." });
    return;
  }

  const rawBody = await readRawBody(req);
  let event;

  try {
    const webhook = new Webhook(webhookSecret);
    event = webhook.verify(rawBody.toString("utf8"), {
      "webhook-id": firstHeader(req.headers["webhook-id"]),
      "webhook-signature": firstHeader(req.headers["webhook-signature"]),
      "webhook-timestamp": firstHeader(req.headers["webhook-timestamp"]),
    });
  } catch (error) {
    console.error("Invalid Dodo webhook signature", error);
    sendJson(res, 400, { error: "Invalid webhook signature." });
    return;
  }

  try {
    const eventType = getDodoEventType(event);
    const eventData = getDodoEventData(event);
    await syncDodoEventToRequest(eventType, eventData, event, req);
    console.log("Verified Dodo webhook", {
      type: eventType,
      paymentId: eventData.payment_id,
      sessionId: eventData.session_id,
    });

    sendJson(res, 200, { received: true });
  } catch (error) {
    const status = error instanceof WebhookValidationError ? error.statusCode : 500;
    console.error("Could not process Dodo webhook", error);
    sendJson(res, status, { error: "Webhook could not be processed." });
  }
}

async function handleLemonSqueezyWebhook(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    sendJson(res, 503, { error: "Webhook is not available." });
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

  try {
    await syncLemonSqueezyEventToRequest(eventType, eventData, event);
    console.log("Verified Lemon Squeezy webhook", {
      type: eventType,
      orderId: eventData.id,
    });

    sendJson(res, 200, { received: true });
  } catch (error) {
    const status = error instanceof WebhookValidationError ? error.statusCode : 500;
    console.error("Could not process Lemon Squeezy webhook", error);
    sendJson(res, status, { error: "Webhook could not be processed." });
  }
}

async function handleWhopWebhook(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  if (!webhookSecret) {
    sendJson(res, 503, { error: "Webhook is not available." });
    return;
  }

  const rawBody = await readRawBody(req);
  let event;

  try {
    const webhook = new Webhook(webhookSecret);
    event = webhook.verify(rawBody.toString("utf8"), {
      "webhook-id": firstHeader(req.headers["webhook-id"]),
      "webhook-signature": firstHeader(req.headers["webhook-signature"]),
      "webhook-timestamp": firstHeader(req.headers["webhook-timestamp"]),
    });
  } catch (error) {
    console.error("Invalid Whop webhook signature", error);
    sendJson(res, 400, { error: "Invalid webhook signature." });
    return;
  }

  try {
    const eventType = getWhopEventType(event);
    const eventData = getWhopEventData(event);
    await syncWhopEventToRequest(eventType, eventData, event, req);
    console.log("Verified Whop webhook", {
      type: eventType,
      paymentId: eventData.id,
      checkoutConfigurationId: eventData.checkout_configuration_id,
    });

    sendJson(res, 200, { received: true });
  } catch (error) {
    const status = error instanceof WebhookValidationError ? error.statusCode : 500;
    console.error("Could not process Whop webhook", error);
    sendJson(res, status, { error: "Webhook could not be processed." });
  }
}

async function handleRazorpayWebhook(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    sendJson(res, 503, { error: "Webhook is not available." });
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = firstHeader(req.headers["x-razorpay-signature"]);

  if (!verifyRazorpaySignature(rawBody, signature, webhookSecret)) {
    console.error("Invalid Razorpay webhook signature");
    sendJson(res, 400, { error: "Invalid webhook signature." });
    return;
  }

  const event = parseJson(rawBody.toString("utf8"));

  if (!isRecord(event)) {
    sendJson(res, 400, { error: "Webhook body must be valid JSON." });
    return;
  }

  try {
    const eventType = getRazorpayEventType(event);
    const eventData = getRazorpayEventData(event);
    await syncRazorpayEventToRequest(eventType, eventData, event, req);
    console.log("Verified Razorpay webhook", {
      type: eventType,
      paymentId: eventData.payment.id,
      paymentLinkId: eventData.paymentLink.id,
    });

    sendJson(res, 200, { received: true });
  } catch (error) {
    const status = error instanceof WebhookValidationError ? error.statusCode : 500;
    console.error("Could not process Razorpay webhook", error);
    sendJson(res, status, { error: "Webhook could not be processed." });
  }
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

  if (code === "MERCHANT_NOT_LIVE") {
    return {
      status: 503,
      message: "Checkout is not available right now. Please try again later.",
    };
  }

  if (status === 401) {
    return {
      status: 502,
      message: "Checkout could not be started. Please contact support.",
    };
  }

  return {
    status: 502,
    message: "Checkout could not be started. Please try again.",
  };
}

function getLemonSqueezyCheckoutError(status, payload) {
  if (status === 401) {
    return "Checkout could not be started. Please contact support.";
  }

  if (status === 422) {
    return "Checkout could not be started. Please contact support.";
  }

  return "Checkout could not be started. Please try again.";
}

function getWhopCheckoutError(status, payload) {
  if (status === 401 || status === 403) {
    return "Checkout could not be started. Please contact support.";
  }

  if (status === 422) {
    return "Checkout could not be started. Please contact support.";
  }

  return "Checkout could not be started. Please try again.";
}

function getRazorpayCheckoutError(status, payload) {
  if (status === 401 || status === 403) {
    return "Checkout could not be started. Please contact support.";
  }

  if (status === 400) {
    const error = isRecord(payload?.error) ? payload.error : {};
    const description = parseString(error.description, 220);

    if (description) {
      return "Checkout could not be started. Please contact support.";
    }
  }

  return "Checkout could not be started. Please try again.";
}

function getRazorpayCheckoutErrorStatus(status) {
  if (status === 429) {
    return 503;
  }

  return 502;
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

function getWhopErrorSummary(payload, responseText) {
  if (isRecord(payload)) {
    return payload;
  }

  return responseText.slice(0, 500);
}

function getRazorpayErrorSummary(payload, responseText) {
  if (isRecord(payload)) {
    return payload;
  }

  return responseText.slice(0, 500);
}

class WebhookValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "WebhookValidationError";
    this.statusCode = statusCode;
  }
}

class AdminApiError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AdminApiError";
    this.statusCode = statusCode;
  }
}

function isMarketplaceAdminUser(user) {
  const email = parseString(user?.email, 160).toLowerCase();

  if (email && getMarketplaceAdminEmails().has(email)) {
    return true;
  }

  const appMetadata = isRecord(user?.app_metadata) ? user.app_metadata : {};
  const role = parseString(appMetadata.role, 80).toLowerCase();
  const roles = Array.isArray(appMetadata.roles)
    ? appMetadata.roles.map((entry) => parseString(entry, 80).toLowerCase())
    : parseString(appMetadata.roles, 300)
        .toLowerCase()
        .split(/[,\s]+/)
        .filter(Boolean);

  return [role, ...roles].some((entry) => entry === "admin" || entry === "staff" || entry === "marketplace_admin");
}

function hasMarketplaceAdminConfiguration() {
  return getMarketplaceAdminEmails().size > 0;
}

function getMarketplaceAdminEmails() {
  const raw = [process.env.MARKETPLACE_ADMIN_EMAILS, process.env.ADMIN_EMAILS].filter(Boolean).join(",");

  return new Set(
    raw
      .split(/[,\s]+/)
      .map((entry) => entry.trim().toLowerCase())
      .filter((entry) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry)),
  );
}

async function syncDodoEventToRequest(eventType, eventData, rawEvent, req) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const metadata = isRecord(eventData.metadata) ? eventData.metadata : {};
  const requestId = parseString(metadata.request_id, 64);

  if (!requestId) {
    return;
  }

  const request = await loadPaymentRequest(requestId);
  const providerEventId = getDodoProviderEventId(rawEvent, req, eventType, eventData, requestId);
  const providerEnvironment = getDodoWebhookEnvironment(eventData, rawEvent);
  const paymentId = parseString(eventData.payment_id, 160) || parseString(eventData.id, 160);
  const sessionId = parseString(eventData.session_id, 160) || parseString(eventData.checkout_session_id, 160);

  validateWebhookEnvironment("dodo", providerEnvironment);
  validateRequestProviderState("dodo", request, { paymentId, sessionId });

  if (eventType === "payment.succeeded") {
    validatePaidWebhookAmount("dodo", request, eventData, rawEvent);
    validateDodoProduct(eventData);
  }

  await recordPaymentEvent({
    provider: "dodo",
    request_id: requestId,
    event_type: eventType,
    provider_event_id: providerEventId,
    provider_environment: providerEnvironment,
    dodo_payment_id: paymentId || null,
    checkout_session_id: sessionId || null,
    payload: rawEvent,
  });

  const paymentUpdate = getPaymentUpdateForEvent(eventType, eventData, request);

  if (!paymentUpdate) {
    return;
  }

  await updateRequestPaymentState(requestId, paymentUpdate);

  if (paymentUpdate.payment_status === "paid") {
    await sendPaidRequestAnalytics({
      analytics: getAnalyticsContextFromPaymentMetadata(metadata),
      countryContext: getPaymentCountryContext(eventData, rawEvent),
      provider: "dodo",
      providerEventId,
      request,
      transactionId: paymentId || sessionId || providerEventId,
    });
  }
}

async function syncLemonSqueezyEventToRequest(eventType, eventData, rawEvent) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const meta = isRecord(rawEvent.meta) ? rawEvent.meta : {};
  const customData = isRecord(meta.custom_data) ? meta.custom_data : {};
  const requestId = parseString(customData.request_id, 64);

  if (!requestId) {
    return;
  }

  const request = await loadPaymentRequest(requestId);
  const attributes = isRecord(eventData.attributes) ? eventData.attributes : {};
  const checkoutId = parseString(customData.checkout_id, 160);
  const orderId = parseString(eventData.id, 160);
  const providerEventId = getLemonSqueezyProviderEventId(rawEvent, eventType, eventData, requestId);
  const providerEnvironment = getLemonSqueezyWebhookEnvironment(rawEvent, attributes);

  validateWebhookEnvironment("lemonsqueezy", providerEnvironment);
  validateRequestProviderState("lemonsqueezy", request, { orderId, checkoutId });

  if (eventType === "order_created") {
    validatePaidWebhookAmount("lemonsqueezy", request, eventData, rawEvent);
    validateLemonSqueezyProduct(attributes);
  }

  await recordPaymentEvent({
    provider: "lemonsqueezy",
    request_id: requestId,
    event_type: eventType,
    provider_event_id: providerEventId,
    provider_environment: providerEnvironment,
    lemon_squeezy_order_id: orderId || null,
    checkout_session_id: checkoutId || null,
    payload: rawEvent,
  });

  const paymentUpdate = getLemonSqueezyPaymentUpdateForEvent(eventType, eventData, customData, request);

  if (!paymentUpdate) {
    return;
  }

  await updateRequestPaymentState(requestId, paymentUpdate);

  if (paymentUpdate.payment_status === "paid") {
    await sendPaidRequestAnalytics({
      analytics: getAnalyticsContextFromPaymentMetadata(customData),
      countryContext: getPaymentCountryContext(eventData, rawEvent),
      provider: "lemonsqueezy",
      providerEventId,
      request,
      transactionId: orderId || checkoutId || providerEventId,
    });
  }
}

async function syncWhopEventToRequest(eventType, eventData, rawEvent, req) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const metadata = isRecord(eventData.metadata) ? eventData.metadata : {};
  const requestId = parseString(metadata.request_id, 64);

  if (!requestId) {
    return;
  }

  const request = await loadPaymentRequest(requestId);
  const providerEventId = getWhopProviderEventId(rawEvent, req, eventType, eventData, requestId);
  const providerEnvironment = getWhopWebhookEnvironment(eventData, rawEvent);
  const paymentId = parseString(eventData.id, 160);
  const checkoutId =
    parseString(eventData.checkout_configuration_id, 160) ||
    parseString(eventData.checkout_configuration?.id, 160) ||
    parseString(eventData.checkout_session_id, 160);

  validateWebhookEnvironment("whop", providerEnvironment);
  validateRequestProviderState("whop", request, { paymentId, checkoutId });

  if (eventType === "payment.succeeded") {
    validatePaidWebhookAmount("whop", request, eventData, rawEvent);
    validateWhopCompany(eventData, rawEvent);
  }

  await recordPaymentEvent({
    provider: "whop",
    request_id: requestId,
    event_type: eventType,
    provider_event_id: providerEventId,
    provider_environment: providerEnvironment,
    whop_payment_id: paymentId || null,
    checkout_session_id: checkoutId || null,
    payload: rawEvent,
  });

  const paymentUpdate = getWhopPaymentUpdateForEvent(eventType, eventData, request);

  if (!paymentUpdate) {
    return;
  }

  await updateRequestPaymentState(requestId, paymentUpdate);

  if (paymentUpdate.payment_status === "paid") {
    await sendPaidRequestAnalytics({
      analytics: getAnalyticsContextFromPaymentMetadata(metadata),
      countryContext: getPaymentCountryContext(eventData, rawEvent),
      provider: "whop",
      providerEventId,
      request,
      transactionId: paymentId || checkoutId || providerEventId,
    });
  }
}

async function syncRazorpayEventToRequest(eventType, eventData, rawEvent, req) {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured.");
  }

  const notes = getRazorpayEventNotes(eventData);
  const requestId = parseString(notes.request_id, 64);

  if (!requestId) {
    return;
  }

  const request = await loadPaymentRequest(requestId);
  const providerEventId = getRazorpayProviderEventId(rawEvent, req, eventType, eventData, requestId);
  const providerEnvironment = getRazorpayWebhookEnvironment(eventData);
  const paymentId = parseString(eventData.payment.id, 160);
  const paymentLinkId = parseString(eventData.paymentLink.id, 160);

  validateWebhookEnvironment("razorpay", providerEnvironment);
  validateRequestProviderState("razorpay", request, { paymentId, paymentLinkId });

  if (eventType === "payment_link.paid" || eventType === "payment.captured") {
    validatePaidWebhookAmount("razorpay", request, eventData, rawEvent);
  }

  await recordPaymentEvent({
    provider: "razorpay",
    request_id: requestId,
    event_type: eventType,
    provider_event_id: providerEventId,
    provider_environment: providerEnvironment,
    razorpay_payment_id: paymentId || null,
    razorpay_payment_link_id: paymentLinkId || null,
    checkout_session_id: paymentLinkId || null,
    payload: rawEvent,
  });

  const paymentUpdate = getRazorpayPaymentUpdateForEvent(eventType, eventData, request);

  if (!paymentUpdate) {
    return;
  }

  await updateRequestPaymentState(requestId, paymentUpdate);

  if (paymentUpdate.payment_status === "paid") {
    await sendPaidRequestAnalytics({
      analytics: getAnalyticsContextFromPaymentMetadata(notes),
      countryContext: getPaymentCountryContext(eventData.payment, rawEvent),
      provider: "razorpay",
      providerEventId,
      request,
      transactionId: paymentId || paymentLinkId || providerEventId,
    });
  }
}

async function loadPaymentRequest(requestId) {
  const selectWithRazorpayIds =
    "id,category,reward,service_fee,protection_reserve,total_due,finder_payout,currency,status,payment_status,payout_status,platform_fee_status,payment_provider,checkout_session_id,checkout_url,dodo_payment_id,lemon_squeezy_order_id,whop_payment_id,razorpay_payment_id,razorpay_payment_link_id,paid_at,customer_email";
  const selectBase =
    "id,category,reward,service_fee,protection_reserve,total_due,finder_payout,currency,status,payment_status,payout_status,platform_fee_status,payment_provider,checkout_session_id,checkout_url,dodo_payment_id,lemon_squeezy_order_id,whop_payment_id,paid_at,customer_email";
  let { data, error } = await supabaseAdmin
    .from("requests")
    .select(selectWithRazorpayIds)
    .eq("id", requestId)
    .single();

  if (error && (error.code === "PGRST204" || error.code === "42703" || /razorpay_payment/.test(error.message ?? ""))) {
    const fallback = await supabaseAdmin.from("requests").select(selectBase).eq("id", requestId).single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    throw new WebhookValidationError("Request referenced by webhook was not found.", 404);
  }

  return data;
}

async function recordPaymentEvent(eventRow) {
  const { error } = await supabaseAdmin.from("request_payment_events").insert(eventRow);

  if (!error) {
    return;
  }

  if (error.code === "23505") {
    return;
  }

  const missingNewColumns =
    error.code === "PGRST204" ||
    error.code === "42703" ||
    /provider_event_id|provider_environment|razorpay_payment/.test(error.message ?? "");

  if (!missingNewColumns) {
    throw new Error(`Could not record payment event: ${error.message}`);
  }

  const fallbackRow = { ...eventRow };
  delete fallbackRow.provider_event_id;
  delete fallbackRow.provider_environment;
  delete fallbackRow.razorpay_payment_id;
  delete fallbackRow.razorpay_payment_link_id;
  const { error: fallbackError } = await supabaseAdmin.from("request_payment_events").insert(fallbackRow);

  if (fallbackError && fallbackError.code !== "23505") {
    throw new Error(`Could not record payment event: ${fallbackError.message}`);
  }
}

async function updateRequestPaymentState(requestId, updates) {
  if (!supabaseAdmin || !requestId) {
    return;
  }

  const { error } = await supabaseAdmin.from("requests").update(updates).eq("id", requestId);

  if (error) {
    console.error("Could not update request payment state", { requestId, updates, error });
    throw new Error("Could not update request payment state.");
  }
}

async function claimCheckoutRequest(requestId, provider) {
  if (!supabaseAdmin || !requestId) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("requests")
    .update({
      status: "checkout_started",
      payment_status: "checkout_started",
      payment_provider: provider,
    })
    .eq("id", requestId)
    .eq("status", "checkout_pending")
    .eq("payment_status", "unpaid")
    .eq("payment_provider", "pending")
    .is("checkout_session_id", null)
    .is("checkout_url", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Could not claim checkout request", { requestId, provider, error });
    throw new Error("Could not prepare this request for checkout.");
  }

  return Boolean(data?.id);
}

async function markCheckoutFailed(requestId, retryable) {
  if (!supabaseAdmin || !requestId) {
    return;
  }

  const updates = retryable
    ? {
        status: "checkout_pending",
        payment_status: "unpaid",
        payment_provider: "pending",
      }
    : {
        status: "checkout_failed",
        payment_status: "failed",
      };

  try {
    await updateRequestPaymentState(requestId, updates);
  } catch (error) {
    console.error("Could not mark checkout failure", { requestId, retryable, error });
  }
}

function validateWebhookEnvironment(provider, providerEnvironment) {
  if (!isProduction) {
    return;
  }

  if (provider === "dodo" && !isDodoLiveMode()) {
    throw new WebhookValidationError("Dodo production webhooks are disabled until DODO_PAYMENTS_ENVIRONMENT is live.", 409);
  }

  if (provider === "lemonsqueezy" && parseBooleanEnv("LEMONSQUEEZY_TEST_MODE", false)) {
    throw new WebhookValidationError("Lemon Squeezy production webhooks are disabled while test mode is enabled.", 409);
  }

  if (provider === "whop" && !isWhopLiveMode() && !isWhopSandboxOnProductionAllowed()) {
    throw new WebhookValidationError("Whop production webhooks are disabled until WHOP_ENVIRONMENT is live.", 409);
  }

  if (provider === "razorpay" && !isRazorpayLiveMode()) {
    throw new WebhookValidationError("Razorpay production webhooks are disabled until RAZORPAY_ENVIRONMENT is live.", 409);
  }

  if (providerEnvironment === "test" && !(provider === "whop" && isWhopSandboxOnProductionAllowed())) {
    throw new WebhookValidationError("Test-mode payment webhooks cannot update production marketplace state.", 409);
  }
}

function validateRequestProviderState(provider, request, ids) {
  if (request.payment_provider !== provider && request.payment_provider !== "pending") {
    throw new WebhookValidationError("Webhook provider does not match the request payment provider.", 409);
  }

  if (provider === "dodo") {
    if (request.dodo_payment_id && ids.paymentId && request.dodo_payment_id !== ids.paymentId) {
      throw new WebhookValidationError("Webhook payment id does not match the request.", 409);
    }

    if (request.checkout_session_id && ids.sessionId && request.checkout_session_id !== ids.sessionId) {
      throw new WebhookValidationError("Webhook checkout session does not match the request.", 409);
    }
  }

  if (provider === "lemonsqueezy") {
    if (request.lemon_squeezy_order_id && ids.orderId && request.lemon_squeezy_order_id !== ids.orderId) {
      throw new WebhookValidationError("Webhook order id does not match the request.", 409);
    }

    if (request.checkout_session_id && ids.checkoutId && request.checkout_session_id !== ids.checkoutId) {
      throw new WebhookValidationError("Webhook checkout session does not match the request.", 409);
    }
  }

  if (provider === "whop") {
    if (request.whop_payment_id && ids.paymentId && request.whop_payment_id !== ids.paymentId) {
      throw new WebhookValidationError("Webhook payment id does not match the request.", 409);
    }

    if (request.checkout_session_id && ids.checkoutId && request.checkout_session_id !== ids.checkoutId) {
      throw new WebhookValidationError("Webhook checkout session does not match the request.", 409);
    }
  }

  if (provider === "razorpay") {
    if (request.razorpay_payment_id && ids.paymentId && request.razorpay_payment_id !== ids.paymentId) {
      throw new WebhookValidationError("Webhook payment id does not match the request.", 409);
    }

    if (request.razorpay_payment_link_id && ids.paymentLinkId && request.razorpay_payment_link_id !== ids.paymentLinkId) {
      throw new WebhookValidationError("Webhook payment link does not match the request.", 409);
    }

    if (request.checkout_session_id && ids.paymentLinkId && request.checkout_session_id !== ids.paymentLinkId) {
      throw new WebhookValidationError("Webhook checkout session does not match the request.", 409);
    }
  }
}

function validatePaidWebhookAmount(provider, request, eventData, rawEvent) {
  const currency = getPaymentCurrency(provider, eventData, rawEvent);
  const amountCents = getPaymentAmountCents(provider, eventData, rawEvent);

  if (currency !== "USD") {
    throw new WebhookValidationError("Webhook currency does not match the request currency.", 409);
  }

  if (amountCents !== Number(request.total_due) * 100) {
    throw new WebhookValidationError("Webhook amount does not match the saved request total.", 409);
  }
}

function validateDodoProduct(eventData) {
  const expectedProductId = parseString(process.env.DODO_PRODUCT_ID, 160);
  const eventProductId =
    parseString(eventData.product_id, 160) ||
    parseString(eventData.productId, 160) ||
    parseString(isRecord(eventData.product) ? eventData.product.id : "", 160);

  if (eventProductId && expectedProductId && eventProductId !== expectedProductId) {
    throw new WebhookValidationError("Dodo product id does not match this app.", 409);
  }
}

function validateLemonSqueezyProduct(attributes) {
  const expectedVariantId = parseString(process.env.LEMONSQUEEZY_VARIANT_ID, 160);
  const eventVariantId =
    parseString(attributes.variant_id, 160) ||
    parseString(attributes.variantId, 160) ||
    parseString(isRecord(attributes.first_order_item) ? attributes.first_order_item.variant_id : "", 160);

  if (eventVariantId && expectedVariantId && eventVariantId !== expectedVariantId) {
    throw new WebhookValidationError("Lemon Squeezy variant id does not match this app.", 409);
  }
}

function validateWhopCompany(eventData, rawEvent) {
  const expectedCompanyId = parseString(process.env.WHOP_COMPANY_ID ?? process.env.WHOP_PLATFORM_COMPANY_ID, 160);
  const eventCompanyId =
    parseString(rawEvent?.company_id, 160) ||
    parseString(isRecord(eventData.company) ? eventData.company.id : "", 160) ||
    parseString(eventData.company_id, 160);

  if (eventCompanyId && expectedCompanyId && eventCompanyId !== expectedCompanyId) {
    throw new WebhookValidationError("Whop company id does not match this app.", 409);
  }
}

function getPaymentCurrency(provider, eventData, rawEvent) {
  if (provider === "lemonsqueezy") {
    const attributes = isRecord(eventData.attributes) ? eventData.attributes : {};
    return (
      parseString(attributes.currency, 10) ||
      parseString(attributes.currency_code, 10) ||
      parseString(rawEvent?.meta?.currency, 10)
    ).toUpperCase();
  }

  if (provider === "whop") {
    return (parseString(eventData.currency, 10) || parseString(eventData.settlement_currency, 10)).toUpperCase();
  }

  if (provider === "razorpay") {
    return (
      parseString(eventData.paymentLink.currency, 10) ||
      parseString(eventData.order.currency, 10) ||
      parseString(eventData.payment.currency, 10)
    ).toUpperCase();
  }

  return (
    parseString(eventData.currency, 10) ||
    parseString(eventData.billing_currency, 10) ||
    parseString(eventData.payment_currency, 10)
  ).toUpperCase();
}

function getPaymentAmountCents(provider, eventData, rawEvent) {
  if (provider === "lemonsqueezy") {
    const attributes = isRecord(eventData.attributes) ? eventData.attributes : {};
    return parseAmountCents(
      attributes.total_usd ??
        attributes.total ??
        attributes.subtotal ??
        attributes.total_formatted ??
        rawEvent?.meta?.total,
    );
  }

  if (provider === "whop") {
    return parseDecimalAmountCents(eventData.usd_total ?? eventData.total ?? eventData.subtotal);
  }

  if (provider === "razorpay") {
    return parseAmountCents(
      eventData.paymentLink.amount_paid ||
        eventData.payment.amount ||
        eventData.order.amount_paid ||
        eventData.paymentLink.amount ||
        eventData.order.amount,
    );
  }

  return parseAmountCents(eventData.total_amount ?? eventData.amount ?? eventData.payment_amount ?? eventData.total);
}

function parseDecimalAmountCents(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }

  if (typeof value !== "string") {
    return NaN;
  }

  const numeric = Number(value.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numeric)) {
    return NaN;
  }

  return Math.round(numeric * 100);
}

function parseAmountCents(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }

  if (typeof value !== "string") {
    return NaN;
  }

  const normalized = value.replace(/[^0-9.]/g, "");
  const numeric = Number(normalized);

  if (!Number.isFinite(numeric)) {
    return NaN;
  }

  return value.includes(".") ? Math.round(numeric * 100) : Math.round(numeric);
}

function getIsoFromUnixSeconds(value) {
  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(seconds * 1000).toISOString();
}

function getDodoProviderEventId(rawEvent, req, eventType, eventData, requestId) {
  return (
    firstHeader(req.headers["webhook-id"]) ||
    parseString(rawEvent?.id, 160) ||
    parseString(rawEvent?.event_id, 160) ||
    `${eventType}:${requestId}:${parseString(eventData.payment_id, 160) || parseString(eventData.session_id, 160) || "unknown"}`
  );
}

function getLemonSqueezyProviderEventId(rawEvent, eventType, eventData, requestId) {
  const meta = isRecord(rawEvent.meta) ? rawEvent.meta : {};
  return (
    parseString(meta.event_id, 160) ||
    parseString(rawEvent.id, 160) ||
    `${eventType}:${requestId}:${parseString(eventData.id, 160) || "unknown"}`
  );
}

function getWhopProviderEventId(rawEvent, req, eventType, eventData, requestId) {
  return (
    firstHeader(req.headers["webhook-id"]) ||
    parseString(rawEvent?.id, 160) ||
    `${eventType}:${requestId}:${parseString(eventData.id, 160) || parseString(eventData.checkout_configuration_id, 160) || "unknown"}`
  );
}

function getRazorpayProviderEventId(rawEvent, req, eventType, eventData, requestId) {
  return (
    firstHeader(req.headers["x-razorpay-event-id"]) ||
    parseString(rawEvent?.id, 160) ||
    `${eventType}:${requestId}:${parseString(eventData.payment.id, 160) || parseString(eventData.paymentLink.id, 160) || "unknown"}`
  );
}

function getDodoWebhookEnvironment(eventData, rawEvent) {
  const metadata = isRecord(eventData.metadata) ? eventData.metadata : {};
  const value =
    parseString(metadata.payment_environment, 20) ||
    parseString(eventData.environment, 20) ||
    parseString(rawEvent?.environment, 20) ||
    getDodoEnvironment();

  return normalizePaymentEnvironment(value);
}

function getLemonSqueezyWebhookEnvironment(rawEvent, attributes) {
  const meta = isRecord(rawEvent.meta) ? rawEvent.meta : {};
  const customData = isRecord(meta.custom_data) ? meta.custom_data : {};

  if (typeof meta.test_mode === "boolean") {
    return meta.test_mode ? "test" : "live";
  }

  if (typeof attributes.test_mode === "boolean") {
    return attributes.test_mode ? "test" : "live";
  }

  if (customData.payment_environment) {
    return normalizePaymentEnvironment(customData.payment_environment);
  }

  return parseBooleanEnv("LEMONSQUEEZY_TEST_MODE", false) ? "test" : "live";
}

function getWhopWebhookEnvironment(eventData, rawEvent) {
  const metadata = isRecord(eventData.metadata) ? eventData.metadata : {};
  const value = parseString(metadata.payment_environment, 20) || parseString(rawEvent?.environment, 20) || getWhopEnvironment();
  return normalizePaymentEnvironment(value);
}

function getRazorpayWebhookEnvironment(eventData) {
  const notes = getRazorpayEventNotes(eventData);
  const value = parseString(notes.payment_environment, 20) || getRazorpayEnvironment();
  return normalizePaymentEnvironment(value);
}

function normalizePaymentEnvironment(value) {
  const normalized = parseString(value, 40).toLowerCase();

  if (["live", "live_mode", "production", "prod"].includes(normalized)) {
    return "live";
  }

  return "test";
}

function isTerminalPaymentState(paymentStatus) {
  return ["paid", "refunded", "disputed"].includes(paymentStatus);
}

function getPaymentUpdateForEvent(eventType, eventData, request) {
  const paymentId = parseString(eventData.payment_id, 160) || parseString(eventData.id, 160);
  const sessionId = parseString(eventData.session_id, 160) || parseString(eventData.checkout_session_id, 160);
  const paymentFields = {
    payment_provider: "dodo",
    ...(paymentId ? { dodo_payment_id: paymentId } : {}),
    ...(sessionId ? { checkout_session_id: sessionId } : {}),
  };

  if (eventType === "payment.succeeded") {
    if (isTerminalPaymentState(request.payment_status)) {
      return null;
    }

    return {
      ...paymentFields,
      status: "paid",
      payment_status: "paid",
      payout_status: request.payout_status === "not_ready" ? "pending_acceptance" : request.payout_status,
      platform_fee_status: request.platform_fee_status === "unearned" ? "earned" : request.platform_fee_status,
      paid_at: request.paid_at ?? new Date().toISOString(),
    };
  }

  if (eventType === "payment.failed") {
    if (request.payment_status !== "unpaid" && request.payment_status !== "checkout_started") {
      return null;
    }

    return {
      ...paymentFields,
      status: "checkout_failed",
      payment_status: "failed",
    };
  }

  if (eventType === "payment.cancelled") {
    if (request.payment_status !== "unpaid" && request.payment_status !== "checkout_started") {
      return null;
    }

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

function getLemonSqueezyPaymentUpdateForEvent(eventType, eventData, customData, request) {
  const orderId = parseString(eventData.id, 160);
  const checkoutId = parseString(customData.checkout_id, 160);
  const paymentFields = {
    payment_provider: "lemonsqueezy",
    ...(orderId ? { lemon_squeezy_order_id: orderId } : {}),
    ...(checkoutId ? { checkout_session_id: checkoutId } : {}),
  };

  if (eventType === "order_created") {
    if (isTerminalPaymentState(request.payment_status)) {
      return null;
    }

    return {
      ...paymentFields,
      status: "paid",
      payment_status: "paid",
      payout_status: request.payout_status === "not_ready" ? "pending_acceptance" : request.payout_status,
      platform_fee_status: request.platform_fee_status === "unearned" ? "earned" : request.platform_fee_status,
      paid_at: request.paid_at ?? new Date().toISOString(),
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

function getWhopPaymentUpdateForEvent(eventType, eventData, request) {
  const paymentId = parseString(eventData.id, 160);
  const checkoutId =
    parseString(eventData.checkout_configuration_id, 160) ||
    parseString(eventData.checkout_configuration?.id, 160) ||
    parseString(eventData.checkout_session_id, 160);
  const substatus = parseString(eventData.substatus, 80).toLowerCase();
  const total = Number(eventData.total ?? eventData.usd_total ?? 0);
  const refundedAmount = Number(eventData.refunded_amount ?? 0);
  const paymentFields = {
    payment_provider: "whop",
    ...(paymentId ? { whop_payment_id: paymentId } : {}),
    ...(checkoutId ? { checkout_session_id: checkoutId } : {}),
  };

  if (eventType === "payment.succeeded") {
    if (isTerminalPaymentState(request.payment_status)) {
      return null;
    }

    return {
      ...paymentFields,
      status: "paid",
      payment_status: "paid",
      payout_status: request.payout_status === "not_ready" ? "pending_acceptance" : request.payout_status,
      platform_fee_status: request.platform_fee_status === "unearned" ? "earned" : request.platform_fee_status,
      paid_at: request.paid_at ?? (parseString(eventData.paid_at, 80) || new Date().toISOString()),
    };
  }

  if (eventType === "payment.failed" || ["failed", "canceled", "uncollectible"].includes(substatus)) {
    if (request.payment_status !== "unpaid" && request.payment_status !== "checkout_started") {
      return null;
    }

    return {
      ...paymentFields,
      status: "checkout_failed",
      payment_status: "failed",
    };
  }

  if (eventType.startsWith("refund.") || ["refunded", "auto_refunded"].includes(substatus) || (total > 0 && refundedAmount >= total)) {
    return {
      ...paymentFields,
      status: "refunded",
      payment_status: "refunded",
      payout_status: "refunded",
      platform_fee_status: "refunded",
    };
  }

  if (eventType.startsWith("dispute.") || substatus.includes("dispute") || substatus.includes("resolution")) {
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

function getRazorpayPaymentUpdateForEvent(eventType, eventData, request) {
  const paymentId = parseString(eventData.payment.id, 160);
  const paymentLinkId = parseString(eventData.paymentLink.id, 160);
  const paymentStatus = parseString(eventData.payment.status, 80).toLowerCase();
  const paymentLinkStatus = parseString(eventData.paymentLink.status, 80).toLowerCase();
  const paymentFields = {
    payment_provider: "razorpay",
    ...(paymentId ? { razorpay_payment_id: paymentId } : {}),
    ...(paymentLinkId ? { checkout_session_id: paymentLinkId, razorpay_payment_link_id: paymentLinkId } : {}),
  };

  if (eventType === "payment_link.paid" || eventType === "payment.captured" || paymentLinkStatus === "paid" || paymentStatus === "captured") {
    if (isTerminalPaymentState(request.payment_status)) {
      return null;
    }

    return {
      ...paymentFields,
      status: "paid",
      payment_status: "paid",
      payout_status: request.payout_status === "not_ready" ? "pending_acceptance" : request.payout_status,
      platform_fee_status: request.platform_fee_status === "unearned" ? "earned" : request.platform_fee_status,
      paid_at: request.paid_at ?? getIsoFromUnixSeconds(eventData.payment.created_at) ?? new Date().toISOString(),
    };
  }

  if (eventType === "payment.failed" || paymentStatus === "failed") {
    if (request.payment_status !== "unpaid" && request.payment_status !== "checkout_started") {
      return null;
    }

    return {
      ...paymentFields,
      status: "checkout_failed",
      payment_status: "failed",
    };
  }

  if (eventType === "payment_link.cancelled" || eventType === "payment_link.expired" || ["cancelled", "expired"].includes(paymentLinkStatus)) {
    if (request.payment_status !== "unpaid" && request.payment_status !== "checkout_started") {
      return null;
    }

    return {
      ...paymentFields,
      status: eventType === "payment_link.expired" || paymentLinkStatus === "expired" ? "checkout_failed" : "cancelled",
      payment_status: eventType === "payment_link.expired" || paymentLinkStatus === "expired" ? "failed" : "cancelled",
      payout_status: "cancelled",
      platform_fee_status: "unearned",
    };
  }

  if (eventType.startsWith("refund.")) {
    return {
      ...paymentFields,
      status: "refunded",
      payment_status: "refunded",
      payout_status: "refunded",
      platform_fee_status: "refunded",
    };
  }

  if (eventType.startsWith("payment.dispute.") || eventType.startsWith("dispute.")) {
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

function sanitizeCheckoutAnalyticsContext(value) {
  return stripEmpty({
    ga_client_id: sanitizeAnalyticsString(value.ga_client_id, 80),
    ga_session_id: sanitizeAnalyticsString(value.ga_session_id, 80),
    page_path: sanitizePagePath(value.page_path),
    referrer_host: sanitizeAnalyticsString(value.referrer_host, 160),
    utm_source: sanitizeAnalyticsString(value.utm_source, 160),
    utm_medium: sanitizeAnalyticsString(value.utm_medium, 160),
    utm_campaign: sanitizeAnalyticsString(value.utm_campaign, 160),
    utm_content: sanitizeAnalyticsString(value.utm_content, 160),
    utm_term: sanitizeAnalyticsString(value.utm_term, 160),
    ...sanitizeAttributionAnalyticsContext(value),
  });
}

function getPaymentAnalyticsMetadata(analytics) {
  return stripEmpty({
    ga_client_id: analytics.ga_client_id,
    ga_session_id: analytics.ga_session_id,
    analytics_page_path: analytics.page_path,
    analytics_referrer_host: analytics.referrer_host,
    utm_source: analytics.utm_source,
    utm_medium: analytics.utm_medium,
    utm_campaign: analytics.utm_campaign,
    utm_content: analytics.utm_content,
    utm_term: analytics.utm_term,
    ...getAttributionAnalyticsMetadata(analytics),
  });
}

function getRazorpayPaymentNotes({ analytics, category, durationDays, itemName, requestId }) {
  return stripEmpty({
    request_id: sanitizeRazorpayNote(requestId),
    item_name: sanitizeRazorpayNote(itemName),
    category: sanitizeRazorpayNote(category),
    duration_days: sanitizeRazorpayNote(String(durationDays)),
    payment_provider: "razorpay",
    payment_environment: getRazorpayEnvironment(),
    source: "pleasefindmethis-post-paywall",
    ga_client_id: sanitizeRazorpayNote(analytics.ga_client_id),
    ga_session_id: sanitizeRazorpayNote(analytics.ga_session_id),
    utm_source: sanitizeRazorpayNote(analytics.utm_source),
    utm_medium: sanitizeRazorpayNote(analytics.utm_medium),
    utm_campaign: sanitizeRazorpayNote(analytics.utm_campaign),
    first_channel: sanitizeRazorpayNote(analytics.first_channel),
    latest_channel: sanitizeRazorpayNote(analytics.latest_channel),
    latest_source: sanitizeRazorpayNote(analytics.latest_source),
  });
}

function sanitizeRazorpayNote(value) {
  const sanitized = parseString(value, 256).replace(/[\r\n\t]/g, " ").trim();
  return sanitized || undefined;
}

function getAnalyticsContextFromPaymentMetadata(metadata) {
  return stripEmpty({
    ga_client_id: sanitizeAnalyticsString(metadata.ga_client_id, 80),
    ga_session_id: sanitizeAnalyticsString(metadata.ga_session_id, 80),
    page_path: sanitizePagePath(metadata.analytics_page_path),
    referrer_host: sanitizeAnalyticsString(metadata.analytics_referrer_host, 160),
    utm_source: sanitizeAnalyticsString(metadata.utm_source, 160),
    utm_medium: sanitizeAnalyticsString(metadata.utm_medium, 160),
    utm_campaign: sanitizeAnalyticsString(metadata.utm_campaign, 160),
    utm_content: sanitizeAnalyticsString(metadata.utm_content, 160),
    utm_term: sanitizeAnalyticsString(metadata.utm_term, 160),
    ...sanitizeAttributionAnalyticsContext(metadata),
  });
}

function getPaymentCountryContext(...payloads) {
  const customerCountry = payloads.map((payload) => findPaymentCountry(payload)).find(Boolean);

  if (!customerCountry) {
    return {};
  }

  return {
    customer_country: customerCountry,
    customer_country_source: "payment_billing_country",
  };
}

function findPaymentCountry(value) {
  if (!isRecord(value)) {
    return undefined;
  }

  const preferredPaths = [
    ["billing_country"],
    ["billingCountry"],
    ["customer_country"],
    ["customerCountry"],
    ["user_country"],
    ["userCountry"],
    ["tax_country"],
    ["taxCountry"],
    ["billing_address", "country"],
    ["billingAddress", "country"],
    ["customer", "country"],
    ["customer", "billing_country"],
    ["customer", "billingCountry"],
    ["customer", "billing_address", "country"],
    ["customer", "billingAddress", "country"],
    ["attributes", "user_country"],
    ["attributes", "billing_country"],
    ["attributes", "customer_country"],
    ["attributes", "tax_country"],
    ["data", "attributes", "user_country"],
    ["data", "attributes", "billing_country"],
    ["data", "attributes", "customer_country"],
  ];

  for (const pathParts of preferredPaths) {
    const country = sanitizeCountryCode(getNestedValue(value, pathParts));

    if (country) {
      return country;
    }
  }

  return findPaymentCountryByKey(value);
}

function getNestedValue(value, pathParts) {
  let current = value;

  for (const part of pathParts) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[part];
  }

  return current;
}

function findPaymentCountryByKey(value, depth = 0) {
  if (depth > 4 || !value || typeof value !== "object") {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const country = findPaymentCountryByKey(entry, depth + 1);

      if (country) {
        return country;
      }
    }

    return undefined;
  }

  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, "");
    const isCountryKey =
      normalizedKey.includes("billingcountry") ||
      normalizedKey.includes("customercountry") ||
      normalizedKey.includes("usercountry") ||
      normalizedKey.includes("taxcountry");

    if (isCountryKey) {
      const country = sanitizeCountryCode(entry);

      if (country) {
        return country;
      }
    }

    if (entry && typeof entry === "object") {
      const country = findPaymentCountryByKey(entry, depth + 1);

      if (country) {
        return country;
      }
    }
  }

  return undefined;
}

function sanitizeAttributionAnalyticsContext(value) {
  return Object.fromEntries(
    attributionAnalyticsKeys
      .map((key) => {
        const isPagePath = key.endsWith("_landing_page");
        const sanitized = isPagePath ? sanitizePagePath(value[key]) : sanitizeAnalyticsString(value[key], 160);
        return [key, sanitized];
      })
      .filter(([, entry]) => entry !== undefined && entry !== ""),
  );
}

function getAttributionAnalyticsMetadata(analytics) {
  return Object.fromEntries(
    attributionAnalyticsKeys
      .map((key) => [key, analytics[key]])
      .filter(([, entry]) => entry !== undefined && entry !== ""),
  );
}

async function sendPaidRequestAnalytics({ analytics, countryContext = {}, provider, providerEventId, request, transactionId }) {
  if (!ga4MeasurementId || !ga4ApiSecret) {
    return;
  }

  if (!analytics.ga_client_id) {
    console.info("Skipping GA4 paid request event because ga_client_id is missing", { requestId: request.id, provider });
    return;
  }

  const commonParams = stripEmpty({
    currency: "USD",
    value: Number(request.total_due),
    transaction_id: transactionId,
    request_id: request.id,
    category: sanitizeAnalyticsString(request.category, 80) || "General",
    reward: Number(request.reward),
    service_fee: Number(request.service_fee),
    protection_reserve: Number(request.protection_reserve),
    finder_payout: Number(request.finder_payout),
    total_due: Number(request.total_due),
    payment_provider: provider,
    provider_event_id: providerEventId,
    simple_event: "customer_paid_for_request",
    what_happened: "Customer paid for request",
    action_type: "payment",
    funnel_step: "paid_request",
    home_market_country: homeMarketCountry,
    customer_country: countryContext.customer_country,
    customer_country_source: countryContext.customer_country_source,
    is_outside_home_market: countryContext.customer_country ? String(countryContext.customer_country !== homeMarketCountry) : undefined,
    page_path: analytics.page_path,
    referrer_host: analytics.referrer_host,
    utm_source: analytics.utm_source,
    utm_medium: analytics.utm_medium,
    utm_campaign: analytics.utm_campaign,
    utm_content: analytics.utm_content,
    utm_term: analytics.utm_term,
    ...getAttributionAnalyticsMetadata(analytics),
    first_source: getReadableAnalyticsSource(analytics.first_source, analytics.first_utm_source, analytics.first_referrer_host),
    first_channel: getReadableAnalyticsChannel(analytics.first_channel, analytics.first_utm_source, analytics.first_referrer_host),
    latest_source: getReadableAnalyticsSource(analytics.latest_source, analytics.latest_utm_source, analytics.latest_referrer_host),
    latest_channel: getReadableAnalyticsChannel(analytics.latest_channel, analytics.latest_utm_source, analytics.latest_referrer_host),
    engagement_time_msec: 1,
    session_id: parseNumericString(analytics.ga_session_id),
  });

  await Promise.all([
    sendGa4MeasurementEvent({
      clientId: analytics.ga_client_id,
      name: "bounty_funded",
      params: commonParams,
    }),
    sendGa4MeasurementEvent({
      clientId: analytics.ga_client_id,
      name: "customer_paid_for_request",
      params: commonParams,
    }),
    sendGa4MeasurementEvent({
      clientId: analytics.ga_client_id,
      name: "purchase",
      params: {
        ...commonParams,
        affiliation: "pleasefindmethis.com",
        items: [
          {
            item_id: "funded_request",
            item_name: "Funded request",
            item_category: commonParams.category,
            price: Number(request.total_due),
            quantity: 1,
          },
        ],
      },
    }),
  ]);
}

function getReadableAnalyticsSource(readableSource, utmSource, referrerHost) {
  const source = sanitizeAnalyticsString(readableSource, 160) || sanitizeAnalyticsString(utmSource, 160) || sanitizeAnalyticsString(referrerHost, 160);
  return source || "direct";
}

function getReadableAnalyticsChannel(readableChannel, utmSource, referrerHost) {
  const providedChannel = sanitizeAnalyticsString(readableChannel, 160);

  if (providedChannel) {
    return providedChannel;
  }

  const combined = `${utmSource ?? ""} ${referrerHost ?? ""}`.toLowerCase();

  if (!combined.trim()) {
    return "Direct";
  }

  if (combined.includes("reddit")) {
    return "Reddit";
  }

  if (combined.includes("google")) {
    return "Google";
  }

  if (combined.includes("bing")) {
    return "Bing";
  }

  if (combined.includes("pinterest")) {
    return "Pinterest";
  }

  if (combined.includes("tiktok")) {
    return "TikTok";
  }

  if (combined.includes("instagram")) {
    return "Instagram";
  }

  if (combined.includes("facebook") || combined.includes("fb.")) {
    return "Facebook";
  }

  if (combined.includes("youtube") || combined.includes("youtu.be")) {
    return "YouTube";
  }

  if (combined.includes("twitter") || combined.includes("x.com") || combined.includes("t.co")) {
    return "X / Twitter";
  }

  if (combined.includes("linkedin")) {
    return "LinkedIn";
  }

  if (combined.includes("newsletter") || combined.includes("email")) {
    return "Email";
  }

  return titleCaseAnalyticsValue(utmSource || referrerHost || "Other");
}

function titleCaseAnalyticsValue(value) {
  const sanitized = sanitizeAnalyticsString(value, 160)?.replace(/^www\./i, "").replace(/\.[a-z]{2,}$/i, "") ?? "";
  const title = sanitized
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

  return title || "Other";
}

async function sendGa4MeasurementEvent({ clientId, name, params }) {
  const endpoint = parseBooleanEnv("GA4_MEASUREMENT_PROTOCOL_DEBUG", false)
    ? "https://www.google-analytics.com/debug/mp/collect"
    : "https://www.google-analytics.com/mp/collect";
  const url = `${endpoint}?measurement_id=${encodeURIComponent(ga4MeasurementId)}&api_secret=${encodeURIComponent(ga4ApiSecret)}`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          events: [
            {
              name,
              params,
            },
          ],
        }),
      },
      ga4MeasurementTimeoutMs,
    );

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      console.error("GA4 Measurement Protocol request failed", {
        event: name,
        status: response.status,
        response: responseText.slice(0, 500),
      });
    }
  } catch (error) {
    console.error("GA4 Measurement Protocol request failed", {
      event: name,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

function sanitizeAnalyticsString(value, maxLength) {
  const sanitized = parseString(value, maxLength).replace(/[\r\n\t]/g, " ").trim();
  return sanitized || undefined;
}

function sanitizeCountryCode(value) {
  const country = parseString(value, 40).toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : undefined;
}

function sanitizeWaitlistString(value, maxLength) {
  return parseString(firstHeader(value), maxLength).replace(/[\r\n\t]/g, " ").trim();
}

function sanitizePagePath(value) {
  const pathValue = sanitizeAnalyticsString(value, 200);

  if (!pathValue || !pathValue.startsWith("/")) {
    return undefined;
  }

  return pathValue.split("?")[0].slice(0, 200);
}

function parseNumericString(value) {
  const normalized = parseString(value, 80);
  return /^\d+$/.test(normalized) ? Number(normalized) : undefined;
}

function stripEmpty(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ""));
}

function renderWaitlistEmailHtml(notification) {
  const rows = [
    ["Email", notification.email],
    ["Access note", notification.accessNote],
    ["Intent", notification.intent],
    ["Source", notification.source],
    ["Page", notification.pagePath],
    ["Referrer", notification.referrer],
    ["Submitted", notification.submittedAt],
    ["User agent", notification.userAgent],
  ].filter(([, value]) => value);

  return `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f6f8f5;color:#111513;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d4d6d2;border-radius:8px;padding:24px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.2;">New waitlist signup</h1>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `<tr>
                <th style="width:128px;padding:10px 12px;border-top:1px solid #d4d6d2;text-align:left;color:#5d625f;font-size:13px;">${escapeHtml(label)}</th>
                <td style="padding:10px 12px;border-top:1px solid #d4d6d2;font-size:14px;">${escapeHtml(value)}</td>
              </tr>`,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  const analytics = sanitizeCheckoutAnalyticsContext(isRecord(body.analytics) ? body.analytics : {});
  const requestId = parseString(draft.requestId, 64);

  if (!requestId) {
    sendJson(res, 400, { error: "A saved request id is required before checkout." });
    return null;
  }

  if (!supabaseAdmin) {
    sendJson(res, 503, { error: "Checkout requires Supabase server configuration before payments can be created." });
    return null;
  }

  const token = getBearerToken(req);

  if (!token) {
    sendJson(res, 401, { error: "Sign in again before starting checkout." });
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    sendJson(res, 401, { error: "Your session could not be verified for checkout." });
    return null;
  }

  const { data: savedRequest, error: requestError } = await supabaseAdmin
    .from("requests")
    .select("id,user_id,item_name,category,details,reward,service_fee,protection_reserve,total_due,duration_days,status,payment_status,payment_provider,customer_email,customer_name,checkout_session_id,checkout_url")
    .eq("id", requestId)
    .single();

  if (requestError || !savedRequest) {
    sendJson(res, 404, { error: "The saved request could not be found for checkout." });
    return null;
  }

  if (savedRequest.user_id !== user.id) {
    sendJson(res, 403, { error: "You can only start checkout for your own request." });
    return null;
  }

  if (
    savedRequest.status !== "checkout_pending" ||
    savedRequest.payment_status !== "unpaid" ||
    savedRequest.payment_provider !== "pending" ||
    savedRequest.checkout_session_id ||
    savedRequest.checkout_url
  ) {
    sendJson(res, 409, { error: "This request is not ready for a new checkout session." });
    return null;
  }

  const email = parseString(savedRequest.customer_email, 160) || parseString(customer.email, 160);
  const name = parseString(savedRequest.customer_name, 100) || parseString(customer.name, 100);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(res, 400, { error: "A valid customer email is required before checkout." });
    return null;
  }

  const reward = parseReward(savedRequest.reward);
  const breakdown = getEscrowBreakdown(reward);

  if (
    savedRequest.service_fee !== breakdown.platformFee ||
    savedRequest.protection_reserve !== breakdown.protection ||
    savedRequest.total_due !== breakdown.total
  ) {
    sendJson(res, 409, { error: "The saved request total does not match the current fee model. Please recreate the request." });
    return null;
  }

  return {
    breakdown,
    category: parseString(savedRequest.category, 80) || "General",
    details: parseString(savedRequest.details, 500) || "No additional details provided.",
    durationDays: parseDuration(savedRequest.duration_days),
    email,
    itemName: parseString(savedRequest.item_name, 120) || "Hard-to-find item",
    name,
    requestId,
    reward,
    analytics,
  };
}

function getBearerToken(req) {
  const authorization = firstHeader(req.headers.authorization);

  if (!authorization) {
    return "";
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function getPaymentProvider() {
  const configuredProvider = parseString(process.env.PAYMENT_PROVIDER, 40).toLowerCase();

  if (configuredProvider === "lemonsqueezy" || configuredProvider === "lemon_squeezy" || configuredProvider === "lemon-squeezy") {
    return "lemonsqueezy";
  }

  if (configuredProvider === "dodo" || configuredProvider === "dodopayments" || configuredProvider === "dodo_payments") {
    return "dodo";
  }

  if (configuredProvider === "whop") {
    return "whop";
  }

  if (configuredProvider === "razorpay" || configuredProvider === "razor_pay") {
    return "razorpay";
  }

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    return "razorpay";
  }

  if (process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID && process.env.LEMONSQUEEZY_VARIANT_ID) {
    return "lemonsqueezy";
  }

  return "lemonsqueezy";
}

function getAllowedPaymentMethodTypes() {
  return ["credit", "debit", "apple_pay", "google_pay", "paypal"];
}

function isConfiguredPaymentProviderLive() {
  const provider = getPaymentProvider();

  if (provider === "lemonsqueezy") {
    return !parseBooleanEnv("LEMONSQUEEZY_TEST_MODE", false);
  }

  if (provider === "whop") {
    return isWhopLiveMode();
  }

  if (provider === "razorpay") {
    return isRazorpayLiveMode();
  }

  return isDodoLiveMode();
}

function getDodoApiBase() {
  return isDodoLiveMode() ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

function getDodoEnvironment() {
  return normalizePaymentEnvironment(process.env.DODO_PAYMENTS_ENVIRONMENT ?? process.env.DODO_ENVIRONMENT ?? "test");
}

function isDodoLiveMode() {
  return getDodoEnvironment() === "live";
}

function isDodoMarketplaceCheckoutAllowed() {
  return parseBooleanEnv("DODO_MARKETPLACE_CHECKOUT_ENABLED", false);
}

function getWhopEnvironment() {
  const normalized = parseString(process.env.WHOP_ENVIRONMENT ?? process.env.WHOP_MODE ?? "sandbox", 40).toLowerCase();
  return ["live", "production", "prod"].includes(normalized) ? "live" : "sandbox";
}

function isWhopLiveMode() {
  return getWhopEnvironment() === "live";
}

function isWhopSandboxOnProductionAllowed() {
  return parseBooleanEnv("WHOP_ALLOW_SANDBOX_ON_PRODUCTION", false);
}

function getWhopApiBase() {
  return isWhopLiveMode() ? "https://api.whop.com/api/v1" : "https://sandbox-api.whop.com/api/v1";
}

function getRazorpayApiBase() {
  return "https://api.razorpay.com/v1";
}

function getRazorpayEnvironment() {
  const normalized = parseString(process.env.RAZORPAY_ENVIRONMENT ?? process.env.RAZORPAY_MODE ?? "", 40).toLowerCase();

  if (["live", "production", "prod"].includes(normalized)) {
    return "live";
  }

  if (["test", "sandbox"].includes(normalized)) {
    return "test";
  }

  return parseString(process.env.RAZORPAY_KEY_ID, 80).startsWith("rzp_live_") ? "live" : "test";
}

function isRazorpayLiveMode() {
  return getRazorpayEnvironment() === "live";
}

function getRazorpayAuthorizationHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function getRazorpayPaymentLinkExpiry() {
  const minutes = Number(process.env.RAZORPAY_PAYMENT_LINK_EXPIRE_MINUTES ?? 60);
  const safeMinutes = Number.isFinite(minutes) ? Math.min(Math.max(minutes, 10), 60 * 24 * 30) : 60;
  return Math.floor(Date.now() / 1000) + safeMinutes * 60;
}

function getWhopFrontendBase() {
  return isWhopLiveMode() ? "https://whop.com" : "https://sandbox.whop.com";
}

function normalizeWhopPurchaseUrl(value) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, getWhopFrontendBase()).toString();
  } catch {
    return "";
  }
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

function verifyRazorpaySignature(rawBody, signature, webhookSecret) {
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

function normalizeAppUrl(value) {
  const url = parseString(value, 300).replace(/\/+$/, "");

  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      return "";
    }

    return parsed.origin;
  } catch {
    return "";
  }
}

function normalizeDeploymentAppUrl(value) {
  const deploymentUrl = parseString(value, 300);

  if (!deploymentUrl) {
    return "";
  }

  return normalizeAppUrl(/^https?:\/\//i.test(deploymentUrl) ? deploymentUrl : `https://${deploymentUrl}`);
}

function getCanonicalRedirectUrl(req, requestUrl) {
  if (!["GET", "HEAD"].includes(req.method ?? "GET")) {
    return "";
  }

  const canonicalHostRedirectUrl = getCanonicalHostRedirectUrl(req, requestUrl);
  if (canonicalHostRedirectUrl) {
    return canonicalHostRedirectUrl;
  }

  if (shouldRedirectStaticDirectoryToTrailingSlash(requestUrl.pathname)) {
    const redirectedUrl = new URL(requestUrl);
    redirectedUrl.pathname = `${requestUrl.pathname}/`;
    return redirectedUrl.toString();
  }

  return "";
}

function getCanonicalHostRedirectUrl(req, requestUrl) {
  if (!isProduction || !publicAppUrl) {
    return "";
  }

  try {
    const canonicalUrl = new URL(publicAppUrl);
    const incomingHostname = getIncomingHostname(req) || requestUrl.hostname;
    if (incomingHostname === canonicalUrl.hostname) {
      return "";
    }

    return `${canonicalUrl.origin}${requestUrl.pathname}${requestUrl.search}`;
  } catch {
    return "";
  }
}

function shouldRedirectStaticDirectoryToTrailingSlash(pathname) {
  return pathname === "/guides" || pathname === "/requests" || /^\/guides\/[^/]+$/.test(pathname) || /^\/requests\/[^/]+$/.test(pathname);
}

function getIncomingHostname(req) {
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const requestHost = forwardedHost || firstHeader(req.headers.host);

  if (!requestHost) {
    return "";
  }

  return requestHost.split(":")[0].toLowerCase();
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

function getWhopEventType(event) {
  if (!isRecord(event)) {
    return "unknown";
  }

  return parseString(event.type, 100) || "unknown";
}

function getWhopEventData(event) {
  if (!isRecord(event)) {
    return {};
  }

  return isRecord(event.data) ? event.data : {};
}

function getRazorpayEventType(event) {
  if (!isRecord(event)) {
    return "unknown";
  }

  return parseString(event.event, 100) || "unknown";
}

function getRazorpayEventData(event) {
  if (!isRecord(event) || !isRecord(event.payload)) {
    return {
      order: {},
      payment: {},
      paymentLink: {},
    };
  }

  const orderContainer = isRecord(event.payload.order) ? event.payload.order : {};
  const paymentContainer = isRecord(event.payload.payment) ? event.payload.payment : {};
  const paymentLinkContainer = isRecord(event.payload.payment_link) ? event.payload.payment_link : {};

  return {
    order: isRecord(orderContainer.entity) ? orderContainer.entity : {},
    payment: isRecord(paymentContainer.entity) ? paymentContainer.entity : {},
    paymentLink: isRecord(paymentLinkContainer.entity) ? paymentLinkContainer.entity : {},
  };
}

function getRazorpayEventNotes(eventData) {
  const paymentLinkNotes = isRecord(eventData.paymentLink.notes) ? eventData.paymentLink.notes : {};
  const paymentNotes = isRecord(eventData.payment.notes) ? eventData.payment.notes : {};
  return {
    ...paymentLinkNotes,
    ...paymentNotes,
  };
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
  const served = await tryServeStaticAsset(distRoot, pathname, res);

  if (served) {
    return;
  }

  if (path.extname(pathname)) {
    sendText(res, 404, "Not found");
    return;
  }

  const indexFile = await fs.readFile(path.join(distRoot, "index.html"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(indexFile);
}

function shouldServePublicStaticPath(pathname) {
  return pathname === "/pseo.css" || pathname.startsWith("/guides/") || pathname.startsWith("/requests/") || pathname.startsWith("/sitemaps/");
}

function isBlockedPublicPath(pathname) {
  return (
    pathname === "/llms.txt" ||
    pathname === "/common-questions.md" ||
    pathname === "/pricing.md" ||
    pathname === "/fees.md" ||
    pathname === "/workflow.md" ||
    pathname === "/use-cases.md" ||
    pathname === "/sitemaps/pseo.xml" ||
    pathname.startsWith("/okf/") ||
    pathname === "/okf"
  );
}

async function tryServeStaticAsset(assetRoot, pathname, res) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const requestedPath = path.resolve(assetRoot, `.${decodeURIComponent(normalizedPath)}`);

  if (!isPathInside(assetRoot, requestedPath)) {
    sendText(res, 403, "Forbidden");
    return true;
  }

  try {
    const stat = await fs.stat(requestedPath);
    const filePath = stat.isDirectory() ? path.join(requestedPath, "index.html") : requestedPath;
    const file = await fs.readFile(filePath);
    res.writeHead(200, { "Content-Type": getContentType(filePath) });
    res.end(file);
    return true;
  } catch {
    return false;
  }
}

function isPathInside(parentPath, childPath) {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function getRequestOrigin(req) {
  if (publicAppUrl) {
    return publicAppUrl;
  }

  const forwardedProto = firstHeader(req.headers["x-forwarded-proto"]);
  const forwardedHost = firstHeader(req.headers["x-forwarded-host"]);
  const protocol = forwardedProto || (req.socket.encrypted ? "https" : "http");
  const requestHost = forwardedHost || req.headers.host || `${host}:${port}`;
  return `${protocol}://${requestHost}`;
}

function getCheckoutRedirectOrigin(req) {
  if (publicAppUrl) {
    return publicAppUrl;
  }

  if (isProduction) {
    return deploymentPublicAppUrl;
  }

  return getRequestOrigin(req);
}

function ensureCheckoutRedirectOrigin(req, res) {
  const origin = getCheckoutRedirectOrigin(req);

  if (origin) {
    return origin;
  }

  sendJson(res, 503, { error: "Checkout is unavailable until the public app URL is configured." });
  return "";
}

function firstHeader(value) {
  return Array.isArray(value) ? value[0] : typeof value === "string" ? value.split(",")[0].trim() : "";
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function redirect(res, location, statusCode = 302) {
  res.writeHead(statusCode, { Location: location });
  res.end();
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
    case ".md":
      return "text/markdown; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".xml":
      return "application/xml; charset=utf-8";
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

export const __securityTest = {
  getCheckoutRedirectOrigin,
  getPaymentProvider,
  normalizeDeploymentAppUrl,
  verifyRazorpaySignature,
};
