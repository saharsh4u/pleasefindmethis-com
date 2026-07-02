import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "public/og/creative-sprint");
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

const colors = {
  ink: "#101412",
  muted: "#57615b",
  paper: "#fbfcf8",
  green: "#0b6d3b",
  green2: "#19be64",
  cyan: "#2aa4bc",
  gold: "#d69225",
  red: "#c23b2b",
  red2: "#ef3831",
  blueBlack: "#090d0b",
  line: "#d9ded8",
};

const cards = [
  {
    slug: "01-lookalike-loop",
    name: "Lookalike Loop vs Finder Network",
    trigger: "Contrast bias and loss aversion: near-matches feel costly, a protected human finder path feels cleaner.",
    headline: "Visual search finds lookalikes.",
    subhead: "Finders hunt the exact item.",
    render: renderLookalikeLoop,
  },
  {
    slug: "02-memory-match",
    name: "The One That Matches the Memory",
    trigger: "Emotional closure: the viewer feels the difference between close and exact.",
    headline: "Find the exact item you lost",
    subhead: "Funded requests for hard-to-find and discontinued things.",
    render: renderMemoryMatch,
  },
  {
    slug: "03-model-match-bounty",
    name: "Model Match Bounty",
    trigger: "Authenticity anxiety: collectors fear the wrong model, wrong finish, or wrong spec.",
    headline: "Find the exact discontinued cult camera",
    subhead: "Post a funded request. Finders submit a protected source.",
    render: renderModelMatch,
  },
  {
    slug: "04-almost-fit-part",
    name: "Almost-Fit Burn Rate",
    trigger: "Loss aversion: wrong repair parts mean wasted money, returns, and delays.",
    headline: "Don't buy the almost-fit part",
    subhead: "Post photos, model details, and a bounty for the exact item.",
    render: renderAlmostFit,
  },
  {
    slug: "05-locked-lead-paid-reveal",
    name: "Locked Lead, Paid Reveal",
    trigger: "Finder loss aversion: do not give away a valuable source lead for free.",
    headline: "Find the exact item.",
    subhead: "Keep your source protected.",
    render: renderLockedLead,
  },
  {
    slug: "06-public-leak-protected-source",
    name: "Public Leak vs Protected Source",
    trigger: "Trust contrast: public DMs feel messy, a source recorded before reveal feels structured.",
    headline: "Don't DM your bounty away.",
    subhead: "Exact item leads stay protected until source reveal.",
    render: renderPublicLeak,
  },
  {
    slug: "07-market-maze",
    name: "Market Maze vs Funded Bounty",
    trigger: "Fragmentation relief: one request replaces checking scattered marketplaces alone.",
    headline: "Your exact item is hiding across 6 markets.",
    subhead: "Post one funded request. Let finders search.",
    render: renderMarketMaze,
  },
  {
    slug: "08-public-trail-private-lead",
    name: "Public Trail, Private Lead",
    trigger: "Visible workflow proof without fake metrics: request, protected source, source reveal.",
    headline: "Funded requests become solved finds",
    subhead: "Public bounty pages. Private source leads.",
    render: renderPublicTrail,
  },
  {
    slug: "09-hidden-path",
    name: "The Hidden Path Card",
    trigger: "Curiosity gap: the item is not impossible, the path is just hidden.",
    headline: "Someone knows where your exact item is.",
    subhead: "Post a funded request for a hard-to-find item.",
    render: renderHiddenPath,
  },
  {
    slug: "10-not-inventory",
    name: "Not Inventory. Bounty Coordination.",
    trigger: "Pattern interrupt and category correction: this is not another store.",
    headline: "Not another marketplace.",
    subhead: "A bounty for the exact item.",
    render: renderNotInventory,
  },
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function svgShell(title, body, bg = colors.blueBlack) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>${esc(title)}</title>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000000" flood-opacity="0.26"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#102018" flood-opacity="0.14"/>
    </filter>
    <filter id="hard" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="4" flood-color="#000000" flood-opacity="0.20"/>
    </filter>
    <linearGradient id="greenGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b6d3b"/>
      <stop offset="100%" stop-color="#2aa4bc"/>
    </linearGradient>
    <linearGradient id="warmPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fff4e3"/>
    </linearGradient>
    <linearGradient id="redPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffafa"/>
      <stop offset="100%" stop-color="#fff0ee"/>
    </linearGradient>
    <linearGradient id="coolPanel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eafff6"/>
    </linearGradient>
    <clipPath id="photoClip"><rect x="0" y="0" width="1" height="1" rx="0"/></clipPath>
    <style>
      .sans { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      .mono { font-family: "SFMono-Regular", "Roboto Mono", Consolas, monospace; }
      text { dominant-baseline: alphabetic; }
    </style>
  </defs>
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <g class="sans">
${body}
  </g>
</svg>
`;
}

function brand(x = 72, y = 70, fill = colors.ink) {
  return `<g transform="translate(${x} ${y})">
    <circle cx="18" cy="18" r="18" fill="${colors.green}"/>
    <circle cx="16" cy="16" r="8.4" fill="none" stroke="#ffffff" stroke-width="4"/>
    <path d="M23 24L32 33" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <text x="48" y="26" font-size="24" font-weight="880" fill="${fill}">pleasefindmethis.com</text>
  </g>`;
}

function bigText(lines, x, y, size = 54, fill = colors.ink, weight = 930, leading = 1.05) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * size * leading}" font-size="${size}" font-weight="${weight}" letter-spacing="0" fill="${fill}">${esc(line)}</text>`)
    .join("\n");
}

