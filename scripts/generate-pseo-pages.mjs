import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const siteUrl = "https://pleasefindmethis.com";
const siteName = "pleasefindmethis.com";
const titleBrand = "pleasefindmethis";
const lastmod = "2026-07-10";

const appSitemapPages = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/browse", changefreq: "daily", priority: "0.9" },
  { loc: "/browse/all", changefreq: "daily", priority: "0.8" },
  { loc: "/terms", changefreq: "monthly", priority: "0.4" },
  { loc: "/privacy", changefreq: "monthly", priority: "0.4" },
];

const starterLinks = {
  sentimental: "/post/describe?starter=sentimental",
  parts: "/post/describe?starter=parts",
  fashion: "/post/describe?starter=fashion",
  gear: "/post/describe?starter=rare-gear",
};

const guidePages = [
  {
    slug: "help-me-find-this-item",
    title: "Help Me Find This Item",
    description:
      "Need help finding this exact item? Learn what details to include, where search usually fails, and how to post a free request for source suggestions.",
    h1: "Help me find this exact item",
    eyebrow: "Request writing guide",
    image: "/find-requests/duck-wall-art.jpg",
    cta: starterLinks.sentimental,
    ctaLabel: "Post a help-me-find request",
    intents: ["help me find this item", "please help me find this", "help me find this exact item"],
    intro: [
      "The strongest help-me-find requests sound simple, but they include the details other people need before they start searching.",
      "Use this workflow when you have a photo, screenshot, memory, old listing, or vague description and need the same item, not a close replacement.",
    ],
    steps: [
      ["Start with the plain request", "Write the sentence another person would recognize: help me find this exact item, where can I buy this, or please help me find this."],
      ["Add must-match details", "List the color, size, label, pattern, model, dimensions, material, compatibility, or condition details that would make a clue useful."],
      ["Share what already failed", "Include Google Lens results, marketplace searches, sold listings, Reddit posts, store names, and old links you already checked."],
      ["Name the wrong matches", "Call out dupes, similar items, unavailable pages, wrong sizes, and listings that look close but do not match."],
      ["Define a useful source", "Say whether you need a current listing, public seller path, local shop, model clue, or compatibility evidence."],
    ],
    checklist: [
      "Exact request in plain language.",
      "Reference photos, screenshots, crops, or old links.",
      "Must-match details and acceptable alternatives.",
      "Already searched places and wrong matches to avoid.",
      "Budget, shipping region, condition limits, and proof required.",
    ],
    faqs: [
      ["What should I write if I only have a photo?", "Start with the photo, then describe scale, material, color, markings, age, purchase location, and any detail that image search might miss."],
      ["Why list places I already searched?", "It keeps people from repeating obvious searches and shows which names, marketplaces, and wrong matches are already exhausted."],
      ["What does a good source suggestion include?", "A good suggestion includes the source path, proof it matches the request, price or terms, location, condition notes, and any caveats before you buy."],
    ],
  },
  {
    slug: "where-can-i-buy-this",
    title: "Where Can I Buy This?",
    description:
      "Use a clearer request when image search finds lookalikes but not the source. Turn a photo, screenshot, or memory into a useful public clue.",
    h1: "Where can I buy this exact item?",
    eyebrow: "Source clue guide",
    image: "/find-requests/celestial-kitchen.jpg",
    cta: "/post/describe",
    ctaLabel: "Post a where-can-I-buy-this request",
    intents: ["where can I buy this", "where to buy this item", "find this product from photo"],
    intro: [
      "Where can I buy this is a buying-intent question, but people still need constraints before a source clue is useful.",
      "The fastest path is to turn the image or memory into a source brief: what must match, where it can ship, what price range works, and which lookalikes are wrong.",
    ],
    steps: [
      ["Describe the item like a buyer", "Name the object, visible material, color, size, use case, brand clues, and anything you can see in the photo."],
      ["Separate source from inspiration", "If the image came from TikTok, Pinterest, Reddit, or an influencer post, say whether you need the original source or any place selling the same item."],
      ["Search beyond visual matches", "Try sold listings, regional marketplaces, archive pages, reseller titles, comments, and old product copy pulled from similar results."],
      ["Set buying limits", "Add ship-to country, budget, condition, size, seller type, and whether used, local pickup, or proxy buying is acceptable."],
      ["Ask for proof before purchase", "Require a live listing, seller contact, timestamped photos, model details, or other evidence that the source is not just a lookalike."],
    ],
    checklist: [
      "Photo, screenshot, video frame, or reference link.",
      "Whether you need the original item or the same item from another seller.",
      "Budget, shipping region, size, color, and condition constraints.",
      "Lookalikes and unavailable pages people should avoid.",
      "Evidence needed before you trust a source clue.",
    ],
    faqs: [
      ["Can someone find the source from a screenshot?", "Sometimes. A useful screenshot request should include where it came from, when you saw it, visible text, creator handle if allowed, and crop details."],
      ["Should I accept a similar item?", "Only if you say so in the request. If the exact item matters, list the details that make a similar item unacceptable."],
      ["What if the seller is local?", "A local source can still be useful when the public contact path, item evidence, location, terms, and safety caveats are documented."],
    ],
  },
  {
    slug: "find-item-from-photo",
    title: "How To Find An Exact Item From A Photo",
    description:
      "Turn a reference photo into search terms, verification checks, and a clear public request when image search only finds similar items.",
    h1: "How to find an exact item from a photo",
    eyebrow: "Photo search guide",
    image: "/find-requests/powerpuff-cup.jpg",
    cta: starterLinks.sentimental,
    ctaLabel: "Post a photo-based request",
    intents: ["find item from photo", "identify product from image", "help me find this exact item"],
    intro: [
      "A photo is useful, but image search often stops at near matches. The better workflow is to convert the image into visible clues, then ask for proof that a source matches those clues.",
      "Use this when the brand, model, tag, or SKU is unknown and you need the same item, not a generic lookalike.",
    ],
    steps: [
      ["Crop around the actual item", "Remove background clutter and run separate searches for labels, tags, hardware, patterns, and connector ends."],
      ["Describe what the photo cannot show", "Write down material, scale, age, texture, finish, country, stitching, colorway, or any wear pattern that matters."],
      ["Search with clue stacks", "Combine color, material, shape, and item type. For example: green ribbed glass pendant light brass cap."],
      ["Check sold and archived listings", "Sold pages can reveal the exact title, model number, color name, or older retail listing even when the item is gone."],
      ["Require proof before buying", "Ask for photos of labels, dimensions, condition, serial numbers, or matching details before paying a third-party seller."],
    ],
    checklist: [
      "Include the original image and any close-up crops.",
      "Say which details must match exactly.",
      "List where you already searched.",
      "Set country, budget, size, and condition limits.",
      "Reject private-message offers that do not provide proof.",
    ],
    faqs: [
      ["Why did Google Lens find similar items but not the exact one?", "Visual search matches appearance first. It can miss old product names, regional listings, sold marketplace pages, nicknames, and collector inventory."],
      ["Can I post only a photo?", "You can, but a stronger request includes must-match details, what you already tried, location, and whether similar alternatives are acceptable."],
      ["What should a public clue include?", "A useful public clue includes the listing or seller path, evidence that the item matches the photo, price or terms, region, and any condition caveats."],
    ],
  },
  {
    slug: "google-lens-similar-not-exact",
    title: "Google Lens Only Finds Similar Items? What To Try Next",
    seoTitle: "Google Lens Similar Not Exact? Try Next",
    description:
      "A practical workflow for exact-item searches when Google Lens, Pinterest, Amazon, or image search keeps returning near matches.",
    h1: "Google Lens only finds similar items? What to try next",
    eyebrow: "Failed visual search",
    image: "/find-requests/living-and-co-mug.jpg",
    cta: starterLinks.sentimental,
    ctaLabel: "Post the exact item you need",
    intents: ["Google Lens similar not exact", "image search wrong item", "find exact product not dupe"],
    intro: [
      "Near matches are useful clues, but they are not the end of the search. Treat them as a vocabulary source: extract words, brands, materials, and marketplace titles, then search outside the image result loop.",
      "This is especially important for sentimental replacements, discontinued fashion, home decor, and older consumer products.",
    ],
    steps: [
      ["Open the closest results", "Copy unique phrases from titles, alt text, and image filenames. Search those phrases in quotes."],
      ["Use marketplace-specific searches", "Try eBay, Etsy, Mercari, Poshmark, Facebook Marketplace, and sold listings with the best descriptive terms."],
      ["Search old pages", "Use the Wayback Machine, cached snippets, and date filters to recover SKUs or color names from expired product pages."],
      ["Look for regional naming", "Some products use different names in the US, UK, EU, Japan, or Australia. Search material and shape without assuming the brand."],
      ["Escalate to a human source", "If every result is close but wrong, a collector, local seller, repair shop, or niche community may know the missing term."],
    ],
    checklist: [
      "Save the closest wrong matches so people know what to avoid.",
      "State whether a close alternative is acceptable.",
      "Add old purchase location, year, or store if known.",
      "Ask for proof against the exact mismatch that keeps appearing.",
    ],
    faqs: [
      ["Should I trust a store that has the image?", "Not automatically. Search the domain with reviews and scam terms, check image reuse, and avoid sellers who only move to private payment."],
      ["Does posting a request cost anything?", "No. Posting a public request and adding public clues on pleasefindmethis are free."],
    ],
  },
  {
    slug: "how-to-ask-for-help-finding-discontinued-item",
    title: "How To Ask For Help Finding A Discontinued Item",
    seoTitle: "Ask For Help Finding A Discontinued Item",
    description:
      "Write a better hard-to-find item request with the exact details, failed searches, and proof requirements that help people source it.",
    h1: "How to ask for help finding a discontinued item",
    eyebrow: "Request writing",
    image: "/find-requests/red-taillight.jpg",
    cta: starterLinks.parts,
    ctaLabel: "Create a discontinued item request",
    intents: ["help me find discontinued item", "where to buy discontinued product", "find sold out item"],
    intro: [
      "The best requests are specific enough that people do not waste time sharing the same wrong listing. You do not need perfect information, but you do need constraints.",
      "A strong request explains what the item is, why near matches fail, where it needs to ship, and what proof would make a source acceptable.",
    ],
    steps: [
      ["Name the item in plain language", "Use the words you would say to a person first, then add brand, model, SKU, or year if known."],
      ["Separate must-haves from preferences", "Must-haves are rejection reasons. Preferences are helpful but flexible."],
      ["List failed searches", "Include marketplaces, image search tools, old product pages, and any dead listings already checked."],
      ["Add acceptance criteria", "Say what a useful public clue should include: a current listing, public seller path, local shop, donor unit, or compatibility evidence."],
      ["Set realistic buying constraints", "A clear budget, region, and condition range helps people avoid sharing unusable sources."],
    ],
    checklist: [
      "Exact name or best description.",
      "Photos from multiple angles if available.",
      "Year, country, store, brand, model, tag, or label clues.",
      "Budget for the item itself, separate from any third-party seller costs.",
      "What makes a public source clue useful.",
    ],
    faqs: [
      ["What if I do not know the brand?", "Describe visible details and where you got it. Someone may identify the brand from material, tag, shape, or old marketplace titles."],
      ["What buying constraints should I include?", "Include the item budget, shipping region, acceptable condition, and the evidence you need before trusting a third-party seller."],
    ],
  },
  {
    slug: "replace-childhood-blanket-plush-toy",
    title: "How To Replace A Lost Childhood Blanket Or Plush Toy",
    seoTitle: "Replace A Lost Blanket Or Plush Toy",
    description:
      "Search terms, proof checks, and request details for finding an exact sentimental blanket, stuffed animal, plush toy, or comfort item.",
    h1: "How to replace a lost childhood blanket or plush toy",
    eyebrow: "Sentimental replacement",
    image: "/find-requests/childhood-blanket.jpg",
    cta: starterLinks.sentimental,
    ctaLabel: "Post a sentimental replacement request",
    intents: ["replace childhood blanket", "find discontinued plush toy", "lost stuffed animal replacement"],
    intro: [
      "Sentimental searches are often about texture, size, wear, tag era, and memory, not just the object name. A close match can still feel wrong.",
      "The strongest requests describe both the visible item and the emotional non-negotiables: same print, same face, same fabric, same size, or same edition.",
    ],
    steps: [
      ["Search by species, pose, and texture", "Use terms such as floppy dog plush, terry cloth blanket, satin trim, embroidered eyes, or rattle plush."],
      ["Include size and tag clues", "A 9 inch plush and a 16 inch plush can share photos but feel completely different. Tag color and maker marks help date it."],
      ["Check sold listings and collector groups", "eBay sold listings, WorthPoint, Mercari, Etsy, and brand collector groups often surface older toys."],
      ["Accept used condition when safe", "Many exact sentimental replacements are only available used. Ask for clean photos and condition details."],
      ["Protect against DM scams", "Treat private messages carefully when they lack public proof, timestamped photos, or a legitimate seller path."],
    ],
    checklist: [
      "Animal or object type, pose, color, size, and fabric.",
      "Tag text, tag color, country of origin, or year range.",
      "Whether used condition is acceptable.",
      "Photos of the face, feet, trim, label, and unique damage.",
    ],
    faqs: [
      ["Why are plush toy searches hard?", "Many older plush toys have no searchable model name, and sellers often list them with vague titles like vintage bunny plush."],
      ["Can someone suggest a collector community instead of a store link?", "Yes, if the public path is legitimate, documented, and matches the request rules."],
    ],
  },
  {
    slug: "ask-someone-to-help-find-an-item",
    title: "How To Ask Someone To Help Find A Hard-To-Find Item",
    seoTitle: "Ask Someone To Help Find A Hard-To-Find Item",
    description:
      "Write a clear free request that helps people share useful public links, clues, seller paths, and safety notes.",
    h1: "How to ask someone to help find a hard-to-find item",
    eyebrow: "Public request guide",
    image: "/find-requests/childhood-blanket.jpg",
    cta: starterLinks.sentimental,
    ctaLabel: "Post a free request",
    intents: ["ask someone to find an item", "help finding an item online", "can anyone help me find this"],
    intro: [
      "A helpful request works best when the task is specific: find this exact item, in this region or condition, with proof the source is real.",
      "pleasefindmethis.com is built for free public requests and source suggestions. Any item purchase happens separately with the third-party source or seller.",
    ],
    steps: [
      ["Define what makes a clue useful", "A useful clue might be a live listing, public seller path, local shop, model number, or compatibility evidence."],
      ["Post the request for free", "A free public request gives people the context they need before sharing clues."],
      ["Keep context attached", "People add public links, evidence, and notes to the request so context stays connected to the original brief."],
      ["Review the match", "Treat a source as useful only when it meets the must-have details, region, condition, and price expectations."],
      ["Buy through the third party", "If the source is a marketplace or seller, complete the item purchase through that seller's permitted process."],
    ],
    checklist: [
      "Keep the request specific enough that people know what would count as useful.",
      "Keep any item purchase separate from the request workflow.",
      "Keep source links and safety notes on the public request.",
      "Avoid off-platform private payment pressure.",
    ],
    faqs: [
      ["How can someone participate?", "Anyone can add a public source link, clue, seller path, or safety note to an open request."],
      ["Can an item owner reply?", "An owner may share a public seller or listing path if it follows the rules and includes enough detail for the requester to review safely."],
    ],
  },
  {
    slug: "avoid-scams-hard-to-find-items",
    title: "How To Avoid Scams When Buying Hard-To-Find Items",
    seoTitle: "Avoid Scams Buying Hard-To-Find Items",
    description:
      "Scam checks for rare, discontinued, sentimental, and sold-out items before you trust a source, seller, private message, or storefront.",
    h1: "How to avoid scams when buying hard-to-find items",
    eyebrow: "Source safety",
    image: "/find-requests/seiko-wired-watch.jpg",
    cta: "/terms",
    ctaLabel: "Review request terms",
    intents: ["hard to find item scam", "private message seller scam", "verify item source before buying"],
    intro: [
      "Hard-to-find items attract scammers because the buyer is motivated and often emotional. The safest answer is not just a link. It is a link plus proof.",
      "Use these checks before paying a seller, trusting a private message, or acting on a source clue for a rare item.",
    ],
    steps: [
      ["Check whether the seller proves possession", "Ask for timestamped photos, alternate angles, labels, serial numbers, or a marketplace listing with buyer protection."],
      ["Search the image", "If the same product photo appears across unrelated stores, the seller may not have the item."],
      ["Inspect the domain", "Look for domain age, refund policy, contact details, copied text, unrealistic discounts, and review patterns."],
      ["Avoid pressure to move private", "Be careful when someone refuses public proof or pushes payment links before validating the item."],
      ["Verify the exact match", "Scam and low-quality sellers often send a similar item. Confirm dimensions, tags, colorway, connector, or model reference first."],
    ],
    checklist: [
      "Search the seller or domain with reviews and scam terms.",
      "Compare images against old listings.",
      "Ask for proof that matches your must-have details.",
      "Avoid payment methods with no recourse.",
      "Do not share unnecessary personal information in DMs.",
    ],
    faqs: [
      ["Are unsolicited off-platform offers always scams?", "No, but unsolicited offers for hard-to-find items are risky. Treat them as untrusted until proof is public, specific, and verifiable."],
      ["Does pleasefindmethis verify every seller?", "No. The board only displays public clues and source URLs. Requesters still need to evaluate third-party sellers and sources before buying."],
    ],
  },
  {
    slug: "find-discontinued-repair-parts",
    title: "How To Find Discontinued Repair Parts And Donor Units",
    seoTitle: "Find Discontinued Repair Parts",
    description:
      "A search workflow for replacement parts, donor units, compatible assemblies, cables, covers, hinges, and other discontinued repair items.",
    h1: "How to find discontinued repair parts and donor units",
    eyebrow: "Repair sourcing",
    image: "/find-requests/red-taillight.jpg",
    cta: starterLinks.parts,
    ctaLabel: "Post a replacement part request",
    intents: ["find discontinued repair part", "donor unit replacement part", "compatible replacement cable"],
    intro: [
      "Repair-part searches fail when people search the broken piece instead of the parent model. Start with the product model, then narrow to the part name, compatible assemblies, and donor units.",
      "A valid source should prove compatibility, not just visual similarity.",
    ],
    steps: [
      ["Find the parent model first", "Search the appliance, console, camera, or device model number before searching the part description."],
      ["Use service-manual language", "Manuals and parts diagrams often reveal the official part name, exploded-view number, or compatible assembly."],
      ["Search donor units", "Broken units sold for parts can be better sources than standalone parts, especially for covers, hinges, cables, shells, and trim."],
      ["Verify electrical safety", "For power parts, match voltage, polarity, amperage, connector shape, and certification before buying."],
      ["Ask repair communities for compatibility", "Some parts fit multiple model numbers. Others look similar but fail because of small revisions."],
    ],
    checklist: [
      "Parent product brand and full model number.",
      "Part location, measurements, markings, and photos.",
      "Whether donor units are acceptable.",
      "Compatibility proof required before acceptance.",
      "Region and shipping limits.",
    ],
    faqs: [
      ["What if the part is not sold separately?", "Search for donor units, compatible assemblies, local repair shops, and forums where someone may have a parts unit."],
      ["Can a public clue contain only a model number?", "A model number can be useful, but the strongest clue also includes a public source or search path."],
    ],
  },
  {
    slug: "source-rare-camera-gear",
    title: "How To Source Rare Camera Gear Safely",
    description:
      "Find cult cameras, film bodies, lenses, finders, battery covers, and accessories with condition checks before buying.",
    h1: "How to source rare camera gear safely",
    eyebrow: "Camera gear",
    image: "/find-requests/seiko-wired-watch.jpg",
    cta: starterLinks.gear,
    ctaLabel: "Post a rare gear request",
    intents: ["rare camera finder", "find discontinued camera part", "source film camera safely"],
    intro: [
      "Camera gear is hard to source because model names, regional variants, nicknames, condition language, and accessories vary by market.",
      "The right source is not just the cheapest listing. It is the listing with enough proof to judge condition and compatibility.",
    ],
    steps: [
      ["Search aliases and regional names", "Try formal model names, abbreviations, Japanese-market names, and common collector nicknames."],
      ["Separate body, lens, and accessory requirements", "A camera body listing may not include the finder, cap, case, strap, charger, battery, or grip you need."],
      ["Ask for functional proof", "Request sample photos, shutter behavior, light seals, fungus/haze checks, meter behavior, battery door condition, and serial numbers where relevant."],
      ["Check marketplace history", "Compare sold listings to avoid overpaying or trusting a suspiciously low price."],
      ["Watch for parts compatibility", "Finders, backs, prisms, chargers, and battery covers can vary by revision even when they look close."],
    ],
    checklist: [
      "Exact model or acceptable variants.",
      "Required accessories or parts.",
      "Condition limits and test proof.",
      "Budget, region, and import tolerance.",
      "Whether local handoff or proxy purchase is acceptable.",
    ],
    faqs: [
      ["Can someone add a Japan-market source?", "Yes, if the source terms, proxy path, condition notes, and import caveats are clear enough for the requester to review."],
      ["What proof matters most for cameras?", "Functional proof matters: photos, shutter and meter behavior, lens condition, battery compartment, and known failure points for that model."],
    ],
  },
  {
    slug: "exact-match-vs-dupe-vs-compatible-replacement",
    title: "Exact Match Vs Dupe Vs Compatible Replacement",
    seoTitle: "Exact Match Vs Dupe Or Replacement",
    description:
      "Decide whether your hard-to-find request needs the exact item, a similar style, a dupe, or a compatible replacement part.",
    h1: "Exact match vs dupe vs compatible replacement",
    eyebrow: "Request scope",
    image: "/find-requests/bunny-plush.jpg",
    cta: starterLinks.sentimental,
    ctaLabel: "Start with must-match details",
    intents: ["exact item not dupe", "similar item acceptable", "compatible replacement part"],
    intro: [
      "Many searches fail because the request and the suggested source solve different problems. A sentimental request may need the exact one. A repair request may only need a compatible part. A fashion request may allow the same style in a different price range.",
      "Choose the match type before people start searching.",
    ],
    steps: [
      ["Use exact match for identity", "Choose exact match when brand, print, tag, colorway, model, scale, or emotional feel cannot vary."],
      ["Use same model when condition can vary", "This fits cameras, watches, electronics, and collectibles where scratches or packaging may be flexible."],
      ["Use compatible replacement for repair", "This works when function matters more than matching appearance, but compatibility proof is required."],
      ["Use dupe or similar for style", "This fits fashion, decor, and lower-stakes searches where silhouette, color, and budget matter more than label."],
      ["State rejection reasons", "Explain what would make a source irrelevant before people spend time searching."],
    ],
    checklist: [
      "Must match exactly.",
      "Can vary.",
      "Similar allowed or not.",
      "Compatible allowed or not.",
      "Evidence required before acting on a clue.",
    ],
    faqs: [
      ["Should I allow similar results?", "Only if you would actually buy them. Allowing similar matches can increase submissions, but it can also waste time if you need the exact item."],
      ["Why does this matter when posting a request?", "Exact, dupe, similar, and compatible mean different things. Using the right word helps people avoid wrong clues."],
    ],
  },
  {
    slug: "best-places-search-sold-out-items",
    title: "Best Places To Search For Sold-Out Items",
    seoTitle: "Best Places To Search Sold-Out Items",
    description:
      "Where to look when an item is sold out everywhere: marketplaces, archived pages, niche forums, proxy markets, local sellers, and collector communities.",
    h1: "Best places to search for sold-out items",
    eyebrow: "Search map",
    image: "/find-requests/vintage-shirt.jpg",
    cta: starterLinks.gear,
    ctaLabel: "Post a sold-out item request",
    intents: ["sold out everywhere", "where to search sold out item", "find sold out product"],
    intro: [
      "Sold out does not always mean impossible. It often means the item moved from retail search into resale, local inventory, collector groups, old stock, or archived pages.",
      "Use this map when every obvious store says unavailable.",
    ],
    steps: [
      ["Check resale marketplaces", "Search eBay, Mercari, Poshmark, Depop, Etsy, Facebook Marketplace, Craigslist, and category-specific marketplaces."],
      ["Search sold listings", "Sold listings reveal exact titles, prices, and product names even when no active listing exists."],
      ["Look for archived retail pages", "Old product pages can reveal SKUs, color names, dimensions, and alternate photos."],
      ["Try niche communities", "Collectors, repair forums, fashion communities, and local groups often know terms that stores do not use."],
      ["Use saved alerts carefully", "Saved alerts help after you know the correct terms. They are weak when the item name is still unknown."],
    ],
    checklist: [
      "Exact item name or best description.",
      "Marketplace list already checked.",
      "Sold listing examples.",
      "Archived page clues.",
      "Budget and deadline.",
    ],
    faqs: [
      ["What if I find only sold listings?", "Use them as evidence. Other people can search for the same title, SKU, image, seller category, or collector term."],
      ["When is a public request useful?", "When the search requires niche knowledge, local clues, or repeated monitoring and you need more people to see the exact context."],
    ],
  },
];

