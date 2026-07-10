import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { trackAICrawlerRequest } from "@datafast/ai-crawl";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;
const mode = process.env.NODE_ENV === "production" ? "production" : "development";

const isProduction = mode === "production";
const publicAppUrl = normalizeAppUrl(process.env.PUBLIC_APP_URL ?? process.env.VITE_PUBLIC_APP_URL ?? "");
const deploymentPublicAppUrl = normalizeDeploymentAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "");
const host = process.env.HOST ?? "127.0.0.1";
let port = Number(process.env.PORT ?? 5173);
const distRoot = path.resolve(root, "dist");
const publicRoot = path.resolve(root, "public");
const supabaseAdmin = createSupabaseAdminClient();
const dataFastBotWebsiteId = parseString(
  process.env.DATAFAST_WEBSITE_ID || process.env.VITE_DATAFAST_WEBSITE_ID,
  64,
) || "dfid_oKAGjqAhs9HTD5Ic9yvxt";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const requestCommentMaxLength = 700;
const requestFingerprintSecret = parseString(
  process.env.REQUEST_FINGERPRINT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY,
  500,
);
const vite = isProduction ? null : await createDevViteServer();

class RequestCommentApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "RequestCommentApiError";
    this.statusCode = statusCode;
  }
}

export async function handleRequest(req, res) {
  try {
    const requestUrl = new URL(req.url ?? "/", getRequestOrigin(req));
    trackAICrawlerRequestIfNeeded(req, requestUrl);

    const canonicalRedirectUrl = getCanonicalRedirectUrl(req, requestUrl);
    if (canonicalRedirectUrl) {
      redirect(res, canonicalRedirectUrl, 308);
      return;
    }

    if (isBlockedPublicPath(requestUrl.pathname)) {
      sendText(res, 404, "Not found");
      return;
    }

    if (requestUrl.pathname === "/api/requests/public") {
      if (requestUrl.searchParams.get("render") === "request_page") {
        await handlePublicRequestDocument(req, res, requestUrl.searchParams.get("request_id"));
      } else if (requestUrl.searchParams.get("resource") === "comments") {
        await handlePublicRequestComments(req, res, requestUrl.searchParams.get("request_id"));
      } else {
        await handlePublicRequests(req, res, requestUrl);
      }
      return;
    }

    const publicRequestDocumentMatch = requestUrl.pathname.match(/^\/requests\/([^/]+)\/[^/]+\/?$/);
    if (publicRequestDocumentMatch && ["GET", "HEAD"].includes(req.method ?? "GET")) {
      await handlePublicRequestDocument(req, res, decodeURIComponent(publicRequestDocumentMatch[1]));
      return;
    }

    const publicRequestCommentsMatch = requestUrl.pathname.match(/^\/api\/requests\/([^/]+)\/comments$/);
    if (publicRequestCommentsMatch) {
      await handlePublicRequestComments(req, res, decodeURIComponent(publicRequestCommentsMatch[1]));
      return;
    }

    if (requestUrl.pathname === "/api/health") {
      await handleHealthCheck(req, res);
      return;
    }

    if (requestUrl.pathname.startsWith("/api/")) {
      sendText(res, 404, "Not found");
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

function trackAICrawlerRequestIfNeeded(req, requestUrl) {
  if (!dataFastBotWebsiteId) {
    return;
  }

  const method = (req.method ?? "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    return;
  }

  try {
    trackAICrawlerRequest(
      new Request(requestUrl.toString(), {
        method,
        headers: req.headers,
      }),
      undefined,
      {
        websiteId: dataFastBotWebsiteId,
      },
    );
  } catch (error) {
    if (!isProduction) {
      console.warn("[DataFast] Failed to enqueue AI crawler tracking.", error);
    }
  }
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

async function handlePublicRequests(req, res, requestUrl) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const requestId = parseString(requestUrl.searchParams.get("request_id"), 80);

  if (requestUrl.searchParams.has("request_id") && !isUuid(requestId)) {
    sendJson(res, 400, { error: "A valid request id is required." });
    return;
  }

  if (!supabaseAdmin) {
    sendJson(res, 503, { error: "Public request feed is unavailable." });
    return;
  }

  let publicRequestsQuery = supabaseAdmin
    .from("public_request_cards")
    .select("id,item_name,category,details,duration_days,status,created_at,closes_at,days_remaining,primary_image_url,submission_count");

  publicRequestsQuery = requestId
    ? publicRequestsQuery.eq("id", requestId).limit(1)
    : publicRequestsQuery.order("created_at", { ascending: false }).limit(24);

  const { data, error } = await publicRequestsQuery;

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
    const fallback = await loadPublicRequestsFallback(requestId);
    sendJson(res, 200, { requests: fallback });
  } catch (fallbackError) {
    console.error("Could not load fallback public request feed", fallbackError);
    sendJson(res, 503, { error: "Public request feed is unavailable." });
  }
}

async function handlePublicRequestDocument(req, res, rawRequestId) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const requestId = parseString(rawRequestId, 80);
  const template = await loadPublicRequestDocumentTemplate(req);
  let html = template;

  if (isUuid(requestId) && supabaseAdmin) {
    try {
      const requestCard = await loadExactPublicRequestCard(requestId);
      if (requestCard) {
        html = injectPublicRequestDocumentMetadata(template, requestCard, req);
      }
    } catch (error) {
      console.error("Could not render request-specific social metadata", error);
    }
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    "X-Robots-Tag": "index, follow",
  });
  res.end(req.method === "HEAD" ? "" : html);
}

