import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { trackAICrawlerRequest } from "@datafast/ai-crawl";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { createDiscussionForumPostingSchema } from "./src/lib/request-seo.mjs";

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
const requestNotificationPreviewMaxLength = 220;
const requestFingerprintSecret = parseString(
  process.env.REQUEST_FINGERPRINT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY,
  500,
);
const resendApiKey = parseString(process.env.RESEND_API_KEY, 500);
const requestNotificationFrom = getRequestNotificationFromAddress();
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

    if (requestUrl.pathname === "/sitemaps/requests.xml") {
      await handlePublicRequestSitemap(req, res);
      return;
    }

    if (isBlockedPublicPath(requestUrl.pathname)) {
      sendText(res, 404, "Not found");
      return;
    }

    if (requestUrl.pathname === "/api/requests/public") {
      if (requestUrl.searchParams.get("render") === "request_page") {
        await handlePublicRequestDocument(req, res, requestUrl.searchParams.get("request_id"));
      } else if (requestUrl.searchParams.get("resource") === "sitemap") {
        await handlePublicRequestSitemap(req, res);
      } else if (requestUrl.searchParams.get("resource") === "delete") {
        await handleRequestDeletion(req, res, requestUrl.searchParams.get("request_id"));
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
    : publicRequestsQuery.order("created_at", { ascending: false });

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

  if (!isUuid(requestId)) {
    sendPublicRequestDocumentError(res, 404, "Request not found.");
    return;
  }

  if (!supabaseAdmin) {
    sendPublicRequestDocumentError(res, 503, "Public request is temporarily unavailable.");
    return;
  }

  let publicRequest;

  try {
    publicRequest = await loadPublicRequestForSeo(requestId);
  } catch (error) {
    console.error("Could not load public request SEO document", error);
    sendPublicRequestDocumentError(res, 503, "Public request is temporarily unavailable.");
    return;
  }

  if (!publicRequest) {
    sendPublicRequestDocumentError(res, 404, "Request not found.");
    return;
  }

  const indexable = isIndexablePublicRequestForSeo(publicRequest);
  const template = await loadPublicRequestDocumentTemplate(req);
  const canonicalUrl = getPublicRequestCanonicalUrl(publicRequest);
  const document = renderPublicRequestSeoDocument(template, publicRequest, indexable);

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": indexable ? "public, s-maxage=300, stale-while-revalidate=3600" : "private, no-store",
    "Content-Location": canonicalUrl,
    Link: `<${canonicalUrl}>; rel="canonical"`,
    "X-Robots-Tag": indexable
      ? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      : "noindex, follow",
  });
  res.end(req.method === "HEAD" ? "" : document);
}

async function handlePublicRequestSitemap(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  if (!supabaseAdmin) {
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300" });
    res.end(req.method === "HEAD" ? "" : "Request sitemap is temporarily unavailable.");
    return;
  }

  try {
    const requests = await loadIndexablePublicRequestsForSeo();
    const sitemap = renderPublicRequestSitemap(requests);
    res.writeHead(200, {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    });
    res.end(req.method === "HEAD" ? "" : sitemap);
  } catch (error) {
    console.error("Could not build public request sitemap", error);
    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "300" });
    res.end(req.method === "HEAD" ? "" : "Request sitemap is temporarily unavailable.");
  }
}

async function loadPublicRequestForSeo(requestId) {
  const { data, error } = await supabaseAdmin
    .from("public_request_cards")
    .select("id,item_name,category,details,duration_days,status,created_at,closes_at,days_remaining,primary_image_url,submission_count")
    .eq("id", requestId)
    .maybeSingle();

  if (!error) {
    return data ? normalizePublicRequestForSeo(data) : null;
  }

  const schemaCacheMiss = error.code === "PGRST205" || /public_request_cards/.test(error.message ?? "");

  if (!schemaCacheMiss) {
    throw error;
  }

  const fallback = await loadPublicRequestsFallback(requestId);
  return fallback[0] ? normalizePublicRequestForSeo(fallback[0]) : null;
}

async function loadIndexablePublicRequestsForSeo() {
  const { data, error } = await supabaseAdmin
    .from("public_request_cards")
    .select("id,item_name,category,details,duration_days,status,created_at,closes_at,days_remaining,primary_image_url,submission_count")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(1000);

  let requests;

  if (!error) {
    requests = data ?? [];
  } else {
    const schemaCacheMiss = error.code === "PGRST205" || /public_request_cards/.test(error.message ?? "");

    if (!schemaCacheMiss) {
      throw error;
    }

    requests = await loadPublicRequestsFallback();
  }

  return requests.map(normalizePublicRequestForSeo).filter(isIndexablePublicRequestForSeo);
}

