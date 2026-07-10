import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Camera,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  Flag,
  ImagePlus,
  LayoutDashboard,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquare,
  PackageCheck,
  Scale,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  TimerReset,
  Trophy,
  Upload,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { hasSupabaseEnv, supabase } from "./lib/supabase";
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
  | "post-reward"
  | "post-pay"
  | "share-request"
  | "browse"
  | "browse-all"
  | "bounty-detail"
  | "submit-find"
  | "poster-dashboard"
  | "finder-dashboard"
  | "messages"
  | "dispute"
  | "profile"
  | "privacy"
  | "terms"
  | "refunds"
  | "account-settings"
  | "admin-review"
  | "not-found";

type AuthMode = "signup" | "login";
type AuthBusyAction = "email" | "google" | null;
type AuthAccountType = "both" | "poster" | "finder";

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

type BountyListing = {
  id: string;
  name: string;
  detail: string;
  reward: string;
  rewardValue: number;
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
  reward: number;
  duration_days: number;
  status: string;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
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
  reward: number;
  total_due: number;
  finder_payout: number;
  duration_days: number;
  status: string;
  payment_status: string;
  payout_status: string;
  customer_email: string | null;
  reference_images: Array<{ url?: string; name?: string }> | null;
  created_at: string;
  paid_at: string | null;
  payout_release_after: string | null;
};

type SourceProofFile = {
  name: string;
  path: string;
  type: string | null;
  size: number;
};

type SourceSubmissionRow = {
  id: string;
  request_id: string;
  finder_id: string;
  source_type: FindSourceType;
  price_or_terms: string | null;
  match_notes: string;
  proof?: SourceProofFile[] | null;
  status: string;
  first_valid_rank: number | null;
  revealed_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  awarded_at: string | null;
  created_at: string;
  updated_at: string;
};

type RevealedSourceDetailRow = SourceSubmissionRow & {
  source_url: string | null;
  source_contact: string | null;
  contact_email: string | null;
  poster_id?: string;
  revealed_log_created_at?: string;
};

type SourceReviewRow = {
  id: string;
  submission_id: string;
  request_id: string;
  reviewer_id: string;
  decision: "accepted" | "rejected" | "sent_to_review";
  reason_code: string | null;
  note: string;
  created_at: string;
};

type SourceDisputeRow = {
  id: string;
  submission_id: string;
  request_id: string;
  opened_by: string;
  opened_by_role: "poster" | "finder";
  reason_code: string;
  evidence_summary: string;
  status: string;
  resolution_note: string;
  created_at: string;
  updated_at: string;
};

type FinderPayoutCaseRow = {
  id: string;
  submission_id: string;
  request_id: string;
  finder_id: string;
  amount: number;
  currency: string;
  status: string;
  release_after: string | null;
  processor: string | null;
  processor_transfer_id: string | null;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

type SourceMessageRow = {
  id: string;
  submission_id: string;
  request_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type SourceDuplicateFlagRow = {
  id: string;
  request_id: string;
  finder_id: string;
  source_fingerprint: string;
  existing_submission_id: string | null;
  source_type: FindSourceType;
  normalized_source: string;
  status: string;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

type AdminPayoutQueuesResponse = {
  payoutCases?: FinderPayoutCaseRow[];
  disputes?: SourceDisputeRow[];
  duplicateFlags?: SourceDuplicateFlagRow[];
  admin?: {
    email?: string;
    configured?: boolean;
  };
  payoutCase?: FinderPayoutCaseRow;
  dispute?: SourceDisputeRow;
  duplicateFlag?: SourceDuplicateFlagRow;
  error?: string;
};

type RequestCategory = "home" | "audio" | "camera" | "watch" | "gaming" | "parts" | "fashion";
type PostStarterId = "sentimental" | "rare-gear" | "parts" | "fashion";
type RequestDuration = 7 | 14 | 30 | 60;

type PostDraft = {
  itemName: string;
  category: RequestCategory;
  details: string;
  reward: number;
  durationDays: RequestDuration;
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
  reward: number;
  durationDays: RequestDuration;
};

type PostStarterPrompt = {
  id: PostStarterId;
  icon: typeof Search;
  label: string;
  title: string;
  itemName: string;
  category: RequestCategory;
  details: string;
  reward: number;
  durationDays: RequestDuration;
};

type FindSourceType = "source-link" | "private-source" | "finder-has-it";

type CheckoutReturnStatus = "success" | "cancelled" | null;

type CheckoutSnapshot = {
  requestId?: string;
  itemName: string;
  provider: string;
  category?: string;
  reward: number;
  platformFee: number;
  protection: number;
  platformShare: number;
  total: number;
  email: string;
  durationDays?: number;
  createdAt?: string;
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

type FinderIdentityStatus = "not_started" | "review_requested" | "verified";

type AccountProfile = {
  displayName: string;
  handle: string;
  accountType: AuthAccountType;
  region: string;
  specialty: string;
  payoutEmail: string;
  payoutCountry: string;
  identityStatus: FinderIdentityStatus;
  notificationEmail: string;
};

type FinderReadinessItem = {
  label: string;
  complete: boolean;
  copy: string;
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
  "Find this exact item with a free request. Add photos and details to get local and online source leads fast.";
const defaultSocialDescription =
  "Looking for a hard-to-find or discontinued item? Post one free request with photos and clear details first.";
const organizationLogo = `${siteOrigin}/magnifying-glass.png`;
const defaultSeoImage = `${siteOrigin}/og/pleasefindmethis-vintage-tee-fullscreen-v3.png`;
const neutralRequestImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#eef4ff"/><rect x="382" y="255" width="436" height="334" rx="20" fill="#fff" stroke="#aebbd4" stroke-width="8"/><circle cx="515" cy="365" r="46" fill="#dbe7ff"/><path d="m420 535 145-132 92 78 74-58 69 112" fill="none" stroke="#0b46d4" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M538 662h124" stroke="#ff5b0b" stroke-width="18" stroke-linecap="round"/></svg>',
)}`;
const requestSingular = "request";
const requestPlural = "requests";
const checkoutRequestTimeoutMs = 25000;
const minimumReward = 0;
const siteLastUpdated = "2026-07-07";

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
  reward: 0,
  durationDays: 30,
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
      "Why it matters:\nI need the same item, not a lookalike.\n\nMust match:\nIt should match the reference photo, color, size, pattern, label, and condition closely enough to buy with confidence.\n\nAlready searched:\nGoogle Lens, resale marketplaces, old listings, and image search.\n\nWrong matches to avoid:\nSimilar-looking replacements that do not match the original details.\n\nValid source should include:\nA current listing, seller contact, local lead, or direct handoff path with proof it matches the photos.",
    reward: 0,
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
      "Why it matters:\nI am looking for the exact model or reference.\n\nMust match:\nModel, variant, condition expectations, and any required accessories.\n\nAlready searched:\nMarketplace listings, collector forums, and saved searches.\n\nWrong matches to avoid:\nNear variants, untested listings, missing accessories, and sources without condition proof.\n\nValid source should include:\nCondition, price, seller or source, shipping region, and authenticity or compatibility details before I act on it.",
    reward: 0,
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
      "Why it matters:\nI need a compatible part or donor unit.\n\nMust match:\nParent model, part markings, connector, dimensions, and fitment requirements.\n\nAlready searched:\nParts diagrams, marketplace listings, donor units, and repair forums.\n\nWrong matches to avoid:\nSimilar parts with different revisions, connectors, polarity, or unsafe fitment.\n\nValid source should include:\nModel numbers, compatibility proof, condition, source link or seller contact, and any fitment risks.",
    reward: 0,
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
    reward: 0,
    durationDays: 30,
  },
];

const findSourceOptions: Array<{ value: FindSourceType; label: string; copy: string }> = [
  {
    value: "source-link",
    label: "I found a public listing",
    copy: "Share a public listing the requester can open right away.",
  },
  {
    value: "private-source",
    label: "I found a private or local lead",
    copy: "Use this when a seller or local contact is available but no public link is.",
  },
  {
    value: "finder-has-it",
    label: "I found it for them",
    copy: "Use this when you can share a direct handoff path or clear next step.",
  },
];

const requestCommentVisitorStorageKey = "pleasefindmethis-comment-visitor-v1";
const requestCommentMaxLength = 700;
const publicHelperAdjectives = [
  "amber",
  "blue",
  "brisk",
  "cedar",
  "copper",
  "gold",
  "green",
  "ivory",
  "jade",
  "mint",
  "navy",
  "opal",
  "pearl",
  "silver",
  "tan",
  "teal",
  "violet",
  "warm",
];
const publicHelperNouns = [
  "anchovy",
  "angelfish",
  "cod",
  "darter",
  "goby",
  "herring",
  "minnow",
  "parrotfish",
  "perch",
  "pike",
  "ray",
  "sardine",
  "squid",
  "tetra",
  "trout",
  "tuna",
];

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
  "A current listing, seller contact, local lead, or direct handoff path with proof it matches the photos.";

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
    hint: "Call out exact mistakes so helpers do not repeat them.",
    rows: 3,
  },
  {
    key: "sourceProof",
    heading: "Valid source should include",
    label: "What counts as a valid source?",
    placeholder: defaultRequestBriefSourceProof,
    hint: "Tell helpers what proof makes a lead valid.",
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
    hint: "Add dates, stores, screenshots, and context helpers can use.",
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
  "post-pay",
  "share-request",
  "submit-find",
  "poster-dashboard",
  "finder-dashboard",
  "messages",
  "dispute",
  "account-settings",
  "admin-review",
]);

const pageLabels: Record<Page, string> = {
  landing: "Landing page",
  auth: "Sign up / Log in",
  "post-describe": "Post Request - Describe",
  "post-reward": "Post Request - Duration",
  "post-pay": "Post Request - Publish",
  "share-request": "Share request",
  browse: "Browse requests",
  "browse-all": "Browse all",
  "bounty-detail": "Request detail",
  "submit-find": "Submit a source",
  "poster-dashboard": "Poster dashboard",
  "finder-dashboard": "Helper dashboard",
  messages: "Messages",
  dispute: "Dispute",
  profile: "Finder profile",
  privacy: "Privacy Policy",
  terms: "Terms",
  refunds: "Refunds",
  "account-settings": "Account settings",
  "admin-review": "Admin review",
  "not-found": "Not found",
};

const routeMap: Record<string, Page> = {
  "": "landing",
  "/": "landing",
  landing: "landing",
  auth: "auth",
  post: "post-describe",
  "post/describe": "post-describe",
  "post/visibility": "post-reward",
  "post/duration": "post-reward",
  "post/publish": "post-pay",
  "post/offer": "post-reward",
  "post/reward": "post-reward",
  "post/pay": "post-pay",
  "post/share": "share-request",
  browse: "browse",
  "browse/all": "browse-all",
  "bounty/detail": "bounty-detail",
  "submit-find": "submit-find",
  "poster-dashboard": "poster-dashboard",
  "finder-dashboard": "finder-dashboard",
  messages: "messages",
  dispute: "dispute",
  profile: "profile",
  privacy: "privacy",
  terms: "terms",
  refunds: "refunds",
  "account/settings": "account-settings",
  "admin/review": "admin-review",
};

const pageRoutes: Record<Page, string> = {
  landing: "/",
  auth: "auth",
  "post-describe": "post/describe",
  "post-reward": "post/duration",
  "post-pay": "post/publish",
  "share-request": "post/share",
  browse: "browse",
  "browse-all": "browse/all",
  "bounty-detail": "bounty/detail",
  "submit-find": "submit-find",
  "poster-dashboard": "poster-dashboard",
  "finder-dashboard": "finder-dashboard",
  messages: "messages",
  dispute: "dispute",
  profile: "profile",
  privacy: "privacy",
  terms: "terms",
  refunds: "refunds",
  "account-settings": "account/settings",
  "admin-review": "admin/review",
  "not-found": "not-found",
};

const indexablePages = new Set<Page>([
  "landing",
  "browse",
  "browse-all",
  "bounty-detail",
  "profile",
  "privacy",
  "terms",
  "refunds",
]);

const routesUsingPublicRequestFeed = new Set<Page>(["landing", "browse", "browse-all", "bounty-detail"]);
const routesUsingCurrency = new Set<Page>([
  "landing",
  "browse",
  "browse-all",
  "bounty-detail",
  "post-reward",
  "post-pay",
  "submit-find",
  "poster-dashboard",
  "finder-dashboard",
  "profile",
]);

function routeUsesPublicRequestFeed(page: Page) {
  return routesUsingPublicRequestFeed.has(page);
}

function routeUsesCurrency(page: Page) {
  return routesUsingCurrency.has(page);
}

const pageSeoCopy: Record<Page, { title: string; description: string; socialDescription?: string }> = {
  landing: {
    title: "Where Can I Buy This Exact Item? | pleasefindmethis",
    description: defaultSeoDescription,
    socialDescription: defaultSocialDescription,
  },
  auth: {
    title: "Sign In | pleasefindmethis",
    description: "Sign in to post requests and review source leads.",
  },
  "post-describe": {
    title: "Post a Find Request | pleasefindmethis",
    description: "Describe what you need and what makes a lead valid.",
  },
  "post-reward": {
    title: "Choose Request Duration | pleasefindmethis",
    description: "Set how long your request stays open.",
  },
  "post-pay": {
    title: "Publish a Free Request | pleasefindmethis",
    description: "Publish the request and open it for source leads.",
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
  "bounty-detail": {
    title: "Find Request Details | pleasefindmethis",
    description: "Review request details and available source leads.",
  },
  "submit-find": {
    title: "Share a Source Suggestion | pleasefindmethis",
    description: "Submit one clear lead for this request.",
  },
  "poster-dashboard": {
    title: "Poster Dashboard | pleasefindmethis",
    description: "Review leads and active requests.",
  },
  "finder-dashboard": {
    title: "Helper Dashboard | pleasefindmethis",
    description: "Help with open requests and submit leads.",
  },
  messages: {
    title: "Messages | pleasefindmethis",
    description: "Track source updates and follow-ups.",
  },
  dispute: {
    title: "Open a Source Dispute | pleasefindmethis",
    description: "Report a source lead that does not match.",
  },
  profile: {
    title: "Helper Trust Profile Example | pleasefindmethis",
    description: "View helper profile and trust status.",
  },
  privacy: {
    title: "Privacy Policy | pleasefindmethis",
    description: "How account, request, and message data is used.",
  },
  terms: {
    title: "Terms of Service | pleasefindmethis",
    description: "Rules for posting and source safety.",
  },
  refunds: {
    title: "Refund and Cancellation Policy | pleasefindmethis",
    description: "How request removals and cancellations are handled.",
  },
  "account-settings": {
    title: "Account Settings | pleasefindmethis",
    description: "Manage account access and alerts.",
  },
  "admin-review": {
    title: "Admin Review Queue | pleasefindmethis",
    description: "Admin queue for reviews and disputes.",
  },
  "not-found": {
    title: "Page Not Found | pleasefindmethis",
    description: "This page is not available.",
  },
};

const signedInStorageKey = "pleasefindmethis-signed-in";
const pendingRouteStorageKey = "pleasefindmethis-pending-route";
const authProviderStorageKey = "pleasefindmethis-auth-provider";
const authEmailStorageKey = "pleasefindmethis-auth-email";
const checkoutSnapshotStorageKey = "pleasefindmethis-last-checkout";
const postDraftStorageKey = "pleasefindmethis-post-draft";
const postReferenceImagesStorageKey = "pleasefindmethis-post-reference-images";
const publishedRequestStorageKey = "pleasefindmethis-published-request";
const accountProfileStorageKey = "pleasefindmethis-account-profile";
const requestReferenceImagesBucket = "request-reference-images";
const sourceSubmissionProofBucket = "source-submission-proof";
const maxPersistedReferenceImages = 4;
const maxPersistedReferenceImageDataUrlLength = 450_000;
const maxPersistedReferenceImagesTotalLength = maxPersistedReferenceImages * maxPersistedReferenceImageDataUrlLength;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type CurrencySource = "locale" | "timezone" | "geolocation" | "fallback";

type CurrencyPreference = {
  currency: string;
  locale: string;
  region: string;
  rateFromUsd: number;
  source: CurrencySource;
  ratesUpdatedAt?: string;
};

type ExchangeRateCache = {
  fetchedAt: number;
  rates: Record<string, number>;
  updatedAt?: string;
};

type CoordinateRegion = {
  region: string;
  south: number;
  west: number;
  north: number;
  east: number;
};

const defaultCurrencyPreference: CurrencyPreference = {
  currency: "USD",
  locale: "en-US",
  region: "US",
  rateFromUsd: 1,
  source: "fallback",
};
const CurrencyContext = React.createContext<CurrencyPreference>(defaultCurrencyPreference);
const exchangeRateCacheKey = "pleasefindmethis-usd-exchange-rates";
const exchangeRateCacheTtlMs = 12 * 60 * 60 * 1000;
const exchangeRateApiUrl = "https://open.er-api.com/v6/latest/USD";
const fallbackUsdExchangeRates: Record<string, number> = {
  USD: 1,
  AED: 3.67,
  ARS: 1480,
  AUD: 1.45,
  BDT: 123,
  BGN: 1.71,
  BHD: 0.38,
  BRL: 5.18,
  CAD: 1.42,
  CHF: 0.8,
  CLP: 940,
  CNY: 7.16,
  COP: 4050,
  CZK: 21.4,
  DKK: 6.53,
  EGP: 49,
  EUR: 0.88,
  GBP: 0.76,
  HKD: 7.75,
  HUF: 345,
  IDR: 16400,
  ILS: 3.3,
  INR: 94.7,
  JPY: 143,
  KES: 129,
  KRW: 1360,
  KWD: 0.31,
  LKR: 302,
  MAD: 9.1,
  MXN: 18.3,
  MYR: 4.13,
  NGN: 1530,
  NOK: 10.1,
  NPR: 151,
  NZD: 1.58,
  OMR: 0.38,
  PEN: 3.55,
  PHP: 56.5,
  PKR: 284,
  PLN: 3.74,
  QAR: 3.64,
  RON: 4.45,
  SAR: 3.75,
  SEK: 9.57,
  SGD: 1.29,
  THB: 32.4,
  TRY: 39.8,
  TWD: 29.2,
  UAH: 41.8,
  VND: 26100,
  ZAR: 17.7,
};
const regionCurrencyMap: Record<string, string> = {
  AD: "EUR",
  AE: "AED",
  AR: "ARS",
  AT: "EUR",
  AU: "AUD",
  BE: "EUR",
  BG: "BGN",
  BH: "BHD",
  BR: "BRL",
  CA: "CAD",
  CH: "CHF",
  CL: "CLP",
  CN: "CNY",
  CO: "COP",
  CY: "EUR",
  CZ: "CZK",
  DE: "EUR",
  DK: "DKK",
  EE: "EUR",
  EG: "EGP",
  ES: "EUR",
  FI: "EUR",
  FR: "EUR",
  GB: "GBP",
  GR: "EUR",
  HK: "HKD",
  HR: "EUR",
  HU: "HUF",
  ID: "IDR",
  IE: "EUR",
  IL: "ILS",
  IN: "INR",
  IT: "EUR",
  JP: "JPY",
  KE: "KES",
  KR: "KRW",
  KW: "KWD",
  LK: "LKR",
  LT: "EUR",
  LU: "EUR",
  LV: "EUR",
  MA: "MAD",
  MC: "EUR",
  MT: "EUR",
  MX: "MXN",
  MY: "MYR",
  NG: "NGN",
  NL: "EUR",
  NO: "NOK",
  NP: "NPR",
  NZ: "NZD",
  OM: "OMR",
  PE: "PEN",
  PH: "PHP",
  PK: "PKR",
  PL: "PLN",
  PT: "EUR",
  QA: "QAR",
  RO: "RON",
  SA: "SAR",
  SE: "SEK",
  SG: "SGD",
  SI: "EUR",
  SK: "EUR",
  TH: "THB",
  TR: "TRY",
  TW: "TWD",
  UA: "UAH",
  US: "USD",
  VN: "VND",
  ZA: "ZAR",
};
const timeZoneRegionMap: Record<string, string> = {
  "America/Anchorage": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/New_York": "US",
  "America/Phoenix": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Hong_Kong": "HK",
  "Asia/Kolkata": "IN",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Australia/Sydney": "AU",
  "Europe/Amsterdam": "NL",
  "Europe/Berlin": "DE",
  "Europe/Dublin": "IE",
  "Europe/London": "GB",
  "Europe/Madrid": "ES",
  "Europe/Paris": "FR",
  "Europe/Rome": "IT",
  "Europe/Stockholm": "SE",
  "Europe/Zurich": "CH",
  "Pacific/Auckland": "NZ",
  "Pacific/Honolulu": "US",
};
const coordinateRegions: CoordinateRegion[] = [
  { region: "US", south: 24, west: -125, north: 50, east: -66 },
  { region: "US", south: 51, west: -170, north: 72, east: -130 },
  { region: "US", south: 18, west: -161, north: 23, east: -154 },
  { region: "CA", south: 42, west: -141, north: 84, east: -52 },
  { region: "GB", south: 49, west: -9, north: 61, east: 2 },
  { region: "IE", south: 51, west: -11, north: 56, east: -5 },
  { region: "IN", south: 6, west: 68, north: 37, east: 98 },
  { region: "AU", south: -44, west: 112, north: -10, east: 154 },
  { region: "NZ", south: -48, west: 166, north: -34, east: 179 },
  { region: "JP", south: 24, west: 122, north: 46, east: 146 },
  { region: "SG", south: 1.1, west: 103.6, north: 1.6, east: 104.1 },
  { region: "HK", south: 22.1, west: 113.8, north: 22.6, east: 114.5 },
  { region: "AE", south: 22.6, west: 51.4, north: 26.3, east: 56.4 },
  { region: "FR", south: 41, west: -5.5, north: 51.5, east: 9.8 },
  { region: "DE", south: 47, west: 5.8, north: 55.2, east: 15.1 },
  { region: "IT", south: 35.4, west: 6.6, north: 47.2, east: 18.6 },
  { region: "ES", south: 36, west: -9.5, north: 43.9, east: 4.4 },
  { region: "BR", south: -34, west: -74, north: 6, east: -34 },
  { region: "MX", south: 14, west: -118, north: 33, east: -86 },
  { region: "ZA", south: -35, west: 16, north: -22, east: 33 },
];
const heroPlaceholderExamples = [
  "where can i buy this exact item?",
  "help me find this exact item",
  "where is the original source for this?",
  "where can I buy this discontinued item",
  "where can i get this exact watch",
  "how to buy this exact item from a photo",
  "where can i find this camera part",
];

function getBrowserLocales() {
  const languages = typeof navigator !== "undefined" && Array.isArray(navigator.languages) ? navigator.languages : [];
  const primaryLanguage = typeof navigator !== "undefined" ? navigator.language : "";
  return [...languages, primaryLanguage].filter((locale, index, locales): locale is string => Boolean(locale) && locales.indexOf(locale) === index);
}

function getRegionFromLocale(locale: string) {
  const parts = locale.replace(/_/g, "-").split("-");

  for (const part of parts.slice(1)) {
    if (/^[A-Za-z]{2}$/.test(part) || /^\d{3}$/.test(part)) {
      return part.toUpperCase();
    }
  }

  return "";
}

function getLocaleForRegion(region: string) {
  const browserLocales = getBrowserLocales();
  const matchingLocale = browserLocales.find((locale) => getRegionFromLocale(locale) === region);

  if (matchingLocale) {
    return matchingLocale;
  }

  const language = browserLocales[0]?.split("-")[0] || "en";
  return `${language}-${region}`;
}

function getRegionFromTimeZone() {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZoneRegionMap[timeZone] ?? "";
  } catch {
    return "";
  }
}

function getCurrencyForRegion(region: string) {
  return regionCurrencyMap[region] ?? "USD";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createCurrencyPreference(region: string, source: CurrencySource): CurrencyPreference {
  const currency = getCurrencyForRegion(region);
  return {
    currency,
    locale: region ? getLocaleForRegion(region) : defaultCurrencyPreference.locale,
    region: region || defaultCurrencyPreference.region,
    rateFromUsd: fallbackUsdExchangeRates[currency] ?? 1,
    source,
  };
}

function resolveInitialCurrencyPreference() {
  const timeZoneRegion = getRegionFromTimeZone();

  if (timeZoneRegion) {
    return createCurrencyPreference(timeZoneRegion, "timezone");
  }

  const localeRegion = getBrowserLocales().map(getRegionFromLocale).find((region) => Boolean(region && regionCurrencyMap[region]));

  if (localeRegion) {
    return createCurrencyPreference(localeRegion, "locale");
  }

  return defaultCurrencyPreference;
}

function normalizeLongitude(longitude: number) {
  return ((((longitude + 180) % 360) + 360) % 360) - 180;
}

function getRegionFromCoordinates(latitude: number, longitude: number) {
  const normalizedLongitude = normalizeLongitude(longitude);
  const match = coordinateRegions.find(
    (bounds) =>
      latitude >= bounds.south &&
      latitude <= bounds.north &&
      normalizedLongitude >= bounds.west &&
      normalizedLongitude <= bounds.east,
  );

  return match?.region ?? "";
}

function readCachedExchangeRates(): ExchangeRateCache | null {
  try {
    const cached = window.localStorage.getItem(exchangeRateCacheKey);

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached) as Partial<ExchangeRateCache>;

    if (
      typeof parsed.fetchedAt === "number" &&
      isRecord(parsed.rates) &&
      Object.values(parsed.rates).every((rate) => typeof rate === "number" && Number.isFinite(rate))
    ) {
      return {
        fetchedAt: parsed.fetchedAt,
        rates: parsed.rates as Record<string, number>,
        ...(typeof parsed.updatedAt === "string" ? { updatedAt: parsed.updatedAt } : {}),
      };
    }
  } catch {
    // Ignore blocked storage or corrupted exchange-rate cache.
  }

  return null;
}

function writeCachedExchangeRates(cache: ExchangeRateCache) {
  try {
    window.localStorage.setItem(exchangeRateCacheKey, JSON.stringify(cache));
  } catch {
    // Currency formatting can still use fallback rates when storage is blocked.
  }
}

async function loadUsdExchangeRates(): Promise<ExchangeRateCache | null> {
  const cached = readCachedExchangeRates();

  if (cached && Date.now() - cached.fetchedAt < exchangeRateCacheTtlMs) {
    return cached;
  }

  try {
    const response = await fetch(exchangeRateApiUrl, { cache: "no-store" });

    if (!response.ok) {
      return cached;
    }

    const payload = (await response.json()) as unknown;

    if (!isRecord(payload) || payload.result !== "success" || !isRecord(payload.rates)) {
      return cached;
    }

    const rates = Object.fromEntries(
      Object.entries(payload.rates).filter((entry): entry is [string, number] => typeof entry[1] === "number" && Number.isFinite(entry[1])),
    );
    const nextCache: ExchangeRateCache = {
      fetchedAt: Date.now(),
      rates,
      ...(typeof payload.time_last_update_utc === "string" ? { updatedAt: payload.time_last_update_utc } : {}),
    };

    writeCachedExchangeRates(nextCache);
    return nextCache;
  } catch {
    return cached;
  }
}

function useViewerCurrencyPreference(enabled = true) {
  const [preference, setPreference] = useState<CurrencyPreference>(() => resolveInitialCurrencyPreference());

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;

    loadUsdExchangeRates().then((cache) => {
      const liveRate = cache?.rates[preference.currency];

      if (cancelled || typeof liveRate !== "number" || !Number.isFinite(liveRate)) {
        return;
      }

      setPreference((current) =>
        current.currency === preference.currency
          ? {
              ...current,
              rateFromUsd: liveRate,
              ratesUpdatedAt: cache?.updatedAt,
            }
          : current,
      );
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, preference.currency]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (!navigator.geolocation || !window.isSecureContext) {
      return undefined;
    }

    let cancelled = false;

    const refineFromPosition = (position: GeolocationPosition) => {
      if (cancelled) {
        return;
      }

      const region = getRegionFromCoordinates(position.coords.latitude, position.coords.longitude);

      if (!region || !regionCurrencyMap[region]) {
        return;
      }

      setPreference((current) => {
        const nextPreference = createCurrencyPreference(region, "geolocation");
        return current.region === nextPreference.region ? current : nextPreference;
      });
    };

    const requestPosition = () => {
      navigator.geolocation.getCurrentPosition(refineFromPosition, () => undefined, {
        enableHighAccuracy: false,
        maximumAge: 24 * 60 * 60 * 1000,
        timeout: 4500,
      });
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((permissionStatus) => {
          if (!cancelled && permissionStatus.state === "granted") {
            requestPosition();
          }
        })
        .catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return preference;
}

function useCurrencyPreference() {
  return React.useContext(CurrencyContext);
}

function formatUsdMoney(usdAmount: number, preference: CurrencyPreference, options: { compact?: boolean } = {}) {
  const safeUsdAmount = Number.isFinite(usdAmount) ? usdAmount : 0;
  const rate = Number.isFinite(preference.rateFromUsd) && preference.rateFromUsd > 0 ? preference.rateFromUsd : 1;
  const convertedAmount = safeUsdAmount * rate;
  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency: preference.currency,
    maximumFractionDigits: options.compact ? 1 : 0,
    minimumFractionDigits: 0,
  };

  if (options.compact) {
    formatOptions.notation = "compact";
    formatOptions.compactDisplay = "short";
  }

  try {
    return new Intl.NumberFormat(preference.locale, formatOptions).format(convertedAmount);
  } catch {
    return new Intl.NumberFormat(defaultCurrencyPreference.locale, {
      style: "currency",
      currency: defaultCurrencyPreference.currency,
      maximumFractionDigits: 0,
    }).format(safeUsdAmount);
  }
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

function getStatusLabel(status: string, paymentStatus?: string) {
  if (status === "disputed" || paymentStatus === "disputed") {
    return "In review";
  }

  if (status === "open" || paymentStatus === "free") {
    return "Open";
  }

  if (status === "paid" || paymentStatus === "paid") {
    return "Open";
  }

  if (status === "refunded") {
    return "Refunded";
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
    : ["Exact match preferred", "Clear source or contact path", "Availability should be current", "Proof helps review faster"];
}

function getRequestDescription(itemName: string, details?: string | null) {
  const brief = getRequestBriefFields(details ?? "");
  return brief.story || `Looking for ${itemName || "this exact item"}. Share a clue if you recognize it.`;
}

function publicRequestRowToBounty(row: PublicRequestCardRow): BountyListing {
  const details = row.details?.trim() || "Helpers can share a public listing, shop contact path, source clue, or legal availability note.";
  const requestTypeText = row.payment_status === "free" ? "Free request" : "Featured request";

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: requestTypeText,
    reward: requestTypeText,
    rewardValue: row.reward || 0,
    closes: getClosesLabel(row.days_remaining),
    image: row.primary_image_url || neutralRequestImage,
    category: row.category || "General",
    status: getStatusLabel(row.status, row.payment_status),
    location: "Open to source suggestions",
    poster: "Requester",
    posted: getRelativeTimeLabel(row.created_at),
    submissions: row.submission_count ?? 0,
    description: getRequestDescription(row.item_name, details),
    mustHaves: getMustHaves(details),
    brief: getRequestBriefFields(details),
    timeline: ["Free request posted", `${row.submission_count ?? 0} source suggestion${row.submission_count === 1 ? "" : "s"}`, "Helpers can share useful leads"],
    live: true,
    createdAt: row.created_at,
    closesAt: row.closes_at ?? undefined,
  };
}

function requestRowToBounty(row: RequestRow, submissionCount = 0): BountyListing {
  const createdAt = row.created_at;
  const paidAt = row.paid_at;
  const requestTypeText = row.payment_status === "free" ? "Free request" : "Open request";

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: requestTypeText,
    reward: requestTypeText,
    rewardValue: row.reward || 0,
    closes: `${row.duration_days} days`,
    image: getReferenceImage(row.reference_images),
    category: row.category || "General",
    status: getStatusLabel(row.status, row.payment_status),
    location: "Open to source suggestions",
    poster: "You",
    posted: getRelativeTimeLabel(paidAt ?? createdAt),
    submissions: submissionCount,
    description: getRequestDescription(row.item_name, row.details),
    mustHaves: getMustHaves(row.details),
    brief: getRequestBriefFields(row.details ?? ""),
    timeline: [
      row.payment_status === "free" ? "Free request posted" : "Request is open",
      `${submissionCount} source suggestion${submissionCount === 1 ? "" : "s"}`,
      "Awaiting useful links or clues",
    ],
    live: row.payment_status === "free" || row.payment_status === "paid",
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
    createdAt: row.paid_at || row.created_at || new Date().toISOString(),
  };
}

function mergeBounties(primary: BountyListing[], fallback: BountyListing[]) {
  return primary.length ? primary : fallback;
}

function usePublicRequestListings(enabled = true, requestId = "") {
  const [listings, setListings] = useState<BountyListing[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [requestNotFound, setRequestNotFound] = useState(false);
  const [resolvedRequestId, setResolvedRequestId] = useState("");

  useEffect(() => {
    if (!enabled) {
      setListings([]);
      setLoading(false);
      setError("");
      setRequestNotFound(false);
      setResolvedRequestId("");
      return undefined;
    }

    let mounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setError("");
      setRequestNotFound(false);
      setResolvedRequestId("");

      try {
        const params = new URLSearchParams();
        if (isUuid(requestId)) {
          params.set("request_id", requestId);
        }
        const endpoint = params.size ? `/api/requests/public?${params.toString()}` : "/api/requests/public";
        const response = await fetch(endpoint, {
          headers: {
            Accept: "application/json",
          },
        });
        const payload = (await response.json()) as { requests?: PublicRequestCardRow[]; error?: string };

        if (!mounted) {
          return;
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

        setListings(payload.requests.map(publicRequestRowToBounty));
        setRequestNotFound(isUuid(requestId) && payload.requests.length === 0);
        setResolvedRequestId(isUuid(requestId) ? requestId : "");
      } catch {
        if (!mounted) {
          return;
        }

        setError("Live request feed is not ready yet.");
        setListings([]);
        setRequestNotFound(false);
        setResolvedRequestId(isUuid(requestId) ? requestId : "");
      }

      setLoading(false);
    };

    loadRequests();

    return () => {
      mounted = false;
    };
  }, [enabled, requestId]);

  return { listings, loading, error, requestNotFound, resolvedRequestId };
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
  const hash = hashPublicHelperSeed(seed);
  const adjective = publicHelperAdjectives[hash % publicHelperAdjectives.length];
  const noun = publicHelperNouns[Math.floor(hash / publicHelperAdjectives.length) % publicHelperNouns.length];
  return `${adjective} ${noun}`;
}

function getPublicHelperAvatarTone(seed: string) {
  return hashPublicHelperSeed(`tone:${seed}`) % 6;
}

function getAliasInitials(alias: string) {
  return alias
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createVisitorSeed() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getRequestCommentVisitor() {
  const createVisitor = (seed = createVisitorSeed()) => ({
    seed,
    alias: getPublicHelperAlias(seed),
    avatarTone: getPublicHelperAvatarTone(seed),
  });

  try {
    const stored = window.localStorage.getItem(requestCommentVisitorStorageKey);
    const parsed = stored ? (JSON.parse(stored) as { seed?: unknown }) : null;
    const storedSeed = typeof parsed?.seed === "string" ? parsed.seed.trim().slice(0, 160) : "";

    if (storedSeed) {
      return createVisitor(storedSeed);
    }

    const visitor = createVisitor();
    window.localStorage.setItem(requestCommentVisitorStorageKey, JSON.stringify({ seed: visitor.seed }));
    return visitor;
  } catch {
    return createVisitor();
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

function getFallbackRequestComments(bounty: BountyListing): PublicRequestCommentRow[] {
  if (isUuid(bounty.id)) {
    return [];
  }

  const firstSeed = `${bounty.id}:listing-check`;
  const secondSeed = `${bounty.id}:detail-question`;

  return [
    normalizeRequestComment(
      {
        id: `demo-${bounty.id}-listing-check`,
        request_id: bounty.id,
        body: `I checked a few resale listings for ${bounty.name}. Most are close, but the details still need a better match.`,
        source_url: null,
        helper_alias: getPublicHelperAlias(firstSeed),
        helper_avatar_tone: getPublicHelperAvatarTone(firstSeed),
        created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
      },
      bounty.id,
    ),
    normalizeRequestComment(
      {
        id: `demo-${bounty.id}-detail-question`,
        request_id: bounty.id,
        body: "Do you know the rough year or store where this came from? That clue can narrow the search fast.",
        source_url: null,
        helper_alias: getPublicHelperAlias(secondSeed),
        helper_avatar_tone: getPublicHelperAvatarTone(secondSeed),
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      bounty.id,
    ),
  ];
}

function useRequestComments(bounty: BountyListing) {
  const [comments, setComments] = useState<PublicRequestCommentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const fallbackComments = getFallbackRequestComments(bounty);

    if (!isUuid(bounty.id)) {
      setComments(fallbackComments);
      setLoading(false);
      setError("");
      return undefined;
    }

    const loadComments = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({ resource: "comments", request_id: bounty.id });
        const response = await fetch(`/api/requests/public?${params.toString()}`, {
          headers: {
            Accept: "application/json",
          },
        });
        const payload = (await response.json()) as { comments?: PublicRequestCommentRow[]; error?: string };

        if (!mounted) {
          return;
        }

        if (!response.ok || !Array.isArray(payload.comments)) {
          throw new Error(payload.error || "Comments are not ready yet.");
        }

        setComments(payload.comments.map((comment) => normalizeRequestComment(comment, bounty.id)));
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
  }, [bounty.id, bounty.name]);

  const addComment = async (body: string, sourceUrl: string) => {
    const visitor = getRequestCommentVisitor();
    const normalizedBody = body.trim().slice(0, requestCommentMaxLength);
    const normalizedSourceUrl = normalizeCommentSourceUrl(sourceUrl);

    if (!normalizedBody || normalizedBody.length < 2) {
      throw new Error("Add a short comment before posting.");
    }

    if (sourceUrl.trim() && !normalizedSourceUrl) {
      throw new Error("Add a valid http or https source link.");
    }

    if (!isUuid(bounty.id)) {
      const localComment = normalizeRequestComment(
        {
          id: `local-${createVisitorSeed()}`,
          request_id: bounty.id,
          body: normalizedBody,
          source_url: normalizedSourceUrl || null,
          helper_alias: visitor.alias,
          helper_avatar_tone: visitor.avatarTone,
          created_at: new Date().toISOString(),
        },
        bounty.id,
      );

      setComments((current) => [localComment, ...current]);
      return localComment;
    }

    const params = new URLSearchParams({ resource: "comments", request_id: bounty.id });
    const response = await fetch(`/api/requests/public?${params.toString()}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: normalizedBody,
        sourceUrl: normalizedSourceUrl || null,
        visitorSeed: visitor.seed,
      }),
    });
    const payload = (await response.json()) as { comment?: PublicRequestCommentRow; error?: string };

    if (!response.ok || !payload.comment) {
      throw new Error(payload.error || "Could not post this comment.");
    }

    const savedComment = normalizeRequestComment(payload.comment, bounty.id);
    setComments((current) => [savedComment, ...current.filter((comment) => comment.id !== savedComment.id)]);
    return savedComment;
  };

  return { comments, loading, error, addComment };
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