function smallText(lines, x, y, size = 22, fill = colors.muted, weight = 690, leading = 1.25) {
  return lines
    .map((line, index) => `<text x="${x}" y="${y + index * size * leading}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`)
    .join("\n");
}

function pill(x, y, text, fill = colors.ink, color = "#fff", w = null) {
  const width = w ?? Math.max(92, text.length * 9.5 + 34);
  return `<g transform="translate(${x} ${y})">
    <rect width="${width}" height="38" rx="19" fill="${fill}"/>
    <text x="${width / 2}" y="25" text-anchor="middle" font-size="15" font-weight="850" letter-spacing="0.6" fill="${color}">${esc(text)}</text>
  </g>`;
}

function imageBlock(x, y, w, h, href, label = "", stroke = "#fff") {
  const id = `clip${Math.round(x)}${Math.round(y)}${Math.round(w)}${Math.round(h)}`;
  return `<g filter="url(#soft)">
    <clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/></clipPath>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="#e8ede7"/>
    <image href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="none" stroke="${stroke}" stroke-width="5"/>
    ${label ? `<rect x="${x + 12}" y="${y + h - 48}" width="${Math.max(120, label.length * 9 + 30)}" height="33" rx="16" fill="#101412" opacity="0.88"/>
    <text x="${x + 28}" y="${y + h - 26}" font-size="14" font-weight="820" fill="#ffffff">${esc(label)}</text>` : ""}
  </g>`;
}

