import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Session } from "@supabase/supabase-js";
import { Analytics } from "@vercel/analytics/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  CreditCard,
  ExternalLink,
  FileText,
  Filter,
  Flag,
  Globe2,
  Headphones,
  ImagePlus,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  PackageCheck,
  Scale,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Star,
  Store,
  TimerReset,
  Trophy,
  Upload,
  X,
} from "lucide-react";
import { hasSupabaseEnv, supabase } from "./lib/supabase";
import "./styles.css";

type Page =
  | "landing"
  | "auth"
  | "post-describe"
  | "post-reward"
  | "post-pay"
  | "browse"
  | "browse-all"
  | "bounty-detail"
  | "submit-find"
  | "poster-dashboard"
  | "finder-dashboard"
  | "dispute"
  | "profile"
  | "faq"
  | "privacy"
  | "terms"
  | "refunds"
  | "rules"
  | "support"
  | "report"
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

type RequestCategory = "home" | "audio" | "camera" | "watch" | "gaming" | "parts";
type RequestDuration = 14 | 30 | 60;
type ReferenceImageDraft = {
  file: File;
  name: string;
  url: string;
};

type PostDraft = {
  itemName: string;
  category: RequestCategory;
  details: string;
  referenceImages: ReferenceImageDraft[];
  reward: number;
  durationDays: RequestDuration;
};

type FindSourceType = "source-link" | "private-source" | "finder-has-it";

type PaymentBreakdown = {
  reward: number;
  platformFee: number;
  protection: number;
  platformShare: number;
  total: number;
};

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
const defaultSeoDescription =
  "pleasefindmethis.com helps people find sold-out, rare, vintage, and hard-to-find items by posting a request and offering a finder reward.";
const defaultSocialDescription = "Post what you want. Add a reward. Real finders send links and leads to help you buy it.";
const organizationLogo = `${siteOrigin}/magnifying-glass.png`;
const defaultSeoImage = `${siteOrigin}/og/pleasefindmethis-vintage-tee-fullscreen-v3.png`;
const requestSingular = "request";
const requestPlural = "requests";
const checkoutRequestTimeoutMs = 25000;
const minimumReward = 10;
const platformServiceFeeRate = 0.12;
const trustProtectionRate = 0.03;
const minimumPlatformFee = 6;
const minimumTrustProtectionFee = 1;

const requestCategories: Array<{ value: RequestCategory; label: string }> = [
  { value: "home", label: "Home goods" },
  { value: "audio", label: "Portable audio" },
  { value: "camera", label: "Camera gear" },
  { value: "watch", label: "Watches" },
  { value: "gaming", label: "Gaming" },
  { value: "parts", label: "Replacement parts" },
];

const initialPostDraft: PostDraft = {
  itemName: "Help me find this art",
  category: "home",
  details: "",
  referenceImages: [],
  reward: 180,
  durationDays: 30,
};

const findSourceOptions: Array<{ value: FindSourceType; label: string; copy: string }> = [
  {
    value: "source-link",
    label: "I found a link or listing",
    copy: "Use this when the poster can review a public marketplace, store, auction, or product page.",
  },
  {
    value: "private-source",
    label: "A friend, shop, or local source has it",
    copy: "Use this when there is no public link, but you can connect the poster with the source.",
  },
  {
    value: "finder-has-it",
    label: "I have it",
    copy: "Use this when you personally have access to the item and want the poster to contact you.",
  },
];

const protectedPages = new Set<Page>([
  "post-describe",
  "post-reward",
  "post-pay",
  "submit-find",
  "poster-dashboard",
  "finder-dashboard",
  "dispute",
  "account-settings",
  "admin-review",
]);

const pageLabels: Record<Page, string> = {
  landing: "Landing page",
  auth: "Sign up / Log in",
  "post-describe": "Post Request - Describe",
  "post-reward": "Post Request - Set offer",
  "post-pay": "Post Request - Pay",
  browse: "Browse feed",
  "browse-all": "Browse all",
  "bounty-detail": "Request detail",
  "submit-find": "Submit a source",
  "poster-dashboard": "Poster dashboard",
  "finder-dashboard": "Finder dashboard",
  dispute: "Dispute",
  profile: "Public profile / Trust",
  faq: "FAQ",
  privacy: "Privacy Policy",
  terms: "Terms",
  refunds: "Refunds",
  rules: "Marketplace Rules",
  support: "Support",
  report: "Report",
  "account-settings": "Account settings",
  "admin-review": "Admin review",
  "not-found": "Not found",
};

const routeMap: Record<string, Page> = {
  "": "landing",
  "/": "landing",
  landing: "landing",
  auth: "auth",
  "post/describe": "post-describe",
  "post/offer": "post-reward",
  "post/reward": "post-reward",
  "post/pay": "post-pay",
  browse: "browse",
  "browse/all": "browse-all",
  "bounty/detail": "bounty-detail",
  "submit-find": "submit-find",
  "poster-dashboard": "poster-dashboard",
  "finder-dashboard": "finder-dashboard",
  dispute: "dispute",
  profile: "profile",
  faq: "faq",
  privacy: "privacy",
  terms: "terms",
  refunds: "refunds",
  rules: "rules",
  support: "support",
  report: "report",
  "account/settings": "account-settings",
  "admin/review": "admin-review",
};

const pageRoutes: Record<Page, string> = {
  landing: "/",
  auth: "auth",
  "post-describe": "post/describe",
  "post-reward": "post/offer",
  "post-pay": "post/pay",
  browse: "browse",
  "browse-all": "browse/all",
  "bounty-detail": "bounty/detail",
  "submit-find": "submit-find",
  "poster-dashboard": "poster-dashboard",
  "finder-dashboard": "finder-dashboard",
  dispute: "dispute",
  profile: "profile",
  faq: "faq",
  privacy: "privacy",
  terms: "terms",
  refunds: "refunds",
  rules: "rules",
  support: "support",
  report: "report",
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
  "faq",
  "privacy",
  "terms",
  "refunds",
  "rules",
  "support",
  "report",
]);

const pageSeoCopy: Record<Page, { title: string; description: string; socialDescription?: string }> = {
  landing: {
    title: "Find Sold-Out, Rare, and Vintage Items",
    description: defaultSeoDescription,
    socialDescription: defaultSocialDescription,
  },
  auth: {
    title: "Sign In | pleasefindmethis.com",
    description: "Sign in to post requests, submit sources, manage payouts, and review protected leads on pleasefindmethis.com.",
  },
  "post-describe": {
    title: "Post a Hard-to-Find Item Request | pleasefindmethis.com",
    description: "Describe the item you cannot find, add reference photos, and prepare a protected offer for expert finders.",
  },
  "post-reward": {
    title: "Set a Finder Offer | pleasefindmethis.com",
    description: "Choose the payout that a finder can earn after submitting a valid source for your hard-to-find item.",
  },
  "post-pay": {
    title: "Fund a Protected Request | pleasefindmethis.com",
    description: "Securely fund your request before it goes live so finders know the offer is real.",
  },
  browse: {
    title: "Featured Hard-to-Find Item Requests | pleasefindmethis.com",
    description: "Browse funded requests for rare, sold-out, discontinued, vintage, and replacement items that expert finders can help source.",
  },
  "browse-all": {
    title: "Browse All Find Requests | pleasefindmethis.com",
    description: "Search open find requests by item, category, reward, and location, then submit a protected source when you know where to find it.",
  },
  "bounty-detail": {
    title: "Find Request Details | pleasefindmethis.com",
    description: "Review the item details, must-have criteria, finder payout, and source timeline for this protected find request.",
  },
  "submit-find": {
    title: "Submit a Protected Source | pleasefindmethis.com",
    description: "Submit a store link, seller contact, local lead, or handoff option for a funded request.",
  },
  "poster-dashboard": {
    title: "Poster Dashboard | pleasefindmethis.com",
    description: "Review protected sources, reveal leads, accept matches, and manage funded requests.",
  },
  "finder-dashboard": {
    title: "Finder Dashboard | pleasefindmethis.com",
    description: "Find active opportunities, submit sources, and track protected source reviews.",
  },
  dispute: {
    title: "Open a Source Dispute | pleasefindmethis.com",
    description: "Open a dispute when a revealed source, contact, proof package, or handoff does not match the funded request.",
  },
  profile: {
    title: "Finder Trust Profile Example | pleasefindmethis.com",
    description: "See how finder ratings, accepted sources, verification, and review history build trust on pleasefindmethis.com.",
  },
  faq: {
    title: "FAQ for Posters and Finders | pleasefindmethis.com",
    description: "Answers about payments, refunds, protected sources, finder payouts, public browsing, disputes, and how pleasefindmethis.com works.",
  },
  privacy: {
    title: "Privacy Policy | pleasefindmethis.com",
    description: "How pleasefindmethis.com handles account, request, source, image, support, and payment-related data.",
  },
  terms: {
    title: "Terms of Service | pleasefindmethis.com",
    description: "Marketplace terms for posters, finders, funded offers, protected sources, reviews, and payouts.",
  },
  refunds: {
    title: "Refund and Cancellation Policy | pleasefindmethis.com",
    description: "How funded offers, service fees, failed finds, disputes, and refund reviews work on pleasefindmethis.com.",
  },
  rules: {
    title: "Marketplace Rules | pleasefindmethis.com",
    description: "Rules for what can be posted, what finders can submit, and what conduct is not allowed.",
  },
  support: {
    title: "Support for Requests, Sources, and Payouts | pleasefindmethis.com",
    description: "Get help with account access, checkout issues, source review, disputes, refunds, payout holds, and safety concerns.",
  },
  report: {
    title: "Report a Listing, Source, or User | pleasefindmethis.com",
    description: "Report fraud, unsafe requests, prohibited goods, stolen images, impersonation, spam, or abusive behavior.",
  },
  "account-settings": {
    title: "Account Settings | pleasefindmethis.com",
    description: "Manage account access, privacy requests, notifications, and data requests.",
  },
  "admin-review": {
    title: "Admin Review Queue | pleasefindmethis.com",
    description: "Operational review queue for disputes, reports, payout holds, refunds, and source moderation.",
  },
  "not-found": {
    title: "Page Not Found | pleasefindmethis.com",
    description: "The page may be outdated, private, or typed incorrectly.",
  },
};

const signedInStorageKey = "pleasefindmethis-signed-in";
const pendingRouteStorageKey = "pleasefindmethis-pending-route";
const authProviderStorageKey = "pleasefindmethis-auth-provider";
const authEmailStorageKey = "pleasefindmethis-auth-email";
const checkoutSnapshotStorageKey = "pleasefindmethis-last-checkout";
const requestReferenceImagesBucket = "request-reference-images";
const sourceSubmissionProofBucket = "source-submission-proof";
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
  "Help me find this cat mug",
  "Find this old wallet",
  "I can add an offer",
  "Help me find this pillow",
  "Find this exact wall art",
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

function useViewerCurrencyPreference() {
  const [preference, setPreference] = useState<CurrencyPreference>(() => resolveInitialCurrencyPreference());

  useEffect(() => {
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
  }, [preference.currency]);

  useEffect(() => {
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
  }, []);

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

function formatBountyDetail(bounty: BountyListing, preference: CurrencyPreference) {
  const rewardText = formatUsdMoney(bounty.rewardValue, preference, { compact: true });
  return bounty.detail.replace(/(?:US\$|\$|£|€)\s?[\d,]+/g, rewardText);
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
  return firstImage?.url || "/find-requests/duck-wall-art.jpg";
}

function getMustHaves(details?: string | null) {
  const parts = (details ?? "")
    .split(/\n|\.|;/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  return parts.length
    ? parts
    : ["Exact match preferred", "Clear source or contact path", "Availability should be current", "Proof helps review faster"];
}

function publicRequestRowToBounty(row: PublicRequestCardRow): BountyListing {
  const details = row.details?.trim() || "Finder can submit a public listing, shop contact, private lead, or direct handoff option.";
  const rewardText = `US$${row.reward.toLocaleString("en-US")}`;

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: `Finder payout ${rewardText}`,
    reward: rewardText,
    rewardValue: row.reward,
    closes: getClosesLabel(row.days_remaining),
    image: row.primary_image_url || "/find-requests/duck-wall-art.jpg",
    category: row.category || "General",
    status: getStatusLabel(row.status, row.payment_status),
    location: "Open to submitted sources",
    poster: "Verified poster",
    posted: getRelativeTimeLabel(row.created_at),
    submissions: row.submission_count ?? 0,
    description: details,
    mustHaves: getMustHaves(details),
    timeline: ["Offer funded", `${row.submission_count ?? 0} protected source${row.submission_count === 1 ? "" : "s"}`, "Finders can submit leads"],
    live: true,
    createdAt: row.created_at,
    closesAt: row.closes_at ?? undefined,
  };
}

function requestRowToBounty(row: RequestRow, submissionCount = 0): BountyListing {
  const rewardText = `US$${row.reward.toLocaleString("en-US")}`;
  const createdAt = row.created_at;
  const paidAt = row.paid_at;

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: `Finder payout ${rewardText}`,
    reward: rewardText,
    rewardValue: row.reward,
    closes: `${row.duration_days} days`,
    image: getReferenceImage(row.reference_images),
    category: row.category || "General",
    status: getStatusLabel(row.status, row.payment_status),
    location: "Open to submitted sources",
    poster: "You",
    posted: getRelativeTimeLabel(paidAt ?? createdAt),
    submissions: submissionCount,
    description: row.details?.trim() || "No additional details provided.",
    mustHaves: getMustHaves(row.details),
    timeline: [
      row.payment_status === "paid" ? "Payment confirmed" : "Checkout pending",
      `${submissionCount} protected source${submissionCount === 1 ? "" : "s"}`,
      row.payout_status === "payable" ? "Finder payout is payable" : "Awaiting accepted source",
    ],
    live: row.payment_status === "paid",
    createdAt,
  };
}

