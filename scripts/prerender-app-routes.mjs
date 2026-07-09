import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const siteUrl = "https://pleasefindmethis.com";
const siteName = "pleasefindmethis.com";
const titleBrand = "pleasefindmethis";
const lastmod = "2026-07-03";
const defaultImage = "/og/pleasefindmethis-vintage-tee-fullscreen-v3.png";
const defaultImageAlt = "Public request for a hard-to-find item with photos, failed searches, and source suggestions.";

const appRoutes = [
  {
    path: "/browse",
    title: `Featured Find Requests | ${titleBrand}`,
    description: "Browse open requests for rare, sold-out, discontinued, vintage, and replacement items that helpers can suggest sources for.",
    h1: "Featured hard-to-find item requests",
    eyebrow: "Browse requests",
    cta: "/browse/all",
    ctaLabel: "Browse all requests",
    sections: [
      ["What this page is for", "Use this page to scan open requests where people need exact sources, seller paths, local clues, or compatibility notes. These are not marketplace listings; they are free public request briefs with category, match criteria, and source-suggestion expectations."],
      ["How to evaluate a request", "Read the item name, reference image, must-have details, region, and timeline before sharing a source suggestion. A useful suggestion should explain why the item is available and close enough to the posted criteria for the requester to act on it."],
      ["Good helper submissions", "Strong submissions include a current listing, seller or shop contact, source path, compatibility proof, price or terms, and notes about condition or availability. Duplicate, expired, vague, or lookalike-only suggestions are weaker and may be rejected."],
    ],
    links: [["Browse all requests", "/browse/all"], ["Request categories", "/requests/"], ["Post a request", "/post/describe"], ["Browse guides", "/guides/"]],
    schemaType: "CollectionPage",
  },
  {
    path: "/browse/all",
    title: `Browse All Find Requests | ${titleBrand}`,
    description: "Search open find requests by item, category, and location, then share a useful source suggestion when you know where to find it.",
    h1: "Browse every open find request",
    eyebrow: "All requests",
    cta: "/post/describe",
    ctaLabel: "Post your own request",
    sections: [
      ["All public opportunities", "This page is the full request board for people who know where rare, discontinued, sentimental, or hard-to-search items can be found. Each request is a brief for a specific item rather than a generic shopping category."],
      ["Filter by fit", "Start with categories you understand: sentimental replacements, plush toys, fashion, repair parts, cameras, watches, retro gaming, or home decor. Then check whether the timeline and request details make the suggestion useful."],
      ["Source suggestion workflow", "When you submit a source suggestion, the platform records the link, clue, proof, and safety notes with the request. Requesters can review the match or use the saved trail if the lead is wrong, duplicated, unavailable, or disputed."],
    ],
    links: [["Featured requests", "/browse"], ["Guides", "/guides/"], ["Request categories", "/requests/"], ["Terms", "/terms"]],
    schemaType: "CollectionPage",
  },
  {
    path: "/profile",
    title: `Helper Trust Profile Example | ${titleBrand}`,
    description: "See how helper contribution history, source quality, verification, and review history build trust on pleasefindmethis.com.",
    h1: "Helper trust profile example",
    eyebrow: "Helper trust",
    cta: "/browse",
    ctaLabel: "Browse requests",
    sections: [
      ["Why trust profiles matter", "A helper profile helps requesters understand whether someone has a track record with useful sources, niche categories, evidence quality, and safe conduct. It is especially useful for high-effort searches where the best clue may come from a collector, repair shop, reseller, or local source."],
      ["Signals to review", "Useful trust signals include source history, profile verification, review notes, source timing, category expertise, and whether previous suggestions were specific enough for requesters to act on."],
      ["How helpers can improve", "Helpers should submit clear match proof, current availability, price or terms, seller context, compatibility notes, and any risks. Good source notes reduce confusion and make it easier for requesters to evaluate suggestions."],
    ],
    links: [["Help with requests", "/finder-dashboard"], ["Browse opportunities", "/browse/all"], ["How to post", "/post/describe"], ["Read terms", "/terms"]],
    schemaType: "ProfilePage",
  },
  {
    path: "/refunds",
    title: `Refund and Cancellation Policy | ${titleBrand}`,
    description: "How optional digital visibility purchases, cancellations, and support reviews work on pleasefindmethis.com.",
    h1: "Refund and cancellation policy",
    eyebrow: "Refunds",
    cta: "mailto:support@pleasefindmethis.com",
    ctaLabel: "Email support",
    sections: [
      ["Free requests", "Public requests can publish for free without checkout. Helpers share source suggestions directly with the requester, and any item purchase happens separately with the seller."],
      ["Optional digital tools", "If paid digital tools are offered, they cover software features such as visibility, alerts, monitoring, or request-writing assistance. Separate item purchases from third-party sellers are outside the platform checkout."],
      ["Reports and reviews", "When a source suggestion is reported, support can review the saved request, source notes, screenshots, links, and account history. Reports are handled as content and account reviews."],
    ],
    links: [["Terms", "/terms"], ["Privacy", "/privacy"], ["Browse requests", "/browse"], ["Post a request", "/post/describe"]],
    schemaType: "WebPage",
  },
  {
    path: "/terms",
    title: `Terms of Service | ${titleBrand}`,
    description: "Terms for requesters, helpers, free public requests, source suggestions, moderation, and optional digital visibility tools.",
    h1: "Terms of service",
    eyebrow: "Terms",
    cta: "/refunds",
    ctaLabel: "Refund policy",
    sections: [
      ["Request board role", "Requesters publish free requests and describe exact match criteria. Helpers submit source links, seller paths, clues, or safety notes. The platform records the workflow and review trail, but it is not the seller of the requested item."],
      ["Optional digital tools", "Optional paid products must be direct digital tools sold by pleasefindmethis, such as visibility, alerts, monitoring, or request-writing assistance."],
      ["Account enforcement", "The platform may remove requests, block submissions, refund digital-tool purchases, or suspend accounts for fraud, abuse, prohibited goods, duplicate spam, unsafe conduct, or payment processor policy conflicts."],
    ],
    links: [["Privacy", "/privacy"], ["Refunds", "/refunds"], ["Browse requests", "/browse"], ["Email support", "mailto:support@pleasefindmethis.com"]],
    schemaType: "WebPage",
  },
  {
    path: "/privacy",
    title: `Privacy Policy | ${titleBrand}`,
    description: "How pleasefindmethis.com handles account, request, source, image, support, and payment-related data.",
    h1: "Privacy policy",
    eyebrow: "Privacy",
    cta: "mailto:support@pleasefindmethis.com",
    ctaLabel: "Email support",
    sections: [
      ["Data collected", "The request board processes account email, authentication provider, request descriptions, reference images, source suggestions, proof files, support messages, report evidence, and optional digital-tool billing records."],
      ["How data is used", "Public request data powers request pages after sensitive account fields are removed. Source suggestion details are stored so requesters can review links, clues, seller context, and safety notes."],
      ["User choices", "Users can request account deletion, data export, correction, or support review. Fraud, support, safety, digital-tool billing, and integrity records may be retained when needed for legal, financial, or operational reasons."],
    ],
    links: [["Terms", "/terms"], ["Refunds", "/refunds"], ["Browse requests", "/browse"], ["Email support", "mailto:support@pleasefindmethis.com"]],
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
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:width")[^>]*>/i, `<meta property="og:image:width" content="${route.imageWidth ?? 1200}" />`)
    .replace(/<meta\b(?=[^>]*\bproperty="og:image:height")[^>]*>/i, `<meta property="og:image:height" content="${route.imageHeight ?? 675}" />`)
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
      description: "A free public request board where requesters post exact hard-to-find item requests and helpers share source suggestions.",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "Hard-to-find item request board",
      serviceType: "Free public request-board web app",
      url: siteUrl,
      provider: { "@id": organizationId },
      areaServed: "Worldwide",
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