function stamp(x, y, lines, color = colors.red2, rotate = -8, r = 70) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate})" filter="url(#hard)">
    <circle cx="0" cy="0" r="${r}" fill="#ffffff" opacity="0.90" stroke="${color}" stroke-width="7"/>
    <circle cx="0" cy="0" r="${r - 16}" fill="none" stroke="${color}" stroke-width="3.5" stroke-dasharray="8 9"/>
    ${lines.map((line, i) => `<text x="0" y="${lines.length === 1 ? 8 : -8 + i * 30}" text-anchor="middle" font-size="${lines.length === 1 ? 24 : 22}" font-weight="950" letter-spacing="0.8" fill="${color}">${esc(line)}</text>`).join("\n")}
    <path d="M-${r - 30} -${r - 34}H${r - 30}M-${r - 30} ${r - 31}H${r - 30}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}

function requestCard(x, y, w, h, title, reward, imageName, accent = colors.green) {
  return `<g transform="translate(${x} ${y})" filter="url(#soft)">
    <rect width="${w}" height="${h}" rx="24" fill="#ffffff"/>
    ${imageBlock(18, 18, 132, h - 36, img(imageName), "", "#ffffff").replaceAll('filter="url(#soft)"', "")}
    <text x="170" y="51" font-size="14" font-weight="900" letter-spacing="1.2" fill="${accent}">FUNDED REQUEST</text>
    <text x="170" y="87" font-size="25" font-weight="910" fill="${colors.ink}">${esc(title)}</text>
    <rect x="170" y="110" width="128" height="36" rx="18" fill="${accent}"/>
    <text x="234" y="134" text-anchor="middle" font-size="16" font-weight="880" fill="#fff">${esc(reward)}</text>
    <text x="170" y="170" font-size="16" font-weight="720" fill="${colors.muted}">Protected source before reveal</text>
  </g>`;
}

function flowChips(x, y, labels, accent = colors.green) {
  let dx = x;
  return labels
    .map((label, index) => {
      const w = Math.max(116, label.length * 9 + 30);
      const chip = `<g transform="translate(${dx} ${y})">
        <rect width="${w}" height="40" rx="20" fill="${index === 0 ? accent : "#ffffff"}" stroke="${index === 0 ? accent : "#d6e1da"}" stroke-width="2"/>
        <text x="${w / 2}" y="26" text-anchor="middle" font-size="14" font-weight="840" fill="${index === 0 ? "#ffffff" : colors.ink}">${esc(label)}</text>
      </g>
      ${index < labels.length - 1 ? `<path d="M${dx + w + 8} ${y + 20}H${dx + w + 34}" stroke="${accent}" stroke-width="4" stroke-linecap="round"/><path d="M${dx + w + 28} ${y + 12}L${dx + w + 36} ${y + 20}L${dx + w + 28} ${y + 28}" fill="none" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
      dx += w + 46;
      return chip;
    })
    .join("\n");
}

function miniListing(x, y, w, h, label, note, imageName = "living-and-co-mug.jpg", rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})" filter="url(#soft)">
    <rect width="${w}" height="${h}" rx="18" fill="#ffffff" stroke="#eed8d4" stroke-width="2"/>
    <clipPath id="ml${Math.round(x)}${Math.round(y)}"><rect x="14" y="14" width="${w - 28}" height="${Math.max(74, h - 72)}" rx="14"/></clipPath>
    <image href="${img(imageName)}" x="14" y="14" width="${w - 28}" height="${Math.max(74, h - 72)}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ml${Math.round(x)}${Math.round(y)})"/>
    <text x="18" y="${h - 34}" font-size="16" font-weight="870" fill="${colors.ink}">${esc(label)}</text>
    <text x="18" y="${h - 13}" font-size="13" font-weight="790" fill="${colors.red}">${esc(note)}</text>
  </g>`;
}

function renderLookalikeLoop() {
  const body = `
    <circle cx="108" cy="96" r="210" fill="${colors.green}" opacity="0.17"/>
    <circle cx="1050" cy="500" r="260" fill="${colors.cyan}" opacity="0.16"/>
    <rect x="46" y="38" width="1108" height="554" rx="34" fill="${colors.paper}" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${pill(920, 66, "BOUNTY BOARD", colors.ink, "#fff", 198)}
    ${bigText(["Visual search finds lookalikes."], 82, 150, 50)}
    ${smallText(["Finders hunt the exact item through protected source leads."], 86, 190, 23)}
    <rect x="78" y="225" width="500" height="300" rx="26" fill="url(#redPanel)" stroke="#efd7d3" stroke-width="2"/>
    <text x="110" y="272" font-size="15" font-weight="920" letter-spacing="2" fill="${colors.red}">VISUAL SEARCH</text>
    ${miniListing(110, 292, 134, 132, "similar", "wrong color", "living-and-co-mug.jpg", -5)}
    ${miniListing(258, 282, 134, 132, "near", "newer model", "powerpuff-cup.jpg", 4)}
    ${miniListing(405, 302, 134, 132, "close", "not exact", "celestial-kitchen.jpg", -2)}
    ${stamp(445, 425, ["NOT", "EXACT"], colors.red2, -9, 72)}
    <rect x="622" y="225" width="500" height="300" rx="26" fill="url(#coolPanel)" stroke="#cbe9dc" stroke-width="2"/>
    <text x="654" y="272" font-size="15" font-weight="920" letter-spacing="2" fill="${colors.green}">PROTECTED FINDER NETWORK</text>
    ${requestCard(652, 295, 300, 180, "Discontinued mug", "Bounty $75", "living-and-co-mug.jpg")}
    <g transform="translate(944 305)">
      <circle cx="26" cy="24" r="20" fill="${colors.green}"/><text x="26" y="31" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">A</text>
      <circle cx="96" cy="70" r="20" fill="${colors.cyan}"/><text x="96" y="77" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">M</text>
      <circle cx="38" cy="124" r="20" fill="${colors.gold}"/><text x="38" y="131" text-anchor="middle" font-size="16" font-weight="900" fill="#fff">J</text>
      <path d="M44 32L140 78M114 73L140 78M57 120L140 92" stroke="#9fcfba" stroke-width="4" stroke-linecap="round"/>
      <rect x="128" y="58" width="104" height="58" rx="17" fill="#ffffff" stroke="#cbe9dc" stroke-width="2"/>
      <text x="180" y="83" text-anchor="middle" font-size="13" font-weight="850" fill="${colors.green}">source</text>
      <text x="180" y="102" text-anchor="middle" font-size="12" font-weight="760" fill="${colors.muted}">recorded</text>
    </g>
    ${stamp(1040, 272, ["SOURCE", "READY"], colors.green2, 8, 68)}
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">Protected source bounties for exact, discontinued, hard-to-search things.</text>`;
  return svgShell("Lookalike Loop vs Finder Network", body);
}

