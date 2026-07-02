import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1200;
const H = 630;
const outDir = join(process.cwd(), "public/og/post-style-creatives");
mkdirSync(outDir, { recursive: true });

const pillow = dataUri("public/find-requests/yellow-home-pillow.jpg");

const colors = {
  page: "#050607",
  card: "#f8f7f2",
  paper: "#ffffff",
  ink: "#111315",
  muted: "#5e6460",
  line: "#e8ded8",
  red: "#ef2f2b",
  redSoft: "#fff2f0",
  green: "#18bf69",
  greenDark: "#08723e",
  greenSoft: "#ecfff6",
  blue: "#4f62ff",
  purple: "#8b5cf6",
};

const creatives = [
  {
    id: "01-looked-everywhere",
    handle: "homegoods_hunt",
    title: "I looked everywhere",
    post: ["Can someone find this pillow?", "Looked for weeks. Reward: $75"],
    leftStamp: "STUCK",
    rightStamp: "PEOPLE LOOKING",
    leftMode: "searchRows",
    rightMode: "leadPins",
    leftLabels: ["Google", "HomeGoods", "eBay", "Marketplace"],
    leftNotes: ["wrong item", "gone", "sold", "no exact"],
    leads: ["local shop", "estate sale", "collector"],
    reward: "$75",
    accent: "#f9e9e2",
  },
  {
    id: "02-dog-ruined-mine",
    handle: "replace_this_pillow",
    title: "My dog ruined mine",
    post: ["My dog ruined this pillow.", "$75 if you know where another is."],
    leftStamp: "NO LUCK",
    rightStamp: "POSSIBLE LEAD",
    leftMode: "pawSearch",
    rightMode: "protectedLead",
    leftLabels: ["Online", "FB", "eBay"],
    leftNotes: ["none", "no exact", "old"],
    leads: ["seller tip", "local shelf", "source hidden"],
    reward: "$75",
    accent: "#f4e8ff",
  },
  {
    id: "03-sold-out-everywhere",
    handle: "tired_of_tabs",
    title: "Sold out everywhere",
    post: ["Every listing is sold out or old.", "$75 for a useful lead."],
    leftStamp: "DEAD END",
    rightStamp: "NEW LEAD?",
    leftMode: "oldListings",
    rightMode: "mapLead",
    leftLabels: ["Sold out", "Archived", "2021"],
    leftNotes: ["", "", ""],
    leads: ["shop shelf", "message", "source tip"],
    reward: "$75",
    accent: "#e8f0ff",
  },
  {
    id: "04-right-person",
    handle: "someone_has_seen_it",
    title: "Right person",
    post: ["Someone out there has seen this.", "Reward: $75"],
    leftStamp: "NO LUCK",
    rightStamp: "RIGHT PERSON",
    leftMode: "emptySignal",
    rightMode: "humanNetwork",
    leftLabels: ["Search", "Alerts", "Stores"],
    leftNotes: ["0", "0", "0"],
    leads: ["collector", "store owner", "friend"],
    reward: "$75",
    accent: "#eafff2",
  },
  {
    id: "05-reddit-style-request",
    handle: "helpmefind_style",
    title: "Reddit-style request",
    post: ["Seen this in a thrift shop?", "I'll pay $75 for a real lead."],
    leftStamp: "STUCK",
    rightStamp: "OPEN BOUNTY",
    leftMode: "commentMess",
    rightMode: "bountyCard",
    leftLabels: ["similar?", "try lens", "no link"],
    leftNotes: ["", "", ""],
    leads: ["thrift shop", "marketplace", "source lead"],
    reward: "$75",
    accent: "#fff4df",
  },
  {
    id: "06-regret-not-buying",
    handle: "shouldve_bought_two",
    title: "Should've bought two",
    post: ["Still thinking about this pillow.", "$75 if you know where one is."],
    leftStamp: "MISSED IT",
    rightStamp: "POSSIBLE LEADS",
    leftMode: "savedProduct",
    rightMode: "leadCards",
    leftLabels: ["saved photo", "2 years ago", "sold out"],
    leftNotes: ["", "", ""],
    leads: ["local shop", "estate sale", "seller lead"],
    reward: "$75",
    accent: "#f7ebe5",
  },
  {
    id: "07-long-shot",
    handle: "long_shot_request",
    title: "Long shot",
    post: ["Please help me find this pillow.", "New or used is fine. $75"],
    leftStamp: "LONG SHOT",
    rightStamp: "SOURCE LEAD",
    leftMode: "buriedPost",
    rightMode: "protectedLead",
    leftLabels: ["reply", "reply", "reply"],
    leftNotes: ["same?", "no", "old"],
    leads: ["new or used", "protected", "payout path"],
    reward: "$75",
    accent: "#e9fff7",
  },
  {
    id: "08-entire-internet",
    handle: "searched_every_tab",
    title: "Entire internet",
    post: ["Has anyone seen this pillow?", "I'm tired of searching. Reward: $75"],
    leftStamp: "STILL LOOKING",
    rightStamp: "LEADS COMING IN",
    leftMode: "browserTabs",
    rightMode: "dmBubbles",
    leftLabels: ["sold out", "no match", "archived"],
    leftNotes: ["", "", ""],
    leads: ["local shop", "seller tip", "source lead"],
    reward: "$75",
    accent: "#eef0ff",
  },
  {
    id: "09-quoted-real-request",
    handle: "actual_request",
    title: "Real-person request",
    post: ["\"Google, eBay, Etsy... nothing.\"", "$75 for a source lead."],
    leftStamp: "NO LUCK",
    rightStamp: "SOURCE TIP",
    leftMode: "marketGrid",
    rightMode: "leadPins",
    leftLabels: ["Google", "eBay", "Etsy", "FB"],
    leftNotes: ["empty", "gone", "old", "no exact"],
    leads: ["local shop", "collector", "seller"],
    reward: "$75",
    accent: "#fff1f5",
  },
  {
    id: "10-local-shelf",
    handle: "hidden_inventory",
    title: "Sold out online",
    post: ["Online is a dead end.", "$75 for a local shelf lead."],
    leftStamp: "ONLINE DEAD END",
    rightStamp: "LOCAL LEAD",
    leftMode: "outOfStockPage",
    rightMode: "shopShelf",
    leftLabels: ["out of stock", "unavailable", "old page"],
    leftNotes: ["", "", ""],
    leads: ["small shop", "thrift shelf", "map pin"],
    reward: "$75",
    accent: "#e8fbff",
  },
];