function mergeBounties(primary: BountyListing[], fallback: BountyListing[]) {
  const seen = new Set<string>();
  const merged: BountyListing[] = [];

  for (const bounty of [...primary, ...fallback]) {
    if (seen.has(bounty.id)) {
      continue;
    }

    seen.add(bounty.id);
    merged.push(bounty);
  }

  return merged;
}

function usePublicRequestListings() {
  const [listings, setListings] = useState<BountyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadRequests = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/requests/public", {
          headers: {
            Accept: "application/json",
          },
        });
        const payload = (await response.json()) as { requests?: PublicRequestCardRow[]; error?: string };

        if (!mounted) {
          return;
        }

        if (!response.ok || !Array.isArray(payload.requests)) {
          throw new Error(payload.error || "Live request feed is not ready yet.");
        }

        setListings(payload.requests.map(publicRequestRowToBounty));
      } catch {
        if (!mounted) {
          return;
        }

        setError("Live request feed is not ready yet.");
        setListings([]);
      }

      setLoading(false);
    };

    loadRequests();

    return () => {
      mounted = false;
    };
  }, []);

  return { listings, loading, error };
}

async function getCurrentSupabaseUser() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
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

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "proof-file";
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

function getOAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
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
    detail: "I can pay $50",
    reward: "US$50",
    rewardValue: 50,
    closes: "14 days",
    category: "Home goods",
    status: "Open",
    location: "Ships to United States",
    poster: "Rude E.",
    posted: "12 hours ago",
    submissions: 4,
    image: "/find-requests/childhood-blanket.jpg",
    description:
      "Help me find a replacement for this pink rose childhood blanket. It does not have to be new, just the same print.",
    mustHaves: ["Pink rose print", "Same soft blanket style", "Good photo of the match", "Seller or source link"],
    timeline: ["Offer funded", "Four people helping", "Latest lead received today"],
  },
  {
    id: "seiko-wired-w543",
    name: "Does anyone know this watch?",
    detail: "I can pay $20",
    reward: "US$20",
    rewardValue: 20,
    closes: "10 days",
    category: "Watches",
    status: "Open",
    location: "Worldwide",
    poster: "Common I.",
    posted: "13 hours ago",
    submissions: 2,
    image: "/find-requests/seiko-wired-watch.jpg",
    description:
      "Looking for this Seiko Wired W543-0AA0 or a close dupe. A shop link, model number, or used listing would help.",
    mustHaves: ["Digital Seiko Wired style", "Silver bracelet", "Clear listing photos", "Working condition preferred"],
    timeline: ["Offer funded", "Two leads received", "Model number being checked"],
  },
  {
    id: "yellow-stay-home-pillow",
    name: "Help me find this pillow",
    detail: "I will pay $35",
    reward: "US$35",
    rewardValue: 35,
    closes: "18 days",
    category: "Home goods",
    status: "Open",
    location: "United States",
    poster: "Lost K.",
    posted: "18 hours ago",
    submissions: 3,
    image: "/find-requests/yellow-home-pillow.jpg",
    description:
      "Trying to find the yellow Threshold pillow that says Let's Stay Home. A Target resale link is perfect.",
    mustHaves: ["Yellow lumbar pillow", "Let's Stay Home text", "Threshold or close match", "Seller can ship"],
    timeline: ["Offer funded", "Three people searching", "One similar listing reviewed"],
  },
  {
    id: "living-and-co-cat-mug",
    name: "Find this cat mug",
    detail: "I can pay $20",
    reward: "US$20",
    rewardValue: 20,
    closes: "7 days",
    category: "Kitchen",
    status: "Open",
    location: "New Zealand or ships worldwide",
    poster: "Bitter J.",
    posted: "2 hours ago",
    submissions: 0,
    image: "/find-requests/living-and-co-mug.jpg",
    description:
      "My mum gave me this Living & Co cat mug and I want another one. Please share any shop or resale listing.",
    mustHaves: ["Living & Co mug", "Black cat line art", "Same shape if possible", "Uncracked condition"],
    timeline: ["Offer funded", "New request", "Finders can submit links"],
  },
  {
    id: "duck-wall-art",
    name: "Help me find this art",
    detail: "I will give $50",
    reward: "US$50",
    rewardValue: 50,
    closes: "21 days",
    category: "Art & decor",
    status: "Found",
    location: "United States",
    poster: "Jack S.",
    posted: "2 days ago",
    submissions: 9,
    image: "/find-requests/duck-wall-art-reddit.jpg",
    description:
      "Looking for this silly framed duck art because we want one for our home. Any artist name or buying link helps.",
    mustHaves: ["Same duck artwork", "Artist or print source", "Framed or unframed is fine", "Clear buying link"],
    timeline: ["Offer funded", "Finder shared a source", "Source marked found"],
  },
  {
    id: "walkman-wmd6c",
    name: "Sony Walkman WM-D6C",
    detail: "Working recorder, serviced",
    reward: "US$360",
    rewardValue: 360,
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
    timeline: ["Offer funded", "New request", "Finders can submit leads"],
  },
  {
    id: "canon-eos-80d-kit",
    name: "Canon EOS 80D",
    detail: "Body with clean lens",
    reward: "US$420",
    rewardValue: 420,
    closes: "8 days",
    category: "Camera gear",
    status: "Finder in touch",
    location: "United States",
    poster: "Maya V.",
    posted: "5 days ago",
    submissions: 8,
    image:
      "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a clean Canon EOS 80D body with a working lens and recent test photos.",
    mustHaves: ["EOS 80D body", "Lens glass is clean", "Shutter count disclosed", "Recent test photo required"],
    timeline: ["Offer funded", "Finder shared two local options", "Shutter count requested"],
  },
  {
    id: "omega-speedmaster-125",
    name: "Omega Speedmaster",
    detail: "125th anniversary",
    reward: "£820",
    rewardValue: 1040,
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
    timeline: ["Offer funded", "Local source found in London", "Authenticity check underway"],
  },
  {
    id: "roland-juno-106",
    name: "Roland Juno-106",
    detail: "Voice board set",
    reward: "US$760",
    rewardValue: 760,
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
    timeline: ["Offer funded", "Synth forums contacted", "Awaiting test clips"],
  },
  {
    id: "cartier-tank-must",
    name: "Cartier Tank Must",
    detail: "Large black dial",
    reward: "€690",
    rewardValue: 740,
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
    timeline: ["Offer funded", "Three dealers contacted", "Waiting on papers"],
  },
  {
    id: "contax-t2-silver",
    name: "Contax T2",
    detail: "Silver point-and-shoot",
    reward: "US$620",
    rewardValue: 620,
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
    timeline: ["Offer funded", "Two leads rejected", "New photos requested"],
  },
  {
    id: "gameboy-micro-famicom",
    name: "Game Boy Micro",
    detail: "Famicom edition",
    reward: "US$410",
    rewardValue: 410,
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
    timeline: ["Offer funded", "Japan sellers contacted", "First lead under review"],
  },
  {
    id: "nakamichi-dragon-door",
    name: "Nakamichi Dragon",
    detail: "Cassette door assembly",
    reward: "US$390",
    rewardValue: 390,
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
    timeline: ["Offer funded", "New request", "Finders can submit parts"],
  },
  {
    id: "polaroid-sx70-brown",
    name: "Polaroid SX-70",
    detail: "Brown leather folder",
    reward: "US$335",
    rewardValue: 335,
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
    timeline: ["Offer funded", "Two leads received", "Waiting on sample photo"],
  },
  {
    id: "ipod-classic-7th",
    name: "iPod Classic",
    detail: "160GB silver",
    reward: "US$260",
    rewardValue: 260,
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
    timeline: ["Offer funded", "Five submissions", "Battery photos requested"],
  },
  {
    id: "canon-f1-new",
    name: "Canon New F-1",
    detail: "AE finder kit",
    reward: "US$245",
    rewardValue: 245,
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
    timeline: ["Offer funded", "Collector groups contacted", "Awaiting meter video"],
  },
  {
    id: "minidisc-mz-rh1",
    name: "Sony MZ-RH1",
    detail: "Hi-MD recorder",
    reward: "US$230",
    rewardValue: 230,
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
    timeline: ["Offer funded", "First lead received", "USB proof requested"],
  },
  {
    id: "dreamcast-seaman-mic",
    name: "Dreamcast Seaman",
    detail: "Mic bundle, complete",
    reward: "US$210",
    rewardValue: 210,
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
    timeline: ["Offer funded", "Two local stores checked", "One complete copy under review"],
  },
  {
    id: "technics-sl1200-dustcover",
    name: "Technics SL-1200",
    detail: "Original dust cover",
    reward: "US$190",
    rewardValue: 190,
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
    timeline: ["Offer funded", "DJ repair shops contacted", "Waiting on photos"],
  },
  {
    id: "pentax-67-wood-grip",
    name: "Pentax 67",
    detail: "Wood grip",
    reward: "US$175",
    rewardValue: 175,
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
    timeline: ["Offer funded", "Three leads received", "Best lead missing screw"],
  },
  {
    id: "n64-funtastic-ice-blue",
    name: "Nintendo 64",
    detail: "Ice blue Funtastic",
    reward: "US$165",
    rewardValue: 165,
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
    timeline: ["Offer funded", "Four sellers found", "Controller match pending"],
  },
  {
    id: "bose-aviation-a20",
    name: "Bose A20",
    detail: "Bluetooth aviation headset",
    reward: "US$540",
    rewardValue: 540,
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
    timeline: ["Offer funded", "Pilot group posted", "Two leads being checked"],
  },
  {
    id: "hasselblad-a12-back",
    name: "Hasselblad A12",
    detail: "Chrome film back",
    reward: "US$520",
    rewardValue: 520,
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
    timeline: ["Offer funded", "Five backs located", "Best one awaiting test roll"],
  },
  {
    id: "akg-k1000",
    name: "AKG K1000",
    detail: "Ear speaker set",
    reward: "US$505",
    rewardValue: 505,
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
    timeline: ["Offer funded", "Audiophile forum posted", "One lead needs channel test"],
  },
  {
    id: "neo-geo-pocket-color",
    name: "Neo Geo Pocket",
    detail: "Color anthracite",
    reward: "US$155",
    rewardValue: 155,
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
    timeline: ["Offer funded", "New request", "Finders can submit handhelds"],
  },
  {
    id: "aiwa-hs-px1000",
    name: "Aiwa HS-PX1000",
    detail: "Cassette player",
    reward: "US$330",
    rewardValue: 330,
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
    timeline: ["Offer funded", "One collector contacted", "Awaiting demo clip"],
  },
  {
    id: "voigtlander-40mm-nokton",
    name: "Voigtlander Nokton",
    detail: "40mm f/1.2 VM",
    reward: "US$315",
    rewardValue: 315,
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
    timeline: ["Offer funded", "Two listings reviewed", "Best lead awaiting glass photos"],
  },
];

const featuredBountyIds = [
  "childhood-rose-blanket",
  "yellow-stay-home-pillow",
  "living-and-co-cat-mug",
  "duck-wall-art",
];
const featuredBounties = featuredBountyIds
  .map((id) => bountyListings.find((bounty) => bounty.id === id))
  .filter((bounty): bounty is BountyListing => Boolean(bounty));
const rewardSortedBounties = [...bountyListings].sort((left, right) => right.rewardValue - left.rewardValue);
const browseFeaturedBounties = rewardSortedBounties.slice(0, 4);
const browseRemainingBounties = rewardSortedBounties.slice(4);

const problemItems = [
  {
    icon: Store,
    tag: "Near matches",
    title: "Search shows the wrong one",
    copy: "Google Lens gives you dupes, close matches, and things you do not want.",
  },
  {
    icon: Globe2,
    tag: "Hidden sellers",
    title: "The seller is somewhere else",
    copy: "The right shop, collector, or local listing may be outside your feed.",
  },
  {
    icon: Search,
    tag: "Dead links",
    title: "The good lead vanished",
    copy: "The one useful listing is sold out, archived, or gone before you can act.",
  },
  {
    icon: ShieldAlert,
    tag: "Risky DMs",
    title: "Paying strangers feels risky",
    copy: "Off-platform deals can cost you money and leave no useful record.",
  },
  {
    icon: Clock3,
    tag: "Search fatigue",
    title: "You are tired of looking",
    copy: "Stop opening the same bad results. Post one clear bounty instead.",
  },
];

const workSteps = [
  {
    icon: Search,
    title: "1. Fund a real request",
    copy: "Add photos, describe the exact item, and choose the payout for the right source.",
  },
  {
    icon: LockKeyhole,
    title: "2. Sources stay private first",
    copy: "Finders send a store link, seller contact, local lead, or handoff path. The full source is saved before reveal.",
  },
  {
    icon: BadgeCheck,
    title: "3. Reveal, check, and decide",
    copy: "Open the source, check the match, then accept it when it works. If it does not, give a clear reason.",
  },
];