function renderMemoryMatch() {
  const body = `
    <rect width="${W}" height="${H}" fill="#fbf7f0"/>
    <path d="M0 0H1200V630H0Z" fill="#fbf7f0"/>
    <circle cx="160" cy="90" r="180" fill="${colors.gold}" opacity="0.16"/>
    <circle cx="1030" cy="490" r="240" fill="${colors.green}" opacity="0.13"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fffdf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${pill(930, 66, "BOUNTY OPEN", colors.gold, "#101412", 180)}
    ${bigText(["Find the exact item", "you lost"], 82, 156, 58)}
    ${smallText(["A funded request gives niche finders a reason to help."], 86, 267, 23)}
    <g transform="translate(82 310)">
      <rect width="486" height="210" rx="28" fill="#2c231f"/>
      ${imageBlock(28, 24, 180, 156, img("toddler-plush.jpg"), "old photo", "#fff")}
      <rect x="236" y="26" width="220" height="68" rx="18" fill="#44352f"/>
      <text x="258" y="67" font-size="24" font-weight="900" fill="#fff0dc">CLOSE, BUT NOT IT</text>
      <path d="M242 122C294 138 338 98 450 154" stroke="#f05b4f" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 12"/>
      ${stamp(388, 150, ["CLOSE"], colors.red2, -8, 60)}
    </g>
    <g transform="translate(632 300)">
      <rect width="486" height="230" rx="28" fill="#effcf5" stroke="#cbe9dc" stroke-width="2"/>
      ${imageBlock(30, 26, 188, 176, img("childhood-blanket.jpg"), "exact brief", "#fff")}
      <text x="246" y="70" font-size="16" font-weight="900" letter-spacing="1.6" fill="${colors.green}">PROTECTED LEAD</text>
      <text x="246" y="108" font-size="32" font-weight="930" fill="${colors.ink}">Exact source</text>
      <text x="246" y="143" font-size="32" font-weight="930" fill="${colors.ink}">lead</text>
      <text x="246" y="174" font-size="19" font-weight="730" fill="${colors.muted}">Funded request + finder payout</text>
      ${pill(246, 190, "Not a dupe", colors.green, "#fff", 128)}
      ${stamp(438, 36, ["MATCH"], colors.green2, 8, 35)}
    </g>
    <path d="M560 414C598 388 612 386 646 390" stroke="${colors.green}" stroke-width="7" stroke-linecap="round"/>
    <path d="M635 375L654 389L633 400" fill="none" stroke="${colors.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">Post a bounty when normal search only finds almost-right replacements.</text>`;
  return svgShell("The One That Matches the Memory", body, "#fbf7f0");
}

function renderModelMatch() {
  const body = `
    <rect width="${W}" height="${H}" fill="#0b0e12"/>
    <circle cx="1010" cy="130" r="220" fill="#1d6a72" opacity="0.22"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#11161a" filter="url(#shadow)"/>
    ${brand(78, 68, "#ffffff")}
    ${pill(890, 66, "COLLECTOR BOUNTY", "#ffffff", colors.ink, 226)}
    ${bigText(["Find the exact", "discontinued cult camera"], 82, 155, 52, "#ffffff")}
    ${smallText(["Model-specific bounty hunts", "with protected source reveal."], 86, 252, 23, "#b7c4bd")}
    <rect x="82" y="312" width="500" height="206" rx="26" fill="#201414" stroke="#61302c" stroke-width="2"/>
    <text x="112" y="354" font-size="15" font-weight="920" letter-spacing="2" fill="#ff756d">LOOKALIKE MATCHES</text>
    ${miniListing(112, 376, 126, 112, "silver body", "wrong finish", "seiko-wired-watch.jpg", -4)}
    ${miniListing(252, 365, 126, 112, "not AF-D", "wrong spec", "black-shoes.jpg", 3)}
    ${miniListing(392, 382, 126, 112, "sold", "dead lead", "wallet.jpg", -2)}
    ${stamp(504, 370, ["WRONG", "MODEL"], "#ff4f46", -7, 66)}
    <rect x="625" y="238" width="493" height="280" rx="30" fill="#f7fffb"/>
    ${imageBlock(654, 272, 190, 194, img("seiko-wired-watch.jpg"), "exact item", "#ffffff")}
    <text x="875" y="292" font-size="15" font-weight="920" letter-spacing="1.6" fill="${colors.green}">EXACT ITEM LEAD</text>
    <text x="875" y="333" font-size="32" font-weight="930" fill="${colors.ink}">Contax T2 Black</text>
    <text x="875" y="365" font-size="18" font-weight="760" fill="${colors.muted}">Exact model, finish, condition.</text>
    ${pill(875, 388, "Funded request", colors.green, "#fff", 158)}
    ${pill(875, 438, "Protected source", colors.ink, "#fff", 165)}
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="#ffffff"/>
    <text x="104" y="566" font-size="15" font-weight="790" fill="${colors.ink}">Start a bounty for rare cameras, watches, parts, and collector-grade exact matches.</text>`;
  return svgShell("Model Match Bounty", body, "#0b0e12");
}