function dataUri(path) {
  return `data:image/jpeg;base64,${readFileSync(join(process.cwd(), path)).toString("base64")}`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textLines(lines, x, y, size, weight, fill, gap = size + 8, anchor = "start") {
  return lines
    .map((line, i) => `<text x="${x}" y="${y + i * gap}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`)
    .join("");
}

function stamp(x, y, label, color, rotate = -9, scale = 1) {
  const words = label.length > 13 ? label.split(" ") : [label];
  const font = words.length > 1 ? 22 : label.length > 9 ? 22 : 27;
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})" filter="url(#stampShadow)">
    <circle cx="0" cy="0" r="71" fill="#ffffff" opacity="0.9" stroke="${color}" stroke-width="7"/>
    <circle cx="0" cy="0" r="54" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="8 8"/>
    <path d="M-39 -36H39M-39 39H39" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
    ${words.map((word, i) => `<text x="0" y="${words.length === 1 ? 9 : -4 + i * 26}" text-anchor="middle" font-size="${font}" font-weight="950" fill="${color}">${esc(word)}</text>`).join("")}
  </g>`;
}

function photo(x, y, w, h, label = "") {
  const clip = `clip-${x}-${y}`;
  return `<g filter="url(#softShadow)">
    <clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22"/></clipPath>
    <image href="${pillow}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})"/>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="none" stroke="#ffffff" stroke-width="5"/>
    ${label ? `<rect x="${x + 12}" y="${y + h - 44}" width="${w - 24}" height="30" rx="15" fill="#111315" opacity="0.82"/>
    <text x="${x + w / 2}" y="${y + h - 23}" text-anchor="middle" font-size="13" font-weight="850" fill="#ffffff">${esc(label)}</text>` : ""}
  </g>`;
}

function xIcon(cx, cy, size = 42) {
  const r = size / 2;
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors.redSoft}" stroke="${colors.red}" stroke-width="4"/>
    <path d="M${cx - r * 0.38} ${cy - r * 0.38}L${cx + r * 0.38} ${cy + r * 0.38}M${cx + r * 0.38} ${cy - r * 0.38}L${cx - r * 0.38} ${cy + r * 0.38}" stroke="${colors.red}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

function checkIcon(cx, cy, size = 42) {
  const r = size / 2;
  return `<g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors.greenSoft}" stroke="${colors.green}" stroke-width="4"/>
    <path d="M${cx - r * 0.45} ${cy}L${cx - r * 0.1} ${cy + r * 0.35}L${cx + r * 0.5} ${cy - r * 0.35}" fill="none" stroke="${colors.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`;
}

