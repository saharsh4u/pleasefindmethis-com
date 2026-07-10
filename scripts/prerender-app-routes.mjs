import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const siteUrl = "https://pleasefindmethis.com";
const siteName = "pleasefindmethis.com";
const titleBrand = "pleasefindmethis";
const lastmod = "2026-07-10";
const defaultImage = "/og/pleasefindmethis-request-board.png";
const defaultImageAlt = "A free public request board for hard-to-find items, photos, and public clues.";
const defaultImageWidth = 1200;
const defaultImageHeight = 630;

const appRoutes = [
  {
    path: "/browse",
    title: `Featured Find Requests | ${titleBrand}`,
    description: "Browse free public requests for rare, sold-out, discontinued, vintage, and replacement items, then add a useful public clue.",
    h1: "Featured hard-to-find item requests",
    eyebrow: "Browse requests",
    cta: "/browse/all",
    ctaLabel: "Browse all requests",
    sections: [
      ["What this page is for", "Use this page to scan open requests where people need exact sources, seller paths, local clues, or compatibility notes. These are free public request briefs, not item listings."],
      ["How to evaluate a request", "Read the item name, reference image, must-have details, region, and timeline before adding a public clue. A useful clue explains why a source matches the posted criteria."],
      ["Useful public clues", "Strong clues include a current listing, seller or shop path, compatibility evidence, price or terms, and notes about condition or availability. Never post private personal information."],
    ],
    links: [["Browse all requests", "/browse/all"], ["Request categories", "/requests/"], ["Post a request", "/post/describe"], ["Browse guides", "/guides/"]],
    schemaType: "CollectionPage",
  },
  {
    path: "/browse/all",
    title: `Browse All Find Requests | ${titleBrand}`,
    description: "Search open public requests by item, category, and location, then share a useful public clue when you know where to find it.",
    h1: "Browse every open find request",
    eyebrow: "All requests",
    cta: "/post/describe",
    ctaLabel: "Post your own request",
    sections: [
      ["All public requests", "This page is the full request board for rare, discontinued, sentimental, or hard-to-search items. Each request describes a specific item rather than a generic shopping category."],
      ["Filter by fit", "Start with categories you understand: sentimental replacements, plush toys, fashion, repair parts, cameras, watches, retro gaming, or home decor. Then check whether the timeline and request details make your clue useful."],
      ["Public clue workflow", "Anyone can add a public link, model clue, compatibility note, seller path, or safety warning to an open request. Do not post private personal information, and verify third-party sellers independently."],
    ],
    links: [["Featured requests", "/browse"], ["Guides", "/guides/"], ["Request categories", "/requests/"], ["Terms", "/terms"]],
    schemaType: "CollectionPage",
  },
  {
    path: "/terms",
    title: `Terms of Service | ${titleBrand}`,
    description: "Terms for free public requests, public clues, third-party seller safety, moderation, and acceptable use.",
    h1: "Terms of service",
    eyebrow: "Terms",
    cta: "/post/describe",
    ctaLabel: "Post a request",
    sections: [
      ["Request board role", "People publish free public requests and describe exact match criteria. Anyone may add public links, seller paths, clues, or safety notes. Pleasefindmethis is not the seller, broker, or fulfillment provider for requested items."],
      ["Third-party purchases", "Any item purchase happens separately and directly with the third-party seller. Pleasefindmethis does not authenticate sellers or guarantee listings, so users must verify sources and use the seller's permitted checkout process."],
      ["Account enforcement", "The platform may remove requests or clues and suspend accounts for fraud, abuse, prohibited goods, spam, unsafe conduct, privacy violations, or attempts to misuse the service."],
    ],
    links: [["Privacy", "/privacy"], ["Browse requests", "/browse"], ["Post a request", "/post/describe"], ["Email support", "mailto:support@pleasefindmethis.com"]],
    schemaType: "WebPage",
  },
  {
    path: "/privacy",
    title: `Privacy Policy | ${titleBrand}`,
    description: "How pleasefindmethis.com handles account, public request, image, public clue, moderation, and support data.",
    h1: "Privacy policy",
    eyebrow: "Privacy",
    cta: "mailto:support@pleasefindmethis.com",
    ctaLabel: "Email support",
    sections: [
      ["Data collected", "The request board processes account email, authentication provider, request descriptions, reference images, public clues, source URLs, and basic security signals."],
      ["How data is used", "Public request details and public clues power request pages. Account and moderation data support authentication, abuse prevention, safety reviews, and service operation."],
      ["User choices", "Users can email the site operator to request account deletion, data export, or correction. Security and integrity records may be retained when needed for legal or operational reasons."],
    ],
    links: [["Terms", "/terms"], ["Browse requests", "/browse"], ["Post a request", "/post/describe"], ["Email support", "mailto:support@pleasefindmethis.com"]],
    schemaType: "WebPage",
  },
];