const categoryPages = [
  {
    slug: "sentimental-items",
    title: "Find Exact Sentimental Replacements",
    description:
      "Post requests for lost, ruined, gifted, or meaningful items where the exact match matters more than a generic replacement.",
    h1: "Find exact sentimental replacements",
    eyebrow: "Sentimental items",
    image: "/find-requests/childhood-blanket.jpg",
    cta: starterLinks.sentimental,
    searches: ["replace lost childhood item", "find exact sentimental item", "help me find this exact replacement"],
    intro:
      "Use this category for objects that carry memory: blankets, mugs, wall art, jewelry, old gifts, family items, and anything where a close dupe would not feel right.",
    requestDetails: ["What happened to the original", "What must match emotionally and visually", "Old photos or purchase year", "Acceptable condition", "Country and budget"],
    commonFailures: ["Generic lookalikes", "Dead marketplace listings", "No brand or tag", "Private messages with no proof"],
    verification: ["Match pattern, size, and material", "Ask for current photos", "Check seller history", "Avoid pressure to pay before proof"],
    exampleImages: ["/find-requests/childhood-blanket.jpg", "/find-requests/wallet.jpg", "/find-requests/duck-wall-art.jpg"],
  },
  {
    slug: "plush-toys",
    title: "Find Discontinued Plush Toys And Stuffed Animals",
    seoTitle: "Find Discontinued Plush Toys",
    description:
      "Source exact plush toys, stuffed animals, retired comfort items, and older toy editions with tag, size, fabric, and face-shape clues.",
    h1: "Find discontinued plush toys and stuffed animals",
    eyebrow: "Plush and toys",
    image: "/find-requests/bunny-plush.jpg",
    cta: starterLinks.sentimental,
    searches: ["find discontinued plush toy", "replace lost stuffed animal", "find retired plush"],
    intro:
      "Plush searches depend on tiny details: eye style, pose, fabric texture, tag color, size, stuffing shape, and the difference between releases.",
    requestDetails: ["Animal or character", "Pose and size", "Tag text or tag color", "Fabric texture", "Used condition limits"],
    commonFailures: ["Wrong size", "Same animal but different face", "Modern remake instead of original", "Listings with vague titles"],
    verification: ["Face and tag close-ups", "Measured height", "Photos of wear and seams", "Marketplace seller proof"],
    exampleImages: ["/find-requests/bunny-plush.jpg", "/find-requests/fox-plush.jpg", "/find-requests/toddler-plush.jpg"],
  },
  {
    slug: "fashion",
    title: "Find Exact Clothing, Shoes, Bags, And Accessories",
    seoTitle: "Find Clothing, Shoes, Bags & Accessories",
    description:
      "Post exact-match fashion requests for sold-out clothing, discontinued colorways, screenshot outfits, shoes, bags, jewelry, and accessories.",
    h1: "Find exact clothing, shoes, bags, and accessories",
    eyebrow: "Fashion",
    image: "/find-requests/vintage-shirt.jpg",
    cta: starterLinks.fashion,
    searches: ["find dress from screenshot", "exact t-shirt from photo", "where to buy sold out shoes"],
    intro:
      "Fashion search works best when the request separates exact label requirements from acceptable style alternatives. Size, country, and condition matter early.",
    requestDetails: ["Garment type and silhouette", "Brand or label clues", "Size and fit range", "Colorway and fabric", "Exact only or similar acceptable"],
    commonFailures: ["Drop-shipped lookalikes", "Wrong fabric", "Similar cut but wrong colorway", "Unavailable influencer links"],
    verification: ["Label photo", "Measurements", "Customer photos", "Return policy", "Hardware and stitching match"],
    exampleImages: ["/find-requests/vintage-shirt.jpg", "/find-requests/floral-skirt.jpg", "/find-requests/black-shoes.jpg"],
  },
  {
    slug: "repair-parts",
    title: "Find Discontinued Repair Parts And Donor Units",
    seoTitle: "Find Repair Parts And Donor Units",
    description:
      "Source replacement parts, donor units, cables, hinges, covers, shells, plates, electronics components, and compatible assemblies.",
    h1: "Find discontinued repair parts and donor units",
    eyebrow: "Repair parts",
    image: "/find-requests/red-taillight.jpg",
    cta: starterLinks.parts,
    searches: ["find discontinued replacement part", "donor unit for repair", "compatible replacement cable"],
    intro:
      "Repair sourcing is about compatibility. The right clue should show that the part fits the parent model, not just that it looks similar in a photo.",
    requestDetails: ["Parent model number", "Part location and measurements", "Markings or connector details", "Donor unit acceptable or not", "Safety constraints"],
    commonFailures: ["Wrong revision", "Similar connector with different polarity", "Part not sold separately", "Seller does not know compatibility"],
    verification: ["Model number match", "Dimensions", "Voltage and polarity", "Service manual or parts diagram", "Return terms"],
    exampleImages: ["/find-requests/red-taillight.jpg", "/find-requests/broken-plate.jpg", "/find-requests/purple-rubber-band.jpg"],
  },
  {
    slug: "cameras",
    title: "Find Rare Cameras, Lenses, Parts, And Accessories",
    seoTitle: "Find Rare Cameras And Lens Parts",
    description:
      "Post requests for hard-to-source camera bodies, lenses, finders, battery covers, chargers, straps, film accessories, and clean working examples.",
    h1: "Find rare cameras, lenses, parts, and accessories",
    eyebrow: "Cameras",
    image: "/find-requests/seiko-wired-watch.jpg",
    cta: starterLinks.gear,
    searches: ["rare camera finder", "find film camera part", "where to buy discontinued camera"],
    intro:
      "Camera gear often requires model aliases, condition proof, regional marketplace knowledge, and careful verification before paying.",
    requestDetails: ["Exact model and aliases", "Required accessory bundle", "Condition limits", "Functional proof required", "Import or proxy tolerance"],
    commonFailures: ["Wrong variant", "Missing accessory", "Untested listing", "Fungus, haze, meter, or battery-door issues"],
    verification: ["Sample photos", "Serial or reference", "Lens and finder condition", "Shutter and meter behavior", "Seller reputation"],
    exampleImages: ["/find-requests/seiko-wired-watch.jpg", "/find-requests/red-taillight.jpg", "/find-requests/purple-rubber-band.jpg"],
  },
  {
    slug: "watches",
    title: "Find Watch References, Bracelets, Parts, And Rare Models",
    seoTitle: "Find Watch Parts And Rare Models",
    description:
      "Source hard-to-search watch references, JDM variants, bracelets, links, bezels, dials, straps, and parts with authenticity checks.",
    h1: "Find watch references, bracelets, parts, and rare models",
    eyebrow: "Watches",
    image: "/find-requests/seiko-wired-watch.jpg",
    cta: starterLinks.gear,
    searches: ["watch reference finder", "find JDM watch model", "replacement watch bracelet"],
    intro:
      "Watch searches depend on reference numbers, dial variants, bracelet codes, region-specific releases, and condition details that generic search often misses.",
    requestDetails: ["Brand and reference", "Dial color and case size", "Bracelet or part code", "Authenticity concerns", "Budget and region"],
    commonFailures: ["Similar dial, wrong reference", "Aftermarket part", "Counterfeit or replica risk", "Missing bracelet links"],
    verification: ["Caseback and dial photos", "Movement and reference numbers", "Seller history", "Service notes", "Return terms"],
    exampleImages: ["/find-requests/seiko-wired-watch.jpg", "/find-requests/coin-earrings.jpg", "/find-requests/wallet.jpg"],
  },
  {
    slug: "retro-gaming",
    title: "Find Retro Gaming Parts, Shells, Cables, And Accessories",
    seoTitle: "Find Retro Gaming Parts And Cables",
    description:
      "Post requests for console repair parts, handheld shells, battery covers, cables, controllers, manuals, adapters, and donor units.",
    h1: "Find retro gaming parts, shells, cables, and accessories",
    eyebrow: "Retro gaming",
    image: "/find-requests/purple-rubber-band.jpg",
    cta: starterLinks.parts,
    searches: ["Gameboy replacement part", "retro console cable finder", "console donor unit"],
    intro:
      "Retro gaming sources are scattered across repair shops, donor units, marketplace lots, and collector forums. Compatibility and safety checks matter.",
    requestDetails: ["Console or handheld model", "Region and revision", "Part markings", "Original or aftermarket allowed", "Compatibility proof"],
    commonFailures: ["Wrong console revision", "Unsafe power adapter", "Reproduction sold as original", "Missing cable pin details"],
    verification: ["Connector photos", "Voltage and polarity", "Revision compatibility", "Seller proof", "Condition photos"],
    exampleImages: ["/find-requests/purple-rubber-band.jpg", "/find-requests/red-taillight.jpg", "/find-requests/wallet.jpg"],
  },
  {
    slug: "home-decor",
    title: "Find Discontinued Home Decor, Lamps, Mugs, Art, And Tableware",
    seoTitle: "Find Discontinued Home Decor",
    description:
      "Source exact home goods, decor, lamps, mugs, plates, bowls, wallpaper, art prints, and discontinued collections from photos or fragments.",
    h1: "Find discontinued home decor, lamps, mugs, art, and tableware",
    eyebrow: "Home decor",
    image: "/find-requests/living-and-co-mug.jpg",
    cta: starterLinks.sentimental,
    searches: ["find discontinued mug", "replacement plate pattern", "where to buy vintage lamp"],
    intro:
      "Home goods searches rely on pattern names, maker marks, underside labels, dimensions, store collections, and old retail pages.",
    requestDetails: ["Object type and dimensions", "Pattern or motif", "Maker marks or underside photos", "Set quantity needed", "Material and finish"],
    commonFailures: ["Same shape, wrong pattern", "Wrong scale", "Sold listing only", "Unsafe fixture or electrical listing"],
    verification: ["Maker mark photo", "Measurements", "Material and finish", "Condition and chips", "Electrical certification where relevant"],
    exampleImages: ["/find-requests/living-and-co-mug.jpg", "/find-requests/celestial-kitchen.jpg", "/find-requests/dog-bowls.jpg"],
  },
];

