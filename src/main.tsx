import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Options as OpenPeepsOptions } from "@dicebear/open-peeps";
import type { Session } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import { animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  ImagePlus,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquare,
  PackageCheck,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Store,
  TimerReset,
  Trash2,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import { hasSupabaseEnv, supabase } from "./lib/supabase";
import { authenticatedRequestPages, canLoadRequestData } from "./lib/request-access.mjs";
import { mergeRequestListings } from "./lib/request-listings.mjs";
import {
  initializeGoogleAnalytics,
  trackMarketingEvent,
  trackPageView,
  type AnalyticsProperties,
} from "./lib/analytics";
import "./styles.css";

type Page =
  | "landing"
  | "auth"
  | "post-describe"
  | "post-publish"
  | "share-request"
  | "browse"
  | "browse-all"
  | "request-detail"
  | "poster-dashboard"
  | "privacy"
  | "terms"
  | "account-settings"
  | "not-found";

type RequestListPage = Extract<Page, "browse" | "browse-all">;
type AppHistoryState = {
  scrollY?: number;
  requestListReturnRoute?: RequestListPage;
};

type AuthMode = "signup" | "login";
type AuthBusyAction = "email" | "google" | null;

type GoogleProfile = {
  email?: string;
  name?: string;
  picture?: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleAccountsApi = {
  accounts?: {
    oauth2?: {
      initTokenClient?: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
      }) => {
        requestAccessToken: (options?: { prompt?: string }) => void;
      };
    };
  };
};

declare global {
  interface Window {
    google?: GoogleAccountsApi;
  }
}

type RequestListing = {
  id: string;
  name: string;
  detail: string;
  closes: string;
  image: string;
  category: string;
  status: string;
  location: string;
  poster: string;
  posted: string;
  submissions: number;
  description: string;
  mustHaves: string[];
  timeline: string[];
  brief?: RequestBriefFields;
  live?: boolean;
  createdAt?: string;
  closesAt?: string;
};

type PublicRequestCardRow = {
  id: string;
  item_name: string;
  category: string;
  details: string | null;
  duration_days: number;
  status: string;
  created_at: string;
  closes_at: string | null;
  days_remaining: number | null;
  primary_image_url: string | null;
  submission_count: number | null;
};

type PublicRequestCommentRow = {
  id: string;
  request_id: string;
  body: string;
  source_url: string | null;
  helper_alias: string;
  helper_avatar_tone: number;
  created_at: string;
};

type RequestRow = {
  id: string;
  user_id: string;
  item_name: string;
  category: string;
  details: string | null;
  duration_days: number;
  status: string;
  reference_images: Array<{ url?: string; name?: string; path?: string }> | null;
  created_at: string;
};

type RequestCategory = "home" | "audio" | "camera" | "watch" | "gaming" | "parts" | "fashion";
type PostStarterId = "sentimental" | "rare-gear" | "parts" | "fashion";
type RequestDuration = 7 | 14 | 30 | 60;

type PostDraft = {
  itemName: string;
  category: RequestCategory;
  details: string;
  durationDays: RequestDuration;
  emailClueNotifications: boolean;
};

type PostReferenceImageDraft = {
  file: File;
  name: string;
  dataUrl: string;
};

type StoredPostReferenceImageDraft = {
  name: string;
  type: string;
  lastModified: number;
  dataUrl: string;
};

type StoredPostDraft = {
  itemName: string;
  category: RequestCategory;
  details: string;
  durationDays: RequestDuration;
  emailClueNotifications: boolean;
};

type PostStarterPrompt = {
  id: PostStarterId;
  icon: typeof Search;
  label: string;
  title: string;
  itemName: string;
  category: RequestCategory;
  details: string;
  durationDays: RequestDuration;
};

type PublishedRequestSnapshot = {
  requestId: string;
  itemName: string;
  category: string;
  details: string;
  image: string;
  durationDays: RequestDuration;
  createdAt: string;
};

type AccountProfile = {
  displayName: string;
  handle: string;
  region: string;
  specialty: string;
  notificationEmail: string;
};

type SeoMeta = {
  title: string;
  description: string;
  socialDescription?: string;
  path: string;
  robots: "index,follow" | "noindex,follow";
  image: string;
};

type JsonLdNode = Record<string, unknown>;

const siteName = "pleasefindmethis.com";
const siteOrigin = "https://pleasefindmethis.com";
const configuredPublicAppOrigin = normalizeClientAppOrigin(import.meta.env.VITE_PUBLIC_APP_URL) || siteOrigin;
const defaultSeoDescription =
  "Create a free public search request with photos and details, then collect useful links and clues in one place.";
const defaultSocialDescription =
  "Looking for a hard-to-find or discontinued item? Post one free request with photos and clear details first.";
const organizationLogo = `${siteOrigin}/magnifying-glass.png`;
const defaultSeoImage = `${siteOrigin}/og/pleasefindmethis-request-board.png`;
const defaultSeoImageWidth = "1200";
const defaultSeoImageHeight = "630";
const defaultSeoImageAlt = "A free public request board with item reference photos, public source links, and clues.";
const neutralRequestImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#e9f4ee"/><rect x="382" y="255" width="436" height="334" rx="20" fill="#fff" stroke="#a9c8b6" stroke-width="8"/><circle cx="515" cy="365" r="46" fill="#d7ebdf"/><path d="m420 535 145-132 92 78 74-58 69 112" fill="none" stroke="#0b6d3b" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M538 662h124" stroke="#d69225" stroke-width="18" stroke-linecap="round"/></svg>',
)}`;
const siteLastUpdated = "2026-07-10";

const requestCategories: Array<{ value: RequestCategory; label: string }> = [
  { value: "home", label: "Home goods" },
  { value: "audio", label: "Portable audio" },
  { value: "camera", label: "Camera gear" },
  { value: "watch", label: "Watches" },
  { value: "gaming", label: "Gaming" },
  { value: "parts", label: "Replacement parts" },
  { value: "fashion", label: "Clothing & accessories" },
];

const initialPostDraft: PostDraft = {
  itemName: "",
  category: "home",
  details: "",
  durationDays: 30,
  emailClueNotifications: false,
};

const posterStarterPrompts: PostStarterPrompt[] = [
  {
    id: "sentimental",
    icon: ImagePlus,
    label: "Lost sentimental item",
    title: "Blanket, plush, mug, art, or a family item",
    itemName: "Help me find this exact sentimental item",
    category: "home",
    details:
      "Why it matters:\nI need the same item, not a lookalike.\n\nMust match:\nIt should match the reference photo, color, size, pattern, label, and condition closely enough to buy with confidence.\n\nAlready searched:\nGoogle Lens, resale marketplaces, old listings, and image search.\n\nWrong matches to avoid:\nSimilar-looking replacements that do not match the original details.\n\nValid source should include:\nA public listing, archived product page, catalog reference, or forum post with evidence that it matches the photos.",
    durationDays: 30,
  },
  {
    id: "rare-gear",
    icon: Search,
    label: "Sold-out rare gear",
    title: "Camera, watch, handheld, or collector model",
    itemName: "Help me find this exact sold-out model",
    category: "camera",
    details:
      "Why it matters:\nI am looking for the exact model or reference.\n\nMust match:\nModel, variant, condition expectations, and any required accessories.\n\nAlready searched:\nMarketplace listings, collector forums, and saved searches.\n\nWrong matches to avoid:\nNear variants, untested listings, missing accessories, and sources without condition proof.\n\nValid source should include:\nA public URL with condition, price, region, and authenticity or compatibility details I can verify independently.",
    durationDays: 30,
  },
  {
    id: "parts",
    icon: PackageCheck,
    label: "Replacement part",
    title: "Donor unit, discontinued part, cable, hinge, or cover",
    itemName: "Help me find this replacement part",
    category: "parts",
    details:
      "Why it matters:\nI need a compatible part or donor unit.\n\nMust match:\nParent model, part markings, connector, dimensions, and fitment requirements.\n\nAlready searched:\nParts diagrams, marketplace listings, donor units, and repair forums.\n\nWrong matches to avoid:\nSimilar parts with different revisions, connectors, polarity, or unsafe fitment.\n\nValid source should include:\nA public source link with model numbers, compatibility proof, condition, and any fitment risks.",
    durationDays: 30,
  },
  {
    id: "fashion",
    icon: Store,
    label: "Exact clothing or accessory",
    title: "Dress, shirt, bag, shoes, jewelry, or a discontinued style",
    itemName: "Help me find this exact clothing or accessory item",
    category: "fashion",
    details:
      "Why it matters:\nI need the exact item or a source for the same style.\n\nMust match:\nBrand, size, colorway, fabric, label, hardware, and condition constraints.\n\nAlready searched:\nGoogle Lens, resale marketplaces, social posts, and sold listings.\n\nWrong matches to avoid:\nDrop-shipped lookalikes, wrong fabric, wrong colorway, and unavailable influencer links.\n\nValid source should include:\nBrand, size, colorway, condition, listing or source, and the details that prove it is not just a similar lookalike.",
    durationDays: 30,
  },
];

const requestCommentVisitorStorageKey = "pleasefindmethis-comment-visitor-v1";
const requestCommentMaxLength = 700;
const commentAvatarFaces: NonNullable<OpenPeepsOptions["face"]> = [
  "awe",
  "blank",
  "calm",
  "cheeky",
  "contempt",
  "cute",
  "driven",
  "eyesClosed",
  "eatingHappy",
  "explaining",
  "serious",
  "smile",
  "smileBig",
  "suspicious",
];
const commentAvatarSkinColors = ["694d3d", "ae5d29", "d08b5b", "edb98a", "ffdbb4", "f1c27d", "fff0db"];
const commentAvatarCache = new Map<string, string>();
const commentAvatarRequestCache = new Map<string, Promise<string>>();
let commentAvatarGeneratorPromise: Promise<(seed: string) => string> | null = null;
let requestCommentVisitorMemorySeed = "";

type RequestBriefFieldKey = "story" | "mustMatch" | "alreadyTried" | "wrongMatches" | "sourceProof" | "buyingLimits" | "extraNotes";
type RequestBriefFields = Record<RequestBriefFieldKey, string>;
type RequestBriefFieldConfig = {
  key: RequestBriefFieldKey;
  heading: string;
  label: string;
  placeholder: string;
  hint: string;
  rows: number;
};

const defaultRequestBriefSourceProof =
  "A public listing, catalog page, archive, or forum link with evidence that it matches the photos.";

const requestBriefFieldConfigs: RequestBriefFieldConfig[] = [
  {
    key: "story",
    heading: "Why it matters",
    label: "What are you trying to find?",
    placeholder: "I need this exact item, not a close replacement.",
    hint: "Use short clear words: item, model, and why it must match.",
    rows: 4,
  },
  {
    key: "mustMatch",
    heading: "Must match",
    label: "What must match?",
    placeholder: "Brand, size, color, pattern, label, dimensions, model number, material, condition, or compatibility.",
    hint: "These are the details that make a source valid or wrong.",
    rows: 4,
  },
  {
    key: "alreadyTried",
    heading: "Already searched",
    label: "Where have you already searched?",
    placeholder: "Google Lens, eBay sold listings, Mercari, Etsy, Facebook Marketplace, Reddit, old product pages",
    hint: "List every place you have already checked.",
    rows: 3,
  },
  {
    key: "wrongMatches",
    heading: "Wrong matches to avoid",
    label: "What keeps coming up but is wrong?",
    placeholder: "Wrong color, wrong brand, wrong size, wrong connector, duplicate listing",
    hint: "Call out exact mistakes so visitors do not repeat them.",
    rows: 3,
  },
  {
    key: "sourceProof",
    heading: "Valid source should include",
    label: "What counts as a valid source?",
    placeholder: defaultRequestBriefSourceProof,
    hint: "Tell visitors what evidence makes a link useful.",
    rows: 3,
  },
  {
    key: "buyingLimits",
    heading: "Budget, region, and condition limits",
    label: "Buying limits",
    placeholder: "Ships to US, under $200 before shipping, used condition OK, no private-payment-only sellers.",
    hint: "Add country, budget, shipping, condition, and seller limits.",
    rows: 3,
  },
  {
    key: "extraNotes",
    heading: "Other notes",
    label: "Other clues",
    placeholder: "Bought around 2016 at Target, seen in a screenshot, old family photos, tag says Japan...",
    hint: "Add dates, stores, screenshots, and context visitors can use.",
    rows: 3,
  },
];

const requestBriefKeyByHeading: Record<string, RequestBriefFieldKey> = {
  "why it matters": "story",
  "must match": "mustMatch",
  "already searched": "alreadyTried",
  "wrong matches to avoid": "wrongMatches",
  "valid source should include": "sourceProof",
  "budget, region, and condition limits": "buyingLimits",
  "other notes": "extraNotes",
};

function createEmptyRequestBriefFields(): RequestBriefFields {
  return {
    story: "",
    mustMatch: "",
    alreadyTried: "",
    wrongMatches: "",
    sourceProof: defaultRequestBriefSourceProof,
    buyingLimits: "",
    extraNotes: "",
  };
}

function normalizeRequestBriefHeading(line: string) {
  return line.trim().replace(/:$/, "").toLowerCase();
}

function parseRequestBriefDetails(details: string): Partial<RequestBriefFields> {
  const parsed: Partial<RequestBriefFields> = {};
  let activeKey: RequestBriefFieldKey | null = null;

  for (const line of details.split(/\r?\n/)) {
    const nextKey = requestBriefKeyByHeading[normalizeRequestBriefHeading(line)];

    if (nextKey) {
      activeKey = nextKey;
      parsed[nextKey] = parsed[nextKey] ?? "";
      continue;
    }

    if (activeKey) {
      parsed[activeKey] = `${parsed[activeKey] ? `${parsed[activeKey]}\n` : ""}${line}`;
    }
  }

  for (const key of requestBriefFieldConfigs.map((field) => field.key)) {
    if (parsed[key] !== undefined) {
      parsed[key] = parsed[key]?.trim() ?? "";
    }
  }

  return parsed;
}

function getRequestBriefFields(details: string): RequestBriefFields {
  const base = createEmptyRequestBriefFields();
  const trimmedDetails = details.trim();

  if (!trimmedDetails) {
    return base;
  }

  const parsed = parseRequestBriefDetails(trimmedDetails);

  if (!Object.keys(parsed).length) {
    return { ...base, story: trimmedDetails };
  }

  return {
    ...base,
    ...parsed,
    sourceProof: parsed.sourceProof?.trim() || base.sourceProof,
  };
}

function formatRequestBriefDetails(fields: RequestBriefFields) {
  const normalizedFields = {
    ...fields,
    sourceProof: fields.sourceProof.trim() || defaultRequestBriefSourceProof,
  };

  return requestBriefFieldConfigs
    .map((field) => {
      const value = normalizedFields[field.key].trim();
      return value ? `${field.heading}:\n${value}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function hasUsefulRequestBrief(fields: RequestBriefFields) {
  return requestBriefFieldConfigs.some((field) => field.key !== "sourceProof" && Boolean(fields[field.key].trim()));
}

const protectedPages = new Set<Page>([
  ...authenticatedRequestPages,
  "post-publish",
  "share-request",
  "poster-dashboard",
  "account-settings",
]);

const pageLabels: Record<Page, string> = {
  landing: "Landing page",
  auth: "Sign up / Log in",
  "post-describe": "Post Request - Describe",
  "post-publish": "Post Request - Publish",
  "share-request": "Share request",
  browse: "Browse requests",
  "browse-all": "Browse all",
  "request-detail": "Request detail",
  "poster-dashboard": "Request workspace",
  privacy: "Privacy Policy",
  terms: "Terms",
  "account-settings": "Account settings",
  "not-found": "Not found",
};

const routeMap: Record<string, Page> = {
  "": "landing",
  "/": "landing",
  landing: "landing",
  auth: "auth",
  post: "post-describe",
  "post/describe": "post-describe",
  "post/publish": "post-publish",
  "post/share": "share-request",
  browse: "browse",
  "browse/all": "browse-all",
  "request/detail": "request-detail",
  "poster-dashboard": "poster-dashboard",
  privacy: "privacy",
  terms: "terms",
  "account/settings": "account-settings",
};

const pageRoutes: Record<Page, string> = {
  landing: "/",
  auth: "auth",
  "post-describe": "post/describe",
  "post-publish": "post/publish",
  "share-request": "post/share",
  browse: "browse",
  "browse-all": "browse/all",
  "request-detail": "request/detail",
  "poster-dashboard": "poster-dashboard",
  privacy: "privacy",
  terms: "terms",
  "account-settings": "account/settings",
  "not-found": "not-found",
};

const indexablePages = new Set<Page>([
  "landing",
  "browse",
  "browse-all",
  "request-detail",
  "privacy",
  "terms",
]);

const routesUsingPublicRequestFeed = new Set<Page>(["landing", "browse", "browse-all", "request-detail"]);

function routeUsesPublicRequestFeed(page: Page) {
  return routesUsingPublicRequestFeed.has(page);
}

const pageSeoCopy: Record<Page, { title: string; description: string; socialDescription?: string }> = {
  landing: {
    title: "Where Can I Buy This Exact Item? | pleasefindmethis",
    description: defaultSeoDescription,
    socialDescription: defaultSocialDescription,
  },
  auth: {
    title: "Sign In | pleasefindmethis",
    description: "Sign in to publish and organize public search requests.",
  },
  "post-describe": {
    title: "Post a Find Request | pleasefindmethis",
    description: "Describe what you need and what makes a lead valid.",
  },
  "post-publish": {
    title: "Publish a Free Request | pleasefindmethis",
    description: "Publish a free public request for links and clues.",
  },
  "share-request": {
    title: "Share Your Search | pleasefindmethis",
    description: "Share your public request with people who may recognize the exact item.",
  },
  browse: {
    title: "Featured Find Requests | pleasefindmethis",
    description: "Browse live requests for hard-to-find items.",
  },
  "browse-all": {
    title: "Browse All Find Requests | pleasefindmethis",
    description: "Search open requests by item, category, or location.",
  },
  "request-detail": {
    title: "Find Request Details | pleasefindmethis",
    description: "Review request details and public links and clues.",
  },
  "poster-dashboard": {
    title: "Request Workspace | pleasefindmethis",
    description: "Open, share, and organize your item-search requests.",
  },
  privacy: {
    title: "Privacy Policy | pleasefindmethis",
    description: "How account, request, photo, and public clue data is used.",
  },
  terms: {
    title: "Terms of Service | pleasefindmethis",
    description: "Rules for publishing requests, public clues, and external links.",
  },
  "account-settings": {
    title: "Account Settings | pleasefindmethis",
    description: "Manage account access and alerts.",
  },
  "not-found": {
    title: "Page Not Found | pleasefindmethis",
    description: "This page is not available.",
  },
};

const signedInStorageKey = "pleasefindmethis-signed-in";
const pendingRouteStorageKey = "pleasefindmethis-pending-route";
const pendingRequestIdStorageKey = "pleasefindmethis-pending-request-id";
const pendingRequestNameStorageKey = "pleasefindmethis-pending-request-name";
const authProviderStorageKey = "pleasefindmethis-auth-provider";
const authEmailStorageKey = "pleasefindmethis-auth-email";
const postDraftStorageKey = "pleasefindmethis-post-draft";
const postReferenceImagesStorageKey = "pleasefindmethis-post-reference-images";
const publishedRequestStorageKey = "pleasefindmethis-published-request";
const requestFeedRefreshStorageKey = "pleasefindmethis-request-feed-refresh";
const requestFeedRefreshEvent = "pleasefindmethis:request-feed-refresh";
const accountProfileStorageKey = "pleasefindmethis-account-profile";
const requestReferenceImagesBucket = "request-reference-images";
const maxPersistedReferenceImages = 4;
const maxPersistedReferenceImageDataUrlLength = 450_000;
const maxPersistedReferenceImagesTotalLength = maxPersistedReferenceImages * maxPersistedReferenceImageDataUrlLength;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const heroHeadlineExamples = [
  "Please help me find this.",
  "Where can I buy this?",
  "Anyone know where this is?",
];
const heroHeadlineHoldMs = 6_000;

