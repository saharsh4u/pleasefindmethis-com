import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer, loadEnv } from "vite";
import { Webhook } from "standardwebhooks";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const mode = process.env.NODE_ENV === "production" ? "production" : "development";
const env = loadEnv(mode, root, "");

for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

const isProduction = mode === "production";
const host = process.env.HOST ?? "127.0.0.1";
let port = Number(process.env.PORT ?? 5173);
const distRoot = path.resolve(root, "dist");

const vite = isProduction
  ? null
  : await createViteServer({
      root,
      appType: "spa",
      server: {
        host,
        middlewareMode: true,
      },
    });

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", getRequestOrigin(req));

    if (requestUrl.pathname === "/api/dodo/checkout") {
      await handleCreateDodoCheckout(req, res);
      return;
    }

    if (requestUrl.pathname === "/api/dodo/webhook") {
      await handleDodoWebhook(req, res);
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
});

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

function listen() {
  server.listen(port, host);
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
      error: "Dodo Payments is not configured. Create an API key and pay-what-you-want product in your own Dodo dashboard, then set DODO_PAYMENTS_API_KEY and DODO_PRODUCT_ID.",
    });
    return;
  }

  let body;

  try {
    body = await readJson(req);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Request body must be valid JSON." });
    return;
  }

  const draft = isRecord(body.draft) ? body.draft : {};
  const customer = isRecord(body.customer) ? body.customer : {};
  const email = parseString(customer.email, 160);
  const name = parseString(customer.name, 100);
  const itemName = parseString(draft.itemName, 120) || "Hard-to-find item";
  const category = parseString(draft.category, 80) || "General";
  const details = parseString(draft.details, 500);
  const durationDays = parseDuration(draft.durationDays);
  let reward;

  try {
    reward = parseReward(draft.reward);
  } catch (error) {
    sendJson(res, 400, { error: error instanceof Error ? error.message : "Invalid reward amount." });
    return;
  }

  const breakdown = getEscrowBreakdown(reward);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(res, 400, { error: "A valid customer email is required before checkout." });
    return;
  }

  const origin = getRequestOrigin(req);
  const checkoutPayload = {
    product_cart: [
      {
        product_id: productId,
        quantity: 1,
        amount: breakdown.total * 100,
      },
    ],
    customer: {
      email,
      ...(name ? { name } : {}),
    },
    metadata: {
      item_name: itemName,
      category,
      details,
      reward_usd: String(breakdown.reward),
      marketplace_fee_usd: String(breakdown.platformFee),
      protection_reserve_usd: String(breakdown.protection),
      total_usd: String(breakdown.total),
      duration_days: String(durationDays),
      source: "pleasefindmethis-post-paywall",
    },
    return_url: `${origin}/#/poster-dashboard?checkout=success`,
    cancel_url: `${origin}/#/post/pay?checkout=cancelled`,
  };

  const dodoResponse = await fetch(`${getDodoApiBase()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(checkoutPayload),
  });

  const responseText = await dodoResponse.text();
  const dodoPayload = parseJson(responseText);

  if (!dodoResponse.ok) {
    console.error("Dodo checkout creation failed", dodoResponse.status, dodoPayload ?? responseText);
    sendJson(res, 502, {
      error: "Dodo rejected the checkout request. Check that the API key and product id come from your Dodo account and the product supports custom amounts.",
    });
    return;
  }

  if (!isRecord(dodoPayload) || typeof dodoPayload.checkout_url !== "string") {
    console.error("Dodo checkout response did not include checkout_url", dodoPayload);
    sendJson(res, 502, { error: "Dodo did not return a checkout URL." });
    return;
  }

  sendJson(res, 200, {
    checkoutUrl: dodoPayload.checkout_url,
    sessionId: typeof dodoPayload.session_id === "string" ? dodoPayload.session_id : null,
    total: breakdown.total,
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

    const eventType = isRecord(event) && typeof event.type === "string" ? event.type : "unknown";
    const eventData = isRecord(event) && isRecord(event.data) ? event.data : {};
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

function getEscrowBreakdown(reward) {
  const normalizedReward = Math.round(reward);
  const platformFee = Math.max(12, Math.round(normalizedReward * 0.08));
  const protection = Math.round(normalizedReward * 0.03);

  return {
    reward: normalizedReward,
    platformFee,
    protection,
    total: normalizedReward + platformFee + protection,
  };
}

function getDodoApiBase() {
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT ?? process.env.DODO_ENVIRONMENT ?? "test";
  return environment === "live" || environment === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

function parseReward(value) {
  const reward = Number(value);

  if (!Number.isFinite(reward)) {
    throw new Error("Reward must be a number.");
  }

  const rounded = Math.round(reward);

  if (rounded < 25 || rounded > 10000) {
    throw new Error("Reward must be between US$25 and US$10,000.");
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