const css = `
:root {
  color-scheme: light;
  --ink: #10130f;
  --muted: #5d665f;
  --line: #dfe5dc;
  --paper: #fffdf7;
  --soft: #f4f7ef;
  --green: #0b6d3b;
  --green-dark: #094c2b;
  --clay: #a9542b;
  --blue: #285f8f;
  --gold: #b8872c;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.55;
}

a {
  color: var(--green-dark);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
}

img {
  display: block;
  max-width: 100%;
}

.site-shell {
  min-height: 100vh;
}

.topbar,
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1rem 0;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--ink);
  font-weight: 800;
  text-decoration: none;
}

.brand img {
  width: 2rem;
  height: 2rem;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem 1rem;
  font-size: 0.94rem;
}

.hero {
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: linear-gradient(120deg, #f4f7ef 0%, #fffdf7 54%, #eef5f9 100%);
}

.hero-inner {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.72fr);
  gap: 2rem;
  align-items: center;
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 3.5rem 0;
}

.hero-inner-no-media {
  grid-template-columns: minmax(0, 1fr);
}

.eyebrow {
  color: var(--clay);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  letter-spacing: 0;
  line-height: 1.1;
}

h1 {
  max-width: 13ch;
  margin: 0.5rem 0 1rem;
  font-size: clamp(2.5rem, 7vw, 5.4rem);
}

h2 {
  margin: 0 0 1rem;
  font-size: clamp(1.55rem, 3vw, 2.25rem);
}

h3 {
  margin: 0 0 0.45rem;
  font-size: 1.05rem;
}

.lede {
  max-width: 44rem;
  color: var(--muted);
  font-size: 1.1rem;
}

.hero-image {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.hero-image img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.8rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--green-dark);
  border-radius: 8px;
  background: var(--green);
  color: #ffffff;
  font-weight: 800;
  text-decoration: none;
}

.button.secondary {
  background: transparent;
  color: var(--green-dark);
}

.content {
  width: min(1120px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 3.5rem;
}

.breadcrumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0 0 1rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.panel {
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.section {
  margin-top: 2rem;
}

.answer-block {
  display: grid;
  gap: 1rem;
  border-color: #b9d7c4;
  background: linear-gradient(135deg, #ffffff 0%, #f1f8f3 100%);
}

.answer-label {
  margin: 0;
  color: var(--green-dark);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.answer-block h2 {
  margin: 0;
}

.answer-block p {
  max-width: 62rem;
  color: #203127;
  font-size: 1.06rem;
}

.fact-list {
  display: grid;
  gap: 0.55rem;
  margin: 0;
  padding-left: 1.2rem;
  color: var(--muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.two-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.card {
  min-height: 100%;
  padding: 1rem;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
}

.card p,
.panel p {
  margin: 0;
  color: var(--muted);
}

.list {
  margin: 0;
  padding-left: 1.2rem;
}

.list li + li {
  margin-top: 0.45rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin: 1rem 0 0;
  padding: 0;
  list-style: none;
}

.tag-list li {
  padding: 0.35rem 0.55rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--soft);
  color: #314037;
  font-size: 0.9rem;
}

.image-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.image-strip img {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--line);
  border-radius: 8px;
  object-fit: cover;
  background: #ffffff;
}

.footer {
  align-items: flex-start;
  border-top: 1px solid var(--line);
  color: var(--muted);
}

.footer strong {
  color: var(--ink);
}

@media (max-width: 820px) {
  .topbar,
  .footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav {
    justify-content: flex-start;
  }

  .hero-inner,
  .grid,
  .two-grid,
  .image-strip {
    grid-template-columns: 1fr;
  }

  h1 {
    max-width: 10ch;
  }
}
`;