const leftFindRequests = [
  {
    copy: "Please find me this old wallet.",
    image: "/find-requests/wallet.jpg",
  },
  {
    copy: "Offer if you find these black shoes.",
    image: "/find-requests/black-shoes.jpg",
  },
  {
    copy: "Can anyone help me find these coin earrings?",
    image: "/find-requests/coin-earrings.jpg",
  },
  {
    copy: "Please find me this dog bowl set.",
    image: "/find-requests/dog-bowls.jpg",
  },
  {
    copy: "Can anyone help me find this bunny plush?",
    image: "/find-requests/bunny-plush.jpg",
  },
  {
    copy: "Offer to help me find this rubber band.",
    image: "/find-requests/purple-rubber-band.jpg",
  },
  {
    copy: "Offer if you find this red taillight piece.",
    image: "/find-requests/red-taillight.jpg",
  },
  {
    copy: "Please find me this broken plate.",
    image: "/find-requests/broken-plate.jpg",
  },
];

const rightFindRequests = [
  {
    copy: "Can anyone help me find this floral skirt?",
    image: "/find-requests/floral-skirt.jpg",
  },
  {
    copy: "Please find me this toddler plushie.",
    image: "/find-requests/toddler-plush.jpg",
  },
  {
    copy: "Offer if you find this orange fox plush.",
    image: "/find-requests/fox-plush.jpg",
  },
  {
    copy: "Can anyone help me find this vintage 90s T-shirt?",
    image: "/find-requests/vintage-shirt.jpg",
  },
  {
    copy: "Please find me these celestial kitchen items.",
    image: "/find-requests/celestial-kitchen.jpg",
  },
  {
    copy: "Can anyone help me find this duck wall art?",
    image: "/find-requests/duck-wall-art.jpg",
  },
  {
    copy: "Please find me this Powerpuff Girls cup.",
    image: "/find-requests/powerpuff-cup.jpg",
  },
];

const mobileFindRequests = [...leftFindRequests, ...rightFindRequests];
const reversedMobileFindRequests = [...mobileFindRequests].reverse();

const safetySteps = [
  {
    icon: LockKeyhole,
    title: "Fund the finder payout",
    copy: "Your request goes live after checkout, so finders see there is money on the table.",
  },
  {
    icon: Search,
    title: "Source details stay private",
    copy: "The link, contact, notes, and proof are saved before you reveal the full source.",
  },
  {
    icon: ShieldCheck,
    title: "Reveal creates a record",
    copy: "When you open the full source, that moment is logged for both sides.",
  },
  {
    icon: CheckCircle2,
    title: "Accept or reject clearly",
    copy: "Accept a match. Reject only with a clear reason, like wrong item, sold out, bad condition, or price mismatch.",
  },
  {
    icon: Headphones,
    title: "Review handles disputes",
    copy: "If a revealed source is used or disputed, the saved record helps decide the payout.",
  },
];

const reviewProtectionSteps = [
  {
    icon: ShieldCheck,
    title: "The source is saved before reveal",
    copy: "The lead, notes, proof, and time submitted are kept so the story cannot change later.",
  },
  {
    icon: BadgeCheck,
    title: "First good lead gets priority",
    copy: "If two finders send the same source, the earlier valid submission gets priority.",
  },
  {
    icon: ShieldAlert,
    title: "Rejecting needs a real reason",
    copy: "Wrong item, unavailable, fake seller, bad condition, or price mismatch are examples of review reasons.",
  },
  {
    icon: Scale,
    title: "A used valid source can still be paid",
    copy: "If a poster reveals and uses a correct source, review can still release the payout to the finder.",
  },
];

const comparisonRows = [
  ["Funded offer before finder work", "Yes", "No", "No", "Maybe"],
  ["Source recorded before reveal", "Yes", "No", "No", "No"],
  ["Clear request brief with photos", "Yes", "Maybe", "No", "Maybe"],
  ["Duplicate lead priority", "Yes", "No", "No", "No"],
  ["Review trail if there is a dispute", "Yes", "No", "No", "Maybe"],
  ["Human sourcing beyond search results", "Yes", "Maybe", "Limited", "Maybe"],
];

const finderReviews = [
  ["Ari P.", "Maya found the exact cap in two days and included the seller link plus what to ask before buying."],
  ["Theo N.", "The source review made it easy to avoid a risky listing and choose the right part."],
  ["June R.", "The finder already had the lens and left an email so we could agree on shipping directly."],
];

const faqItems = [
  {
    question: "When do I pay?",
    answer:
      "You pay before the request goes live. Checkout shows the finder offer, platform service fee, and source review fee before you pay. The item itself, if any, is bought separately from the third-party source or seller.",
  },
  {
    question: "What happens if nobody finds it?",
    answer:
      "If the request is not fulfilled during the active request window, the funded finder offer can be returned under the refund policy. Service and source review fees cover the live request, payment handling, review tools, and support.",
  },
  {
    question: "Can I reject a find?",
    answer:
      "Yes. You can reject submissions that do not match your description, do not include enough source detail, or do not provide a clear contact path.",
  },
  {
    question: "How do finders get paid?",
    answer:
      "Finders can earn the posted payout when the source is accepted, the handoff is confirmed, or review resolves in their favor. We do not take a cut from the finder payout.",
  },
  {
    question: "How does pleasefindmethis make money?",
    answer:
      "Posters pay a 12% platform service fee plus a 3% payment handling and source review fee at checkout. The offer amount remains the finder payout.",
  },
  {
    question: "Does pleasefindmethis sell the requested item?",
    answer:
      "No. pleasefindmethis is not the seller, reseller, shipper, or broker of the requested item. The platform hosts the request, records protected source submissions, and supports source review.",
  },
  {
    question: "What requests are not allowed?",
    answer:
      "Requests for illegal goods, regulated or age-restricted goods, weapons, financial products, gift cards, tickets, personal data, stolen items, counterfeit documents, unsafe surveillance tools, or harassment are not allowed.",
  },
  {
    question: "Is the browse feed public?",
    answer:
      "Yes. Anyone can browse public requests and detail pages. Posting, submitting sources, dashboards, payment, and disputes require sign up or log in.",
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

function getInitialRoute(): Page {
  return parseRoute();
}

function getSeoMeta(page: Page, activeBounty?: BountyListing): SeoMeta {
  if (page === "bounty-detail" && activeBounty) {
    const description = `${activeBounty.description} Finder payout: ${activeBounty.reward}. ${activeBounty.category} request, ${activeBounty.closes} left.`;

    return {
      title: `${activeBounty.name} Find Request | ${siteName}`,
      description: description.slice(0, 240),
      path: getBountyPath(activeBounty.id, activeBounty.name),
      robots: activeBounty.live ? "index,follow" : "noindex,follow",
      image: toAbsoluteUrl(activeBounty.image),
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
        image: toAbsoluteUrl(bounty.image),
        url: getCanonicalUrl(getBountyPath(bounty.id, bounty.name)),
        additionalType: bounty.category,
      },
    })),
  };
}

function createStructuredData(page: Page, meta: SeoMeta, bounties: BountyListing[], activeBounty?: BountyListing) {
  const canonicalUrl = getCanonicalUrl(meta.path);
  const organizationId = `${siteOrigin}/#organization`;
  const websiteId = `${siteOrigin}/#website`;
  const webpageId = `${canonicalUrl}#webpage`;
  const webPageType = page === "support" ? "ContactPage" : "WebPage";
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
          contactType: "customer support",
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
    {
      "@type": webPageType,
      "@id": webpageId,
      url: canonicalUrl,
      name: meta.title,
      description: meta.description,
      isPartOf: { "@id": websiteId },
      publisher: { "@id": organizationId },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: meta.image,
      },
    },
  ];

  if (page === "landing" || page === "browse" || page === "browse-all") {
    graph.push(createItemListSchema(bounties, meta.path));
  }

  if (page === "faq") {
    graph.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  if (page === "bounty-detail" && activeBounty) {
    graph.push({
      "@type": "Thing",
      "@id": `${canonicalUrl}#request`,
      url: canonicalUrl,
      name: activeBounty.name,
      description: activeBounty.description,
      image: toAbsoluteUrl(activeBounty.image),
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
  setMetaTag("property", "og:image:alt", "A reward-style poster asking for help finding a vintage T-shirt with a protected source lead.");
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", meta.title);
  setMetaTag("name", "twitter:description", socialDescription);
  setMetaTag("name", "twitter:image", meta.image);
  setMetaTag("name", "twitter:image:alt", "A reward-style poster asking for help finding a vintage T-shirt with a protected source lead.");
  setCanonicalLink(canonicalUrl);
  setStructuredData(createStructuredData(page, meta, bounties, activeBounty));
}

function getCategoryLabel(category: RequestCategory) {
  return requestCategories.find((item) => item.value === category)?.label ?? "General";
}

function getPaymentBreakdown(reward: number): PaymentBreakdown {
  const normalizedReward = Math.max(minimumReward, Math.round(Number.isFinite(reward) ? reward : initialPostDraft.reward));
  const platformFee = Math.max(minimumPlatformFee, Math.round(normalizedReward * platformServiceFeeRate));
  const protection = Math.max(minimumTrustProtectionFee, Math.round(normalizedReward * trustProtectionRate));
  const platformShare = platformFee + protection;

  return {
    reward: normalizedReward,
    platformFee,
    protection,
    platformShare,
    total: normalizedReward + platformFee + protection,
  };
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
    return "Checkout is taking longer than expected. Please check your connection and try again.";
  }

  if (error instanceof Error) {
    const message = error.message || "Could not start secure checkout.";

    if (message.toLowerCase().includes("auth session missing")) {
      return "Sign in again before starting checkout.";
    }

    return message;
  }

  return "Could not start secure checkout.";
}

function App() {
  const currencyPreference = useViewerCurrencyPreference();
  const [route, setRoute] = useState<Page>(() => getInitialRoute());
  const [checkoutReturnStatus, setCheckoutReturnStatus] = useState<CheckoutReturnStatus>(() => parseCheckoutReturnStatus());
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(() => window.sessionStorage.getItem(signedInStorageKey) === "true");
  const [pendingRoute, setPendingRoute] = useState<Page>(() => readStoredPendingRoute());
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authBusyAction, setAuthBusyAction] = useState<AuthBusyAction>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [emailOtpSentTo, setEmailOtpSentTo] = useState("");
  const [postDraft, setPostDraft] = useState<PostDraft>(initialPostDraft);
  const [activeBountyId, setActiveBountyId] = useState(() => getBountyIdFromCurrentRoute() || bountyListings[0].id);
  const {
    listings: liveBounties,
    loading: publicRequestsLoading,
    error: publicRequestsError,
  } = usePublicRequestListings();
  const marketplaceBounties = useMemo(() => mergeBounties(liveBounties, bountyListings), [liveBounties]);

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

  const activeBounty = useMemo(
    () => marketplaceBounties.find((bounty) => bounty.id === activeBountyId) ?? marketplaceBounties[0] ?? bountyListings[0],
    [activeBountyId, marketplaceBounties],
  );

  const visibleRoute = !signedIn && protectedPages.has(route) ? "auth" : route;

  useEffect(() => {
    updateDocumentSeo(visibleRoute, marketplaceBounties, activeBounty);
  }, [activeBounty, marketplaceBounties, visibleRoute]);

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

  const scrollToLandingSection = (sectionId: string) => {
    setMenuOpen(false);
    if (route !== "landing") {
      navigate("landing");
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      setAuthMessage("Enter a valid email address.");
      return;
    }

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
        setAuthMessage(`We sent a 6-digit verification code to ${normalizedEmail}.`);
        return;
      }

      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        setEmailOtpSentTo(normalizedEmail);
        window.sessionStorage.setItem(authEmailStorageKey, normalizedEmail);
        setAuthMessage(`Local email verification is using demo code 123456 for ${normalizedEmail}.`);
        return;
      }

      throw new Error("Email verification needs VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Could not send the email verification code.");
    } finally {
      setAuthBusyAction(null);
    }
  };

  const verifyEmailAuthCode = async (code: string) => {
    const token = code.trim().replace(/\s+/g, "");

    setAuthMessage("");

    if (!emailOtpSentTo) {
      setAuthMessage("Send a verification code first.");
      return;
    }

    if (!/^\d{6}$/.test(token)) {
      setAuthMessage("Enter the 6-digit code from your email.");
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
        setAuthMessage("Google sign-in is ready. Add VITE_GOOGLE_CLIENT_ID or Supabase auth env vars for the real Google popup. Localhost is using a demo Google session.");
        markSignedIn("google-demo");
        return;
      }

      throw new Error("Google sign-in needs VITE_GOOGLE_CLIENT_ID or Supabase auth environment variables.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Google sign-in could not start.");
    } finally {
      setAuthBusyAction(null);
    }
  };

  const updatePostDraft = (updates: Partial<PostDraft>) => {
    setPostDraft((draft) => ({ ...draft, ...updates }));
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
      navigate(storedRoute);
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
    onLogOut: logOut,
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
          onFinders={() => requireAuth("finder-dashboard")}
          onLogin={() => {
            setPendingRoute("poster-dashboard");
            changeAuthMode("login");
            navigate("auth");
          }}
          onNavigate={navigate}
          onAccount={() => navigate("poster-dashboard")}
          onLogOut={logOut}
          onPost={() => requireAuth("post-describe")}
          onSection={scrollToLandingSection}
          setMenuOpen={setMenuOpen}
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
            <PostDescribePage draft={postDraft} onBack={() => navigate("landing")} onDraftChange={updatePostDraft} onNext={() => navigate("post-reward")} />
          ) : null}
          {visibleRoute === "post-reward" ? (
            <PostRewardPage draft={postDraft} onBack={() => navigate("post-describe")} onDraftChange={updatePostDraft} onNext={() => navigate("post-pay")} />
          ) : null}
          {visibleRoute === "post-pay" ? <PostPayPage checkoutReturnStatus={checkoutReturnStatus} draft={postDraft} onBack={() => navigate("post-reward")} /> : null}
          {visibleRoute === "browse" ? (
            <BrowsePage
              bounties={marketplaceBounties}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onBrowseAll={() => navigate("browse-all")}
              onDetail={goToDetail}
              onPost={() => requireAuth("post-describe")}
            />
          ) : null}
          {visibleRoute === "browse-all" ? (
            <BrowseAllPage
              bounties={marketplaceBounties}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onDetail={goToDetail}
              onPost={() => requireAuth("post-describe")}
            />
          ) : null}
          {visibleRoute === "bounty-detail" ? (
            <BountyDetailPage
              bounty={activeBounty}
              onBrowse={() => navigate("browse")}
              onPosterProfile={() => navigate("profile")}
              onSubmit={() => requireAuth("submit-find")}
            />
          ) : null}
          {visibleRoute === "submit-find" ? (
            <SubmitFindPage bounty={activeBounty} onBack={() => navigate("bounty-detail")} onDashboard={() => navigate("finder-dashboard")} />
          ) : null}
          {visibleRoute === "poster-dashboard" ? (
            <PosterDashboardPage checkoutReturnStatus={checkoutReturnStatus} onDispute={() => navigate("dispute")} onProfile={() => navigate("profile")} />
          ) : null}
          {visibleRoute === "finder-dashboard" ? (
            <FinderDashboardPage
              bounties={marketplaceBounties}
              onBrowse={() => navigate("browse")}
              onSubmit={(bountyId?: string) => {
                if (bountyId) {
                  setActiveBountyId(bountyId);
                }
                navigate("submit-find");
              }}
              onProfile={() => navigate("profile")}
            />
          ) : null}
          {visibleRoute === "dispute" ? <DisputePage onBack={() => navigate("poster-dashboard")} /> : null}
          {visibleRoute === "profile" ? <TrustProfilePage onBrowse={() => navigate("browse")} onFinder={() => requireAuth("finder-dashboard")} /> : null}
          {visibleRoute === "faq" ? <FaqPage onBrowse={() => navigate("browse")} onPost={() => requireAuth("post-describe")} /> : null}
          {visibleRoute === "privacy" ? <PrivacyPage /> : null}
          {visibleRoute === "terms" ? <TermsPage /> : null}
          {visibleRoute === "refunds" ? <RefundPolicyPage /> : null}
          {visibleRoute === "rules" ? <MarketplaceRulesPage /> : null}
          {visibleRoute === "support" ? <SupportPage onReport={() => navigate("report")} /> : null}
          {visibleRoute === "report" ? <ReportPage /> : null}
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
  onLogOut,
  requireAuth,
  setMenuOpen,
  signedIn,
}: {
  children: React.ReactNode;
  menuOpen: boolean;
  navigate: (page: Page) => void;
  onLogOut: () => void;
  requireAuth: (page: Page, mode?: AuthMode) => void;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  signedIn: boolean;
}) {
  const navItems: Array<[string, Page, boolean]> = [
    ["Browse", "browse", false],
    ["FAQ", "faq", false],
    ["Trust", "profile", false],
    [signedIn ? "Dashboard" : "Post request", signedIn ? "poster-dashboard" : "post-describe", true],
  ];

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
              onClick={(event) => handleRoutedAnchorClick(event, () => (gated ? requireAuth(page) : navigate(page)))}
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
                onClick={(event) => handleRoutedAnchorClick(event, () => (gated ? requireAuth(page) : navigate(page)))}
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
    ["Rules", "rules"],
    ["Support", "support"],
    ["Report", "report"],
  ];

  return (
    <footer className="site-footer">
      <div>
        <strong>{siteName}</strong>
        <span>Protected requests, source review, and support policies for posters and finders.</span>
      </div>
      <nav aria-label="Policy and support links">
        {publicLinks.map(([label, page]) => (
          <a href={routeHref(page)} key={page} onClick={(event) => handleRoutedAnchorClick(event, () => navigate(page))}>
            {label}
          </a>
        ))}
        <a
          href={routeHref("account-settings")}
          onClick={(event) => handleRoutedAnchorClick(event, () => (requireAuth ? requireAuth("account-settings", "login") : navigate("account-settings")))}
        >
          Account
        </a>
      </nav>
    </footer>
  );
}