function renderAlmostFit() {
  const body = `
    <rect width="${W}" height="${H}" fill="#111412"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fbfcf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${pill(893, 66, "REPAIR BOUNTY", colors.ink, "#fff", 215)}
    ${bigText(["Don't buy the", "almost-fit part"], 82, 154, 56)}
    ${smallText(["Post photos, model details, and a bounty for the exact item."], 86, 264, 23)}
    <rect x="82" y="310" width="500" height="214" rx="28" fill="#fff4f1" stroke="#eed8d4" stroke-width="2"/>
    ${imageBlock(112, 340, 168, 146, img("red-taillight.jpg"), "near match", "#ffffff")}
    <path d="M310 360H500M310 405H482M310 450H454" stroke="#e3c6c0" stroke-width="10" stroke-linecap="round"/>
    <text x="312" y="386" font-size="20" font-weight="900" fill="${colors.red}">Same shape.</text>
    <text x="312" y="431" font-size="20" font-weight="900" fill="${colors.red}">Wrong connector.</text>
    ${stamp(492, 368, ["ALMOST", "FIT"], colors.red2, -8, 60)}
    <rect x="625" y="310" width="493" height="214" rx="28" fill="#effcf5" stroke="#cbe9dc" stroke-width="2"/>
    ${imageBlock(654, 340, 168, 146, img("broken-plate.jpg"), "model detail", "#ffffff")}
    <text x="850" y="352" font-size="15" font-weight="920" letter-spacing="1.4" fill="${colors.green}">EXACT ITEM REQUEST</text>
    <text x="850" y="392" font-size="24" font-weight="930" fill="${colors.ink}">Photos + model notes</text>
    <text x="850" y="428" font-size="18" font-weight="740" fill="${colors.muted}">Protected source lead submitted.</text>
    ${pill(850, 452, "Bounty $75", colors.green, "#fff", 124)}
    ${stamp(1040, 478, ["EXACT"], colors.green2, 8, 42)}
    ${flowChips(156, 548, ["post photos", "source lead", "source reveal", "finder payout"], colors.green)}`;
  return svgShell("Almost-Fit Burn Rate", body);
}

function renderLockedLead() {
  const body = `
    <rect width="${W}" height="${H}" fill="#09110d"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fbfcf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${bigText(["Find the exact item.", "Keep your source protected."], 82, 150, 48)}
    ${smallText(["For finders with valuable leads: source reveal comes after review."], 86, 252, 22)}
    <rect x="82" y="310" width="500" height="214" rx="28" fill="#fff4f1" stroke="#eed8d4" stroke-width="2"/>
    <text x="114" y="354" font-size="16" font-weight="900" letter-spacing="1.8" fill="${colors.red}">PUBLIC COMMENT THREAD</text>
    <rect x="116" y="378" width="348" height="42" rx="20" fill="#ffffff"/><text x="138" y="405" font-size="16" font-weight="790" fill="${colors.ink}">I found it here: seller-link.com/item</text>
    <rect x="178" y="434" width="270" height="42" rx="20" fill="#ffffff"/><text x="200" y="461" font-size="16" font-weight="790" fill="${colors.ink}">source copied in DMs</text>
    ${stamp(480, 398, ["SOURCE", "LEAKED"], colors.red2, -8, 68)}
    <rect x="625" y="310" width="493" height="214" rx="28" fill="#effcf5" stroke="#cbe9dc" stroke-width="2"/>
    <text x="657" y="354" font-size="16" font-weight="900" letter-spacing="1.8" fill="${colors.green}">PROTECTED FINDER LEAD</text>
    <rect x="658" y="382" width="410" height="72" rx="20" fill="#ffffff" stroke="#d6e1da"/>
    <path d="M698 421V407C698 392 709 382 724 382C739 382 750 392 750 407V421" fill="none" stroke="${colors.green}" stroke-width="6" stroke-linecap="round"/>
    <rect x="690" y="418" width="68" height="45" rx="12" fill="${colors.green}"/>
    <text x="786" y="419" font-size="21" font-weight="900" fill="${colors.ink}">seller-link.com/...</text>
    <text x="786" y="446" font-size="16" font-weight="730" fill="${colors.muted}">recorded before source reveal</text>
    ${pill(658, 470, "Finder payout for accepted source", colors.green, "#fff", 285)}
    ${stamp(1034, 380, ["PROTECTED", "SOURCE"], colors.green2, 8, 66)}
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">Submit a source lead for a funded request without exposing it for free.</text>`;
  return svgShell("Locked Lead, Paid Reveal", body);
}