function notifyRequestFeedChanged() {
  window.localStorage.setItem(requestFeedRefreshStorageKey, String(Date.now()));
  window.dispatchEvent(new Event(requestFeedRefreshEvent));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function getRelativeTimeLabel(value?: string | null) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const diffMs = Date.now() - date.getTime();
  const absMs = Math.abs(diffMs);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const [unit, unitMs] of units) {
    if (absMs >= unitMs || unit === "minute") {
      return formatter.format(Math.round(-diffMs / unitMs), unit);
    }
  }

  return "Recently";
}

function getCommentTimestampLabel(value?: string | null) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const now = new Date();
  const isSameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);

  if (isSameDay(date, now)) {
    return `Today at ${time}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday at ${time}`;
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" as const }),
  }).format(date);
  return `${dateLabel} at ${time}`;
}

function getStatusLabel(status: string) {
  if (status === "open") {
    return "Open";
  }

  if (status === "archived") {
    return "Archived";
  }

  return status.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function getClosesLabel(daysRemaining?: number | null) {
  if (typeof daysRemaining !== "number" || !Number.isFinite(daysRemaining)) {
    return "30 days";
  }

  if (daysRemaining <= 0) {
    return "Today";
  }

  return `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
}

function getReferenceImage(referenceImages?: RequestRow["reference_images"]) {
  const firstImage = Array.isArray(referenceImages) ? referenceImages.find((image) => image?.url) : null;
  return firstImage?.url || neutralRequestImage;
}

function getMustHaves(details?: string | null) {
  const brief = getRequestBriefFields(details ?? "");
  const source = brief.mustMatch || brief.story || details || "";
  const parts = source
    .split(/\n|\.|;|,|•/)
    .map((part) => part.trim())
    .filter((part) => Boolean(part) && !requestBriefKeyByHeading[normalizeRequestBriefHeading(part)])
    .slice(0, 4);

  return parts.length
    ? parts
    : ["Exact match preferred", "Clear public source URL", "Availability should be current", "Evidence helps visitors verify the match"];
}

function getRequestDescription(itemName: string, details?: string | null) {
  const brief = getRequestBriefFields(details ?? "");
  return brief.story || `Looking for ${itemName || "this exact item"}. Share a clue if you recognize it.`;
}

function publicRequestRowToListing(row: PublicRequestCardRow): RequestListing {
  const details = row.details?.trim() || "Visitors can share a public listing, source clue, or safety note.";

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: "Public request",
    closes: getClosesLabel(row.days_remaining),
    image: row.primary_image_url || neutralRequestImage,
    category: row.category || "General",
    status: getStatusLabel(row.status),
    location: "Open to source suggestions",
    poster: "Requester",
    posted: getRelativeTimeLabel(row.created_at),
    submissions: row.submission_count ?? 0,
    description: getRequestDescription(row.item_name, details),
    mustHaves: getMustHaves(details),
    brief: getRequestBriefFields(details),
    timeline: ["Public request posted", `${row.submission_count ?? 0} public clue${row.submission_count === 1 ? "" : "s"}`, "Visitors can add useful links"],
    live: true,
    createdAt: row.created_at,
    closesAt: row.closes_at ?? undefined,
  };
}

function requestRowToListing(row: RequestRow, submissionCount = 0): RequestListing {
  const createdAt = row.created_at;

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: "Public request",
    closes: `${row.duration_days} days`,
    image: getReferenceImage(row.reference_images),
    category: row.category || "General",
    status: getStatusLabel(row.status),
    location: "Open to source suggestions",
    poster: "You",
    posted: getRelativeTimeLabel(createdAt),
    submissions: submissionCount,
    description: getRequestDescription(row.item_name, row.details),
    mustHaves: getMustHaves(row.details),
    brief: getRequestBriefFields(row.details ?? ""),
    timeline: [
      "Public request posted",
      `${submissionCount} public clue${submissionCount === 1 ? "" : "s"}`,
      "Awaiting useful links",
    ],
    live: row.status === "open",
    createdAt,
  };
}

function requestRowToPublishedSnapshot(row: RequestRow): PublishedRequestSnapshot {
  return {
    requestId: row.id,
    itemName: row.item_name || "Hard-to-find item",
    category: row.category || "General",
    details: row.details?.trim() || `Looking for: ${row.item_name || "this exact item"}`,
    image: getReferenceImage(row.reference_images),
    durationDays: isRequestDuration(row.duration_days) ? row.duration_days : 30,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function usePublicRequestListings(enabled = true, requestId = "") {
  const [listings, setListings] = useState<RequestListing[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [requestNotFound, setRequestNotFound] = useState(false);
  const [resolvedRequestId, setResolvedRequestId] = useState("");
  const [authenticationRequired, setAuthenticationRequired] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setListings([]);
      setLoading(false);
      setError("");
      setRequestNotFound(false);
      setResolvedRequestId("");
      setAuthenticationRequired(false);
      return undefined;
    }

    let mounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setError("");
      setRequestNotFound(false);
      setResolvedRequestId("");
      setAuthenticationRequired(false);

      try {
        if (!supabase) {
          throw new RequestAuthenticationRequiredError();
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (sessionError || !accessToken || sessionData.session?.user.is_anonymous) {
          throw new RequestAuthenticationRequiredError();
        }

        const params = new URLSearchParams();
        if (isUuid(requestId)) {
          params.set("request_id", requestId);
        }
        const endpoint = params.size ? `/api/requests/public?${params.toString()}` : "/api/requests/public";
        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = (await response.json()) as { requests?: PublicRequestCardRow[]; error?: string };

        if (!mounted) {
          return;
        }

        if (response.status === 401) {
          throw new RequestAuthenticationRequiredError();
        }

        if (response.status === 404 && isUuid(requestId)) {
          setListings([]);
          setRequestNotFound(true);
          setResolvedRequestId(requestId);
          setLoading(false);
          return;
        }

        if (!response.ok || !Array.isArray(payload.requests)) {
          throw new Error(payload.error || "Live request feed is not ready yet.");
        }

        setListings(payload.requests.map(publicRequestRowToListing));
        setRequestNotFound(isUuid(requestId) && payload.requests.length === 0);
        setResolvedRequestId(isUuid(requestId) ? requestId : "");
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error instanceof RequestAuthenticationRequiredError) {
          setAuthenticationRequired(true);
          setError("");
          setListings([]);
          setRequestNotFound(false);
          setResolvedRequestId("");
          setLoading(false);
          return;
        }

        setError("Live request feed is not ready yet.");
        setListings([]);
        setRequestNotFound(false);
        setResolvedRequestId(isUuid(requestId) ? requestId : "");
      }

      setLoading(false);
    };

    const refreshRequests = () => {
      void loadRequests();
    };
    const refreshRequestsFromStorage = (event: StorageEvent) => {
      if (event.key === requestFeedRefreshStorageKey) {
        refreshRequests();
      }
    };

    window.addEventListener(requestFeedRefreshEvent, refreshRequests);
    window.addEventListener("storage", refreshRequestsFromStorage);
    refreshRequests();

    return () => {
      mounted = false;
      window.removeEventListener(requestFeedRefreshEvent, refreshRequests);
      window.removeEventListener("storage", refreshRequestsFromStorage);
    };
  }, [enabled, requestId]);

  return { listings, loading, error, requestNotFound, resolvedRequestId, authenticationRequired };
}

class RequestAuthenticationRequiredError extends Error {
  constructor() {
    super("Log in to view requests.");
    this.name = "RequestAuthenticationRequiredError";
  }
}

function hashPublicHelperSeed(seed: string) {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getPublicHelperAlias(seed: string) {
  return uniqueNamesGenerator({
    dictionaries: [colors, animals],
    separator: " ",
    seed,
  });
}

function getPublicHelperAvatarTone(seed: string) {
  return hashPublicHelperSeed(`tone:${seed}`) % 6;
}

function loadCommentAvatarGenerator() {
  if (!commentAvatarGeneratorPromise) {
    commentAvatarGeneratorPromise = Promise.all([
      import("@dicebear/core"),
      import("@dicebear/open-peeps"),
    ])
      .then(([{ createAvatar }, openPeeps]) => (seed: string) => createAvatar(openPeeps, {
        seed,
        face: commentAvatarFaces,
        skinColor: commentAvatarSkinColors,
        maskProbability: 0,
        accessoriesProbability: 33,
      }).toDataUri())
      .catch((error) => {
        // Allow a later render to retry if the lazy avatar chunk fails transiently.
        commentAvatarGeneratorPromise = null;
        throw error;
      });
  }

  return commentAvatarGeneratorPromise;
}

function getCommentAvatarDataUri(alias: string) {
  const seed = alias.trim().toLowerCase() || "anonymous helper";
  const cachedAvatar = commentAvatarCache.get(seed);

  if (cachedAvatar) {
    return Promise.resolve(cachedAvatar);
  }

  const pendingAvatar = commentAvatarRequestCache.get(seed);
  if (pendingAvatar) {
    return pendingAvatar;
  }

  const avatarRequest = loadCommentAvatarGenerator()
    .then((generateAvatar) => {
      const avatar = generateAvatar(seed);
      commentAvatarCache.set(seed, avatar);
      commentAvatarRequestCache.delete(seed);
      return avatar;
    })
    .catch((error) => {
      commentAvatarRequestCache.delete(seed);
      throw error;
    });
  commentAvatarRequestCache.set(seed, avatarRequest);
  return avatarRequest;
}

function CommentAvatar({ alias, eager = false }: { alias: string; eager?: boolean }) {
  const normalizedAlias = alias.trim().toLowerCase() || "anonymous helper";
  const [avatar, setAvatar] = useState(() => commentAvatarCache.get(normalizedAlias) ?? "");
  const [failed, setFailed] = useState(false);
  const fallbackInitials = normalizedAlias
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    let mounted = true;
    const cachedAvatar = commentAvatarCache.get(normalizedAlias);

    if (cachedAvatar) {
      setFailed(false);
      setAvatar(cachedAvatar);
      return () => {
        mounted = false;
      };
    }

    setFailed(false);
    setAvatar("");
    void getCommentAvatarDataUri(normalizedAlias)
      .then((nextAvatar) => {
        if (mounted) {
          setAvatar(nextAvatar);
        }
      })
      .catch(() => {
        if (mounted) {
          setFailed(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [normalizedAlias]);

  return (
    <span className={`comment-avatar ${avatar ? "is-loaded" : failed ? "is-failed" : "is-loading"}`} aria-hidden="true">
      {avatar ? (
        <img
          src={avatar}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
        />
      ) : failed ? fallbackInitials : null}
    </span>
  );
}

function createVisitorSeed() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRequestCommentVisitor(requestId: string) {
  const createVisitor = (seed = createVisitorSeed()) => ({
    seed,
    alias: getPublicHelperAlias(`${seed}:${requestId || "public-request"}`),
    avatarTone: getPublicHelperAvatarTone(`${seed}:${requestId || "public-request"}`),
  });

  try {
    const stored = window.localStorage.getItem(requestCommentVisitorStorageKey);
    const parsed = stored ? (JSON.parse(stored) as { seed?: unknown }) : null;
    const storedSeed = typeof parsed?.seed === "string" ? parsed.seed.trim().slice(0, 160) : "";

    if (storedSeed) {
      requestCommentVisitorMemorySeed = storedSeed;
      return createVisitor(storedSeed);
    }

    const visitor = createVisitor(requestCommentVisitorMemorySeed || undefined);
    requestCommentVisitorMemorySeed = visitor.seed;
    window.localStorage.setItem(requestCommentVisitorStorageKey, JSON.stringify({ seed: visitor.seed }));
    return visitor;
  } catch {
    requestCommentVisitorMemorySeed ||= createVisitorSeed();
    return createVisitor(requestCommentVisitorMemorySeed);
  }
}

function normalizeCommentSourceUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return "";
  }

  try {
    const sourceUrl = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);

    if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") {
      return "";
    }

    sourceUrl.hash = "";

    for (const key of [...sourceUrl.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_|igshid$|ref$|ref_src$)/i.test(key)) {
        sourceUrl.searchParams.delete(key);
      }
    }

    return sourceUrl.toString().slice(0, 1000);
  } catch {
    return "";
  }
}

function getCommentSourceHost(sourceUrl: string | null) {
  if (!sourceUrl) {
    return "";
  }

  try {
    return new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch {
    return "source link";
  }
}

function normalizeRequestComment(row: Partial<PublicRequestCommentRow>, requestId: string): PublicRequestCommentRow {
  const seed = row.id || `${requestId}:${row.created_at || "comment"}`;
  const helperAlias = typeof row.helper_alias === "string" && row.helper_alias.trim() ? row.helper_alias.trim().slice(0, 60) : getPublicHelperAlias(seed);
  const avatarTone = Number(row.helper_avatar_tone);

  return {
    id: typeof row.id === "string" && row.id ? row.id : `local-${createVisitorSeed()}`,
    request_id: typeof row.request_id === "string" && row.request_id ? row.request_id : requestId,
    body: typeof row.body === "string" ? row.body.trim().slice(0, requestCommentMaxLength) : "",
    source_url: typeof row.source_url === "string" && row.source_url ? row.source_url : null,
    helper_alias: helperAlias,
    helper_avatar_tone: Number.isInteger(avatarTone) && avatarTone >= 0 ? avatarTone % 6 : getPublicHelperAvatarTone(seed),
    created_at: typeof row.created_at === "string" && row.created_at ? row.created_at : new Date().toISOString(),
  };
}

function getFallbackRequestComments(request: RequestListing): PublicRequestCommentRow[] {
  if (isUuid(request.id)) {
    return [];
  }

  const firstSeed = `${request.id}:listing-check`;
  const secondSeed = `${request.id}:detail-question`;

  return [
    normalizeRequestComment(
      {
        id: `demo-${request.id}-listing-check`,
        request_id: request.id,
        body: `I checked a few resale listings for ${request.name}. Most are close, but the details still need a better match.`,
        source_url: null,
        helper_alias: getPublicHelperAlias(firstSeed),
        helper_avatar_tone: getPublicHelperAvatarTone(firstSeed),
        created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
      },
      request.id,
    ),
    normalizeRequestComment(
      {
        id: `demo-${request.id}-detail-question`,
        request_id: request.id,
        body: "Do you know the rough year or store where this came from? That clue can narrow the search fast.",
        source_url: null,
        helper_alias: getPublicHelperAlias(secondSeed),
        helper_avatar_tone: getPublicHelperAvatarTone(secondSeed),
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      request.id,
    ),
  ];
}

function useRequestComments(request: RequestListing) {
  const [comments, setComments] = useState<PublicRequestCommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fallbackComments = getFallbackRequestComments(request);

    if (!isUuid(request.id)) {
      setComments(fallbackComments);
      setLoading(false);
      setError("");
      return undefined;
    }

    const loadComments = async () => {
      setLoading(true);
      setError("");

      try {
        if (!supabase) {
          throw new CommentAuthenticationRequiredError();
        }

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (sessionError || !accessToken || sessionData.session?.user.is_anonymous) {
          throw new CommentAuthenticationRequiredError();
        }

        const params = new URLSearchParams({ resource: "comments", request_id: request.id });
        const response = await fetch(`/api/requests/public?${params.toString()}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const payload = (await response.json()) as { comments?: PublicRequestCommentRow[]; error?: string };

        if (!mounted) {
          return;
        }

        if (response.status === 401) {
          throw new CommentAuthenticationRequiredError();
        }

        if (!response.ok || !Array.isArray(payload.comments)) {
          throw new Error(payload.error || "Comments are not ready yet.");
        }

        setComments(payload.comments.map((comment) => normalizeRequestComment(comment, request.id)));
      } catch {
        if (!mounted) {
          return;
        }

        setComments(fallbackComments);
        setError("Comments are not ready yet.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadComments();

    return () => {
      mounted = false;
    };
  }, [request.id, request.name]);

  const addComment = async (
    body: string,
    sourceUrl: string,
    visitor: ReturnType<typeof getRequestCommentVisitor>,
  ) => {
    const normalizedBody = body.trim().slice(0, requestCommentMaxLength);
    const normalizedSourceUrl = normalizeCommentSourceUrl(sourceUrl);

    if (!normalizedBody || normalizedBody.length < 2) {
      throw new Error("Add a short comment before posting.");
    }

    if (sourceUrl.trim() && !normalizedSourceUrl) {
      throw new Error("Add a valid http or https source link.");
    }

    if (!isUuid(request.id)) {
      const localComment = normalizeRequestComment(
        {
          id: `local-${createVisitorSeed()}`,
          request_id: request.id,
          body: normalizedBody,
          source_url: normalizedSourceUrl || null,
          helper_alias: visitor.alias,
          helper_avatar_tone: visitor.avatarTone,
          created_at: new Date().toISOString(),
        },
        request.id,
      );

      setComments((current) => [localComment, ...current]);
      return localComment;
    }

    if (!supabase) {
      throw new CommentAuthenticationRequiredError();
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      throw new CommentAuthenticationRequiredError();
    }

    const params = new URLSearchParams({ resource: "comments", request_id: request.id });
    const response = await fetch(`/api/requests/public?${params.toString()}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: normalizedBody,
        sourceUrl: normalizedSourceUrl || null,
        visitorSeed: visitor.seed,
      }),
    });
    const payload = (await response.json()) as { comment?: PublicRequestCommentRow; error?: string };

    if (response.status === 401) {
      throw new CommentAuthenticationRequiredError();
    }

    if (!response.ok || !payload.comment) {
      throw new Error(payload.error || "Could not post this comment.");
    }

    const savedComment = normalizeRequestComment(payload.comment, request.id);
    setComments((current) => [savedComment, ...current.filter((comment) => comment.id !== savedComment.id)]);
    return savedComment;
  };

  return { comments, loading, error, addComment };
}

class CommentAuthenticationRequiredError extends Error {
  constructor() {
    super("Log in to post a comment.");
    this.name = "CommentAuthenticationRequiredError";
  }
}

async function copyTextToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
}

async function getCurrentSupabaseUser() {
  if (!supabase) {
    throw new Error("Sign in is not available right now.");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw error ?? new Error("Sign in again to continue.");
  }

  return user;
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "proof-file";
}

async function uploadRequestReferenceFiles(userId: string, requestId: string, files: File[]) {
  const referenceImages: Array<{ url: string; name: string; path: string }> = [];
  const uploadedPaths: string[] = [];

  if (!supabase || !files.length) {
    return { referenceImages, uploadedPaths };
  }

  for (const file of files) {
    const filePath = `${userId}/${requestId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from(requestReferenceImagesBucket).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      if (uploadedPaths.length) {
        await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
      }
      throw error;
    }

    uploadedPaths.push(filePath);
    referenceImages.push({
      name: file.name,
      path: filePath,
      url: supabase.storage.from(requestReferenceImagesBucket).getPublicUrl(filePath).data.publicUrl,
    });
  }

  return { referenceImages, uploadedPaths };
}

function readStoredPendingRoute(): Page {
  const storedRoute = window.sessionStorage.getItem(pendingRouteStorageKey);
  return storedRoute && storedRoute in pageRoutes ? (storedRoute as Page) : "post-describe";
}

function normalizeClientAppOrigin(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = new URL(trimmed);
    const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    if (parsed.protocol !== "https:" && !isLocalHost) {
      return "";
    }

    return parsed.origin;
  } catch {
    return "";
  }
}

function isLocalAppHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function getOAuthRedirectUrl() {
  const origin = isLocalAppHost(window.location.hostname) ? window.location.origin : configuredPublicAppOrigin;
  return `${origin}${window.location.pathname}`;
}

function loadGoogleIdentityScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.oauth2?.initTokenClient) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Google sign-in script could not load.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in script could not load."));
    document.head.appendChild(script);
  });
}

