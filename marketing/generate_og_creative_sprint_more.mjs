import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public/og/creative-sprint-more");
mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 630;
const imageCache = new Map();

const img = (name) => {
  if (!imageCache.has(name)) {
    const file = readFileSync(join(process.cwd(), "public/find-requests", name));
    imageCache.set(name, `data:image/jpeg;base64,${file.toString("base64")}`);
  }
  return imageCache.get(name);
};

const c = {
  bg: "#080b0a",
  paper: "#fbfcf8",
  ink: "#101412",
  muted: "#58625c",
  red: "#e9362e",
  redDark: "#2c0e0d",
  redSoft: "#fff0ef",
  green: "#0b6d3b",
  line: "#d9ded8",
};

const cards = [
  {
    slug: "11-hidden-shelf-trail",
    name: "Hidden Shelf Trail",
    headline: ["Find The", "Hidden Shelf"],
    redLine: "HIDDEN PATH",
    support: "Fund a request. Finders send source leads.",
    photo: "living-and-co-mug.jpg",
    tags: ["NOT ONLINE", "OLD STOCK", "BACK SHELF"],
    layout: "hidden",
    trigger: "Curiosity and scarcity: the item may exist outside normal search.",
  },
  {
    slug: "12-alert-graveyard",
    name: "Alert Graveyard",
    headline: ["Alerts Miss", "The Exact One"],
    redLine: "ALERT MISSED IT",
    support: "Post a funded request for protected source leads.",
    photo: "yellow-home-pillow.jpg",
    tags: ["WRONG MODEL", "NEAR MATCH", "SOLD"],
    layout: "search",
    trigger: "Alert fatigue: saved searches keep sending near matches.",
  },
  {
    slug: "13-bounty-signal",
    name: "Red Bounty Signal",
    headline: ["Post A", "Bounty Signal"],
    redLine: "NOT A STORE",
    support: "Fund the request. Let finders send leads.",
    photo: "powerpuff-cup.jpg",
    tags: ["NO STOCK", "EXACT ONLY"],
    layout: "target",
    trigger: "Category correction: this is a signal for finders, not a store.",
  },
  {
    slug: "14-someone-knows-source",
    name: "Source In Someone's Head",
    headline: ["Someone Knows", "The Source"],
    redLine: "ASK THE RIGHT FINDER",
    support: "Post the bounty. Review source leads.",
    photo: "seiko-wired-watch.jpg",
    tags: ["NOT IN INVENTORY", "SOURCE LEAD"],
    layout: "hidden",
    trigger: "Information gap: the right clue may be in someone's network.",
  },
  {
    slug: "15-comment-leak",
    name: "Comment Leak",
    headline: ["Stop Posting", "Leads In Comments"],
    redLine: "LEAD EXPOSED",
    support: "Fund the request. Submit the source privately.",
    photo: "black-shoes.jpg",
    tags: ["PUBLIC COMMENT", "DO NOT DROP THE LINK"],
    layout: "protected",
    trigger: "Loss aversion for finders: do not leak a useful lead.",
  },
  {
    slug: "16-exact-not-close",
    name: "Not The Same Thing",
    headline: ["Exact One.", "Not Close."],
    redLine: "NOT A DUPE",
    support: "Post photos and must-have details.",
    photo: "childhood-blanket.jpg",
    tags: ["WRONG COLOR", "DIFFERENT LOGO", "CLOSE DOESN'T COUNT"],
    layout: "exact",
    trigger: "Contrast bias: close enough still feels wrong.",
  },
  {
    slug: "17-forum-clue-trail",
    name: "Forum Clue Trail",
    headline: ["The Forum", "Has The Clue"],
    redLine: "CLUE IN REPLY #14",
    support: "Let collectors submit protected source leads.",
    photo: "duck-wall-art.jpg",
    tags: ["OLD THREAD", "NOT LISTED", "MATCH?"],
    layout: "forum",
    trigger: "Insider access: old community threads can hold clues.",
  },
  {
    slug: "18-dead-links",
    name: "Dead-End Search Stack",
    headline: ["Dead Links", "Don't Find It"],
    redLine: "DEAD END",
    support: "Fund an exact-item request.",
    photo: "vintage-shirt.jpg",
    tags: ["404", "SOLD", "OLD LISTING"],
    layout: "search",
    trigger: "Search frustration: old results and sold listings waste time.",
  },
  {
    slug: "19-backchannel-shelf",
    name: "Backchannel Shelf",
    headline: ["Someone May", "Know A Shelf"],
    redLine: "NOT INVENTORY",
    support: "Submit seller, shop, or shelf leads.",
    photo: "celestial-kitchen.jpg",
    tags: ["SELLER", "SHOP", "SHELF"],
    layout: "hidden",
    trigger: "Offline possibility: a source may be outside indexed listings.",
  },
  {
    slug: "20-private-source",
    name: "Protected, Not Posted",
    headline: ["Private Source.", "Not Public."],
    redLine: "NOT PUBLIC",
    support: "Source leads are recorded before reveal.",
    photo: "wallet.jpg",
    tags: ["PUBLIC COMMENT", "NOT THE LEAD"],
    layout: "protected",
    trigger: "Finder protection: useful leads should not be posted openly.",
  },
  {
    slug: "21-photo-brief",
    name: "Photo Is The Brief",
    headline: ["Match The", "Exact Photo"],
    redLine: "THIS EXACT ONE",
    support: "The reference photo becomes the request brief.",
    photo: "toddler-plush.jpg",
    tags: ["NOT CLOSE", "NOT SIMILAR"],
    layout: "exact",
    trigger: "Specificity: the photo clarifies what normal search misses.",
  },
  {
    slug: "22-one-bounty-less-noise",
    name: "Red Noise, Clear Bounty",
    headline: ["One Bounty.", "Less Noise."],
    redLine: "SCATTERED MARKETS",
    support: "Fund one exact-item request.",
    photo: "floral-skirt.jpg",
    tags: ["TOO BROAD", "NEAR MATCH", "SOLD OUT"],
    layout: "target",
    trigger: "Fragmentation relief: one request replaces noisy searching.",
  },
  {
    slug: "23-lens-misses",
    name: "Lens Misses",
    headline: ["Visual Search", "Finds Lookalikes"],
    redLine: "LOOKALIKE",
    support: "Fund a request when close matches miss.",
    photo: "living-and-co-mug.jpg",
    tags: ["NOT EXACT", "WRONG", "SIMILAR"],
    layout: "search",
    trigger: "People already tried image search and still need the exact thing.",
  },
  {
    slug: "24-locked-seller-lead",
    name: "Locked Seller Lead",
    headline: ["Seller Lead", "Stays Locked"],
    redLine: "LOCKED SELLER LEAD",
    support: "Protected until reveal.",
    photo: "red-taillight.jpg",
    tags: ["SELLER-LINK.COM/...", "HIDDEN UNTIL REVEAL"],
    layout: "locked",
    trigger: "Trust wedge: source info should not be exposed too early.",
  },
  {
    slug: "25-vague-to-target",
    name: "From Vague To Target",
    headline: ["Turn Vague", "Into Target"],
    redLine: "CLEAR TARGET",
    support: "Photos, must-haves, reward, source leads.",
    photo: "broken-plate.jpg",
    tags: ["VAGUE", "SIMILAR?", "WRONG"],
    layout: "target",
    trigger: "Clarity relief: a messy search becomes a precise bounty.",
  },
  {
    slug: "26-human-scout-needed",
    name: "Human Scout Needed",
    headline: ["Needs A", "Human Scout"],
    redLine: "HUMAN SCOUT",
    support: "Finders submit source leads.",
    photo: "seiko-wired-watch.jpg",
    tags: ["DISCONTINUED", "NOT A LISTING"],
    layout: "hidden",
    trigger: "Human knowledge beats generic listings for discontinued items.",
  },
  {
    slug: "27-same-not-similar",
    name: "Same One, Not Similar",
    headline: ["Same One.", "Not Similar."],
    redLine: "NOT A DUPE",
    support: "For the exact item with the memory attached.",
    photo: "fox-plush.jpg",
    tags: ["SAME ONE", "NOT SIMILAR"],
    layout: "exact",
    trigger: "Sentimental precision: near matches are emotionally wrong.",
  },
  {
    slug: "28-page-one-failed",
    name: "Page One Failed",
    headline: ["Not On", "Page One"],
    redLine: "NO EXACT MATCH",
    support: "Post a funded request for protected leads.",
    photo: "coin-earrings.jpg",
    tags: ["WRONG MODEL", "SOLD OUT", "NEAR MATCH"],
    layout: "search",
    trigger: "The obvious search already failed.",
  },
  {
    slug: "29-this-exact-thing",
    name: "This Exact Thing",
    headline: ["This Exact Thing.", "Nothing Else."],
    redLine: "THIS ONE",
    support: "Post the photo. Fund the bounty.",
    photo: "living-and-co-mug.jpg",
    tags: ["NOT GENERIC", "NOT SIMILAR"],
    layout: "exact",
    trigger: "Pattern interrupt: the eye locks onto one specific object.",
  },
  {
    slug: "30-bounty-beats-search",
    name: "Reason To Look",
    headline: ["Give People", "A Reason"],
    redLine: "NO REASON TO LOOK",
    support: "A funded request creates a finder incentive.",
    photo: "yellow-home-pillow.jpg",
    tags: ["BOUNTY", "INCENTIVE"],
    layout: "target",
    trigger: "Incentive shift: a bounty turns passive waiting into a prompt.",
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgShell(card, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>${esc(card.name)}</title>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000000" flood-opacity="0.28"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#1b1714" flood-opacity="0.16"/>
    </filter>
    <style>
      .sans { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      text { dominant-baseline: alphabetic; }
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <g class="sans">
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="${c.paper}" filter="url(#shadow)"/>
    ${brand()}
${body}
    <rect x="82" y="546" width="1036" height="31" rx="15.5" fill="${c.ink}"/>
    <text x="104" y="567" font-size="15" font-weight="760" fill="#ffffff">For exact, hard-to-find, and discontinued things.</text>
  </g>
</svg>
`;
}

function brand() {
  return `<g transform="translate(82 70)">
    <circle cx="18" cy="18" r="18" fill="${c.green}"/>
    <circle cx="16" cy="16" r="8.4" fill="none" stroke="#ffffff" stroke-width="4"/>
    <path d="M23 24L32 33" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <text x="48" y="26" font-size="24" font-weight="880" fill="${c.ink}">pleasefindmethis.com</text>
  </g>`;
}

function headline(card, x, y, align = "start") {
  return card.headline
    .map((line, index) => {
      const fill = index === 0 ? c.red : c.ink;
      const anchor = align === "end" ? "end" : "start";
      return `<text x="${x}" y="${y + index * 68}" text-anchor="${anchor}" font-size="62" font-weight="930" letter-spacing="0" fill="${fill}">${esc(line)}</text>`;
    })
    .join("\n");
}

function support(text, x, y, width = 520) {
  const size = width < 430 ? 21 : 23;
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" fill="${c.muted}">${esc(text)}</text>`;
}

function photo(x, y, w, h, name, label = "exact item") {
  const id = `clip-${Math.round(x)}-${Math.round(y)}-${Math.round(w)}`;
  return `<g filter="url(#soft)">
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#efe9e2"/>
    <image href="${img(name)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="none" stroke="#ffffff" stroke-width="5"/>
    <rect x="${x + 14}" y="${y + h - 47}" width="${Math.max(118, label.length * 8 + 30)}" height="32" rx="16" fill="${c.ink}" opacity="0.90"/>
    <text x="${x + 30}" y="${y + h - 26}" font-size="14" font-weight="840" fill="#ffffff">${esc(label)}</text>
  </g>`;
}

function redPanel(x, y, w, h, title) {
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${c.redDark}"/>
    <text x="${x + 32}" y="${y + 47}" font-size="16" font-weight="900" letter-spacing="2" fill="#ff6b63">${esc(title)}</text>
  </g>`;
}

function redStamp(x, y, text, r = 68, rot = -7) {
  const words = text.split(" ").filter(Boolean);
  const lines = text.length <= 9 ? [text] : words.slice(0, 4);
  const maxWordLength = Math.max(...lines.map((line) => line.length));
  const fontSize = lines.length >= 4 ? 17 : lines.length === 3 ? 19 : maxWordLength > 8 ? 18 : 22;
  const startY = lines.length === 1 ? 8 : -((lines.length - 1) * 20) / 2 + 7;
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#soft)">
    <circle cx="0" cy="0" r="${r}" fill="#fff7f6" opacity="0.94" stroke="${c.red}" stroke-width="7"/>
    <circle cx="0" cy="0" r="${r - 15}" fill="none" stroke="${c.red}" stroke-width="3.5" stroke-dasharray="8 9"/>
    ${lines.map((line, i) => `<text x="0" y="${startY + i * 20}" text-anchor="middle" font-size="${fontSize}" font-weight="950" letter-spacing="0.4" fill="${c.red}">${esc(line)}</text>`).join("\n")}
  </g>`;
}

function tag(x, y, text, fill = c.red) {
  const w = Math.max(96, text.length * 8.8 + 28);
  return `<g transform="translate(${x} ${y})">
    <rect width="${w}" height="36" rx="18" fill="${fill}"/>
    <text x="${w / 2}" y="24" text-anchor="middle" font-size="14" font-weight="900" letter-spacing="0.3" fill="#ffffff">${esc(text)}</text>
  </g>`;
}

function sourceCard(x, y, w = 330) {
  return `<g filter="url(#soft)">
    <rect x="${x}" y="${y}" width="${w}" height="106" rx="24" fill="#ffffff" stroke="#d8e2dc" stroke-width="2"/>
    <text x="${x + 28}" y="${y + 43}" font-size="15" font-weight="900" letter-spacing="1.2" fill="${c.green}">PROTECTED SOURCE</text>
    <text x="${x + 28}" y="${y + 74}" font-size="22" font-weight="860" fill="${c.ink}">source-link.com/...</text>
  </g>`;
}

function bountyPills(x, y) {
  return `${tag(x, y, "funded request", c.green)}
  <path d="M${x + 154} ${y + 18}H${x + 194}" stroke="${c.green}" stroke-width="5" stroke-linecap="round"/>
  <path d="M${x + 184} ${y + 8}L${x + 198} ${y + 18}L${x + 184} ${y + 28}" fill="none" stroke="${c.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  ${tag(x + 212, y, "protected source", c.ink)}`;
}

function miniResult(x, y, label, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#soft)">
    <rect width="150" height="58" rx="16" fill="#fff8f7" stroke="#ffd0cc" stroke-width="2"/>
    <text x="22" y="36" font-size="22" font-weight="920" fill="${c.red}">${esc(label)}</text>
  </g>`;
}

function renderCard(card) {
  const body = {
    hidden: renderHidden,
    search: renderSearch,
    target: renderTarget,
    protected: renderProtected,
    exact: renderExact,
    forum: renderForum,
    locked: renderLocked,
  }[card.layout](card);
  return svgShell(card, body);
}

function renderHidden(card) {
  return `
    ${redPanel(82, 158, 392, 350, card.redLine)}
    ${photo(122, 228, 178, 172, card.photo, "wanted")}
    ${card.tags.slice(0, 3).map((t, i) => tag(320, 228 + i * 56, t)).join("\n")}
    <path d="M478 356C560 308 630 374 704 310" fill="none" stroke="${c.red}" stroke-width="7" stroke-dasharray="10 13" stroke-linecap="round"/>
    ${headline(card, 705, 196)}
    ${support(card.support, 708, 346)}
    ${sourceCard(708, 382, 350)}
    ${redStamp(386, 432, card.redLine, 58, -8)}
  `;
}

function renderSearch(card) {
  return `
    ${redPanel(82, 176, 452, 318, card.redLine)}
    ${miniResult(128, 256, card.tags[0] ?? "NOT EXACT", -5)}
    ${miniResult(310, 246, card.tags[1] ?? "SOLD", 4)}
    ${miniResult(220, 344, card.tags[2] ?? "NEAR MATCH", -2)}
    ${redStamp(444, 306, card.redLine, 64, 7)}
    ${headline(card, 610, 194)}
    ${support(card.support, 613, 344)}
    ${photo(613, 382, 132, 112, card.photo, "exact")}
    ${sourceCard(778, 386, 300)}
  `;
}

function renderTarget(card) {
  return `
    ${redPanel(82, 178, 390, 314, card.redLine)}
    ${card.tags.slice(0, 3).map((t, i) => miniResult(122 + (i % 2) * 170, 252 + Math.floor(i / 2) * 86, t, i % 2 ? 4 : -5)).join("\n")}
    <path d="M500 352H620" stroke="${c.red}" stroke-width="10" stroke-linecap="round"/>
    <path d="M600 328L632 352L600 376" fill="none" stroke="${c.red}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    ${headline(card, 668, 176)}
    ${support(card.support, 670, 326)}
    ${photo(670, 366, 126, 112, card.photo, "exact item")}
    ${tag(824, 374, "funded request", c.green)}
    ${tag(824, 428, "protected source", c.ink)}
  `;
}

function renderProtected(card) {
  return `
    ${headline(card, 82, 182)}
    ${support(card.support, 86, 330)}
    <g>
      <rect x="82" y="372" width="430" height="118" rx="26" fill="${c.redDark}"/>
      <text x="116" y="418" font-size="16" font-weight="900" letter-spacing="1.8" fill="#ff6b63">${esc(card.tags[0] ?? "PUBLIC")}</text>
      <rect x="118" y="438" width="260" height="34" rx="17" fill="#5a2a27"/>
      <text x="140" y="461" font-size="15" font-weight="800" fill="#fff3f1">seller-link.com/item</text>
      ${redStamp(440, 430, card.redLine, 54, -6)}
    </g>
    ${photo(594, 354, 134, 126, card.photo, "request")}
    ${sourceCard(762, 366, 320)}
  `;
}

function renderExact(card) {
  return `
    ${redPanel(82, 158, 410, 350, card.redLine)}
    ${photo(134, 226, 198, 190, card.photo, "wanted")}
    ${redStamp(384, 384, card.redLine, 60, -8)}
    ${card.tags.slice(0, 2).map((t, i) => tag(134 + i * 148, 438, t)).join("\n")}
    ${headline(card, 600, 184)}
    ${support(card.support, 604, 336)}
    ${bountyPills(604, 382)}
  `;
}

function renderForum(card) {
  return `
    ${redPanel(82, 168, 454, 324, card.redLine)}
    <rect x="122" y="238" width="330" height="44" rx="12" fill="#fff8f7"/>
    <rect x="122" y="302" width="330" height="44" rx="12" fill="#fff8f7"/>
    <rect x="122" y="366" width="330" height="44" rx="12" fill="#fff8f7"/>
    <text x="146" y="267" font-size="17" font-weight="850" fill="${c.ink}">2009 thread: item ID?</text>
    <text x="146" y="331" font-size="17" font-weight="850" fill="${c.ink}">reply #14: try this shop</text>
    <text x="146" y="395" font-size="17" font-weight="850" fill="${c.ink}">PM sent</text>
    ${photo(384, 250, 104, 104, card.photo, "")}
    ${redStamp(412, 406, "MATCH?", 48, -8)}
    ${headline(card, 620, 194)}
    ${support(card.support, 623, 344)}
    ${sourceCard(623, 382, 350)}
  `;
}

function renderLocked(card) {
  return `
    ${photo(92, 250, 174, 164, card.photo, "request")}
    ${tag(102, 440, "funded request", c.green)}
    ${headline(card, 340, 176)}
    ${support(card.support, 344, 326)}
    <g filter="url(#soft)">
      <rect x="676" y="250" width="386" height="190" rx="30" fill="${c.redDark}"/>
      <text x="708" y="304" font-size="17" font-weight="900" letter-spacing="1.8" fill="#ff6b63">${esc(card.redLine)}</text>
      <rect x="714" y="334" width="294" height="58" rx="18" fill="#fff8f7"/>
      <text x="740" y="370" font-size="24" font-weight="860" fill="${c.red}">seller-link.com/...</text>
      <path d="M1002 384V354C1002 328 1021 310 1046 310C1071 310 1090 328 1090 354V384" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <rect x="990" y="376" width="112" height="78" rx="18" fill="${c.green}"/>
    </g>
  `;
}

for (const card of cards) {
  writeFileSync(join(outDir, `${card.slug}.svg`), renderCard(card));
}

const gallery = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>OG Creative Sprint More</title>
  <style>
    body { margin: 0; font: 15px/1.45 Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0b0d0c; color: #f7faf7; }
    main { max-width: 1180px; margin: 0 auto; padding: 34px 22px 60px; }
    h1 { font-size: 34px; margin: 0 0 6px; }
    p { color: #b8c3bc; margin: 0 0 28px; }
    section { display: grid; gap: 28px; }
    article { background: #151916; border: 1px solid #2a312c; border-radius: 12px; padding: 14px; }
    img { width: 100%; display: block; border-radius: 10px; background: #fff; }
    h2 { font-size: 18px; margin: 12px 4px 4px; }
    .trigger { margin: 0 4px 4px; color: #b8c3bc; }
  </style>
</head>
<body>
<main>
  <h1>pleasefindmethis.com OG Creative Sprint: 20 More</h1>
  <p>Simple red-led share-card directions based on the Hidden Path and Not Inventory winners.</p>
  <section>
${cards
  .map((card, index) => `    <article>
      <img src="./${card.slug}.png" alt="${esc(card.name)}"/>
      <h2>${index + 11}. ${esc(card.name)}</h2>
      <p class="trigger">${esc(card.trigger)}</p>
    </article>`)
  .join("\n")}
  </section>
</main>
</body>
</html>
`;
writeFileSync(join(outDir, "index.html"), gallery);

const markdown = `# OG Creative Sprint: 20 More

Generated 20 additional Open Graph / Twitter-card directions for pleasefindmethis.com.

${cards
  .map((card, index) => `## ${index + 11}. ${card.name}

- Asset: \`public/og/creative-sprint-more/${card.slug}.svg\`
- PNG: \`public/og/creative-sprint-more/${card.slug}.png\`
- Headline: ${card.headline.join(" ")}
- Support: ${card.support}
- Red hook: ${card.redLine}
- Psychological trigger: ${card.trigger}
`)
  .join("\n")}
`;
writeFileSync(join(process.cwd(), "marketing/og_creative_sprint_more_results.md"), markdown);

console.log(`Wrote ${cards.length} SVG cards to ${outDir}`);