function renderPublicLeak() {
  const body = `
    <rect width="${W}" height="${H}" fill="#0b0d0c"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fbfcf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${pill(902, 66, "TRUST WORKFLOW", colors.ink, "#fff", 214)}
    ${bigText(["Don't DM your bounty away."], 82, 156, 56)}
    ${smallText(["Exact item leads stay protected until source reveal."], 86, 204, 23)}
    <rect x="82" y="245" width="493" height="280" rx="28" fill="#21100f"/>
    <text x="114" y="292" font-size="15" font-weight="920" letter-spacing="2" fill="#ff756d">PUBLIC COMMENTS</text>
    <rect x="118" y="318" width="310" height="43" rx="21" fill="#3a2421"/><text x="140" y="346" font-size="16" font-weight="780" fill="#ffe9e4">DM me, I can send the link</text>
    <rect x="156" y="374" width="338" height="43" rx="21" fill="#3a2421"/><text x="178" y="402" font-size="16" font-weight="780" fill="#ffe9e4">seller-link.com/exact-piece</text>
    <rect x="118" y="430" width="252" height="43" rx="21" fill="#3a2421"/><text x="140" y="458" font-size="16" font-weight="780" fill="#ffe9e4">who pays the finder?</text>
    ${stamp(450, 308, ["LEAKED"], "#ff4f46", -7, 62)}
    <rect x="625" y="245" width="493" height="280" rx="28" fill="url(#coolPanel)" stroke="#cbe9dc" stroke-width="2"/>
    <text x="657" y="292" font-size="15" font-weight="920" letter-spacing="2" fill="${colors.green}">FUNDED REQUEST</text>
    ${requestCard(657, 316, 378, 160, "Camera strap exact item", "Bounty $75", "black-shoes.jpg")}
    ${stamp(1040, 286, ["SOURCE", "LOCKED"], colors.green2, 8, 64)}
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">Post a bounty. Let finders submit leads through the protected source workflow.</text>`;
  return svgShell("Public Leak vs Protected Source", body);
}

function renderMarketMaze() {
  const body = `
    <rect width="${W}" height="${H}" fill="#111513"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fbfcf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${bigText(["Your exact item is hiding", "across 6 markets."], 82, 146, 50)}
    ${smallText(["Post one funded request. Protected source leads come back to one place."], 86, 252, 22)}
    <rect x="82" y="302" width="610" height="222" rx="28" fill="#fff7f3" stroke="#eed8d4" stroke-width="2"/>
    <text x="114" y="345" font-size="15" font-weight="920" letter-spacing="2" fill="${colors.red}">THE MARKET MAZE</text>
    ${miniListing(118, 368, 122, 116, "eBay", "sold", "floral-skirt.jpg", -7)}
    ${miniListing(236, 356, 122, 116, "Mercari", "wrong color", "yellow-home-pillow.jpg", 4)}
    ${miniListing(352, 373, 122, 116, "Etsy", "partial", "duck-wall-art.jpg", -2)}
    ${miniListing(468, 360, 122, 116, "local", "no ship", "coin-earrings.jpg", 5)}
    <path d="M242 420C294 380 360 454 426 402S538 386 606 432" fill="none" stroke="${colors.red2}" stroke-width="5" stroke-dasharray="9 12"/>
    <rect x="730" y="302" width="388" height="222" rx="28" fill="#effcf5" stroke="#cbe9dc" stroke-width="2"/>
    <text x="760" y="345" font-size="15" font-weight="920" letter-spacing="2" fill="${colors.green}">ONE FUNDED REQUEST</text>
    ${imageBlock(764, 368, 118, 114, img("living-and-co-mug.jpg"), "", "#fff")}
    <text x="906" y="385" font-size="28" font-weight="930" fill="${colors.ink}">Exact item wanted</text>
    <text x="906" y="421" font-size="17" font-weight="750" fill="${colors.muted}">Discontinued / hard-to-find</text>
    ${pill(906, 443, "Protected source", colors.green, "#fff", 168)}
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">Use marketplace names as clues, not claims: finders search where normal alerts miss.</text>`;
  return svgShell("Market Maze vs Funded Bounty", body);
}