async function getSupabaseAccessToken() {
  if (!supabase) {
    throw new Error("Sign in is not available right now.");
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw error ?? new Error("Sign in again to continue.");
  }

  return session.access_token;
}

async function createSourceFingerprint(...parts: string[]) {
  const normalized = parts.join("|").trim().toLowerCase().replace(/\s+/g, " ");

  if (!normalized) {
    return crypto.randomUUID();
  }

  if (!crypto.subtle) {
    return btoa(normalized).replace(/[^a-z0-9]/gi, "").slice(0, 80) || crypto.randomUUID();
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getDuplicateSourceIdentity(sourceType: FindSourceType, sourceLink: string, sourceNotes: string) {
  const rawSource = sourceType === "source-link" ? sourceLink : sourceLink || sourceNotes;
  const normalizedSource = normalizeSourceIdentity(rawSource);

  return normalizedSource || `${sourceType}:${sourceNotes.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 240)}`;
}

function normalizeSourceIdentity(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const url = new URL(trimmed);
    url.hash = "";

    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_|igshid$|ref$|ref_src$)/i.test(key)) {
        url.searchParams.delete(key);
      }
    }

    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().toLowerCase();
  } catch {
    return trimmed.toLowerCase().replace(/\s+/g, " ").slice(0, 500);
  }
}