async function main() {
  await writeFile("pseo.css", css.trim() + "\n");
  await writeFile("guides/index.html", renderGuideIndex());
  await writeFile("requests/index.html", renderCategoryIndex());

  for (const guide of guidePages) {
    await writeFile(`guides/${guide.slug}/index.html`, renderGuidePage(guide));
  }
  await removePublicFile("guides/pay-someone-to-find-an-item/index.html");

  for (const category of categoryPages) {
    await writeFile(`requests/${category.slug}/index.html`, renderCategoryPage(category));
  }

  await writeFile("sitemap.xml", renderSitemap());
  await removePublicFile("sitemaps/pseo.xml");
}

function renderGuideIndex() {
  const items = guidePages.map((guide) => ({
    href: `/guides/${guide.slug}/`,
    title: guide.title,
    description: guide.description,
  }));

  return renderLayout({
    canonicalPath: "/guides/",
    title: "Guides For Finding Exact Items",
    description:
      "Practical guides for finding exact items from photos, replacing discontinued products, avoiding scams, and writing useful free requests.",
    h1: "Guides for finding exact items",
    eyebrow: "Search guides",
    image: "/find-requests/celestial-kitchen.jpg",
    lede:
      "Use these guides when normal search, marketplace scrolling, and image search keep returning close matches, dead listings, or risky sellers.",
    cta: "/post/describe",
    ctaLabel: "Post a request",
    secondaryCta: "/requests/",
    secondaryCtaLabel: "Browse categories",
    breadcrumbs: [["Home", "/"], ["Guides", "/guides/"]],
    showHeroImage: false,
    body: `
      <section class="section">
        <h2>Guides</h2>
        ${renderCardGrid(items)}
      </section>
    `,
    schema: collectionSchema("/guides/", "Guides For Finding Exact Items", items),
  });
}

