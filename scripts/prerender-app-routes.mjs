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
const defaultImageAlt = "Reward-style poster for a hard-to-find item request with a protected source lead.";

const appRoutes = [
  {
    path: "/browse",
    title: `Featured Find Requests | ${titleBrand}`,
    description: "Browse funded requests for rare, sold-out, discontinued, vintage, and replacement items that expert finders can help source.",
    h1: "Featured hard-to-find item requests",
    eyebrow: "Browse requests",
    cta: "/browse/all",
    ctaLabel: "Browse all requests",
    sections: [
      ["What this page is for", "Use this page to scan funded requests where posters are paying for exact sources, seller contacts, local leads, or handoff paths. These are not ordinary marketplace listings; they are request briefs with reward, category, match criteria, and source-review expectations."],
      ["How to evaluate a request", "Read the item name, reference image, must-have details, reward, region, and timeline before submitting a source. A useful lead should prove that the item is available and close enough to the posted criteria for the poster to act on it."],
      ["Good finder submissions", "Strong submissions include a current listing, seller or shop contact, private source path, compatibility proof, price or terms, and notes about condition or availability. Duplicate, expired, vague, or lookalike-only leads are weaker and may be rejected."],
    ],
    links: [["Browse every request", "/browse/all"], ["Request categories", "/requests/"], ["Post a request", "/post/describe"], ["FAQ", "/faq"]],
    schemaType: "CollectionPage",
  },
  {
    path: "/browse/all",
    title: `Browse All Find Requests | ${titleBrand}`,
    description: "Search open find requests by item, category, reward, and location, then submit a protected source when you know where to find it.",
    h1: "Browse every open find request",
    eyebrow: "All requests",
    cta: "/post/describe",
    ctaLabel: "Post your own request",
    sections: [
      ["All public opportunities", "This page is the full request board for people who know where rare, discontinued, sentimental, or hard-to-search items can be found. Each request is a brief for a specific item rather than a generic shopping category."],
      ["Filter by fit", "Start with categories you understand: sentimental replacements, plush toys, fashion, repair parts, cameras, watches, retro gaming, or home decor. Then check whether the reward and timeline justify the research needed."],
      ["Protected source workflow", "When you submit a source, the platform records the source before reveal. Posters can review the match, accept a valid source, or use the saved trail if the lead is wrong, duplicated, unavailable, or disputed."],
    ],
    links: [["Featured requests", "/browse"], ["Guides", "/guides/"], ["Request categories", "/requests/"], ["Marketplace rules", "/rules"]],
    schemaType: "CollectionPage",
  },
  {
    path: "/faq",
    title: `FAQ for Posters and Finders | ${titleBrand}`,
    description: "Answers about payments, refunds, protected sources, finder rewards, public browsing, disputes, and how pleasefindmethis.com works.",
    h1: "FAQ for posters and finders",
    eyebrow: "Marketplace answers",
    cta: "/post/describe",
    ctaLabel: "Post a request",
    sections: [
      ["What does pleasefindmethis.com do?", "Posters create funded requests for exact hard-to-find items. Finders submit protected sources such as public listings, seller contacts, local shop leads, collector paths, compatibility proof, or direct handoff options."],
      ["What is a protected source?", "A protected source is saved before the poster sees the full lead. That record helps decide whether a finder provided the first valid source and gives both sides a review trail if the source is disputed."],
      ["Is the platform selling the item?", "No. The platform hosts the request, payment workflow, source record, review process, and eligible finder payout. The item purchase itself happens separately with the third-party seller or source."],
      ["What happens if no valid source is accepted?", "If no valid source or handoff is accepted during the active request window, the funded finder reward can be returned under the refund policy. Service and source-review fees are handled separately."],
    ],
    links: [["Rules", "/rules"], ["Refunds", "/refunds"], ["Support", "/support"], ["Browse requests", "/browse"]],
    schemaType: "FAQPage",
  },
  {
    path: "/profile",
    title: `Finder Trust Profile Example | ${titleBrand}`,
    description: "See how finder ratings, accepted sources, verification, and review history build trust on pleasefindmethis.com.",
    h1: "Finder trust profile example",
    eyebrow: "Finder trust",
    cta: "/browse",
    ctaLabel: "Browse requests",
    sections: [
      ["Why trust profiles matter", "A finder profile helps posters understand whether someone has a track record with valid sources, niche categories, evidence quality, and dispute-safe conduct. It is especially useful for high-effort searches where the best clue may come from a collector, repair shop, reseller, or local source."],
      ["Signals to review", "Useful trust signals include accepted source history, profile verification, payout status, review notes, source timing, category expertise, and whether previous leads were specific enough for posters to act on."],
      ["How finders can improve", "Finders should submit clear match proof, current availability, price or terms, seller context, compatibility notes, and any risks. Good source notes reduce disputes and make it easier for posters to accept valid leads."],
    ],
    links: [["Work as a finder", "/finder-dashboard"], ["Browse opportunities", "/browse/all"], ["Marketplace rules", "/rules"], ["FAQ", "/faq"]],
    schemaType: "ProfilePage",
  },
  {
    path: "/support",
    title: `Support for Requests and Payouts | ${titleBrand}`,
    description: "Get help with account access, checkout issues, source review, disputes, refunds, payout holds, and safety concerns.",
    h1: "Support for requests, sources, payments, and payouts",
    eyebrow: "Support",
    cta: "mailto:support@pleasefindmethis.com",
    ctaLabel: "Email support",
    sections: [
      ["When to contact support", "Contact support when a checkout fails, a source reveal looks wrong, a payout is held, a refund needs review, account access breaks, or a request appears unsafe, fraudulent, duplicated, or outside marketplace rules."],
      ["What to include", "Include the request link or id, receipt email, source id if available, screenshots, messages, seller links, payment provider, and a short explanation of the problem. Specific evidence helps support compare the saved request, source, reveal, and review timeline."],
      ["Safety issues", "Report scams, counterfeit claims, prohibited goods, harassment, impersonation, stolen images, and pressure to move to unsafe private payments. Urgent issues should clearly say they are urgent in the subject line."],
    ],
    links: [["Report a problem", "/report"], ["Refund policy", "/refunds"], ["Rules", "/rules"], ["Privacy", "/privacy"]],
    schemaType: "ContactPage",
  },
  {
    path: "/rules",
    title: `Marketplace Rules | ${titleBrand}`,
    description: "Rules for what can be posted, what finders can submit, and what conduct is not allowed.",
    h1: "Marketplace rules",
    eyebrow: "Rules",
    cta: "/post/describe",
    ctaLabel: "Post a compliant request",
    sections: [
      ["Allowed requests", "Use the marketplace for exact hard-to-find goods such as sentimental replacements, discontinued products, repair parts, rare camera gear, watches, retro gaming parts, home decor, sold-out fashion, and collectibles where a valid source can be reviewed."],
      ["Prohibited requests", "Do not request illegal goods, regulated goods, weapons, tobacco, vapes, prescription medicines, stolen items, counterfeit documents, invasive surveillance tools, personal data, gift cards, financial products, crypto assets, gambling-related items, pirated media, or unsafe transactions."],
      ["Source quality", "Finders should submit current, specific, good-faith sources with enough proof for review. Expired links, copied guesses, private payment pressure, bait-and-switch listings, duplicates, or intentionally vague leads can be rejected."],
    ],
    links: [["Refund policy", "/refunds"], ["Support", "/support"], ["FAQ", "/faq"], ["Browse requests", "/browse"]],
    schemaType: "WebPage",
  },
  {
    path: "/refunds",
    title: `Refund and Cancellation Policy | ${titleBrand}`,
    description: "How funded rewards, service fees, failed finds, disputes, and refund reviews work on pleasefindmethis.com.",
    h1: "Refund and cancellation policy",
    eyebrow: "Refunds",
    cta: "/support",
    ctaLabel: "Contact support",
    sections: [
      ["Before checkout", "A request is not live until checkout succeeds. Cancelled checkout sessions can be restarted from the post flow. If a payment provider declines the checkout, the request should not be treated as funded."],
      ["No accepted source", "If no valid source or handoff is accepted within the active request window, the funded finder reward can be returned to the poster under the refund policy. Separate item purchases from third-party sellers are outside the platform checkout."],
      ["Disputes and holds", "When a source is disputed, payout release can be held while evidence is reviewed. Refund and reward decisions use the saved request, source, reveal, review, support, and dispute timeline."],
    ],
    links: [["Terms", "/terms"], ["Rules", "/rules"], ["Support", "/support"], ["FAQ", "/faq"]],
    schemaType: "WebPage",
  },
  {
    path: "/terms",
    title: `Terms of Service | ${titleBrand}`,
    description: "Marketplace terms for posters, finders, funded rewards, protected sources, reviews, and payouts.",
    h1: "Terms of service",
    eyebrow: "Terms",
    cta: "/rules",
    ctaLabel: "Read marketplace rules",
    sections: [
      ["Marketplace role", "Posters fund requests and describe exact match criteria. Finders submit source links, contacts, or handoff paths. The platform records the workflow and review trail, but it is not the seller of the requested item."],
      ["Finder payouts", "The posted reward is the finder payout. A payout can become payable after the poster accepts a valid source, confirms that a handoff worked, or a review resolves in the finder position."],
      ["Account enforcement", "The platform may remove requests, block submissions, hold payouts, refund posters, or suspend accounts for fraud, abuse, prohibited goods, duplicate sources, unsafe conduct, or payment processor policy conflicts."],
    ],
    links: [["Privacy", "/privacy"], ["Refunds", "/refunds"], ["Rules", "/rules"], ["Support", "/support"]],
    schemaType: "WebPage",
  },
  {
    path: "/privacy",
    title: `Privacy Policy | ${titleBrand}`,
    description: "How pleasefindmethis.com handles account, request, source, image, support, and payment-related data.",
    h1: "Privacy policy",
    eyebrow: "Privacy",
    cta: "/support",
    ctaLabel: "Make a privacy request",
    sections: [
      ["Data collected", "The marketplace processes account email, authentication provider, request descriptions, reference images, source submissions, proof files, support messages, dispute evidence, payment status, checkout ids, and payout state needed to operate requests."],
      ["How data is used", "Public request data powers paid listings after sensitive payment and customer fields are removed. Protected source details are stored before reveal and become visible to the poster only through the source review workflow."],
      ["User choices", "Users can request account deletion, data export, correction, or support review. Payment, fraud, dispute, tax, and marketplace-integrity records may be retained when needed for legal, financial, or operational reasons."],
    ],
    links: [["Terms", "/terms"], ["Support", "/support"], ["Rules", "/rules"], ["Report a problem", "/report"]],
    schemaType: "WebPage",
  },
  {
    path: "/report",
    title: `Report a Listing or User | ${titleBrand}`,
    description: "Report fraud, unsafe requests, prohibited goods, stolen images, impersonation, spam, or abusive behavior.",
    h1: "Report a listing, source, or user",
    eyebrow: "Report",
    cta: "mailto:support@pleasefindmethis.com",
    ctaLabel: "Email a report",
    sections: [
      ["What to report", "Report fraud, unsafe requests, prohibited goods, stolen images, impersonation, spam, abusive messages, fake sources, counterfeit claims, duplicate leads, or attempts to pressure posters and finders into unsafe off-platform payment."],
      ["Evidence to include", "Send the request link or id, user profile if available, screenshots, messages, source links, seller pages, timestamps, and a short explanation of the concern. Evidence helps support compare the report against saved request and source records."],
      ["What happens next", "Reports can lead to request removal, source invalidation, payout hold, refund review, account suspension, or a request for more evidence. Urgent safety issues should include URGENT in the subject line."],
    ],
    links: [["Support", "/support"], ["Rules", "/rules"], ["Refunds", "/refunds"], ["Privacy", "/privacy"]],
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
      description: "A public bounty board where posters fund exact hard-to-find item requests and finders submit protected source leads.",
      publisher: { "@id": organizationId },
    },
    {
      "@type": "Service",
      "@id": `${siteUrl}/#service`,
      name: "Hard-to-find item bounty marketplace",
      serviceType: "Funded request and protected source lead marketplace",
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