function isDuplicateSourceSubmissionError(error: unknown) {
  const record = isRecord(error) ? error : {};
  const code = typeof record.code === "string" ? record.code : "";
  const message = typeof record.message === "string" ? record.message : "";
  const details = typeof record.details === "string" ? record.details : "";

  return code === "23505" || /source_submissions_request_fingerprint_key|duplicate key|unique/i.test(`${message} ${details}`);
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

async function uploadSourceProofFiles(userId: string, submissionId: string, files: File[]) {
  const proof: SourceProofFile[] = [];
  const uploadedPaths: string[] = [];

  if (!supabase || !files.length) {
    return { proof, uploadedPaths };
  }

  for (const [index, file] of files.entries()) {
    const filePath = `${userId}/${submissionId}/${index + 1}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from(sourceSubmissionProofBucket).upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type || undefined,
      upsert: false,
    });

    if (error) {
      throw error;
    }

    uploadedPaths.push(filePath);
    proof.push({
      name: file.name,
      path: filePath,
      type: file.type || null,
      size: file.size,
    });
  }

  return { proof, uploadedPaths };
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

const bountyListings: BountyListing[] = [
  {
    id: "childhood-rose-blanket",
    name: "Help me find this blanket",
    detail: "Free request",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Four people helping", "Latest source received today"],
  },
  {
    id: "seiko-wired-w543",
    name: "Does anyone know this watch?",
    detail: "Free request",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Two sources received", "Model number being checked"],
  },
  {
    id: "yellow-stay-home-pillow",
    name: "Help me find this pillow",
    detail: "Free request",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Three people searching", "One similar listing reviewed"],
  },
  {
    id: "living-and-co-cat-mug",
    name: "Find this cat mug",
    detail: "Free request",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "New request", "Helpers can share links"],
  },
  {
    id: "duck-wall-art",
    name: "Help me find this art",
    detail: "Free request",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Helper shared a source", "Source marked found"],
  },
  {
    id: "walkman-wmd6c",
    name: "Sony Walkman WM-D6C",
    detail: "Working recorder, serviced",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "New request", "Helpers can share sources"],
  },
  {
    id: "canon-eos-80d-kit",
    name: "Canon EOS 80D",
    detail: "Body with clean lens",
    reward: "Free",
    rewardValue: 0,
    closes: "8 days",
    category: "Camera gear",
    status: "Helper in touch",
    location: "United States",
    poster: "Maya V.",
    posted: "5 days ago",
    submissions: 8,
    image:
      "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a clean Canon EOS 80D body with a working lens and recent test photos.",
    mustHaves: ["EOS 80D body", "Lens glass is clean", "Shutter count disclosed", "Recent test photo required"],
    timeline: ["Free request posted", "Helper shared two local options", "Shutter count requested"],
  },
  {
    id: "omega-speedmaster-125",
    name: "Omega Speedmaster",
    detail: "125th anniversary",
    reward: "Free",
    rewardValue: 0,
    closes: "11 days",
    category: "Watches",
    status: "Price agreed",
    location: "United Kingdom",
    poster: "Jon P.",
    posted: "6 days ago",
    submissions: 6,
    image:
      "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for an Omega Speedmaster 125 with original bracelet and clear movement documentation.",
    mustHaves: ["Original bracelet", "Movement photos", "Service details", "No polished case preferred"],
    timeline: ["Free request posted", "Local source found in London", "Authenticity check underway"],
  },
  {
    id: "roland-juno-106",
    name: "Roland Juno-106",
    detail: "Voice board set",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Synth forums contacted", "Awaiting test clips"],
  },
  {
    id: "cartier-tank-must",
    name: "Cartier Tank Must",
    detail: "Large black dial",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Three dealers contacted", "Waiting on papers"],
  },
  {
    id: "contax-t2-silver",
    name: "Contax T2",
    detail: "Silver point-and-shoot",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Two sources rejected", "New photos requested"],
  },
  {
    id: "gameboy-micro-famicom",
    name: "Game Boy Micro",
    detail: "Famicom edition",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Japan sellers contacted", "First source under review"],
  },
  {
    id: "nakamichi-dragon-door",
    name: "Nakamichi Dragon",
    detail: "Cassette door assembly",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "New request", "Helpers can share parts"],
  },
  {
    id: "polaroid-sx70-brown",
    name: "Polaroid SX-70",
    detail: "Brown leather folder",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Two sources received", "Waiting on sample photo"],
  },
  {
    id: "ipod-classic-7th",
    name: "iPod Classic",
    detail: "160GB silver",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Five submissions", "Battery photos requested"],
  },
  {
    id: "canon-f1-new",
    name: "Canon New F-1",
    detail: "AE finder kit",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Collector groups contacted", "Awaiting meter video"],
  },
  {
    id: "minidisc-mz-rh1",
    name: "Sony MZ-RH1",
    detail: "Hi-MD recorder",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "First source received", "USB proof requested"],
  },
  {
    id: "dreamcast-seaman-mic",
    name: "Dreamcast Seaman",
    detail: "Mic bundle, complete",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Two local stores checked", "One complete copy under review"],
  },
  {
    id: "technics-sl1200-dustcover",
    name: "Technics SL-1200",
    detail: "Original dust cover",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "DJ repair shops contacted", "Waiting on photos"],
  },
  {
    id: "pentax-67-wood-grip",
    name: "Pentax 67",
    detail: "Wood grip",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Three sources received", "Best source missing screw"],
  },
  {
    id: "n64-funtastic-ice-blue",
    name: "Nintendo 64",
    detail: "Ice blue Funtastic",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Four sellers found", "Controller match pending"],
  },
  {
    id: "bose-aviation-a20",
    name: "Bose A20",
    detail: "Bluetooth aviation headset",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Pilot group posted", "Two sources being checked"],
  },
  {
    id: "hasselblad-a12-back",
    name: "Hasselblad A12",
    detail: "Chrome film back",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Five backs located", "Best one awaiting test roll"],
  },
  {
    id: "akg-k1000",
    name: "AKG K1000",
    detail: "Ear speaker set",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Audiophile forum posted", "One source needs channel test"],
  },
  {
    id: "neo-geo-pocket-color",
    name: "Neo Geo Pocket",
    detail: "Color anthracite",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "New request", "Helpers can share handhelds"],
  },
  {
    id: "aiwa-hs-px1000",
    name: "Aiwa HS-PX1000",
    detail: "Cassette player",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "One collector contacted", "Awaiting demo clip"],
  },
  {
    id: "voigtlander-40mm-nokton",
    name: "Voigtlander Nokton",
    detail: "40mm f/1.2 VM",
    reward: "Free",
    rewardValue: 0,
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
    timeline: ["Free request posted", "Two listings reviewed", "Best source awaiting glass photos"],
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

function getBountyPath(bountyId: string, bountyName = "") {
  const slug = slugify(bountyName);
  return `/requests/${encodeURIComponent(bountyId)}${slug ? `/${slug}` : ""}`;
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

function getBountyIdFromRawRoute(rawRoute: string) {
  const match = rawRoute.match(/^requests\/([^/?#]+)(?:\/[^?#]+)?$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getBountyIdFromCurrentRoute() {
  return getBountyIdFromRawRoute(getCurrentRawRoute());
}

function parseRoute(): Page {
  const raw = getCurrentRawRoute();
  if (getBountyIdFromRawRoute(raw)) {
    return "bounty-detail";
  }

  return routeMap[raw] ?? "not-found";
}

function parseCheckoutReturnStatus(): CheckoutReturnStatus {
  const searchStatus = new URLSearchParams(window.location.search).get("checkout");
  const hashQuery = window.location.hash.split("?")[1] ?? "";
  const hashStatus = new URLSearchParams(hashQuery).get("checkout");
  const status = searchStatus ?? hashStatus;
  return status === "success" || status === "cancelled" ? status : null;
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
      reward: prompt.reward,
      durationDays: prompt.durationDays,
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
    reward: Math.max(minimumReward, Math.round(Number.isFinite(draft.reward) ? draft.reward : initialPostDraft.reward)),
    durationDays: draft.durationDays,
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
    const reward = Math.max(minimumReward, Math.round(typeof parsed.reward === "number" && Number.isFinite(parsed.reward) ? parsed.reward : initialPostDraft.reward));
    const durationDays = isRequestDuration(parsed.durationDays) ? parsed.durationDays : initialPostDraft.durationDays;

    return storedDraftToPostDraft({
      itemName,
      category,
      details,
      reward,
      durationDays,
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
    accountType: "both",
    region: "",
    specialty: "",
    payoutEmail: email,
    payoutCountry: "US",
    identityStatus: "not_started",
    notificationEmail: email,
  };
}

function normalizeAccountProfile(profile: Partial<AccountProfile>): AccountProfile {
  const defaults = getDefaultAccountProfile();
  const identityStatus = ["not_started", "review_requested", "verified"].includes(profile.identityStatus ?? "")
    ? (profile.identityStatus as FinderIdentityStatus)
    : defaults.identityStatus;
  const accountType = ["both", "poster", "finder"].includes(profile.accountType ?? "") ? (profile.accountType as AuthAccountType) : defaults.accountType;

  return {
    displayName: typeof profile.displayName === "string" ? profile.displayName.slice(0, 80) : defaults.displayName,
    handle: typeof profile.handle === "string" ? profile.handle.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 32) : defaults.handle,
    accountType,
    region: typeof profile.region === "string" ? profile.region.slice(0, 80) : defaults.region,
    specialty: typeof profile.specialty === "string" ? profile.specialty.slice(0, 160) : defaults.specialty,
    payoutEmail: typeof profile.payoutEmail === "string" ? profile.payoutEmail.slice(0, 160) : defaults.payoutEmail,
    payoutCountry: typeof profile.payoutCountry === "string" ? profile.payoutCountry.toUpperCase().slice(0, 2) : defaults.payoutCountry,
    identityStatus,
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

function getFinderReadiness(profile: AccountProfile): { score: number; items: FinderReadinessItem[]; label: string } {
  const items: FinderReadinessItem[] = [
    {
      label: "Public profile",
      complete: Boolean(profile.displayName.trim() && profile.handle.trim() && profile.specialty.trim()),
      copy: "Name, handle, and focus are visible before requesters open your leads.",
    },
    {
      label: "Contact email",
      complete: emailPattern.test(profile.notificationEmail.trim() || profile.payoutEmail.trim()),
    copy: "A contact email is saved for lead follow-up.",
  },
    {
      label: "Region",
      complete: Boolean(profile.region.trim() && profile.payoutCountry.trim()),
      copy: "Region helps set shipping, pickup, and source availability expectations.",
    },
    {
      label: "Trust review",
      complete: profile.identityStatus !== "not_started",
      copy: "Trust status is checked before high-volume leads are enabled.",
    },
  ];
  const completeCount = items.filter((item) => item.complete).length;
  const score = Math.round((completeCount / items.length) * 100);
  const label = score === 100 ? "Ready" : score >= 75 ? "Nearly ready" : score >= 50 ? "Needs review" : "Incomplete";

  return { score, items, label };
}

function getInitialPostDraft() {
  const starter = getAcquisitionStarterFromUrl();

  if (starter) {
    writeStoredPostDraft(starter.draft);
    return starter.draft;
  }

  return readStoredPostDraft() ?? initialPostDraft;
}

function routeHref(page: Page, bountyId?: string, bountyName?: string) {
  if (page === "bounty-detail" && bountyId) {
    return getBountyPath(bountyId, bountyName);
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
    // Analytics must never block the marketplace flow.
  }
}

function getInitialRoute(): Page {
  return parseRoute();
}

function getSeoMeta(page: Page, activeBounty?: BountyListing): SeoMeta {
  if (page === "bounty-detail" && activeBounty) {
    const description = `${activeBounty.description} ${activeBounty.category} request, ${activeBounty.closes} left. Helpers can share links, clues, and source suggestions.`;

    return {
      title: `${activeBounty.name} Find Request | pleasefindmethis`,
      description: description.slice(0, 240),
      path: getBountyPath(activeBounty.id, activeBounty.name),
      robots: activeBounty.live ? "index,follow" : "noindex,follow",
      image: activeBounty.image.startsWith("data:image/") ? defaultSeoImage : toAbsoluteUrl(activeBounty.image),
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

function createItemListSchema(bounties: BountyListing[], pagePath: string): JsonLdNode {
  return {
    "@type": "ItemList",
    "@id": `${getCanonicalUrl(pagePath)}#request-list`,
    name: "Hard-to-find item requests",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: Math.min(bounties.length, 10),
    itemListElement: bounties.slice(0, 10).map((bounty, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: bounty.name,
        description: bounty.description,
        image: bounty.image.startsWith("data:image/") ? defaultSeoImage : toAbsoluteUrl(bounty.image),
        url: getCanonicalUrl(getBountyPath(bounty.id, bounty.name)),
        additionalType: bounty.category,
      },
    })),
  };
}

function createMarketplaceServiceSchema(organizationId: string): JsonLdNode {
  return {
    "@type": "Service",
    "@id": `${siteOrigin}/#service`,
    name: "Hard-to-find item request board",
    alternateName: siteName,
    serviceType: "Free public request-board web app",
    url: siteOrigin,
    provider: { "@id": organizationId },
    areaServed: "Worldwide",
    description: "Free request board for hard-to-find items with community source leads.",
    audience: [
      {
        "@type": "Audience",
        audienceType: "Requesters looking for discontinued, sold-out, rare, or sentimental items",
      },
      {
        "@type": "Audience",
        audienceType: "Helpers with niche sourcing knowledge, seller paths, or local availability context",
      },
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: 0,
      description: "Posting is free. Add clear details, publish, and share the public request.",
    },
    termsOfService: `${siteOrigin}/terms`,
  };
}

function createLandingHowToSchema(canonicalUrl: string): JsonLdNode {
  return {
    "@type": "HowTo",
    "@id": `${canonicalUrl}#post-find-request-howto`,
    name: "How to post a free find request",
    description: "Step-by-step: create a free request and get source leads.",
    step: workSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.copy,
    })),
  };
}