async function main() {
  const template = await fs.readFile(path.join(distDir, "index.html"), "utf8");

  for (const route of appRoutes) {
    const html = renderRouteHtml(template, route);
    const outputPath = path.join(distDir, route.path.replace(/^\/+/, ""), "index.html");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
  }
}

function renderRouteHtml(template, route) {
  const canonicalUrl = absoluteUrl(route.path);
  const imageUrl = absoluteUrl(route.image ?? defaultImage);
  const imageAlt = route.imageAlt ?? defaultImageAlt;
  const schema = createStructuredData(route, canonicalUrl, imageUrl);
  const fallback = renderFallback(route);

  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(route.title)}</title>`)
    .replace(/<meta\b(?=[^>]*\bname="description")[^>]*>/i, `<meta name="description" content="${attr(route.description)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="robots")[^>]*>/i, `<meta name="robots" content="index,follow" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:title")[^>]*>/i, `<meta property="og:title" content="${attr(route.title)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:description")[^>]*>/i, `<meta property="og:description" content="${attr(route.description)}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:url")[^>]*>/i, `<meta property="og:url" content="${canonicalUrl}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image")[^>]*>/i, `<meta property="og:image" content="${imageUrl}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:secure_url")[^>]*>/i, `<meta property="og:image:secure_url" content="${imageUrl}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:width")[^>]*>/i, `<meta property="og:image:width" content="${route.imageWidth ?? defaultImageWidth}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:height")[^>]*>/i, `<meta property="og:image:height" content="${route.imageHeight ?? defaultImageHeight}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:alt")[^>]*>/i, `<meta property="og:image:alt" content="${attr(imageAlt)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:title")[^>]*>/i, `<meta name="twitter:title" content="${attr(route.title)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:description")[^>]*>/i, `<meta name="twitter:description" content="${attr(route.description)}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:image")[^>]*>/i, `<meta name="twitter:image" content="${imageUrl}" />`)
    .replace(/<meta\b(?=[^>]*\bname="twitter:image:alt")[^>]*>/i, `<meta name="twitter:image:alt" content="${attr(imageAlt)}" />`)
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`)
    .replace(/<script type="application\/ld\+json" data-seo-schema="site">[\s\S]*?<\/script>/i, `<script type="application/ld+json" data-seo-schema="site">${JSON.stringify(schema)}</script>`)
    .replace(/<main data-static-fallback>[\s\S]*?<\/main>/i, fallback);
}

function renderFallback(route) {
  return `<main data-static-fallback>
        <nav aria-label="Breadcrumbs">
          <a href="/">Home</a> / <span>${escapeHtml(route.h1)}</span>
        </nav>
        <p>${escapeHtml(route.eyebrow)}</p>
        <h1>${escapeHtml(route.h1)}</h1>
        <p>${escapeHtml(route.description)}</p>
        ${route.sections
          .map(
            ([title, copy]) => `<section>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(copy)}</p>
        </section>`,
          )
          .join("\n        ")}
        <nav aria-label="Related links">
          ${route.links.map(([label, href]) => `<a href="${attr(href)}">${escapeHtml(label)}</a>`).join("\n          ")}
        </nav>
        <p>Last updated July 3, 2026.</p>
      </main>`;
}

function createStructuredData(route, canonicalUrl, imageUrl) {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const graph = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteName,
      url: siteUrl,
      logo: absoluteUrl("/magnifying-glass.png"),
      contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: "support@pleasefindmethis.com" }],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteName,
      url: siteUrl,
      description: "A free public request board where people post exact hard-to-find item requests and anyone can add public clues.",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#app`,
      name: "Hard-to-find item request board",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: siteUrl,
      publisher: { "@id": organizationId },
      isAccessibleForFree: true,
      termsOfService: absoluteUrl("/terms"),
    },
    {
      "@type": route.schemaType === "FAQPage" ? "FAQPage" : route.schemaType,
      "@id": `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: route.title,
      headline: route.h1,
      description: route.description,
      isPartOf: { "@id": websiteId },
      publisher: { "@id": organizationId },
      dateModified: lastmod,
      inLanguage: "en",
      primaryImageOfPage: { "@type": "ImageObject", url: imageUrl },
      ...(route.schemaType === "FAQPage"
        ? {
            mainEntity: route.sections.map(([title, copy]) => ({
              "@type": "Question",
              name: title,
              acceptedAnswer: { "@type": "Answer", text: copy },
            })),
          }
        : {}),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: route.h1, item: canonicalUrl },
      ],
    },
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}

function absoluteUrl(pathname) {
  return new URL(pathname, siteUrl).toString();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function attr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

await main();