function normalizePublicRequestForSeo(request) {
  return {
    id: parseString(request?.id, 80),
    item_name: parseString(request?.item_name, 120),
    category: parseString(request?.category, 80),
    details: parseString(request?.details, 1000),
    status: parseString(request?.status, 20),
    created_at: parseString(request?.created_at, 80),
    closes_at: parseString(request?.closes_at, 80),
    days_remaining: Number.isFinite(Number(request?.days_remaining)) ? Number(request.days_remaining) : null,
    primary_image_url: parseString(request?.primary_image_url, 2000),
    submission_count: Math.max(0, Number(request?.submission_count) || 0),
  };
}

function isIndexablePublicRequestForSeo(request) {
  const createdAt = Date.parse(request?.created_at ?? "");
  const closesAt = Date.parse(request?.closes_at ?? "");
  const isStillOpen = !Number.isFinite(closesAt) || closesAt > Date.now();

  return Boolean(
    isUuid(request?.id)
      && request?.status === "open"
      && request?.item_name?.length >= 3
      && request?.details?.length >= 40
      && Number.isFinite(createdAt)
      && isStillOpen,
  );
}

function renderPublicRequestSeoDocument(template, request, indexable) {
  const itemName = request.item_name;
  const canonicalUrl = getPublicRequestCanonicalUrl(request);
  const imageUrl = getPublicRequestImageUrl(request);
  const title = truncateSeoText(`Help Find ${itemName} | pleasefindmethis`, 60);
  const description = truncateSeoText(`Help find ${itemName}. ${request.details}`, 158);
  const imageAlt = `Reference photo for the public request to find ${itemName}.`;
  const schema = createPublicRequestSeoSchema(request, canonicalUrl, imageUrl, title, description);
  const fallback = renderPublicRequestSeoFallback(request);
  const robots = indexable
    ? "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"
    : "noindex,follow";

  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeSeoHtml(title)}</title>`)
    .replace(/<meta\b(?=[^>]*\bname="description")[^>]*>/i, `<meta name="description" content="${escapeSeoAttribute(description)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="robots")[^>]*>/i, `<meta name="robots" content="${robots}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:title")[^>]*>/i, `<meta property="og:title" content="${escapeSeoAttribute(title)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:description")[^>]*>/i, `<meta property="og:description" content="${escapeSeoAttribute(description)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/i, `<meta property="og:url" content="${escapeSeoAttribute(canonicalUrl)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image")[^>]*>/i, `<meta property="og:image" content="${escapeSeoAttribute(imageUrl)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:secure_url")[^>]*>/i, `<meta property="og:image:secure_url" content="${escapeSeoAttribute(imageUrl)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:type")[^>]*>/i, `<meta property="og:image:type" content="${getPublicRequestImageType(imageUrl)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:width")[^>]*>\s*/i, "")
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:height")[^>]*>\s*/i, "")
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:alt")[^>]*>/i, `<meta property="og:image:alt" content="${escapeSeoAttribute(imageAlt)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:title")[^>]*>/i, `<meta name="twitter:title" content="${escapeSeoAttribute(title)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:description")[^>]*>/i, `<meta name="twitter:description" content="${escapeSeoAttribute(description)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:image")[^>]*>/i, `<meta name="twitter:image" content="${escapeSeoAttribute(imageUrl)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:image:alt")[^>]*>/i, `<meta name="twitter:image:alt" content="${escapeSeoAttribute(imageAlt)}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escapeSeoAttribute(canonicalUrl)}" />`)
    .replace(/<script type="application\/ld\+json" data-seo-schema="site">[\s\S]*?<\/script>/i, `<script type="application/ld+json" data-seo-schema="site">${safeSeoJsonLd(schema)}</script>`)
    .replace(/<main data-static-fallback>[\s\S]*?<\/main>/i, fallback);
}

function createPublicRequestSeoSchema(request, canonicalUrl, imageUrl, title, description) {
  const organizationId = `${seoSiteOrigin}/#organization`;
  const websiteId = `${seoSiteOrigin}/#website`;
  const posting = createDiscussionForumPostingSchema({
    articleBody: request.details,
    canonicalUrl,
    category: request.category,
    commentCount: request.submission_count,
    datePublished: request.created_at,
    headline: request.item_name,
    imageUrl,
    websiteId,
  });

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "pleasefindmethis.com",
        url: seoSiteOrigin,
        logo: `${seoSiteOrigin}/magnifying-glass.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: "pleasefindmethis.com",
        url: seoSiteOrigin,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: title,
        description,
        datePublished: request.created_at,
        dateModified: request.created_at,
        inLanguage: "en",
        isPartOf: { "@id": websiteId },
        publisher: { "@id": organizationId },
        primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
        mainEntity: { "@id": posting["@id"] },
      },
      posting,
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${seoSiteOrigin}/` },
          { "@type": "ListItem", position: 2, name: "Request categories", item: `${seoSiteOrigin}/requests/` },
          { "@type": "ListItem", position: 3, name: request.item_name, item: canonicalUrl },
        ],
      },
    ],
  };
}