function formatBoardStatus(status: string) {
  return status.toUpperCase();
}

function MobileFindTicker({ placement, requests }: { placement: "top" | "bottom"; requests: typeof mobileFindRequests }) {
  return (
    <div className={`mobile-find-ticker mobile-find-ticker-${placement}`} aria-hidden="true">
      <div className="mobile-find-ticker-track">
        {[...requests, ...requests].map((request, index) => (
          <article className="mobile-find-ticker-card" key={`${placement}-mobile-find-${index}`}>
            <img src={request.image} alt={request.copy} loading="lazy" />
            <span>{request.copy}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

function BoardRequestCard({
  bounty,
  onDetail,
  variant = "recent",
}: {
  bounty: BountyListing;
  onDetail: (bountyId: string) => void;
  variant?: "recent" | "reward";
}) {
  const activeStatus = ["Finder in touch", "Price agreed", "Found", "Delivered", "Accepted"].includes(bounty.status);
  const currencyPreference = useCurrencyPreference();
  const compactReward = formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true });
  const fullReward = formatUsdMoney(bounty.rewardValue, currencyPreference);

  return (
    <article className={`board-request-card ${variant === "reward" ? "board-request-card-reward" : ""}`}>
      <a
        className="board-card-hit"
        href={getBountyPath(bounty.id, bounty.name)}
        onClick={(event) => handleRoutedAnchorClick(event, () => onDetail(bounty.id))}
        aria-label={`Open ${bounty.name}`}
      >
        <span className={`board-status ${activeStatus ? "active" : ""}`}>{formatBoardStatus(bounty.status)}</span>
        <img src={bounty.image} alt={`${bounty.name} reference`} />
        <span className="board-card-copy">
          <strong>{bounty.name}</strong>
          <em>{formatBountyDetail(bounty, currencyPreference)}</em>
        </span>
        <span className="board-card-stats" aria-label={`${fullReward} offer, closes in ${bounty.closes}, ${bounty.submissions} leads`}>
          <span>
            <small>Offer</small>
            <b>{compactReward}</b>
          </span>
          <span>
            <small>Closes</small>
            <b>{bounty.closes}</b>
          </span>
          <span>
            <small>Leads</small>
            <b>{bounty.submissions}</b>
          </span>
        </span>
      </a>
    </article>
  );
}

function FeaturedBountyCard({
  bounty,
  className = "",
  index,
  onDetail,
}: {
  bounty: BountyListing;
  className?: string;
  index: number;
  onDetail: (bountyId: string) => void;
}) {
  const currencyPreference = useCurrencyPreference();
  const rewardText = formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true });

  return (
    <article className={`bounty-card bounty-card-${index + 1} ${className}`.trim()}>
      <img src={bounty.image} alt={`${bounty.name} reference`} />
      <a
        className="save-button"
        href={getBountyPath(bounty.id, bounty.name)}
        aria-label={`Open ${bounty.name}`}
        onClick={(event) => handleRoutedAnchorClick(event, () => onDetail(bounty.id))}
      >
        <BadgeCheck size={15} aria-hidden="true" />
      </a>
      <h3>{bounty.name}</h3>
      <p>{formatBountyDetail(bounty, currencyPreference)}</p>
      <div className="bounty-meta">
        <span>
          Offer<strong>{rewardText}</strong>
        </span>
        <span>
          Closes in<strong>{bounty.closes}</strong>
        </span>
      </div>
    </article>
  );
}

function LandingPage({
  bounties,
  menuOpen,
  onAccount,
  onBrowse,
  onBrowseAll,
  onDetail,
  onFinders,
  onLogin,
  onLogOut,
  onNavigate,
  onPost,
  onSection,
  setMenuOpen,
  signedIn,
}: {
  bounties: BountyListing[];
  menuOpen: boolean;
  onAccount: () => void;
  onBrowse: () => void;
  onBrowseAll: () => void;
  onDetail: (bountyId: string) => void;
  onFinders: () => void;
  onLogin: () => void;
  onLogOut: () => void;
  onNavigate: (page: Page) => void;
  onPost: () => void;
  onSection: (sectionId: string) => void;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  signedIn: boolean;
}) {
  const currencyPreference = useCurrencyPreference();
  const [heroSearch, setHeroSearch] = useState("");
  const [heroPlaceholder, setHeroPlaceholder] = useState(heroPlaceholderExamples[0]);
  const [activeFeaturedBountyIndex, setActiveFeaturedBountyIndex] = useState(0);
  const recentBoardBounties = bounties.slice(0, 4);
  const landingFeaturedBounties = bounties.slice(0, 4);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotionQuery.matches) {
      setHeroPlaceholder(heroPlaceholderExamples[0]);
      return undefined;
    }

    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    let timeoutId = 0;

    const tick = () => {
      const currentPhrase = heroPlaceholderExamples[phraseIndex];

      characterIndex = deleting
        ? Math.max(0, characterIndex - 1)
        : Math.min(currentPhrase.length, characterIndex + 1);

      setHeroPlaceholder(currentPhrase.slice(0, characterIndex));

      if (!deleting && characterIndex === currentPhrase.length) {
        deleting = true;
        timeoutId = window.setTimeout(tick, 3600);
        return;
      }

      if (deleting && characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % heroPlaceholderExamples.length;
        timeoutId = window.setTimeout(tick, 420);
        return;
      }

      timeoutId = window.setTimeout(tick, deleting ? 34 : 72);
    };

    setHeroPlaceholder("");
    timeoutId = window.setTimeout(tick, 240);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reduceMotionQuery.matches || landingFeaturedBounties.length < 2) {
      setActiveFeaturedBountyIndex(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveFeaturedBountyIndex((index) => (index + 1) % landingFeaturedBounties.length);
    }, 3600);

    return () => window.clearInterval(intervalId);
  }, [landingFeaturedBounties.length]);

  const submitHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = heroSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      onBrowse();
      return;
    }

    const match = bounties.find((bounty) => `${bounty.name} ${bounty.detail} ${bounty.category}`.toLowerCase().includes(normalizedQuery));

    if (match) {
      onDetail(match.id);
      return;
    }

    onBrowse();
  };

  return (
    <main id="top" className="landing-page">
      <MobileFindTicker placement="top" requests={mobileFindRequests} />
      <MobileFindTicker placement="bottom" requests={reversedMobileFindRequests} />
      <section className="hero-section">
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
            <a href="#how" onClick={(event) => handleRoutedAnchorClick(event, () => onSection("how"))}>
              How it works
            </a>
            <a href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
              Browse feed
            </a>
            <a href="#safety" onClick={(event) => handleRoutedAnchorClick(event, () => onSection("safety"))}>
              Safety
            </a>
            <a href="#finders" onClick={(event) => handleRoutedAnchorClick(event, () => onSection("finders"))}>
              For finders
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
              <a href="#how" onClick={(event) => handleRoutedAnchorClick(event, () => onSection("how"))}>
                How it works
              </a>
              <a href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
                Browse feed
              </a>
              <a href="#safety" onClick={(event) => handleRoutedAnchorClick(event, () => onSection("safety"))}>
                Safety
              </a>
              <a href="#finders" onClick={(event) => handleRoutedAnchorClick(event, () => onSection("finders"))}>
                For finders
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

        <div className="side-find-rail side-find-rail-left" aria-hidden="true">
          <div className="side-find-track side-find-track-down">
            {[...leftFindRequests, ...leftFindRequests].map((request, index) => (
              <article className="side-find-card" key={`left-find-${index}`}>
                <p>{request.copy}</p>
                <img className="side-find-image" src={request.image} alt={request.copy} loading="lazy" />
              </article>
            ))}
          </div>
        </div>

        <div className="side-find-rail side-find-rail-right" aria-hidden="true">
          <div className="side-find-track side-find-track-up">
            {[...rightFindRequests, ...rightFindRequests].map((request, index) => (
              <article className="side-find-card" key={`right-find-${index}`}>
                <p>{request.copy}</p>
                <img className="side-find-image" src={request.image} alt={request.copy} loading="lazy" />
              </article>
            ))}
          </div>
        </div>

        <div className="hero-copy">
          <p className="hero-site-tag">{siteName}</p>
          <h1>Can&apos;t find it anywhere?</h1>
          <p className="mobile-hero-title" aria-hidden="true">Can&apos;t find it anywhere?</p>
          <p className="micro-line">
            <span>Post what you need</span>
            <ArrowRight size={16} />
            <span>finders share a source</span>
            <ArrowRight size={16} />
            <span>you connect and get it.</span>
          </p>
          <form className="hero-search-form" onSubmit={submitHeroSearch}>
            <Search size={20} aria-hidden="true" />
            <input value={heroSearch} aria-label="Search requests" onChange={(event) => setHeroSearch(event.target.value)} placeholder={heroPlaceholder} />
            <button type="submit">Search</button>
          </form>
          <div className="mobile-hero-actions" aria-label="Hero actions">
            <button className="primary-button mobile-post-button hero-plus-button" type="button" onClick={onPost}>
              <span aria-hidden="true">+</span>
              Post it now
            </button>
            <a className="mobile-browse-button" href={routeHref("browse-all")} onClick={(event) => handleRoutedAnchorClick(event, onBrowseAll)}>
              Browse all <ArrowRight size={14} />
            </a>
          </div>
        </div>

        <aside className="market-preview" aria-label="Featured request preview">
          <span className="floating-tag cyan">Rare finds</span>
          <span className="floating-tag orange">Funded request</span>
          <div className="featured-grid featured-grid-desktop">
            {landingFeaturedBounties.map((bounty, index) => {
              return (
                <FeaturedBountyCard bounty={bounty} index={index} key={bounty.name} onDetail={onDetail} />
              );
            })}
          </div>
          {landingFeaturedBounties.length ? (
            <div className="featured-mobile-carousel" aria-label="Featured request carousel">
              <FeaturedBountyCard
                bounty={landingFeaturedBounties[activeFeaturedBountyIndex] ?? landingFeaturedBounties[0]}
                className="featured-mobile-card"
                index={activeFeaturedBountyIndex}
                key={(landingFeaturedBounties[activeFeaturedBountyIndex] ?? landingFeaturedBounties[0]).id}
                onDetail={onDetail}
              />
            </div>
          ) : null}
        </aside>

        <div className="hero-lower">
          <p className="hero-subline">
            You&apos;ve searched every site, called every shop, scrolled for hours, and it&apos;s still nowhere. Let someone who knows the link, the shop, the friend, or the hidden source point you to it.
          </p>
          <button className="primary-button hero-cta" type="button" onClick={onPost}>
            Post what you&apos;re looking for
          </button>
          <a className="finder-link finder-button hero-secondary-link" href={routeHref("finder-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onFinders)}>
            Good at finding things? Earn by finding <ArrowRight size={18} />
          </a>
          <p className="trust-line">
            <LockKeyhole size={18} />
            Your funded offer is tracked. If no valid source is accepted during the request window, the finder offer can be returned under the refund policy.
          </p>
        </div>

        <div className="landing-recent-board board-rails" aria-label="Request board preview">
          <section className="board-row" aria-labelledby="recent-board-title">
            <div className="board-row-head">
              <h2 id="recent-board-title">Example find requests</h2>
              <a className="board-view-all" href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
                View all <ArrowRight size={18} />
              </a>
            </div>
            <div className="board-card-rail">
              {recentBoardBounties.map((bounty) => (
                <BoardRequestCard bounty={bounty} key={bounty.id} onDetail={onDetail} />
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="problem-section" aria-labelledby="problem-title">
        <div className="problem-section-head">
          <p className="route-kicker">When normal search stops working</p>
          <h2 id="problem-title">The right source may be outside your search results.</h2>
          <p>
            Listings expire, sellers use different names, and local leads rarely show up in search. A clear bounty gives people a reason to follow clues you would not know to check.
          </p>
        </div>
        <div className="problem-grid">
          {problemItems.map((item, index) => {
            const ItemIcon = item.icon;
            return (
              <article className={`problem-item problem-tone-${index + 1}`} key={item.title}>
                <div className="problem-item-top">
                  <span className="problem-tag">{item.tag}</span>
                  <ItemIcon size={20} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="how-section" id="how" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <p className="how-intro">
          Post the thing you cannot find. Fund an offer. Finders send protected leads. You reveal the source only when you are ready to review it.
        </p>
        <div className="how-steps">
          {workSteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <React.Fragment key={step.title}>
                <article className="work-step">
                  <div className="step-icon">
                    <StepIcon size={30} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
                {index < workSteps.length - 1 ? <ArrowRight className="flow-arrow" size={24} /> : null}
              </React.Fragment>
            );
          })}
        </div>
        <div className="review-protection-panel" aria-label="How source review protects posters and finders">
          <div className="review-protection-copy">
            <p className="route-kicker">Protected source review</p>
            <h3>Your best lead should not vanish in a comment thread.</h3>
            <p>
              When a finder submits a lead, the platform saves what they sent and when they sent it. If the poster reveals the source,
              that reveal is recorded too. This makes the payout decision easier to review if something goes wrong.
            </p>
          </div>
          <div className="review-protection-grid">
            {reviewProtectionSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <article className="review-protection-step" key={step.title}>
                  <StepIcon size={22} />
                  <span>
                    <strong>{step.title}</strong>
                    {step.copy}
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="safety-section" id="safety" aria-labelledby="safety-title">
        <h2 id="safety-title">How payment and source review work</h2>
        <div className="safety-flow">
          {safetySteps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <React.Fragment key={step.title}>
                <article className="safety-step">
                  <div className="safety-icon">
                    <StepIcon size={28} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
                {index < safetySteps.length - 1 ? <ArrowRight className="safety-arrow" size={22} /> : null}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      <section className="comparison-section" aria-labelledby="comparison-title">
        <h2 id="comparison-title">{siteName} vs the usual ways to search</h2>
        <div className="comparison-table">
          <div className="comparison-row comparison-header">
            <span />
            <strong>{siteName}</strong>
            <strong>Reddit/forums</strong>
            <strong>Marketplaces</strong>
            <strong>DM offers</strong>
          </div>
          {comparisonRows.map((row) => (
            <div className="comparison-row" key={row[0]}>
              <strong>{row[0]}</strong>
              {row.slice(1).map((value, index) => (
                <span
                  className={value === "Yes" ? "yes-cell" : value === "Maybe" || value === "Limited" || value === "Rare" ? "maybe-cell" : "no-cell"}
                  key={`${row[0]}-${index}`}
                  data-label={[siteName, "Reddit/forums", "Marketplaces", "DM offers"][index]}
                >
                  {value === "Yes" ? <Check size={16} /> : value === "No" ? <X size={16} /> : <CircleHelp size={16} />}
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="finder-section" id="finders" aria-labelledby="finder-title">
        <div className="finder-copy">
          <h2 id="finder-title">Know where to find hard-to-find things? Get paid for the source.</h2>
          <ul>
            <li>
              <CheckCircle2 size={18} /> Browse funded requests with clear photos, criteria, and payouts
            </li>
            <li>
              <CheckCircle2 size={18} /> Submit a source link, seller contact, local lead, or handoff path
            </li>
            <li>
              <CheckCircle2 size={18} /> Get paid when your valid source is accepted or wins review
            </li>
          </ul>
          <a className="finder-link finder-button large-link" href={routeHref("finder-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onFinders)}>
            Start finding requests <ArrowRight size={18} />
          </a>
        </div>
        <div className="finder-protection">
          <h3>Finder protection</h3>
          <div>
            <ShieldCheck size={28} />
            <span>
              <strong>Your lead is recorded before reveal</strong>
              The source, notes, proof, and timestamp are saved before the poster sees the full details.
            </span>
          </div>
          <div>
            <BadgeCheck size={28} />
            <span>
              <strong>First valid source gets priority</strong>
              If multiple finders send the same lead, the earlier valid submission comes first.
            </span>
          </div>
          <div>
            <Headphones size={28} />
            <span>
              <strong>A review path for disputes</strong>
              Saved proof helps resolve unfair rejections or used valid sources.
            </span>
          </div>
        </div>
      </section>

      <section className="founder-section" aria-labelledby="founder-title">
        <div className="founder-copy">
          <h2 id="founder-title">From the founder</h2>
          <p>
            Hi, I am Saharsh. I started {siteName} after going through the same frustration this platform is built to solve. There were times I needed something urgently, searched for hours, asked around, opened every listing I could find, and still ended the day with dead links, wrong products, and sellers I could not trust.
          </p>
          <p>
            I realized the problem was not that these things were impossible to find. The problem was that the right person, shop, collector, or local lead was usually outside my own reach. This is why {siteName} exists: you post what you need, set an offer, and real people who know where to look can help you find a safer path forward.
          </p>
          <strong>- Saharsh, Founder</strong>
        </div>
      </section>

      <section className="closing-section" id="faq" aria-labelledby="closing-title">
        <h2 id="closing-title">
          The thing you can't find?
          <span> Someone out there knows exactly where it is.</span>
        </h2>
        <button className="primary-button" type="button" onClick={onPost}>
          Post what you're looking for
        </button>
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
  const [accountType, setAccountType] = useState<AuthAccountType>("both");
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
          <p className="route-kicker">Account required for this action</p>
          <h1 id="auth-title">{mode === "signup" ? "Create your account to continue." : "Log in to continue."}</h1>
          <p>
            Public browsing is open. Posting a request, submitting a source, dashboards, payments, and disputes need a signed-in account so offers, payouts, and reputation stay trustworthy.
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
            ) : mode === "signup" ? (
              <label>
                Account type
                <select value={accountType} disabled={authBusy} onChange={(event) => setAccountType(event.target.value as AuthAccountType)}>
                  <option value="both">Post requests and submit sources</option>
                  <option value="poster">Post requests only</option>
                  <option value="finder">Submit sources only</option>
                </select>
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
                    ? "Send sign up code"
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
            Browse public feed instead <ArrowRight size={17} />
          </a>
        </div>
      </section>
    </main>
  );
}

function PostProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    ["Describe", "post-describe"],
    ["Set offer", "post-reward"],
    ["Pay", "post-pay"],
  ] as const;

  return (
    <div className="post-progress" aria-label="Post request progress">
      {steps.map((step, index) => (
        <div className={current === index + 1 ? "active" : current > index + 1 ? "done" : ""} key={step[0]}>
          <span>{index + 1}</span>
          <strong>{step[0]}</strong>
        </div>
      ))}
    </div>
  );
}

function PostDescribePage({
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
  useEffect(() => {
    return () => {
      draft.referenceImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [draft.referenceImages]);

  const handleReferenceImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    draft.referenceImages.forEach((image) => URL.revokeObjectURL(image.url));
    onDraftChange({
      referenceImages: files.map((file) => ({
        file,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    });
    event.target.value = "";
  };

  return (
    <main className="route-page" aria-labelledby="describe-title">
      <PostProgress current={1} />
      <section className="two-column-page">
        <div className="form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Back to landing
          </button>
          <h1 id="describe-title">Describe the item you cannot find.</h1>
          <p>Clear details help expert finders avoid lookalikes and weak leads.</p>
          <label>
            Item name
            <input value={draft.itemName} placeholder="yellow pillow, cat mug, wall art..." onChange={(event) => onDraftChange({ itemName: event.target.value })} />
          </label>
          <label>
            Category
            <select value={draft.category} onChange={(event) => onDraftChange({ category: event.target.value as RequestCategory })}>
              {requestCategories.map((category) => (
                <option value={category.value} key={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Must-have details
            <textarea
              value={draft.details}
              placeholder="Model numbers, color, serial range, condition, shipping limits, authenticity requirements..."
              onChange={(event) => onDraftChange({ details: event.target.value })}
            />
          </label>
          <input
            id="reference-images"
            className="sr-only-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={handleReferenceImagesChange}
          />
          <label className="upload-box upload-button" htmlFor="reference-images">
            <ImagePlus size={24} />
            <span>
              <strong>Add reference images</strong>
              {draft.referenceImages.length
                ? `${draft.referenceImages.length} photo${draft.referenceImages.length === 1 ? "" : "s"} selected. Add or replace images.`
                : "Photos help finders match the exact item."}
            </span>
          </label>
          {draft.referenceImages.length ? (
            <div className="upload-preview-grid" aria-label="Selected reference images">
              {draft.referenceImages.map((image) => (
                <figure className="upload-preview-card" key={image.url}>
                  <img src={image.url} alt={image.name} />
                  <figcaption>{image.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          <button className="primary-button" type="button" onClick={onNext}>
            Continue to offer <ArrowRight size={18} />
          </button>
        </div>
        <aside className="side-panel">
          <h2>What finders see</h2>
          <div className="mini-bounty-card">
            <img src={bountyListings[5].image} alt={`${bountyListings[5].name} reference`} />
            <div>
              <strong>{draft.itemName || "Your request"}</strong>
              <span>{getCategoryLabel(draft.category)} · Open to worldwide sources</span>
            </div>
          </div>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} /> Exact model and condition
            </li>
            <li>
              <CheckCircle2 size={18} /> Source details you need
            </li>
            <li>
              <CheckCircle2 size={18} /> What should be rejected
            </li>
          </ul>
        </aside>
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
  const currencyPreference = useCurrencyPreference();
  const breakdown = getPaymentBreakdown(draft.reward);
  const setReward = (value: string) => {
    const nextReward = Number(value);

    if (Number.isFinite(nextReward)) {
      onDraftChange({ reward: Math.max(minimumReward, Math.round(nextReward)) });
    }
  };

  return (
    <main className="route-page" aria-labelledby="reward-title">
      <PostProgress current={2} />
      <section className="two-column-page">
        <div className="form-panel reward-form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Describe
          </button>
          <h1 id="reward-title">Set an offer that gets attention.</h1>
          <p>Your offer is the amount a finder can earn as a payout after you accept their source or complete the handoff. Platform fees are paid by the poster at checkout.</p>
          <label>
            Offer amount
            <input type="number" min={minimumReward} value={draft.reward} onChange={(event) => setReward(event.target.value)} />
          </label>
          <div className="reward-slider">
            <input type="range" min={minimumReward} max="1000" value={Math.min(draft.reward, 1000)} onChange={(event) => setReward(event.target.value)} />
            <div>
              <span>Low urgency</span>
              <span>High urgency</span>
            </div>
          </div>
          <div className="radio-grid" role="group" aria-label="Request duration">
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
          <button className="primary-button" type="button" onClick={onNext}>
            Continue to payment <ArrowRight size={18} />
          </button>
        </div>
        <aside className="side-panel receipt-panel">
          <h2>Payment summary</h2>
          <dl>
            <div>
              <dt>Finder payout</dt>
              <dd>{formatUsdMoney(breakdown.reward, currencyPreference)}</dd>
            </div>
            <div>
              <dt>Platform service (12%)</dt>
              <dd>{formatUsdMoney(breakdown.platformFee, currencyPreference)}</dd>
            </div>
            <div>
              <dt>Payment handling and source review (3%)</dt>
              <dd>{formatUsdMoney(breakdown.protection, currencyPreference)}</dd>
            </div>
            <div className="total-row">
              <dt>Poster pays today</dt>
              <dd>{formatUsdMoney(breakdown.total, currencyPreference)}</dd>
            </div>
          </dl>
          <ul className="check-list">
            <li>
              <Banknote size={18} /> Finder sees the offer and earns it as payout
            </li>
            <li>
              <Search size={18} /> 12% service fee funds matching, review, and support
            </li>
            <li>
              <ShieldCheck size={18} /> 3% fee supports payment handling, source records, dispute review, and fraud monitoring
            </li>
          </ul>
          <p>
            <LockKeyhole size={18} /> The finder offer is recorded until a source or handoff is approved.
          </p>
        </aside>
      </section>
    </main>
  );
}

function PostPayPage({
  checkoutReturnStatus,
  draft,
  onBack,
}: {
  checkoutReturnStatus: CheckoutReturnStatus;
  draft: PostDraft;
  onBack: () => void;
}) {
  const currencyPreference = useCurrencyPreference();
  const [customerEmail, setCustomerEmail] = useState(() => window.sessionStorage.getItem(authEmailStorageKey) ?? "");
  const [customerName, setCustomerName] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const breakdown = getPaymentBreakdown(draft.reward);
  const itemName = draft.itemName.trim() || "your request";

  useEffect(() => {
    if (checkoutStatus !== "loading") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCheckoutMessage("This is taking longer than expected. Please wait or try again.");
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [checkoutStatus]);

  const startCheckout = async () => {
    const normalizedEmail = customerEmail.trim();
    const normalizedName = customerName.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setCheckoutStatus("error");
      setCheckoutMessage("Enter a valid receipt email before checkout.");
      return;
    }

    if (!normalizedName) {
      setCheckoutStatus("error");
      setCheckoutMessage("Enter your name before checkout.");
      return;
    }

    setCheckoutStatus("loading");
    setCheckoutMessage("");

    const uploadedPaths: string[] = [];
    let createdRequestId: string | null = null;

    try {
      const requestId = crypto.randomUUID();
      const uploadedImages = [];
      let user = null;
      let accessToken = "";

      if (supabase) {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError && !userError.message.toLowerCase().includes("auth session missing")) {
          throw userError;
        }

        user = currentUser;
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        accessToken = session?.access_token ?? "";
      }

      if (!user || !accessToken) {
        throw new Error("Sign in again before starting checkout.");
      }

      window.sessionStorage.setItem(authEmailStorageKey, normalizedEmail);
      window.sessionStorage.setItem(
        checkoutSnapshotStorageKey,
        JSON.stringify({
          requestId,
          itemName,
          provider: "secure checkout",
          category: getCategoryLabel(draft.category),
          reward: breakdown.reward,
          platformFee: breakdown.platformFee,
          protection: breakdown.protection,
          platformShare: breakdown.platformShare,
          total: breakdown.total,
          email: normalizedEmail,
          durationDays: draft.durationDays,
          createdAt: new Date().toISOString(),
        } satisfies CheckoutSnapshot),
      );

      if (supabase && user) {
        for (const [index, image] of draft.referenceImages.entries()) {
          const fileExtension = image.file.name.includes(".") ? image.file.name.split(".").pop()?.toLowerCase() ?? "jpg" : "jpg";
          const filePath = `${user.id}/${requestId}/${index + 1}-${crypto.randomUUID()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage
            .from(requestReferenceImagesBucket)
            .upload(filePath, image.file, {
              cacheControl: "3600",
              contentType: image.file.type || undefined,
              upsert: false,
            });

          if (uploadError) {
            throw uploadError;
          }

          uploadedPaths.push(filePath);
          const {
            data: { publicUrl },
          } = supabase.storage.from(requestReferenceImagesBucket).getPublicUrl(filePath);

          uploadedImages.push({
            name: image.name,
            path: filePath,
            type: image.file.type || null,
            url: publicUrl,
          });
        }

        const { error: insertError } = await supabase.from("requests").insert({
          id: requestId,
          user_id: user.id,
          item_name: itemName,
          category: getCategoryLabel(draft.category),
          details: draft.details,
          currency: "USD",
          reward: breakdown.reward,
          service_fee: breakdown.platformFee,
          protection_reserve: breakdown.protection,
          total_due: breakdown.total,
          finder_payout: breakdown.reward,
          duration_days: draft.durationDays,
          status: "checkout_pending",
          payment_status: "unpaid",
          payout_status: "not_ready",
          platform_fee_status: "unearned",
          customer_email: normalizedEmail,
          customer_name: normalizedName,
          reference_images: uploadedImages,
        });

        if (insertError) {
          throw insertError;
        }

        createdRequestId = requestId;
      }

      const checkoutController = new AbortController();
      const checkoutTimeoutId = window.setTimeout(() => checkoutController.abort(), checkoutRequestTimeoutMs);
      let response: Response;

      try {
        response = await fetch("/api/payments/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          signal: checkoutController.signal,
          body: JSON.stringify({
            customer: {
              email: normalizedEmail,
              name: normalizedName,
            },
            draft: {
              requestId,
              itemName,
              category: getCategoryLabel(draft.category),
              details: draft.details,
              reward: breakdown.reward,
              durationDays: draft.durationDays,
            },
          }),
        });
      } finally {
        window.clearTimeout(checkoutTimeoutId);
      }

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error || "Could not start secure checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      if (supabase && !createdRequestId && uploadedPaths.length) {
        await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
      }

      setCheckoutStatus("error");
      setCheckoutMessage(getCheckoutErrorMessage(error));
    }
  };

  return (
    <main className="route-page" aria-labelledby="pay-title">
      <PostProgress current={3} />
      <section className="two-column-page pay-layout">
        <div className="form-panel payment-form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Offer
          </button>
          <h1 id="pay-title">Fund the offer with secure checkout.</h1>
          <p>
            Pay once through secure checkout for the finder offer and platform fees. If a source leads to an item purchase, you buy that item directly from the third-party seller or source.
          </p>
          {checkoutReturnStatus === "cancelled" ? (
            <p className="dialog-error" role="status">
              Checkout was cancelled. Your request is still in draft, so you can adjust the offer or try again.
            </p>
          ) : null}
          {checkoutReturnStatus === "success" ? (
            <p className="dialog-success" role="status">
              Checkout reported a successful return. Review the dashboard to confirm the funded request and incoming sources.
            </p>
          ) : null}
          <label>
            Receipt email
            <input type="email" value={customerEmail} placeholder="you@example.com" onChange={(event) => setCustomerEmail(event.target.value)} />
          </label>
          <label>
            Name
            <input value={customerName} placeholder="Buyer name" onChange={(event) => setCustomerName(event.target.value)} />
          </label>
          <div className="checkout-note">
            <ExternalLink size={19} />
            <span>
              <strong>Secure Checkout</strong>
              Your payment is processed securely. We never store your card details. The finder offer is tracked until a source or handoff is approved; the platform does not sell or ship requested goods.
            </span>
          </div>
          <button className="primary-button" type="button" disabled={checkoutStatus === "loading"} onClick={startCheckout}>
            <CreditCard size={18} /> {checkoutStatus === "loading" ? "Preparing secure checkout..." : checkoutStatus === "error" ? "Try checkout again" : `Go to secure checkout`}
          </button>
          {checkoutMessage ? (
            <div className={checkoutStatus === "error" ? "dialog-error checkout-status-message" : "dialog-note checkout-status-message"} role="status">
              <span>{checkoutMessage}</span>
              {checkoutStatus === "error" ? (
                <button className="retry-button" type="button" onClick={startCheckout}>
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <aside className="side-panel payment-summary receipt-panel">
          <h2>Payment summary</h2>
          <div className="summary-card">
            <Banknote size={28} />
            <strong>{formatUsdMoney(breakdown.total, currencyPreference)} due today</strong>
            <span>Total for the {itemName} request workflow, including the finder payout, platform service, and source review fee.</span>
          </div>
          <dl>
            <div>
              <dt>Finder payout</dt>
              <dd>{formatUsdMoney(breakdown.reward, currencyPreference)}</dd>
            </div>
            <div>
              <dt>Platform service (12%)</dt>
              <dd>{formatUsdMoney(breakdown.platformFee, currencyPreference)}</dd>
            </div>
            <div>
              <dt>Payment handling and source review (3%)</dt>
              <dd>{formatUsdMoney(breakdown.protection, currencyPreference)}</dd>
            </div>
            <div>
              <dt>Fees total</dt>
              <dd>{formatUsdMoney(breakdown.platformShare, currencyPreference)}</dd>
            </div>
            <div className="total-row">
              <dt>Poster pays today</dt>
              <dd>{formatUsdMoney(breakdown.total, currencyPreference)}</dd>
            </div>
          </dl>
          <ul className="check-list">
            <li>
              <ShieldCheck size={18} /> The processor collects the full poster payment
            </li>
            <li>
              <Banknote size={18} /> Service and source review fees total {formatUsdMoney(breakdown.platformShare, currencyPreference)}
            </li>
            <li>
              <TimerReset size={18} /> Finder payout can become payable after acceptance and review
            </li>
          </ul>
        </aside>
      </section>
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
}: {
  bounties: BountyListing[];
  dataError: string;
  dataLoading: boolean;
  onBrowseAll: () => void;
  onDetail: (bountyId: string) => void;
  onPost: () => void;
}) {
  const rewardSorted = useMemo(() => [...bounties].sort((left, right) => right.rewardValue - left.rewardValue), [bounties]);
  const featured = rewardSorted.slice(0, 4);
  const remaining = rewardSorted.slice(4);

  return (
    <main className="route-page bounty-gallery-page" aria-labelledby="browse-title">
      <section className="gallery-hero">
        <h1 id="browse-title">Featured requests</h1>
        <p>Simple posts with clear photos and small offers, shown first so finders can quickly spot what they recognize.</p>
        {dataLoading ? <p className="dialog-note">Loading live paid requests...</p> : null}
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

      <section className="gallery-section" aria-labelledby="more-bounties-title">
        <div className="gallery-section-head">
          <div>
            <h2 id="more-bounties-title">More requests closing soon</h2>
            <p>Active requests with real offers, live source submissions, and a visible request window.</p>
          </div>
          <a className="section-link section-button" href={routeHref("browse-all")} onClick={(event) => handleRoutedAnchorClick(event, onBrowseAll)}>
            Browse all <ArrowRight size={17} />
          </a>
        </div>
        <div className="bounty-square-grid">
          {remaining.map((bounty, index) => (
            <BountySquareCard bounty={bounty} compact key={bounty.id} onDetail={onDetail} rank={index + 5} />
          ))}
        </div>
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
}: {
  bounties: BountyListing[];
  dataError: string;
  dataLoading: boolean;
  onDetail: (bountyId: string) => void;
  onPost: () => void;
}) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(16);
  const categories = useMemo(() => ["All", ...Array.from(new Set(bounties.map((bounty) => bounty.category))).sort()], [bounties]);
  const filteredBounties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...bounties].sort((left, right) => right.rewardValue - left.rewardValue).filter((bounty) => {
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

  return (
    <main className="route-page bounty-gallery-page browse-all-page" aria-labelledby="browse-all-title">
      <section className="gallery-hero compact-gallery-hero">
        <div>
          <h1 id="browse-all-title">Browse all requests</h1>
          <p>Search open requests by item, category, or location.</p>
          {dataLoading ? <p className="dialog-note">Loading live paid requests...</p> : null}
        </div>
        <button className="primary-button" type="button" onClick={onPost}>
          Post a request <ArrowRight size={18} />
        </button>
      </section>
      <section className="browse-toolbar" aria-label="Browse filters">
        <div className="search-field">
          <Search size={18} />
          <input aria-label="Search all requests" placeholder="Search requests" value={query} onChange={(event) => setQuery(event.target.value)} />
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
        {visibleBounties.map((bounty) => (
          <BountySquareCard bounty={bounty} key={bounty.id} onDetail={onDetail} variant="request" />
        ))}
      </section>
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
  const currencyPreference = useCurrencyPreference();
  const rewardText = formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true });
  const requestVariant = variant === "request";

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
            <span className="square-price">{rewardText}</span>
          </>
        )}
        <span className="square-image-wrap">
          <img src={bounty.image} alt={`${bounty.name} reference`} />
        </span>
        <span className="square-copy">
          <strong>{bounty.name}</strong>
          <em>{formatBountyDetail(bounty, currencyPreference)}</em>
        </span>
        {requestVariant ? (
          <span className="square-meta request-card-meta">
            <span>
              <small>Offer</small>
              <b>{rewardText}</b>
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
  onPosterProfile,
  onSubmit,
}: {
  bounty: BountyListing;
  onBrowse: () => void;
  onPosterProfile: () => void;
  onSubmit: () => void;
}) {
  const currencyPreference = useCurrencyPreference();

  return (
    <main className="route-page" aria-labelledby="detail-title">
      <button className="back-button page-back" type="button" onClick={onBrowse}>
        <ArrowLeft size={17} /> Browse feed
      </button>
      <section className="detail-layout">
        <article className="detail-main">
          <img className="detail-image" src={bounty.image} alt={bounty.name} />
          <div className="detail-copy">
            <div className="status-strip">
              <span>{bounty.status}</span>
              <span>{bounty.category}</span>
              <span>{bounty.posted}</span>
            </div>
            <h1 id="detail-title">{bounty.name}</h1>
            <p>{bounty.description}</p>
            <h2>Must match</h2>
            <ul className="check-list detail-list">
              {bounty.mustHaves.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </article>
        <aside className="side-panel detail-side">
          <strong className="detail-reward">{formatUsdMoney(bounty.rewardValue, currencyPreference)}</strong>
          <span>Payout for accepted source</span>
          <button className="primary-button wide-button" type="button" onClick={onSubmit}>
            Submit a source <Send size={18} />
          </button>
          <a className="section-link section-button center-link" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onPosterProfile)}>
            View poster trust page <ArrowRight size={17} />
          </a>
          <div className="timeline-panel">
            <h2>Source timeline</h2>
            {bounty.timeline.map((event) => (
              <div className="timeline-item" key={event}>
                <span />
                <p>{event}</p>
              </div>
            ))}
          </div>
        </aside>
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
      setSubmitError("Add the source link, or choose a private/direct source type if there is no public link.");
      setSubmitted(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setSubmitError("Add a valid contact email so the poster can reach you for next steps.");
      setSubmitted(false);
      return;
    }

    if (!sourceTruthConfirmed) {
      setSubmitError("Confirm that your source is real and matches the request before submitting.");
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

        const fingerprint = await createSourceFingerprint(bounty.id, sourceType, normalizedSource, normalizedNotes, normalizedEmail);
        const { error } = await supabase.from("source_submissions").insert({
          id: submissionId,
          request_id: bounty.id,
          finder_id: user.id,
          source_type: sourceType,
          source_url: sourceType === "source-link" ? normalizedSource : normalizedSource || null,
          source_contact: sourceType === "source-link" ? null : normalizedNotes.slice(0, 500) || normalizedSource || null,
          contact_email: normalizedEmail,
          price_or_terms: normalizedTerms || null,
          match_notes: normalizedNotes || "Finder submitted a source for review.",
          proof: uploadResult.proof,
          source_fingerprint: fingerprint,
        });

        if (error) {
          throw error;
        }

        setSubmitMessage("Protected source saved to Supabase. The poster can preview the lead, reveal it under terms, and review it from their dashboard.");
      } else {
        setSubmitMessage("Demo request recorded locally. Live paid requests save protected source records to Supabase.");
      }

      setContactEmail(normalizedEmail);
      setSubmitted(true);
      setSubmitStatus("success");
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
          <h1 id="submit-title">Submit a source for {bounty.name}.</h1>
          <p>Tell the poster where it is, who has it, or whether you have it yourself. A link is helpful, but your email is required for next steps.</p>
          <div className="source-protection-note" role="note">
            <ShieldCheck size={21} />
            <span>
              Your full source is saved as a protected record. If the poster reveals it and later rejects it unfairly, your proof can be reviewed.
            </span>
          </div>
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
              placeholder={linkRequired ? "https://store.example/item" : "Leave blank if there is no public link"}
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
            Message to poster
            <textarea
              value={notes}
              placeholder="Where it is, who has it, condition, availability, and how the poster can discuss delivery, pickup, shipping, or purchase details..."
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
                ? `${proofFiles.length} file${proofFiles.length === 1 ? "" : "s"} selected for protected proof.`
                : "Screenshots, photos, messages, or proof are optional but help the poster review faster."}
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
            <span>I confirm this source is real, relevant, and submitted in good faith.</span>
          </label>
          {submitError ? (
            <p className="dialog-error" role="alert">
              {submitError}
            </p>
          ) : null}
          <button className="primary-button" type="submit" disabled={submitStatus === "loading"}>
            {submitStatus === "loading" ? "Saving protected source..." : "Submit source for review"}
          </button>
          {submitted ? (
            <>
              <div className="summary-card submission-success" role="status">
                <CheckCircle2 size={24} />
                <strong>Protected source submitted</strong>
                <span>{sourceLink.trim() ? `Source recorded: ${sourceLink.trim()}` : "No public link shared. Your contact path and notes are recorded for review."}</span>
                <span>Contact: {contactEmail}</span>
                {itemTerms.trim() ? <span>Terms: {itemTerms.trim()}</span> : null}
                <span>{submitMessage || "The poster can preview the lead first. If they reveal it, that reveal is saved."}</span>
              </div>
              <a className="section-link section-button" href={routeHref("finder-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onDashboard)}>
                Go to finder dashboard <ArrowRight size={17} />
              </a>
            </>
          ) : null}
        </form>
        <aside className="side-panel">
          <h2>Source review checklist</h2>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} /> Matches the poster's must-haves
            </li>
            <li>
              <CheckCircle2 size={18} /> Link is included when one exists
            </li>
            <li>
              <CheckCircle2 size={18} /> Contact email is ready for next steps
            </li>
            <li>
              <CheckCircle2 size={18} /> Delivery or handoff path is clear
            </li>
            <li>
              <CheckCircle2 size={18} /> Proof is saved before the source is revealed
            </li>
          </ul>
          <div className="mini-bounty-card">
            <img src={bounty.image} alt={`${bounty.name} reference`} />
            <div>
              <strong>{bounty.name}</strong>
              <span>{formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true })} payout · {bounty.closes} left</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PosterDashboardPage({
  checkoutReturnStatus,
  onDispute,
  onProfile,
}: {
  checkoutReturnStatus: CheckoutReturnStatus;
  onDispute: () => void;
  onProfile: () => void;
}) {
  const currencyPreference = useCurrencyPreference();
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
    : bountyListings.slice(0, 4);
  const selectedSubmission = submissions.find((submission) => submission.id === selectedSubmissionId) ?? submissions[0] ?? null;
  const selectedRequest = selectedSubmission ? requests.find((request) => request.id === selectedSubmission.request_id) ?? null : null;
  const selectedReveal = selectedSubmission ? revealedSources.find((source) => source.id === selectedSubmission.id) ?? null : null;
  const selectedReview = selectedSubmission ? reviews.find((review) => review.submission_id === selectedSubmission.id) ?? null : null;
  const protectedOfferTotal = requests.reduce((total, request) => total + (request.payment_status === "paid" ? request.total_due : 0), 0);
  const acceptedTotal = reviews.reduce((total, review) => {
    if (review.decision !== "accepted") {
      return total;
    }

    const request = requests.find((item) => item.id === review.request_id);
    return total + (request?.finder_payout ?? 0);
  }, 0);
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

      setActionMessage("Source revealed and logged. Full source details are now visible to you and the finder.");
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : "Could not reveal this source.");
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
      setActionMessage(decision === "accepted" ? "Source accepted. Finder payout is now marked payable after the release window." : "Source sent to review with your reason saved.");
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
          <h1 id="poster-dashboard-title">Review sources and contact finders.</h1>
        </div>
        <a className="section-link section-button" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onProfile)}>
          Public trust page <ArrowRight size={17} />
        </a>
      </section>
      {loading ? <p className="dialog-note">Loading your saved requests and protected source records...</p> : null}
      {dashboardError ? <p className="dialog-error" role="alert">{dashboardError}</p> : null}
      {actionMessage ? <p className="dialog-success" role="status">{actionMessage}</p> : null}
      <section className="metric-grid">
        <Metric icon={LockKeyhole} label="Protected offers" value={formatUsdMoney(protectedOfferTotal || 1280, currencyPreference, { compact: true })} />
        <Metric icon={MessageSquare} label="Sources awaiting review" value={String(awaitingReviewCount || 4)} />
        <Metric icon={PackageCheck} label="Requests funded" value={String(requests.filter((request) => request.payment_status === "paid").length || 2)} />
        <Metric icon={CheckCircle2} label="Accepted payouts" value={formatUsdMoney(acceptedTotal || 930, currencyPreference, { compact: true })} />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Sources to review</h2>
            <Filter size={18} />
          </div>
          {dashboardBounties.map((bounty) => (
            <button className="review-row" key={bounty.id} type="button" onClick={() => selectRequest(bounty.id)}>
              <img src={bounty.image} alt={`${bounty.name} reference`} />
              <span>
                <strong>{bounty.name}</strong>
                <small>{bounty.submissions} submissions · {bounty.status}</small>
              </span>
              <em>{formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true })}</em>
            </button>
          ))}
        </div>
        <div className="dashboard-panel active-review">
          <div className="panel-header">
            <h2>Protected source review</h2>
            <LockKeyhole size={20} />
          </div>
          {selectedSubmission ? (
            <>
              <h3>{selectedRequest?.item_name ?? "Protected source"}</h3>
              <p>{selectedSubmission.match_notes || "Finder shared a protected lead. Reveal it only when you are ready to review the full source."}</p>
              <div className="protected-source-review" aria-label="Protected source review">
                <div className="source-review-row">
                  <span>Preview</span>
                  <strong>{selectedSubmission.price_or_terms || selectedSubmission.match_notes || "Source preview saved"}</strong>
                </div>
                <div className="source-review-row">
                  <span>Source</span>
                  <strong>{selectedReveal ? selectedReveal.source_url || selectedReveal.source_contact || "Private source details revealed" : "Hidden until reveal"}</strong>
                </div>
                <div className="source-review-row">
                  <span>Finder proof</span>
                  <strong>{selectedSubmission.proof?.length ? `${selectedSubmission.proof.length} protected file${selectedSubmission.proof.length === 1 ? "" : "s"} saved` : "No files attached; notes are saved"}</strong>
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
                    <span>Source revealed and saved to the case timeline. Review it before accepting or sending to review.</span>
                  </div>
                  <div className="action-row">
                    <button className="primary-button" type="button" onClick={() => reviewSelectedSource("accepted")}>
                      Accept source and contact finder
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
                        Open dispute form <ArrowRight size={17} />
                      </a>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="reveal-rule">
                    <ShieldCheck size={21} />
                    <span>
                      If you reveal this source and it matches your request, the finder may still be paid after review even if you reject it later.
                    </span>
                  </div>
                  <button className="primary-button" type="button" onClick={revealSelectedSource}>
                    Reveal protected source
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="empty-state">
              <LockKeyhole size={26} />
              <strong>No protected sources yet</strong>
              <span>Once a finder submits to one of your paid requests, the preview appears here before reveal.</span>
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
  const paidTodayText = checkoutSnapshot ? formatUsdMoney(checkoutSnapshot.total, currencyPreference) : "Payment processed";
  const rewardText = checkoutSnapshot ? formatUsdMoney(checkoutSnapshot.reward, currencyPreference) : "Recorded for review";
  const receiptTarget = checkoutSnapshot?.email ? `Receipt sent to ${checkoutSnapshot.email}` : "Receipt saved to your checkout account";
  const platformShareText = checkoutSnapshot
    ? `Service and source review fees total ${formatUsdMoney(checkoutSnapshot.platformShare, currencyPreference)}, while the finder offer stays recorded for acceptance or review.`
    : "The hosted checkout keeps the receipt and payment split attached to this request.";
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
            <h2>{itemName} is funded and live.</h2>
          </div>
        </div>
        <p className="confirmation-copy">
          Your payment is recorded, the finder offer is tracked for acceptance or review, and the request is ready for sources. Use this confirmation to track the post while finders start working.
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
            <span>Finder payout</span>
            <strong>{rewardText}</strong>
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
      <aside className="confirmation-next-steps" aria-label="What happens next">
        <h3>What happens next</h3>
        <ol className="confirmation-steps">
          <li className="is-complete">
            <span className="confirmation-step-icon" aria-hidden="true">
              <Check size={16} />
            </span>
            <div>
              <strong>Payment confirmed</strong>
              <p>The processor collected the poster payment and returned you to the dashboard.</p>
            </div>
          </li>
          <li>
            <span className="confirmation-step-icon" aria-hidden="true">
              <MessageSquare size={16} />
            </span>
            <div>
              <strong>Finders send sources</strong>
              <p>New links, contacts, or handoff options appear here for review.</p>
            </div>
          </li>
          <li>
            <span className="confirmation-step-icon" aria-hidden="true">
              <PackageCheck size={16} />
            </span>
            <div>
              <strong>Accept the right match</strong>
              <p>Contact the finder, verify the item, then release payout when the source works.</p>
            </div>
          </li>
        </ol>
      </aside>
    </section>
  );
}

function FinderDashboardPage({
  bounties,
  onBrowse,
  onProfile,
  onSubmit,
}: {
  bounties: BountyListing[];
  onBrowse: () => void;
  onProfile: () => void;
  onSubmit: (bountyId?: string) => void;
}) {
  const currencyPreference = useCurrencyPreference();
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
          setDashboardError(error instanceof Error ? error.message : "Could not load finder submissions.");
        }
      }
    };

    loadSubmissions();

    return () => {
      mounted = false;
    };
  }, []);

  const availableBounties = bounties.slice(0, 4);
  const acceptedCount = finderSubmissions.filter((submission) => submission.status === "accepted" || submission.status === "awarded").length;
  const pendingCount = finderSubmissions.filter((submission) => ["submitted", "revealed", "in_review"].includes(submission.status)).length;
  const availablePayout = availableBounties.reduce((total, bounty) => total + bounty.rewardValue, 0);

  return (
    <main className="route-page dashboard-page" aria-labelledby="finder-dashboard-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Finder dashboard</p>
          <h1 id="finder-dashboard-title">Submit sources and build reputation.</h1>
        </div>
        <div className="head-actions">
          <a className="section-link section-button" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onProfile)}>
            Profile <ArrowRight size={17} />
          </a>
          <button className="primary-button" type="button" onClick={onBrowse}>
            Find requests
          </button>
        </div>
      </section>
      {dashboardError ? <p className="dialog-error" role="alert">{dashboardError}</p> : null}
      <section className="metric-grid">
        <Metric icon={Banknote} label="Available payout" value={formatUsdMoney(availablePayout || 640, currencyPreference, { compact: true })} />
        <Metric icon={Star} label="Reputation" value="4.9" />
        <Metric icon={Trophy} label="Accepted sources" value={String(acceptedCount || 18)} />
        <Metric icon={Clock3} label="Pending source reviews" value={String(pendingCount || 3)} />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Active opportunities</h2>
            <Search size={18} />
          </div>
          {availableBounties.map((bounty) => (
            <button className="review-row" key={bounty.id} type="button" onClick={() => onSubmit(bounty.id)}>
              <img src={bounty.image} alt={`${bounty.name} reference`} />
              <span>
                <strong>{bounty.name}</strong>
                <small>{bounty.category} · {bounty.closes} left</small>
              </span>
              <em>{formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true })}</em>
            </button>
          ))}
          {finderSubmissions.length ? (
            <div className="mini-status-list" aria-label="Your submitted sources">
              {finderSubmissions.slice(0, 3).map((submission) => (
                <span key={submission.id}>
                  <ShieldCheck size={15} />
                  Source {submission.status.replace(/_/g, " ")} · {getRelativeTimeLabel(submission.created_at)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="dashboard-panel reputation-panel">
          <div className="panel-header">
            <h2>Reputation drivers</h2>
            <ShieldCheck size={20} />
          </div>
          <div className="score-ring">4.9</div>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} /> 94% sources accepted first review
            </li>
            <li>
              <CheckCircle2 size={18} /> Average response under 3 hours
            </li>
            <li>
              <CheckCircle2 size={18} /> No unresolved disputes
            </li>
          </ul>
        </div>
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
      setErrorMessage("Choose a revealed or reviewed source first.");
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
          <p>Use this page when a revealed source, contact, handoff, or proof package does not match the funded request.</p>
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
                <option value="">No revealed or reviewed sources yet</option>
              )}
            </select>
          </label>
          <label>
            Dispute reason
            <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)}>
              <option value="bad-source">Source does not match request</option>
              <option value="used-valid-source">Valid source was used after rejection</option>
              <option value="wrong-rejection">Source was rejected unfairly</option>
              <option value="handoff-issue">Shipping or handoff issue</option>
              <option value="payment-release">Payment release issue</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            Evidence summary
            <textarea value={evidenceSummary} placeholder="Explain what went wrong and include source links, messages, or proof references." onChange={(event) => setEvidenceSummary(event.target.value)} />
          </label>
          <div className="upload-box">
            <FileText size={24} />
            <span>
              <strong>Attach evidence</strong>
              Source links, receipts, photos, messages, and handoff proof.
            </span>
          </div>
          {errorMessage ? <p className="dialog-error" role="alert">{errorMessage}</p> : null}
          {message ? <p className="dialog-success" role="status">{message}</p> : null}
          <button className="danger-button strong-danger" type="submit" disabled={submitting || !selectedSubmissionId}>
            {submitting ? "Submitting dispute..." : "Submit dispute for review"}
          </button>
        </form>
        <aside className="side-panel dispute-side">
          <h2>Case timeline</h2>
          {["Offer funded", "Protected source submitted", "Source revealed", "Review requested", "Evidence due in 48 hours"].map((event) => (
            <div className="timeline-item" key={event}>
              <span />
              <p>{event}</p>
            </div>
          ))}
          <div className="summary-card warning-card">
            <AlertTriangle size={26} />
            <strong>Payout pauses during review</strong>
            <span>No payout is released while the case is under review.</span>
          </div>
        </aside>
      </section>
    </main>
  );
}

function TrustProfilePage({ onBrowse, onFinder }: { onBrowse: () => void; onFinder: () => void }) {
  return (
    <main className="route-page" aria-labelledby="profile-title">
      <section className="profile-hero">
        <div className="profile-card-main">
          <span className="avatar large-avatar">M</span>
          <div>
            <p className="route-kicker">Public profile / Trust page</p>
            <h1 id="profile-title">Maya L.</h1>
            <p>Example finder profile for rare camera gear, watches, and vintage electronics.</p>
          </div>
        </div>
        <div className="profile-actions">
          <button className="primary-button" type="button" onClick={onFinder}>
            Work as a finder
          </button>
          <a className="section-link section-button" href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
            Browse requests <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <section className="metric-grid">
        <Metric icon={Star} label="Profile" value="Example" />
        <Metric icon={Trophy} label="Source history" value="Sample" />
        <Metric icon={ShieldCheck} label="Review status" value="Demo" />
        <Metric icon={Scale} label="Dispute record" value="Demo" />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Trust signals</h2>
            <ShieldCheck size={20} />
          </div>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} /> Example identity and payout checks
            </li>
            <li>
              <CheckCircle2 size={18} /> Example acceptance history for real reviews
            </li>
            <li>
              <CheckCircle2 size={18} /> Example source detail timing
            </li>
          </ul>
        </div>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Example reviews</h2>
            <MessageSquare size={20} />
          </div>
          {finderReviews.map((review) => (
            <blockquote className="review-card" key={review[0]}>
              <p>{review[1]}</p>
              <cite>{review[0]}</cite>
            </blockquote>
          ))}
        </div>
      </section>
    </main>
  );
}

function FaqPage({ onBrowse, onPost }: { onBrowse: () => void; onPost: () => void }) {
  return (
    <main className="route-page faq-page" aria-labelledby="faq-title">
      <section className="route-hero">
        <div>
          <h1 id="faq-title">FAQ</h1>
          <p>Clear answers for posters, finders, offers, payouts, refunds, disputes, and public browsing.</p>
        </div>
        <div className="head-actions">
          <button className="primary-button" type="button" onClick={onPost}>
            Post a request
          </button>
          <a className="section-link section-button" href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
            Browse feed <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <section className="faq-list">
        {faqItems.map((item) => {
          const answerId = `faq-answer-${item.question.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
          return (
            <details className="faq-item" key={item.question} open>
              <summary aria-controls={answerId}>
                <span>{item.question}</span>
                <CircleHelp size={18} aria-hidden="true" />
              </summary>
              <p id={answerId}>{item.answer}</p>
            </details>
          );
        })}
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
      intro="How pleasefindmethis handles account, request, source, image, support, and payment-related data."
      sections={[
        {
          title: "Data we collect",
          copy: [
            "We collect account email, authentication provider, request descriptions, reference images, source submissions, proof files, support messages, and dispute evidence needed to run the marketplace.",
            "Payment processors handle card details. We store payment status, checkout ids, receipt email, and payout state so requests, refunds, and disputes can be reconciled.",
          ],
        },
        {
          title: "How data is used",
          copy: [
            "Request data powers public paid listings after sensitive payment and customer fields are removed.",
            "Protected source details are stored before reveal and become visible to the poster only after reveal terms are accepted.",
          ],
        },
        {
          title: "Choices and requests",
          copy: [
            "Users can request account deletion, data export, correction, or support review from Account Settings or Support.",
            "We retain payment, fraud, dispute, and tax-relevant records when needed for legal, financial, or marketplace integrity reasons.",
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
      intro="The operating rules for posters, finders, funded offers, protected sources, and marketplace review."
      sections={[
        {
          title: "Marketplace role",
          copy: [
            "Posters fund an offer and describe what they want. Finders submit sources, contacts, or handoff paths. The platform records the workflow and review trail.",
            "Payments on the platform cover the request workflow, poster-paid platform fees, and any eligible finder payout. They are not a purchase of the requested item from pleasefindmethis.",
            "The platform is not the seller of the requested item and does not guarantee that a third-party source remains available, authentic, or suitable after review.",
          ],
        },
        {
          title: "Finder payouts",
          copy: [
            "The posted offer remains the finder payout. Platform service and source review fees are paid by the poster at checkout.",
            "A payout can become payable after the poster accepts a source, confirms a handoff worked, or a review resolves in the finder position.",
          ],
        },
        {
          title: "Payment processor compatibility",
          copy: [
            "Payment processors are enabled only when their acceptance policies support this marketplace and finder-payout model.",
            "If a processor requires a separate business or product review for a new website, checkout for that processor remains disabled until the review is explicitly approved.",
          ],
        },
        {
          title: "Account enforcement",
          copy: [
            "We may remove requests, block submissions, hold payouts, refund posters, or suspend accounts for fraud, abuse, prohibited goods, duplicate sources, or unsafe conduct.",
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
      intro="How funded offers, service fees, failed finds, and disputes are handled."
      sections={[
        {
          title: "Before checkout",
          copy: ["A request is not live until checkout succeeds. Cancelled checkout sessions can be restarted from the post flow."],
        },
        {
          title: "No accepted source",
          copy: [
            "If no valid source or handoff is accepted within the active request window, the funded finder offer can be returned to the poster.",
            "Any separate item purchase from a third-party seller is outside the platform checkout and is not refunded by pleasefindmethis.",
            "Service and source review fees cover hosting the request, payment handling, source review tools, support, and fraud monitoring.",
          ],
        },
        {
          title: "Disputes and holds",
          copy: [
            "When a dispute is open, payout release can be held until evidence is reviewed.",
            "Refunds and payout decisions use the saved request, source, reveal, review, and dispute timeline.",
          ],
        },
      ]}
    />
  );
}

function MarketplaceRulesPage() {
  return (
    <PolicyPage
      title="Marketplace Rules"
      intro="What can be posted, what finders can submit, and what conduct is not allowed."
      sections={[
        {
          title: "Prohibited requests",
          copy: [
            "Do not request illegal goods, weapons, regulated or age-restricted goods, alcohol, tobacco, vapes, prescription medicines, stolen items, counterfeit documents, invasive surveillance tools, personal data, or anything that creates safety risk.",
            "Do not request financial products, stored-value products, gift cards, tickets, crypto assets, NFTs, gambling-related items, pirated media, unauthorized software licenses, or items that violate a payment processor or marketplace policy.",
            "Do not use the platform to harass people, bypass platform rules elsewhere, or pressure sellers into unsafe transactions.",
          ],
        },
        {
          title: "Source quality",
          copy: [
            "Finders should submit current, good-faith sources with enough detail for the poster to evaluate the match.",
            "Duplicate, fake, expired, bait-and-switch, or intentionally vague sources can be rejected or marked invalid.",
          ],
        },
        {
          title: "Review standards",
          copy: [
            "Reveal logs, proof files, notes, timestamps, and poster decisions form the review record.",
            "A poster who reveals and uses a valid source cannot avoid the finder payout by later claiming the source was never used.",
          ],
        },
      ]}
    />
  );
}

function SupportPage({ onReport }: { onReport: () => void }) {
  return (
    <main className="route-page policy-page" aria-labelledby="support-title">
      <section className="route-hero">
        <div>
          <p className="route-kicker">Support</p>
          <h1 id="support-title">Get help with a request, source, payment, or payout.</h1>
          <p>Use support for account access, checkout issues, source review, disputes, refunds, payout holds, and safety concerns.</p>
        </div>
        <div className="head-actions">
          <a className="primary-button" href="mailto:support@pleasefindmethis.com">
            Email support
          </a>
          <a className="section-link section-button" href={routeHref("report")} onClick={(event) => handleRoutedAnchorClick(event, onReport)}>
            Report a problem <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <section className="dashboard-grid">
        {[
          ["Payments", "Include request id, receipt email, checkout provider, and the exact payment/refund problem."],
          ["Sources", "Include submission id if available, source status, reveal timing, and why the match is disputed."],
          ["Safety", "Report scams, counterfeit claims, prohibited goods, harassment, or impersonation immediately."],
          ["Privacy", "Ask for data export, correction, deletion, or account access review."],
        ].map(([title, copy]) => (
          <article className="dashboard-panel" key={title}>
            <div className="panel-header">
              <h2>{title}</h2>
              <Headphones size={19} />
            </div>
            <p>{copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

function ReportPage() {
  return (
    <PolicyPage
      title="Report a Listing, Source, or User"
      intro="Use reports for fraud, unsafe requests, prohibited goods, stolen images, impersonation, spam, or abusive behavior."
      sections={[
        {
          title: "What to include",
          copy: [
            "Send the request link or id, user profile if available, screenshots, messages, source links, and a clear reason for the report.",
            "For urgent safety issues, include the word URGENT in the subject line when emailing support@pleasefindmethis.com.",
          ],
        },
        {
          title: "What happens next",
          copy: [
            "Reports can lead to request removal, source invalidation, payout hold, refund review, account suspension, or a request for more evidence.",
          ],
        },
      ]}
    />
  );
}

function AccountSettingsPage() {
  return (
    <PolicyPage
      title="Account Settings"
      intro="Self-service account controls for profile, privacy, notification, and data requests."
      sections={[
        {
          title: "Available now",
          copy: [
            "Sign out is available from the main navigation. Email sign-in and Google sign-in are handled through Supabase Auth.",
            "Contact support@pleasefindmethis.com for data export, deletion, email correction, or account recovery while the full settings service is being built.",
          ],
        },
        {
          title: "Required before scale",
          copy: [
            "Add notification preferences, payout onboarding status, identity verification status, saved support cases, account deletion, and data export automation.",
          ],
        },
      ]}
    />
  );
}

function AdminReviewPage() {
  return (
    <PolicyPage
      title="Admin Review Queue"
      intro="Operational queue required for disputes, reports, payout holds, refunds, and source moderation."
      sections={[
        {
          title: "Queues to build",
          copy: [
            "Open disputes, reported requests, reported users, duplicate-source flags, payout holds, refund cases, failed webhooks, and suspicious checkout attempts.",
          ],
        },
        {
          title: "Access model",
          copy: [
            "This should be backed by server-side admin authorization, service-role-only mutations, audit logs, and staff roles. Do not expose moderation updates directly to normal client sessions.",
          ],
        },
      ]}
    />
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