function magnifier(x, y, color = colors.red) {
  return `<g transform="translate(${x} ${y})">
    <circle cx="17" cy="17" r="12" fill="none" stroke="${color}" stroke-width="4"/>
    <path d="M27 27L40 40" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

function mapPin(x, y, color = colors.green) {
  return `<g transform="translate(${x} ${y})">
    <path d="M18 2C9 2 3 9 3 18c0 13 15 28 15 28s15-15 15-28C33 9 27 2 18 2Z" fill="${color}"/>
    <circle cx="18" cy="18" r="6" fill="#ffffff"/>
  </g>`;
}

function chat(x, y, color = colors.green) {
  return `<g transform="translate(${x} ${y})">
    <rect width="58" height="38" rx="17" fill="#ffffff" stroke="${color}" stroke-width="3"/>
    <path d="M18 36L12 48L31 37" fill="#ffffff" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="21" cy="19" r="3" fill="${color}"/>
    <circle cx="31" cy="19" r="3" fill="${color}"/>
    <circle cx="41" cy="19" r="3" fill="${color}"/>
  </g>`;
}

function paw(x, y) {
  return `<g transform="translate(${x} ${y})" opacity="0.9">
    <ellipse cx="24" cy="34" rx="17" ry="13" fill="${colors.red}"/>
    <circle cx="10" cy="18" r="7" fill="${colors.red}"/>
    <circle cx="23" cy="10" r="7" fill="${colors.red}"/>
    <circle cx="38" cy="18" r="7" fill="${colors.red}"/>
  </g>`;
}

function leadCard(x, y, label, note = "source lead", color = colors.green) {
  return `<g transform="translate(${x} ${y})" filter="url(#softShadow)">
    <rect width="162" height="58" rx="18" fill="#ffffff" stroke="#cfeadc" stroke-width="2"/>
    <text x="18" y="28" font-size="17" font-weight="900" fill="${colors.ink}">${esc(label)}</text>
    <text x="18" y="48" font-size="12" font-weight="850" fill="${color}">${esc(note)}</text>
  </g>`;
}

function pill(x, y, text, fill, color, width = 126) {
  return `<g transform="translate(${x} ${y})">
    <rect width="${width}" height="34" rx="17" fill="${fill}" stroke="${color}" stroke-width="2"/>
    <text x="${width / 2}" y="23" text-anchor="middle" font-size="14" font-weight="900" fill="${color}">${esc(text)}</text>
  </g>`;
}

function failurePanel(card) {
  const base = `<rect x="82" y="260" width="488" height="228" rx="26" fill="#fffdf9" stroke="#efd8d2" stroke-width="2"/>
    <text x="106" y="296" font-size="14" font-weight="950" letter-spacing="2" fill="${colors.red}">${esc(card.title.toUpperCase())}</text>`;

  const rows = (labels = card.leftLabels, notes = card.leftNotes) =>
    labels
      .map((label, i) => {
        const x = 105 + (i % 2) * 218;
        const y = 322 + Math.floor(i / 2) * 72;
        return `<g transform="translate(${x} ${y})">
          <rect width="202" height="58" rx="16" fill="#ffffff" stroke="#f1d7d1" stroke-width="2"/>
          <text x="16" y="26" font-size="19" font-weight="900" fill="${colors.ink}">${esc(label)}</text>
          <text x="16" y="47" font-size="13" font-weight="840" fill="${colors.red}">${esc(notes[i] || "no exact")}</text>
          ${xIcon(176, 29, 36)}
        </g>`;
      })
      .join("");

  const oldListings = () => `<g>
    ${photo(106, 322, 92, 92, "pillow")}
    ${["Sold out", "Archived", "Last seen 2021"].map((label, i) => `<g transform="translate(222 ${321 + i * 47})">
      <rect width="218" height="36" rx="18" fill="#ffffff" stroke="#f0d8d2" stroke-width="2"/>
      <text x="18" y="24" font-size="15" font-weight="900" fill="${colors.red}">${esc(label)}</text>
      ${xIcon(194, 18, 25)}
    </g>`).join("")}
    <path d="M109 444H497" stroke="#eadbd6" stroke-width="2"/>
    <path d="M110 444C155 421 193 436 238 405S317 389 372 366S438 355 502 326" fill="none" stroke="${colors.red}" stroke-width="5" stroke-linecap="round" opacity="0.65"/>
  </g>`;

  const commentMess = () => `<g>
    ${photo(106, 315, 110, 110, "this one")}
    ${[0, 1, 2].map((i) => `<g transform="translate(235 ${318 + i * 47})">
      <circle cx="16" cy="16" r="15" fill="#ece7e2"/>
      <rect x="42" y="3" width="${190 - i * 22}" height="12" rx="6" fill="#ded6d0"/>
      <rect x="42" y="23" width="${140 + i * 16}" height="12" rx="6" fill="#eee7e2"/>
    </g>`).join("")}
    ${xIcon(487, 384, 58)}
  </g>`;

  const savedProduct = () => `<g>
    ${photo(110, 316, 150, 124, "saved photo")}
    ${pill(288, 326, "2 years ago", "#ffffff", colors.red, 130)}
    ${pill(288, 372, "sold out", "#ffffff", colors.red, 130)}
    ${magnifier(308, 415, colors.red)}
    <path d="M347 454L412 454" stroke="${colors.red}" stroke-width="5" stroke-linecap="round"/>
    ${xIcon(448, 452, 43)}
  </g>`;

  const buriedPost = () => `<g>
    ${commentMess()}
    <rect x="112" y="438" width="172" height="30" rx="15" fill="${colors.redSoft}" stroke="${colors.red}" stroke-width="2"/>
    <text x="198" y="459" text-anchor="middle" font-size="14" font-weight="900" fill="${colors.red}">no useful lead</text>
  </g>`;

  const browserTabs = () => `<g>
    <rect x="105" y="322" width="386" height="36" rx="18" fill="#f0eee8"/>
    ${["sold out", "no match", "archived"].map((label, i) => `<g transform="translate(${122 + i * 116} 329)">
      <rect width="101" height="22" rx="11" fill="#ffffff"/>
      <text x="50" y="16" text-anchor="middle" font-size="12" font-weight="900" fill="${colors.red}">${esc(label)}</text>
    </g>`).join("")}
    ${photo(112, 374, 98, 80, "pillow")}
    <path d="M236 392H472M236 421H440M236 450H392" stroke="#dad1ca" stroke-width="13" stroke-linecap="round"/>
    ${xIcon(480, 421, 50)}
  </g>`;

  const marketGrid = () => rows();

  const outOfStockPage = () => `<g>
    <rect x="105" y="320" width="382" height="142" rx="20" fill="#ffffff" stroke="#eadbd5" stroke-width="2"/>
    ${photo(124, 338, 92, 92, "pillow")}
    <text x="242" y="359" font-size="21" font-weight="930" fill="${colors.ink}">old product page</text>
    <rect x="242" y="377" width="148" height="35" rx="17" fill="${colors.redSoft}" stroke="${colors.red}" stroke-width="2"/>
    <text x="316" y="400" text-anchor="middle" font-size="15" font-weight="950" fill="${colors.red}">out of stock</text>
    <path d="M242 435H440" stroke="#e0d8d1" stroke-width="12" stroke-linecap="round"/>
    ${xIcon(455, 394, 54)}
  </g>`;

  const mode = {
    searchRows: rows,
    pawSearch: () => `<g>${rows(card.leftLabels, card.leftNotes)}${paw(435, 305)}</g>`,
    oldListings,
    emptySignal: () => `<g>${rows(card.leftLabels, card.leftNotes)}<text x="416" y="456" font-size="54" font-weight="950" fill="${colors.red}">0</text></g>`,
    commentMess,
    savedProduct,
    buriedPost,
    browserTabs,
    marketGrid,
    outOfStockPage,
  }[card.leftMode];

  return `${base}${mode()}${stamp(452, 319, card.leftStamp, colors.red, -9, card.leftStamp.length > 12 ? 0.76 : 0.86)}`;
}

function successPanel(card) {
  const base = `<rect x="630" y="260" width="488" height="228" rx="26" fill="#f1fff8" stroke="#cceedd" stroke-width="2"/>
    <text x="654" y="296" font-size="14" font-weight="950" letter-spacing="2" fill="${colors.greenDark}">FUNDED REQUEST</text>`;

  const leadPins = () => `<g>
    ${photo(655, 323, 118, 118, "pillow")}
    <path d="M780 384C832 330 877 324 930 345" fill="none" stroke="${colors.green}" stroke-width="6" stroke-linecap="round"/>
    <path d="M780 384C830 393 875 417 930 419" fill="none" stroke="${colors.green}" stroke-width="6" stroke-linecap="round"/>
    <path d="M780 384C844 375 894 378 956 383" fill="none" stroke="${colors.green}" stroke-width="4" stroke-dasharray="10 10" stroke-linecap="round"/>
    ${leadCard(920, 319, card.leads[0])}
    ${leadCard(920, 389, card.leads[1])}
    ${pill(795, 430, card.reward + " reward", "#ffffff", colors.greenDark, 132)}
  </g>`;

  const protectedLead = () => `<g>
    ${photo(662, 318, 120, 120, "request")}
    <rect x="806" y="329" width="182" height="116" rx="24" fill="#ffffff" stroke="#cfeadc" stroke-width="2" filter="url(#softShadow)"/>
    <text x="897" y="359" text-anchor="middle" font-size="15" font-weight="950" letter-spacing="1.5" fill="${colors.greenDark}">SOURCE LEAD</text>
    <rect x="835" y="376" width="124" height="34" rx="17" fill="#f6faf7" stroke="#d7e8de" stroke-width="2"/>
    <text x="897" y="399" text-anchor="middle" font-size="14" font-weight="900" fill="${colors.ink}">hidden</text>
    <text x="897" y="427" text-anchor="middle" font-size="13" font-weight="900" fill="${colors.greenDark}">payout path</text>
    ${checkIcon(1030, 386, 56)}
  </g>`;

  const mapLead = () => `<g>
    <rect x="655" y="320" width="160" height="136" rx="22" fill="#ffffff" stroke="#dcece2" stroke-width="2"/>
    <path d="M675 429C708 387 738 408 769 365C783 346 794 335 805 326" fill="none" stroke="#ccd7d1" stroke-width="5" stroke-linecap="round"/>
    ${mapPin(704, 343)}
    ${pill(678, 414, "shop shelf", "#ffffff", colors.greenDark, 112)}
    ${chat(845, 338)}
    ${leadCard(915, 336, "message", "source tip")}
    ${pill(850, 426, card.reward + " reward", "#ffffff", colors.greenDark, 132)}
  </g>`;

  const humanNetwork = () => `<g>
    ${photo(662, 323, 100, 100, "pillow")}
    <circle cx="817" cy="382" r="36" fill="#eafff2" stroke="${colors.green}" stroke-width="4"/>
    <text x="817" y="389" text-anchor="middle" font-size="15" font-weight="930" fill="${colors.greenDark}">finder</text>
    ${["collector", "store owner", "friend"].map((label, i) => {
      const x = 910;
      const y = 320 + i * 55;
      return `<path d="M851 382C880 ${y + 20} 888 ${y + 20} ${x} ${y + 20}" fill="none" stroke="${colors.green}" stroke-width="5" stroke-linecap="round"/>
      ${leadCard(x, y, label, "knows a place")}`;
    }).join("")}
  </g>`;

  const bountyCard = () => `<g>
    <rect x="656" y="316" width="206" height="142" rx="24" fill="#ffffff" stroke="#d5eadf" stroke-width="2" filter="url(#softShadow)"/>
    ${photo(674, 334, 76, 76, "pillow")}
    <text x="770" y="354" font-size="14" font-weight="940" fill="${colors.greenDark}">OPEN BOUNTY</text>
    <text x="770" y="381" font-size="25" font-weight="950" fill="${colors.ink}">${esc(card.reward)}</text>
    <text x="770" y="407" font-size="13" font-weight="820" fill="${colors.muted}">protected lead</text>
    ${leadCard(890, 320, card.leads[0])}
    ${leadCard(890, 390, card.leads[1])}
  </g>`;

  const leadCards = () => `<g>
    ${photo(660, 325, 98, 98, "photo")}
    ${leadCard(794, 318, card.leads[0])}
    ${leadCard(884, 388, card.leads[1])}
    ${leadCard(958, 318, card.leads[2])}
    <path d="M762 373C802 341 818 342 794 346M762 373C843 393 868 409 884 417M762 373C850 337 913 341 958 348" fill="none" stroke="${colors.green}" stroke-width="5" stroke-linecap="round" stroke-dasharray="10 10"/>
    ${pill(670, 432, card.reward + " reward", "#ffffff", colors.greenDark, 130)}
  </g>`;

  const dmBubbles = () => `<g>
    ${photo(656, 321, 112, 112, "pillow")}
    ${chat(800, 321)}
    ${leadCard(883, 314, "local shop", "lead sent")}
    ${leadCard(855, 386, "seller tip", "source hidden")}
    <path d="M767 376C805 356 836 348 884 343M769 397C812 410 834 415 855 415" fill="none" stroke="${colors.green}" stroke-width="5" stroke-linecap="round"/>
  </g>`;

  const shopShelf = () => `<g>
    <rect x="656" y="316" width="210" height="144" rx="24" fill="#ffffff" stroke="#d4eadf" stroke-width="2" filter="url(#softShadow)"/>
    ${photo(672, 332, 178, 96, "small shop")}
    <circle cx="735" cy="382" r="39" fill="none" stroke="${colors.green}" stroke-width="5"/>
    ${mapPin(886, 334)}
    ${leadCard(946, 326, "local shelf", "source lead")}
    ${pill(898, 410, card.reward + " reward", "#ffffff", colors.greenDark, 132)}
  </g>`;

  const mode = {
    leadPins,
    protectedLead,
    mapLead,
    humanNetwork,
    bountyCard,
    leadCards,
    dmBubbles,
    shopShelf,
  }[card.rightMode];

  return `${base}${mode()}${stamp(1010, 316, card.rightStamp, colors.green, 8, card.rightStamp.length > 12 ? 0.72 : 0.84)}`;
}

function render(card, index) {
  const initials = card.handle.slice(0, 1).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>${esc(card.title)}</title>
  <defs>
    <filter id="postShadow" x="-10%" y="-10%" width="120%" height="125%">
      <feDropShadow dx="0" dy="26" stdDeviation="24" flood-color="#000000" flood-opacity="0.46"/>
    </filter>
    <filter id="softShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="9" stdDeviation="8" flood-color="#000000" flood-opacity="0.14"/>
    </filter>
    <filter id="stampShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#000000" flood-opacity="0.16"/>
    </filter>
    <style>
      .sans { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      text { dominant-baseline: alphabetic; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${colors.page}"/>
  <circle cx="${130 + index * 7}" cy="92" r="180" fill="${colors.red}" opacity="0.16"/>
  <circle cx="${1036 - index * 9}" cy="520" r="220" fill="${colors.green}" opacity="0.14"/>

  <g class="sans">
    <rect x="48" y="34" width="1104" height="558" rx="32" fill="#101114" filter="url(#postShadow)"/>
    <g transform="translate(74 60)">
      <circle cx="20" cy="20" r="20" fill="${card.accent}"/>
      <text x="20" y="28" text-anchor="middle" font-size="20" font-weight="950" fill="${colors.ink}">${esc(initials)}</text>
      <text x="54" y="17" font-size="20" font-weight="900" fill="#ffffff">${esc(card.handle)}</text>
      <text x="54" y="42" font-size="16" font-weight="700" fill="#a7aaa6">posted a funded request</text>
      <text x="1004" y="24" text-anchor="end" font-size="20" font-weight="800" fill="#8b8e8a">...</text>
    </g>

    <rect x="74" y="118" width="1052" height="442" rx="28" fill="${colors.card}"/>
    <rect x="74" y="118" width="1052" height="442" rx="28" fill="${card.accent}" opacity="0.18"/>

    <g transform="translate(98 146)">
      <circle cx="23" cy="23" r="23" fill="#ffffff" stroke="#e0ddd7" stroke-width="2"/>
      <path d="M14 24C24 9 38 15 37 29C36 44 13 42 10 31C8 26 10 24 14 24Z" fill="#d9c8b5"/>
      <text x="63" y="23" font-size="26" font-weight="930" fill="${colors.ink}">Can someone help me find this pillow?</text>
      ${textLines(card.post, 64, 55, 17, 750, colors.muted, 24)}
      ${pill(805, 13, `Reward ${card.reward}`, "#ffffff", colors.red, 142)}
    </g>

    ${failurePanel(card)}
    ${successPanel(card)}

    <rect x="99" y="520" width="1002" height="28" rx="14" fill="#ffffff"/>
    <text x="122" y="540" font-size="14" font-weight="820" fill="${colors.ink}">Post the photo. Fund the request. Let finders submit protected source leads.</text>
    <text x="1080" y="540" text-anchor="end" font-size="14" font-weight="900" fill="${colors.greenDark}">pleasefindmethis.com</text>
  </g>
</svg>`;
}