function createBreadcrumbSchema(page: Page, meta: SeoMeta, activeBounty?: BountyListing): JsonLdNode {
  const currentName = page === "bounty-detail" && activeBounty ? activeBounty.name : pageLabels[page] ?? meta.title;

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

function createStructuredData(page: Page, meta: SeoMeta, bounties: BountyListing[], activeBounty?: BountyListing) {
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

  if (page === "bounty-detail" && activeBounty) {
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
    createMarketplaceServiceSchema(organizationId),
    webPage,
  ];

  if (page === "landing" || page === "browse" || page === "browse-all") {
    graph.push(createItemListSchema(bounties, meta.path));
  }

  if (page !== "landing") {
    graph.push(createBreadcrumbSchema(page, meta, activeBounty));
  }

  if (page === "landing") {
    graph.push(createLandingHowToSchema(canonicalUrl));
  }

  if (page === "bounty-detail" && activeBounty) {
    graph.push({
      "@type": "Thing",
      "@id": `${canonicalUrl}#request`,
      url: canonicalUrl,
      name: activeBounty.name,
      description: activeBounty.description,
      image: activeBounty.image.startsWith("data:image/") ? defaultSeoImage : toAbsoluteUrl(activeBounty.image),
      additionalType: activeBounty.category,
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

function updateDocumentSeo(page: Page, bounties: BountyListing[], activeBounty?: BountyListing) {
  const meta = getSeoMeta(page, activeBounty);
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
  setMetaTag("property", "og:image:width", "1200");
  setMetaTag("property", "og:image:height", "675");
  setMetaTag("property", "og:image:alt", "A public request asking for help finding a vintage T-shirt from photos and source clues.");
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", meta.title);
  setMetaTag("name", "twitter:description", socialDescription);
  setMetaTag("name", "twitter:image", meta.image);
  setMetaTag("name", "twitter:image:alt", "A public request asking for help finding a vintage T-shirt from photos and source clues.");
  setCanonicalLink(canonicalUrl);
  setStructuredData(createStructuredData(page, meta, bounties, activeBounty));
}

function getCategoryLabel(category: RequestCategory) {
  return requestCategories.find((item) => item.value === category)?.label ?? "General";
}

function readStoredCheckoutSnapshot(): CheckoutSnapshot | null {
  const raw = window.sessionStorage.getItem(checkoutSnapshotStorageKey);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CheckoutSnapshot>;

    if (
      typeof parsed.itemName === "string" &&
      (typeof parsed.provider === "string" || parsed.provider === undefined) &&
      typeof parsed.reward === "number" &&
      typeof parsed.platformFee === "number" &&
      typeof parsed.protection === "number" &&
      typeof parsed.platformShare === "number" &&
      typeof parsed.total === "number" &&
      typeof parsed.email === "string"
    ) {
      return {
        ...(typeof parsed.requestId === "string" ? { requestId: parsed.requestId } : {}),
        itemName: parsed.itemName,
        provider: parsed.provider ?? "hosted checkout",
        ...(typeof parsed.category === "string" ? { category: parsed.category } : {}),
        reward: parsed.reward,
        platformFee: parsed.platformFee,
        protection: parsed.protection,
        platformShare: parsed.platformShare,
        total: parsed.total,
        email: parsed.email,
        ...(typeof parsed.durationDays === "number" && Number.isFinite(parsed.durationDays) ? { durationDays: parsed.durationDays } : {}),
        ...(typeof parsed.createdAt === "string" ? { createdAt: parsed.createdAt } : {}),
      };
    }
  } catch {
    // Ignore corrupted session data and fall back to a clean state.
  }

  return null;
}

function formatConfirmationCode(requestId?: string) {
  if (!requestId) {
    return "PFM-CONFIRMED";
  }

  return `PFM-${requestId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function formatConfirmationDate(value?: string) {
  if (!value) {
    return "Today";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Today";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getCheckoutErrorMessage(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "Checkout took too long to start. Check your connection and try again.";
  }

  if (error instanceof Error) {
    const message = error.message || "Could not start secure checkout.";

    if (message.toLowerCase().includes("auth session missing")) {
      return "Sign in again, then return to checkout.";
    }

    return message;
  }

  return "Could not start secure checkout. Try again in a moment.";
}

function App() {
  const [route, setRoute] = useState<Page>(() => getInitialRoute());
  const [checkoutReturnStatus, setCheckoutReturnStatus] = useState<CheckoutReturnStatus>(() => parseCheckoutReturnStatus());
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(() => window.sessionStorage.getItem(signedInStorageKey) === "true");
  const [pendingRoute, setPendingRoute] = useState<Page>(() => readStoredPendingRoute());
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authBusyAction, setAuthBusyAction] = useState<AuthBusyAction>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [emailOtpSentTo, setEmailOtpSentTo] = useState("");
  const [postDraft, setPostDraft] = useState<PostDraft>(() => getInitialPostDraft());
  const [postReferenceImageDrafts, setPostReferenceImageDrafts] = useState<PostReferenceImageDraft[]>(() => readStoredPostReferenceImageDrafts());
  const [postReferenceImagePersistenceError, setPostReferenceImagePersistenceError] = useState("");
  const [publishedRequest, setPublishedRequest] = useState<PublishedRequestSnapshot | null>(() => readStoredPublishedRequest());
  const [activeBountyId, setActiveBountyId] = useState(() => getBountyIdFromCurrentRoute() || bountyListings[0].id);
  const visibleRoute = !signedIn && protectedPages.has(route) ? "auth" : route;
  const currencyPreference = useViewerCurrencyPreference(routeUsesCurrency(visibleRoute));
  const {
    listings: liveBounties,
    loading: publicRequestsLoading,
    error: publicRequestsError,
    requestNotFound: publicRequestNotFound,
    resolvedRequestId: resolvedPublicRequestId,
  } = usePublicRequestListings(routeUsesPublicRequestFeed(visibleRoute), visibleRoute === "bounty-detail" ? activeBountyId : "");
  const marketplaceBounties = useMemo(() => mergeBounties(liveBounties, bountyListings), [liveBounties]);
  const marketplaceIsExamples = liveBounties.length === 0;
  const acquisitionStarter = getAcquisitionStarterFromUrl();

  useEffect(() => {
    initializeGoogleAnalytics();
  }, []);

  useEffect(() => {
    const didPersist = writeStoredPostReferenceImageDrafts(postReferenceImageDrafts);
    setPostReferenceImagePersistenceError(
      didPersist || !postReferenceImageDrafts.length
        ? ""
        : "These photos could not be saved for the sign-in handoff. Remove some photos or choose smaller files before continuing.",
    );
  }, [postReferenceImageDrafts]);

  useEffect(() => {
    const syncRoute = () => {
      const routeBountyId = getBountyIdFromCurrentRoute();
      if (routeBountyId) {
        setActiveBountyId(routeBountyId);
      }
      setRoute(parseRoute());
      setCheckoutReturnStatus(parseCheckoutReturnStatus());
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  const requestedDetailBounty = useMemo(() => {
    if (visibleRoute !== "bounty-detail") {
      return null;
    }

    if (isUuid(activeBountyId)) {
      return liveBounties.find((bounty) => bounty.id === activeBountyId) ?? null;
    }

    return bountyListings.find((bounty) => bounty.id === activeBountyId) ?? null;
  }, [activeBountyId, liveBounties, visibleRoute]);
  const activeBounty = useMemo(
    () => requestedDetailBounty ?? marketplaceBounties.find((bounty) => bounty.id === activeBountyId) ?? marketplaceBounties[0] ?? bountyListings[0],
    [activeBountyId, marketplaceBounties, requestedDetailBounty],
  );
  const exactRequestLoading =
    visibleRoute === "bounty-detail" &&
    isUuid(activeBountyId) &&
    (publicRequestsLoading || resolvedPublicRequestId !== activeBountyId);
  const exactRequestUnavailable =
    visibleRoute === "bounty-detail" &&
    isUuid(activeBountyId) &&
    !exactRequestLoading &&
    resolvedPublicRequestId === activeBountyId &&
    Boolean(publicRequestsError);
  const requestedBountyMissing =
    visibleRoute === "bounty-detail" &&
    ((isUuid(activeBountyId) && !exactRequestLoading && !publicRequestsError && publicRequestNotFound) ||
      (!isUuid(activeBountyId) && !requestedDetailBounty));

  useEffect(() => {
    updateDocumentSeo(visibleRoute, marketplaceBounties, visibleRoute === "bounty-detail" ? requestedDetailBounty ?? undefined : activeBounty);
  }, [activeBounty, marketplaceBounties, requestedDetailBounty, visibleRoute]);

  useEffect(() => {
    trackPageView({
      route: visibleRoute,
      bounty_id: visibleRoute === "bounty-detail" ? activeBountyId : undefined,
      category: visibleRoute === "bounty-detail" ? requestedDetailBounty?.category : undefined,
      signed_in: signedIn,
    });

    if (visibleRoute === "landing") {
      trackAcquisitionEvent("landing_view", {
        signed_in: signedIn,
      });
    }
  }, [activeBountyId, requestedDetailBounty?.category, signedIn, visibleRoute]);

  useEffect(() => {
    if (visibleRoute !== "bounty-detail") {
      return;
    }

    const params = getCurrentSearchParams();
    if (params.get("utm_source") !== "product_share") {
      return;
    }

    const eventKey = `pleasefindmethis-shared-landing-${activeBountyId}`;
    if (window.sessionStorage.getItem(eventKey)) {
      return;
    }

    window.sessionStorage.setItem(eventKey, "true");
    trackAcquisitionEvent("shared_request_landed", {
      bounty_id: activeBountyId,
      category: requestedDetailBounty?.category,
      share_channel: params.get("share_channel") ?? undefined,
    });
  }, [activeBountyId, requestedDetailBounty?.category, visibleRoute]);

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

  const navigate = (page: Page, routeBountyId = activeBountyId, routeBountyName = "") => {
    const targetPath = routeHref(page, routeBountyId, routeBountyName);

    setMenuOpen(false);
    if (window.location.pathname === targetPath && !window.location.search && !window.location.hash) {
      setRoute(page);
      setCheckoutReturnStatus(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.history.pushState(null, "", targetPath);
    setRoute(page);
    setCheckoutReturnStatus(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const goToDetail = (bountyId: string) => {
    const targetBounty = marketplaceBounties.find((bounty) => bounty.id === bountyId);
    setActiveBountyId(bountyId);
    navigate("bounty-detail", bountyId, targetBounty?.name ?? "");
  };

  const markSignedIn = (provider = "email", email?: string) => {
    window.sessionStorage.setItem(signedInStorageKey, "true");
    window.sessionStorage.setItem(authProviderStorageKey, provider);
    if (email) {
      window.sessionStorage.setItem(authEmailStorageKey, email);
    }
    window.sessionStorage.removeItem(pendingRouteStorageKey);
    setEmailOtpSentTo("");
    setAuthMessage("");
    setSignedIn(true);
    trackAcquisitionEvent("auth_completed", {
      provider,
      pending_route: pendingRoute,
    });
    navigate(pendingRoute);
  };

  const changeAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setEmailOtpSentTo("");
    setAuthMessage("");
  };

  const requestEmailAuthCode = async (email: string, accountType: AuthAccountType) => {
    const normalizedEmail = email.trim().toLowerCase();

    setAuthMessage("");

    if (!emailPattern.test(normalizedEmail)) {
      setAuthMessage("Enter a valid email address so we can send your sign-in code.");
      return;
    }

    trackAcquisitionEvent(authMode === "signup" ? "signup_code_requested" : "login_code_requested", {
      account_type: accountType,
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
            ...(authMode === "signup" ? { data: { account_type: accountType } } : {}),
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
    setPendingRoute("post-describe");
    setAuthMode("login");

    if (shouldReturnHome) {
      window.history.replaceState(null, "", routeHref("landing"));
      setRoute("landing");
      setCheckoutReturnStatus(null);
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
          reward: selectedPrompt.reward,
          durationDays: selectedPrompt.durationDays,
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
        referral_request_id: activeBountyId,
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
      navigate("post-pay");
      return;
    }

    requireAuth("post-pay");
  };

  const continueFromReward = () => {
    trackAcquisitionEvent("choose_request_window", {
      category: getCategoryLabel(postDraft.category),
      duration_days: postDraft.durationDays,
    });
    navigate("post-pay");
  };

  useEffect(() => {
    if (!signedIn && protectedPages.has(route)) {
      setPendingRoute(route);
      setAuthMode("signup");
      window.sessionStorage.setItem(pendingRouteStorageKey, route);
      if (window.location.pathname !== routeHref("auth")) {
        window.history.replaceState(null, "", routeHref("auth"));
      }
      setRoute("auth");
      setCheckoutReturnStatus(null);
    }
  }, [route, signedIn]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;
    const finishSupabaseSession = (session: Session) => {
      const storedRoute = readStoredPendingRoute();
      const hadPendingAuthRoute = Boolean(window.sessionStorage.getItem(pendingRouteStorageKey));
      const provider = session.user.app_metadata?.provider;

      window.sessionStorage.setItem(signedInStorageKey, "true");
      window.sessionStorage.setItem(authProviderStorageKey, typeof provider === "string" ? provider : "email");
      if (session.user.email) {
        window.sessionStorage.setItem(authEmailStorageKey, session.user.email);
      }
      window.sessionStorage.removeItem(pendingRouteStorageKey);
      setEmailOtpSentTo("");
      setAuthMessage("");
      setSignedIn(true);
      setPendingRoute(storedRoute);
      if (hadPendingAuthRoute) {
        trackAcquisitionEvent("auth_completed", {
          provider: typeof provider === "string" ? provider : "email",
          pending_route: storedRoute,
        });
        navigate(storedRoute);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || !data.session) {
        return;
      }
      finishSupabaseSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || !session) {
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
    <CurrencyContext.Provider value={currencyPreference}>
      {visibleRoute === "landing" ? (
        <LandingPage
          menuOpen={menuOpen}
          bounties={marketplaceBounties}
          onBrowse={() => navigate("browse")}
          onBrowseAll={() => navigate("browse-all")}
          onDetail={goToDetail}
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
          showingExamples={marketplaceIsExamples}
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
              onPublicBrowse={() => navigate("browse")}
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
          {visibleRoute === "post-reward" ? (
            <PostRewardPage draft={postDraft} onBack={() => navigate("post-describe")} onDraftChange={updatePostDraft} onNext={continueFromReward} />
          ) : null}
          {visibleRoute === "post-pay" ? (
            <PostPayPage
              checkoutReturnStatus={checkoutReturnStatus}
              draft={postDraft}
              referenceImageFiles={postReferenceImageDrafts}
              onBack={() => navigate("post-describe")}
              onPublished={(snapshot) => {
                setPublishedRequest(snapshot);
                writeStoredPublishedRequest(snapshot);
                setActiveBountyId(snapshot.requestId);
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
              bounties={marketplaceBounties}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onBrowseAll={() => navigate("browse-all")}
              onDetail={goToDetail}
              onPost={() => startPostRequest("browse_featured")}
              showingExamples={marketplaceIsExamples}
            />
          ) : null}
          {visibleRoute === "browse-all" ? (
            <BrowseAllPage
              bounties={marketplaceBounties}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onDetail={goToDetail}
              onPost={() => startPostRequest("browse_all")}
              showingExamples={marketplaceIsExamples}
            />
          ) : null}
          {visibleRoute === "bounty-detail" ? (
            exactRequestLoading ? (
              <RequestDetailStatusPage status="loading" onBrowse={() => navigate("browse")} />
            ) : exactRequestUnavailable ? (
              <RequestDetailStatusPage status="unavailable" onBrowse={() => navigate("browse")} />
            ) : requestedBountyMissing ? (
              <NotFoundPage onBrowse={() => navigate("browse")} onHome={() => navigate("landing")} />
            ) : (
              <BountyDetailPage
                bounty={activeBounty}
                onBrowse={() => navigate("browse")}
                onStartSearch={() => startPostRequest("shared_request_cta")}
                onSubmit={() => requireAuth("submit-find")}
              />
            )
          ) : null}
          {visibleRoute === "submit-find" ? (
            <SubmitFindPage bounty={activeBounty} onBack={() => navigate("bounty-detail")} onDashboard={() => navigate("finder-dashboard")} />
          ) : null}
          {visibleRoute === "poster-dashboard" ? (
            <PosterDashboardPage
              checkoutReturnStatus={checkoutReturnStatus}
              onDispute={() => navigate("dispute")}
              onOpenRequest={goToDetail}
              onProfile={() => navigate("profile")}
              onShareRequest={(request) => {
                const snapshot = requestRowToPublishedSnapshot(request);
                setPublishedRequest(snapshot);
                writeStoredPublishedRequest(snapshot);
                setActiveBountyId(snapshot.requestId);
                navigate("share-request");
              }}
            />
          ) : null}
          {visibleRoute === "finder-dashboard" ? (
            <FinderDashboardPage
              bounties={marketplaceBounties}
              onBrowse={() => navigate("browse")}
              onMessages={() => navigate("messages")}
              onSettings={() => navigate("account-settings")}
              onSubmit={(bountyId?: string) => {
                if (bountyId) {
                  setActiveBountyId(bountyId);
                }
                navigate("submit-find");
              }}
              onProfile={() => navigate("profile")}
            />
          ) : null}
          {visibleRoute === "messages" ? <MessageCenterPage onDashboard={() => navigate("finder-dashboard")} /> : null}
          {visibleRoute === "dispute" ? <DisputePage onBack={() => navigate("poster-dashboard")} /> : null}
          {visibleRoute === "profile" ? <TrustProfilePage onBrowse={() => navigate("browse")} onFinder={() => requireAuth("finder-dashboard")} onSettings={() => requireAuth("account-settings", "login")} /> : null}
          {visibleRoute === "privacy" ? <PrivacyPage /> : null}
          {visibleRoute === "terms" ? <TermsPage /> : null}
          {visibleRoute === "refunds" ? <RefundPolicyPage /> : null}
          {visibleRoute === "account-settings" ? <AccountSettingsPage /> : null}
          {visibleRoute === "admin-review" ? <AdminReviewPage /> : null}
          {visibleRoute === "not-found" ? <NotFoundPage onBrowse={() => navigate("browse")} onHome={() => navigate("landing")} /> : null}
        </PageChrome>
      )}
    </CurrencyContext.Provider>
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
      ["Messages", "messages", true],
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
      <SiteFooter navigate={navigate} requireAuth={requireAuth} />
    </div>
  );
}

function SiteFooter({
  navigate,
  requireAuth,
}: {
  navigate: (page: Page) => void;
  requireAuth?: (page: Page, mode?: AuthMode) => void;
}) {
  const publicLinks: Array<[string, Page]> = [
    ["Terms", "terms"],
    ["Privacy", "privacy"],
    ["Refunds", "refunds"],
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
      </nav>
    </footer>
  );
}

function LandingPage({
  acquisitionStarterPrompt,
  bounties,
  menuOpen,
  onAccount,
  onBrowse,
  onBrowseAll,
  onDetail,
  onLogin,
  onLogOut,
  onNavigate,
  onPost,
  setMenuOpen,
  showingExamples,
  signedIn,
}: {
  acquisitionStarterPrompt: PostStarterPrompt | null;
  bounties: BountyListing[];
  menuOpen: boolean;
  onAccount: () => void;
  onBrowse: () => void;
  onBrowseAll: () => void;
  onDetail: (bountyId: string) => void;
  onLogin: () => void;
  onLogOut: () => void;
  onNavigate: (page: Page) => void;
  onPost: (location: string) => void;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showingExamples: boolean;
  signedIn: boolean;
}) {
  const featuredRequests = (bounties.length ? bounties : bountyListings).slice(0, 4);
  const heroRequest = featuredRequests[0] ?? bountyListings[0];

  return (
    <main id="top" className="landing-page viral-landing">
      <header className="viral-header">
        <div className="viral-header-inner">
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
              Open requests
            </a>
            <a href="#how-it-works">How it works</a>
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
            <button className="viral-header-cta" type="button" onClick={() => onPost("header_primary")}>Post a request</button>
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
                Open requests
              </a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
              <button type="button" onClick={() => onPost("mobile_menu")}>Post a request</button>
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
      </header>

      <section className="viral-hero">
        <div className="viral-hero-copy">
          <h1>Someone out there knows where it is.</h1>
          <p>Post a photo of the exact thing you’re looking for. Share the request. Anyone can leave a clue—no signup needed.</p>
          <div className="viral-hero-actions">
            <button type="button" onClick={() => onPost("hero_primary")}>Start a free search</button>
            <button type="button" onClick={onBrowse}>Help find something</button>
          </div>
          <ul className="viral-trust-line">
            <li><LockKeyhole size={17} /> Free to post</li>
            <li><Users size={17} /> Public by default</li>
            <li><ShieldCheck size={17} /> You verify every lead</li>
          </ul>
          {acquisitionStarterPrompt ? (
            <div className="starter-link-panel">
              <span><strong>{acquisitionStarterPrompt.label}</strong>{acquisitionStarterPrompt.title}</span>
              <button className="starter-link-button" type="button" onClick={() => onPost("starter_link")}>Start this request <ArrowRight size={16} /></button>
            </div>
          ) : null}
        </div>

        <article className="viral-request-preview">
          <header>
            <h2>{heroRequest.name}</h2>
            <span className="hunt-corner-tab" aria-hidden="true" />
          </header>
          <div className="viral-request-preview-body">
            <img src={heroRequest.image} alt={`${heroRequest.name} reference`} />
            <div>
              <h3>{heroRequest.description}</h3>
              <span>Must match:</span>
              <ul>{heroRequest.mustHaves.slice(0, 4).map((item) => <li key={item}><CheckCircle2 size={15} /> {item}</li>)}</ul>
              <div className="viral-clue-preview">
                <MessageSquare size={18} />
                <span><strong>Public clue page</strong>Anyone can leave a clue or source link without signing up.</span>
              </div>
            </div>
          </div>
          <footer>
            <strong>{showingExamples ? "Example request" : `${heroRequest.submissions} clue${heroRequest.submissions === 1 ? "" : "s"}`}</strong>
            <button type="button" onClick={() => onDetail(heroRequest.id)}>View request <ArrowRight size={16} /></button>
          </footer>
          <span className="viral-thread-line" aria-hidden="true" />
        </article>
      </section>

      <section className="viral-open-section" aria-labelledby="open-searches-title">
        <div className="viral-section-head">
          <h2 id="open-searches-title">{showingExamples ? "See what a strong search looks like." : "Open searches need another pair of eyes."}</h2>
          <a href={routeHref("browse-all")} onClick={(event) => handleRoutedAnchorClick(event, onBrowseAll)}>View all open requests <ArrowRight size={17} /></a>
        </div>
        <div className="viral-request-rail">
          {featuredRequests.map((bounty, index) => (
            <article className={`viral-request-card viral-request-card-${(index % 4) + 1}`} key={bounty.id}>
              <span className="hunt-corner-tab" aria-hidden="true" />
              <h3>{bounty.name}</h3>
              <img src={bounty.image} alt={`${bounty.name} reference`} loading="lazy" decoding="async" />
              <div><strong>{showingExamples ? "Example search" : `${bounty.submissions} clues`}</strong><span>{bounty.category}</span></div>
              <button type="button" onClick={() => onDetail(bounty.id)}>I know something</button>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="viral-how-section" aria-labelledby="how-title">
        <h2 id="how-title">Turn one photo into a search party.</h2>
        <div className="viral-steps">
          <article><span>01</span><i><Camera size={30} /></i><h3>Post the exact item</h3><p>Add a photo and the details that must match.</p></article>
          <article><span>02</span><i><Users size={30} /></i><h3>Share the search</h3><p>Send one link to friends, groups, or communities.</p></article>
          <article><span>03</span><i><MessageSquare size={30} /></i><h3>Collect useful clues</h3><p>Anyone can reply. You decide which lead is right.</p></article>
          <span className="viral-step-thread" aria-hidden="true" />
        </div>
      </section>

      <section className="viral-final-cta">
        <div><h2>Still looking?<br />Put more eyes on it.</h2><p>Your first search is free.</p></div>
        <div><button type="button" onClick={() => onPost("landing_final")}>Start a free search</button><button type="button" onClick={onBrowse}>Browse open requests <ArrowRight size={17} /></button></div>
      </section>

      <footer className="viral-footer">
        <a className="brand brand-button" href={routeHref("landing")} onClick={(event) => handleRoutedAnchorClick(event, () => window.scrollTo({ top: 0, behavior: "smooth" }))}>
          <span className="brand-mark" aria-hidden="true"><img className="brand-mark-image" src="/magnifying-glass.png" alt="" /></span>{siteName}
        </a>
        <nav aria-label="Footer navigation">
          <a href="#how-it-works">How it works</a>
          <a href={routeHref("terms")} onClick={(event) => handleRoutedAnchorClick(event, () => onNavigate("terms"))}>Safety</a>
          <a href={routeHref("terms")} onClick={(event) => handleRoutedAnchorClick(event, () => onNavigate("terms"))}>Terms</a>
          <a href={routeHref("privacy")} onClick={(event) => handleRoutedAnchorClick(event, () => onNavigate("privacy"))}>Privacy</a>
        </nav>
      </footer>
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
  onPublicBrowse,
}: {
  authBusyAction: AuthBusyAction;
  authMessage: string;
  emailOtpSentTo: string;
  mode: AuthMode;
  onEmailAuthCodeRequest: (email: string, accountType: AuthAccountType) => void;
  onEmailAuthCodeVerify: (code: string) => void;
  onEmailAuthReset: () => void;
  onGoogleAuth: () => void;
  onModeChange: (mode: AuthMode) => void;
  onPublicBrowse: () => void;
}) {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const accountType: AuthAccountType = "both";
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

    onEmailAuthCodeRequest(email, accountType);
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
              <button className="auth-inline-button" type="button" disabled={authBusy} onClick={() => onEmailAuthCodeRequest(emailOtpSentTo, accountType)}>
                Resend code
              </button>
              <button className="auth-inline-button" type="button" disabled={authBusy} onClick={onEmailAuthReset}>
                Change email
              </button>
            </div>
          ) : null}
          <a className="section-link section-button center-link" href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onPublicBrowse)}>
            Browse public requests instead <ArrowRight size={17} />
          </a>
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
  const briefFields = useMemo(() => getRequestBriefFields(draft.details), [draft.details]);
  const previewMustHaves = getMustHaves(draft.details).slice(0, 3);
  const canContinue = !photosPreparing && !referenceImagePersistenceError && draft.itemName.trim().length >= 3 && briefFields.mustMatch.trim().length >= 3;

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

  const updateBriefField = (key: RequestBriefFieldKey, value: string) => {
    onDraftChange({
      details: formatRequestBriefDetails({
        ...briefFields,
        [key]: value,
      }),
    });
  };

  const saveDraft = () => {
    writeStoredPostDraft(draft);
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 1800);
  };

  return (
    <main className="route-page hunt-composer-page" aria-labelledby="describe-title">
      <header className="hunt-composer-intro">
        <h1 id="describe-title">Show us the thing you can’t find.</h1>
        <p>A clear photo and three good clues give the internet something useful to work with.</p>
      </header>

      <form className="hunt-composer-layout" onSubmit={continueWithDetails}>
        <section className="hunt-photo-column" aria-labelledby="photo-upload-title">
          <h2 id="photo-upload-title" className="sr-only">Request photos</h2>
          <div className="hunt-upload-shell">
            <label className="hunt-photo-dropzone">
              <input className="sr-only-file-input" type="file" accept="image/*" multiple onChange={handleReferenceImageSelection} />
              <span className="hunt-upload-icon" aria-hidden="true">
                <Upload size={28} />
              </span>
              <strong>{photosPreparing ? "Preparing photos…" : "Drop photos here or choose files"}</strong>
              <small>Up to 4 photos · compressed for the sign-in handoff</small>
            </label>
            {referenceImageFiles.length ? (
              <div className="hunt-thumbnail-rail" aria-label="Selected photos">
                {referenceImageFiles.map((imageDraft, index) => (
                  <figure key={`${imageDraft.name}-${imageDraft.file.lastModified}-${index}`} className="hunt-thumbnail">
                    <img src={imageDraft.dataUrl} alt={`Request photo ${index + 1}`} />
                    <button type="button" onClick={() => removeReferenceImage(index)} aria-label={`Remove photo ${index + 1}`}>
                      <X size={14} />
                    </button>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>
          {photoPreparationError || referenceImagePersistenceError ? (
            <p className="hunt-photo-error" role="alert">{photoPreparationError || referenceImagePersistenceError}</p>
          ) : referenceImageFiles.length ? (
            <p className="hunt-photo-saved" role="status"><CheckCircle2 size={15} /> Photos are ready for the sign-in handoff.</p>
          ) : null}

          <div className="hunt-preview-head">
            <div>
              <strong>Preview</strong>
              <span>This is how your request will look to others.</span>
            </div>
            <span>Public hunt card</span>
          </div>
          <article className="hunt-card-preview">
            {referenceImageFiles[0] ? (
              <img src={referenceImageFiles[0].dataUrl} alt="Request preview" />
            ) : (
              <span className="hunt-card-placeholder" aria-hidden="true">
                <Camera size={28} />
              </span>
            )}
            <div>
              <strong>{draft.itemName.trim() || "Your exact item"}</strong>
              <p>{previewMustHaves.join(" · ")}</p>
            </div>
            <span className="hunt-corner-tab" aria-hidden="true" />
          </article>
        </section>

        <section className="hunt-fields-column" aria-label="Request details">
          <label className="hunt-field">
            <span>What are you looking for?</span>
            <input
              value={draft.itemName}
              maxLength={120}
              placeholder="Pink rose childhood blanket"
              onChange={(event) => onDraftChange({ itemName: event.target.value })}
            />
            <small>Be specific so others instantly know what to look for.</small>
          </label>

          <label className="hunt-field">
            <span>Category</span>
            <select value={draft.category} onChange={(event) => onDraftChange({ category: event.target.value as RequestCategory })}>
              {requestCategories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
            <small>Pick the closest match to reach people with the right context.</small>
          </label>

          <label className="hunt-field">
            <span>What must match?</span>
            <textarea
              value={briefFields.mustMatch}
              rows={3}
              placeholder="Pattern, brand, size, label, model number…"
              onChange={(event) => updateBriefField("mustMatch", event.target.value)}
            />
            <small>List the non-negotiable details.</small>
          </label>

          <label className="hunt-field">
            <span>Where have you already looked?</span>
            <textarea
              value={briefFields.alreadyTried}
              rows={3}
              placeholder="Google Lens, eBay, local shops…"
              onChange={(event) => updateBriefField("alreadyTried", event.target.value)}
            />
            <small>Share what you’ve tried so helpers can go further.</small>
          </label>

          <label className="hunt-field">
            <span>Budget, region, or condition limits</span>
            <textarea
              value={briefFields.buyingLimits}
              rows={3}
              placeholder="Ships to India, under $150, used is fine…"
              onChange={(event) => updateBriefField("buyingLimits", event.target.value)}
            />
            <small>Add any limits to focus the search.</small>
          </label>

          <div className="hunt-publish-row">
            <p><LockKeyhole size={15} /> Your draft stays private until you publish.</p>
            <button className="primary-button" type="submit" disabled={!canContinue}>
              Continue to publish <ArrowRight size={17} />
            </button>
            <div>
              <button className="hunt-save-button" type="button" onClick={saveDraft}>{draftSaved ? "Draft saved" : "Save and come back later"}</button>
              <span>Next: sign in and publish free</span>
            </div>
          </div>
        </section>
      </form>

      <section className="hunt-quality-row" aria-label="Strong request checklist">
        <div><Camera size={20} /><span><strong>Photo is recognizable</strong><small>Clear photos help others spot the exact match.</small></span></div>
        <div><FileText size={20} /><span><strong>Must-match details are specific</strong><small>Name the pattern, model, size, or label.</small></span></div>
        <div><MapPin size={20} /><span><strong>Buying limits are clear</strong><small>Share your region, budget, or condition limits.</small></span></div>
      </section>
    </main>
  );
}

function PostRewardPage({
  draft,
  onBack,
  onDraftChange,
  onNext,
}: {
  draft: PostDraft;
  onBack: () => void;
  onDraftChange: (updates: Partial<PostDraft>) => void;
  onNext: () => void;
}) {
  return (
    <main className="route-page post-wizard-page" aria-labelledby="duration-title">
      <section className="two-column-page">
        <div className="form-panel reward-form-panel post-flow-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Describe
          </button>
          <div className="post-flow-intro">
            <h1 id="duration-title">Pick how long it stays open.</h1>
            <p>Your request stays public and searchable.</p>
          </div>
          <div className="post-question-card">
            <span className="post-question-label">
              <CalendarDays size={15} /> Request days
            </span>
            <h2>How long should the request stay open?</h2>
            <div className="radio-grid" role="group" aria-label="Request duration">
              <label className={draft.durationDays === 7 ? "duration-card selected-duration" : "duration-card"}>
                <input type="radio" name="duration" checked={draft.durationDays === 7} onChange={() => onDraftChange({ durationDays: 7 })} />
                <span className="duration-text">7 days</span>
              </label>
              <label className={draft.durationDays === 30 ? "duration-card selected-duration" : "duration-card"}>
                <input type="radio" name="duration" checked={draft.durationDays === 30} onChange={() => onDraftChange({ durationDays: 30 })} />
                <span className="duration-text">30 days</span>
              </label>
              <label className={draft.durationDays === 14 ? "duration-card selected-duration" : "duration-card"}>
                <input type="radio" name="duration" checked={draft.durationDays === 14} onChange={() => onDraftChange({ durationDays: 14 })} />
                <span className="duration-text">14 days</span>
              </label>
              <label className={draft.durationDays === 60 ? "duration-card selected-duration" : "duration-card"}>
                <input type="radio" name="duration" checked={draft.durationDays === 60} onChange={() => onDraftChange({ durationDays: 60 })} />
                <span className="duration-text">60 days</span>
              </label>
            </div>
          </div>
          <button className="primary-button" type="button" onClick={onNext}>
            Next: Publish request <ArrowRight size={18} />
          </button>
        </div>
      </section>
    </main>
  );
}

function PostPayPage({
  checkoutReturnStatus,
  draft,
  onBack,
  onPublished,
  referenceImageFiles,
}: {
  checkoutReturnStatus: CheckoutReturnStatus;
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
        currency: "USD",
        reward: 0,
        service_fee: 0,
        protection_reserve: 0,
        total_due: 0,
        finder_payout: 0,
        duration_days: draft.durationDays,
        status: "open",
        payment_status: "free",
        payout_status: "not_ready",
        platform_fee_status: "unearned",
        customer_email: user.email ?? null,
        customer_name: null,
        reference_images: uploadResult.referenceImages,
      });

      if (insertError) {
        if (uploadedPaths.length) {
          await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
        }
        throw insertError;
      }

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
    <main className="route-page post-wizard-page" aria-labelledby="pay-title">
      <section className="two-column-page pay-layout">
        <div className="form-panel payment-form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Details
          </button>
          <h1 id="pay-title">Publish the request.</h1>
          <p>
            No checkout needed. Your request is live and ready for source links.
          </p>
          <div className="payment-assurance-grid" aria-label="Publishing details">
            <span>
              <CheckCircle2 size={17} /> Free to post
            </span>
            <span>
              <Search size={17} /> Public request page
            </span>
            <span>
              <ShieldCheck size={17} /> Ready for source leads
            </span>
          </div>
          <div className="checkout-note">
            <ExternalLink size={19} aria-hidden="true" />
            <span>
              <strong>Free request board</strong>
              Your request page is live and open for source leads.
            </span>
          </div>
          <button className="primary-button" type="button" disabled={publishStatus === "loading" || publishStatus === "success"} onClick={publishRequest}>
            <Send size={18} /> {publishStatus === "loading" ? "Publishing request..." : publishStatus === "error" ? "Try publishing again" : publishStatus === "success" ? "Published" : "Publish free request"}
          </button>
          {publishMessage ? (
            <div className={publishStatus === "error" ? "dialog-error checkout-status-message" : publishStatus === "success" ? "dialog-success checkout-status-message" : "dialog-note checkout-status-message"} role="status">
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

function RedditMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9.2" cy="12.4" r="1" fill="currentColor" />
      <circle cx="14.8" cy="12.4" r="1" fill="currentColor" />
      <path d="M8.8 15.4c1.8 1.2 4.6 1.2 6.4 0M15.3 7.3l1.1-4 3.1.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="20" cy="5" r="1.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function XChannelMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4.5h3.8L19 19.5h-3.8L5 4.5Zm.3 15L18.7 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
  const shareStorageKey = publishedRequest ? `pleasefindmethis-share-count-${publishedRequest.requestId}` : "";
  const [shareCount, setShareCount] = useState(() => {
    if (!shareStorageKey) {
      return 0;
    }
    return Math.max(0, Number(window.sessionStorage.getItem(shareStorageKey)) || 0);
  });
  const [copied, setCopied] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    if (!publishedRequest) {
      return;
    }

    trackAcquisitionEvent("share_prompt_viewed", {
      bounty_id: publishedRequest.requestId,
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

  const requestPath = getBountyPath(publishedRequest.requestId, publishedRequest.itemName);
  const requestUrl = new URL(requestPath, window.location.origin);
  requestUrl.searchParams.set("utm_source", "product_share");
  requestUrl.searchParams.set("utm_medium", "referral");
  requestUrl.searchParams.set("utm_campaign", "request_help");
  const trackedRequestUrl = requestUrl.toString();
  const publicRequestUrl = new URL(requestPath, window.location.origin).toString();
  const message = `I’ve searched everywhere for ${getShareSubject(publishedRequest.itemName)}. Do you recognize it? Leave a clue—no signup needed.`;
  const encodedMessage = encodeURIComponent(message);
  const getChannelShareUrl = (channel: string) => {
    const channelUrl = new URL(trackedRequestUrl);
    channelUrl.searchParams.set("share_channel", channel);
    return channelUrl.toString();
  };
  const whatsappShareUrl = encodeURIComponent(getChannelShareUrl("whatsapp"));
  const redditShareUrl = encodeURIComponent(getChannelShareUrl("reddit"));
  const xShareUrl = encodeURIComponent(getChannelShareUrl("x"));
  const description = getRequestDescription(publishedRequest.itemName, publishedRequest.details);
  const progress = Math.min(shareCount, 3);

  const recordShare = (channel: string) => {
    setShareCount((current) => {
      const next = current + 1;
      if (shareStorageKey) {
        window.sessionStorage.setItem(shareStorageKey, String(next));
      }
      return next;
    });
    trackAcquisitionEvent("request_share_started", {
      bounty_id: publishedRequest.requestId,
      category: publishedRequest.category,
      share_channel: channel,
    });
  };

  const copyShareLink = async () => {
    try {
      await copyTextToClipboard(getChannelShareUrl("copy_link"));
      recordShare("copy_link");
      setCopied(true);
      setShareMessage("Link copied. Send it to someone with a sharp memory.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareMessage("Could not copy the link. Open the live request and copy it from your browser.");
    }
  };

  const nativeShare = async () => {
    if (typeof navigator.share !== "function") {
      await copyShareLink();
      return;
    }

    try {
      await navigator.share({ title: publishedRequest.itemName, text: message, url: getChannelShareUrl("native_share") });
      recordShare("native_share");
      setShareMessage("Shared. The right person may be one forward away.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      setShareMessage("Sharing did not open. Copy the link instead.");
    }
  };

  return (
    <main className="route-page share-page" aria-labelledby="share-page-title">
      <header className="share-page-intro">
        <h1 id="share-page-title">Your search is live. Give it a head start.</h1>
        <p>The fastest finds start with one person saying, “wait—I know that.”</p>
      </header>

      <section className="share-page-grid">
        <article className="share-preview-card">
          <div className="share-preview-body">
            <img src={publishedRequest.image} alt={`${publishedRequest.itemName} reference`} />
            <div>
              <h2>{publishedRequest.itemName}</h2>
              <span>{description}</span>
              <p>{message}</p>
            </div>
            <span className="hunt-corner-tab" aria-hidden="true" />
          </div>
          <div className="share-preview-link">
            <LinkIcon size={18} />
            <span>{publicRequestUrl.replace(/^https?:\/\//, "")}</span>
            <button type="button" onClick={() => onOpenRequest(publishedRequest)}>Open request <ExternalLink size={15} /></button>
          </div>
        </article>

        <aside className="share-actions-panel" aria-label="Share options">
          <h2>Put it in front of the right person.</h2>
          <button className="share-native-button" type="button" onClick={() => void nativeShare()}>
            <Share2 size={21} /> Share this search
          </button>
          <div className="share-channel-grid">
            <a href={`https://wa.me/?text=${encodedMessage}%20${whatsappShareUrl}`} target="_blank" rel="noreferrer" onClick={() => recordShare("whatsapp")}>
              <MessageCircle size={20} /> WhatsApp
            </a>
            <a href={`https://www.reddit.com/submit?url=${redditShareUrl}&title=${encodedMessage}`} target="_blank" rel="noreferrer" onClick={() => recordShare("reddit")}>
              <RedditMark /> Reddit
            </a>
            <a href={`https://twitter.com/intent/tweet?text=${encodedMessage}&url=${xShareUrl}`} target="_blank" rel="noreferrer" onClick={() => recordShare("x")}>
              <XChannelMark /> X
            </a>
          </div>
          <button className={copied ? "share-copy-button is-copied" : "share-copy-button"} type="button" onClick={() => void copyShareLink()}>
            {copied ? <CheckCircle2 size={20} /> : <Copy size={20} />} {copied ? "Link copied" : "Copy link"}
          </button>
          <p>Every share opens the same public clue page.</p>
          {shareMessage ? <span className="share-action-message" role="status">{shareMessage}</span> : null}
        </aside>
      </section>

      <section className="share-progress" aria-label="Search launch progress">
        <div className="is-complete"><span><CheckCircle2 size={19} /></span><p><strong>1&nbsp; Posted</strong><small>Your search is live and public.</small></p></div>
        <div className="is-current"><span>2</span><p><strong>Share with 3 people</strong><small>{progress} of 3</small></p></div>
        <div><span>3</span><p><strong>Watch clues arrive</strong><small>Hear from people who recognize it.</small></p></div>
        <div className="share-progress-meter" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={progress}>
          <span style={{ width: `${(progress / 3) * 100}%` }} />
        </div>
        <p className="share-progress-note">This progress only counts share actions from this page.</p>
      </section>

      <footer className="share-page-footer">
        <button className="share-view-button" type="button" onClick={() => onOpenRequest(publishedRequest)}>View live request</button>
        <button className="hunt-save-button" type="button" onClick={onDashboard}>Go to dashboard</button>
        <strong>The right person may be one forward away.</strong>
      </footer>
    </main>
  );
}

function BrowsePage({
  bounties,
  dataError,
  dataLoading,
  onBrowseAll,
  onDetail,
  onPost,
  showingExamples,
}: {
  bounties: BountyListing[];
  dataError: string;
  dataLoading: boolean;
  onBrowseAll: () => void;
  onDetail: (bountyId: string) => void;
  onPost: () => void;
  showingExamples: boolean;
}) {
  const openRequests = useMemo(() => [...bounties].sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()), [bounties]);
  const featured = openRequests.slice(0, 4);

  return (
    <main className="route-page bounty-gallery-page" aria-labelledby="browse-title">
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

      <section className="top-bounty-grid" aria-label="Featured requests">
        {featured.map((bounty, index) => (
          <BountySquareCard bounty={bounty} featured={index === 0} key={bounty.id} onDetail={onDetail} rank={index + 1} />
        ))}
      </section>

    </main>
  );
}

function BrowseAllPage({
  bounties,
  dataError,
  dataLoading,
  onDetail,
  onPost,
  showingExamples,
}: {
  bounties: BountyListing[];
  dataError: string;
  dataLoading: boolean;
  onDetail: (bountyId: string) => void;
  onPost: () => void;
  showingExamples: boolean;
}) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(16);
  const categories = useMemo(() => ["All", ...Array.from(new Set(bounties.map((bounty) => bounty.category))).sort()], [bounties]);
  const filteredBounties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...bounties].sort((left, right) => new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime()).filter((bounty) => {
      const matchesCategory = filter === "All" || bounty.category === filter;
      const searchable = `${bounty.name} ${bounty.detail} ${bounty.category} ${bounty.location}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [bounties, filter, query]);

  useEffect(() => {
    setVisibleCount(16);
  }, [bounties.length, filter, query]);

  useEffect(() => {
    const loadNearBottom = () => {
      const remaining = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      if (remaining < 520) {
        setVisibleCount((count) => Math.min(count + 8, filteredBounties.length));
      }
    };

    window.addEventListener("scroll", loadNearBottom);
    loadNearBottom();
    return () => window.removeEventListener("scroll", loadNearBottom);
  }, [filteredBounties.length]);

  const visibleBounties = filteredBounties.slice(0, visibleCount);
  const atEnd = visibleCount >= filteredBounties.length;
  const hasVisibleBounties = visibleBounties.length > 0;
  const emptyStateSubject = query.trim() ? `"${query.trim()}"` : filter === "All" ? "the current board" : filter;

  return (
    <main className="route-page bounty-gallery-page browse-all-page" aria-labelledby="browse-all-title">
      <section className="gallery-hero compact-gallery-hero">
        <div>
          <h1 id="browse-all-title">{showingExamples ? "Browse example searches" : "Browse all open requests"}</h1>
          <p>{showingExamples ? "These examples show the detail that helps strangers recognize an exact item." : "Search by item, seller, or category."}</p>
          {dataLoading ? <p className="dialog-note">Loading open requests...</p> : null}
          {dataError ? <p className="dialog-error" role="status">{dataError} Showing example requests until the live board is ready.</p> : null}
        </div>
        <button className="primary-button" type="button" onClick={onPost}>
          Post a request <ArrowRight size={18} />
        </button>
      </section>
      <section className="browse-toolbar" aria-label="Browse filters">
        <div className="search-field">
          <Search size={18} />
          <input aria-label="Search all requests" placeholder="Search by item, seller, or place" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="filter-pills">
          {categories.map((category) => (
            <button className={filter === category ? "active" : ""} key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>
              {category}
            </button>
          ))}
        </div>
      </section>
      <section className="bounty-square-grid full-gallery-grid" aria-label="All request results">
        {hasVisibleBounties ? (
          visibleBounties.map((bounty) => (
            <BountySquareCard bounty={bounty} key={bounty.id} onDetail={onDetail} variant="request" />
          ))
        ) : (
          <div className="empty-state browse-empty-state" role="status">
            <Search size={26} />
            <strong>No requests match {emptyStateSubject}.</strong>
            <span>Try one short word, then switch to All.</span>
          </div>
        )}
      </section>
      {hasVisibleBounties ? (
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

function BountySquareCard({
  bounty,
  compact = false,
  featured = false,
  onDetail,
  rank,
  variant = "square",
}: {
  bounty: BountyListing;
  compact?: boolean;
  featured?: boolean;
  onDetail: (bountyId: string) => void;
  rank?: number;
  variant?: "square" | "request";
}) {
  const requestVariant = variant === "request";
  const requestTypeLabel = bounty.live ? bounty.reward || (bounty.rewardValue > 0 ? "Featured" : "Free") : "Example";

  return (
    <article className={`bounty-square-card tone-${rank ? ((rank - 1) % 5) + 1 : (bounty.rewardValue % 5) + 1} ${compact ? "compact" : ""} ${featured ? "featured" : ""} ${requestVariant ? "request-card" : ""}`}>
      <a
        className="square-card-hit"
        href={getBountyPath(bounty.id, bounty.name)}
        onClick={(event) => handleRoutedAnchorClick(event, () => onDetail(bounty.id))}
        aria-label={`View ${bounty.name}`}
      >
        {requestVariant ? (
          <span className="square-check" aria-hidden="true">
            <BadgeCheck size={15} />
          </span>
        ) : (
          <>
            <span className="square-rank">{rank ? `#${rank}` : bounty.category}</span>
            <span className="square-price">{requestTypeLabel}</span>
          </>
        )}
        <span className="square-image-wrap">
          <img src={bounty.image} alt={`${bounty.name} reference`} loading="lazy" decoding="async" />
        </span>
        <span className="square-copy">
          <strong>{bounty.name}</strong>
          <em>{bounty.detail}</em>
        </span>
        {requestVariant ? (
          <span className="square-meta request-card-meta">
            <span>
              <small>Request type</small>
              <b>{requestTypeLabel}</b>
            </span>
            <span>
              <small>Closes in</small>
              <b>{bounty.closes}</b>
            </span>
          </span>
        ) : (
          <span className="square-meta">
            <span>
              <Clock3 size={14} /> {bounty.closes}
            </span>
            <span>
              <MessageSquare size={14} /> {bounty.submissions}
            </span>
          </span>
        )}
      </a>
    </article>
  );
}