async function loadExactPublicRequestCard(requestId) {
  const { data, error } = await supabaseAdmin
    .from("public_request_cards")
    .select("id,item_name,category,details,duration_days,status,created_at,closes_at,days_remaining,primary_image_url,submission_count")
    .eq("id", requestId)
    .limit(1);

  if (!error) {
    return data?.[0] ?? null;
  }

  if (isMissingPublicFeedError(error)) {
    const fallback = await loadPublicRequestsFallback(requestId);
    return fallback[0] ?? null;
  }

  throw error;
}

async function loadPublicRequestDocumentTemplate(req) {
  const candidatePaths = isProduction
    ? [path.join(distRoot, "index.html")]
    : [path.join(root, "index.html")];

  for (const candidatePath of candidatePaths) {
    try {
      const html = await fs.readFile(candidatePath, "utf8");
      if (html.includes("</head>")) {
        return html;
      }
    } catch {
      // Vercel functions intentionally exclude static build output, so the public index is fetched below.
    }
  }

  const templateOrigin = publicAppUrl || deploymentPublicAppUrl || getRequestOrigin(req);
  if (templateOrigin) {
    try {
      const response = await fetchWithTimeout(`${templateOrigin}/index.html`, {
        headers: { Accept: "text/html" },
      }, 5000);
      if (response.ok) {
        const html = await response.text();
        if (html.includes("</head>")) {
          return html;
        }
      }
    } catch (error) {
      console.error("Could not load the public app document template", error);
    }
  }

  return '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>pleasefindmethis.com</title></head><body><p>Loading this public request…</p><script>fetch("/index.html").then(function(r){return r.text()}).then(function(h){document.open();document.write(h);document.close()})</script></body></html>';
}