function renderCategoryIndex() {
  const items = categoryPages.map((category) => ({
    href: `/requests/${category.slug}/`,
    title: category.title,
    description: category.description,
  }));

  return renderLayout({
    canonicalPath: "/requests/",
    title: "Hard-To-Find Item Request Categories",
    description:
      "Browse request categories for sentimental replacements, plush toys, fashion, repair parts, cameras, watches, retro gaming, and home decor.",
    h1: "Hard-to-find item request categories",
    eyebrow: "Request types",
    image: "/find-requests/duck-wall-art.jpg",
    lede:
      "Choose the closest category so your request asks for the right proof, details, and source type from the start.",
    cta: "/post/describe",
    ctaLabel: "Post a request",
    secondaryCta: "/browse/all",
    secondaryCtaLabel: "Browse live requests",
    breadcrumbs: [["Home", "/"], ["Request categories", "/requests/"]],
    showHeroImage: false,
    body: `
      <section class="section">
        <h2>Categories</h2>
        ${renderCardGrid(items)}
      </section>
    `,
    schema: collectionSchema("/requests/", "Hard-To-Find Item Request Categories", items),
  });
}

function renderGuidePage(guide) {
  const relatedGuides = guidePages
    .filter((candidate) => candidate.slug !== guide.slug)
    .slice(0, 4)
    .map((candidate) => ({
      href: `/guides/${candidate.slug}/`,
      title: candidate.title,
      description: candidate.description,
    }));
  const relatedCategories = categoryPages.slice(0, 4).map((category) => ({
    href: `/requests/${category.slug}/`,
    title: category.title,
    description: category.description,
  }));

  return renderLayout({
    canonicalPath: `/guides/${guide.slug}/`,
    title: `${guide.seoTitle ?? guide.title} | ${titleBrand}`,
    description: guide.description,
    h1: guide.h1,
    eyebrow: guide.eyebrow,
    image: guide.image,
    lede: guide.intro.join(" "),
    cta: guide.cta,
    ctaLabel: guide.ctaLabel,
    secondaryCta: "/guides/",
    secondaryCtaLabel: "All guides",
    breadcrumbs: [["Home", "/"], ["Guides", "/guides/"], [guide.title, `/guides/${guide.slug}/`]],
    showHeroImage: false,
    body: `
      <section class="section panel">
        <h2>When this guide helps</h2>
        ${renderTags(guide.intents)}
      </section>
      ${renderAnswerBlock({
        id: `${guide.slug}-answer`,
        title: "Short answer",
        answer: guideDirectAnswer(guide),
        facts: [
          `First checklist item: ${formatFactValue(guide.checklist[0])}.`,
          `Best next step: ${guide.ctaLabel.toLowerCase()}.`,
        ],
      })}
      <section class="section">
        <h2>Step-by-step workflow</h2>
        ${renderStepGrid(guide.steps)}
      </section>
      <section class="section two-grid">
        <div class="panel">
          <h2>Request checklist</h2>
          ${renderList(guide.checklist)}
        </div>
        <div class="panel">
          <h2>How public clues make the search better</h2>
          <p>Use a free public request when the item needs niche knowledge, a collector clue, repair expertise, local context, or a better search term that your own searches keep missing.</p>
        </div>
      </section>
      <section class="section">
        <h2>Questions people ask</h2>
        ${renderFaqs(guide.faqs)}
      </section>
      <section class="section">
        <h2>Related guides</h2>
        ${renderCardGrid(relatedGuides)}
      </section>
      <section class="section">
        <h2>Related request categories</h2>
        ${renderCardGrid(relatedCategories)}
      </section>
    `,
    schema: [
      breadcrumbSchema([["Home", "/"], ["Guides", "/guides/"], [guide.title, `/guides/${guide.slug}/`]]),
      webpageSchema(`/guides/${guide.slug}/`, guide.title, guide.description, "Article"),
      faqSchema(guide.faqs),
    ],
  });
}