function renderPublicRequestSeoFallback(request) {
  const category = request.category ? `<p>Category: ${escapeSeoHtml(request.category)}</p>` : "";

  return `<main data-static-fallback>
        <nav aria-label="Breadcrumbs">
          <a href="/">Home</a> / <a href="/requests/">Request categories</a> / <span>${escapeSeoHtml(request.item_name)}</span>
        </nav>
        <p>Open public find request</p>
        <h1>Help find ${escapeSeoHtml(request.item_name)}</h1>
        <p>${escapeSeoHtml(request.details)}</p>
        ${category}
        <p>Share a current listing, seller path, model clue, compatibility note, or safety warning if you recognize this exact item.</p>
        <nav aria-label="Related links">
          <a href="/browse">Browse open requests</a>
          <a href="/guides/help-me-find-this-item/">How to find an exact item</a>
          <a href="/requests/">Request categories</a>
        </nav>
      </main>`;
}

function renderPublicRequestSitemap(requests) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${requests
    .map((request) => {
      const imageUrl = getPublicRequestImageUrl(request);
      const image = hasUniquePublicRequestImage(request)
        ? `\n    <image:image>\n      <image:loc>${escapeSeoXml(imageUrl)}</image:loc>\n      <image:title>${escapeSeoXml(request.item_name)}</image:title>\n    </image:image>`
        : "";
      return `  <url>\n    <loc>${escapeSeoXml(getPublicRequestCanonicalUrl(request))}</loc>\n    <lastmod>${escapeSeoXml(request.created_at)}</lastmod>${image}\n  </url>`;
    })
    .join("\n")}
</urlset>
`;
}

const seoSiteOrigin = "https://pleasefindmethis.com";
const defaultPublicRequestImage = `${seoSiteOrigin}/og/pleasefindmethis-request-board.png`;

function getPublicRequestCanonicalUrl(request) {
  return `${seoSiteOrigin}/requests/${encodeURIComponent(request.id)}/${slugifyPublicRequestItem(request.item_name)}`;
}

function slugifyPublicRequestItem(value) {
  return String(value || "item-request")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "item-request";
}

function getPublicRequestImageUrl(request) {
  const rawImage = parseString(request?.primary_image_url, 2000);

  if (!rawImage) {
    return defaultPublicRequestImage;
  }

  try {
    const imageUrl = new URL(rawImage, seoSiteOrigin);
    return imageUrl.protocol === "http:" || imageUrl.protocol === "https:" ? imageUrl.href : defaultPublicRequestImage;
  } catch {
    return defaultPublicRequestImage;
  }
}

function hasUniquePublicRequestImage(request) {
  return getPublicRequestImageUrl(request) !== defaultPublicRequestImage;
}

function getPublicRequestImageType(imageUrl) {
  const pathname = new URL(imageUrl).pathname.toLowerCase();
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function truncateSeoText(value, maxLength) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized.length <= maxLength ? normalized : `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function escapeSeoHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeSeoAttribute(value) {
  return escapeSeoHtml(value).replace(/"/g, "&quot;");
}

function escapeSeoXml(value) {
  return escapeSeoAttribute(value).replace(/'/g, "&apos;");
}

function safeSeoJsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function sendPublicRequestDocumentError(res, statusCode, message) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
  });
  res.end(message);
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

async function loadPublicRequestsFallback(requestId = "") {
  let requestsQuery = supabaseAdmin
    .from("requests")
    .select("id,item_name,category,details,duration_days,status,reference_images,created_at")
    .eq("status", "open");

  requestsQuery = requestId
    ? requestsQuery.eq("id", requestId).limit(1)
    : requestsQuery.order("created_at", { ascending: false });

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
    });
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