function injectPublicRequestDocumentMetadata(template, requestCard, req) {
  const itemName = parseString(requestCard.item_name, 120) || "Help find this exact item";
  const subject = getPublicRequestShareSubject(itemName);
  const detailText = parseString(requestCard.details, 1000).replace(/\s+/g, " ");
  const description = truncateMetaText(
    `Do you recognize ${subject}? ${detailText || "Someone is searching for this exact item."} Log in to leave a clue.`,
    180,
  );
  const title = truncateMetaText(`${itemName} | pleasefindmethis`, 65);
  const origin = publicAppUrl || deploymentPublicAppUrl || getRequestOrigin(req);
  const slug = slugifyPublicRequestItem(itemName);
  const canonicalUrl = new URL(`/requests/${requestCard.id}${slug ? `/${slug}` : ""}`, origin).toString();
  const imageUrl = normalizePublicRequestImageUrl(requestCard.primary_image_url, origin);
  const imageAlt = truncateMetaText(`${itemName} reference photo`, 160);

  let html = template;
  html = replaceDocumentTitle(html, title);
  html = replaceMetaContent(html, "name", "description", description);
  html = replaceMetaContent(html, "property", "og:type", "website");
  html = replaceMetaContent(html, "property", "og:title", title);
  html = replaceMetaContent(html, "property", "og:description", description);
  html = replaceMetaContent(html, "property", "og:url", canonicalUrl);
  html = replaceMetaContent(html, "property", "og:image", imageUrl);
  html = replaceMetaContent(html, "property", "og:image:secure_url", imageUrl);
  const imageMimeType = getPublicRequestImageMimeType(imageUrl);
  html = imageMimeType
    ? replaceMetaContent(html, "property", "og:image:type", imageMimeType)
    : removeMetaTag(html, "property", "og:image:type");
  html = removeMetaTag(html, "property", "og:image:width");
  html = removeMetaTag(html, "property", "og:image:height");
  html = replaceMetaContent(html, "property", "og:image:alt", imageAlt);
  html = replaceMetaContent(html, "name", "twitter:title", title);
  html = replaceMetaContent(html, "name", "twitter:description", description);
  html = replaceMetaContent(html, "name", "twitter:image", imageUrl);
  html = replaceMetaContent(html, "name", "twitter:image:alt", imageAlt);
  html = replaceCanonicalLink(html, canonicalUrl);
  html = replaceRequestJsonLd(html, {
    canonicalUrl,
    description,
    imageAlt,
    imageUrl,
    itemName,
    origin,
  });
  return html;
}