function BountyDetailPage({
  bounty,
  onBrowse,
  onStartSearch,
  onSubmit,
}: {
  bounty: BountyListing;
  onBrowse: () => void;
  onStartSearch: () => void;
  onSubmit: () => void;
}) {
  const requestComments = useRequestComments(bounty);
  const commentVisitor = useMemo(() => getRequestCommentVisitor(), []);
  const [commentBody, setCommentBody] = useState("");
  const [commentLink, setCommentLink] = useState("");
  const [commentStatus, setCommentStatus] = useState<"idle" | "posting" | "posted" | "error">("idle");
  const [commentError, setCommentError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const visibleComments = requestComments.comments.slice(0, 24);
  const brief = bounty.brief ?? getRequestBriefFields(bounty.description);
  const isExample = !bounty.live;

  const getShareRequestUrl = () => {
    const requestUrl = new URL(getBountyPath(bounty.id, bounty.name), window.location.origin);
    requestUrl.searchParams.set("utm_source", "product_share");
    requestUrl.searchParams.set("utm_medium", "referral");
    requestUrl.searchParams.set("utm_campaign", "request_help");
    return requestUrl.toString();
  };

  const handleShareRequest = async () => {
    const requestUrl = getShareRequestUrl();
    const shareText = `Do you recognize ${getShareSubject(bounty.name)}? Leave a clue—no signup needed.`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: bounty.name, text: shareText, url: requestUrl });
        trackAcquisitionEvent("helper_reshare", { bounty_id: bounty.id, category: bounty.category, share_channel: "native_share" });
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
        bounty_id: bounty.id,
        category: bounty.category,
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
    setCommentStatus("posting");
    setCommentError("");

    try {
      const savedComment = await requestComments.addComment(commentBody, commentLink);
      setCommentBody("");
      setCommentLink("");
      setCommentStatus("posted");
      trackAcquisitionEvent("request_comment_posted", {
        bounty_id: bounty.id,
        category: bounty.category,
        has_source_link: Boolean(savedComment.source_url),
      });
    } catch (error) {
      setCommentStatus("error");
      setCommentError(error instanceof Error ? error.message : "Could not post this comment.");
    }
  };

  return (
    <main className="route-page public-request-page" aria-labelledby="detail-title">
      <button className="back-button page-back" type="button" onClick={onBrowse}>
        <ArrowLeft size={17} /> Open requests
      </button>
      <section className="public-request-layout">
        <article className="request-story-column">
          <div className="request-image-frame">
            <img src={bounty.image} alt={bounty.name} decoding="async" />
            <span className="hunt-corner-tab" aria-hidden="true" />
          </div>
          <div className="request-status-line">
            <span>{isExample ? "Example" : bounty.status}</span><i aria-hidden="true" />
            <span>{bounty.category}</span><i aria-hidden="true" />
            <span>{bounty.posted}</span>
          </div>
          <h1 id="detail-title">{bounty.name}</h1>
          <p className="request-story-copy">{bounty.description}</p>
          <h2>Must match</h2>
          <ul className="request-match-list">
            {bounty.mustHaves.map((item) => <li key={item}><CheckCircle2 size={18} /> {item}</li>)}
          </ul>
          {brief.alreadyTried || brief.buyingLimits ? (
            <dl className="request-brief-notes">
              {brief.alreadyTried ? <div><dt>Already searched</dt><dd>{brief.alreadyTried}</dd></div> : null}
              {brief.buyingLimits ? <div><dt>Buying limits</dt><dd>{brief.buyingLimits}</dd></div> : null}
            </dl>
          ) : null}
        </article>

        <aside className="request-clue-panel" aria-labelledby="clue-panel-title">
          <h2 id="clue-panel-title">Do you recognize this?</h2>
          <p>Leave a clue or a link. No account needed.</p>
          {isExample ? <span className="example-thread-note">Preview mode: comments here stay on this device.</span> : null}
          <form onSubmit={handleCommentSubmit}>
            <label htmlFor="request-comment-body">Your clue</label>
            <div className="request-clue-textarea">
              <textarea
                id="request-comment-body"
                value={commentBody}
                maxLength={requestCommentMaxLength}
                placeholder="I remember this from…"
                onChange={(event) => {
                  setCommentBody(event.target.value);
                  setCommentStatus("idle");
                  setCommentError("");
                }}
              />
              <span>{commentBody.length}/{requestCommentMaxLength}</span>
            </div>
            <label htmlFor="request-comment-link">Optional link to seller or source</label>
            <input
              id="request-comment-link"
              value={commentLink}
              placeholder="https://…"
              onChange={(event) => {
                setCommentLink(event.target.value);
                setCommentStatus("idle");
                setCommentError("");
              }}
            />
            <button className="request-clue-submit" type="submit" disabled={commentStatus === "posting" || commentBody.trim().length < 2}>
              {commentStatus === "posting" ? "Posting…" : "Leave a clue"}
            </button>
            <small className="request-alias-note"><LockKeyhole size={14} /> You’ll appear as {commentVisitor.alias}, a private helper alias.</small>
            {commentStatus === "posted" ? <p className="comment-status success">Clue posted. Thank you for moving the search forward.</p> : null}
            {commentStatus === "error" && commentError ? <p className="comment-status error">{commentError}</p> : null}
          </form>
          <button className="request-private-source" type="button" onClick={onSubmit}>Share a private source instead <ArrowRight size={15} /></button>
          <div className="request-share-block">
            <button type="button" onClick={() => void handleShareRequest()}><Share2 size={18} /> {shareCopied ? "Link copied" : "Ask someone who might know"}</button>
            <span>One good forward can reach the right person.</span>
          </div>
        </aside>
      </section>

      <section className="request-thread-section" aria-labelledby="request-comments-title">
        <div className="request-thread-head">
          <h2 id="request-comments-title">The search so far</h2>
          <span>{visibleComments.length} clue{visibleComments.length === 1 ? "" : "s"}</span>
        </div>

        <div className="request-comment-list" aria-live="polite">
          {requestComments.loading ? <p className="comment-load-state">Loading comments...</p> : null}
          {requestComments.error ? <p className="comment-load-state">{requestComments.error}</p> : null}
          {visibleComments.length ? (
            visibleComments.map((comment) => (
              <article className="request-comment-row" key={comment.id}>
                <span className={`comment-avatar tone-${comment.helper_avatar_tone}`} aria-hidden="true">
                  {getAliasInitials(comment.helper_alias)}
                </span>
                <div className="request-comment-body">
                  <div className="request-comment-meta">
                    <strong>{comment.helper_alias}</strong>
                    <span>{getRelativeTimeLabel(comment.created_at)}</span>
                  </div>
                  <p>{comment.body}</p>
                  {comment.source_url ? (
                    <a className="comment-source-link" href={comment.source_url} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} /> {getCommentSourceHost(comment.source_url)}
                    </a>
                  ) : null}
                </div>
              </article>
            ))
          ) : !requestComments.loading ? (
            <div className="request-comment-empty">
              <MessageSquare size={22} />
              <strong>No clues yet.</strong>
              <span>Be the first person to move this search forward.</span>
            </div>
          ) : null}
        </div>
        <div className="request-thread-share">
          <div><Share2 size={20} /><span><strong>Know someone with a sharp memory?</strong><small>The right person might recognize this instantly.</small></span></div>
          <button type="button" onClick={() => void handleShareRequest()}>Share this search <Share2 size={16} /></button>
        </div>
      </section>

      <section className="request-recipient-cta">
        <h2>Looking for something too?<br />Start a free search.</h2>
        <button type="button" onClick={onStartSearch}>Start a free search</button>
        <a href="#top" onClick={(event) => { event.preventDefault(); onBrowse(); }}>See how it works <ArrowRight size={16} /></a>
      </section>
    </main>
  );
}