function renderCategoryPage(category) {
  const relatedGuides = guidePages
    .filter((guide) => {
      const haystack = `${guide.title} ${guide.description} ${guide.intents.join(" ")}`.toLowerCase();
      return category.searches.some((search) => haystack.includes(search.split(" ")[0].toLowerCase()));
    })
    .slice(0, 3);
  const guideCards = (relatedGuides.length ? relatedGuides : guidePages.slice(0, 3)).map((guide) => ({
    href: `/guides/${guide.slug}/`,
    title: guide.title,
    description: guide.description,
  }));
  const siblingCards = categoryPages
    .filter((candidate) => candidate.slug !== category.slug)
    .slice(0, 4)
    .map((candidate) => ({
      href: `/requests/${candidate.slug}/`,
      title: candidate.title,
      description: candidate.description,
    }));

  return renderLayout({
    canonicalPath: `/requests/${category.slug}/`,
    title: `${category.seoTitle ?? category.title} | ${titleBrand}`,
    description: category.description,
    h1: category.h1,
    eyebrow: category.eyebrow,
    image: category.image,
    lede: category.intro,
    cta: category.cta,
    ctaLabel: "Post this type of request",
    secondaryCta: "/browse/all",
    secondaryCtaLabel: "Browse live requests",
    breadcrumbs: [["Home", "/"], ["Request categories", "/requests/"], [category.title, `/requests/${category.slug}/`]],
    showHeroImage: false,
    body: `
      <section class="section panel">
        <h2>What this category covers</h2>
        ${renderTags(category.searches)}
      </section>
      ${renderAnswerBlock({
        id: `${category.slug}-answer`,
        title: "Short answer",
        answer: categoryDirectAnswer(category),
        facts: [
          `First request detail to include: ${formatFactValue(category.requestDetails[0])}.`,
          `First verification check: ${formatFactValue(category.verification[0])}.`,
        ],
      })}
      <section class="section">
        <h2>What to include in the request</h2>
        ${renderCardGrid(category.requestDetails.map((item) => ({ title: item, description: detailDescription(item) })))}
      </section>
      <section class="section two-grid">
        <div class="panel">
          <h2>Common search failures</h2>
          ${renderList(category.commonFailures)}
        </div>
        <div class="panel">
          <h2>Verification checks</h2>
          ${renderList(category.verification)}
        </div>
      </section>
      <section class="section">
        <h2>Helpful guides</h2>
        ${renderCardGrid(guideCards)}
      </section>
      <section class="section">
        <h2>Adjacent categories</h2>
        ${renderCardGrid(siblingCards)}
      </section>
    `,
    schema: [
      breadcrumbSchema([["Home", "/"], ["Request categories", "/requests/"], [category.title, `/requests/${category.slug}/`]]),
      collectionPageSchema(`/requests/${category.slug}/`, category.title, category.description),
    ],
  });
}