async function signInWithGoogleClientId(): Promise<GoogleProfile> {
  if (!googleClientId) {
    throw new Error("Google sign-in needs VITE_GOOGLE_CLIENT_ID in your environment.");
  }

  await loadGoogleIdentityScript();
  const initTokenClient = window.google?.accounts?.oauth2?.initTokenClient;
  if (!initTokenClient) {
    throw new Error("Google sign-in is unavailable in this browser session.");
  }

  const response = await new Promise<GoogleTokenResponse>((resolve) => {
    const tokenClient = initTokenClient({
      client_id: googleClientId,
      scope: "openid email profile",
      callback: resolve,
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  });

  if (response.error || !response.access_token) {
    throw new Error(response.error_description || response.error || "Google sign-in was cancelled.");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${response.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    throw new Error("Google signed in, but the profile could not be verified.");
  }

  return profileResponse.json() as Promise<GoogleProfile>;
}

const exampleRequestListings: RequestListing[] = [
  {
    id: "childhood-rose-blanket",
    name: "Help me find this blanket",
    detail: "Free request",
    closes: "14 days",
    category: "Home goods",
    status: "Open",
    location: "Ships to United States",
    poster: "Rude E.",
    posted: "12 hours ago",
    submissions: 4,
    image: "/find-requests/childhood-blanket.jpg",
    description:
      "Help me find a replacement for this pink rose childhood blanket. It does not have to be new, but the print needs to match.",
    mustHaves: ["Pink rose print", "Same soft blanket style", "Good photo of the match", "Seller or source link"],
    timeline: ["Public request posted", "Four public clues", "Latest link added today"],
  },
  {
    id: "seiko-wired-w543",
    name: "Does anyone know this watch?",
    detail: "Free request",
    closes: "10 days",
    category: "Watches",
    status: "Open",
    location: "Worldwide",
    poster: "Common I.",
    posted: "13 hours ago",
    submissions: 2,
    image: "/find-requests/seiko-wired-watch.jpg",
    description:
      "Looking for this Seiko Wired W543-0AA0 or the closest verified match. A shop link, model number, or used listing would help.",
    mustHaves: ["Digital Seiko Wired style", "Silver bracelet", "Clear listing photos", "Working condition preferred"],
    timeline: ["Public request posted", "Two public links", "Model number being checked"],
  },
  {
    id: "yellow-stay-home-pillow",
    name: "Help me find this pillow",
    detail: "Free request",
    closes: "18 days",
    category: "Home goods",
    status: "Open",
    location: "United States",
    poster: "Lost K.",
    posted: "18 hours ago",
    submissions: 3,
    image: "/find-requests/yellow-home-pillow.jpg",
    description:
      "Trying to find the yellow Threshold pillow that says Let's Stay Home. A current resale link would be perfect.",
    mustHaves: ["Yellow lumbar pillow", "Let's Stay Home text", "Threshold or close match", "Seller can ship"],
    timeline: ["Public request posted", "Three public clues", "One similar listing reviewed"],
  },
  {
    id: "living-and-co-cat-mug",
    name: "Find this cat mug",
    detail: "Free request",
    closes: "7 days",
    category: "Kitchen",
    status: "Open",
    location: "New Zealand or ships worldwide",
    poster: "Bitter J.",
    posted: "2 hours ago",
    submissions: 0,
    image: "/find-requests/living-and-co-mug.jpg",
    description:
      "My mum gave me this Living & Co cat mug and I want another one. Please share any shop or resale listing that still has it.",
    mustHaves: ["Living & Co mug", "Black cat line art", "Same shape if possible", "Uncracked condition"],
    timeline: ["Public request posted", "New request", "Visitors can share links"],
  },
  {
    id: "duck-wall-art",
    name: "Help me find this art",
    detail: "Free request",
    closes: "21 days",
    category: "Art & decor",
    status: "Found",
    location: "United States",
    poster: "Jack S.",
    posted: "2 days ago",
    submissions: 9,
    image: "/find-requests/duck-wall-art-reddit.jpg",
    description:
      "Looking for this framed duck art because we want one for our home. Any artist name, print source, or buying link helps.",
    mustHaves: ["Same duck artwork", "Artist or print source", "Framed or unframed is fine", "Clear buying link"],
    timeline: ["Public request posted", "Visitor shared a link", "Request marked found"],
  },
  {
    id: "walkman-wmd6c",
    name: "Sony Walkman WM-D6C",
    detail: "Working recorder, serviced",
    closes: "23 days",
    category: "Portable audio",
    status: "Open",
    location: "Worldwide",
    poster: "Nora B.",
    posted: "3 hours ago",
    submissions: 0,
    image:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a serviced WM-D6C with reliable playback and recording. Must include a recent test video.",
    mustHaves: ["Recent service preferred", "Records cleanly", "Test video", "No battery leakage"],
    timeline: ["Public request posted", "New request", "Visitors can share links"],
  },
  {
    id: "canon-eos-80d-kit",
    name: "Canon EOS 80D",
    detail: "Body with clean lens",
    closes: "8 days",
    category: "Camera gear",
    status: "Open",
    location: "United States",
    poster: "Maya V.",
    posted: "5 days ago",
    submissions: 8,
    image:
      "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a clean Canon EOS 80D body with a working lens and recent test photos.",
    mustHaves: ["EOS 80D body", "Lens glass is clean", "Shutter count disclosed", "Recent test photo required"],
    timeline: ["Public request posted", "Two public options shared", "Shutter count requested"],
  },
  {
    id: "omega-speedmaster-125",
    name: "Omega Speedmaster",
    detail: "125th anniversary",
    closes: "11 days",
    category: "Watches",
    status: "Found",
    location: "United Kingdom",
    poster: "Jon P.",
    posted: "6 days ago",
    submissions: 6,
    image:
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for an Omega Speedmaster 125 with original bracelet and clear movement documentation.",
    mustHaves: ["Original bracelet", "Movement photos", "Service details", "No polished case preferred"],
    timeline: ["Public request posted", "Public listing found in London", "Authenticity check underway"],
  },
  {
    id: "roland-juno-106",
    name: "Roland Juno-106",
    detail: "Voice board set",
    closes: "19 days",
    category: "Vintage audio",
    status: "Open",
    location: "Worldwide",
    poster: "Eli K.",
    posted: "1 day ago",
    submissions: 2,
    image:
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a tested Juno-106 voice board set for a studio restoration.",
    mustHaves: ["Tested chips", "No corrosion", "Clear board photos", "Ships insured"],
    timeline: ["Public request posted", "Synth forum links added", "Awaiting test clips"],
  },
  {
    id: "cartier-tank-must",
    name: "Cartier Tank Must",
    detail: "Large black dial",
    closes: "14 days",
    category: "Watches",
    status: "Open",
    location: "European Union",
    poster: "Nina L.",
    posted: "2 days ago",
    submissions: 3,
    image:
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a Tank Must large black dial with box or papers preferred.",
    mustHaves: ["Large case", "Black dial", "Serial proof", "Seller or source is reachable"],
    timeline: ["Public request posted", "Three public listings added", "Waiting on papers"],
  },
  {
    id: "contax-t2-silver",
    name: "Contax T2",
    detail: "Silver point-and-shoot",
    closes: "16 days",
    category: "Camera gear",
    status: "Open",
    location: "North America",
    poster: "Luca H.",
    posted: "4 days ago",
    submissions: 4,
    image:
      "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a working Contax T2 silver body with clean lens and reliable flash.",
    mustHaves: ["Clean Zeiss lens", "Flash works", "LCD visible", "Test roll preferred"],
    timeline: ["Public request posted", "Two links ruled out", "New photos requested"],
  },
  {
    id: "gameboy-micro-famicom",
    name: "Game Boy Micro",
    detail: "Famicom edition",
    closes: "22 days",
    category: "Gaming",
    status: "Open",
    location: "Worldwide",
    poster: "Tess G.",
    posted: "8 hours ago",
    submissions: 1,
    image:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=720&q=80",
    description:
      "Wanted: clean Game Boy Micro Famicom edition with bright screen and good buttons.",
    mustHaves: ["Famicom faceplate", "Bright screen", "No dead pixels", "Original charger preferred"],
    timeline: ["Public request posted", "Japan listings reviewed", "First link under review"],
  },
  {
    id: "nakamichi-dragon-door",
    name: "Nakamichi Dragon",
    detail: "Cassette door assembly",
    closes: "25 days",
    category: "Vintage audio",
    status: "Open",
    location: "Worldwide",
    poster: "Martin C.",
    posted: "3 days ago",
    submissions: 0,
    image:
      "https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a clean Nakamichi Dragon cassette door assembly for a repair bench.",
    mustHaves: ["Door assembly", "No cracked tabs", "Original finish", "Macro photos"],
    timeline: ["Public request posted", "New request", "Visitors can share part links"],
  },
  {
    id: "polaroid-sx70-brown",
    name: "Polaroid SX-70",
    detail: "Brown leather folder",
    closes: "10 days",
    category: "Camera gear",
    status: "Open",
    location: "United States",
    poster: "Alba S.",
    posted: "5 hours ago",
    submissions: 2,
    image:
      "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=720&q=80",
    description:
      "Searching for an SX-70 brown leather model with working rollers and clean mirror.",
    mustHaves: ["Brown leather", "Clean mirror", "Rollers work", "Sample exposure"],
    timeline: ["Public request posted", "Two links received", "Waiting on sample photo"],
  },
  {
    id: "ipod-classic-7th",
    name: "iPod Classic",
    detail: "160GB silver",
    closes: "13 days",
    category: "Portable audio",
    status: "Open",
    location: "United States",
    poster: "Sam D.",
    posted: "1 day ago",
    submissions: 5,
    image:
      "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a clean 7th gen iPod Classic 160GB silver with healthy battery.",
    mustHaves: ["160GB model", "Silver face", "Battery holds charge", "No swollen case"],
    timeline: ["Public request posted", "Five public clues", "Battery photos requested"],
  },
  {
    id: "canon-f1-new",
    name: "Canon New F-1",
    detail: "AE finder kit",
    closes: "17 days",
    category: "Camera gear",
    status: "Open",
    location: "Worldwide",
    poster: "Ken O.",
    posted: "2 days ago",
    submissions: 2,
    image:
      "https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a Canon New F-1 with AE finder, working meter, and clean prism.",
    mustHaves: ["AE finder", "Meter works", "Clean prism", "No shutter capping"],
    timeline: ["Public request posted", "Collector-group links added", "Awaiting meter video"],
  },
  {
    id: "minidisc-mz-rh1",
    name: "Sony MZ-RH1",
    detail: "Hi-MD recorder",
    closes: "21 days",
    category: "Portable audio",
    status: "Open",
    location: "Worldwide",
    poster: "Priya N.",
    posted: "2 hours ago",
    submissions: 1,
    image:
      "https://images.unsplash.com/photo-1584735175315-9d5df23860e6?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a Sony MZ-RH1 Hi-MD recorder with working display and USB connection.",
    mustHaves: ["Display works", "USB recognized", "Battery door clean", "Includes dock if possible"],
    timeline: ["Public request posted", "First public link received", "USB proof requested"],
  },
  {
    id: "dreamcast-seaman-mic",
    name: "Dreamcast Seaman",
    detail: "Mic bundle, complete",
    closes: "18 days",
    category: "Gaming",
    status: "Open",
    location: "North America",
    poster: "Otis W.",
    posted: "6 hours ago",
    submissions: 2,
    image:
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=720&q=80",
    description:
      "Need the Dreamcast Seaman game with microphone bundle and complete inserts.",
    mustHaves: ["Mic included", "Disc tested", "Manual present", "Case art clean"],
    timeline: ["Public request posted", "Two store pages checked", "One complete copy under review"],
  },
  {
    id: "technics-sl1200-dustcover",
    name: "Technics SL-1200",
    detail: "Original dust cover",
    closes: "24 days",
    category: "Vintage audio",
    status: "Open",
    location: "United States",
    poster: "Lena A.",
    posted: "3 days ago",
    submissions: 1,
    image:
      "https://images.unsplash.com/photo-1593078165899-cf2d3ac0c895?auto=format&fit=crop&w=720&q=80",
    description:
      "Searching for an original SL-1200 dust cover without hinge cracks.",
    mustHaves: ["Original cover", "No hinge cracks", "Clear acrylic", "Ships protected"],
    timeline: ["Public request posted", "Repair-shop pages checked", "Waiting on photos"],
  },
  {
    id: "pentax-67-wood-grip",
    name: "Pentax 67",
    detail: "Wood grip",
    closes: "12 days",
    category: "Camera gear",
    status: "Open",
    location: "Worldwide",
    poster: "Miles Y.",
    posted: "4 days ago",
    submissions: 3,
    image:
      "https://images.unsplash.com/photo-1500634245200-e5245c7574ef?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a Pentax 67 wood grip in clean condition for a field kit.",
    mustHaves: ["Original wood grip", "Mount screw intact", "No split wood", "Clear side photos"],
    timeline: ["Public request posted", "Three public links received", "Best match missing screw"],
  },
  {
    id: "n64-funtastic-ice-blue",
    name: "Nintendo 64",
    detail: "Ice blue Funtastic",
    closes: "27 days",
    category: "Gaming",
    status: "Open",
    location: "Worldwide",
    poster: "Ivy M.",
    posted: "1 day ago",
    submissions: 4,
    image:
      "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?auto=format&fit=crop&w=720&q=80",
    description:
      "Wanted: ice blue Funtastic Nintendo 64 with matching controller.",
    mustHaves: ["Ice blue shell", "Matching controller", "No yellowed plastic", "Video output proof"],
    timeline: ["Public request posted", "Four listings found", "Controller match pending"],
  },
  {
    id: "bose-aviation-a20",
    name: "Bose A20",
    detail: "Bluetooth aviation headset",
    closes: "20 days",
    category: "Portable audio",
    status: "Open",
    location: "United States",
    poster: "Evan Q.",
    posted: "3 days ago",
    submissions: 2,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a Bose A20 Bluetooth aviation headset in clean working condition.",
    mustHaves: ["Bluetooth model", "Clean ear cups", "ANR works", "Case preferred"],
    timeline: ["Public request posted", "Pilot forum link added", "Two links being checked"],
  },
  {
    id: "hasselblad-a12-back",
    name: "Hasselblad A12",
    detail: "Chrome film back",
    closes: "15 days",
    category: "Camera gear",
    status: "Open",
    location: "Worldwide",
    poster: "Rae F.",
    posted: "2 days ago",
    submissions: 5,
    image:
      "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a chrome Hasselblad A12 film back with matching insert and fresh seals.",
    mustHaves: ["Matching insert", "Chrome finish", "Light seals clean", "Frame spacing proof"],
    timeline: ["Public request posted", "Five public options located", "Best one awaiting test roll"],
  },
  {
    id: "akg-k1000",
    name: "AKG K1000",
    detail: "Ear speaker set",
    closes: "26 days",
    category: "Portable audio",
    status: "Open",
    location: "Worldwide",
    poster: "Noor Z.",
    posted: "4 days ago",
    submissions: 1,
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=720&q=80",
    description:
      "Searching for AKG K1000 ear speakers with balanced drivers and original cable.",
    mustHaves: ["Balanced channels", "Original cable", "No driver buzz", "Pad condition photos"],
    timeline: ["Public request posted", "Audiophile forum link added", "One option needs channel test"],
  },
  {
    id: "neo-geo-pocket-color",
    name: "Neo Geo Pocket",
    detail: "Color anthracite",
    closes: "30 days",
    category: "Gaming",
    status: "Open",
    location: "Worldwide",
    poster: "Drew B.",
    posted: "7 hours ago",
    submissions: 0,
    image:
      "https://images.unsplash.com/photo-1593118247619-e2d6f056869e?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a clean anthracite Neo Geo Pocket Color with responsive stick.",
    mustHaves: ["Anthracite shell", "Responsive stick", "No screen burn", "Battery terminals clean"],
    timeline: ["Public request posted", "New request", "Visitors can share handheld links"],
  },
  {
    id: "aiwa-hs-px1000",
    name: "Aiwa HS-PX1000",
    detail: "Cassette player",
    closes: "28 days",
    category: "Portable audio",
    status: "Open",
    location: "Worldwide",
    poster: "Hazel R.",
    posted: "2 days ago",
    submissions: 1,
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=720&q=80",
    description:
      "Need an Aiwa HS-PX1000 cassette player with clean playback and intact controls.",
    mustHaves: ["Playback works", "Controls intact", "No corrosion", "Demo audio clip"],
    timeline: ["Public request posted", "One collector page found", "Awaiting demo clip"],
  },
  {
    id: "voigtlander-40mm-nokton",
    name: "Voigtlander Nokton",
    detail: "40mm f/1.2 VM",
    closes: "9 days",
    category: "Camera gear",
    status: "Open",
    location: "United States",
    poster: "Chris I.",
    posted: "6 days ago",
    submissions: 2,
    image:
      "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=720&q=80",
    description:
      "Searching for a Voigtlander 40mm f/1.2 VM lens with smooth focus and clean glass.",
    mustHaves: ["VM mount", "Clean glass", "Smooth focus", "Caps included"],
    timeline: ["Public request posted", "Two listings reviewed", "Best match awaiting glass photos"],
  },
];

const workSteps = [
  {
    icon: Search,
    title: "1. Write the request",
    copy: "Add photos, key details, budget, and where you already looked.",
  },
  {
    icon: MessageSquare,
    title: "2. Publish free",
    copy: "Publish it free and receive leads in one place.",
  },
  {
    icon: BadgeCheck,
    title: "3. Review suggestions",
    copy: "Review each lead and pick the best match.",
  },
];

function getRoutePath(page: Page) {
  if (page === "landing") {
    return "/";
  }

  return `/${pageRoutes[page]}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function getShareSubject(itemName: string) {
  const normalized = itemName
    .trim()
    .replace(/^help\s+me\s+find\s+/i, "")
    .replace(/^find\s+/i, "")
    .replace(/^does\s+anyone\s+know\s+/i, "")
    .replace(/[?.!]+$/, "")
    .trim();
  return normalized || itemName.trim() || "this exact item";
}

function getRequestPath(requestId: string, requestName = "") {
  const slug = slugify(requestName);
  return `/requests/${encodeURIComponent(requestId)}${slug ? `/${slug}` : ""}`;
}

function getCanonicalUrl(path: string) {
  return new URL(path, siteOrigin).toString();
}

function toAbsoluteUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl, siteOrigin).toString();
  } catch {
    return defaultSeoImage;
  }
}

function parseRoutePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized === "/" ? "/" : normalized.replace(/^\/+/, "");
}

function getLegacyHashRoute() {
  if (!window.location.hash.startsWith("#/")) {
    return "";
  }

  return window.location.hash.replace(/^#\/?/, "").split("?")[0] || "/";
}

function getCurrentRawRoute() {
  return getLegacyHashRoute() || parseRoutePath(window.location.pathname);
}

function getRequestIdFromRawRoute(rawRoute: string) {
  const match = rawRoute.match(/^requests\/([^/?#]+)(?:\/[^?#]+)?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getRequestIdFromCurrentRoute() {
  return getRequestIdFromRawRoute(getCurrentRawRoute());
}

function parseRoute(): Page {
  const raw = getCurrentRawRoute();
  if (getRequestIdFromRawRoute(raw)) {
    return "request-detail";
  }

  return routeMap[raw] ?? "not-found";
}

function getCurrentSearchParams() {
  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.split("?")[1] ?? "";

  if (hashQuery) {
    const hashParams = new URLSearchParams(hashQuery);
    hashParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });
  }

  return params;
}

function getStarterPromptById(value?: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  const aliasMap: Record<string, PostStarterId> = {
    blanket: "sentimental",
    childhood: "sentimental",
    lost: "sentimental",
    plush: "sentimental",
    sentimental: "sentimental",
    toy: "sentimental",
    camera: "rare-gear",
    collector: "rare-gear",
    gear: "rare-gear",
    rare: "rare-gear",
    "rare-gear": "rare-gear",
    soldout: "rare-gear",
    "sold-out": "rare-gear",
    discontinued: "parts",
    part: "parts",
    parts: "parts",
    repair: "parts",
    accessory: "fashion",
    bag: "fashion",
    clothing: "fashion",
    dress: "fashion",
    fashion: "fashion",
    jewelry: "fashion",
    shirt: "fashion",
    shoes: "fashion",
  };
  const starterId = aliasMap[normalized] ?? (posterStarterPrompts.some((prompt) => prompt.id === normalized) ? (normalized as PostStarterId) : null);
  return starterId ? posterStarterPrompts.find((prompt) => prompt.id === starterId) ?? null : null;
}

function cleanStarterParam(value: string | null, maxLength: number) {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getAcquisitionStarterFromUrl() {
  const params = getCurrentSearchParams();
  const prompt = getStarterPromptById(params.get("starter") ?? params.get("type") ?? params.get("intent"));

  if (!prompt) {
    return null;
  }

  const itemName = cleanStarterParam(params.get("item"), 96);
  const context = cleanStarterParam(params.get("context"), 240);

  return {
    prompt,
    draft: {
      itemName: itemName || prompt.itemName,
      category: prompt.category,
      details: context ? `${prompt.details}\n\nContext: ${context}` : prompt.details,
      durationDays: prompt.durationDays,
      emailClueNotifications: false,
    } satisfies PostDraft,
  };
}

function isRequestCategory(value: unknown): value is RequestCategory {
  return typeof value === "string" && requestCategories.some((category) => category.value === value);
}

function isRequestDuration(value: unknown): value is RequestDuration {
  return value === 7 || value === 14 || value === 30 || value === 60;
}

function postDraftToStoredDraft(draft: PostDraft): StoredPostDraft {
  return {
    itemName: draft.itemName,
    category: draft.category,
    details: draft.details,
    durationDays: draft.durationDays,
    emailClueNotifications: draft.emailClueNotifications,
  };
}

function storedDraftToPostDraft(storedDraft: StoredPostDraft): PostDraft {
  return storedDraft;
}

function readStoredPostDraft(): PostDraft | null {
  try {
    const raw = window.sessionStorage.getItem(postDraftStorageKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredPostDraft>;
    const itemName = typeof parsed.itemName === "string" ? parsed.itemName.slice(0, 120) : initialPostDraft.itemName;
    const details = typeof parsed.details === "string" ? parsed.details.slice(0, 5000) : "";
    const category = isRequestCategory(parsed.category) ? parsed.category : initialPostDraft.category;
    const durationDays = isRequestDuration(parsed.durationDays) ? parsed.durationDays : initialPostDraft.durationDays;

    return storedDraftToPostDraft({
      itemName,
      category,
      details,
      durationDays,
      emailClueNotifications: parsed.emailClueNotifications === true,
    });
  } catch {
    return null;
  }
}

function writeStoredPostDraft(draft: PostDraft) {
  try {
    window.sessionStorage.setItem(postDraftStorageKey, JSON.stringify(postDraftToStoredDraft(draft)));
  } catch {
    // Draft persistence is helpful for auth redirects, but the form still works if storage is blocked.
  }
}

function clearStoredPostDraft() {
  try {
    window.sessionStorage.removeItem(postDraftStorageKey);
  } catch {
    // Clearing the saved draft is best-effort only.
  }
}

function dataUrlToFile(dataUrl: string, name: string, lastModified = Date.now()) {
  const [metadata, encodedData = ""] = dataUrl.split(",", 2);
  const mimeType = metadata.match(/^data:([^;]+);base64$/)?.[1] || "image/jpeg";
  const binary = window.atob(encodedData);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], name, { type: mimeType, lastModified });
}

function readStoredPostReferenceImageDrafts(): PostReferenceImageDraft[] {
  try {
    const raw = window.sessionStorage.getItem(postReferenceImagesStorageKey);
    if (!raw || raw.length > maxPersistedReferenceImagesTotalLength + 20_000) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    let totalLength = 0;
    return parsed.slice(0, maxPersistedReferenceImages).flatMap((entry) => {
      const candidate = entry as Partial<StoredPostReferenceImageDraft>;
      if (
        typeof candidate.name !== "string" ||
        typeof candidate.type !== "string" ||
        typeof candidate.lastModified !== "number" ||
        typeof candidate.dataUrl !== "string" ||
        !candidate.dataUrl.startsWith("data:image/") ||
        candidate.dataUrl.length > maxPersistedReferenceImageDataUrlLength
      ) {
        return [];
      }

      totalLength += candidate.dataUrl.length;
      if (totalLength > maxPersistedReferenceImagesTotalLength) {
        return [];
      }

      try {
        return [{
          file: dataUrlToFile(candidate.dataUrl, candidate.name.slice(0, 160), candidate.lastModified),
          name: candidate.name.slice(0, 160),
          dataUrl: candidate.dataUrl,
        }];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

function writeStoredPostReferenceImageDrafts(drafts: PostReferenceImageDraft[]) {
  try {
    const storedDrafts: StoredPostReferenceImageDraft[] = drafts.slice(0, maxPersistedReferenceImages).map((draft) => ({
      name: draft.name.slice(0, 160),
      type: draft.file.type || "image/jpeg",
      lastModified: draft.file.lastModified,
      dataUrl: draft.dataUrl,
    }));
    const totalLength = storedDrafts.reduce((total, draft) => total + draft.dataUrl.length, 0);

    if (
      storedDrafts.some((draft) => !draft.dataUrl.startsWith("data:image/") || draft.dataUrl.length > maxPersistedReferenceImageDataUrlLength) ||
      totalLength > maxPersistedReferenceImagesTotalLength
    ) {
      return false;
    }

    if (storedDrafts.length) {
      window.sessionStorage.setItem(postReferenceImagesStorageKey, JSON.stringify(storedDrafts));
    } else {
      window.sessionStorage.removeItem(postReferenceImagesStorageKey);
    }
    return true;
  } catch {
    return false;
  }
}

function clearStoredPostReferenceImageDrafts() {
  try {
    window.sessionStorage.removeItem(postReferenceImagesStorageKey);
  } catch {
    // Clearing an image draft is best-effort only.
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read this photo.")));
    reader.onerror = () => reject(new Error("Could not read this photo."));
    reader.readAsDataURL(file);
  });
}

function loadDraftImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This photo format cannot be prepared for sign-in. Try a JPEG, PNG, or WebP image."));
    image.src = dataUrl;
  });
}

async function preparePostReferenceImageDraft(file: File): Promise<PostReferenceImageDraft> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name || "This file"} is not a supported photo.`);
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  if (originalDataUrl.length <= maxPersistedReferenceImageDataUrlLength) {
    return { file, name: file.name, dataUrl: originalDataUrl };
  }

  const image = await loadDraftImage(originalDataUrl);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser could not prepare the photo. Try a smaller image.");
  }

  let scale = Math.min(1, 1440 / Math.max(image.naturalWidth, image.naturalHeight));
  let quality = 0.84;
  let dataUrl = "";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    dataUrl = canvas.toDataURL("image/jpeg", quality);

    if (dataUrl.length <= maxPersistedReferenceImageDataUrlLength) {
      const safeName = `${file.name.replace(/\.[^.]+$/, "") || "request-photo"}.jpg`;
      return {
        file: dataUrlToFile(dataUrl, safeName, file.lastModified),
        name: safeName,
        dataUrl,
      };
    }

    if (quality > 0.54) {
      quality -= 0.1;
    } else {
      scale *= 0.78;
      quality = 0.76;
    }
  }

  throw new Error(`${file.name || "This photo"} is still too large to carry safely through sign-in. Try a smaller image.`);
}

