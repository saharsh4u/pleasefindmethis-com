import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const W = 1200;
const H = 630;
const outDir = join(process.cwd(), "public/og/human-network");
mkdirSync(outDir, { recursive: true });

const images = {
  mug: readImage("public/find-requests/living-and-co-mug.jpg"),
  watch: readImage("public/find-requests/seiko-wired-watch.jpg"),
  shoes: readImage("public/find-requests/black-shoes.jpg"),
};

const ink = "#101214";
const pageBg = "#14162f";
const panel = "#f7f5ef";
const panel2 = "#fffdf7";
const red = "#ef2f2b";
const deepRed = "#b81818";
const green = "#23d579";
const darkGreen = "#096b3a";
const muted = "#5e625f";

function readImage(path) {
  return `data:image/jpeg;base64,${readFileSync(join(process.cwd(), path)).toString("base64")}`;
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function brand() {
  return `<g transform="translate(74 72)">
    <circle cx="17" cy="17" r="17" fill="${darkGreen}"/>
    <circle cx="15" cy="15" r="8" fill="none" stroke="#ffffff" stroke-width="4"/>
    <path d="M22 23L31 32" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <text x="46" y="25" font-size="25" font-weight="900" fill="${ink}">pleasefindmethis.com</text>
  </g>`;
}

function failedTile(x, y, label, note) {
  return `<g transform="translate(${x} ${y})">
    <rect width="188" height="72" rx="18" fill="#ffffff" stroke="#f0dad2" stroke-width="2"/>
    <text x="18" y="31" font-size="22" font-weight="930" fill="${ink}">${esc(label)}</text>
    <text x="18" y="55" font-size="15" font-weight="850" fill="${red}">${esc(note)}</text>
    <g transform="translate(150 14)">
      <circle cx="22" cy="22" r="21" fill="#fff4f2" stroke="${red}" stroke-width="4"/>
      <path d="M14 14L30 30M30 14L14 30" stroke="${red}" stroke-width="5" stroke-linecap="round"/>
    </g>
  </g>`;
}

function node(x, y, label, emphasis = false) {
  const fill = emphasis ? "#f1fff8" : "#ffffff";
  const stroke = emphasis ? green : "#dce6de";
  const width = emphasis ? 144 : 126;
  const height = emphasis ? 54 : 44;
  return `<g transform="translate(${x} ${y})" filter="${emphasis ? "url(#greenGlow)" : "url(#nodeShadow)"}">
    <rect width="${width}" height="${height}" rx="${height / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${emphasis ? 3 : 2}"/>
    <text x="${width / 2}" y="${emphasis ? 35 : 29}" text-anchor="middle" font-size="${emphasis ? 19 : 15}" font-weight="900" fill="${emphasis ? darkGreen : ink}">${esc(label)}</text>
  </g>`;
}

function path(d, color = green, width = 5, opacity = 1, dash = "") {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
}

function itemPhoto(x, y, size, href, label) {
  const clip = `clip-${x}-${y}`;
  return `<g transform="translate(${x} ${y})" filter="url(#nodeShadow)">
    <clipPath id="${clip}"><rect width="${size}" height="${size}" rx="18"/></clipPath>
    <image href="${href}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clip})"/>
    <rect width="${size}" height="${size}" rx="18" fill="none" stroke="#ffffff" stroke-width="5"/>
    <rect x="8" y="${size - 35}" width="${size - 16}" height="25" rx="12.5" fill="#101214" opacity="0.82"/>
    <text x="${size / 2}" y="${size - 17}" text-anchor="middle" font-size="12" font-weight="850" fill="#ffffff">${esc(label)}</text>
  </g>`;
}

function statusPill(x, y, label, fill = "#ffffff", color = red) {
  return `<g transform="translate(${x} ${y})">
    <rect width="152" height="34" rx="17" fill="${fill}" stroke="${color}" stroke-width="2"/>
    <text x="76" y="23" text-anchor="middle" font-size="14" font-weight="920" fill="${color}">${esc(label)}</text>
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <title>Search stops. People keep looking.</title>
  <defs>
    <filter id="cardShadow" x="-10%" y="-12%" width="120%" height="130%">
      <feDropShadow dx="0" dy="30" stdDeviation="28" flood-color="#000000" flood-opacity="0.42"/>
    </filter>
    <filter id="nodeShadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000000" flood-opacity="0.16"/>
    </filter>
    <filter id="greenGlow" x="-45%" y="-45%" width="190%" height="190%">
      <feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="${green}" flood-opacity="0.52"/>
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#000000" flood-opacity="0.16"/>
    </filter>
    <filter id="redGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${red}" flood-opacity="0.36"/>
    </filter>
    <linearGradient id="panelGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${panel}"/>
      <stop offset="100%" stop-color="#e9fff3"/>
    </linearGradient>
    <radialGradient id="networkGlow" cx="70%" cy="52%" r="52%">
      <stop offset="0%" stop-color="#24e57f" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="#24e57f" stop-opacity="0"/>
    </radialGradient>
    <style>
      .sans { font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      text { dominant-baseline: alphabetic; }
    </style>
  </defs>

  <rect width="${W}" height="${H}" fill="${pageBg}"/>
  <path d="M0 500C180 430 330 580 520 512C735 435 790 210 1005 240C1104 254 1162 319 1200 370V630H0Z" fill="#192344"/>
  <circle cx="146" cy="104" r="170" fill="${red}" opacity="0.14"/>
  <circle cx="1034" cy="384" r="220" fill="${green}" opacity="0.12"/>

  <g class="sans">
    <rect x="48" y="38" width="1104" height="554" rx="34" fill="url(#panelGradient)" filter="url(#cardShadow)"/>
    <rect x="48" y="38" width="1104" height="554" rx="34" fill="url(#networkGlow)"/>
    ${brand()}

    <rect x="875" y="67" width="230" height="40" rx="20" fill="#ffffff"/>
    <text x="990" y="93" text-anchor="middle" font-size="14" font-weight="900" letter-spacing="1.2" fill="${ink}">FUNDED REQUEST</text>

    <text x="76" y="164" font-size="65" font-weight="960" fill="${red}">Search stops.</text>
    <text x="76" y="226" font-size="62" font-weight="960" fill="${ink}">People keep looking.</text>
    <text x="78" y="265" font-size="23" font-weight="780" fill="${muted}">For sold-out, discontinued, and hidden-inventory items.</text>

    <g transform="translate(77 304)">
      <rect width="426" height="212" rx="28" fill="${panel2}" stroke="#f1ddd8" stroke-width="2"/>
      <text x="26" y="40" font-size="15" font-weight="960" letter-spacing="2" fill="${red}">WHEN NORMAL SEARCH FAILS</text>
      ${failedTile(25, 62, "Search", "wrong item")}
      ${failedTile(222, 62, "Stores", "out of stock")}
      ${failedTile(25, 143, "Markets", "dead link")}
      ${failedTile(222, 143, "Alerts", "no exact hit")}
    </g>

    <g transform="translate(535 304)">
      <rect width="582" height="212" rx="28" fill="#f2fff8" stroke="#cceede" stroke-width="2"/>
      <text x="26" y="40" font-size="15" font-weight="960" letter-spacing="2" fill="${darkGreen}">HUMAN FINDER NETWORK</text>
      ${path("M154 109C188 58 222 54 268 70", green, 6, 0.92)}
      ${path("M154 109C202 108 230 108 268 108", green, 6, 0.92)}
      ${path("M154 109C188 158 222 162 268 150", green, 6, 0.92)}
      ${path("M394 70C413 78 421 88 426 103", green, 6, 0.92)}
      ${path("M394 108C410 108 418 108 426 108", green, 6, 0.92)}
      ${path("M394 150C413 140 421 128 426 113", green, 6, 0.92)}
      ${path("M154 109C226 104 325 104 426 108", green, 4, 0.56, "12 12")}
      ${path("M-15 188C22 142 42 127 65 115", "#ff3f38", 5, 0.85, "10 12")}
      ${node(25, 82, "Finder", true)}
      ${node(268, 48, "Collector")}
      ${node(268, 86, "Warehouse")}
      ${node(268, 130, "Local shop")}

      <g transform="translate(426 64)" filter="url(#greenGlow)">
        <rect width="136" height="104" rx="24" fill="#effff7" stroke="${green}" stroke-width="3"/>
        <text x="68" y="32" text-anchor="middle" font-size="14" font-weight="950" letter-spacing="1.2" fill="${darkGreen}">SOURCE LEAD</text>
        <rect x="17" y="45" width="102" height="30" rx="15" fill="#ffffff" stroke="#cbeade" stroke-width="2"/>
        <text x="68" y="65" text-anchor="middle" font-size="14" font-weight="920" fill="${ink}">hidden</text>
        <text x="68" y="91" text-anchor="middle" font-size="13" font-weight="900" fill="${darkGreen}">payout path</text>
      </g>
    </g>

    <rect x="82" y="544" width="1036" height="34" rx="17" fill="${ink}"/>
    <text x="103" y="567" font-size="16" font-weight="850" fill="#ffffff">Post the item. Fund the request. Let finders submit protected source leads.</text>
  </g>
</svg>`;

const svgPath = join(outDir, "pleasefindmethis-human-network.svg");
writeFileSync(svgPath, svg);

console.log(svgPath);
