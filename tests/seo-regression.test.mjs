import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(root, "dist");
const siteOrigin = "https://pleasefindmethis.com";

test.before(() => {
  execFileSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "pipe",
  });
});

test("sitemap pages have unique initial SEO metadata in built HTML", () => {
  const sitemap = fs.readFileSync(path.join(distRoot, "sitemap.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const titles = new Map();
  const canonicals = new Map();

  assert.ok(urls.length > 20, "expected sitemap to contain public SEO URLs");

  for (const url of urls) {
    const pathname = new URL(url).pathname;
    const html = readBuiltHtml(pathname);
    const title = textMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = metaContent(html, "name", "description");
    const robots = metaContent(html, "name", "robots");
    const canonical = linkHref(html, "canonical");
    const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => stripTags(match[1]));
    const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

    assert.ok(title, `${pathname} has a title`);
    assert.ok(title.length <= 65, `${pathname} title is short enough: ${title}`);
    assert.ok(description.length >= 80 && description.length <= 180, `${pathname} has a useful meta description`);
    assert.equal(robots, "index,follow", `${pathname} is indexable`);
    assert.equal(canonical, `${siteOrigin}${pathname}`, `${pathname} has self canonical`);
    assert.equal(h1s.length, 1, `${pathname} has exactly one H1`);
    assert.ok(h1s[0].length > 5, `${pathname} H1 is descriptive`);
    assert.ok(jsonLdBlocks.length >= 1, `${pathname} has JSON-LD`);

    for (const block of jsonLdBlocks) {
      assert.doesNotThrow(() => JSON.parse(block[1]), `${pathname} JSON-LD parses`);
    }

    for (const [attribute, value] of [
      ["property", "og:title"],
      ["property", "og:description"],
      ["property", "og:url"],
      ["property", "og:image"],
      ["property", "og:image:width"],
      ["property", "og:image:height"],
      ["property", "og:image:alt"],
      ["name", "twitter:title"],
      ["name", "twitter:description"],
      ["name", "twitter:image"],
      ["name", "twitter:image:alt"],
    ]) {
      assert.ok(metaContent(html, attribute, value), `${pathname} has ${value}`);
    }

    addUnique(titles, title, pathname);
    addUnique(canonicals, canonical, pathname);
  }
});

test("built product surfaces describe a free public request board without legacy financial claims", () => {
  const builtTextFiles = collectBuiltTextFiles(distRoot);
  const forbiddenClaims = [
    ["retired bounty terminology", /\bbount(?:y|ies)\b/i],
    ["bounty-board positioning", /\bbounty board\b/i],
    ["funded-request positioning", /\bfund(?:ed|ing)? (?:a|the|this|your) request\b/i],
    ["reward offer", /\b(?:offer|set) (?:a|the|your) reward\b/i],
    ["rewarded finder or lead", /\breward (?:a|the|your) (?:finder|helper|valid lead)\b/i],
    ["reward earnings", /\bearn(?:ing)? (?:a|the|your)?\s*reward\b/i],
    ["finder payout", /\bfinder(?:'s)? payout\b/i],
    ["payout operations", /\bpayout (?:case|path|queue|review|status)\b/i],
    ["paid finder", /\bpay(?:ing)? (?:a|the|your) finder\b/i],
    ["private source handoff", /\b(?:share|submit|review|reveal) (?:a|the)?\s*private (?:lead|source)\b/i],
    ["private source submission", /\bprivate (?:lead|source) submission\b/i],
    ["protected source workflow", /\bprotected (?:lead|source)\b/i],
    ["source reveal workflow", /\b(?:save|show) (?:a|the)?\s*source before reveal\b|\breveal (?:a|the)?\s*source\b/i],
    ["finder dashboard", /\bfinder dashboard\b/i],
    ["marketplace administration", /\bmarketplace admin(?:istration)?\b/i],
    ["payment-for-help prompt", /\boffer payment for help\b/i],
    ["marketplace offer schema", /\bAggregateOffer\b/],
  ];

  assert.ok(builtTextFiles.length > 20, "expected the build to contain public text surfaces");

  for (const filePath of builtTextFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(distRoot, filePath);

    for (const [claim, pattern] of forbiddenClaims) {
      assert.doesNotMatch(content, pattern, `${relativePath} does not advertise ${claim}`);
    }
  }

  const builtCorpus = builtTextFiles.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n");
  assert.match(
    builtCorpus,
    /\bfree public request(?:-board| board| workspace)s?\b|\bpublishing is free\b/i,
    "the built site explicitly says requests are free",
  );
  assert.match(builtCorpus, /\bpublic clues?\b/i, "the built site directs responses into public clues");
});

test("canonical redirects are declared for duplicate host and static slash variants", () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const redirects = vercelConfig.redirects ?? [];

  assert.ok(
    redirects.some((redirect) => redirect.destination === "https://pleasefindmethis.com/:path*" && JSON.stringify(redirect.has ?? []).includes("www.pleasefindmethis.com")),
    "www host redirects to apex",
  );
  assert.ok(redirects.some((redirect) => redirect.source === "/guides" && redirect.destination === "/guides/"), "/guides redirects to /guides/");
  assert.ok(redirects.some((redirect) => redirect.source === "/guides/:slug" && redirect.destination === "/guides/:slug/"), "guide detail URLs redirect to trailing slash");
  assert.ok(redirects.some((redirect) => redirect.source === "/requests" && redirect.destination === "/requests/"), "/requests redirects to /requests/");
  assert.ok(redirects.some((redirect) => redirect.source === "/requests/:slug" && redirect.destination === "/requests/:slug/"), "request category URLs redirect to trailing slash");
});

test("landing headline excludes the removed title and rotates every six seconds", () => {
  const source = fs.readFileSync(path.join(root, "src/main.tsx"), "utf8");
  const headlineExamples = source.match(/const heroHeadlineExamples = \[([\s\S]*?)\];/)?.[1] ?? "";

  assert.doesNotMatch(headlineExamples, /["']Help me find this\.["']/);
  assert.match(headlineExamples, /["']Please help me find this\.["']/);
  assert.match(headlineExamples, /["']Where can I buy this\?["']/);
  assert.match(headlineExamples, /["']Anyone know where this is\?["']/);
  assert.match(source, /const heroHeadlineHoldMs = 6_000;/);
  assert.equal(
    [...source.matchAll(/window\.setTimeout\(tick, heroHeadlineHoldMs\)/g)].length,
    2,
    "initial and between-title holds both use the six-second interval",
  );
  assert.doesNotMatch(source, /<h1 aria-label="Help me find this\.">/);
});

function readBuiltHtml(pathname) {
  const relative = pathname === "/" ? "index.html" : path.join(pathname.replace(/^\/+|\/+$/g, ""), "index.html");
  const filePath = path.join(distRoot, relative);
  assert.ok(fs.existsSync(filePath), `${pathname} exists at ${filePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function collectBuiltTextFiles(directory) {
  const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".svg", ".txt", ".xml"]);
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectBuiltTextFiles(entryPath));
    } else if (textExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
}

function textMatch(html, regex) {
  return stripTags(html.match(regex)?.[1] ?? "");
}

function metaContent(html, attribute, value) {
  const tag = html.match(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}=["']${escapeRegExp(value)}["'])[^>]*>`, "i"))?.[0] ?? "";
  return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? "";
}

function linkHref(html, rel) {
  const tag = html.match(new RegExp(`<link\\b(?=[^>]*\\brel=["']${escapeRegExp(rel)}["'])[^>]*>`, "i"))?.[0] ?? "";
  return tag.match(/\bhref=["']([^"']*)["']/i)?.[1] ?? "";
}

function stripTags(value) {
  return String(value)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function addUnique(map, value, pathname) {
  const existing = map.get(value);
  assert.equal(existing, undefined, `${pathname} duplicates ${value} from ${existing}`);
  map.set(value, pathname);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