function renderPublicTrail() {
  const body = `
    <rect width="${W}" height="${H}" fill="#0a0f0c"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fbfcf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    ${bigText(["Funded requests", "become solved finds"], 82, 150, 54)}
    ${smallText(["Show the workflow instead of fake metrics: request, protected source, reveal."], 86, 258, 22)}
    <g transform="translate(82 325)">
      <rect width="306" height="178" rx="26" fill="#fffdf4" stroke="#eadfca" stroke-width="2"/>
      <text x="28" y="43" font-size="15" font-weight="920" letter-spacing="1.8" fill="${colors.gold}">FUNDED REQUEST</text>
      ${imageBlock(28, 62, 88, 84, img("duck-wall-art.jpg"), "", "#fff").replaceAll('filter="url(#soft)"', "")}
      <text x="136" y="94" font-size="24" font-weight="930" fill="${colors.ink}">Bounty posted</text>
      <text x="136" y="124" font-size="16" font-weight="730" fill="${colors.muted}">Exact item brief</text>
    </g>
    <path d="M410 414H496" stroke="${colors.green}" stroke-width="7" stroke-linecap="round"/><path d="M482 398L502 414L482 430" fill="none" stroke="${colors.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(515 325)">
      <rect width="306" height="178" rx="26" fill="#effcf5" stroke="#cbe9dc" stroke-width="2"/>
      <text x="28" y="43" font-size="15" font-weight="920" letter-spacing="1.8" fill="${colors.green}">PROTECTED SOURCE</text>
      <rect x="32" y="68" width="242" height="70" rx="18" fill="#ffffff" stroke="#d6e1da"/>
      <text x="58" y="108" font-size="22" font-weight="900" fill="${colors.ink}">source lead saved</text>
      <path d="M235 105V91C235 80 243 73 254 73C265 73 273 80 273 91V105" fill="none" stroke="${colors.green}" stroke-width="5"/>
      <rect x="229" y="104" width="50" height="34" rx="9" fill="${colors.green}"/>
    </g>
    <path d="M842 414H928" stroke="${colors.green}" stroke-width="7" stroke-linecap="round"/><path d="M914 398L934 414L914 430" fill="none" stroke="${colors.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(948 325)">
      <rect width="170" height="178" rx="26" fill="#101412"/>
      <text x="85" y="43" text-anchor="middle" font-size="14" font-weight="920" letter-spacing="1.5" fill="#72e4a4">SOURCE REVEAL</text>
      <text x="85" y="91" text-anchor="middle" font-size="28" font-weight="940" fill="#fff">Solved</text>
      <text x="85" y="124" text-anchor="middle" font-size="16" font-weight="740" fill="#b8c9c0">finder payout</text>
      <circle cx="85" cy="145" r="16" fill="${colors.green2}"/>
    </g>
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">Public request pages create better examples for the next bounty without exposing private leads.</text>`;
  return svgShell("Public Trail, Private Lead", body);
}

function renderHiddenPath() {
  const body = `
    <rect width="${W}" height="${H}" fill="#080b0a"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#101412" filter="url(#shadow)"/>
    ${brand(78, 68, "#ffffff")}
    ${pill(902, 66, "HIDDEN PATH", "#ffffff", colors.ink, 190)}
    ${bigText(["Someone knows where", "your exact item is."], 82, 155, 55, "#ffffff")}
    ${smallText(["Post a funded request. Let finders submit protected source leads."], 86, 266, 22, "#b9c8bf")}
    <g transform="translate(82 325)">
      <rect width="360" height="178" rx="28" fill="#191f1b" stroke="#2e3b33" stroke-width="2"/>
      ${imageBlock(26, 26, 124, 126, img("living-and-co-mug.jpg"), "missing item", "#ffffff").replaceAll('filter="url(#soft)"', "")}
      <path d="M174 52H314M174 90H286M174 128H326" stroke="#37453c" stroke-width="11" stroke-linecap="round"/>
      <path d="M156 88C230 36 278 160 346 96" fill="none" stroke="${colors.red2}" stroke-width="4" stroke-dasharray="7 10"/>
    </g>
    <path d="M442 415C556 312 684 332 790 410S945 468 1040 360" fill="none" stroke="#35db83" stroke-width="8" stroke-linecap="round"/>
    <path d="M1020 358L1047 354L1040 381" fill="none" stroke="#35db83" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(780 322)" filter="url(#soft)">
      <rect width="340" height="178" rx="28" fill="#f2fff8"/>
      <text x="30" y="47" font-size="15" font-weight="920" letter-spacing="1.6" fill="${colors.green}">PROTECTED SOURCE LEAD</text>
      <rect x="30" y="70" width="280" height="58" rx="17" fill="#ffffff" stroke="#d6e1da"/>
      <text x="56" y="106" font-size="22" font-weight="900" fill="${colors.ink}">seller-link.com/...</text>
      ${pill(30, 140, "Bounty funded $75", colors.green, "#fff", 176)}
    </g>
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="#ffffff"/>
    <text x="104" y="566" font-size="15" font-weight="790" fill="${colors.ink}">The path may be hidden in a collector group, local shelf, proxy market, or old inventory.</text>`;
  return svgShell("The Hidden Path Card", body, "#080b0a");
}