const rows = [];

for (const [index, card] of creatives.entries()) {
  const svg = render(card, index);
  const svgName = `${card.id}.svg`;
  const pngName = `${card.id}.png`;
  writeFileSync(join(outDir, svgName), svg);
  rows.push({ ...card, svgName, pngName });
}

const gallery = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PleaseFindMeThis Post-Style Creatives</title>
  <style>
    body { margin: 0; background: #08090b; color: #f6f6f2; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
    main { max-width: 1220px; margin: 0 auto; padding: 32px 20px 56px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    p { color: #b8bab5; margin: 0 0 26px; }
    .grid { display: grid; gap: 26px; }
    .item { background: #111315; border: 1px solid #262a28; border-radius: 12px; padding: 14px; }
    .item h2 { font-size: 16px; margin: 0 0 12px; color: #f6f6f2; }
    img { display: block; width: 100%; height: auto; border-radius: 8px; }
    a { color: #42d98a; }
  </style>
</head>
<body>
  <main>
    <h1>PleaseFindMeThis Post-Style Creatives</h1>
    <p>TrustMRR-inspired split screenshots: red dead-end side, green source-lead side, minimal copy.</p>
    <div class="grid">
      ${rows.map((row, i) => `<section class="item">
        <h2>${String(i + 1).padStart(2, "0")}. ${esc(row.title)} - <a href="./${row.pngName}">PNG</a> / <a href="./${row.svgName}">SVG</a></h2>
        <img src="./${row.svgName}" alt="${esc(row.title)}">
      </section>`).join("\n")}
    </div>
  </main>
</body>
</html>`;

writeFileSync(join(outDir, "index.html"), gallery);

const summary = `# Post-Style Creative Batch

Generated 10 TrustMRR-inspired OG/social preview cards for pleasefindmethis.com.

Principle: make the image read like a real human request screenshot, not a polished ad. Each card uses a red dead-end side and a green source-lead side so the viewer understands the idea before reading the copy.

${rows.map((row, i) => `## ${i + 1}. ${row.title}
- PNG: \`public/og/post-style-creatives/${row.pngName}\`
- SVG: \`public/og/post-style-creatives/${row.svgName}\`
- Post cue: ${row.post.join(" ")}
- Visual contrast: ${row.leftStamp} -> ${row.rightStamp}`).join("\n\n")}
`;

writeFileSync(join(process.cwd(), "marketing/post_style_creative_results.md"), summary);

console.log(outDir);