function getPublicRequestShareSubject(itemName) {
  return itemName
    .replace(/^help\s+me\s+find\s+/i, "")
    .replace(/^find\s+/i, "")
    .replace(/^does\s+anyone\s+know\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim() || "this exact item";
}

function slugifyPublicRequestItem(value) {
  return parseString(value, 160)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function normalizePublicRequestImageUrl(value, origin) {
  try {
    const imageUrl = new URL(parseString(value, 1000) || "/og/pleasefindmethis-request-board.png", origin);
    return imageUrl.protocol === "http:" || imageUrl.protocol === "https:"
      ? imageUrl.toString()
      : new URL("/og/pleasefindmethis-request-board.png", origin).toString();
  } catch {
    return new URL("/og/pleasefindmethis-request-board.png", origin).toString();
  }
}

function getPublicRequestImageMimeType(value) {
  try {
    const pathname = new URL(value).pathname.toLowerCase();
    if (pathname.endsWith(".png")) return "image/png";
    if (pathname.endsWith(".webp")) return "image/webp";
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  } catch {
    // Unknown image types work without an explicit Open Graph MIME tag.
  }
  return "";
}

function truncateMetaText(value, maxLength) {
  const normalized = String(value).replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`;
}

function replaceDocumentTitle(html, value) {
  const tag = `<title>${escapeHtmlText(value)}</title>`;
  return /<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function replaceMetaContent(html, attribute, name, value) {
  const selector = new RegExp(`<meta\\b[^>]*\\b${escapeRegExp(attribute)}=["']${escapeRegExp(name)}["'][^>]*>`, "i");
  const tag = `<meta ${attribute}="${escapeHtmlAttribute(name)}" content="${escapeHtmlAttribute(value)}" />`;
  return selector.test(html) ? html.replace(selector, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function removeMetaTag(html, attribute, name) {
  const selector = new RegExp(`\\s*<meta\\b[^>]*\\b${escapeRegExp(attribute)}=["']${escapeRegExp(name)}["'][^>]*>`, "i");
  return html.replace(selector, "");
}

function replaceCanonicalLink(html, value) {
  const selector = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeHtmlAttribute(value)}" />`;
  return selector.test(html) ? html.replace(selector, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function replaceRequestJsonLd(html, { canonicalUrl, description, imageAlt, imageUrl, itemName, origin }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: itemName,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "pleasefindmethis.com",
      url: origin,
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      contentUrl: imageUrl,
      caption: imageAlt,
    },
    potentialAction: {
      "@type": "CommentAction",
      target: canonicalUrl,
    },
  };
  const serialized = JSON.stringify(schema).replace(/</g, "\\u003c");
  const tag = `<script type="application/ld+json" data-seo-schema="request">${serialized}</script>`;
  const selector = /<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i;
  return selector.test(html) ? html.replace(selector, tag) : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function escapeHtmlText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value) {
  return escapeHtmlText(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function loadPublicRequestsFallback(requestId = "") {
  let requestsQuery = supabaseAdmin
    .from("requests")
    .select("id,item_name,category,details,duration_days,status,reference_images,created_at")
    .eq("status", "open");

  requestsQuery = requestId
    ? requestsQuery.eq("id", requestId).limit(1)
    : requestsQuery.order("created_at", { ascending: false }).limit(48);

  const { data: requestRows, error: requestError } = await requestsQuery;

  if (requestError) {
    console.error("Could not load fallback public request rows", requestError);
    throw new Error("Public request feed is unavailable.");
  }

  const requests = (requestRows ?? [])
    .filter((request) => {
      const createdAt = Date.parse(parseString(request.created_at, 80));
      const closesAt = createdAt + parseDuration(request.duration_days) * 24 * 60 * 60 * 1000;
      return Number.isFinite(createdAt) && closesAt > Date.now();
    })
    .slice(0, 24);
  const requestIds = requests.map((request) => request.id).filter(Boolean);
  const clueCounts = await loadClueCounts(requestIds);

  return requests.map((request) => {
    const createdAt = parseString(request.created_at, 80);
    const durationDays = parseDuration(request.duration_days);
    const closesAt = createdAt ? new Date(new Date(createdAt).getTime() + durationDays * 24 * 60 * 60 * 1000) : null;
    const daysRemaining = closesAt ? Math.max(0, Math.ceil((closesAt.getTime() - Date.now()) / 86400000)) : null;
    const referenceImages = Array.isArray(request.reference_images) ? request.reference_images : [];
    const firstImage = referenceImages.find(isRecord);
    const primaryImageUrl = parseString(firstImage?.url, 1000) || "/og/pleasefindmethis-request-board.png";

    return {
      id: request.id,
      item_name: parseString(request.item_name, 120),
      category: parseString(request.category, 80),
      details: parseString(request.details, 500),
      duration_days: durationDays,
      status: request.status,
      created_at: createdAt,
      closes_at: closesAt ? closesAt.toISOString() : null,
      days_remaining: daysRemaining,
      primary_image_url: primaryImageUrl,
      submission_count: clueCounts.get(request.id) ?? 0,
    };
  });
}

async function loadClueCounts(requestIds) {
  const counts = new Map();

  if (!requestIds.length) {
    return counts;
  }

  const { data, error } = await supabaseAdmin
    .from("request_comments")
    .select("request_id")
    .in("request_id", requestIds)
    .eq("status", "visible");

  if (error) {
    console.error("Could not load public clue counts", error);
    return counts;
  }

  for (const row of data ?? []) {
    counts.set(row.request_id, (counts.get(row.request_id) ?? 0) + 1);
  }

  return counts;
}

async function handlePublicRequestComments(req, res, rawRequestId) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const requestId = parseString(rawRequestId, 80);

  if (!isUuid(requestId)) {
    sendJson(res, 400, { error: "A valid request id is required." });
    return;
  }

  if (!supabaseAdmin) {
    sendJson(res, 503, { error: "Request comments are unavailable." });
    return;
  }

  try {
    if (req.method === "POST") {
      await requireAuthenticatedCommentUser(req);
    }

    const publicRequest = await loadPublicRequestForComments(requestId);

    if (!publicRequest) {
      sendJson(res, 404, { error: "This request is not open for public comments." });
      return;
    }

    if (req.method === "GET") {
      const comments = await loadPublicRequestComments(requestId);
      sendJson(res, 200, { comments });
      return;
    }

    let body;

    try {
      body = await readJson(req);
    } catch {
      throw new RequestCommentApiError("Request body must be valid JSON.", 400);
    }

    const comment = await createPublicRequestComment(req, requestId, body);
    sendJson(res, 201, { comment });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;

    if (statusCode >= 500) {
      console.error("Public request comments failed", error);
    }

    sendJson(res, statusCode, {
      error: error instanceof Error ? error.message : "Request comments are unavailable.",
    });
  }
}

async function requireAuthenticatedCommentUser(req) {
  const authorization = parseString(req?.headers?.authorization, 4096);
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";

  if (!token) {
    throw new RequestCommentApiError("Log in to post a comment.", 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user || data.user.is_anonymous) {
    throw new RequestCommentApiError("Log in to post a comment.", 401);
  }

  return data.user;
}

async function loadPublicRequestForComments(requestId) {
  const { data, error } = await supabaseAdmin
    .from("requests")
    .select("id,status,duration_days,created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    console.error("Could not verify public request for comments", error);
    throw new RequestCommentApiError("Request comments are unavailable.", 503);
  }

  if (!data) {
    return null;
  }

  const createdAt = Date.parse(parseString(data.created_at, 80));
  const closesAt = createdAt + parseDuration(data.duration_days) * 24 * 60 * 60 * 1000;
  return data.status === "open" && Number.isFinite(createdAt) && closesAt > Date.now() ? data : null;
}

async function loadPublicRequestComments(requestId) {
  const { data, error } = await supabaseAdmin
    .from("request_comments")
    .select("id,request_id,body,source_url,helper_alias,helper_avatar_tone,created_at")
    .eq("request_id", requestId)
    .eq("status", "visible")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("Could not load public request comments", error);
    throw new RequestCommentApiError("Request comments are not ready yet.", 503);
  }

  return (data ?? []).map(toPublicRequestComment);
}

async function createPublicRequestComment(req, requestId, body) {
  const commentBody = sanitizePublicCommentBody(body.body);
  const sourceUrl = normalizePublicCommentSourceUrl(body.sourceUrl ?? body.source_url);

  if (commentBody.length < 2) {
    throw new RequestCommentApiError("Add a short comment before posting.", 400);
  }

  if ((body.sourceUrl || body.source_url) && !sourceUrl) {
    throw new RequestCommentApiError("Add a valid http or https source link.", 400);
  }

  const requestFingerprintHash = getPublicRequestCommentFingerprint(req, requestId);

  if (!requestFingerprintHash) {
    throw new RequestCommentApiError("Could not post this comment.", 503);
  }

  const identity = getPublicRequestCommentIdentity(
    body.visitorSeed ?? body.visitor_seed,
    requestFingerprintHash,
    requestId,
  );
  const { data, error } = await supabaseAdmin
    .rpc("create_public_request_comment", {
      p_request_id: requestId,
      p_body: commentBody,
      p_source_url: sourceUrl || null,
      p_helper_alias: identity.alias,
      p_helper_seed_hash: identity.seedHash,
      p_helper_avatar_tone: identity.avatarTone,
      p_request_fingerprint_hash: requestFingerprintHash,
    })
    .single();

  if (error) {
    if (error.code === "P0001" && error.message === "public_comment_rate_limit") {
      throw new RequestCommentApiError("You're posting too quickly. Try again in a few minutes.", 429);
    }

    if (error.code === "P0001" && error.message === "public_request_not_open") {
      throw new RequestCommentApiError("This request is not open for public comments.", 404);
    }

    console.error("Could not create public request comment", error);
    throw new RequestCommentApiError("Could not post this comment.", 503);
  }

  return toPublicRequestComment(data);
}

function sanitizePublicCommentBody(value) {
  return parseString(value, requestCommentMaxLength)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n");
}

function normalizePublicCommentSourceUrl(value) {
  const rawValue = parseString(value, 1000);

  if (!rawValue) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(rawValue) && !/^https?:\/\//i.test(rawValue)) {
    return "";
  }

  try {
    const sourceUrl = new URL(/^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`);

    if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") {
      return "";
    }

    sourceUrl.hash = "";

    for (const key of [...sourceUrl.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_|igshid$|ref$|ref_src$)/i.test(key)) {
        sourceUrl.searchParams.delete(key);
      }
    }

    return sourceUrl.toString().slice(0, 1000);
  } catch {
    return "";
  }
}

function getPublicRequestCommentIdentity(value, requestFingerprintHash = "", requestId = "") {
  const visitorSeed = parseString(value, 160);
  const fallbackSeed = requestFingerprintHash || crypto.randomUUID();
  const publicScope = parseString(requestId, 80) || "public-request";
  const aliasSeed = `${visitorSeed || fallbackSeed}:${publicScope}`;
  const privateSeed = `${visitorSeed || fallbackSeed}:${requestFingerprintHash || "no-request-fingerprint"}:${publicScope}`;
  const seedHash = crypto.createHash("sha256").update(privateSeed).digest("hex");

  return {
    alias: getPublicHelperAlias(aliasSeed),
    avatarTone: getPublicHelperAvatarTone(aliasSeed),
    seedHash,
  };
}

function getPublicRequestCommentFingerprint(req, requestId) {
  if (!requestFingerprintSecret || !isUuid(requestId)) {
    return "";
  }

  const requestAddress = getTrustedRequestAddress(req);
  const requestSignal = requestAddress
    ? `ip:${requestAddress}`
    : [
        `ua:${parseString(req?.headers?.["user-agent"], 300).toLowerCase() || "unknown"}`,
        `language:${parseString(req?.headers?.["accept-language"], 160).toLowerCase() || "unknown"}`,
        `country:${parseString(req?.headers?.["x-vercel-ip-country"], 8).toLowerCase() || "unknown"}`,
      ].join("|");

  return crypto
    .createHmac("sha256", requestFingerprintSecret)
    .update(`public-request-comment:v1|request:${requestId}|${requestSignal}`)
    .digest("hex");
}

function getTrustedRequestAddress(req) {
  const forwardedAddress = process.env.VERCEL === "1"
    ? firstHeader(req?.headers?.["x-vercel-forwarded-for"])
      || firstHeader(req?.headers?.["x-forwarded-for"])
      || firstHeader(req?.headers?.["x-real-ip"])
    : "";
  const socketAddress = parseString(req?.socket?.remoteAddress, 128);
  return parseString(forwardedAddress || socketAddress, 128).toLowerCase();
}

function getPublicHelperAlias(seed) {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: " ",
    seed,
  });
}

function getPublicHelperAvatarTone(seed) {
  return hashPublicHelperSeed(`tone:${seed}`) % 6;
}

function hashPublicHelperSeed(seed) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function toPublicRequestComment(row) {
  const helperAlias = parseString(row?.helper_alias, 60) || getPublicHelperAlias(parseString(row?.id, 80));
  const avatarTone = Number(row?.helper_avatar_tone);

  return {
    id: parseString(row?.id, 80),
    request_id: parseString(row?.request_id, 80),
    body: parseString(row?.body, requestCommentMaxLength),
    source_url: parseString(row?.source_url, 1000) || null,
    helper_alias: helperAlias,
    helper_avatar_tone: Number.isInteger(avatarTone) && avatarTone >= 0 ? avatarTone % 6 : getPublicHelperAvatarTone(helperAlias),
    created_at: parseString(row?.created_at, 80),
  };
}

function isUuid(value) {
  return uuidPattern.test(value);
}

async function handleHealthCheck(req, res) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  let requestsTableAvailable = false;
  let publicRequestCardsAvailable = false;
  let freeRequestBoardReady = false;

  if (supabaseAdmin) {
    const [{ error: requestsError }, { error: publicCardsError }, { data: readinessData, error: readinessError }] = await Promise.all([
      supabaseAdmin.from("requests").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("public_request_cards").select("id", { count: "exact", head: true }),
      supabaseAdmin.rpc("is_free_request_board_ready"),
    ]);

    requestsTableAvailable = !requestsError;
    publicRequestCardsAvailable = !publicCardsError;
    freeRequestBoardReady = !readinessError && readinessData === true;
  }

  const healthy =
    Boolean(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_PUBLISHABLE_KEY) &&
    Boolean(supabaseAdmin) &&
    requestsTableAvailable &&
    publicRequestCardsAvailable &&
    freeRequestBoardReady;

  sendJson(res, healthy ? 200 : 503, {
    ok: healthy,
    app: "pleasefindmethis-com",
    free_request_board_ready: freeRequestBoardReady,
  });
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

function parseString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function parseDuration(value) {
  const duration = Number(value);
  return [7, 14, 30, 60].includes(duration) ? duration : 30;
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
  getPublicRequestCommentIdentity,
  isUuid,
  normalizeDeploymentAppUrl,
  normalizePublicCommentSourceUrl,
  sanitizePublicCommentBody,
};
