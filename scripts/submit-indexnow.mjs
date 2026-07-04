import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sitemapPath = path.join(root, "public", "sitemap.xml");
const host = "pleasefindmethis.com";
const key = "e51b2eb073edea7238284517b1c2a327";
const keyLocation = `https://${host}/${key}.txt`;
const endpoint = "https://www.bing.com/indexnow";

const sitemap = await fs.readFile(sitemapPath, "utf8");
const urlList = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]).filter((url) => {
  try {
    return new URL(url).hostname === host;
  } catch {
    return false;
  }
});

if (!urlList.length) {
  throw new Error(`No ${host} URLs found in ${sitemapPath}`);
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({
    host,
    key,
    keyLocation,
    urlList,
  }),
});

const responseText = await response.text().catch(() => "");

console.log(
  JSON.stringify(
    {
      endpoint,
      host,
      keyLocation,
      submittedUrls: urlList.length,
      status: response.status,
      ok: response.ok,
      response: responseText.slice(0, 500) || undefined,
    },
    null,
    2,
  ),
);

if (!response.ok) {
  process.exitCode = 1;
}