function readStoredPublishedRequest(): PublishedRequestSnapshot | null {
  try {
    const raw = window.sessionStorage.getItem(publishedRequestStorageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<PublishedRequestSnapshot>;
    if (
      typeof parsed.requestId !== "string" ||
      typeof parsed.itemName !== "string" ||
      typeof parsed.category !== "string" ||
      typeof parsed.details !== "string" ||
      typeof parsed.image !== "string" ||
      typeof parsed.createdAt !== "string" ||
      !isRequestDuration(parsed.durationDays)
    ) {
      return null;
    }

    return {
      requestId: parsed.requestId,
      itemName: parsed.itemName.slice(0, 120),
      category: parsed.category.slice(0, 80),
      details: parsed.details.slice(0, 5000),
      image: parsed.image.startsWith("data:image/")
        ? parsed.image.slice(0, maxPersistedReferenceImageDataUrlLength)
        : parsed.image.slice(0, 1000),
      durationDays: parsed.durationDays,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

function writeStoredPublishedRequest(snapshot: PublishedRequestSnapshot) {
  try {
    window.sessionStorage.setItem(publishedRequestStorageKey, JSON.stringify(snapshot));
  } catch {
    // The share screen still works from in-memory state when storage is unavailable.
  }
}

function getDefaultAccountProfile(): AccountProfile {
  const email = window.sessionStorage.getItem(authEmailStorageKey) ?? "";

  return {
    displayName: "",
    handle: "",
    region: "",
    specialty: "",
    notificationEmail: email,
  };
}

function normalizeAccountProfile(profile: Partial<AccountProfile>): AccountProfile {
  const defaults = getDefaultAccountProfile();

  return {
    displayName: typeof profile.displayName === "string" ? profile.displayName.slice(0, 80) : defaults.displayName,
    handle: typeof profile.handle === "string" ? profile.handle.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) : defaults.handle,
    region: typeof profile.region === "string" ? profile.region.slice(0, 80) : defaults.region,
    specialty: typeof profile.specialty === "string" ? profile.specialty.slice(0, 160) : defaults.specialty,
    notificationEmail: typeof profile.notificationEmail === "string" ? profile.notificationEmail.slice(0, 160) : defaults.notificationEmail,
  };
}

function readStoredAccountProfile(): AccountProfile {
  try {
    const raw = window.localStorage.getItem(accountProfileStorageKey);

    if (!raw) {
      return getDefaultAccountProfile();
    }

    return normalizeAccountProfile(JSON.parse(raw) as Partial<AccountProfile>);
  } catch {
    return getDefaultAccountProfile();
  }
}

function writeStoredAccountProfile(profile: AccountProfile) {
  try {
    window.localStorage.setItem(accountProfileStorageKey, JSON.stringify(normalizeAccountProfile(profile)));
  } catch {
    // Account settings still remain editable if local storage is unavailable.
  }
}

function getInitialPostDraft() {
  const starter = getAcquisitionStarterFromUrl();

  if (starter) {
    writeStoredPostDraft(starter.draft);
    return starter.draft;
  }

  return readStoredPostDraft() ?? initialPostDraft;
}

function routeHref(page: Page, requestId?: string, requestName?: string) {
  if (page === "request-detail" && requestId) {
    return getRequestPath(requestId, requestName);
  }

  return getRoutePath(page);
}

function handleRoutedAnchorClick(event: React.MouseEvent<HTMLAnchorElement>, action: () => void) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
    return;
  }

  event.preventDefault();
  action();
}

function trackAcquisitionEvent(name: string, properties: AnalyticsProperties = {}) {
  try {
    trackMarketingEvent(name, properties);
  } catch {
    // Analytics must never block the request-board flow.
  }
}

function getInitialRoute(): Page {
  return parseRoute();
}

function getAppHistoryState(): AppHistoryState {
  const state = window.history.state;
  return state && typeof state === "object" ? (state as AppHistoryState) : {};
}

function saveCurrentHistoryScrollPosition() {
  window.history.replaceState(
    { ...getAppHistoryState(), scrollY: Math.max(0, Math.round(window.scrollY)) },
    "",
    window.location.href,
  );
}

function restoreCurrentHistoryScrollPosition() {
  const savedScrollY = getAppHistoryState().scrollY;
  const scrollY = typeof savedScrollY === "number" && Number.isFinite(savedScrollY) ? Math.max(0, savedScrollY) : 0;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    });
  });
}

function getSeoMeta(page: Page, activeRequest?: RequestListing): SeoMeta {
  if (page === "request-detail" && activeRequest) {
    const description = `${activeRequest.description} ${activeRequest.category} request, ${activeRequest.closes} left. Visitors can add public links and clues.`;

    return {
      title: `${activeRequest.name} Find Request | pleasefindmethis`,
      description: description.slice(0, 240),
      path: getRequestPath(activeRequest.id, activeRequest.name),
      robots: activeRequest.live ? "index,follow" : "noindex,follow",
      image: activeRequest.image.startsWith("data:image/") ? defaultSeoImage : toAbsoluteUrl(activeRequest.image),
    };
  }

  const copy = pageSeoCopy[page] ?? pageSeoCopy["not-found"];

  return {
    ...copy,
    path: getRoutePath(page),
    robots: indexablePages.has(page) ? "index,follow" : "noindex,follow",
    image: defaultSeoImage,
  };
}

function setMetaTag(attribute: "name" | "property", value: string, content: string) {
  let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, value);
    document.head.appendChild(meta);
  }

  meta.content = content;
}

function setCanonicalLink(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = href;
}

function createItemListSchema(requests: RequestListing[], pagePath: string): JsonLdNode {
  return {
    "@type": "ItemList",
    "@id": `${getCanonicalUrl(pagePath)}#request-list`,
    name: "Hard-to-find item requests",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: Math.min(requests.length, 10),
    itemListElement: requests.slice(0, 10).map((request, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: request.name,
        description: request.description,
        image: request.image.startsWith("data:image/") ? defaultSeoImage : toAbsoluteUrl(request.image),
        url: getCanonicalUrl(getRequestPath(request.id, request.name)),
        additionalType: request.category,
      },
    })),
  };
}

function createRequestWorkspaceSchema(organizationId: string): JsonLdNode {
  return {
    "@type": "WebApplication",
    "@id": `${siteOrigin}/#application`,
    name: "pleasefindmethis item-search workspace",
    alternateName: siteName,
    url: siteOrigin,
    publisher: { "@id": organizationId },
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description: "A self-serve web app for creating, sharing, and organizing hard-to-find item search briefs and public clues.",
    featureList: [
      "Structured item-search briefs",
      "Photo references",
      "Shareable request pages",
      "Public source links and clues",
    ],
    termsOfService: `${siteOrigin}/terms`,
  };
}

function createLandingHowToSchema(canonicalUrl: string): JsonLdNode {
  return {
    "@type": "HowTo",
    "@id": `${canonicalUrl}#post-find-request-howto`,
    name: "How to post a free find request",
    description: "Step-by-step: create a free public request and collect useful links and clues.",
    step: workSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.copy,
    })),
  };
}