async function handleRequestDeletion(req, res, rawRequestId) {
  if (req.method !== "DELETE") {
    sendJson(res, 405, { error: "Method not allowed." });
    return;
  }

  const requestId = parseString(rawRequestId, 80);

  if (!isUuid(requestId)) {
    sendJson(res, 400, { error: "A valid request id is required." });
    return;
  }

  if (!supabaseAdmin) {
    sendJson(res, 503, { error: "Request deletion is unavailable." });
    return;
  }

  try {
    const authenticatedUser = await requireAuthenticatedRequestUser(req, "Log in to delete this request.");
    const { data: request, error: requestError } = await supabaseAdmin
      .from("requests")
      .select("id,user_id")
      .eq("id", requestId)
      .maybeSingle();

    if (requestError) {
      throw new RequestCommentApiError("Could not verify this request.", 503);
    }

    if (!request) {
      throw new RequestCommentApiError("This request no longer exists.", 404);
    }

    if (request.user_id !== authenticatedUser.id) {
      throw new RequestCommentApiError("Only the person who posted this request can delete it.", 403);
    }

    const { data: deletedRequest, error: deleteError } = await supabaseAdmin
      .from("requests")
      .delete()
      .eq("id", requestId)
      .eq("user_id", authenticatedUser.id)
      .select("id")
      .maybeSingle();

    if (deleteError) {
      throw new RequestCommentApiError("Could not delete this request.", 503);
    }

    if (!deletedRequest) {
      throw new RequestCommentApiError("This request was not deleted. Refresh and try again.", 409);
    }

    sendJson(res, 200, { deletedRequestId: deletedRequest.id });
  } catch (error) {
    const statusCode = Number(error?.statusCode) || 500;

    if (statusCode >= 500) {
      console.error("Request deletion failed", error);
    }

    sendJson(res, statusCode, {
      error: error instanceof Error ? error.message : "Request deletion is unavailable.",
    });
  }
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
    const authenticatedUser = req.method === "POST"
      ? await requireAuthenticatedRequestUser(req, "Log in to post a comment.")
      : null;

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

    const { comment, commentStatus } = await createPublicRequestComment(req, requestId, body);
    if (commentStatus === "visible") {
      await sendRequestClueNotification({
        comment,
        commenterId: authenticatedUser.id,
        request: publicRequest,
      });
    }
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

async function requireAuthenticatedRequestUser(req, errorMessage) {
  const authorization = parseString(req?.headers?.authorization, 4096);
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";

  if (!token) {
    throw new RequestCommentApiError(errorMessage, 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user || data.user.is_anonymous) {
    throw new RequestCommentApiError(errorMessage, 401);
  }

  return data.user;
}

async function loadPublicRequestForComments(requestId) {
  const { data, error } = await supabaseAdmin
    .from("requests")
    .select("id,user_id,item_name,status,duration_days,email_clue_notifications,created_at")
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

  if (isLikelySpamClue({ body: commentBody, source_url: sourceUrl })) {
    throw new RequestCommentApiError("This clue could not be posted.", 400);
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

  return {
    comment: toPublicRequestComment(data),
    commentStatus: parseString(data?.status, 20),
  };
}

function isLikelySpamClue(comment) {
  const commentBody = parseString(comment?.body, requestCommentMaxLength);
  const sourceUrl = parseString(comment?.source_url, 1000);
  const combinedText = `${commentBody} ${sourceUrl}`;
  const urlCount = (combinedText.match(/https?:\/\/|www\./gi) ?? []).length;
  const hasSpamPhrase = /\b(?:buy|cheap|get)\s+(?:followers|likes|subscribers)\b|\bguaranteed\s+(?:returns|results)\b|\bcrypto\s+giveaway\b|\bonline\s+casino\b/i.test(commentBody);

  return urlCount >= 3 || hasSpamPhrase;
}

async function sendRequestClueNotification({ comment, commenterId, request }) {
  const ownerId = parseString(request?.user_id, 80);

  if (
    !resendApiKey
    || !requestNotificationFrom
    || !isUuid(ownerId)
    || request?.email_clue_notifications !== true
    || ownerId === parseString(commenterId, 80)
  ) {
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(ownerId);
    const ownerEmail = normalizeNotificationEmail(data?.user?.email);

    if (error || !ownerEmail) {
      console.error("Could not resolve request owner for clue notification", {
        requestId: request.id,
        errorCode: error?.code ?? "owner_email_missing",
      });
      return false;
    }

    const email = buildRequestClueNotification({ comment, ownerEmail, request });
    const response = await fetchWithTimeout("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `request-clue/${comment.id}`,
      },
      body: JSON.stringify(email),
    }, 5_000);

    if (!response.ok) {
      console.error("Could not send request clue notification", {
        requestId: request.id,
        commentId: comment.id,
        statusCode: response.status,
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Request clue notification failed", {
      requestId: request?.id,
      commentId: comment?.id,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return false;
  }
}

function buildRequestClueNotification({ comment, ownerEmail, request }) {
  const itemName = parseString(request?.item_name, 120) || "your find request";
  const helperAlias = parseString(comment?.helper_alias, 60) || "Someone";
  const commentBody = getRequestCluePreview(comment?.body);
  const sourceUrl = normalizePublicCommentSourceUrl(comment?.source_url);
  const requestUrl = `${publicAppUrl || deploymentPublicAppUrl || "https://pleasefindmethis.com"}${getPublicRequestPath(request?.id, itemName)}`;
  const escapedItemName = escapeHtml(itemName);
  const escapedAlias = escapeHtml(helperAlias);
  const escapedBody = escapeHtml(commentBody).replace(/\n/g, "<br>");
  const escapedRequestUrl = escapeHtml(requestUrl);
  const sourceBlock = sourceUrl
    ? `<p style="margin:16px 0 0"><a href="${escapeHtml(sourceUrl)}" style="color:#087343;font-weight:700">Open the source they shared</a></p>`
    : "";
  const textSource = sourceUrl ? `\nSource: ${sourceUrl}` : "";

  return {
    from: requestNotificationFrom,
    to: [ownerEmail],
    subject: `New clue for ${itemName}`.slice(0, 180),
    text: `${helperAlias} left a new clue on your request “${itemName}”.\n\n${commentBody}${textSource}\n\nReview the clue: ${requestUrl}\n\nYou’re receiving this because you posted this request on pleasefindmethis.com.`,
    html: `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f7f5;color:#121714;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:32px 18px">
      <div style="background:#ffffff;border:1px solid #dfe6e1;border-radius:16px;padding:28px">
        <p style="margin:0 0 8px;color:#087343;font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">New clue</p>
        <h1 style="margin:0 0 18px;font-size:25px;line-height:1.25">Someone responded to “${escapedItemName}”</h1>
        <p style="margin:0 0 12px;color:#525d56;font-size:15px"><strong style="color:#121714">${escapedAlias}</strong> left this clue:</p>
        <div style="padding:16px;border-radius:12px;background:#f3f7f4;font-size:16px;line-height:1.55">${escapedBody}</div>
        ${sourceBlock}
        <p style="margin:24px 0 0"><a href="${escapedRequestUrl}" style="display:inline-block;border-radius:999px;background:#087343;color:#ffffff;padding:13px 20px;text-decoration:none;font-weight:800">View New Clue</a></p>
      </div>
      <p style="margin:16px 8px 0;color:#68736c;font-size:12px;line-height:1.5">You’re receiving this because you posted this request on pleasefindmethis.com.</p>
    </div>
  </body>
</html>`,
  };
}

function getRequestNotificationFromAddress() {
  const configuredSender = parseString(
    process.env.REQUEST_NOTIFICATION_FROM_EMAIL || process.env.WAITLIST_FROM_EMAIL,
    320,
  );

  if (isSafeEmailSender(configuredSender)) {
    return configuredSender;
  }

  const emailDomain = parseString(process.env.RESEND_EMAIL_DOMAIN, 253)
    .replace(/^@/, "")
    .toLowerCase();

  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(emailDomain)
    ? `Please Find Me This <notifications@${emailDomain}>`
    : "";
}

function isSafeEmailSender(value) {
  return Boolean(value)
    && !/[\r\n]/.test(value)
    && /^(?:[^<>]+\s*)?<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$|^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
}

function normalizeNotificationEmail(value) {
  const email = parseString(value, 254).toLowerCase();
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : "";
}

function getRequestCluePreview(value) {
  const commentBody = parseString(value, requestCommentMaxLength);

  if (commentBody.length <= requestNotificationPreviewMaxLength) {
    return commentBody;
  }

  return `${commentBody.slice(0, requestNotificationPreviewMaxLength - 1).trimEnd()}…`;
}

function getPublicRequestPath(requestId, itemName) {
  const requestSlug = parseString(itemName, 120)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "find-request";

  return `/requests/${requestId}/${requestSlug}/`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
  res.writeHead(statusCode, {
    "Cache-Control": "private, no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
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