function renderLayout({
  canonicalPath,
  title,
  description,
  h1,
  eyebrow,
  image,
  lede,
  cta,
  ctaLabel,
  secondaryCta,
  secondaryCtaLabel,
  breadcrumbs,
  body,
  schema,
  showHeroImage = true,
}) {
  const canonicalUrl = absoluteUrl(canonicalPath);
  const imageUrl = absoluteUrl(image);
  const socialImage = getSocialImageMeta(image, h1);
  const schemas = [siteEntitySchema(), ...normalizeSchemas(schema)];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index,follow" />
    <meta name="theme-color" content="#0b6d3b" />
    <meta name="description" content="${attr(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(description)}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="${socialImage.type}" />
    <meta property="og:image:width" content="${socialImage.width}" />
    <meta property="og:image:height" content="${socialImage.height}" />
    <meta property="og:image:alt" content="${attr(socialImage.alt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="twitter:image:alt" content="${attr(socialImage.alt)}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <link rel="icon" type="image/png" href="/magnifying-glass.png" />
    <link rel="stylesheet" href="/pseo.css" />
    <title>${escapeHtml(title)}</title>
    ${schemas.map((entry) => `<script type="application/ld+json">${jsonLd(entry)}</script>`).join("\n    ")}
  </head>
  <body>
    <div class="site-shell">
      ${renderTopbar()}
      <header class="hero">
        <div class="hero-inner${showHeroImage ? "" : " hero-inner-no-media"}">
          <div>
            <nav class="breadcrumbs" aria-label="Breadcrumbs">${renderBreadcrumbs(breadcrumbs)}</nav>
            <span class="eyebrow">${escapeHtml(eyebrow)}</span>
            <h1>${escapeHtml(h1)}</h1>
            <p class="lede">${escapeHtml(lede)}</p>
            <div class="cta-row">
              <a class="button" href="${attr(cta)}">${escapeHtml(ctaLabel)}</a>
              <a class="button secondary" href="${attr(secondaryCta)}">${escapeHtml(secondaryCtaLabel)}</a>
            </div>
          </div>
          ${
            showHeroImage
              ? `<figure class="hero-image">
            <img src="${attr(image)}" alt="${attr(`${h1} reference image`)}" />
          </figure>`
              : ""
          }
        </div>
      </header>
      <main class="content">
        ${body}
      </main>
      ${renderFooter()}
    </div>
  </body>
</html>
`;
}

function getSocialImageMeta(image, h1) {
  const normalized = String(image).toLowerCase();
  const isSquareRequestImage = normalized.includes("/find-requests/");
  const isSvg = normalized.endsWith(".svg");

  return {
    width: isSquareRequestImage ? 900 : 1200,
    height: isSquareRequestImage ? 900 : 630,
    type: isSvg ? "image/svg+xml" : normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") ? "image/jpeg" : "image/png",
    alt: `${h1} reference image from ${siteName}`,
  };
}

function renderTopbar() {
  return `
      <div class="topbar">
        <a class="brand" href="/">
          <img src="/magnifying-glass.png" alt="" />
          <span>${siteName}</span>
        </a>
        <nav class="nav" aria-label="Primary">
          <a href="/browse/all">Browse</a>
          <a href="/requests/">Categories</a>
          <a href="/guides/">Guides</a>
          <a href="/post/describe">Post request</a>
        </nav>
      </div>`;
}

function renderFooter() {
  return `
      <footer class="footer">
        <div>
          <strong>${siteName}</strong>
          <div>Free requests, source suggestions, and practical guides for exact-item searches.</div>
        </div>
        <nav class="nav" aria-label="Footer">
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </nav>
      </footer>`;
}

function renderBreadcrumbs(links) {
  return links
    .map(([label, href], index) => {
      const separator = index === 0 ? "" : "<span>/</span>";
      return `${separator}<a href="${attr(href)}">${escapeHtml(label)}</a>`;
    })
    .join("");
}

function renderStepGrid(steps) {
  return `<div class="grid">${steps
    .map(([title, description], index) => `<article class="card"><h3>${index + 1}. ${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p></article>`)
    .join("")}</div>`;
}

function renderCardGrid(items) {
  return `<div class="grid">${items
    .map((item) => {
      const title = escapeHtml(item.title);
      const description = escapeHtml(item.description);
      return `<article class="card"><h3>${item.href ? `<a href="${attr(item.href)}">${title}</a>` : title}</h3><p>${description}</p></article>`;
    })
    .join("")}</div>`;
}

function renderList(items) {
  return `<ul class="list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTags(items) {
  return `<ul class="tag-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderFaqs(faqs) {
  return `<div class="two-grid">${faqs
    .map(([question, answer]) => `<article class="card"><h3>${escapeHtml(question)}</h3><p>${escapeHtml(answer)}</p></article>`)
    .join("")}</div>`;
}

function renderAnswerBlock({ id, title, answer, facts }) {
  return `
      <section class="section panel answer-block" aria-labelledby="${attr(id)}">
        <p class="answer-label">Quick summary</p>
        <h2 id="${attr(id)}">${escapeHtml(title)}</h2>
        <p>${escapeHtml(answer)}</p>
        ${facts?.length ? `<ul class="fact-list">${facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>` : ""}
      </section>`;
}

function renderImageStrip(images, title) {
  return `<div class="image-strip">${images
    .map((image, index) => `<img src="${attr(image)}" alt="${attr(`${title} example ${index + 1}`)}" />`)
    .join("")}</div>`;
}

function guideDirectAnswer(guide) {
  return `${guide.h1}: ${guide.intro[0]} A useful request names the exact match, the wrong matches already found, the buying constraints, and the evidence a public clue should include before the source is trusted.`;
}

function categoryDirectAnswer(category) {
  const details = category.requestDetails.slice(0, 3).join(", ").toLowerCase();
  const checks = category.verification.slice(0, 2).join(" and ").toLowerCase();
  return `${category.h1} requests work best when normal search misses the exact item and another person may know the right listing, seller, shop, donor unit, or collector clue. Include ${details}; verify clues with ${checks}.`;
}

function formatFactValue(value) {
  return String(value).trim().replace(/[.!?]+$/g, "");
}

function detailDescription(item) {
  const lower = item.toLowerCase();

  if (lower.includes("proof") || lower.includes("verification")) {
    return "Explain what evidence makes a public source clue useful before people reply.";
  }

  if (lower.includes("budget") || lower.includes("region") || lower.includes("country")) {
    return "Set the buying constraints early so people do not share unusable sources.";
  }

  if (lower.includes("model") || lower.includes("reference") || lower.includes("number")) {
    return "Exact identifiers reduce wrong clues and help search across marketplaces and old pages.";
  }

  if (lower.includes("condition") || lower.includes("size") || lower.includes("color") || lower.includes("fabric")) {
    return "Small visual and condition differences often decide whether a source is useful or another near match.";
  }

  if (lower.includes("tag") || lower.includes("label") || lower.includes("mark")) {
    return "Labels and marks can reveal older product names, manufacturer clues, and searchable listing terms.";
  }

  if (lower.includes("accessory") || lower.includes("bundle") || lower.includes("set")) {
    return "List missing pieces early so people do not share a source that is correct but incomplete.";
  }

  return "Describe this constraint in plain language so people can filter wrong clues before replying.";
}

function renderSitemap() {
  const urls = [
    ...appSitemapPages,
    { loc: "/guides/", changefreq: "monthly", priority: "0.8" },
    ...guidePages.map((guide) => ({ loc: `/guides/${guide.slug}/`, changefreq: "monthly", priority: "0.7" })),
    { loc: "/requests/", changefreq: "monthly", priority: "0.8" },
    ...categoryPages.map((category) => ({ loc: `/requests/${category.slug}/`, changefreq: "monthly", priority: "0.7" })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${absoluteUrl(url.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function collectionSchema(pathname, name, items) {
  return [
    breadcrumbSchema([["Home", "/"], [name, pathname]]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${absoluteUrl(pathname)}#webpage`,
      url: absoluteUrl(pathname),
      name,
      description: `A collection of ${name.toLowerCase()} on ${siteName}.`,
      isPartOf: { "@id": `${siteUrl}/#website` },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(item.href),
          name: item.title,
        })),
      },
    },
  ];
}