function createBreadcrumbSchema(page: Page, meta: SeoMeta, activeRequest?: RequestListing): JsonLdNode {
  const currentName = page === "request-detail" && activeRequest ? activeRequest.name : pageLabels[page] ?? meta.title;

  return {
    "@type": "BreadcrumbList",
    "@id": `${getCanonicalUrl(meta.path)}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteOrigin,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: currentName,
        item: getCanonicalUrl(meta.path),
      },
    ],
  };
}

function createStructuredData(page: Page, meta: SeoMeta, requests: RequestListing[], activeRequest?: RequestListing) {
  const canonicalUrl = getCanonicalUrl(meta.path);
  const organizationId = `${siteOrigin}/#organization`;
  const websiteId = `${siteOrigin}/#website`;
  const webpageId = `${canonicalUrl}#webpage`;
  const webPage: JsonLdNode = {
    "@type": "WebPage",
    "@id": webpageId,
    url: canonicalUrl,
    name: meta.title,
    description: meta.description,
    isPartOf: { "@id": websiteId },
    publisher: { "@id": organizationId },
    dateModified: siteLastUpdated,
    inLanguage: "en",
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: meta.image,
    },
  };

  if (page === "landing") {
    webPage.mainEntity = { "@id": `${siteOrigin}/#service` };
  }

  if (page === "request-detail" && activeRequest) {
    webPage.mainEntity = { "@id": `${canonicalUrl}#request` };
  }

  const graph: JsonLdNode[] = [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteName,
      url: siteOrigin,
      logo: organizationLogo,
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer help",
          email: "support@pleasefindmethis.com",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      name: siteName,
      url: siteOrigin,
      description: defaultSeoDescription,
      publisher: { "@id": organizationId },
    },
    createRequestWorkspaceSchema(organizationId),
    webPage,
  ];

  if (page === "landing" || page === "browse" || page === "browse-all") {
    graph.push(createItemListSchema(requests, meta.path));
  }

  if (page !== "landing") {
    graph.push(createBreadcrumbSchema(page, meta, activeRequest));
  }

  if (page === "landing") {
    graph.push(createLandingHowToSchema(canonicalUrl));
  }

  if (page === "request-detail" && activeRequest) {
    graph.push({
      "@type": "Thing",
      "@id": `${canonicalUrl}#request`,
      url: canonicalUrl,
      name: activeRequest.name,
      description: activeRequest.description,
      image: activeRequest.image.startsWith("data:image/") ? defaultSeoImage : toAbsoluteUrl(activeRequest.image),
      additionalType: activeRequest.category,
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

function setStructuredData(data: JsonLdNode) {
  let script = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"][data-seo-schema="site"]');

  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoSchema = "site";
    document.head.appendChild(script);
  }

  script.text = JSON.stringify(data);
}

function updateDocumentSeo(page: Page, requests: RequestListing[], activeRequest?: RequestListing) {
  const meta = getSeoMeta(page, activeRequest);
  const canonicalUrl = getCanonicalUrl(meta.path);
  const socialDescription = meta.socialDescription ?? meta.description;

  document.title = meta.title;
  setMetaTag("name", "description", meta.description);
  setMetaTag("name", "robots", meta.robots);
  setMetaTag("property", "og:type", "website");
  setMetaTag("property", "og:site_name", siteName);
  setMetaTag("property", "og:title", meta.title);
  setMetaTag("property", "og:description", socialDescription);
  setMetaTag("property", "og:url", canonicalUrl);
  setMetaTag("property", "og:image", meta.image);
  setMetaTag("property", "og:image:secure_url", meta.image);
  setMetaTag("property", "og:image:type", "image/png");
  setMetaTag("property", "og:image:width", defaultSeoImageWidth);
  setMetaTag("property", "og:image:height", defaultSeoImageHeight);
  setMetaTag("property", "og:image:alt", defaultSeoImageAlt);
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", meta.title);
  setMetaTag("name", "twitter:description", socialDescription);
  setMetaTag("name", "twitter:image", meta.image);
  setMetaTag("name", "twitter:image:alt", defaultSeoImageAlt);
  setCanonicalLink(canonicalUrl);
  setStructuredData(createStructuredData(page, meta, requests, activeRequest));
}

function getCategoryLabel(category: RequestCategory) {
  return requestCategories.find((item) => item.value === category)?.label ?? "General";
}

function App() {
  const [route, setRoute] = useState<Page>(() => getInitialRoute());
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(() => !supabase && window.sessionStorage.getItem(signedInStorageKey) === "true");
  const [authResolved, setAuthResolved] = useState(() => !supabase);
  const [pendingRoute, setPendingRoute] = useState<Page>(() => readStoredPendingRoute());
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authBusyAction, setAuthBusyAction] = useState<AuthBusyAction>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [emailOtpSentTo, setEmailOtpSentTo] = useState("");
  const [postDraft, setPostDraft] = useState<PostDraft>(() => getInitialPostDraft());
  const [postReferenceImageDrafts, setPostReferenceImageDrafts] = useState<PostReferenceImageDraft[]>(() => readStoredPostReferenceImageDrafts());
  const [postReferenceImagePersistenceError, setPostReferenceImagePersistenceError] = useState("");
  const [publishedRequest, setPublishedRequest] = useState<PublishedRequestSnapshot | null>(() => readStoredPublishedRequest());
  const [activeRequestId, setActiveRequestId] = useState(() => getRequestIdFromCurrentRoute() || exampleRequestListings[0].id);
  const requestDataAccessAllowed = authResolved && signedIn && canLoadRequestData(route, { authResolved, signedIn });
  const visibleRoute = protectedPages.has(route) && (!authResolved || !signedIn) ? "auth" : route;
  const {
    listings: liveRequests,
    loading: publicRequestsLoading,
    error: publicRequestsError,
    requestNotFound: publicRequestNotFound,
    resolvedRequestId: resolvedPublicRequestId,
    authenticationRequired: publicRequestAuthenticationRequired,
  } = usePublicRequestListings(
    requestDataAccessAllowed && routeUsesPublicRequestFeed(visibleRoute),
    visibleRoute === "request-detail" ? activeRequestId : "",
  );
  const requestListings = useMemo(() => mergeRequestListings(liveRequests, exampleRequestListings), [liveRequests]);
  const requestListingsAreExamples = liveRequests.length === 0;
  const acquisitionStarter = getAcquisitionStarterFromUrl();

  useEffect(() => {
    initializeGoogleAnalytics();
  }, []);

  useEffect(() => {
    if (!publicRequestAuthenticationRequired) {
      return;
    }

    window.sessionStorage.removeItem(signedInStorageKey);
    setSignedIn(false);
    setAuthResolved(true);
    if (supabase) {
      void supabase.auth.signOut({ scope: "local" });
    }
  }, [publicRequestAuthenticationRequired]);

  useEffect(() => {
    const didPersist = writeStoredPostReferenceImageDrafts(postReferenceImageDrafts);
    setPostReferenceImagePersistenceError(
      didPersist || !postReferenceImageDrafts.length
        ? ""
        : "These photos could not be saved for the sign-in handoff. Remove some photos or choose smaller files before continuing.",
    );
  }, [postReferenceImageDrafts]);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const syncRoute = () => {
      const routeRequestId = getRequestIdFromCurrentRoute();
      if (routeRequestId) {
        setActiveRequestId(routeRequestId);
      }
      setRoute(parseRoute());
      setMenuOpen(false);
      restoreCurrentHistoryScrollPosition();
    };

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    if (visibleRoute !== "browse" && visibleRoute !== "browse-all") {
      return;
    }

    restoreCurrentHistoryScrollPosition();
    let scrollFrame = 0;
    const handleScroll = () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = window.requestAnimationFrame(() => {
        saveCurrentHistoryScrollPosition();
        scrollFrame = 0;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [requestListings.length, visibleRoute]);

  const requestedDetailRequest = useMemo(() => {
    if (visibleRoute !== "request-detail") {
      return null;
    }

    if (isUuid(activeRequestId)) {
      return liveRequests.find((request) => request.id === activeRequestId) ?? null;
    }

    return exampleRequestListings.find((request) => request.id === activeRequestId) ?? null;
  }, [activeRequestId, liveRequests, visibleRoute]);
  const activeRequest = useMemo(
    () => requestedDetailRequest ?? requestListings.find((request) => request.id === activeRequestId) ?? requestListings[0] ?? exampleRequestListings[0],
    [activeRequestId, requestListings, requestedDetailRequest],
  );
  const exactRequestLoading =
    visibleRoute === "request-detail" &&
    isUuid(activeRequestId) &&
    (publicRequestsLoading || resolvedPublicRequestId !== activeRequestId);
  const exactRequestUnavailable =
    visibleRoute === "request-detail" &&
    isUuid(activeRequestId) &&
    !exactRequestLoading &&
    resolvedPublicRequestId === activeRequestId &&
    Boolean(publicRequestsError);
  const requestedRequestMissing =
    visibleRoute === "request-detail" &&
    ((isUuid(activeRequestId) && !exactRequestLoading && !publicRequestsError && publicRequestNotFound) ||
      (!isUuid(activeRequestId) && !requestedDetailRequest));

  useEffect(() => {
    updateDocumentSeo(visibleRoute, requestListings, visibleRoute === "request-detail" ? requestedDetailRequest ?? undefined : activeRequest);
  }, [activeRequest, requestListings, requestedDetailRequest, visibleRoute]);

  useEffect(() => {
    trackPageView({
      route: visibleRoute,
      request_id: visibleRoute === "request-detail" ? activeRequestId : undefined,
      category: visibleRoute === "request-detail" ? requestedDetailRequest?.category : undefined,
      signed_in: signedIn,
    });

    if (visibleRoute === "landing") {
      trackAcquisitionEvent("landing_view", {
        signed_in: signedIn,
      });
    }
  }, [activeRequestId, requestedDetailRequest?.category, signedIn, visibleRoute]);

  useEffect(() => {
    if (visibleRoute !== "request-detail") {
      return;
    }

    const params = getCurrentSearchParams();
    if (params.get("utm_source") !== "product_share") {
      return;
    }

    const eventKey = `pleasefindmethis-shared-landing-${activeRequestId}`;
    if (window.sessionStorage.getItem(eventKey)) {
      return;
    }

    window.sessionStorage.setItem(eventKey, "true");
    trackAcquisitionEvent("shared_request_landed", {
      request_id: activeRequestId,
      category: requestedDetailRequest?.category,
      share_channel: params.get("share_channel") ?? undefined,
    });
  }, [activeRequestId, requestedDetailRequest?.category, visibleRoute]);

  useEffect(() => {
    const starter = getAcquisitionStarterFromUrl();

    if (!starter) {
      return;
    }

    setPostDraft(starter.draft);
    writeStoredPostDraft(starter.draft);
    trackAcquisitionEvent("starter_link_viewed", {
      starter_id: starter.prompt.id,
      starter_label: starter.prompt.label,
      has_item_param: starter.draft.itemName !== starter.prompt.itemName,
    });
  }, []);

  const navigate = (
    page: Page,
    routeRequestId = activeRequestId,
    routeRequestName = "",
    nextHistoryState: AppHistoryState = {},
  ) => {
    const targetPath = routeHref(page, routeRequestId, routeRequestName);

    setMenuOpen(false);
    saveCurrentHistoryScrollPosition();
    if (window.location.pathname === targetPath && !window.location.search && !window.location.hash) {
      window.history.replaceState({ ...getAppHistoryState(), ...nextHistoryState, scrollY: 0 }, "", window.location.href);
      setRoute(page);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    window.history.pushState({ scrollY: 0, ...nextHistoryState }, "", targetPath);
    setRoute(page);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const requireAuth = (target: Page, mode: AuthMode = "signup") => {
    setPendingRoute(target);
    setAuthMode(mode);
    setAuthMessage("");
    setEmailOtpSentTo("");
    window.sessionStorage.setItem(pendingRouteStorageKey, target);
    if (signedIn) {
      navigate(target);
      return;
    }
    navigate("auth");
  };

  const requireCommentAuth = (request: RequestListing) => {
    setActiveRequestId(request.id);
    window.sessionStorage.setItem(pendingRequestIdStorageKey, request.id);
    window.sessionStorage.setItem(pendingRequestNameStorageKey, request.name);
    requireAuth("request-detail", "login");
  };

  const goToDetail = (requestId: string) => {
    const targetRequest = requestListings.find((request) => request.id === requestId);
    const requestListReturnRoute: RequestListPage | undefined =
      visibleRoute === "browse" || visibleRoute === "browse-all" ? visibleRoute : undefined;
    setActiveRequestId(requestId);
    navigate(
      "request-detail",
      requestId,
      targetRequest?.name ?? "",
      requestListReturnRoute ? { requestListReturnRoute } : {},
    );
  };

  const returnToRequestList = () => {
    if (getAppHistoryState().requestListReturnRoute) {
      window.history.back();
      return;
    }

    navigate("browse-all");
  };

  const markSignedIn = (provider = "email", email?: string) => {
    const pendingRequestId = window.sessionStorage.getItem(pendingRequestIdStorageKey) ?? "";
    const pendingRequestName = window.sessionStorage.getItem(pendingRequestNameStorageKey) ?? "";
    window.sessionStorage.setItem(signedInStorageKey, "true");
    window.sessionStorage.setItem(authProviderStorageKey, provider);
    if (email) {
      window.sessionStorage.setItem(authEmailStorageKey, email);
    }
    window.sessionStorage.removeItem(pendingRouteStorageKey);
    window.sessionStorage.removeItem(pendingRequestIdStorageKey);
    window.sessionStorage.removeItem(pendingRequestNameStorageKey);
    setEmailOtpSentTo("");
    setAuthMessage("");
    setSignedIn(true);
    setAuthResolved(true);
    trackAcquisitionEvent("auth_completed", {
      provider,
      pending_route: pendingRoute,
    });
    navigate(pendingRoute, pendingRequestId || activeRequestId, pendingRequestName);
  };

  const changeAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setEmailOtpSentTo("");
    setAuthMessage("");
  };

  const requestEmailAuthCode = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    setAuthMessage("");

    if (!emailPattern.test(normalizedEmail)) {
      setAuthMessage("Enter a valid email address so we can send your sign-in code.");
      return;
    }

    trackAcquisitionEvent(authMode === "signup" ? "signup_code_requested" : "login_code_requested", {
      pending_route: pendingRoute,
    });
    window.sessionStorage.setItem(pendingRouteStorageKey, pendingRoute);
    setAuthBusyAction("email");

    try {
      if (supabase) {
        const { error } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: authMode === "signup",
            emailRedirectTo: getOAuthRedirectUrl(),
          },
        });

        if (error) {
          throw error;
        }

        setEmailOtpSentTo(normalizedEmail);
        window.sessionStorage.setItem(authEmailStorageKey, normalizedEmail);
        setAuthMessage(`We sent a 6-digit code to ${normalizedEmail}. Enter it below to continue.`);
        return;
      }

      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        setEmailOtpSentTo(normalizedEmail);
        window.sessionStorage.setItem(authEmailStorageKey, normalizedEmail);
        setAuthMessage(`Use demo code 123456 for ${normalizedEmail} on localhost.`);
        return;
      }

      throw new Error("Email verification needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "We could not send the code. Check the email address and try again.");
    } finally {
      setAuthBusyAction(null);
    }
  };

  const verifyEmailAuthCode = async (code: string) => {
    const token = code.trim().replace(/\s+/g, "");

    setAuthMessage("");

    if (!emailOtpSentTo) {
      setAuthMessage("Send a verification code first, then enter it here.");
      return;
    }

    if (!/^\d{6}$/.test(token)) {
      setAuthMessage("Enter the 6-digit code from your email. Use numbers only.");
      return;
    }

    setAuthBusyAction("email");

    try {
      if (supabase) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: emailOtpSentTo,
          token,
          type: "email",
        });

        if (error) {
          throw error;
        }

        markSignedIn("email", data.user?.email ?? emailOtpSentTo);
        return;
      }

      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        if (token !== "123456") {
          throw new Error("Use demo code 123456 for local email verification.");
        }

        markSignedIn("email-demo", emailOtpSentTo);
        return;
      }

      throw new Error("Email verification needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Could not verify that code.");
    } finally {
      setAuthBusyAction(null);
    }
  };

  const logOut = async () => {
    const shouldReturnHome = protectedPages.has(route) || route === "auth";

    setMenuOpen(false);
    setAuthMessage("");
    setEmailOtpSentTo("");

    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Local logout still gives the user an immediate escape from the account UI.
    }

    window.sessionStorage.removeItem(signedInStorageKey);
    window.sessionStorage.removeItem(authProviderStorageKey);
    window.sessionStorage.removeItem(authEmailStorageKey);
    window.sessionStorage.removeItem(pendingRouteStorageKey);
    window.sessionStorage.removeItem(pendingRequestIdStorageKey);
    window.sessionStorage.removeItem(pendingRequestNameStorageKey);
    setPendingRoute("post-describe");
    setAuthMode("login");
    setAuthResolved(true);

    if (shouldReturnHome) {
      window.history.replaceState(null, "", routeHref("landing"));
      setRoute("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setSignedIn(false);
  };

  const signInWithGoogle = async () => {
    setAuthBusyAction("google");
    setAuthMessage("");
    setEmailOtpSentTo("");
    window.sessionStorage.setItem(pendingRouteStorageKey, pendingRoute);

    try {
      if (hasSupabaseEnv && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: getOAuthRedirectUrl(),
          },
        });

        if (error) {
          throw error;
        }

        return;
      }

      if (googleClientId) {
        const profile = await signInWithGoogleClientId();
        if (profile.email) {
          window.sessionStorage.setItem(authEmailStorageKey, profile.email);
        }
        markSignedIn("google");
        return;
      }

      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        setAuthMessage("Google sign-in is not configured locally. Using a demo Google session for this preview.");
        markSignedIn("google-demo");
        return;
      }

      throw new Error("Google sign-in needs VITE_GOOGLE_CLIENT_ID or Supabase auth environment variables.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Google sign-in could not start. Try email instead.");
    } finally {
      setAuthBusyAction(null);
    }
  };

  const updatePostDraft = (updates: Partial<PostDraft>) => {
    setPostDraft((draft) => {
      const nextDraft = { ...draft, ...updates };
      writeStoredPostDraft(nextDraft);
      return nextDraft;
    });
  };

  const startPostRequest = (location: string, prompt?: PostStarterPrompt) => {
    const urlStarter = !prompt ? getAcquisitionStarterFromUrl() : null;
    const selectedPrompt = prompt ?? urlStarter?.prompt ?? null;

    if (!selectedPrompt) {
      setPostReferenceImageDrafts([]);
      clearStoredPostReferenceImageDrafts();
    }

    if (selectedPrompt) {
      const nextDraft =
        urlStarter?.draft ?? {
          itemName: selectedPrompt.itemName,
          category: selectedPrompt.category,
          details: selectedPrompt.details,
          durationDays: selectedPrompt.durationDays,
          emailClueNotifications: false,
        };

      setPostDraft(nextDraft);
      writeStoredPostDraft(nextDraft);
      setPostReferenceImageDrafts([]);
      clearStoredPostReferenceImageDrafts();
    }

    trackAcquisitionEvent("start_request", {
      location,
      signed_in: signedIn,
      prompt: selectedPrompt?.label ?? "blank",
      starter_id: selectedPrompt?.id,
      from_starter_link: Boolean(urlStarter),
    });
    if (location === "shared_request_cta") {
      trackAcquisitionEvent("referred_request_started", {
        referral_request_id: activeRequestId,
      });
    }
    navigate("post-describe");
  };

  const continueFromDescribe = () => {
    const brief = getRequestBriefFields(postDraft.details);
    trackAcquisitionEvent("post_describe_completed", {
      category: getCategoryLabel(postDraft.category),
      has_item_name: Boolean(postDraft.itemName.trim()),
      has_must_match: Boolean(brief.mustMatch.trim()),
      has_buying_limits: Boolean(brief.buyingLimits.trim()),
      duration_days: postDraft.durationDays,
    });

    if (postReferenceImageDrafts.length && !writeStoredPostReferenceImageDrafts(postReferenceImageDrafts)) {
      setPostReferenceImagePersistenceError(
        "These photos could not be saved for the sign-in handoff. Remove some photos or choose smaller files before continuing.",
      );
      return;
    }

    if (signedIn) {
      navigate("post-publish");
      return;
    }

    requireAuth("post-publish");
  };

  useEffect(() => {
    if (authResolved && !signedIn && protectedPages.has(route)) {
      const intendedRequestId = route === "request-detail" ? getRequestIdFromCurrentRoute() || activeRequestId : "";

      setPendingRoute(route);
      setAuthMode("login");
      window.sessionStorage.setItem(pendingRouteStorageKey, route);
      if (intendedRequestId) {
        window.sessionStorage.setItem(pendingRequestIdStorageKey, intendedRequestId);
      } else {
        window.sessionStorage.removeItem(pendingRequestIdStorageKey);
        window.sessionStorage.removeItem(pendingRequestNameStorageKey);
      }
      if (window.location.pathname !== routeHref("auth")) {
        window.history.replaceState(null, "", routeHref("auth"));
      }
      setRoute("auth");
    }
  }, [activeRequestId, authResolved, route, signedIn]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;
    const clearSupabaseSession = () => {
      window.sessionStorage.removeItem(signedInStorageKey);
      window.sessionStorage.removeItem(authProviderStorageKey);
      setSignedIn(false);
      setAuthResolved(true);
    };
    const finishSupabaseSession = (session: Session) => {
      const storedRoute = readStoredPendingRoute();
      const hadPendingAuthRoute = Boolean(window.sessionStorage.getItem(pendingRouteStorageKey));
      const pendingRequestId = window.sessionStorage.getItem(pendingRequestIdStorageKey) ?? "";
      const pendingRequestName = window.sessionStorage.getItem(pendingRequestNameStorageKey) ?? "";
      const provider = session.user.app_metadata?.provider;

      window.sessionStorage.setItem(signedInStorageKey, "true");
      window.sessionStorage.setItem(authProviderStorageKey, typeof provider === "string" ? provider : "email");
      if (session.user.email) {
        window.sessionStorage.setItem(authEmailStorageKey, session.user.email);
      }
      window.sessionStorage.removeItem(pendingRouteStorageKey);
      window.sessionStorage.removeItem(pendingRequestIdStorageKey);
      window.sessionStorage.removeItem(pendingRequestNameStorageKey);
      setEmailOtpSentTo("");
      setAuthMessage("");
      setSignedIn(true);
      setAuthResolved(true);
      setPendingRoute(storedRoute);
      if (hadPendingAuthRoute) {
        trackAcquisitionEvent("auth_completed", {
          provider: typeof provider === "string" ? provider : "email",
          pending_route: storedRoute,
        });
        if (pendingRequestId) {
          setActiveRequestId(pendingRequestId);
        }
        navigate(storedRoute, pendingRequestId || activeRequestId, pendingRequestName);
      }
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) {
        return;
      }
      if (error || !data.session || data.session.user.is_anonymous) {
        clearSupabaseSession();
        return;
      }
      finishSupabaseSession(data.session);
    }).catch(() => {
      if (mounted) {
        clearSupabaseSession();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      if (!session || session.user.is_anonymous) {
        clearSupabaseSession();
        return;
      }
      finishSupabaseSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const pageProps = {
    navigate,
    requireAuth,
    signedIn,
    menuOpen,
    onBrowseRequest: () => navigate("browse"),
    onLogOut: logOut,
    onPostRequest: () => startPostRequest("app_header_post"),
    setMenuOpen,
  };

  return (
    <>
      {visibleRoute === "landing" ? (
        <LandingPage
          menuOpen={menuOpen}
          requests={requestListings}
          onBrowse={() => navigate("browse")}
          onBrowseAll={() => navigate("browse-all")}
          onLogin={() => {
            setPendingRoute("poster-dashboard");
            changeAuthMode("login");
            navigate("auth");
          }}
          onNavigate={navigate}
          onAccount={() => navigate("poster-dashboard")}
          onLogOut={logOut}
          onPost={(location) => startPostRequest(location)}
          acquisitionStarterPrompt={acquisitionStarter?.prompt ?? null}
          setMenuOpen={setMenuOpen}
          showingExamples={requestListingsAreExamples}
          signedIn={signedIn}
        />
      ) : (
        <PageChrome {...pageProps}>
          {visibleRoute === "auth" ? (
            <AuthPage
              authBusyAction={authBusyAction}
              authMessage={authMessage}
              emailOtpSentTo={emailOtpSentTo}
              mode={authMode}
              onEmailAuthCodeRequest={requestEmailAuthCode}
              onEmailAuthCodeVerify={verifyEmailAuthCode}
              onEmailAuthReset={() => {
                setEmailOtpSentTo("");
                setAuthMessage("");
              }}
              onGoogleAuth={signInWithGoogle}
              onModeChange={changeAuthMode}
            />
          ) : null}
          {visibleRoute === "post-describe" ? (
            <PostDescribePage
              draft={postDraft}
              onDraftChange={updatePostDraft}
              onNext={continueFromDescribe}
              referenceImageFiles={postReferenceImageDrafts}
              onReferenceImageFilesChange={setPostReferenceImageDrafts}
              referenceImagePersistenceError={postReferenceImagePersistenceError}
            />
          ) : null}
          {visibleRoute === "post-publish" ? (
            <PostPublishPage
              draft={postDraft}
              referenceImageFiles={postReferenceImageDrafts}
              onBack={() => navigate("post-describe")}
              onPublished={(snapshot) => {
                setPublishedRequest(snapshot);
                writeStoredPublishedRequest(snapshot);
                setActiveRequestId(snapshot.requestId);
                setPostReferenceImageDrafts([]);
                clearStoredPostReferenceImageDrafts();
                clearStoredPostDraft();
                navigate("share-request");
              }}
            />
          ) : null}
          {visibleRoute === "share-request" ? (
            <ShareRequestPage
              publishedRequest={publishedRequest}
              onDashboard={() => navigate("poster-dashboard")}
              onOpenRequest={(request) => goToDetail(request.requestId)}
            />
          ) : null}
          {visibleRoute === "browse" ? (
            <BrowsePage
              requests={requestListings}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onBrowseAll={() => navigate("browse-all")}
              onDetail={goToDetail}
              onPost={() => startPostRequest("browse_featured")}
              showingExamples={requestListingsAreExamples}
            />
          ) : null}
          {visibleRoute === "browse-all" ? (
            <BrowseAllPage
              requests={requestListings}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onDetail={goToDetail}
              onPost={() => startPostRequest("browse_all")}
              showingExamples={requestListingsAreExamples}
            />
          ) : null}
          {visibleRoute === "request-detail" ? (
            exactRequestLoading ? (
              <RequestDetailStatusPage status="loading" onBrowse={returnToRequestList} />
            ) : exactRequestUnavailable ? (
              <RequestDetailStatusPage status="unavailable" onBrowse={returnToRequestList} />
            ) : requestedRequestMissing ? (
              <NotFoundPage onBrowse={returnToRequestList} onHome={() => navigate("landing")} />
            ) : (
              <RequestDetailPage
                signedIn={signedIn}
                request={activeRequest}
                onBrowse={returnToRequestList}
                onRequireAuth={() => requireCommentAuth(activeRequest)}
                onStartSearch={() => startPostRequest("shared_request_cta")}
              />
            )
          ) : null}
          {visibleRoute === "poster-dashboard" ? (
            <PosterDashboardPage
              onOpenRequest={goToDetail}
              onRequestDeleted={(requestId) => {
                setPublishedRequest((current) => current?.requestId === requestId ? null : current);
              }}
              onShareRequest={(request) => {
                const snapshot = requestRowToPublishedSnapshot(request);
                setPublishedRequest(snapshot);
                writeStoredPublishedRequest(snapshot);
                setActiveRequestId(snapshot.requestId);
                navigate("share-request");
              }}
            />
          ) : null}
          {visibleRoute === "privacy" ? <PrivacyPage /> : null}
          {visibleRoute === "terms" ? <TermsPage /> : null}
          {visibleRoute === "account-settings" ? <AccountSettingsPage /> : null}
          {visibleRoute === "not-found" ? <NotFoundPage onBrowse={() => navigate("browse")} onHome={() => navigate("landing")} /> : null}
        </PageChrome>
      )}
    </>
  );
}

function PageChrome({
  children,
  menuOpen,
  navigate,
  onBrowseRequest,
  onLogOut,
  onPostRequest,
  requireAuth,
  setMenuOpen,
  signedIn,
}: {
  children: React.ReactNode;
  menuOpen: boolean;
  navigate: (page: Page) => void;
  onBrowseRequest: () => void;
  onLogOut: () => void;
  onPostRequest: () => void;
  requireAuth: (page: Page, mode?: AuthMode) => void;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  signedIn: boolean;
}) {
  const navItems: Array<[string, Page, boolean]> = [
    ["Open requests", "browse", false],
    ...(signedIn ? ([
      ["Dashboard", "poster-dashboard", true],
    ] as Array<[string, Page, boolean]>) : []),
  ];
  const handleNavItem = (page: Page, gated: boolean) => {
    if (page === "browse") {
      onBrowseRequest();
      return;
    }

    if (page === "post-describe") {
      onPostRequest();
      return;
    }

    if (gated) {
      requireAuth(page);
      return;
    }

    navigate(page);
  };

  return (
    <div className="app-page">
      <header className="app-header">
        <a
          className="brand brand-button"
          href={routeHref("landing")}
          onClick={(event) => handleRoutedAnchorClick(event, () => navigate("landing"))}
          aria-label={`${siteName} home`}
        >
          <span className="brand-mark" aria-hidden="true">
            <img className="brand-mark-image" src="/magnifying-glass.png" alt="" />
          </span>
          {siteName}
        </a>
        <nav className="desktop-nav app-nav" aria-label="Primary navigation">
          {navItems.map(([label, page, gated]) => (
            <a
              href={routeHref(page)}
              key={label}
              onClick={(event) => handleRoutedAnchorClick(event, () => handleNavItem(page, gated))}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="canvas-actions">
          {signedIn ? (
            <>
              <a
                className="text-button"
                href={routeHref("poster-dashboard")}
                onClick={(event) => handleRoutedAnchorClick(event, () => requireAuth("poster-dashboard", "login"))}
              >
                Account
              </a>
              <button className="text-button logout-button" type="button" onClick={onLogOut}>
                <LogOut size={15} aria-hidden="true" />
                Log out
              </button>
            </>
          ) : (
            <a
              className="text-button"
              href={routeHref("auth")}
              onClick={(event) => handleRoutedAnchorClick(event, () => requireAuth("poster-dashboard", "login"))}
            >
              Log in
            </a>
          )}
          <button className="app-header-post" type="button" onClick={onPostRequest}>Post a request</button>
          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
        {menuOpen ? (
          <nav className="mobile-nav app-mobile-nav" aria-label="Mobile navigation">
            {navItems.map(([label, page, gated]) => (
              <a
                href={routeHref(page)}
                key={label}
                onClick={(event) => handleRoutedAnchorClick(event, () => handleNavItem(page, gated))}
              >
                {label}
              </a>
            ))}
            {signedIn ? (
              <>
                <a
                  href={routeHref("poster-dashboard")}
                  onClick={(event) => handleRoutedAnchorClick(event, () => requireAuth("poster-dashboard", "login"))}
                >
                  Account
                </a>
                <button className="logout-menu-button" type="button" onClick={onLogOut}>
                  Log out
                </button>
              </>
            ) : (
              <a href={routeHref("auth")} onClick={(event) => handleRoutedAnchorClick(event, () => requireAuth("poster-dashboard", "login"))}>
                Log in
              </a>
            )}
            <button type="button" onClick={onPostRequest}>Post a request</button>
          </nav>
        ) : null}
      </header>
      {children}
      <SiteFooter navigate={navigate} />
    </div>
  );
}

function SiteFooter({ navigate }: { navigate: (page: Page) => void }) {
  const publicLinks: Array<[string, Page]> = [
    ["Terms", "terms"],
    ["Privacy", "privacy"],
  ];

  return (
    <footer className="site-footer">
      <div>
        <strong>{siteName}</strong>
        <span>Find this exact item.</span>
      </div>
      <nav aria-label="Policy links">
        {publicLinks.map(([label, page]) => (
          <a href={routeHref(page)} key={page} onClick={(event) => handleRoutedAnchorClick(event, () => navigate(page))}>
            {label}
          </a>
        ))}
        <a href="mailto:support@pleasefindmethis.com">Support</a>
      </nav>
    </footer>
  );
}

function LandingPage({
  acquisitionStarterPrompt,
  requests,
  menuOpen,
  onAccount,
  onBrowse,
  onBrowseAll,
  onLogin,
  onLogOut,
  onNavigate,
  onPost,
  setMenuOpen,
  showingExamples,
  signedIn,
}: {
  acquisitionStarterPrompt: PostStarterPrompt | null;
  requests: RequestListing[];
  menuOpen: boolean;
  onAccount: () => void;
  onBrowse: () => void;
  onBrowseAll: () => void;
  onLogin: () => void;
  onLogOut: () => void;
  onNavigate: (page: Page) => void;
  onPost: (location: string) => void;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showingExamples: boolean;
  signedIn: boolean;
}) {
  const [heroHeadline, setHeroHeadline] = useState(heroHeadlineExamples[0]);
  const [landingShareState, setLandingShareState] = useState<"idle" | "copied" | "error">("idle");
  const displayedRequests = useMemo(() => (requests.length ? requests : exampleRequestListings), [requests]);
  const railRequests = useMemo(() => {
    const doubled = [...displayedRequests, ...displayedRequests];
    return doubled.slice(0, Math.min(8, doubled.length));
  }, [displayedRequests]);
  const tickerRequests = useMemo(() => [...railRequests, ...railRequests], [railRequests]);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotionQuery.matches) {
      setHeroHeadline(heroHeadlineExamples[0]);
      return undefined;
    }

    let phraseIndex = 0;
    let characterIndex = heroHeadlineExamples[0].length;
    let deleting = true;
    let timeoutId = 0;

    const tick = () => {
      const currentPhrase = heroHeadlineExamples[phraseIndex];
      characterIndex = deleting
        ? Math.max(0, characterIndex - 1)
        : Math.min(currentPhrase.length, characterIndex + 1);
      setHeroHeadline(currentPhrase.slice(0, characterIndex));

      if (!deleting && characterIndex === currentPhrase.length) {
        deleting = true;
        timeoutId = window.setTimeout(tick, heroHeadlineHoldMs);
        return;
      }

      if (deleting && characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % heroHeadlineExamples.length;
        timeoutId = window.setTimeout(tick, 120);
        return;
      }

      timeoutId = window.setTimeout(tick, deleting ? 18 : 34);
    };

    timeoutId = window.setTimeout(tick, heroHeadlineHoldMs);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleLandingShare = async () => {
    const landingShareUrl = new URL("/", window.location.origin).toString();
    const shareText = "Help someone find something!";

    setLandingShareState("idle");

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: siteName, text: shareText, url: landingShareUrl });
        trackAcquisitionEvent("website_share_started", {
          share_channel: "native_share",
          share_location: "landing_hero",
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await copyTextToClipboard(landingShareUrl);
      setLandingShareState("copied");
      trackAcquisitionEvent("website_share_started", {
        share_channel: "copy_link",
        share_location: "landing_hero",
      });
    } catch {
      setLandingShareState("error");
    }
  };

  return (
    <main id="top" className="landing-page">
      {tickerRequests.length ? (
        <>
          <aside className="mobile-find-ticker mobile-find-ticker-top" aria-hidden="true">
            <div className="mobile-find-ticker-track mobile-find-ticker-track-left">
              {tickerRequests.map((request, index) => (
                <article className="mobile-find-ticker-card" key={`mobile-rail-top-${request.id}-${index}`}>
                  <img src={request.image} alt="" />
                  <span><strong>{request.name}</strong><small>{showingExamples ? "Example request" : request.location}</small></span>
                </article>
              ))}
            </div>
          </aside>
        </>
      ) : null}

      <section className="hero-section">
        {railRequests.length ? (
          <>
            <aside className="side-find-rail" aria-hidden="true">
              <div className="side-find-track side-find-track-down">
                {railRequests.map((request, index) => (
                  <article className="side-find-card" key={`landing-rail-left-${request.id}-${index}`}>
                    <strong>{request.name}</strong>
                    <p>{showingExamples ? "Example request" : request.location}</p>
                    <img className="side-find-image" src={request.image} alt="" />
                  </article>
                ))}
              </div>
            </aside>
            <aside className="side-find-rail side-find-rail-right" aria-hidden="true">
              <div className="side-find-track side-find-track-up">
                {railRequests.map((request, index) => (
                  <article className="side-find-card" key={`landing-rail-right-${request.id}-${index}`}>
                    <strong>{request.name}</strong>
                    <p>{showingExamples ? "Example request" : request.category}</p>
                    <img className="side-find-image" src={request.image} alt="" />
                  </article>
                ))}
              </div>
            </aside>
          </>
        ) : null}

        <div className="canvas-nav">
          <a
            className="brand brand-button"
            href={routeHref("landing")}
            onClick={(event) =>
              handleRoutedAnchorClick(event, () => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              })
            }
            aria-label={`${siteName} home`}
          >
            <span className="brand-mark" aria-hidden="true">
              <img className="brand-mark-image" src="/magnifying-glass.png" alt="" />
            </span>
            {siteName}
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
              Browse requests
            </a>
            <a href={routeHref("post-describe")} onClick={(event) => handleRoutedAnchorClick(event, () => onPost("header_nav"))}>
              Post request
            </a>
          </nav>
          <div className="canvas-actions">
            {signedIn ? (
              <>
                <a className="text-button" href={routeHref("poster-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onAccount)}>
                  Account
                </a>
                <button className="text-button logout-button" type="button" onClick={onLogOut}>
                  <LogOut size={15} aria-hidden="true" />
                  Log out
                </button>
              </>
            ) : (
              <a className="text-button" href={routeHref("auth")} onClick={(event) => handleRoutedAnchorClick(event, onLogin)}>
                Log in
              </a>
            )}
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
          {menuOpen ? (
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <a href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
                Browse requests
              </a>
              <a href={routeHref("post-describe")} onClick={(event) => handleRoutedAnchorClick(event, () => onPost("mobile_menu"))}>
                Post request
              </a>
              {signedIn ? (
                <>
                  <a href={routeHref("poster-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onAccount)}>
                    Account
                  </a>
                  <button className="logout-menu-button" type="button" onClick={onLogOut}>
                    Log out
                  </button>
                </>
              ) : (
                <a href={routeHref("auth")} onClick={(event) => handleRoutedAnchorClick(event, onLogin)}>
                  Log in
                </a>
              )}
            </nav>
          ) : null}
        </div>

        <div className="hero-copy">
          <p className="hero-site-tag">{siteName}</p>
          <h1 aria-label={heroHeadlineExamples[0]}>
            <span className="hero-headline-text" aria-hidden="true">
              {heroHeadline}
              <span className="hero-headline-caret" />
            </span>
          </h1>
          <div className="mobile-hero-actions" aria-label="Hero actions">
            <button className="primary-button mobile-post-button hero-plus-button" type="button" onClick={() => onPost("hero_mobile")}>
              <span aria-hidden="true">+</span> Post a request
            </button>
            <a className="mobile-browse-button" href={routeHref("browse-all")} onClick={(event) => handleRoutedAnchorClick(event, onBrowseAll)}>
              Browse open requests <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <div className="hero-lower">
          <p className="hero-subline">Add photos. Share the request. Collect clues.</p>
          {acquisitionStarterPrompt ? (
            <div className="starter-link-panel">
              <span><strong>{acquisitionStarterPrompt.label}</strong>{acquisitionStarterPrompt.title}</span>
              <button className="starter-link-button" type="button" onClick={() => onPost("starter_link")}>
                Start this request <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
          <p className="trust-line"><LockKeyhole size={18} /> Free to post. No hidden fees.</p>
          <div className="hero-share-prompt">
            <p className="hero-share-tagline">help someone find something !</p>
            <button className="hero-share-button" type="button" onClick={() => void handleLandingShare()}>
              <span>Share</span>
              <Share2 size={16} aria-hidden="true" />
            </button>
            <span className="hero-share-status" role="status" aria-live="polite">
              {landingShareState === "copied" ? "Link copied to clipboard." : null}
              {landingShareState === "error" ? "Copy this page's address to share it." : null}
            </span>
          </div>
        </div>
      </section>

      <SiteFooter navigate={onNavigate} />
    </main>
  );
}

function AuthPage({
  authBusyAction,
  authMessage,
  emailOtpSentTo,
  mode,
  onEmailAuthCodeRequest,
  onEmailAuthCodeVerify,
  onEmailAuthReset,
  onGoogleAuth,
  onModeChange,
}: {
  authBusyAction: AuthBusyAction;
  authMessage: string;
  emailOtpSentTo: string;
  mode: AuthMode;
  onEmailAuthCodeRequest: (email: string) => void;
  onEmailAuthCodeVerify: (code: string) => void;
  onEmailAuthReset: () => void;
  onGoogleAuth: () => void;
  onModeChange: (mode: AuthMode) => void;
}) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const authBusy = authBusyAction !== null;
  const emailBusy = authBusyAction === "email";
  const googleBusy = authBusyAction === "google";
  const codeSent = Boolean(emailOtpSentTo);

  useEffect(() => {
    setVerificationCode("");
  }, [emailOtpSentTo, mode]);

  const submitEmailAuth = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (codeSent) {
      onEmailAuthCodeVerify(verificationCode);
      return;
    }

    onEmailAuthCodeRequest(email);
  };

  return (
    <main className="route-page auth-route" aria-labelledby="auth-title">
      <section className="route-hero auth-hero">
        <div>
          <h1 id="auth-title">{mode === "signup" ? "Create an account to continue." : "Log in to continue."}</h1>
          <p>
            Publish your search, share it, and keep every clue in one place.
          </p>
        </div>
        <div className="auth-panel">
          <div className="segmented-control" role="tablist" aria-label="Authentication mode">
            <button className={mode === "signup" ? "active" : ""} type="button" role="tab" aria-selected={mode === "signup"} onClick={() => onModeChange("signup")} disabled={authBusy}>
              Sign up
            </button>
            <button className={mode === "login" ? "active" : ""} type="button" role="tab" aria-selected={mode === "login"} onClick={() => onModeChange("login")} disabled={authBusy}>
              Log in
            </button>
          </div>
          <button className="google-auth-button" type="button" onClick={onGoogleAuth} disabled={authBusy}>
            <span className="google-g-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.4-4.6 3.4-7.9Z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.8l-3.5-2.7c-1 .7-2.2 1.1-3.8 1.1-2.9 0-5.3-1.9-6.1-4.6H2.3v2.8A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.9 14a6.7 6.7 0 0 1 0-4.1V7.1H2.3a11 11 0 0 0 0 9.8L6 14Z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A10.6 10.6 0 0 0 12 1 11 11 0 0 0 2.3 7.1L6 9.9c.8-2.6 3.2-4.5 6.1-4.5Z" />
              </svg>
            </span>
            {googleBusy ? "Opening Google..." : "Continue with Google"}
          </button>
          <div className="auth-divider">
            <span>or continue with email</span>
          </div>
          {authMessage ? (
            <p className="auth-message" role="status">
              {authMessage}
            </p>
          ) : null}
          <form className="email-auth-form" onSubmit={submitEmailAuth}>
            <label>
              Email
              <input
                type="email"
                value={codeSent ? emailOtpSentTo : email}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={codeSent || authBusy}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            {codeSent ? (
              <label>
                Verification code
                <input
                  className="email-code-input"
                  type="text"
                  value={verificationCode}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  disabled={authBusy}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </label>
            ) : null}
            <button className="primary-button wide-button" type="submit" disabled={authBusy}>
              {codeSent
                ? emailBusy
                  ? "Verifying code..."
                  : "Verify code and continue"
                : emailBusy
                  ? "Sending code..."
                  : mode === "signup"
                    ? "Send sign-up code"
                    : "Send login code"}
            </button>
          </form>
          {codeSent ? (
            <div className="auth-secondary-actions">
              <button className="auth-inline-button" type="button" disabled={authBusy} onClick={() => onEmailAuthCodeRequest(emailOtpSentTo)}>
                Resend code
              </button>
              <button className="auth-inline-button" type="button" disabled={authBusy} onClick={onEmailAuthReset}>
                Change email
              </button>
            </div>
          ) : null}
          <p className="dialog-note">Sign in is required to view requests and anonymous clues.</p>
        </div>
      </section>
    </main>
  );
}

function PostDescribePage({
  draft,
  onDraftChange,
  onNext,
  referenceImageFiles,
  onReferenceImageFilesChange,
  referenceImagePersistenceError,
}: {
  draft: PostDraft;
  onDraftChange: (updates: Partial<PostDraft>) => void;
  onNext: () => void;
  referenceImageFiles: PostReferenceImageDraft[];
  onReferenceImageFilesChange: React.Dispatch<React.SetStateAction<PostReferenceImageDraft[]>>;
  referenceImagePersistenceError: string;
}) {
  const [draftSaved, setDraftSaved] = useState(false);
  const [photoPreparationError, setPhotoPreparationError] = useState("");
  const [photosPreparing, setPhotosPreparing] = useState(false);
  const maxReferenceImageFiles = maxPersistedReferenceImages;
  const canContinue = !photosPreparing && !referenceImagePersistenceError && draft.itemName.trim().length >= 3;

  const continueWithDetails = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canContinue) {
      return;
    }

    onNext();
  };

  const handleReferenceImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selectedFiles.length) {
      return;
    }

    setPhotosPreparing(true);
    setPhotoPreparationError("");
    try {
      const nextFiles: PostReferenceImageDraft[] = [];
      for (const file of selectedFiles.slice(0, maxReferenceImageFiles)) {
        nextFiles.push(await preparePostReferenceImageDraft(file));
      }

      onReferenceImageFilesChange((previous) => {
        const merged = [...previous, ...nextFiles].filter((item, index, all) => {
          return all.findIndex((entry) => entry.name === item.name && entry.file.size === item.file.size && entry.file.lastModified === item.file.lastModified) === index;
        });

        return merged.slice(0, maxReferenceImageFiles);
      });
    } catch (error) {
      setPhotoPreparationError(error instanceof Error ? error.message : "One of these photos could not be prepared. Try a smaller JPEG or PNG.");
    } finally {
      setPhotosPreparing(false);
    }
  };

  const removeReferenceImage = (index: number) => {
    onReferenceImageFilesChange((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const saveDraft = () => {
    writeStoredPostDraft(draft);
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 1800);
  };

  return (
    <main className="route-page post-wizard-page legacy-request-composer" aria-labelledby="describe-title">
      <section className="two-column-page">
        <form className="form-panel post-flow-panel" onSubmit={continueWithDetails}>
          <div className="post-flow-intro">
            <h1 id="describe-title">What are you trying to find?</h1>
            <p>Give people enough detail to recognize the exact item and rule out close matches.</p>
          </div>

          <label className="legacy-title-field">
            Item or description
            <textarea
              aria-label="What are you trying to find?"
              value={draft.itemName}
              rows={3}
              maxLength={120}
              placeholder="Help me find this exact item"
              onChange={(event) => onDraftChange({ itemName: event.target.value })}
            />
          </label>

          <div className="post-question-card">
            <span className="post-question-label"><Upload size={18} /> Add photo references</span>
            <div className="photo-source-grid">
              <label className="photo-source-card">
                <input className="sr-only-file-input" type="file" accept="image/*" multiple onChange={handleReferenceImageSelection} />
                <div className="photo-source-icon"><ImagePlus size={25} /></div>
                <div><strong>{photosPreparing ? "Preparing photos…" : "From gallery"}</strong><small>Choose up to four images</small></div>
              </label>
              <label className="photo-source-card">
                <input className="sr-only-file-input" type="file" accept="image/*" capture="environment" onChange={handleReferenceImageSelection} />
                <div className="photo-source-icon"><Camera size={25} /></div>
                <div><strong>From camera</strong><small>Take a new reference photo</small></div>
              </label>
            </div>
            {referenceImageFiles.length ? (
              <div className="upload-preview-grid" aria-label="Selected photos">
                {referenceImageFiles.map((imageDraft, index) => (
                  <figure className="upload-preview-card" key={`${imageDraft.name}-${imageDraft.file.lastModified}-${index}`}>
                    <img src={imageDraft.dataUrl} alt={`Request photo ${index + 1}`} />
                    <figcaption>
                      <span>{imageDraft.name}</span>
                      <button
                        className="section-link section-button"
                        type="button"
                        aria-label={`Remove photo ${index + 1}`}
                        onClick={() => removeReferenceImage(index)}
                      >
                        Remove
                      </button>
                    </figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
            {photoPreparationError || referenceImagePersistenceError ? (
              <p className="hunt-photo-error" role="alert">{photoPreparationError || referenceImagePersistenceError}</p>
            ) : referenceImageFiles.length ? (
              <p className="hunt-photo-saved" role="status"><CheckCircle2 size={15} /> Photos are saved for the sign-in handoff.</p>
            ) : null}
          </div>

          <label className={`email-updates-toggle${draft.emailClueNotifications ? " is-enabled" : ""}`}>
            <span className="email-updates-switch">
              <input
                type="checkbox"
                role="switch"
                checked={draft.emailClueNotifications}
                onChange={(event) => onDraftChange({ emailClueNotifications: event.target.checked })}
              />
              <span aria-hidden="true" />
            </span>
            <span className="email-updates-copy">
              <strong>Get email updates when someone leaves a clue</strong>
              <small>We’ll email you whenever someone comments on your request.</small>
            </span>
          </label>

          <div className="legacy-composer-actions">
            <p><LockKeyhole size={15} /> Your draft stays private until you publish.</p>
            <button className="primary-button" type="submit" disabled={!canContinue}>Continue to publish <ArrowRight size={17} /></button>
            <button className="section-link section-button" type="button" onClick={saveDraft}>{draftSaved ? "Draft saved" : "Save and come back later"}</button>
            <small>Next: sign in and publish free.</small>
          </div>
        </form>
      </section>
    </main>
  );
}

function PostPublishPage({
  draft,
  onBack,
  onPublished,
  referenceImageFiles,
}: {
  draft: PostDraft;
  onBack: () => void;
  onPublished: (snapshot: PublishedRequestSnapshot) => void;
  referenceImageFiles: PostReferenceImageDraft[];
}) {
  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const itemName = draft.itemName.trim() || "your request";
  const categoryName = getCategoryLabel(draft.category);

  useEffect(() => {
    if (publishStatus !== "loading") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPublishMessage("Publishing is taking longer than expected. Keep this page open while we save the request.");
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [publishStatus]);

  const publishRequest = async () => {
    if (!supabase) {
      setPublishStatus("error");
      setPublishMessage("Publishing needs Supabase configuration. The free request was not saved.");
      return;
    }

    trackAcquisitionEvent("publish_request_started", {
      category: categoryName,
      duration_days: draft.durationDays,
      request_type: "free",
    });
    setPublishStatus("loading");
    setPublishMessage("");
    if (!draft.itemName.trim()) {
      setPublishStatus("error");
      setPublishMessage("Add what you are trying to find first.");
      return;
    }

    const detailsText = draft.details.trim() || `Looking for: ${draft.itemName.trim()}`;
    const requestReferenceImageFiles = referenceImageFiles.slice(0, 4).map((item) => item.file);
    const uploadedPaths: string[] = [];

    try {
      const readinessResponse = await fetch("/api/health", { headers: { Accept: "application/json" } });
      const readinessPayload = await readinessResponse.json().catch(() => ({})) as { free_request_board_ready?: boolean };

      if (!readinessResponse.ok || readinessPayload.free_request_board_ready !== true) {
        throw new Error("Publishing is temporarily paused while the free request board is being updated. Your draft is still saved.");
      }

      const requestId = crypto.randomUUID();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError && !userError.message.toLowerCase().includes("auth session missing")) {
        throw userError;
      }

      if (!user) {
        throw new Error("Sign in again before publishing the request.");
      }

      if (user.email) {
        window.sessionStorage.setItem(authEmailStorageKey, user.email);
      }

      const uploadResult = requestReferenceImageFiles.length ? await uploadRequestReferenceFiles(user.id, requestId, requestReferenceImageFiles) : { referenceImages: [], uploadedPaths };
      uploadedPaths.push(...uploadResult.uploadedPaths);

      const { error: insertError } = await supabase.from("requests").insert({
        id: requestId,
        user_id: user.id,
        item_name: itemName,
        category: categoryName,
        details: detailsText.slice(0, 5000),
        duration_days: draft.durationDays,
        reference_images: uploadResult.referenceImages,
        email_clue_notifications: draft.emailClueNotifications,
      });

      if (insertError) {
        if (uploadedPaths.length) {
          await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
        }
        throw insertError;
      }

      notifyRequestFeedChanged();

      trackAcquisitionEvent("request_published", {
        category: categoryName,
        duration_days: draft.durationDays,
        reference_image_count: uploadResult.referenceImages.length,
        request_type: "free",
      });
      const snapshot: PublishedRequestSnapshot = {
        requestId,
        itemName,
        category: categoryName,
        details: detailsText,
        image: uploadResult.referenceImages[0]?.url || referenceImageFiles[0]?.dataUrl || neutralRequestImage,
        durationDays: draft.durationDays,
        createdAt: new Date().toISOString(),
      };
      setPublishStatus("success");
      setPublishMessage("Request published. Opening the share page...");
      window.setTimeout(() => onPublished(snapshot), 700);
    } catch (error) {
      if (supabase && uploadedPaths.length) {
        await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
      }

      trackAcquisitionEvent("request_publish_failed", {
        category: categoryName,
        error_type: error instanceof Error ? error.name || "error" : "unknown",
        request_type: "free",
      });
      setPublishStatus("error");
      if (error instanceof Error) {
        setPublishMessage(error.message);
        return;
      }

      if (typeof error === "object" && error !== null) {
        const typed = error as { message?: string; details?: string; hint?: string; code?: string; name?: string };
        const message = [typed.message, typed.details, typed.hint, typed.code, typed.name].filter(Boolean).join(" · ");
        setPublishMessage(message || "The request could not be published. Please try again.");
        return;
      }

      setPublishMessage("The request could not be published. Please try again.");
    }
  };

  return (
    <main className="route-page post-wizard-page" aria-labelledby="publish-title">
      <section className="two-column-page publish-layout">
        <div className="form-panel publish-form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Details
          </button>
          <h1 id="publish-title">Publish the request.</h1>
          <p>
            Publishing is free. Your request becomes a public page where people can leave links and clues.
          </p>
          <div className="publish-assurance-grid" aria-label="Publishing details">
            <span>
              <CheckCircle2 size={17} /> Free to post
            </span>
            <span>
              <Search size={17} /> Public request page
            </span>
            <span>
              <ShieldCheck size={17} /> Public links and clues
            </span>
          </div>
          <div className="publish-note">
            <ExternalLink size={19} aria-hidden="true" />
            <span>
              <strong>Free request board</strong>
              The board does not collect money, pay contributors, or arrange purchases.
            </span>
          </div>
          <button className="primary-button" type="button" disabled={publishStatus === "loading" || publishStatus === "success"} onClick={publishRequest}>
            <Send size={18} /> {publishStatus === "loading" ? "Publishing request..." : publishStatus === "error" ? "Try publishing again" : publishStatus === "success" ? "Published" : "Publish free request"}
          </button>
          {publishMessage ? (
            <div className={publishStatus === "error" ? "dialog-error publish-status-message" : publishStatus === "success" ? "dialog-success publish-status-message" : "dialog-note publish-status-message"} role="status">
              <span>{publishMessage}</span>
              {publishStatus === "error" ? (
                <button className="retry-button" type="button" onClick={publishRequest}>
                  Try again
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ShareRequestPage({
  onDashboard,
  onOpenRequest,
  publishedRequest,
}: {
  onDashboard: () => void;
  onOpenRequest: (request: PublishedRequestSnapshot) => void;
  publishedRequest: PublishedRequestSnapshot | null;
}) {
  useEffect(() => {
    if (!publishedRequest) {
      return;
    }

    trackAcquisitionEvent("share_prompt_viewed", {
      request_id: publishedRequest.requestId,
      category: publishedRequest.category,
    });
  }, [publishedRequest]);

  if (!publishedRequest) {
    return (
      <main className="route-page share-page share-page-empty">
        <h1>Your latest search is already live.</h1>
        <p>Open your dashboard to copy its public link and review new clues.</p>
        <button className="primary-button" type="button" onClick={onDashboard}>Go to dashboard <ArrowRight size={17} /></button>
      </main>
    );
  }

  const requestDescription = getRequestBriefFields(publishedRequest.details).story || publishedRequest.itemName;

  return (
    <main className="route-page share-page" aria-labelledby="share-page-title">
      <header className="share-page-intro">
        <h1 id="share-page-title">Your search is live.</h1>
      </header>

      <section className="share-page-grid share-page-grid-minimal">
        <article className="share-preview-card share-preview-card-minimal">
          <div className="share-preview-body">
            <img src={publishedRequest.image} alt={`${publishedRequest.itemName} reference`} />
            <div>
              <p>{requestDescription}</p>
            </div>
          </div>
          <button className="share-view-button" type="button" onClick={() => onOpenRequest(publishedRequest)}>✅ Check Live Request</button>
        </article>
      </section>
    </main>
  );
}

function BrowsePage({
  requests,
  dataError,
  dataLoading,
  onBrowseAll,
  onDetail,
  onPost,
  showingExamples,
}: {
  requests: RequestListing[];
  dataError: string;
  dataLoading: boolean;
  onBrowseAll: () => void;
  onDetail: (requestId: string) => void;
  onPost: () => void;
  showingExamples: boolean;
}) {
  const openRequests = useMemo(() => [...requests].sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()), [requests]);

  return (
    <main className="route-page request-gallery-page" aria-labelledby="browse-title">
      <section className="gallery-hero">
        <h1 id="browse-title">{showingExamples ? "Example searches" : "Open requests"}</h1>
        <p>{showingExamples ? "See what a useful public request looks like while the live board gets started." : "Recognize something? Leave a clue or share it with someone who might."}</p>
        {dataLoading ? <p className="dialog-note">Loading open requests...</p> : null}
        {dataError ? <p className="dialog-error" role="status">{dataError} Showing example requests until the live board is ready.</p> : null}
        <div className="gallery-hero-actions">
          <button className="primary-button" type="button" onClick={onPost}>
            Post a request <ArrowRight size={18} />
          </button>
          <a className="section-link section-button" href={routeHref("browse-all")} onClick={(event) => handleRoutedAnchorClick(event, onBrowseAll)}>
            Browse all <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <section className="top-request-grid" aria-label="Open requests">
        {openRequests.map((request, index) => (
          <RequestSquareCard request={request} featured={index === 0} key={request.id} onDetail={onDetail} rank={index + 1} />
        ))}
      </section>

    </main>
  );
}

function BrowseAllPage({
  requests,
  dataError,
  dataLoading,
  onDetail,
  onPost,
  showingExamples,
}: {
  requests: RequestListing[];
  dataError: string;
  dataLoading: boolean;
  onDetail: (requestId: string) => void;
  onPost: () => void;
  showingExamples: boolean;
}) {
  const [filter, setFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(16);
  const categories = useMemo(() => ["All", ...Array.from(new Set(requests.map((request) => request.category))).sort()], [requests]);
  const filteredRequests = useMemo(() => (
    [...requests]
      .sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime())
      .filter((request) => filter === "All" || request.category === filter)
  ), [requests, filter]);

  useEffect(() => {
    setVisibleCount(16);
  }, [requests.length, filter]);

  useEffect(() => {
    const loadNearBottom = () => {
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      if (remaining < 520) {
        setVisibleCount((count) => Math.min(count + 8, filteredRequests.length));
      }
    };

    window.addEventListener("scroll", loadNearBottom);
    loadNearBottom();
    return () => window.removeEventListener("scroll", loadNearBottom);
  }, [filteredRequests.length]);

  const visibleRequests = filteredRequests.slice(0, visibleCount);
  const atEnd = visibleCount >= filteredRequests.length;
  const hasVisibleRequests = visibleRequests.length > 0;
  const emptyStateSubject = filter === "All" ? "the current board" : filter;

  return (
    <main className="route-page request-gallery-page browse-all-page" aria-labelledby="browse-all-title">
      <section className="gallery-hero compact-gallery-hero">
        <div>
          <h1 id="browse-all-title">{showingExamples ? "Browse example searches" : "Browse all open requests"}</h1>
          <p>{showingExamples ? "These examples show the detail that helps strangers recognize an exact item." : "Explore every open request on the board."}</p>
          {dataLoading ? <p className="dialog-note">Loading open requests...</p> : null}
          {dataError ? <p className="dialog-error" role="status">{dataError} Showing example requests until the live board is ready.</p> : null}
        </div>
        <button className="primary-button" type="button" onClick={onPost}>
          Post a request <ArrowRight size={18} />
        </button>
      </section>
      <section className="browse-toolbar" aria-label="Browse filters">
        <div className="filter-pills">
          {categories.map((category) => (
            <button className={filter === category ? "active" : ""} key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>
              {category}
            </button>
          ))}
        </div>
      </section>
      <section className="request-square-grid full-gallery-grid request-list-grid" aria-label="All request results">
        {hasVisibleRequests ? (
          visibleRequests.map((request) => (
            <RequestSquareCard request={request} key={request.id} onDetail={onDetail} variant="request" />
          ))
        ) : (
          <div className="empty-state browse-empty-state" role="status">
            <Search size={26} />
            <strong>No requests match {emptyStateSubject}.</strong>
            <span>Switch to All to see every open request.</span>
          </div>
        )}
      </section>
      {hasVisibleRequests ? (
        <div className="browse-end-state" aria-live="polite">
          {atEnd ? (
            <span>
              <CheckCircle2 size={18} /> You reached the end of the request board.
            </span>
          ) : (
            <span>
              <TimerReset size={18} /> Loading more requests as you scroll.
            </span>
          )}
        </div>
      ) : null}
    </main>
  );
}

function RequestSquareCard({
  request,
  compact = false,
  featured = false,
  onDetail,
  rank,
  variant = "square",
}: {
  request: RequestListing;
  compact?: boolean;
  featured?: boolean;
  onDetail: (requestId: string) => void;
  rank?: number;
  variant?: "square" | "request";
}) {
  const requestVariant = variant === "request";
  const requestTypeLabel = request.live ? "Open request" : "Example";
  const cardTone = rank ? ((rank - 1) % 5) + 1 : (hashPublicHelperSeed(request.id) % 5) + 1;

  return (
    <article className={`request-square-card tone-${cardTone} ${compact ? "compact" : ""} ${featured ? "featured" : ""} ${requestVariant ? "request-card" : ""}`}>
      <a
        className="square-card-hit"
        href={getRequestPath(request.id, request.name)}
        onClick={(event) => handleRoutedAnchorClick(event, () => onDetail(request.id))}
        aria-label={`View ${request.name}`}
      >
        {requestVariant ? (
          <span className="square-check" aria-hidden="true">
            <BadgeCheck size={15} />
          </span>
        ) : (
          <>
            <span className="square-rank">{rank ? `#${rank}` : request.category}</span>
            <span className="square-price">{requestTypeLabel}</span>
          </>
        )}
        <span className="square-image-wrap">
          <img src={request.image} alt={`${request.name} reference`} loading="lazy" decoding="async" />
        </span>
        <span className="square-copy">
          <strong>{request.name}</strong>
          <em>{request.detail}</em>
        </span>
        {requestVariant ? (
          <span className="square-meta request-card-meta">
            <span>
              <small>Request type</small>
              <b>{requestTypeLabel}</b>
            </span>
            <span>
              <small>Closes in</small>
              <b>{request.closes}</b>
            </span>
          </span>
        ) : (
          <span className="square-meta">
            <span>
              <Clock3 size={14} /> {request.closes}
            </span>
            <span>
              <MessageSquare size={14} /> {request.submissions}
            </span>
          </span>
        )}
      </a>
    </article>
  );
}

function RequestDetailPage({
  request,
  signedIn,
  onBrowse,
  onRequireAuth,
  onStartSearch,
}: {
  request: RequestListing;
  signedIn: boolean;
  onBrowse: () => void;
  onRequireAuth: () => void;
  onStartSearch: () => void;
}) {
  const requestComments = useRequestComments(request);
  const commentVisitor = useMemo(() => getRequestCommentVisitor(request.id), [request.id]);
  const [commentBody, setCommentBody] = useState("");
  const [commentLink, setCommentLink] = useState("");
  const [commentStatus, setCommentStatus] = useState<"idle" | "posting" | "posted" | "error">("idle");
  const [commentError, setCommentError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [commentFilter, setCommentFilter] = useState<"all" | "sources">("all");
  const [commentSearch, setCommentSearch] = useState("");
  const sourceCommentCount = useMemo(
    () => requestComments.comments.filter((comment) => Boolean(comment.source_url)).length,
    [requestComments.comments],
  );
  const visibleComments = useMemo(() => {
    const normalizedSearch = commentSearch.trim().toLowerCase();

    return requestComments.comments
      .filter((comment) => commentFilter === "all" || Boolean(comment.source_url))
      .filter((comment) => {
        if (!normalizedSearch) {
          return true;
        }

        return `${comment.helper_alias} ${comment.body} ${getCommentSourceHost(comment.source_url)}`
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [commentFilter, commentSearch, requestComments.comments]);
  const brief = request.brief ?? getRequestBriefFields(request.description);
  const isExample = !request.live;

  const getShareRequestUrl = () => {
    const requestUrl = new URL(getRequestPath(request.id, request.name), window.location.origin);
    requestUrl.searchParams.set("utm_source", "product_share");
    requestUrl.searchParams.set("utm_medium", "referral");
    requestUrl.searchParams.set("utm_campaign", "request_help");
    return requestUrl.toString();
  };

  const handleShareRequest = async () => {
    const requestUrl = getShareRequestUrl();
    const shareText = `Do you recognize ${getShareSubject(request.name)}? Log in to leave a clue.`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: request.name, text: shareText, url: requestUrl });
        trackAcquisitionEvent("request_reshare", { request_id: request.id, category: request.category, share_channel: "native_share" });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await copyTextToClipboard(requestUrl);
      setShareCopied(true);
      setCommentError("");
      trackAcquisitionEvent("request_link_copied", {
        request_id: request.id,
        category: request.category,
      });
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
      setCommentStatus("error");
      setCommentError("Could not copy the request link.");
    }
  };

  const handleCommentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!signedIn) {
      onRequireAuth();
      return;
    }

    setCommentStatus("posting");
    setCommentError("");

    try {
      const savedComment = await requestComments.addComment(commentBody, commentLink, commentVisitor);
      setCommentBody("");
      setCommentLink("");
      setCommentFilter("all");
      setCommentSearch("");
      setCommentStatus("posted");
      trackAcquisitionEvent("request_comment_posted", {
        request_id: request.id,
        category: request.category,
        has_source_link: Boolean(savedComment.source_url),
      });
    } catch (error) {
      if (error instanceof CommentAuthenticationRequiredError) {
        onRequireAuth();
        return;
      }

      setCommentStatus("error");
      setCommentError(error instanceof Error ? error.message : "Could not post this comment.");
    }
  };

  return (
    <main className="route-page legacy-public-request-page" aria-labelledby="detail-title">
      <button className="back-button page-back" type="button" onClick={onBrowse}>
        <ArrowLeft size={17} /> Browse requests
      </button>
      <section className="detail-layout" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <article className="detail-main">
          <img className="detail-image" src={request.image} alt={request.name} decoding="async" />
          <div className="detail-copy">
            <div className="status-strip">
              <span>{isExample ? "Example request" : request.status}</span>
              <span>{request.category}</span>
              <span>{request.posted}</span>
            </div>
            <h1 id="detail-title">{request.name}</h1>
            <p>{request.description}</p>
            <h2>Must match</h2>
            <ul className="check-list detail-list">
              {request.mustHaves.map((item) => <li key={item}><CheckCircle2 size={18} /> {item}</li>)}
            </ul>
            {brief.alreadyTried || brief.buyingLimits ? (
              <dl className="legacy-brief-notes">
                {brief.alreadyTried ? <div><dt>Already searched</dt><dd>{brief.alreadyTried}</dd></div> : null}
                {brief.buyingLimits ? <div><dt>Buying limits</dt><dd>{brief.buyingLimits}</dd></div> : null}
              </dl>
            ) : null}
            <div className="legacy-detail-actions">
              <button
                className="primary-button wide-button"
                type="button"
                onClick={() => signedIn ? document.getElementById("request-comment-body")?.focus() : onRequireAuth()}
              >
                {signedIn ? "Leave a public clue" : "Log in to leave a clue"} <MessageSquare size={18} />
              </button>
              <button className="section-link section-button" type="button" onClick={() => void handleShareRequest()}>
                <Share2 size={16} /> {shareCopied ? "Link copied" : "Share this request"}
              </button>
            </div>
          </div>
        </article>
      </section>

      <section className="request-comments-panel comments-ledger-section" aria-labelledby="request-comments-title">
        <div className="request-comments-head">
          <div>
            <h2 id="request-comments-title">Comments &amp; clues</h2>
            <p>Public suggestions from anonymous helpers.</p>
            {isExample ? <span className="example-thread-note">Example only — identities are illustrative and posts aren’t published.</span> : null}
          </div>
          <button className="section-link section-button comment-share-button" type="button" onClick={() => void handleShareRequest()}>
            <LinkIcon size={16} /> {shareCopied ? "Copied" : "Share request"}
          </button>
        </div>

        <div className="comments-ledger">
          <div className="comments-ledger-toolbar">
            <div className="comment-filter-tabs" role="group" aria-label="Filter public clues">
              <button
                className={commentFilter === "all" ? "is-active" : ""}
                type="button"
                aria-pressed={commentFilter === "all"}
                onClick={() => setCommentFilter("all")}
              >
                All clues <span>{requestComments.comments.length}</span>
              </button>
              <button
                className={commentFilter === "sources" ? "is-active" : ""}
                type="button"
                aria-pressed={commentFilter === "sources"}
                onClick={() => setCommentFilter("sources")}
              >
                With sources <span>{sourceCommentCount}</span>
              </button>
            </div>
            <label className="comments-search" htmlFor="request-comment-search">
              <Search size={15} aria-hidden="true" />
              <input
                id="request-comment-search"
                type="search"
                aria-label="Search public clues"
                value={commentSearch}
                placeholder="Search clues"
                onChange={(event) => setCommentSearch(event.target.value)}
              />
            </label>
          </div>

          {signedIn ? (
            <div className={`comment-composer-card ${commentBody || commentLink || commentStatus !== "idle" ? "has-draft" : ""}`}>
              <CommentAvatar alias={commentVisitor.alias} eager />
              <form className="comment-composer" onSubmit={handleCommentSubmit}>
                <div className="comment-identity-row"><strong>{commentVisitor.alias}</strong><span>your anonymous helper name</span></div>
                <label className="comment-textarea-label" htmlFor="request-comment-body">
                  Your clue
                  <textarea
                    id="request-comment-body"
                    value={commentBody}
                    maxLength={requestCommentMaxLength}
                    placeholder="Leave a clue or public source link…"
                    onChange={(event) => { setCommentBody(event.target.value); setCommentStatus("idle"); setCommentError(""); }}
                  />
                </label>
                <div className="comment-composer-footer">
                  <label className="comment-link-label" htmlFor="request-comment-link">
                    <LinkIcon size={16} aria-hidden="true" />
                    <input
                      id="request-comment-link"
                      aria-label="Optional source link"
                      value={commentLink}
                      placeholder="Optional source link"
                      onChange={(event) => { setCommentLink(event.target.value); setCommentStatus("idle"); setCommentError(""); }}
                    />
                  </label>
                  <span>{requestCommentMaxLength - commentBody.length} left</span>
                  <button className="primary-button" type="submit" disabled={commentStatus === "posting" || commentBody.trim().length < 2}>
                    {commentStatus === "posting" ? "Posting…" : "Post clue"} <Send size={16} />
                  </button>
                </div>
                {commentStatus === "posted" ? <p className="comment-status success">Clue posted. Thank you for moving the search forward.</p> : null}
                {commentStatus === "error" && commentError ? <p className="comment-status error">{commentError}</p> : null}
              </form>
            </div>
          ) : (
            <div className="comment-login-gate">
              <LockKeyhole size={21} aria-hidden="true" />
              <div>
                <strong>Log in to join this search.</strong>
                <span>Your anonymous helper name stays public, while your account identity remains private.</span>
              </div>
              <button className="primary-button" type="button" onClick={onRequireAuth}>Log in to comment</button>
            </div>
          )}

          <div className="comments-ledger-columns" aria-hidden="true">
            <span>Visitor &amp; clue</span>
            <span>Source</span>
            <span>Posted</span>
          </div>

          <div className="request-comment-list" aria-live="polite">
            {requestComments.loading ? <p className="comment-load-state">Loading comments...</p> : null}
            {requestComments.error ? <p className="comment-load-state">{requestComments.error}</p> : null}
            {visibleComments.length ? visibleComments.map((comment) => (
              <article className="request-comment-row" key={comment.id}>
                <div className="comment-helper-cell">
                  <CommentAvatar alias={comment.helper_alias} />
                  <div>
                    <strong>{comment.helper_alias}</strong>
                    <p>{comment.body}</p>
                  </div>
                </div>
                <div className="comment-source-cell" role="group" aria-label="Source">
                  {comment.source_url ? (
                    <a className="comment-source-link" href={comment.source_url} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} /> {getCommentSourceHost(comment.source_url)}
                    </a>
                  ) : (
                    <span><LinkIcon size={15} /> Clue only</span>
                  )}
                </div>
                <time
                  className="comment-posted-cell"
                  dateTime={comment.created_at}
                  aria-label={`Posted ${getCommentTimestampLabel(comment.created_at)}`}
                >
                  {getCommentTimestampLabel(comment.created_at)}
                </time>
              </article>
            )) : !requestComments.loading && !requestComments.error ? (
              <div className="request-comment-empty">
                <strong>{commentSearch ? "No matching clues" : commentFilter === "sources" ? "No source links yet" : "No clues yet"}</strong>
                <span>{commentSearch ? "Try a different name, phrase, or source." : commentFilter === "sources" ? "Switch to all clues or add the first source." : "Be the first person to move this search forward."}</span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="legacy-recipient-callout">
        <div><strong>Looking for something too?</strong><span>Start a free public request and send one link to people who may know.</span></div>
        <button className="primary-button" type="button" onClick={onStartSearch}>Start a free search <ArrowRight size={16} /></button>
      </section>
    </main>
  );
}

function PosterDashboardPage({
  onOpenRequest,
  onRequestDeleted,
  onShareRequest,
}: {
  onOpenRequest: (requestId: string) => void;
  onRequestDeleted: (requestId: string) => void;
  onShareRequest: (request: RequestRow) => void;
}) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [dashboardError, setDashboardError] = useState("");
  const [deletingRequestId, setDeletingRequestId] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    const client = supabase;
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setDashboardError("");

      try {
        const user = await getCurrentSupabaseUser();
        const { data, error } = await client
          .from("requests")
          .select("id,user_id,item_name,category,details,duration_days,status,reference_images,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (mounted) {
          setRequests((data ?? []) as RequestRow[]);
        }
      } catch (error) {
        if (mounted) {
          setDashboardError(error instanceof Error ? error.message : "Could not load your request workspace.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const deleteRequest = async (request: RequestRow) => {
    const confirmed = window.confirm(`Delete “${request.item_name}”? This removes the public request and its comments permanently.`);

    if (!confirmed) {
      return;
    }

    if (!supabase) {
      setDashboardError("Request deletion is unavailable right now.");
      return;
    }

    setDeletingRequestId(request.id);
    setDashboardError("");
    setDeleteMessage("");

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken || sessionData.session?.user.is_anonymous) {
        throw new Error("Sign in again before deleting this request.");
      }

      const response = await fetch(`/api/requests/public?resource=delete&request_id=${encodeURIComponent(request.id)}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = await response.json().catch(() => ({})) as { deletedRequestId?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Could not delete this request.");
      }

      if (payload.deletedRequestId !== request.id) {
        throw new Error("The server did not confirm that this request was deleted.");
      }

      setRequests((current) => current.filter((item) => item.id !== request.id));
      onRequestDeleted(request.id);
      notifyRequestFeedChanged();
      if (readStoredPublishedRequest()?.requestId === request.id) {
        window.sessionStorage.removeItem(publishedRequestStorageKey);
      }
      setDeleteMessage(`“${request.item_name}” was deleted.`);

      const imagePaths = (request.reference_images ?? [])
        .map((image) => image.path?.trim() ?? "")
        .filter(Boolean);

      if (imagePaths.length) {
        try {
          const { error: storageError } = await supabase.storage
            .from(requestReferenceImagesBucket)
            .remove(imagePaths);

          if (storageError) {
            console.warn("The request was deleted, but some uploaded images could not be cleaned up.", storageError);
          }
        } catch (storageError) {
          console.warn("The request was deleted, but some uploaded images could not be cleaned up.", storageError);
        }
      }
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Could not delete this request.");
    } finally {
      setDeletingRequestId("");
    }
  };

  const openRequests = requests.filter((request) => request.status === "open");
  const archivedRequests = requests.filter((request) => request.status === "archived");
  const dashboardRequests = requests.map((request) => ({
    request,
    listing: requestRowToListing(request),
  }));

  return (
    <main className="route-page dashboard-page" aria-labelledby="poster-dashboard-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Request workspace</p>
          <h1 id="poster-dashboard-title">Your item searches.</h1>
          <p>Open, share, and organize every public search brief from one place.</p>
        </div>
      </section>
      {loading ? <p className="dialog-note">Loading your requests...</p> : null}
      {dashboardError ? <p className="dialog-error" role="alert">{dashboardError}</p> : null}
      {deleteMessage ? <p className="dialog-note" role="status">{deleteMessage}</p> : null}
      <section className="metric-grid">
        <Metric icon={Search} label="Total requests" value={String(requests.length)} />
        <Metric icon={Clock3} label="Open requests" value={String(openRequests.length)} />
        <Metric icon={FileText} label="Archived history" value={String(archivedRequests.length)} />
      </section>
      <section className="dashboard-panel">
        <div className="panel-header">
          <h2>Your requests</h2>
          <LayoutDashboard size={18} />
        </div>
        {dashboardRequests.length ? (
          <div className="request-workspace-list">
            {dashboardRequests.map(({ request, listing }) => (
              <article className="request-review-row" key={request.id}>
                <button className="review-row" type="button" onClick={() => onOpenRequest(request.id)}>
                  <img src={listing.image} alt={`${listing.name} reference`} loading="lazy" decoding="async" />
                  <span>
                    <strong>{listing.name}</strong>
                    <small>{listing.category} · {listing.status}</small>
                  </span>
                </button>
                <div className="request-review-row-actions" aria-label={`${listing.name} actions`}>
                  <button type="button" onClick={() => onOpenRequest(request.id)}><ExternalLink size={14} /> Open public page</button>
                  <button type="button" onClick={() => onShareRequest(request)}><Share2 size={14} /> Share request</button>
                  <button
                    className="request-delete-button"
                    type="button"
                    disabled={deletingRequestId === request.id}
                    onClick={() => void deleteRequest(request)}
                  >
                    <Trash2 size={14} /> {deletingRequestId === request.id ? "Deleting…" : "Delete request"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={25} />
            <strong>No searches yet</strong>
            <span>Post a free request to create your first shareable search brief.</span>
          </div>
        )}
      </section>
    </main>
  );
}

function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: Array<{ title: string; copy: string[] }>;
}) {
  return (
      <main className="route-page policy-page" aria-labelledby="policy-title">
      <section className="route-hero">
        <div>
          <p className="route-kicker">Policy</p>
          <h1 id="policy-title">{title}</h1>
          <p>{intro}</p>
        </div>
      </section>
      <section className="policy-layout">
        {sections.map((section) => (
          <article className="dashboard-panel policy-section" key={section.title}>
            <div className="panel-header">
              <h2>{section.title}</h2>
              <FileText size={19} />
            </div>
            {section.copy.map((copy) => (
              <p key={copy}>{copy}</p>
            ))}
          </article>
        ))}
      </section>
    </main>
  );
}

function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="What data we store and how we use it."
      sections={[
        {
          title: "Data we collect",
          copy: [
            "We collect account email, request details, reference photos, public clue text, public source URLs, and basic security logs.",
          ],
        },
        {
          title: "How data is used",
          copy: [
            "Published request details, reference photos, clue text, and submitted source URLs appear on public request pages. Sensitive account data is not shown there.",
            "We use account and security data to operate the workspace, prevent abuse, and respond to privacy or moderation requests.",
          ],
        },
        {
          title: "Choices and requests",
          copy: [
            "Email support@pleasefindmethis.com to request account deletion, data export, or correction.",
            "We retain only what is needed to operate the service, prevent abuse, and meet legal requirements.",
          ],
        },
      ]}
    />
  );
}

function TermsPage() {
  return (
    <PolicyPage
      title="Terms of Service"
      intro="Rules for public requests, clues, and external links."
      sections={[
        {
          title: "Posting a request",
          copy: [
            "The service is a self-serve public request board. Posting requests and public clues is free.",
            "We do not sell items, search on a customer’s behalf, hold funds, pay contributors, or arrange purchases between users.",
          ],
        },
        {
          title: "External links and safety",
          copy: [
            "Clues and source URLs are public suggestions from visitors and may be inaccurate, outdated, or unsafe.",
            "Any purchase happens independently on a third-party site. Verify availability, price, seller, authenticity, and site safety before acting.",
          ],
        },
        {
          title: "Account enforcement",
          copy: [
            "We can remove requests or clues, block abusive activity, and suspend accounts that violate these terms or applicable law.",
          ],
        },
      ]}
    />
  );
}

function AccountSettingsPage() {
  const [profile, setProfile] = useState<AccountProfile>(() => readStoredAccountProfile());
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const client = supabase;
    let mounted = true;

    const loadProfile = async () => {
      try {
        const user = await getCurrentSupabaseUser();
        const { data, error } = await client
          .from("profiles")
          .select("display_name,handle,region,specialty")
          .eq("id", user.id)
          .maybeSingle();

        if (!mounted || error) {
          return;
        }

        const nextProfile = normalizeAccountProfile({
          ...readStoredAccountProfile(),
          displayName: data?.display_name ?? "",
          handle: data?.handle ?? "",
          region: data?.region ?? "",
          specialty: data?.specialty ?? "",
          notificationEmail: user.email ?? readStoredAccountProfile().notificationEmail,
        });
        setProfile(nextProfile);
        writeStoredAccountProfile(nextProfile);
      } catch {
        // Local settings remain available when the profile table is unavailable.
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const updateProfile = (updates: Partial<AccountProfile>) => {
    setProfile((current) => normalizeAccountProfile({ ...current, ...updates }));
    setSaveStatus("");
    setSaveError("");
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextProfile = normalizeAccountProfile(profile);

    setSaveStatus("");
    setSaveError("");

    if (!nextProfile.displayName.trim()) {
      setSaveError("Add a display name before saving.");
      return;
    }

    if (!nextProfile.handle.trim()) {
      setSaveError("Add a public handle before saving.");
      return;
    }

    if (nextProfile.notificationEmail.trim() && !emailPattern.test(nextProfile.notificationEmail.trim())) {
      setSaveError("Enter a valid notification email or leave it blank.");
      return;
    }

    setSaving(true);
    writeStoredAccountProfile(nextProfile);
    setProfile(nextProfile);

    try {
      if (supabase) {
        const user = await getCurrentSupabaseUser();
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          display_name: nextProfile.displayName.trim(),
          handle: nextProfile.handle.trim(),
          region: nextProfile.region.trim(),
          specialty: nextProfile.specialty.trim(),
        });

        if (error) {
          throw error;
        }
      }

      setSaveStatus("Account settings saved.");
    } catch {
      setSaveStatus("Saved locally. Server profile sync is temporarily unavailable.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="route-page dashboard-page" aria-labelledby="settings-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Account settings</p>
          <h1 id="settings-title">Your request profile</h1>
          <p>Keep your public name and search preferences up to date.</p>
        </div>
      </section>
      <section className="two-column-page account-settings-layout" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
        <form className="form-panel" onSubmit={saveProfile}>
          <label>
            Display name
            <input value={profile.displayName} placeholder="Maya L." onChange={(event) => updateProfile({ displayName: event.target.value })} />
          </label>
          <label>
            Public handle
            <input value={profile.handle} placeholder="camera-searcher" onChange={(event) => updateProfile({ handle: event.target.value })} />
          </label>
          <label>
            Region
            <input value={profile.region} placeholder="India, US, Canada..." onChange={(event) => updateProfile({ region: event.target.value })} />
          </label>
          <label>
            Search interests
            <textarea value={profile.specialty} placeholder="Rare camera gear, discontinued mugs, repair parts..." onChange={(event) => updateProfile({ specialty: event.target.value })} />
          </label>
          <label>
            Notification email
            <input type="email" value={profile.notificationEmail} placeholder="you@example.com" onChange={(event) => updateProfile({ notificationEmail: event.target.value })} />
          </label>
          {saveError ? <p className="dialog-error" role="alert">{saveError}</p> : null}
          {saveStatus ? <p className="dialog-note" role="status">{saveStatus}</p> : null}
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </form>
      </section>
    </main>
  );
}

function NotFoundPage({ onBrowse, onHome }: { onBrowse: () => void; onHome: () => void }) {
  return (
    <main className="route-page" aria-labelledby="not-found-title">
      <section className="route-hero">
        <div>
          <p className="route-kicker">404</p>
          <h1 id="not-found-title">This page does not exist.</h1>
          <p>The link may be outdated, private, or typed incorrectly.</p>
        </div>
        <div className="head-actions">
          <button className="primary-button" type="button" onClick={onBrowse}>
            Browse requests
          </button>
          <a className="section-link section-button" href={routeHref("landing")} onClick={(event) => handleRoutedAnchorClick(event, onHome)}>
            Go home <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </main>
  );
}

function RequestDetailStatusPage({ status, onBrowse }: { status: "loading" | "unavailable"; onBrowse: () => void }) {
  const loading = status === "loading";

  return (
    <main className="route-page request-route-state" aria-labelledby="request-route-state-title" aria-busy={loading}>
      <section>
        <span className={loading ? "request-route-state-icon is-loading" : "request-route-state-icon"} aria-hidden="true">
          {loading ? <Search size={30} /> : <WifiOff size={30} />}
        </span>
        <p>{loading ? "Opening public request" : "Temporary connection issue"}</p>
        <h1 id="request-route-state-title">{loading ? "Loading this search…" : "This search is temporarily unavailable."}</h1>
        <span>
          {loading
            ? "We’re loading the exact request from its public link."
            : "The request service did not respond, so we have not treated this link as missing. Try again in a moment."}
        </span>
        <div>
          {!loading ? <button className="primary-button" type="button" onClick={() => window.location.reload()}>Try again</button> : null}
          <button className="hunt-save-button" type="button" onClick={onBrowse}>Browse open requests</button>
        </div>
      </section>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <article className="metric-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AppReadyMarker() {
  useEffect(() => {
    document.documentElement.dataset.appReady = "true";
  }, []);

  return null;
}

type RootWindow = Window & {
  __requestBoardRoot?: ReturnType<typeof createRoot>;
};

const rootElement = document.getElementById("root")!;
const rootWindow = window as RootWindow;
const root = rootWindow.__requestBoardRoot ?? createRoot(rootElement);

rootWindow.__requestBoardRoot = root;
root.render(
  <>
    <App />
    <Analytics />
    <AppReadyMarker />
  </>,
);