function SubmitFindPage({
  bounty,
  onBack,
  onDashboard,
}: {
  bounty: BountyListing;
  onBack: () => void;
  onDashboard: () => void;
}) {
  const currencyPreference = useCurrencyPreference();
  const [submitted, setSubmitted] = useState(false);
  const [sourceType, setSourceType] = useState<FindSourceType>("source-link");
  const [sourceLink, setSourceLink] = useState("");
  const [contactEmail, setContactEmail] = useState(() => window.sessionStorage.getItem("pleasefindmethis-auth-email") ?? "");
  const [itemTerms, setItemTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [sourceTruthConfirmed, setSourceTruthConfirmed] = useState(false);
  const selectedSource = findSourceOptions.find((option) => option.value === sourceType) ?? findSourceOptions[0];
  const linkRequired = sourceType === "source-link";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = contactEmail.trim();
    const normalizedSource = sourceLink.trim();
    const normalizedTerms = itemTerms.trim();
    const normalizedNotes = notes.trim();
    if (linkRequired && !sourceLink.trim()) {
      setSubmitError("Add a source link, or choose private/direct if no public link exists.");
      setSubmitted(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSubmitError("Add a valid contact email so the requester can message you.");
      setSubmitted(false);
      return;
    }

    if (!sourceTruthConfirmed) {
      setSubmitError("Confirm this source is real and matches the request.");
      setSubmitted(false);
      return;
    }

    setSubmitError("");
    setSubmitMessage("");
    setSubmitStatus("loading");

    const uploadedPaths: string[] = [];

    try {
      if (supabase && isUuid(bounty.id)) {
        const user = await getCurrentSupabaseUser();
        const submissionId = crypto.randomUUID();
        const uploadResult = await uploadSourceProofFiles(user.id, submissionId, proofFiles);

        uploadedPaths.push(...uploadResult.uploadedPaths);

        const duplicateSourceIdentity = getDuplicateSourceIdentity(sourceType, normalizedSource, normalizedNotes);
        const fingerprint = await createSourceFingerprint(bounty.id, sourceType, duplicateSourceIdentity);
        const { error } = await supabase.from("source_submissions").insert({
          id: submissionId,
          request_id: bounty.id,
          finder_id: user.id,
          source_type: sourceType,
          source_url: sourceType === "source-link" ? normalizedSource : normalizedSource || null,
          source_contact: sourceType === "source-link" ? null : normalizedNotes.slice(0, 500) || normalizedSource || null,
          contact_email: normalizedEmail,
          price_or_terms: normalizedTerms || null,
          match_notes: normalizedNotes || "Helper submitted a source suggestion for review.",
          proof: uploadResult.proof,
          source_fingerprint: fingerprint,
        });

        if (error) {
          if (isDuplicateSourceSubmissionError(error)) {
            const duplicateFlagResult = await supabase.from("source_duplicate_flags").insert({
              request_id: bounty.id,
              finder_id: user.id,
              source_fingerprint: fingerprint,
              source_type: sourceType,
              normalized_source: duplicateSourceIdentity.slice(0, 500),
              status: "open",
              admin_note: "",
            });

            if (duplicateFlagResult.error && !isDuplicateSourceSubmissionError(duplicateFlagResult.error)) {
              console.warn("Could not record duplicate source flag", duplicateFlagResult.error);
            }

            if (uploadedPaths.length) {
              await supabase.storage.from(sourceSubmissionProofBucket).remove(uploadedPaths);
            }

            setSubmitted(false);
            setSubmitStatus("error");
            setSubmitError("This source appears to match an earlier protected submission. We logged it for duplicate-priority review instead of creating a second source record.");
            return;
          }

          throw error;
        }

        setSubmitMessage("Source suggestion saved. The requester can review the link, notes, and proof from their dashboard.");
      } else {
        setSubmitMessage("Demo source suggestion saved locally.");
      }

      setContactEmail(normalizedEmail);
      setSubmitted(true);
      setSubmitStatus("success");
      trackAcquisitionEvent("submit_source", {
        bounty_id: bounty.id,
        category: bounty.category,
        source_type: sourceType,
        has_source_link: Boolean(normalizedSource),
        has_price_or_terms: Boolean(normalizedTerms),
        proof_file_count: proofFiles.length,
      });
    } catch (error) {
      if (supabase && uploadedPaths.length) {
        await supabase.storage.from(sourceSubmissionProofBucket).remove(uploadedPaths);
      }

      setSubmitted(false);
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Could not submit this source.");
    }
  };

  return (
    <main className="route-page" aria-labelledby="submit-title">
      <section className="two-column-page">
        <form className="form-panel" onSubmit={handleSubmit}>
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Request detail
          </button>
          <h1 id="submit-title">Share a source for {bounty.name}.</h1>
          <p>Share one clear lead with match notes for this request.</p>
          <label>
            How did you find it?
            <select
              value={sourceType}
              onChange={(event) => {
                setSourceType(event.target.value as FindSourceType);
                setSubmitError("");
                setSubmitted(false);
              }}
            >
              {findSourceOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <p className="field-hint">{selectedSource.copy}</p>
          <label>
            {linkRequired ? "Source link" : "Source link (optional)"}
              <input
                value={sourceLink}
              placeholder={linkRequired ? "https://example.com/item" : "Leave blank for private lead"}
                onChange={(event) => {
                  setSourceLink(event.target.value);
                  setSubmitted(false);
              }}
            />
          </label>
          <label>
            Contact email
            <input
              type="email"
              value={contactEmail}
              placeholder="you@example.com"
              onChange={(event) => {
                setContactEmail(event.target.value);
                setSubmitted(false);
              }}
            />
          </label>
          <label>
            Price or terms
            <input
              value={itemTerms}
              placeholder="Price, terms, or unknown"
              onChange={(event) => {
                setItemTerms(event.target.value);
                setSubmitted(false);
              }}
            />
          </label>
          <label>
            Match notes for the requester
            <textarea
              value={notes}
              placeholder="Why it matches: seller, condition, and price."
              onChange={(event) => {
                setNotes(event.target.value);
                setSubmitted(false);
              }}
            />
          </label>
          <div className="upload-box">
            <Upload size={24} />
            <span>
              <strong>Add context</strong>
              {proofFiles.length
                ? `${proofFiles.length} file${proofFiles.length === 1 ? "" : "s"} attached.`
                : "Photos or proof are optional, but they speed verification."}
            </span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(event) => {
                setProofFiles(Array.from(event.target.files ?? []).slice(0, 6));
                setSubmitted(false);
              }}
            />
          </div>
            <label className="check-confirmation">
              <input
                type="checkbox"
                checked={sourceTruthConfirmed}
                onChange={(event) => {
                  setSourceTruthConfirmed(event.target.checked);
                  setSubmitted(false);
                }}
              />
              <span>Yes, this lead is real and matches the request.</span>
            </label>
          {submitError ? (
            <p className="dialog-error" role="alert">
              {submitError}
            </p>
          ) : null}
          <button className="primary-button" type="submit" disabled={submitStatus === "loading"}>
            {submitStatus === "loading" ? "Saving..." : "Send source"}
          </button>
          {submitted ? (
            <>
              <div className="summary-card submission-success" role="status">
                <CheckCircle2 size={24} />
                <strong>Source suggestion shared</strong>
                <span>{sourceLink.trim() ? `Source recorded: ${sourceLink.trim()}` : "No public link shared. Contact path and notes are saved."}</span>
                <span>Contact: {contactEmail}</span>
                {itemTerms.trim() ? <span>Terms: {itemTerms.trim()}</span> : null}
                <span>{submitMessage || "The requester can review your suggestion from their dashboard."}</span>
              </div>
              <a className="section-link section-button" href={routeHref("finder-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onDashboard)}>
                Go to helper dashboard <ArrowRight size={17} />
              </a>
            </>
          ) : null}
        </form>
      </section>
    </main>
  );
}

function PosterDashboardPage({
  checkoutReturnStatus,
  onDispute,
  onOpenRequest,
  onProfile,
  onShareRequest,
}: {
  checkoutReturnStatus: CheckoutReturnStatus;
  onDispute: () => void;
  onOpenRequest: (requestId: string) => void;
  onProfile: () => void;
  onShareRequest: (request: RequestRow) => void;
}) {
  const checkoutSnapshot = readStoredCheckoutSnapshot();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [submissions, setSubmissions] = useState<SourceSubmissionRow[]>([]);
  const [revealedSources, setRevealedSources] = useState<RevealedSourceDetailRow[]>([]);
  const [reviews, setReviews] = useState<SourceReviewRow[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [dashboardError, setDashboardError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("wrong-item");
  const [reviewNote, setReviewNote] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

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
        await getCurrentSupabaseUser();
        const { data: requestData, error: requestError } = await client
          .from("requests")
          .select("id,user_id,item_name,category,details,reward,total_due,finder_payout,duration_days,status,payment_status,payout_status,customer_email,reference_images,created_at,paid_at,payout_release_after")
          .order("created_at", { ascending: false });

        if (requestError) {
          throw requestError;
        }

        const nextRequests = (requestData ?? []) as RequestRow[];
        const requestIds = nextRequests.map((request) => request.id);
        let nextSubmissions: SourceSubmissionRow[] = [];
        let nextRevealedSources: RevealedSourceDetailRow[] = [];
        let nextReviews: SourceReviewRow[] = [];

        if (requestIds.length) {
          const [submissionResult, revealedResult, reviewResult] = await Promise.all([
            client
              .from("source_submissions")
              .select("id,request_id,finder_id,source_type,price_or_terms,match_notes,status,first_valid_rank,revealed_at,accepted_at,rejected_at,awarded_at,created_at,updated_at")
              .in("request_id", requestIds)
              .order("created_at", { ascending: true }),
            client
              .rpc("get_revealed_source_details")
              .select("id,request_id,finder_id,source_type,source_url,source_contact,contact_email,price_or_terms,match_notes,proof,status,revealed_at,accepted_at,rejected_at,awarded_at,poster_id,revealed_log_created_at,created_at,updated_at")
              .in("request_id", requestIds),
            client
              .from("source_reviews")
              .select("id,submission_id,request_id,reviewer_id,decision,reason_code,note,created_at")
              .in("request_id", requestIds)
              .order("created_at", { ascending: false }),
          ]);

          if (submissionResult.error) {
            throw submissionResult.error;
          }

          if (revealedResult.error) {
            throw revealedResult.error;
          }

          if (reviewResult.error) {
            throw reviewResult.error;
          }

          nextSubmissions = (submissionResult.data ?? []) as SourceSubmissionRow[];
          nextRevealedSources = (revealedResult.data ?? []) as RevealedSourceDetailRow[];
          nextReviews = (reviewResult.data ?? []) as SourceReviewRow[];
        }

        if (!mounted) {
          return;
        }

        setRequests(nextRequests);
        setSubmissions(nextSubmissions);
        setRevealedSources(nextRevealedSources);
        setReviews(nextReviews);
        setSelectedSubmissionId((current) => (current && nextSubmissions.some((submission) => submission.id === current) ? current : nextSubmissions[0]?.id ?? ""));
      } catch (error) {
        if (mounted) {
          setDashboardError(error instanceof Error ? error.message : "Could not load poster dashboard.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const submissionsByRequest = useMemo(() => {
    const counts = new Map<string, number>();
    submissions.forEach((submission) => counts.set(submission.request_id, (counts.get(submission.request_id) ?? 0) + 1));
    return counts;
  }, [submissions]);
  const dashboardBounties = requests.length
    ? requests.map((request) => requestRowToBounty(request, submissionsByRequest.get(request.id) ?? 0))
    : [];
  const selectedSubmission = submissions.find((submission) => submission.id === selectedSubmissionId) ?? submissions[0] ?? null;
  const selectedRequest = selectedSubmission ? requests.find((request) => request.id === selectedSubmission.request_id) ?? null : null;
  const selectedReveal = selectedSubmission ? revealedSources.find((source) => source.id === selectedSubmission.id) ?? null : null;
  const selectedReview = selectedSubmission ? reviews.find((review) => review.submission_id === selectedSubmission.id) ?? null : null;
  const openRequestCount = requests.filter((request) => request.status === "open" || request.payment_status === "free").length;
  const acceptedSuggestionCount = reviews.filter((review) => review.decision === "accepted").length;
  const awaitingReviewCount = submissions.filter((submission) => ["submitted", "revealed", "in_review"].includes(submission.status)).length;

  const selectRequest = (requestId: string) => {
    const requestSubmission = submissions.find((submission) => submission.request_id === requestId);
    if (requestSubmission) {
      setSelectedSubmissionId(requestSubmission.id);
      setReviewMode(false);
      setActionMessage("");
    }
  };

  const revealSelectedSource = async () => {
    if (!selectedSubmission || !supabase) {
      return;
    }

    setDashboardError("");
    setActionMessage("");

    try {
      const user = await getCurrentSupabaseUser();
      const { error } = await supabase.from("source_reveals").insert({
        submission_id: selectedSubmission.id,
        request_id: selectedSubmission.request_id,
        poster_id: user.id,
        reveal_terms_accepted: true,
      });

      if (error) {
        throw error;
      }

      setActionMessage("Source details opened. The full details are visible now, and the review is saved to the case timeline.");
      trackAcquisitionEvent("source_revealed", {
        request_id: selectedSubmission.request_id,
        source_type: selectedSubmission.source_type,
      });
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Could not open this source.");
    }
  };

  const reviewSelectedSource = async (decision: "accepted" | "sent_to_review") => {
    if (!selectedSubmission || !supabase) {
      return;
    }

    setDashboardError("");
    setActionMessage("");

    try {
      const user = await getCurrentSupabaseUser();
      const { error } = await supabase.from("source_reviews").insert({
        submission_id: selectedSubmission.id,
        request_id: selectedSubmission.request_id,
        reviewer_id: user.id,
        decision,
        reason_code: decision === "accepted" ? null : rejectionReason,
        note: reviewNote.trim(),
      });

      if (error) {
        throw error;
      }

      setReviewMode(false);
      setReviewNote("");
      setActionMessage(decision === "accepted" ? "Source marked useful. No platform payout is created or released from this review." : "Review reason saved. The source is now in review.");
      trackAcquisitionEvent(decision === "accepted" ? "source_accepted" : "source_sent_to_review", {
        request_id: selectedSubmission.request_id,
        source_type: selectedSubmission.source_type,
        review_reason: decision === "accepted" ? undefined : rejectionReason,
      });
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Could not save this review decision.");
    }
  };

  return (
    <main className="route-page dashboard-page" aria-labelledby="poster-dashboard-title">
      {checkoutReturnStatus === "success" ? (
        <PostSuccessConfirmation checkoutSnapshot={checkoutSnapshot} onProfile={onProfile} />
      ) : null}
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Poster dashboard</p>
          <h1 id="poster-dashboard-title">Review source leads.</h1>
        </div>
        <a className="section-link section-button" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onProfile)}>
          Public trust page <ArrowRight size={17} />
        </a>
      </section>
      {loading ? <p className="dialog-note">Loading your requests and source suggestions...</p> : null}
      {dashboardError ? <p className="dialog-error" role="alert">{dashboardError}</p> : null}
      {actionMessage ? <p className="dialog-success" role="status">{actionMessage}</p> : null}
      <section className="metric-grid">
        <Metric icon={LockKeyhole} label="Open requests" value={String(openRequestCount)} />
        <Metric icon={MessageSquare} label="Sources awaiting review" value={String(awaitingReviewCount)} />
        <Metric icon={PackageCheck} label="Source suggestions" value={String(submissions.length)} />
        <Metric icon={CheckCircle2} label="Marked useful" value={String(acceptedSuggestionCount)} />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Sources to review</h2>
            <Filter size={18} />
          </div>
          {dashboardBounties.length ? dashboardBounties.map((bounty) => {
            const request = requests.find((entry) => entry.id === bounty.id);
            return (
              <div className="request-review-row" key={bounty.id}>
                <button className="review-row" type="button" onClick={() => selectRequest(bounty.id)}>
                  <img src={bounty.image} alt={`${bounty.name} reference`} loading="lazy" decoding="async" />
                  <span>
                    <strong>{bounty.name}</strong>
                    <small>{bounty.submissions} submissions · {bounty.status}</small>
                  </span>
                  <em>{bounty.reward || "Free request"}</em>
                </button>
                <div className="request-review-row-actions" aria-label={`${bounty.name} actions`}>
                  <button type="button" onClick={() => onOpenRequest(bounty.id)}><ExternalLink size={14} /> Open public page</button>
                  {request ? <button type="button" onClick={() => onShareRequest(request)}><Share2 size={14} /> Share request</button> : null}
                </div>
              </div>
            );
          }) : (
            <div className="empty-state"><Search size={25} /><strong>No searches yet</strong><span>Post a request to start collecting clues.</span></div>
          )}
        </div>
        <div className="dashboard-panel active-review">
          <div className="panel-header">
            <h2>Source suggestion review</h2>
            <LockKeyhole size={20} />
          </div>
          {selectedSubmission ? (
            <>
              <h3>{selectedRequest?.item_name ?? "Source suggestion"}</h3>
              <p>{selectedSubmission.match_notes || "A helper shared a lead. Review it before contacting the seller."}</p>
              <div className="protected-source-review" aria-label="Source suggestion review">
                <div className="source-review-row">
                  <span>Preview</span>
                  <strong>{selectedSubmission.price_or_terms || selectedSubmission.match_notes || "Source preview saved"}</strong>
                </div>
                <div className="source-review-row">
                  <span>Source</span>
                  <strong>{selectedReveal ? selectedReveal.source_url || selectedReveal.source_contact || "Source details available" : "Open full details to review"}</strong>
                </div>
                <div className="source-review-row">
                  <span>Helper context</span>
                  <strong>{selectedSubmission.proof?.length ? `${selectedSubmission.proof.length} context file${selectedSubmission.proof.length === 1 ? "" : "s"} saved` : "No files attached; notes are saved"}</strong>
                </div>
              </div>

              {selectedReview ? (
                <div className={selectedReview.decision === "accepted" ? "reveal-log success-log" : "reveal-log"} role="status">
                  <BadgeCheck size={20} />
                  <span>Review saved: {selectedReview.decision.replace(/_/g, " ")}{selectedReview.reason_code ? ` (${selectedReview.reason_code})` : ""}.</span>
                </div>
              ) : selectedReveal ? (
                <>
                  <div className="reveal-log" role="status">
                    <CheckCircle2 size={20} />
                    <span>Source details are saved to the timeline. Review them before marking this lead useful.</span>
                  </div>
                  <div className="action-row">
                    <button className="primary-button" type="button" onClick={() => reviewSelectedSource("accepted")}>
                      Mark useful
                    </button>
                    <button className="danger-button" type="button" onClick={() => setReviewMode((value) => !value)}>
                      Reject with reason
                    </button>
                  </div>
                  {reviewMode ? (
                    <div className="reject-review-panel" role="group" aria-label="Reject source with reason">
                      <label>
                        Why is this not right?
                        <select value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)}>
                          <option value="wrong-item">Wrong item</option>
                          <option value="unavailable">Listing is gone or unavailable</option>
                          <option value="fake-seller">Seller or source looks fake</option>
                          <option value="condition">Condition does not match</option>
                          <option value="price">Price or terms are not what was promised</option>
                        </select>
                      </label>
                      <label>
                        Review note
                        <textarea value={reviewNote} placeholder="Explain what did not match. This becomes part of the case record." onChange={(event) => setReviewNote(event.target.value)} />
                      </label>
                      <button className="danger-button strong-danger" type="button" onClick={() => reviewSelectedSource("sent_to_review")}>
                        Save review reason
                      </button>
                        <a className="section-link section-button" href={routeHref("dispute")} onClick={(event) => handleRoutedAnchorClick(event, onDispute)}>
                          Open dispute <ArrowRight size={17} />
                        </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="reveal-rule">
                    <ShieldCheck size={21} />
                      <span>Open full details when you are ready to verify.</span>
                  </div>
                  <button className="primary-button" type="button" onClick={revealSelectedSource}>
                    Open source details
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">
              <LockKeyhole size={26} />
              <strong>No source suggestions yet</strong>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function PostSuccessConfirmation({
  checkoutSnapshot,
  onProfile,
}: {
  checkoutSnapshot: CheckoutSnapshot | null;
  onProfile: () => void;
}) {
  const currencyPreference = useCurrencyPreference();
  const itemName = checkoutSnapshot?.itemName ?? "Your request";
  const confirmationCode = formatConfirmationCode(checkoutSnapshot?.requestId);
  const postedDate = formatConfirmationDate(checkoutSnapshot?.createdAt);
  const durationText = checkoutSnapshot?.durationDays ? `${checkoutSnapshot.durationDays} days` : "Active window";
  const categoryText = checkoutSnapshot?.category ?? "Public request";
  const paidTodayText = checkoutSnapshot ? formatUsdMoney(checkoutSnapshot.total, currencyPreference) : "No payment due";
  const requestTypeText = checkoutSnapshot?.total ? "Featured request" : "Free request";
  const receiptTarget = checkoutSnapshot?.email ? `Receipt sent to ${checkoutSnapshot.email}` : "Receipt saved to your account";
  const platformShareText = checkoutSnapshot
    ? "Your free request was created successfully."
    : "Free requests publish without checkout.";
  const reviewDashboard = () => {
    document.getElementById("poster-dashboard-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="post-success-confirmation" role="status" aria-label="Request posted confirmation">
      <div className="post-success-main">
        <div className="confirmation-title-row">
          <span className="confirmation-check" aria-hidden="true">
            <CheckCircle2 size={30} />
          </span>
          <div>
            <p className="confirmation-label">Request posted</p>
            <h2>{itemName} is live.</h2>
          </div>
        </div>
        <p className="confirmation-copy">
          Your request is live. Helpers can share links and lead details for your review.
        </p>
        <div className="confirmation-detail-grid" aria-label="Posted request receipt">
          <div>
            <span>Confirmation</span>
            <strong>{confirmationCode}</strong>
          </div>
          <div>
            <span>Paid today</span>
            <strong>{paidTodayText}</strong>
          </div>
          <div>
            <span>Request type</span>
            <strong>{requestTypeText}</strong>
          </div>
          <div>
            <span>Live for</span>
            <strong>{durationText}</strong>
          </div>
        </div>
        <div className="confirmation-payment-strip">
          <CreditCard size={21} />
          <span>
            <strong>{receiptTarget}</strong>
            {categoryText} posted on {postedDate}. {platformShareText}
          </span>
        </div>
        <div className="confirmation-actions">
          <button className="primary-button" type="button" onClick={reviewDashboard}>
            Review dashboard <ArrowRight size={17} />
          </button>
          <a className="section-link section-button" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onProfile)}>
            Open trust page <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </section>
  );
}

function FinderDashboardPage({
  bounties,
  onBrowse,
  onMessages,
  onProfile,
  onSettings,
  onSubmit,
}: {
  bounties: BountyListing[];
  onBrowse: () => void;
  onMessages: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onSubmit: (bountyId?: string) => void;
}) {
  const [accountProfile, setAccountProfile] = useState<AccountProfile>(() => readStoredAccountProfile());
  const [finderSubmissions, setFinderSubmissions] = useState<RevealedSourceDetailRow[]>([]);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const client = supabase;
    let mounted = true;

    const loadSubmissions = async () => {
      try {
        await getCurrentSupabaseUser();
        const { data, error } = await client
          .rpc("get_finder_source_submission_details")
          .select("id,request_id,finder_id,source_type,source_url,source_contact,contact_email,price_or_terms,match_notes,proof,status,created_at,updated_at")
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (mounted) {
          setFinderSubmissions((data ?? []) as RevealedSourceDetailRow[]);
        }
      } catch (error) {
        if (mounted) {
          setDashboardError(error instanceof Error ? error.message : "Could not load helper submissions.");
        }
      }
    };

    loadSubmissions();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const syncProfile = () => setAccountProfile(readStoredAccountProfile());
    window.addEventListener("storage", syncProfile);
    window.addEventListener("focus", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("focus", syncProfile);
    };
  }, []);

  const availableBounties = bounties.slice(0, 4);
  const acceptedCount = finderSubmissions.filter((submission) => submission.status === "accepted" || submission.status === "awarded").length;
  const openRequestCount = availableBounties.length;
  const readiness = getFinderReadiness(accountProfile);

  return (
    <main className="route-page dashboard-page" aria-labelledby="finder-dashboard-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Helper dashboard</p>
          <h1 id="finder-dashboard-title">Find leads. Build trust.</h1>
        </div>
        <div className="head-actions">
          <a className="section-link section-button" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onProfile)}>
            Profile <ArrowRight size={17} />
          </a>
          <button className="section-link section-button" type="button" onClick={onMessages}>
            Messages <ArrowRight size={17} />
          </button>
          <button className="primary-button" type="button" onClick={onBrowse}>
            Find requests
          </button>
        </div>
      </section>
      {dashboardError ? <p className="dialog-error" role="alert">{dashboardError}</p> : null}
      <section className="metric-grid">
        <Metric icon={Banknote} label="Open requests" value={String(openRequestCount)} />
        <Metric icon={Star} label="Readiness" value={`${readiness.score}%`} />
        <Metric icon={Trophy} label="Suggestions shared" value={String(finderSubmissions.length)} />
        <Metric icon={Clock3} label="Marked useful" value={String(acceptedCount)} />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel finder-readiness-panel">
          <div className="panel-header">
            <h2>Helper readiness</h2>
            <ShieldCheck size={20} />
          </div>
          <div className="readiness-score-row">
            <div className="score-ring">{readiness.score}%</div>
            <div>
              <strong>{readiness.label}</strong>
              <p>Complete profile and contact details before sharing more leads.</p>
            </div>
          </div>
          <ul className="check-list readiness-list">
            {readiness.items.map((item) => (
              <li className={item.complete ? "is-complete" : "is-missing"} key={item.label}>
                {item.complete ? <CheckCircle2 size={18} /> : <CircleHelp size={18} />}
                <span>
                  <strong>{item.label}</strong>
                  {item.copy}
                </span>
              </li>
            ))}
          </ul>
          <button className="primary-button" type="button" onClick={onSettings}>
            Update account settings
          </button>
        </div>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Active opportunities</h2>
            <Search size={18} />
          </div>
          {availableBounties.map((bounty) => (
            <button className="review-row" key={bounty.id} type="button" onClick={() => onSubmit(bounty.id)}>
              <img src={bounty.image} alt={`${bounty.name} reference`} loading="lazy" decoding="async" />
              <span>
                <strong>{bounty.name}</strong>
                <small>{bounty.category} · {bounty.closes} left</small>
              </span>
              <em>{bounty.reward || "Free request"}</em>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function MessageCenterPage({ onDashboard }: { onDashboard: () => void }) {
  const [sourceCases, setSourceCases] = useState<RevealedSourceDetailRow[]>([]);
  const [messages, setMessages] = useState<SourceMessageRow[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));
  const [sending, setSending] = useState(false);
  const selectedCase = sourceCases.find((sourceCase) => sourceCase.id === selectedCaseId) ?? sourceCases[0] ?? null;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    const client = supabase;
    let mounted = true;

    const loadCases = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        await getCurrentSupabaseUser();
        const { data, error } = await client
          .rpc("get_revealed_source_details")
          .select("id,request_id,finder_id,source_type,source_url,source_contact,contact_email,price_or_terms,match_notes,proof,status,revealed_at,accepted_at,rejected_at,awarded_at,poster_id,revealed_log_created_at,created_at,updated_at")
          .order("updated_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (mounted) {
          const nextCases = (data ?? []) as RevealedSourceDetailRow[];
          setSourceCases(nextCases);
          setSelectedCaseId((current) => (current && nextCases.some((sourceCase) => sourceCase.id === current) ? current : nextCases[0]?.id ?? ""));
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load source follow-up cases.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCases();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !selectedCase) {
      setMessages([]);
      return undefined;
    }

    const client = supabase;
    let mounted = true;

    const loadMessages = async () => {
      const { data, error } = await client
        .from("source_messages")
        .select("id,submission_id,request_id,sender_id,body,created_at")
        .eq("submission_id", selectedCase.id)
        .order("created_at", { ascending: true });

      if (!mounted) {
        return;
      }

      if (error) {
        setMessages([]);
          setStatusMessage("Message history will appear here after the source message migration is applied.");
        return;
      }

      setMessages((data ?? []) as SourceMessageRow[]);
      setStatusMessage("");
    };

    loadMessages();

    return () => {
      mounted = false;
    };
  }, [selectedCase]);

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!selectedCase) {
      setErrorMessage("Choose a source case before sending a message.");
      return;
    }

    if (!draftMessage.trim()) {
      setErrorMessage("Write a short message before sending.");
      return;
    }

    setSending(true);

    try {
      if (!supabase) {
        setStatusMessage("Demo message saved locally for this preview. Live accounts save messages to the source case.");
        setMessages((current) => [
          ...current,
          {
            id: `local-${Date.now()}`,
            submission_id: selectedCase.id,
            request_id: selectedCase.request_id,
            sender_id: "local-preview",
            body: draftMessage.trim(),
            created_at: new Date().toISOString(),
          },
        ]);
        setDraftMessage("");
        return;
      }

      const user = await getCurrentSupabaseUser();
      const { data, error } = await supabase
        .from("source_messages")
        .insert({
          submission_id: selectedCase.id,
          request_id: selectedCase.request_id,
          sender_id: user.id,
          body: draftMessage.trim(),
        })
        .select("id,submission_id,request_id,sender_id,body,created_at")
        .single();

      if (error) {
          setStatusMessage("Message table is not active yet. Apply the profile and messaging migration before relying on in-app delivery.");
        setMessages((current) => [
          ...current,
          {
            id: `local-${Date.now()}`,
            submission_id: selectedCase.id,
            request_id: selectedCase.request_id,
            sender_id: user.id,
            body: draftMessage.trim(),
            created_at: new Date().toISOString(),
          },
        ]);
        setDraftMessage("");
        return;
      }

      setMessages((current) => [...current, data as SourceMessageRow]);
      setDraftMessage("");
      setStatusMessage("Message saved to this source case.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not send this message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="route-page dashboard-page" aria-labelledby="messages-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Messages</p>
          <h1 id="messages-title">Source follow-ups in one place.</h1>
          <p>Use this for final lead checks.</p>
        </div>
        <div className="head-actions">
          <button className="section-link section-button" type="button" onClick={onDashboard}>
            Helper dashboard <ArrowRight size={17} />
          </button>
          <a className="primary-button" href="mailto:support@pleasefindmethis.com?subject=Help%20with%20a%20source%20follow-up">
            Email help
          </a>
        </div>
      </section>
      {loading ? <p className="dialog-note">Loading source follow-ups...</p> : null}
      {errorMessage ? <p className="dialog-error" role="alert">{errorMessage}</p> : null}
      {statusMessage ? <p className="dialog-note" role="status">{statusMessage}</p> : null}
      <section className="dashboard-grid messages-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Source cases</h2>
            <MessageSquare size={20} />
          </div>
          {sourceCases.length ? (
            sourceCases.map((sourceCase) => (
              <button className="review-row" key={sourceCase.id} type="button" onClick={() => setSelectedCaseId(sourceCase.id)}>
                <span>
                  <strong>{sourceCase.match_notes.slice(0, 64) || "Source suggestion case"}</strong>
                  <small>{sourceCase.status.replace(/_/g, " ")} · {getRelativeTimeLabel(sourceCase.updated_at)}</small>
                </span>
                <em>{sourceCase.source_type.replace(/-/g, " ")}</em>
              </button>
            ))
          ) : (
            <div className="empty-state">
              <MessageSquare size={26} />
              <strong>No source follow-ups yet</strong>
            </div>
          )}
        </div>
        <form className="dashboard-panel message-thread-panel" onSubmit={sendMessage}>
          <div className="panel-header">
            <h2>{selectedCase ? "Case thread" : "No case selected"}</h2>
            <ShieldCheck size={20} />
          </div>
          {selectedCase ? (
            <>
              <div className="source-review-row">
                <span>Source status</span>
                <strong>{selectedCase.status.replace(/_/g, " ")}</strong>
              </div>
              <div className="source-review-row">
                <span>Contact path</span>
                <strong>{selectedCase.source_url || selectedCase.source_contact || selectedCase.contact_email || "Private source details"}</strong>
              </div>
              <div className="message-thread" aria-label="Source case messages">
                {messages.length ? (
                  messages.map((message) => (
                    <div className="message-bubble" key={message.id}>
                      <p>{message.body}</p>
                      <span>{getRelativeTimeLabel(message.created_at)}</span>
                    </div>
                  ))
                ) : (
              <p className="dialog-note">No messages yet.</p>
                )}
              </div>
              <label className="message-composer">
                Message
                <textarea value={draftMessage} placeholder="Add the next step, seller update, or safety note." onChange={(event) => setDraftMessage(event.target.value)} />
              </label>
              <button className="primary-button" type="submit" disabled={sending}>
                {sending ? "Sending..." : "Send message"}
              </button>
            </>
          ) : (
            <p className="dialog-note">Pick a source case first.</p>
          )}
        </form>
      </section>
    </main>
  );
}

function DisputePage({ onBack }: { onBack: () => void }) {
  const [submissions, setSubmissions] = useState<SourceSubmissionRow[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [reasonCode, setReasonCode] = useState("bad-source");
  const [evidenceSummary, setEvidenceSummary] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    const client = supabase;
    let mounted = true;

    const loadSubmissions = async () => {
      try {
        await getCurrentSupabaseUser();
        const { data, error } = await client
          .from("source_submissions")
          .select("id,request_id,finder_id,source_type,price_or_terms,match_notes,proof,status,first_valid_rank,revealed_at,accepted_at,rejected_at,awarded_at,created_at,updated_at")
          .in("status", ["revealed", "accepted", "rejected", "in_review"]);

        if (error) {
          throw error;
        }

        if (mounted) {
          const nextSubmissions = (data ?? []) as SourceSubmissionRow[];
          setSubmissions(nextSubmissions);
          setSelectedSubmissionId(nextSubmissions[0]?.id ?? "");
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load dispute-eligible sources.");
        }
      }
    };

    loadSubmissions();

    return () => {
      mounted = false;
    };
  }, []);

  const submitDispute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setMessage("");

    if (!supabase) {
      setErrorMessage("Dispute submission requires Supabase configuration.");
      return;
    }

    const selectedSubmission = submissions.find((submission) => submission.id === selectedSubmissionId);

    if (!selectedSubmission) {
      setErrorMessage("Choose a reviewed source first.");
      return;
    }

    if (!evidenceSummary.trim()) {
      setErrorMessage("Add an evidence summary before opening a dispute.");
      return;
    }

    setSubmitting(true);

    try {
      const user = await getCurrentSupabaseUser();
      const { error } = await supabase.from("source_disputes").insert({
        submission_id: selectedSubmission.id,
        request_id: selectedSubmission.request_id,
        opened_by: user.id,
        opened_by_role: selectedSubmission.finder_id === user.id ? "finder" : "poster",
        reason_code: reasonCode,
        evidence_summary: evidenceSummary.trim(),
        status: "open",
        resolution_note: "",
      });

      if (error) {
        throw error;
      }

      setMessage("Dispute opened. The case is now available for review with your evidence summary.");
      setEvidenceSummary("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not open dispute.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="route-page" aria-labelledby="dispute-title">
      <section className="two-column-page">
        <form className="form-panel" onSubmit={submitDispute}>
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Poster dashboard
          </button>
          <h1 id="dispute-title">Open a dispute.</h1>
          <p>Use this when a source does not match.</p>
          <label>
            Source case
            <select value={selectedSubmissionId} onChange={(event) => setSelectedSubmissionId(event.target.value)}>
              {submissions.length ? (
                submissions.map((submission) => (
                  <option value={submission.id} key={submission.id}>
                    {submission.match_notes.slice(0, 72) || submission.id} · {submission.status}
                  </option>
                ))
              ) : (
                <option value="">Choose a reviewed source</option>
              )}
            </select>
          </label>
          <label>
            Dispute reason
            <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
              <option value="bad-source">Source does not match request</option>
	              <option value="used-valid-source">Useful source was dismissed incorrectly</option>
	              <option value="wrong-rejection">Source was rejected unfairly</option>
	              <option value="handoff-issue">Seller or buying-path issue</option>
	              <option value="payment-release">Digital tool or billing issue</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Evidence summary
            <textarea value={evidenceSummary} placeholder="Explain what is wrong and share source links, messages, or proof." onChange={(event) => setEvidenceSummary(event.target.value)} />
          </label>
          <p className="form-hint">Add links, receipts, photos, and messages in the summary.</p>
          {errorMessage ? <p className="dialog-error" role="alert">{errorMessage}</p> : null}
          {message ? <p className="dialog-success" role="status">{message}</p> : null}
          <button className="danger-button strong-danger" type="submit" disabled={submitting || !selectedSubmissionId}>
            {submitting ? "Submitting dispute..." : "Submit dispute"}
          </button>
        </form>
      </section>
    </main>
  );
}

function TrustProfilePage({ onBrowse, onFinder, onSettings }: { onBrowse: () => void; onFinder: () => void; onSettings: () => void }) {
  const [profile, setProfile] = useState<AccountProfile>(() => readStoredAccountProfile());
  const readiness = getFinderReadiness(profile);
  const displayName = profile.displayName.trim() || "Your helper profile";
  const handle = profile.handle.trim() ? `@${profile.handle.trim()}` : "No public handle yet";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const syncProfile = () => setProfile(readStoredAccountProfile());
    window.addEventListener("focus", syncProfile);
    window.addEventListener("storage", syncProfile);
    return () => {
      window.removeEventListener("focus", syncProfile);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  return (
    <main className="route-page" aria-labelledby="profile-title">
      <section className="profile-hero">
        <div className="profile-card-main">
          <span className="avatar large-avatar">{initials || "PF"}</span>
          <div>
            <p className="route-kicker">Finder profile</p>
            <h1 id="profile-title">{displayName}</h1>
            <p>{handle} · {profile.specialty.trim() || "Add sourcing focus in Account Settings."}</p>
          </div>
        </div>
        <div className="profile-actions">
          <button className="primary-button" type="button" onClick={onFinder}>
            Help with requests
          </button>
          <button className="section-link section-button" type="button" onClick={onSettings}>
            Edit profile <ArrowRight size={17} />
          </button>
          <a className="section-link section-button" href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
            Browse requests <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <section className="metric-grid">
        <Metric icon={Star} label="Readiness" value={`${readiness.score}%`} />
        <Metric icon={Trophy} label="Source history" value="Tracked" />
        <Metric icon={ShieldCheck} label="Review status" value={profile.identityStatus.replace(/_/g, " ")} />
        <Metric icon={Scale} label="Dispute history" value="Case-based" />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Trust signals</h2>
            <ShieldCheck size={20} />
          </div>
          <ul className="check-list readiness-list">
            {readiness.items.map((item) => (
              <li className={item.complete ? "is-complete" : "is-missing"} key={item.label}>
                {item.complete ? <CheckCircle2 size={18} /> : <CircleHelp size={18} />}
                <span>
                  <strong>{item.label}</strong>
                  {item.copy}
                </span>
              </li>
            ))}
          </ul>
        </div>
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
            "We collect email, request details, photos, source leads, and proof files.",
          ],
        },
        {
          title: "How data is used",
          copy: [
            "Request details are shared on request pages without sensitive account data.",
            "Source details are stored so requesters can review links and context before buying.",
          ],
        },
        {
          title: "Choices and requests",
          copy: [
            "Use Account settings to request deletion, export, or changes.",
            "We keep only records needed for security and legal requirements.",
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
      intro="Posting rules, lead sharing, and safety."
      sections={[
        {
          title: "Posting a request",
          copy: [
            "Requesters post for free. Helpers share leads.",
            "We do not sell items.",
          ],
        },
        {
          title: "Source checks and safety",
          copy: [
            "A source can be a public listing, seller contact, or local lead.",
            "Verify price, seller, and authenticity before buying.",
          ],
        },
        {
          title: "Account enforcement",
          copy: [
            "We can remove requests, block bad activity, pause abuse, or suspend accounts.",
          ],
        },
      ]}
    />
  );
}

function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund and Cancellation Policy"
      intro="How request removals and cancellations work."
      sections={[
        {
          title: "Free requests",
          copy: ["Posting is free and done directly on the request board."],
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
        const [profileResult, payoutResult] = await Promise.all([
          client
            .from("profiles")
            .select("display_name,handle,account_type,region,specialty,identity_status")
            .eq("id", user.id)
            .maybeSingle(),
          client
            .from("finder_payout_profiles")
            .select("payout_email,country,status")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

        if (!mounted) {
          return;
        }

        if (profileResult.error || payoutResult.error) {
          return;
        }

        const nextProfile = normalizeAccountProfile({
          ...readStoredAccountProfile(),
          displayName: profileResult.data?.display_name ?? "",
          handle: profileResult.data?.handle ?? "",
          accountType: (profileResult.data?.account_type as AuthAccountType | null) ?? "both",
          region: profileResult.data?.region ?? "",
          specialty: profileResult.data?.specialty ?? "",
          identityStatus: (profileResult.data?.identity_status as FinderIdentityStatus | null) ?? "not_started",
          payoutEmail: payoutResult.data?.payout_email ?? "",
          payoutCountry: payoutResult.data?.country ?? "US",
        });
        setProfile(nextProfile);
        writeStoredAccountProfile(nextProfile);
      } catch {
        // Settings stay usable locally if the profile tables are not deployed yet.
      }
    };

    loadProfile();

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
    const nextReadiness = getFinderReadiness(nextProfile);

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

    if (nextProfile.payoutEmail.trim() && !emailPattern.test(nextProfile.payoutEmail.trim())) {
      setSaveError("Enter a valid contact email or leave it blank.");
      return;
    }

    setSaving(true);
    writeStoredAccountProfile(nextProfile);
    setProfile(nextProfile);

    try {
      if (supabase) {
        const user = await getCurrentSupabaseUser();
        const profileResult = await supabase.from("profiles").upsert({
          id: user.id,
          display_name: nextProfile.displayName.trim(),
          handle: nextProfile.handle.trim(),
          account_type: nextProfile.accountType,
          region: nextProfile.region.trim(),
          specialty: nextProfile.specialty.trim(),
          identity_status: nextProfile.identityStatus,
          profile_completed_at: nextReadiness.score >= 75 ? new Date().toISOString() : null,
        });

        if (profileResult.error) {
          throw profileResult.error;
        }

        if (nextProfile.payoutEmail.trim()) {
          const payoutResult = await supabase.from("finder_payout_profiles").upsert({
            user_id: user.id,
            payout_email: nextProfile.payoutEmail.trim(),
            country: nextProfile.payoutCountry.trim() || "US",
            status: nextProfile.identityStatus === "verified" ? "ready" : "details_saved",
            terms_accepted_at: new Date().toISOString(),
          });

          if (payoutResult.error) {
            throw payoutResult.error;
          }
        }
      }

      setSaveStatus("Account settings saved. Helper readiness has been updated.");
    } catch {
      setSaveStatus("Saved locally. Apply the profile migration before relying on server-side readiness.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="route-page dashboard-page" aria-labelledby="settings-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Account settings</p>
          <h1 id="settings-title">Set up your profile</h1>
          <p>Keep your name and contact details up to date.</p>
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
            <input value={profile.handle} placeholder="camera-scout" onChange={(event) => updateProfile({ handle: event.target.value })} />
          </label>
          <label>
            Account type
            <select value={profile.accountType} onChange={(event) => updateProfile({ accountType: event.target.value as AuthAccountType })}>
              <option value="both">Requester and helper</option>
              <option value="poster">Requester only</option>
              <option value="finder">Helper only</option>
            </select>
          </label>
          <label>
            Region
            <input value={profile.region} placeholder="US, Canada, Japan proxy, local NYC..." onChange={(event) => updateProfile({ region: event.target.value })} />
          </label>
          <label>
            Sourcing focus
            <textarea value={profile.specialty} placeholder="Rare camera gear, discontinued mugs, local estate sales, repair donor units..." onChange={(event) => updateProfile({ specialty: event.target.value })} />
          </label>
          <label>
            Contact email
            <input type="email" value={profile.payoutEmail} placeholder="you@example.com" onChange={(event) => updateProfile({ payoutEmail: event.target.value })} />
          </label>
          <label>
            Country
            <input value={profile.payoutCountry} placeholder="US" onChange={(event) => updateProfile({ payoutCountry: event.target.value })} />
          </label>
          <label>
            Trust review status
            <select value={profile.identityStatus} onChange={(event) => updateProfile({ identityStatus: event.target.value as FinderIdentityStatus })}>
              <option value="not_started">Not started</option>
              <option value="review_requested">Review requested</option>
              <option value="verified" disabled>Verified by review</option>
            </select>
          </label>
          <label>
            Notification email
            <input type="email" value={profile.notificationEmail} placeholder="you@example.com" onChange={(event) => updateProfile({ notificationEmail: event.target.value })} />
          </label>
          {saveError ? <p className="dialog-error" role="alert">{saveError}</p> : null}
          {saveStatus ? <p className="dialog-success" role="status">{saveStatus}</p> : null}
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </button>
        </form>
      </section>
    </main>
  );
}

function AdminReviewPage() {
  const currencyPreference = useCurrencyPreference();
  const [payoutCases, setPayoutCases] = useState<FinderPayoutCaseRow[]>([]);
  const [disputes, setDisputes] = useState<SourceDisputeRow[]>([]);
  const [duplicateFlags, setDuplicateFlags] = useState<SourceDuplicateFlagRow[]>([]);
  const [caseNotes, setCaseNotes] = useState<Record<string, string>>({});
  const [caseTransferRefs, setCaseTransferRefs] = useState<Record<string, string>>({});
  const [disputeNotes, setDisputeNotes] = useState<Record<string, string>>({});
  const [duplicateNotes, setDuplicateNotes] = useState<Record<string, string>>({});
  const [actingPayoutCaseId, setActingPayoutCaseId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminConfigured, setAdminConfigured] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [loading, setLoading] = useState(Boolean(supabase));

  const loadAdminQueues = async () => {
    if (!supabase) {
      setLoading(false);
      setAdminError("Sign in is not available right now.");
      return;
    }

    setLoading(true);
    setAdminError("");
    setAdminMessage("");

    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch("/api/admin/payout-cases", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const payload = (await response.json()) as AdminPayoutQueuesResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Could not load admin queue.");
      }

      setPayoutCases(payload.payoutCases ?? []);
      setDisputes(payload.disputes ?? []);
      setDuplicateFlags(payload.duplicateFlags ?? []);
      setAdminEmail(payload.admin?.email ?? "");
      setAdminConfigured(Boolean(payload.admin?.configured));

      if (!payload.admin?.configured) {
        setAdminMessage("Admin role comes from Supabase app metadata. Add ADMIN_EMAILS to allowlist admin emails.");
      }
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not load admin queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminQueues();
  }, []);

  const runPayoutAction = async (payoutCase: FinderPayoutCaseRow, action: "hold" | "processing" | "paid" | "note") => {
    setActingPayoutCaseId(`payout:${payoutCase.id}:${action}`);
    setAdminError("");
    setAdminMessage("");

    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch("/api/admin/payout-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          payoutCaseId: payoutCase.id,
          action,
          adminNote: caseNotes[payoutCase.id] ?? "",
          processor: action === "paid" ? "manual" : undefined,
          processorTransferId: action === "paid" ? caseTransferRefs[payoutCase.id] ?? "" : undefined,
        }),
      });
      const payload = (await response.json()) as AdminPayoutQueuesResponse;

      if (!response.ok || !payload.payoutCase) {
        throw new Error(payload.error || "Could not update review case.");
      }

      setPayoutCases((current) => current.map((entry) => (entry.id === payload.payoutCase?.id ? payload.payoutCase : entry)));
      setCaseNotes((current) => ({ ...current, [payoutCase.id]: "" }));
      setAdminMessage(`Review case updated to ${payload.payoutCase.status.replace(/_/g, " ")}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not update review case.");
    } finally {
      setActingPayoutCaseId("");
    }
  };

  const runDisputeAction = async (dispute: SourceDisputeRow, action: "needs_evidence" | "finder_wins" | "poster_wins" | "closed" | "note") => {
    setActingPayoutCaseId(`dispute:${dispute.id}:${action}`);
    setAdminError("");
    setAdminMessage("");

    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch("/api/admin/payout-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          caseType: "source_dispute",
          disputeId: dispute.id,
          action,
          resolutionNote: disputeNotes[dispute.id] ?? "",
        }),
      });
      const payload = (await response.json()) as AdminPayoutQueuesResponse;

      if (!response.ok || !payload.dispute) {
        throw new Error(payload.error || "Could not update source dispute.");
      }

      setDisputes((current) => current.map((entry) => (entry.id === payload.dispute?.id ? payload.dispute : entry)));
      setPayoutCases((current) =>
        current.map((entry) => {
          if (entry.submission_id !== payload.dispute?.submission_id) {
            return entry;
          }

          if (action === "finder_wins") {
            return { ...entry, status: "hold", admin_note: "Review marked complete for helper source." };
          }

          if (action === "poster_wins") {
            return { ...entry, status: "cancelled", admin_note: "Review marked complete for requester concern." };
          }

          if (action === "needs_evidence") {
            return { ...entry, status: "disputed", admin_note: "Review needs more evidence before the source suggestion is trusted." };
          }

          return entry;
        }),
      );
      setDisputeNotes((current) => ({ ...current, [dispute.id]: "" }));
      setAdminMessage(`Source dispute updated to ${payload.dispute.status.replace(/_/g, " ")}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not update source dispute.");
    } finally {
      setActingPayoutCaseId("");
    }
  };

  const runDuplicateFlagAction = async (duplicateFlag: SourceDuplicateFlagRow, action: "reviewed" | "linked" | "dismissed" | "note") => {
    setActingPayoutCaseId(`duplicate:${duplicateFlag.id}:${action}`);
    setAdminError("");
    setAdminMessage("");

    try {
      const accessToken = await getSupabaseAccessToken();
      const response = await fetch("/api/admin/payout-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          caseType: "duplicate_source",
          duplicateFlagId: duplicateFlag.id,
          action,
          adminNote: duplicateNotes[duplicateFlag.id] ?? "",
        }),
      });
      const payload = (await response.json()) as AdminPayoutQueuesResponse;

      if (!response.ok || !payload.duplicateFlag) {
        throw new Error(payload.error || "Could not update duplicate source flag.");
      }

      setDuplicateFlags((current) => current.map((entry) => (entry.id === payload.duplicateFlag?.id ? payload.duplicateFlag : entry)));
      setDuplicateNotes((current) => ({ ...current, [duplicateFlag.id]: "" }));
      setAdminMessage(`Duplicate source flag updated to ${payload.duplicateFlag.status.replace(/_/g, " ")}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Could not update duplicate source flag.");
    } finally {
      setActingPayoutCaseId("");
    }
  };

  const actionablePayouts = payoutCases.filter((payoutCase) => ["payable", "hold", "disputed", "processing"].includes(payoutCase.status));
  const openDisputes = disputes.filter((dispute) => ["open", "needs_evidence"].includes(dispute.status));
  const openDuplicateFlags = duplicateFlags.filter((duplicateFlag) => duplicateFlag.status === "open");

  return (
    <main className="route-page dashboard-page" aria-labelledby="admin-review-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Admin review</p>
          <h1 id="admin-review-title">Admin queue.</h1>
          <p>Handle reviews, disputes, and duplicate sources.</p>
        </div>
      </section>
      {loading ? <p className="dialog-note">Loading admin queue...</p> : null}
      {adminError ? <p className="dialog-error" role="alert">{adminError}</p> : null}
      {adminMessage ? <p className="dialog-note" role="status">{adminMessage}</p> : null}
      <section className="metric-grid">
        <Metric icon={Banknote} label="Review cases" value={String(actionablePayouts.length)} />
        <Metric icon={Scale} label="Open disputes" value={String(openDisputes.length)} />
        <Metric icon={Flag} label="Duplicate flags" value={String(openDuplicateFlags.length)} />
        <Metric icon={ShieldAlert} label="Admin API" value={adminConfigured || adminEmail ? "Active" : "Locked"} />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Review cases</h2>
            <button className="icon-button" type="button" aria-label="Refresh admin queue" onClick={() => void loadAdminQueues()}>
              <TimerReset size={18} />
            </button>
          </div>
          {payoutCases.length ? (
            <div className="payout-case-list">
              {payoutCases.slice(0, 8).map((payoutCase) => {
                const note = caseNotes[payoutCase.id] ?? "";
                const transferRef = caseTransferRefs[payoutCase.id] ?? "";
                const isActing = actingPayoutCaseId.startsWith(`payout:${payoutCase.id}:`);
                const canProcess = ["payable", "hold", "disputed"].includes(payoutCase.status);
                const canHold = !["hold", "paid", "cancelled", "refunded"].includes(payoutCase.status);
                const canRecordPaid = false;

                return (
                  <div className="payout-case-row" key={payoutCase.id}>
                    <span>
                      <strong>{formatUsdMoney(payoutCase.amount, currencyPreference)}</strong>
                      {payoutCase.status.replace(/_/g, " ")}
                    </span>
                      <small>{payoutCase.release_after ? `Review window ${getRelativeTimeLabel(payoutCase.release_after)}` : "No review window"}</small>
                    {payoutCase.processor_transfer_id ? <em>Transfer ref: {payoutCase.processor_transfer_id}</em> : null}
                    {payoutCase.admin_note ? <em>{payoutCase.admin_note}</em> : null}
                    <div className="admin-payout-controls">
                      <label>
                        Staff note
                        <textarea
                          value={note}
                          placeholder="Why this action is correct"
                          onChange={(event) => setCaseNotes((current) => ({ ...current, [payoutCase.id]: event.target.value }))}
                        />
                      </label>
                      <label>
                        Reference
                        <input
                          value={transferRef}
                          placeholder="Reference or transfer id"
                          onChange={(event) => setCaseTransferRefs((current) => ({ ...current, [payoutCase.id]: event.target.value }))}
                        />
                      </label>
                      <div className="admin-action-row">
                        <button type="button" disabled={isActing || !note.trim()} onClick={() => void runPayoutAction(payoutCase, "note")}>
                          <FileText size={16} /> Save note
                        </button>
                        <button type="button" disabled={isActing || !canHold || !note.trim()} onClick={() => void runPayoutAction(payoutCase, "hold")}>
                          <ShieldAlert size={16} /> Hold
                        </button>
                        <button type="button" disabled={isActing || !canProcess} onClick={() => void runPayoutAction(payoutCase, "processing")}>
                          <Clock3 size={16} /> Processing
                        </button>
                        <button type="button" disabled={isActing || !canRecordPaid || !transferRef.trim()} onClick={() => void runPayoutAction(payoutCase, "paid")}>
                          <CheckCircle2 size={16} /> Paid (inactive)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Banknote size={26} />
              <strong>No active review cases</strong>
            </div>
          )}
        </div>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Source disputes</h2>
            <Scale size={20} />
          </div>
          {disputes.length ? (
            <div className="payout-case-list">
              {disputes.slice(0, 8).map((dispute) => {
                const note = disputeNotes[dispute.id] ?? "";
                const isActing = actingPayoutCaseId.startsWith(`dispute:${dispute.id}:`);
                const isResolved = ["finder_wins", "poster_wins", "closed"].includes(dispute.status);

                return (
                  <div className="payout-case-row" key={dispute.id}>
                    <span>
                      <strong>{dispute.reason_code.replace(/-/g, " ")}</strong>
                      {dispute.status.replace(/_/g, " ")} · {dispute.opened_by_role}
                    </span>
                    <small>{dispute.evidence_summary.slice(0, 140) || "No evidence summary"}</small>
                    {dispute.resolution_note ? <em>{dispute.resolution_note}</em> : null}
                    <div className="admin-payout-controls">
                      <label>
                        Resolution note
                        <textarea
                          value={note}
                          placeholder="What staff reviewed and why this decision is correct"
                          onChange={(event) => setDisputeNotes((current) => ({ ...current, [dispute.id]: event.target.value }))}
                        />
                      </label>
                      <div className="admin-action-row">
                        <button type="button" disabled={isActing || !note.trim()} onClick={() => void runDisputeAction(dispute, "note")}>
                          <FileText size={16} /> Save note
                        </button>
                        <button type="button" disabled={isActing || isResolved || !note.trim()} onClick={() => void runDisputeAction(dispute, "needs_evidence")}>
                          <CircleHelp size={16} /> Need evidence
                        </button>
                        <button type="button" disabled={isActing || isResolved || !note.trim()} onClick={() => void runDisputeAction(dispute, "finder_wins")}>
                          <Trophy size={16} /> Helper source valid
                        </button>
                        <button type="button" disabled={isActing || isResolved || !note.trim()} onClick={() => void runDisputeAction(dispute, "poster_wins")}>
                          <CheckCircle2 size={16} /> Requester concern valid
                        </button>
                        <button type="button" disabled={isActing || isResolved || !note.trim()} onClick={() => void runDisputeAction(dispute, "closed")}>
                          <X size={16} /> Close
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Scale size={26} />
              <strong>No disputes visible</strong>
            </div>
          )}
        </div>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Duplicate sources</h2>
            <Flag size={20} />
          </div>
          {duplicateFlags.length ? (
            <div className="payout-case-list">
              {duplicateFlags.slice(0, 8).map((duplicateFlag) => {
                const note = duplicateNotes[duplicateFlag.id] ?? "";
                const isActing = actingPayoutCaseId.startsWith(`duplicate:${duplicateFlag.id}:`);
                const isClosed = ["linked", "dismissed"].includes(duplicateFlag.status);

                return (
                  <div className="payout-case-row" key={duplicateFlag.id}>
                    <span>
                      <strong>{duplicateFlag.source_type.replace(/-/g, " ")}</strong>
                      {duplicateFlag.status.replace(/_/g, " ")}
                    </span>
                    <small>{duplicateFlag.normalized_source || "No public source identity saved"}</small>
                    {duplicateFlag.admin_note ? <em>{duplicateFlag.admin_note}</em> : null}
                    <div className="admin-payout-controls">
                      <label>
                        Duplicate review note
                        <textarea
                          value={note}
                          placeholder="How staff decided source priority or why this signal is not a duplicate"
                          onChange={(event) => setDuplicateNotes((current) => ({ ...current, [duplicateFlag.id]: event.target.value }))}
                        />
                      </label>
                      <div className="admin-action-row">
                        <button type="button" disabled={isActing || !note.trim()} onClick={() => void runDuplicateFlagAction(duplicateFlag, "note")}>
                          <FileText size={16} /> Save note
                        </button>
                        <button type="button" disabled={isActing || isClosed || !note.trim()} onClick={() => void runDuplicateFlagAction(duplicateFlag, "reviewed")}>
                          <Clock3 size={16} /> Reviewed
                        </button>
                        <button type="button" disabled={isActing || isClosed || !note.trim()} onClick={() => void runDuplicateFlagAction(duplicateFlag, "linked")}>
                          <LinkIcon size={16} /> Link earlier source
                        </button>
                        <button type="button" disabled={isActing || isClosed || !note.trim()} onClick={() => void runDuplicateFlagAction(duplicateFlag, "dismissed")}>
                          <X size={16} /> Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Flag size={26} />
              <strong>No duplicate source flags</strong>
              <span>Exact source collisions are logged here so staff can preserve first-valid-source priority.</span>
            </div>
          )}
        </div>
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
  __bountyMarketplaceRoot?: ReturnType<typeof createRoot>;
};

const rootElement = document.getElementById("root")!;
const rootWindow = window as RootWindow;
const root = rootWindow.__bountyMarketplaceRoot ?? createRoot(rootElement);

rootWindow.__bountyMarketplaceRoot = root;
root.render(
  <>
    <App />
    <Analytics />
    <AppReadyMarker />
  </>,
);