function collectionPageSchema(pathname, name, description) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(pathname)}#webpage`,
    url: absoluteUrl(pathname),
    name,
    description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

function siteEntitySchema() {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const serviceId = `${siteUrl}/#service`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteName,
        url: siteUrl,
        logo: absoluteUrl("/magnifying-glass.png"),
        description:
          "pleasefindmethis.com is a free public request board for hard-to-find items and source suggestions.",
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email: "support@pleasefindmethis.com",
          },
        ],
        knowsAbout: [
          "hard-to-find items",
          "discontinued products",
          "source suggestions",
          "free request boards",
          "rare camera gear",
          "sentimental replacements",
          "repair parts",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: siteName,
        url: siteUrl,
        description:
          "A free public request board where people post exact hard-to-find item requests and anyone can add public clues.",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "WebApplication",
        "@id": serviceId,
        name: "Hard-to-find item request board",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web",
        url: siteUrl,
        publisher: { "@id": organizationId },
        isAccessibleForFree: true,
        description:
          "People create free public requests for exact items, and anyone can add public source links, seller paths, clues, or safety notes.",
        termsOfService: absoluteUrl("/terms"),
      },
    ],
  };
}

function webpageSchema(pathname, name, description, type = "WebPage") {
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${absoluteUrl(pathname)}#webpage`,
    url: absoluteUrl(pathname),
    headline: name,
    name,
    description,
    dateModified: lastmod,
    inLanguage: "en",
    isPartOf: { "@id": `${siteUrl}/#website` },
    publisher: { "@id": `${siteUrl}/#organization` },
    author: { "@id": `${siteUrl}/#organization` },
  };
}

function breadcrumbSchema(links) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: links.map(([name, href], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(href),
    })),
  };
}

function faqSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

function absoluteUrl(pathname) {
  return new URL(pathname, siteUrl).href;
}

function normalizeSchemas(schema) {
  return (Array.isArray(schema) ? schema : [schema]).flat().filter(Boolean);
}

async function writeFile(relativePath, content) {
  const filePath = path.join(publicDir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function removePublicFile(relativePath) {
  await fs.rm(path.join(publicDir, relativePath), { force: true });
}

function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function attr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

await main();