function renderNotInventory() {
  const body = `
    <rect width="${W}" height="${H}" fill="#0a0c0b"/>
    <rect x="50" y="38" width="1100" height="554" rx="34" fill="#fbfcf8" filter="url(#shadow)"/>
    ${brand(78, 68)}
    <rect x="82" y="120" width="400" height="405" rx="30" fill="#240f0e"/>
    <text x="116" y="168" font-size="15" font-weight="920" letter-spacing="2" fill="#ff756d">INVENTORY WALL</text>
    ${miniListing(116, 198, 140, 126, "near match", "not exact", "wallet.jpg", -5)}
    ${miniListing(286, 190, 140, 126, "sold out", "dead listing", "vintage-shirt.jpg", 4)}
    ${miniListing(132, 338, 140, 126, "wrong model", "close only", "powerpuff-cup.jpg", 3)}
    ${stamp(330, 352, ["NOT", "INVENTORY"], "#ff4f46", -10, 74)}
    <g transform="translate(535 122)">
      ${bigText(["Not another marketplace."], 0, 50, 53)}
      ${bigText(["A bounty for", "the exact item."], 0, 128, 62, colors.green)}
      ${smallText(["pleasefindmethis coordinates demand, source leads,", "and finder incentives instead of selling inventory."], 2, 265, 22)}
      ${imageBlock(0, 306, 136, 112, img("yellow-home-pillow.jpg"), "exact item", "#ffffff")}
      <g transform="translate(166 312)">
        ${flowChips(0, 0, ["funded request", "protected source"], colors.green)}
        ${flowChips(0, 56, ["source reveal", "finder payout"], colors.green)}
      </g>
    </g>
    <rect x="82" y="545" width="1036" height="31" rx="15" fill="${colors.ink}"/>
    <text x="104" y="566" font-size="15" font-weight="760" fill="#fff">For hard-to-find and discontinued things: post the bounty, not another saved search.</text>`;
  return svgShell("Not Inventory. Bounty Coordination.", body);
}

for (const card of cards) {
  const file = join(outDir, `${card.slug}.svg`);
  writeFileSync(file, card.render());
}

const gallery = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>OG Creative Sprint</title>
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
  <h1>pleasefindmethis.com OG Creative Sprint</h1>
  <p>Ten 1200x630 social-share card directions generated from the ad-creative brief.</p>
  <section>
${cards
  .map(
    (card) => `    <article>
      <img src="./${card.slug}.png" alt="${esc(card.name)}"/>
      <h2>${esc(card.name)}</h2>
      <p class="trigger">${esc(card.trigger)}</p>
    </article>`,
  )
  .join("\n")}
  </section>
</main>
</body>
</html>
`;
writeFileSync(join(outDir, "index.html"), gallery);

const markdown = `# OG Creative Sprint Results

Generated ${cards.length} Open Graph / Twitter-card creative directions for pleasefindmethis.com.

${cards
  .map(
    (card, index) => `## ${index + 1}. ${card.name}

- Asset: \`public/og/creative-sprint/${card.slug}.svg\`
- Headline: ${card.headline}
- Subhead: ${card.subhead}
- Psychological trigger: ${card.trigger}
`,
  )
  .join("\n")}
`;
writeFileSync(join(process.cwd(), "marketing/og_creative_sprint_results.md"), markdown);

console.log(`Wrote ${cards.length} SVG cards to ${outDir}`);
