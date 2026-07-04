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
  CalendarDays,
  Camera,
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
  Images,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
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
import {
  getCheckoutAnalyticsContext,
  initializeGoogleAnalytics,
  trackMarketingEvent,
  trackPageView,
  type AnalyticsProperties,
} from "./lib/analytics";
import "./styles.css";

type Page =
  | "landing"
  | "auth"
  | "post-photo"
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
type WaitlistIntent = "post" | "browse";

type WaitlistModalState = {
  intent: WaitlistIntent;
  source: string;
};

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

type RequestCategory = "home" | "audio" | "camera" | "watch" | "gaming" | "parts" | "fashion";
type PostStarterId = "sentimental" | "rare-gear" | "parts" | "fashion";
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

type StoredPostDraft = Omit<PostDraft, "referenceImages">;

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
const configuredPublicAppOrigin = normalizeClientAppOrigin(import.meta.env.VITE_PUBLIC_APP_URL) || siteOrigin;
const defaultSeoDescription =
  "pleasefindmethis.com helps people find sold-out, rare, vintage, and hard-to-find items by posting a request and offering a finder reward.";
const defaultSocialDescription = "Post the item you want found. Offer a reward. Review protected sources from people who know where to look.";
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
const siteLastUpdated = "2026-07-03";
const siteLastUpdatedDisplay = "July 3, 2026";

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
  itemName: "Help me find this art",
  category: "home",
  details: "",
  referenceImages: [],
  reward: 180,
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
      "I need the exact same item, not a close match. Must match the reference photo, color, size, pattern, label, and condition closely enough to buy with confidence.",
    reward: 75,
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
      "I am looking for the exact model or reference. Include condition, price, seller/source, shipping region, and any authenticity or compatibility details before I reveal the source.",
    reward: 120,
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
      "I need a compatible part or donor unit. Please include model numbers, compatibility proof, condition, source link or seller contact, and any fitment risks.",
    reward: 60,
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
      "I need the exact item or a source for the same style. Please include brand, size, colorway, condition, listing/source, and the details that prove it is not just a similar lookalike.",
    reward: 50,
    durationDays: 30,
  },
];

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
  "post-photo",
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
  "post-photo": "Post Request - Add photo",
  "post-describe": "Post Request - Describe",
  "post-reward": "Post Request - Set reward",
  "post-pay": "Post Request - Pay",
  browse: "Browse requests",
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
  post: "post-photo",
  "post/photo": "post-photo",
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
  "post-photo": "post/photo",
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
    description: "Sign in to post requests, submit protected sources, review protected sources, manage payouts, and keep marketplace actions tied to an account.",
  },
  "post-photo": {
    title: "Add a Request Photo | pleasefindmethis.com",
    description: "Start a find request by taking a new item photo or choosing a reference image from your gallery.",
  },
  "post-describe": {
    title: "Post a Hard-to-Find Item Request | pleasefindmethis.com",
    description: "Describe the exact item, add reference photos, and tell finders what counts as a match before setting a reward.",
  },
  "post-reward": {
    title: "Set a Finder Reward | pleasefindmethis.com",
    description: "Choose the reward a finder can earn when you accept a valid source or complete a handoff.",
  },
  "post-pay": {
    title: "Fund a Protected Request | pleasefindmethis.com",
    description: "Fund the request before it goes live so finders know the reward is real and recorded.",
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
    description: "Review the item details, must-have criteria, finder reward, and source timeline for this protected find request.",
  },
  "submit-find": {
    title: "Submit a Protected Source | pleasefindmethis.com",
    description: "Submit a store link, seller contact, local source, or handoff option for a funded request.",
  },
  "poster-dashboard": {
    title: "Poster Dashboard | pleasefindmethis.com",
    description: "Review protected sources, reveal sources, accept matches, and manage funded requests.",
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
    description: "Answers about payments, refunds, protected sources, finder rewards, public browsing, disputes, and how pleasefindmethis.com works.",
  },
  privacy: {
    title: "Privacy Policy | pleasefindmethis.com",
    description: "How pleasefindmethis.com handles account, request, source, image, support, and payment-related data.",
  },
  terms: {
    title: "Terms of Service | pleasefindmethis.com",
    description: "Marketplace terms for posters, finders, funded rewards, protected sources, reviews, and payouts.",
  },
  refunds: {
    title: "Refund and Cancellation Policy | pleasefindmethis.com",
    description: "How funded rewards, service fees, failed finds, disputes, and refund reviews work on pleasefindmethis.com.",
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
const postDraftStorageKey = "pleasefindmethis-post-draft";
const waitlistDeadlineStorageKey = "pleasefindmethis-waitlist-deadline";
const waitlistEmailStorageKey = "pleasefindmethis-waitlist-email";
const requestReferenceImagesBucket = "request-reference-images";
const sourceSubmissionProofBucket = "source-submission-proof";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const waitlistCountdownDurationMs = 72 * 60 * 60 * 1000;
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
  "What do you want found?",
  "Find me this mug - $20 reward",
  "Help me find this blanket",
  "Find this sold-out hoodie",
  "Find me this pair of socks",
  "Find me this date night dress",
  "Find this plush toy for my kid",
  "Help me find this cat mug",
  "Find this old wallet",
  "Find this retired Jellycat",
  "Find this discontinued pillow",
  "Where can I buy this bag?",
  "Find this watch - $50 reward",
  "Find me a cheaper version",
  "Find this replacement plate",
  "Help me track down these shoes",
  "Find this vintage tee",
  "Find this camera part",
  "Find this wall art print",
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
  const details = row.details?.trim() || "Finder can submit a public listing, shop contact, private source, or direct handoff option.";
  const rewardText = `US$${row.reward.toLocaleString("en-US")}`;

  return {
    id: row.id,
    name: row.item_name || "Hard-to-find item",
    detail: `Finder reward ${rewardText}`,
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
    timeline: ["Reward funded", `${row.submission_count ?? 0} protected source${row.submission_count === 1 ? "" : "s"}`, "Finders can submit sources"],
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
    detail: `Finder reward ${rewardText}`,
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
      row.payout_status === "payable" ? "Finder reward is payable" : "Awaiting accepted source",
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
  return storedRoute && storedRoute in pageRoutes ? (storedRoute as Page) : "post-photo";
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
    timeline: ["Reward funded", "Four people helping", "Latest source received today"],
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
    timeline: ["Reward funded", "Two sources received", "Model number being checked"],
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
    timeline: ["Reward funded", "Three people searching", "One similar listing reviewed"],
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
    timeline: ["Reward funded", "New request", "Finders can submit links"],
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
    timeline: ["Reward funded", "Finder shared a source", "Source marked found"],
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
    timeline: ["Reward funded", "New request", "Finders can submit sources"],
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
    timeline: ["Reward funded", "Finder shared two local options", "Shutter count requested"],
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
    timeline: ["Reward funded", "Local source found in London", "Authenticity check underway"],
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
    timeline: ["Reward funded", "Synth forums contacted", "Awaiting test clips"],
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
    timeline: ["Reward funded", "Three dealers contacted", "Waiting on papers"],
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
    timeline: ["Reward funded", "Two sources rejected", "New photos requested"],
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
    timeline: ["Reward funded", "Japan sellers contacted", "First source under review"],
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
    timeline: ["Reward funded", "New request", "Finders can submit parts"],
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
    timeline: ["Reward funded", "Two sources received", "Waiting on sample photo"],
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
    timeline: ["Reward funded", "Five submissions", "Battery photos requested"],
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
    timeline: ["Reward funded", "Collector groups contacted", "Awaiting meter video"],
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
    timeline: ["Reward funded", "First source received", "USB proof requested"],
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
    timeline: ["Reward funded", "Two local stores checked", "One complete copy under review"],
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
    timeline: ["Reward funded", "DJ repair shops contacted", "Waiting on photos"],
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
    timeline: ["Reward funded", "Three sources received", "Best source missing screw"],
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
    timeline: ["Reward funded", "Four sellers found", "Controller match pending"],
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
    timeline: ["Reward funded", "Pilot group posted", "Two sources being checked"],
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
    timeline: ["Reward funded", "Five backs located", "Best one awaiting test roll"],
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
    timeline: ["Reward funded", "Audiophile forum posted", "One source needs channel test"],
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
    timeline: ["Reward funded", "New request", "Finders can submit handhelds"],
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
    timeline: ["Reward funded", "One collector contacted", "Awaiting demo clip"],
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
    timeline: ["Reward funded", "Two listings reviewed", "Best source awaiting glass photos"],
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
    title: "The good source vanished",
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
    copy: "Stop opening the same bad results. Post one clear request instead.",
  },
];

const workSteps = [
  {
    icon: Search,
    title: "1. Post the item",
    copy: "Add photos and the must-have details that separate the right item from lookalikes.",
  },
  {
    icon: LockKeyhole,
    title: "2. Offer a reward",
    copy: "Choose what a finder can earn for a valid link, seller contact, local source, or handoff.",
  },
  {
    icon: BadgeCheck,
    title: "3. Review protected sources",
    copy: "Preview each source, reveal the full source when you are ready, then accept it if it works.",
  },
];

const leftFindRequests = [
  {
    copy: "Please find me this old wallet.",
    image: "/find-requests/wallet.jpg",
  },
  {
    copy: "Reward if you find these black shoes.",
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
    copy: "Reward for helping me find this rubber band.",
    image: "/find-requests/purple-rubber-band.jpg",
  },
  {
    copy: "Reward if you find this red taillight piece.",
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
    copy: "Reward if you find this orange fox plush.",
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
    title: "Fund the finder reward",
    copy: "Your request goes live after checkout, so finders know the reward is real.",
  },
  {
    icon: Search,
    title: "Source details stay private",
    copy: "The link, contact, notes, and proof are saved before you reveal the full details.",
  },
  {
    icon: ShieldCheck,
    title: "Reveal creates a record",
    copy: "When you open the full source, that moment is logged for both sides.",
  },
  {
    icon: CheckCircle2,
    title: "Accept or reject clearly",
    copy: "Accept a match, or reject it with a reason such as wrong item, sold out, bad condition, or price mismatch.",
  },
  {
    icon: Headphones,
    title: "Review handles disputes",
    copy: "If a revealed source is used or disputed, the saved record helps decide the reward.",
  },
];

const reviewProtectionSteps = [
  {
    icon: ShieldCheck,
    title: "Source details are saved before reveal",
    copy: "The source, notes, proof, and time submitted are kept so the story cannot change later.",
  },
  {
    icon: BadgeCheck,
    title: "First good source gets priority",
    copy: "If two finders send the same source, the earlier valid submission gets priority.",
  },
  {
    icon: ShieldAlert,
    title: "Rejections need a reason",
    copy: "Wrong item, unavailable listing, fake seller, bad condition, or price mismatch are valid review reasons.",
  },
  {
    icon: Scale,
    title: "A used valid source can still be paid",
    copy: "If a poster reveals and uses a correct source, review can still release the reward to the finder.",
  },
];

const comparisonRows = [
  ["Funded reward before finder work", "Yes", "No", "No", "Maybe"],
  ["Source recorded before reveal", "Yes", "No", "No", "No"],
  ["Clear request brief with photos", "Yes", "Maybe", "No", "Maybe"],
  ["Duplicate source priority", "Yes", "No", "No", "No"],
  ["Review trail if there is a dispute", "Yes", "No", "No", "Maybe"],
  ["Human sourcing beyond search results", "Yes", "Maybe", "Limited", "Maybe"],
];

const answerBlocks = [
  {
    question: "What is pleasefindmethis.com?",
    answer:
      "pleasefindmethis.com is a request board for hard-to-find items. A poster funds a reward for one specific item, then finders submit protected source links, seller contacts, local availability, or handoff paths that match the request.",
  },
  {
    question: "When should someone post a find request?",
    answer:
      "Post a find request when normal search keeps returning near matches, dead listings, unclear model names, or risky DMs. It fits exact sentimental replacements, discontinued goods, rare gear, watches, repair parts, collectibles, and other items where a human source matters.",
  },
  {
    question: "What is a protected source?",
    answer:
      "A protected source is a saved submission the poster cannot fully see until reveal. The link, contact, proof, notes, and timestamp create a review record so a finder can get credit when the source is accepted or wins review.",
  },
  {
    question: "What can finders submit?",
    answer:
      "Finders can submit a public listing, shop page, seller contact, local source, direct handoff option, model number, source clue, or compatibility proof. A strong submission explains why the item matches the poster's photos, must-have details, location, price, and condition requirements.",
  },
];

const useCaseBlocks = [
  {
    title: "Sentimental replacements",
    copy: "Lost blankets, plush toys, mugs, art, decor, family items, and exact-photo replacements where a close dupe is not enough.",
  },
  {
    title: "Collector gear",
    copy: "Cult cameras, watches, vintage electronics, handhelds, audio gear, and model references where naming varies by market.",
  },
  {
    title: "Repair parts",
    copy: "Discontinued parts, donor units, hinges, shells, cables, battery covers, appliance components, and compatibility details.",
  },
  {
    title: "Sold-out fashion",
    copy: "Exact clothing, accessories, colorways, sizes, labels, and discontinued styles that visual search keeps matching incorrectly.",
  },
];

const finderReviews = [
  ["Ari P.", "Maya found the exact cap in two days and included the seller link plus what to ask before buying."],
  ["Theo N.", "The source review made it easy to avoid a risky listing and choose the right part."],
  ["June R.", "The finder already had the lens and left an email so we could agree on shipping directly."],
];

const faqItems = [
  {
    question: "How does pleasefindmethis.com work?",
    answer:
      "A poster creates a request with photos, must-have details, location, duration, and a funded finder reward. Finders submit protected sources, the poster reveals and reviews promising protected sources, and an accepted source or review decision can make the reward payable to the finder.",
  },
  {
    question: "What is a protected source?",
    answer:
      "A protected source is a saved submission that stays private until the poster reveals it. The platform records the link or contact, notes, proof, and timestamp before reveal so duplicate priority, acceptance, rejection, and review can use a clear trail.",
  },
  {
    question: "When do I pay?",
    answer:
      "You pay before the request goes live. Checkout shows the finder reward, platform service fee, and source review fee before you pay. If a source works, you buy the item separately from the third-party seller or source.",
  },
  {
    question: "What happens if nobody finds it?",
    answer:
      "If the request is not fulfilled during the active request window, the funded finder reward can be returned under the refund policy. Service and source review fees cover the live request, payment handling, review tools, and support.",
  },
  {
    question: "Can I reject a find?",
    answer:
      "Yes. You can reject submissions that do not match your description, do not include enough source detail, or do not provide a clear contact path.",
  },
  {
    question: "How do finders get paid?",
    answer:
      "Finders can earn the posted reward when the source is accepted, the handoff is confirmed, or review resolves in their favor. We do not take a cut from the finder reward.",
  },
  {
    question: "What should I include in a good find request?",
    answer:
      "A good request includes clear reference photos, item name or suspected brand, size, color, condition, location, budget, must-have details, and what counts as an acceptable source. Mention wrong matches you already found so finders do not repeat the same dead ends.",
  },
  {
    question: "What can a finder submit?",
    answer:
      "A finder can submit a store link, resale listing, seller contact, local shop contact, direct handoff path, model number, compatibility clue, or proof package. The submission should include enough context for the poster to judge whether the source matches the request.",
  },
  {
    question: "How does pleasefindmethis make money?",
    answer:
      "Posters pay a 12% platform service fee plus a 3% payment handling and source review fee at checkout. The reward amount remains the finder payout.",
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
      referenceImages: [],
      reward: prompt.reward,
      durationDays: prompt.durationDays,
    } satisfies PostDraft,
  };
}

function isRequestCategory(value: unknown): value is RequestCategory {
  return typeof value === "string" && requestCategories.some((category) => category.value === value);
}

function isRequestDuration(value: unknown): value is RequestDuration {
  return value === 14 || value === 30 || value === 60;
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
  return {
    ...storedDraft,
    referenceImages: [],
  };
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

function createReferenceImageDrafts(files: File[]): ReferenceImageDraft[] {
  return files.map((file) => ({
    file,
    name: file.name,
    url: URL.createObjectURL(file),
  }));
}

function revokeReferenceImageDrafts(images: ReferenceImageDraft[]) {
  images.forEach((image) => URL.revokeObjectURL(image.url));
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
    const description = `${activeBounty.description} Finder reward: ${activeBounty.reward}. ${activeBounty.category} request, ${activeBounty.closes} left.`;

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

function createMarketplaceServiceSchema(organizationId: string): JsonLdNode {
  return {
    "@type": "Service",
    "@id": `${siteOrigin}/#service`,
    name: "Hard-to-find item request marketplace",
    alternateName: siteName,
    serviceType: "Hard-to-find item marketplace",
    url: siteOrigin,
    provider: { "@id": organizationId },
    areaServed: "Worldwide",
    description:
      "pleasefindmethis.com lets posters fund requests for hard-to-find items and lets finders submit protected sources for accepted rewards.",
    audience: [
      {
        "@type": "Audience",
        audienceType: "Posters looking for discontinued, sold-out, rare, or sentimental items",
      },
      {
        "@type": "Audience",
        audienceType: "Finders with niche sourcing knowledge, seller contacts, or local availability",
      },
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: minimumReward + minimumPlatformFee + minimumTrustProtectionFee,
      description:
        "Poster checkout starts with a US$10 minimum finder reward plus a US$6 minimum platform service fee and a US$1 minimum payment handling and source review fee.",
    },
    termsOfService: `${siteOrigin}/terms`,
  };
}

function createQuestionSetSchema(canonicalUrl: string, items: typeof faqItems | typeof answerBlocks, id: string): JsonLdNode {
  return {
    "@type": "FAQPage",
    "@id": `${canonicalUrl}#${id}`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function createLandingHowToSchema(canonicalUrl: string): JsonLdNode {
  return {
    "@type": "HowTo",
    "@id": `${canonicalUrl}#post-find-request-howto`,
    name: "How to post a funded find request",
    description: "The basic workflow for creating a protected request on pleasefindmethis.com.",
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
  const webPageType = page === "support" ? "ContactPage" : "WebPage";
  const webPage: JsonLdNode = {
    "@type": webPageType,
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
    graph.push(createQuestionSetSchema(canonicalUrl, answerBlocks, "homepage-answers"));
    graph.push(createLandingHowToSchema(canonicalUrl));
  }

  if (page === "faq") {
    graph.push(createQuestionSetSchema(canonicalUrl, faqItems, "faq"));
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
  setMetaTag("property", "og:image:alt", "A reward-style poster asking for help finding a vintage T-shirt with a protected source.");
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", meta.title);
  setMetaTag("name", "twitter:description", socialDescription);
  setMetaTag("name", "twitter:image", meta.image);
  setMetaTag("name", "twitter:image:alt", "A reward-style poster asking for help finding a vintage T-shirt with a protected source.");
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
  const [postDraft, setPostDraft] = useState<PostDraft>(() => getInitialPostDraft());
  const [waitlistModal, setWaitlistModal] = useState<WaitlistModalState | null>(null);
  const [activeBountyId, setActiveBountyId] = useState(() => getBountyIdFromCurrentRoute() || bountyListings[0].id);
  const {
    listings: liveBounties,
    loading: publicRequestsLoading,
    error: publicRequestsError,
  } = usePublicRequestListings();
  const marketplaceBounties = useMemo(() => mergeBounties(liveBounties, bountyListings), [liveBounties]);
  const acquisitionStarter = getAcquisitionStarterFromUrl();

  useEffect(() => {
    initializeGoogleAnalytics();
  }, []);

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

  useEffect(() => {
    trackPageView({
      route: visibleRoute,
      bounty_id: visibleRoute === "bounty-detail" ? activeBounty.id : undefined,
      category: visibleRoute === "bounty-detail" ? activeBounty.category : undefined,
      signed_in: signedIn,
    });

    if (visibleRoute === "landing") {
      trackAcquisitionEvent("landing_view", {
        signed_in: signedIn,
      });
    }
  }, [activeBounty.category, activeBounty.id, signedIn, visibleRoute]);

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
    setPendingRoute("post-photo");
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

  const openWaitlistModal = (intent: WaitlistIntent, source: string) => {
    setMenuOpen(false);
    setWaitlistModal({ intent, source });
    trackAcquisitionEvent("waitlist_modal_opened", {
      intent,
      source,
      signed_in: signedIn,
    });
  };

  const startPostRequest = (location: string, prompt?: PostStarterPrompt) => {
    const urlStarter = !prompt ? getAcquisitionStarterFromUrl() : null;
    const selectedPrompt = prompt ?? urlStarter?.prompt ?? null;

    if (selectedPrompt) {
      const nextDraft =
        urlStarter?.draft ?? {
          itemName: selectedPrompt.itemName,
          category: selectedPrompt.category,
          details: selectedPrompt.details,
          referenceImages: [],
          reward: selectedPrompt.reward,
          durationDays: selectedPrompt.durationDays,
        };

      setPostDraft(nextDraft);
      writeStoredPostDraft(nextDraft);
    }

    trackAcquisitionEvent("start_bounty", {
      location,
      signed_in: signedIn,
      prompt: selectedPrompt?.label ?? "blank",
      starter_id: selectedPrompt?.id,
      from_starter_link: Boolean(urlStarter),
    });
    requireAuth("post-photo");
  };

  const continueFromPhoto = () => {
    navigate("post-describe");
  };

  const continueFromDescribe = () => {
    trackAcquisitionEvent("post_describe_completed", {
      category: getCategoryLabel(postDraft.category),
      has_item_name: Boolean(postDraft.itemName.trim()),
      has_details: Boolean(postDraft.details.trim()),
      reference_image_count: postDraft.referenceImages.length,
    });
    navigate("post-reward");
  };

  const continueFromReward = () => {
    const breakdown = getPaymentBreakdown(postDraft.reward);
    trackAcquisitionEvent("set_reward", {
      category: getCategoryLabel(postDraft.category),
      duration_days: postDraft.durationDays,
      reward: breakdown.reward,
      total_due: breakdown.total,
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
    onBrowseRequest: () => openWaitlistModal("browse", "app_header_browse"),
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
          onBrowse={() => openWaitlistModal("browse", "landing_browse")}
          onBrowseAll={() => openWaitlistModal("browse", "landing_browse_all")}
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
          onPost={(location) => startPostRequest(location)}
          onPostPrompt={(prompt) => startPostRequest(`starter_${prompt.category}`, prompt)}
          acquisitionStarterPrompt={acquisitionStarter?.prompt ?? null}
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
              onPublicBrowse={() => openWaitlistModal("browse", "auth_public_browse")}
            />
          ) : null}
          {visibleRoute === "post-photo" ? (
            <PostPhotoSourcePage draft={postDraft} onBack={() => navigate("landing")} onDraftChange={updatePostDraft} onNext={continueFromPhoto} />
          ) : null}
          {visibleRoute === "post-describe" ? (
            <PostDescribePage draft={postDraft} onBack={() => navigate("post-photo")} onDraftChange={updatePostDraft} onNext={continueFromDescribe} />
          ) : null}
          {visibleRoute === "post-reward" ? (
            <PostRewardPage draft={postDraft} onBack={() => navigate("post-describe")} onDraftChange={updatePostDraft} onNext={continueFromReward} />
          ) : null}
          {visibleRoute === "post-pay" ? <PostPayPage checkoutReturnStatus={checkoutReturnStatus} draft={postDraft} onBack={() => navigate("post-reward")} /> : null}
          {visibleRoute === "browse" ? (
            <BrowsePage
              bounties={marketplaceBounties}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onBrowseAll={() => openWaitlistModal("browse", "browse_featured_all")}
              onDetail={goToDetail}
              onPost={() => startPostRequest("browse_featured")}
            />
          ) : null}
          {visibleRoute === "browse-all" ? (
            <BrowseAllPage
              bounties={marketplaceBounties}
              dataError={publicRequestsError}
              dataLoading={publicRequestsLoading}
              onDetail={goToDetail}
              onPost={() => startPostRequest("browse_all")}
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
          {visibleRoute === "faq" ? <FaqPage onBrowse={() => openWaitlistModal("browse", "faq_browse")} onPost={() => startPostRequest("faq_post")} /> : null}
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
      {waitlistModal ? (
        <WaitlistDialog
          intent={waitlistModal.intent}
          onClose={() => setWaitlistModal(null)}
          source={waitlistModal.source}
        />
      ) : null}
    </CurrencyContext.Provider>
  );
}

function WaitlistDialog({
  intent,
  onClose,
  source,
}: {
  intent: WaitlistIntent;
  onClose: () => void;
  source: string;
}) {
  const [email, setEmail] = useState(() => window.localStorage.getItem(waitlistEmailStorageKey) ?? window.sessionStorage.getItem(authEmailStorageKey) ?? "");
  const [accessNote, setAccessNote] = useState("");
  const [deadlineMs] = useState(() => getWaitlistDeadlineMs());
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, deadlineMs - Date.now()));
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [buttonRipples, setButtonRipples] = useState<Array<{ id: number; size: number; x: number; y: number }>>([]);
  const title = intent === "post" ? "Get notified when posting opens." : "Get notified when requests open.";
  const body =
    intent === "post"
      ? "Leave your email and we will send one note when you can post paid find requests."
      : "Leave your email and we will send one note when you can browse open requests.";
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAccessNote = accessNote.trim();
  const emailHasValue = normalizedEmail.length > 0;
  const emailIsValid = emailPattern.test(normalizedEmail);
  const emailIsInvalid = (emailTouched || submitStatus === "error") && !emailIsValid;
  const countdownText = formatWaitlistCountdown(remainingMs);
  const [countdownHours, countdownMinutes, countdownSeconds] = countdownText.split(" ");
  const countdownTiles = [
    { label: "Hours", unit: "h", value: countdownHours.replace("h", "") },
    { label: "Minutes", unit: "m", value: countdownMinutes.replace("m", "") },
    { label: "Seconds", unit: "s", value: countdownSeconds.replace("s", "") },
  ];
  const isSuccess = submitStatus === "success";
  const countdownProgress = Math.min(1, Math.max(0, (waitlistCountdownDurationMs - remainingMs) / waitlistCountdownDurationMs));
  const formStateClass = submitStatus === "loading" ? "is-loading" : isSuccess ? "is-success" : "";
  const emailFieldClass = `waitlist-email-field ${emailIsValid && emailHasValue ? "is-valid" : ""} ${emailIsInvalid ? "is-invalid" : ""}`.trim();
  const statusId = "waitlist-status-message";

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRemainingMs(Math.max(0, deadlineMs - Date.now()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [deadlineMs]);

  const joinWaitlist = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setEmailTouched(true);
    setMessage("");

    if (!emailIsValid) {
      setSubmitStatus("error");
      setMessage("Enter a valid email address so we can notify you.");
      return;
    }

    setSubmitStatus("loading");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          accessNote: normalizedAccessNote,
          intent,
          source,
          pagePath: `${window.location.pathname}${window.location.search}`,
          referrer: document.referrer,
        }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.error || "We could not save your email. Check it and try again.");
      }

      window.localStorage.setItem(waitlistEmailStorageKey, normalizedEmail);
      trackAcquisitionEvent("waitlist_joined", {
        intent,
        source,
        email_queued: payload?.emailQueued !== false,
      });
      setSubmitStatus("success");
      setMessage("You are on the waitlist. We will email you when access opens.");
    } catch (error) {
      setSubmitStatus("error");
      setMessage(error instanceof Error ? error.message : "We could not save your email. Check it and try again.");
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const updateEmail = (nextEmail: string) => {
    setEmail(nextEmail);
    if (submitStatus === "error") {
      setSubmitStatus("idle");
      setMessage("");
    }
  };

  const createSubmitRipple = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (submitStatus === "loading" || isSuccess) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.08;
    setButtonRipples((currentRipples) => [
      ...currentRipples.slice(-3),
      {
        id: Date.now(),
        size,
        x: event.clientX - rect.left - size / 2,
        y: event.clientY - rect.top - size / 2,
      },
    ]);
  };

  return (
    <div className="dialog-backdrop waitlist-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`starter-dialog waitlist-dialog ${isSuccess ? "is-success" : ""}`} role="dialog" aria-modal="true" aria-labelledby="waitlist-title">
        <span className="waitlist-glow waitlist-glow-green" aria-hidden="true" />
        <span className="waitlist-glow waitlist-glow-gold" aria-hidden="true" />
        <div className="waitlist-scan-line" aria-hidden="true" />
        <button className="dialog-close" type="button" aria-label="Close waitlist form" onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
        <div className="waitlist-dialog-copy">
          <div className="waitlist-brand-row">
            <span className="waitlist-logo-mark" aria-hidden="true">
              <img src="/magnifying-glass.png" alt="" />
            </span>
            <span className="waitlist-brand-copy">
              <strong>{siteName}</strong>
              <small>Early access</small>
            </span>
          </div>
          <h2 id="waitlist-title">{title}</h2>
          <p>{body}</p>
        </div>
        <form className={`waitlist-form ${formStateClass}`} onSubmit={joinWaitlist}>
          <div className="waitlist-countdown" aria-label={`Countdown ${countdownText}`}>
            <span className="countdown-progress" style={{ transform: `scaleX(${countdownProgress})` }} aria-hidden="true" />
            <div className="countdown-label">
              <Clock3 size={18} aria-hidden="true" />
              <span>Opening in</span>
            </div>
            <div className="countdown-tiles" aria-hidden="true">
              {countdownTiles.map((tile) => (
                <span className="countdown-tile" key={tile.label}>
                  <strong key={`${tile.label}-${tile.value}`}>{tile.value}</strong>
                  <em>{tile.unit}</em>
                  <small>{tile.label}</small>
                </span>
              ))}
            </div>
            <strong className="sr-only">{countdownText}</strong>
          </div>
          <label className={emailFieldClass}>
            <span>Email address</span>
            <span className="email-input-shell">
              <Mail size={18} aria-hidden="true" />
              <input
                type="email"
                value={email}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
                disabled={submitStatus === "loading" || submitStatus === "success"}
                aria-invalid={emailIsInvalid || undefined}
                aria-describedby={message ? statusId : undefined}
                onBlur={() => setEmailTouched(true)}
                onChange={(event) => updateEmail(event.target.value)}
              />
              {emailHasValue ? (
                <span className="email-state-icon" aria-hidden="true">
                  {emailIsValid ? <CheckCircle2 size={17} /> : emailIsInvalid ? <ShieldAlert size={17} /> : null}
                </span>
              ) : null}
            </span>
          </label>
          <label className="waitlist-comment-field">
            <span>Comment</span>
            <span className="comment-input-shell">
              <textarea
                value={accessNote}
                placeholder="What are you trying to find?"
                rows={3}
                maxLength={500}
                disabled={submitStatus === "loading" || submitStatus === "success"}
                onChange={(event) => setAccessNote(event.target.value)}
              />
            </span>
          </label>
          <button
            className={`primary-button wide-button ${submitStatus === "loading" ? "is-loading" : ""} ${isSuccess ? "is-success" : ""}`}
            type="submit"
            disabled={submitStatus === "loading" || submitStatus === "success"}
            aria-busy={submitStatus === "loading" || undefined}
            onPointerDown={createSubmitRipple}
          >
            {submitStatus === "loading" ? <span className="button-spinner" aria-hidden="true" /> : isSuccess ? <CheckCircle2 size={17} aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
            <span>{submitStatus === "loading" ? "Saving email..." : submitStatus === "success" ? "Email saved" : "Notify me"}</span>
            {submitStatus === "loading" ? <span className="waitlist-submit-progress" aria-hidden="true" /> : null}
            {buttonRipples.map((ripple) => (
              <span
                className="waitlist-button-ripple"
                key={ripple.id}
                style={{ height: ripple.size, left: ripple.x, top: ripple.y, width: ripple.size }}
                onAnimationEnd={() => setButtonRipples((currentRipples) => currentRipples.filter((item) => item.id !== ripple.id))}
                aria-hidden="true"
              />
            ))}
          </button>
          <p className="waitlist-privacy-note">
            <ShieldCheck size={15} aria-hidden="true" />
            We will only email you about early access.
          </p>
        </form>
        {message ? (
          <div className={submitStatus === "error" ? "dialog-error waitlist-status" : "dialog-success waitlist-status"} id={statusId} role={submitStatus === "error" ? "alert" : "status"} aria-live="polite">
            {submitStatus === "success" ? <CheckCircle2 size={18} aria-hidden="true" /> : <ShieldAlert size={18} aria-hidden="true" />}
            <span>{message}</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function getWaitlistDeadlineMs() {
  const configuredDeadline = String(import.meta.env.VITE_WAITLIST_DEADLINE_AT ?? "").trim();
  const configuredDeadlineMs = configuredDeadline ? Date.parse(configuredDeadline) : Number.NaN;

  if (Number.isFinite(configuredDeadlineMs)) {
    return configuredDeadlineMs;
  }

  const storedDeadline = Number(window.localStorage.getItem(waitlistDeadlineStorageKey));

  if (Number.isFinite(storedDeadline) && storedDeadline > 0) {
    return storedDeadline;
  }

  const deadlineMs = Date.now() + waitlistCountdownDurationMs;
  window.localStorage.setItem(waitlistDeadlineStorageKey, String(deadlineMs));
  return deadlineMs;
}

function formatWaitlistCountdown(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
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
    ["Browse requests", "browse", false],
    ["FAQ", "faq", false],
    ["Trust", "profile", false],
    [signedIn ? "Dashboard" : "Post a request", signedIn ? "poster-dashboard" : "post-photo", true],
  ];
  const handleNavItem = (page: Page, gated: boolean) => {
    if (page === "browse") {
      onBrowseRequest();
      return;
    }

    if (page === "post-photo") {
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
  const resourceLinks: Array<[string, string]> = [
    ["Guides", "/guides/"],
    ["Request categories", "/requests/"],
  ];

  return (
    <footer className="site-footer">
      <div>
        <strong>{siteName}</strong>
        <span>Funded find requests, protected source review, and support policies for posters and finders.</span>
      </div>
      <nav aria-label="Policy and support links">
        {publicLinks.map(([label, page]) => (
          <a href={routeHref(page)} key={page} onClick={(event) => handleRoutedAnchorClick(event, () => navigate(page))}>
            {label}
          </a>
        ))}
        {resourceLinks.map(([label, href]) => (
          <a href={href} key={href}>
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
        <span className="board-card-stats" aria-label={`${fullReward} reward, closes in ${bounty.closes}, ${bounty.submissions} sources`}>
          <span>
            <small>Reward</small>
            <b>{compactReward}</b>
          </span>
          <span>
            <small>Closes</small>
            <b>{bounty.closes}</b>
          </span>
          <span>
            <small>Sources</small>
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
          Reward<strong>{rewardText}</strong>
        </span>
        <span>
          Closes in<strong>{bounty.closes}</strong>
        </span>
      </div>
    </article>
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
  onFinders,
  onLogin,
  onLogOut,
  onNavigate,
  onPost,
  onPostPrompt,
  onSection,
  setMenuOpen,
  signedIn,
}: {
  acquisitionStarterPrompt: PostStarterPrompt | null;
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
  onPost: (location: string) => void;
  onPostPrompt: (prompt: PostStarterPrompt) => void;
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
              Browse requests
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
                Browse requests
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
          <h1>Can&apos;t find that one item anywhere?</h1>
          <p className="mobile-hero-title" aria-hidden="true">Can&apos;t find that one item anywhere?</p>
          <p className="micro-line">
            <span>Post a photo</span>
            <ArrowRight size={16} />
            <span>set a reward</span>
            <ArrowRight size={16} />
            <span>review protected sources</span>
          </p>
          <form className="hero-search-form" onSubmit={submitHeroSearch}>
            <Search size={20} aria-hidden="true" />
            <input value={heroSearch} aria-label="Search requests" onChange={(event) => setHeroSearch(event.target.value)} placeholder={heroPlaceholder} />
            <button type="submit">Search requests</button>
          </form>
          <div className="mobile-hero-actions" aria-label="Hero actions">
            <button className="primary-button mobile-post-button hero-plus-button" type="button" onClick={() => onPost("hero_mobile")}>
              <span aria-hidden="true">+</span>
              Post a find request
            </button>
            <a className="mobile-browse-button" href={routeHref("browse-all")} onClick={(event) => handleRoutedAnchorClick(event, onBrowseAll)}>
              Browse open requests <ArrowRight size={14} />
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
            Post a photo, set a reward, and get links, seller contacts, or local tips from people who know where to look.
          </p>
          <button className="primary-button hero-cta" type="button" onClick={() => onPost("hero_primary")}>
            Post a find request
          </button>
          {acquisitionStarterPrompt ? (
            <div className="starter-link-panel">
              <span>
                <strong>{acquisitionStarterPrompt.label}</strong>
                {acquisitionStarterPrompt.title}
              </span>
              <button className="starter-link-button" type="button" onClick={() => onPost("starter_link")}>
                Start this request <ArrowRight size={16} />
              </button>
            </div>
          ) : null}
          <a className="finder-link finder-button hero-secondary-link" href={routeHref("finder-dashboard")} onClick={(event) => handleRoutedAnchorClick(event, onFinders)}>
            Know where to find rare items? Submit sources for rewards <ArrowRight size={18} />
          </a>
          <p className="trust-line">
            <LockKeyhole size={18} />
            Your reward is recorded. If no valid source is accepted, the finder reward can be returned under the refund policy.
          </p>
        </div>

        <section className="poster-prompt-strip" aria-label="Start a request from a common use case">
          <div>
            <p className="route-kicker">Start from the situation</p>
            <h2>Pick the kind of item you need found.</h2>
          </div>
          <div className="poster-prompt-grid">
            {posterStarterPrompts.map((prompt) => {
              const PromptIcon = prompt.icon;
              return (
                <button className="poster-prompt-button" type="button" key={prompt.label} onClick={() => onPostPrompt(prompt)}>
                  <PromptIcon size={20} aria-hidden="true" />
                  <span>
                    <strong>{prompt.label}</strong>
                    <small>{prompt.title}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="landing-recent-board board-rails" aria-label="Request board preview">
          <section className="board-row" aria-labelledby="recent-board-title">
            <div className="board-row-head">
              <h2 id="recent-board-title">Example find requests</h2>
              <button className="board-view-all" type="button" onClick={onBrowse}>
                Browse open requests <ArrowRight size={18} />
              </button>
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
            Listings expire, sellers use different names, and local sources rarely show up in search. A clear request gives people a reason to follow clues you would not know to check.
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

      <section className="answer-section" aria-labelledby="answer-title">
        <div className="answer-section-head">
          <p className="route-kicker">Hard-to-find item requests</p>
          <h2 id="answer-title">A funded request is for the exact item normal search missed.</h2>
          <p>
            Use {siteName} when the right match depends on a collector, shop, seller contact, local source, model clue, or repair-part
            compatibility detail that search engines and marketplaces keep missing.
          </p>
          <p className="freshness-line">Last updated {siteLastUpdatedDisplay}</p>
        </div>
        <div className="answer-grid" aria-label="Core marketplace answers">
          {answerBlocks.map((item) => (
            <article className="answer-card" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
        <div className="use-case-strip" aria-label="Common hard-to-find item request types">
          {useCaseBlocks.map((item) => (
            <article className="use-case-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how" aria-labelledby="how-title">
        <h2 id="how-title">How it works</h2>
        <p className="how-intro">
          Post what you are looking for, offer a reward, and review protected sources from people who know where to look.
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
            <h3>Your best source should not vanish in a comment thread.</h3>
            <p>
              When a finder submits a source, the platform saves what they sent and when they sent it. If the poster reveals the source,
              that reveal is recorded too. This makes the reward decision easier to review if something goes wrong.
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
              <CheckCircle2 size={18} /> Browse funded requests with clear photos, criteria, and rewards
            </li>
            <li>
              <CheckCircle2 size={18} /> Submit a source link, seller contact, local source, or handoff path
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
              <strong>Your source is recorded before reveal</strong>
              The source, notes, proof, and timestamp are saved before the poster sees the full details.
            </span>
          </div>
          <div>
            <BadgeCheck size={28} />
            <span>
              <strong>First valid source gets priority</strong>
              If multiple finders send the same source, the earlier valid submission comes first.
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
            I realized the problem was not that these things were impossible to find. The problem was that the right person, shop, collector, or local source was usually outside my own reach. This is why {siteName} exists: you post what you need, offer a reward, and real people who know where to look can help you find a safer path forward.
          </p>
          <strong>- Saharsh, Founder</strong>
        </div>
      </section>

      <section className="closing-section" id="faq" aria-labelledby="closing-title">
        <h2 id="closing-title">
          Ready to post the thing you cannot find?
          <span> Someone out there knows exactly where it is.</span>
        </h2>
        <button className="primary-button" type="button" onClick={() => onPost("closing")}>
          Post a find request
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
          <p className="route-kicker">Sign in to keep the marketplace trustworthy</p>
          <h1 id="auth-title">{mode === "signup" ? "Create your account to continue." : "Log in to continue."}</h1>
          <p>
            Public browsing is open. Posting a request, submitting a source, reviewing protected sources, making payments, and opening disputes need a signed-in account.
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

function PostProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  const steps = ["Photo", "Details", "Reward", "Pay"] as const;

  return (
    <div className="post-progress" aria-label="Post request progress">
      {steps.map((step, index) => (
        <div className={current === index + 1 ? "active" : current > index + 1 ? "done" : ""} key={step}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </div>
      ))}
    </div>
  );
}

function PostPhotoSourcePage({
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
  const selectedImage = draft.referenceImages[0];

  const handleReferenceImagesChange = (event: React.ChangeEvent<HTMLInputElement>, source: "camera" | "gallery") => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    revokeReferenceImageDrafts(draft.referenceImages);
    const referenceImages = createReferenceImageDrafts(files);
    onDraftChange({ referenceImages });
    trackAcquisitionEvent("post_photo_source_selected", {
      source,
      category: getCategoryLabel(draft.category),
      reference_image_count: referenceImages.length,
    });
    event.target.value = "";
  };

  const continueToDetails = () => {
    trackAcquisitionEvent(draft.referenceImages.length ? "post_photo_step_completed" : "post_photo_step_skipped", {
      category: getCategoryLabel(draft.category),
      reference_image_count: draft.referenceImages.length,
      has_reference_images: draft.referenceImages.length > 0,
    });
    onNext();
  };

  return (
    <main className="route-page post-wizard-page post-photo-minimal-page" aria-label="Add item photo">
      <button className="back-button post-photo-back" type="button" onClick={onBack}>
        <ArrowLeft size={17} /> Back to landing
      </button>
      <section className="post-photo-minimal" aria-label="Choose photo source">
        <div className="photo-source-grid photo-source-grid-minimal" aria-label="Choose how to add an item photo">
          <input
            id="camera-photo-input"
            className="sr-only-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => handleReferenceImagesChange(event, "camera")}
          />
          <label className="photo-source-card photo-source-card-minimal" htmlFor="camera-photo-input">
            <span className="photo-source-icon" aria-hidden="true">
              <Camera size={42} />
            </span>
            <strong>Camera</strong>
          </label>
          <input
            id="gallery-photo-input"
            className="sr-only-file-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleReferenceImagesChange(event, "gallery")}
          />
          <label className="photo-source-card photo-source-card-minimal" htmlFor="gallery-photo-input">
            <span className="photo-source-icon" aria-hidden="true">
              <Images size={42} />
            </span>
            <strong>Gallery</strong>
          </label>
        </div>
        <div className={selectedImage ? "photo-preview-minimal has-selected-image" : "photo-preview-minimal"} aria-label="Photo preview">
          {selectedImage ? <img src={selectedImage.url} alt={`${selectedImage.name} selected reference`} /> : <span>Photo preview</span>}
        </div>
        <button className="primary-button post-photo-next-button" type="button" onClick={continueToDetails}>
          Next <ArrowRight size={17} />
        </button>
      </section>
    </main>
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
  const [draftError, setDraftError] = useState("");

  const continueWithDetails = () => {
    if (!draft.itemName.trim()) {
      setDraftError("Add the item name so finders know what to search for.");
      return;
    }

    if (!draft.details.trim()) {
      setDraftError("Add must-have details so finders can avoid lookalikes.");
      return;
    }

    setDraftError("");
    onNext();
  };

  const finderPreviewImage = draft.referenceImages[0];
  const finderPreviewImageSrc = finderPreviewImage?.url || bountyListings[5].image;
  const finderPreviewImageAlt = finderPreviewImage
    ? `${finderPreviewImage.name} reference preview`
    : `${bountyListings[5].name} reference`;

  return (
    <main className="route-page post-wizard-page" aria-labelledby="describe-title">
      <PostProgress current={2} />
      <section className="two-column-page">
        <div className="form-panel post-flow-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Photo
          </button>
          <div className="post-flow-intro">
            <h1 id="describe-title">Add the details finders need.</h1>
            <p>Each card turns the request into clear matching rules so finders know exactly what to source.</p>
          </div>
          <div className="post-question-card is-active">
            <span className="post-question-label">
              <FileText size={15} /> Item basics
            </span>
            <label>
              Item name
              <input
                value={draft.itemName}
                placeholder="Yellow pillow, cat mug, duck wall art"
                onChange={(event) => {
                  setDraftError("");
                  onDraftChange({ itemName: event.target.value });
                }}
              />
            </label>
            <label>
              Category
              <select
                value={draft.category}
                onChange={(event) => {
                  const category = event.target.value as RequestCategory;
                  setDraftError("");
                  onDraftChange({ category });
                  trackAcquisitionEvent("category_selected", {
                    category: getCategoryLabel(category),
                  });
                }}
              >
                {requestCategories.map((category) => (
                  <option value={category.value} key={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="post-question-card">
            <span className="post-question-label">
              <CircleHelp size={15} /> Match rules
            </span>
            <label>
              Must-have details
              <textarea
                value={draft.details}
                placeholder="Brand or model, color, size, condition, budget, shipping limits, and what should be rejected"
                onChange={(event) => {
                  setDraftError("");
                  onDraftChange({ details: event.target.value });
                }}
              />
            </label>
            <p className="field-hint">Include what counts as a match and what would be a clear no.</p>
          </div>
          {draftError ? (
            <p className="dialog-error" role="alert">
              {draftError}
            </p>
          ) : null}
          <button className="primary-button" type="button" onClick={continueWithDetails}>
            Next: Set reward <ArrowRight size={18} />
          </button>
        </div>
        <aside className="side-panel">
          <h2>What finders see</h2>
          <div className="mini-bounty-card">
            <img src={finderPreviewImageSrc} alt={finderPreviewImageAlt} />
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
    <main className="route-page post-wizard-page" aria-labelledby="reward-title">
      <PostProgress current={3} />
      <section className="two-column-page">
        <div className="form-panel reward-form-panel post-flow-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Describe
          </button>
          <div className="post-flow-intro">
            <h1 id="reward-title">Set reward, then days.</h1>
            <p>Pick a reward that makes the search worth it, then choose how long the request should stay open.</p>
          </div>
          <div className="post-question-card is-active">
            <span className="post-question-label">
              <Banknote size={15} /> Finder reward
            </span>
            <h2>What can a finder earn?</h2>
            <label>
              Finder reward
              <input type="number" min={minimumReward} value={draft.reward} onChange={(event) => setReward(event.target.value)} />
            </label>
            <div className="reward-slider">
              <input type="range" min={minimumReward} max="1000" value={Math.min(draft.reward, 1000)} onChange={(event) => setReward(event.target.value)} />
              <div>
                <span>Low urgency</span>
                <span>High urgency</span>
              </div>
            </div>
          </div>
          <div className="post-question-card">
            <span className="post-question-label">
              <CalendarDays size={15} /> Request days
            </span>
            <h2>How long should finders search?</h2>
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
          </div>
          <button className="primary-button" type="button" onClick={onNext}>
            Next: Review payment <ArrowRight size={18} />
          </button>
        </div>
        <aside className="side-panel receipt-panel">
          <h2>Payment summary</h2>
          <dl>
            <div>
              <dt>Finder reward</dt>
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
              <Banknote size={18} /> Finder sees the reward and can earn it after acceptance
            </li>
            <li>
              <Search size={18} /> 12% service fee supports matching, review, and support
            </li>
            <li>
              <ShieldCheck size={18} /> 3% fee supports payment handling, source records, dispute review, and fraud monitoring
            </li>
          </ul>
          <p>
            <LockKeyhole size={18} /> The finder reward is recorded until a source or handoff is approved.
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
      setCheckoutMessage("Checkout is taking longer than expected. Keep this page open, or try again if it does not load.");
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
      setCheckoutMessage("Enter your name so the checkout receipt is tied to the request.");
      return;
    }

    trackAcquisitionEvent("checkout_started", {
      category: getCategoryLabel(draft.category),
      duration_days: draft.durationDays,
      has_reference_images: draft.referenceImages.length > 0,
      reference_image_count: draft.referenceImages.length,
      reward: breakdown.reward,
      total_due: breakdown.total,
    });
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
            analytics: getCheckoutAnalyticsContext(),
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

      trackAcquisitionEvent("checkout_redirected", {
        category: getCategoryLabel(draft.category),
        duration_days: draft.durationDays,
        reward: breakdown.reward,
        total_due: breakdown.total,
        checkout_provider: typeof payload.provider === "string" ? payload.provider : "configured",
      });
      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      if (supabase && !createdRequestId && uploadedPaths.length) {
        await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
      }

      trackAcquisitionEvent("checkout_failed", {
        category: getCategoryLabel(draft.category),
        error_type: error instanceof Error ? error.name || "error" : "unknown",
        reward: breakdown.reward,
        total_due: breakdown.total,
      });
      setCheckoutStatus("error");
      setCheckoutMessage(getCheckoutErrorMessage(error));
    }
  };

  return (
    <main className="route-page post-wizard-page" aria-labelledby="pay-title">
      <PostProgress current={4} />
      <section className="two-column-page pay-layout">
        <div className="form-panel payment-form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Reward
          </button>
          <h1 id="pay-title">Fund the request.</h1>
          <p>
            Pay once for the finder reward and platform fees. If a source works, you buy the item separately from the third-party seller or source.
          </p>
          <div className="payment-assurance-grid" aria-label="Checkout protections">
            <span>
              <ShieldCheck size={17} /> Reward recorded
            </span>
            <span>
              <CreditCard size={17} /> Secure processor
            </span>
            <span>
              <LockKeyhole size={17} /> Card details not stored
            </span>
          </div>
          {checkoutReturnStatus === "cancelled" ? (
            <p className="dialog-error" role="status">
              Checkout was cancelled. Your request is still in draft, so you can adjust the reward or try again.
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
              Your payment is processed securely. We never store your card details. The finder reward is tracked until a source or handoff is approved; the platform does not sell or ship requested goods.
            </span>
          </div>
          <button className="primary-button" type="button" disabled={checkoutStatus === "loading"} onClick={startCheckout}>
            <CreditCard size={18} /> {checkoutStatus === "loading" ? "Preparing secure checkout..." : checkoutStatus === "error" ? "Try checkout again" : "Continue to secure checkout"}
          </button>
          {checkoutMessage ? (
            <div className={checkoutStatus === "error" ? "dialog-error checkout-status-message" : "dialog-note checkout-status-message"} role="status">
              <span>{checkoutMessage}</span>
              {checkoutStatus === "error" ? (
                <button className="retry-button" type="button" onClick={startCheckout}>
                  Try again
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
            <span>Total for the {itemName} request, including the finder reward, platform service, and source review fee.</span>
          </div>
          <dl>
            <div>
              <dt>Finder reward</dt>
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
              <TimerReset size={18} /> Finder reward can become payable after acceptance and review
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
        <p>Requests with clear photos, rewards, and source criteria are shown first so finders can quickly spot what they recognize.</p>
        {dataLoading ? <p className="dialog-note">Loading paid requests...</p> : null}
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

      <section className="gallery-section" aria-labelledby="more-bounties-title">
        <div className="gallery-section-head">
          <div>
            <h2 id="more-bounties-title">More requests closing soon</h2>
            <p>Active requests with rewards, source submissions, and a visible request window.</p>
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
  const hasVisibleBounties = visibleBounties.length > 0;
  const emptyStateSubject = query.trim() ? `"${query.trim()}"` : filter === "All" ? "the current board" : filter;

  return (
    <main className="route-page bounty-gallery-page browse-all-page" aria-labelledby="browse-all-title">
      <section className="gallery-hero compact-gallery-hero">
        <div>
          <h1 id="browse-all-title">Browse all requests</h1>
          <p>Search open requests by item, category, or location.</p>
          {dataLoading ? <p className="dialog-note">Loading paid requests...</p> : null}
          {dataError ? <p className="dialog-error" role="status">{dataError} Showing example requests until the live board is ready.</p> : null}
        </div>
        <button className="primary-button" type="button" onClick={onPost}>
          Post a request <ArrowRight size={18} />
        </button>
      </section>
      <section className="browse-toolbar" aria-label="Browse filters">
        <div className="search-field">
          <Search size={18} />
          <input aria-label="Search all requests" placeholder="Search by item, category, or location" value={query} onChange={(event) => setQuery(event.target.value)} />
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
            <span>Try a broader keyword or choose All categories.</span>
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
              <small>Reward</small>
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
        <ArrowLeft size={17} /> Browse requests
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
          <span>Reward for an accepted source</span>
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
      setSubmitError("Add the source link. If there is no public link, choose a private or direct source type.");
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

        setSubmitMessage("Protected source saved. The poster can preview the source, reveal the full details under terms, and review it from their dashboard.");
      } else {
        setSubmitMessage("Demo source saved locally. Live paid requests save protected source records before poster reveal.");
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
          <h1 id="submit-title">Submit a source for {bounty.name}.</h1>
          <p>Tell the poster where it is, who has it, or whether you have it yourself. Add enough detail for them to judge the match before reveal.</p>
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
            Match notes for the poster
            <textarea
              value={notes}
              placeholder="Why this matches, current availability, condition, seller details, and delivery, pickup, shipping, or purchase path"
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
                : "Screenshots, photos, messages, or proof are optional and help the poster review faster."}
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
                <span>{submitMessage || "The poster can preview your source first. If they reveal it, that reveal is saved."}</span>
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
              <span>{formatUsdMoney(bounty.rewardValue, currencyPreference, { compact: true })} reward · {bounty.closes} left</span>
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

      setActionMessage("Source revealed. The full details are visible now, and the reveal is saved to the case timeline.");
      trackAcquisitionEvent("source_revealed", {
        request_id: selectedSubmission.request_id,
        source_type: selectedSubmission.source_type,
      });
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
      setActionMessage(decision === "accepted" ? "Source accepted. The finder reward is marked payable after the release window." : "Review reason saved. The source is now in review.");
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
          <h1 id="poster-dashboard-title">Review protected sources.</h1>
        </div>
        <a className="section-link section-button" href={routeHref("profile")} onClick={(event) => handleRoutedAnchorClick(event, onProfile)}>
          Public trust page <ArrowRight size={17} />
        </a>
      </section>
      {loading ? <p className="dialog-note">Loading your requests and protected sources...</p> : null}
      {dashboardError ? <p className="dialog-error" role="alert">{dashboardError}</p> : null}
      {actionMessage ? <p className="dialog-success" role="status">{actionMessage}</p> : null}
      <section className="metric-grid">
        <Metric icon={LockKeyhole} label="Funded rewards" value={formatUsdMoney(protectedOfferTotal || 1280, currencyPreference, { compact: true })} />
        <Metric icon={MessageSquare} label="Sources awaiting review" value={String(awaitingReviewCount || 4)} />
        <Metric icon={PackageCheck} label="Requests funded" value={String(requests.filter((request) => request.payment_status === "paid").length || 2)} />
        <Metric icon={CheckCircle2} label="Accepted rewards" value={formatUsdMoney(acceptedTotal || 930, currencyPreference, { compact: true })} />
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
              <p>{selectedSubmission.match_notes || "A finder shared a protected source. Reveal it when you are ready to review the full source details."}</p>
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
                    <span>Source revealed and saved to the case timeline. Review the full details before accepting or sending it to review.</span>
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
                      Reveal only when you are ready to inspect the full details. If the source matches your request, the finder may still be paid after review even if you reject it later.
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
              <span>When a finder submits to one of your paid requests, the preview will appear here before reveal.</span>
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
    ? `Service and source review fees total ${formatUsdMoney(checkoutSnapshot.platformShare, currencyPreference)}, while the finder reward stays recorded for acceptance or review.`
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
          Your payment is recorded, the finder reward is tracked for acceptance or review, and the request is ready for sources. Use this confirmation to track the post while finders start working.
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
            <span>Finder reward</span>
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
              <p>New links, contacts, or handoff options appear in your dashboard for review.</p>
            </div>
          </li>
          <li>
            <span className="confirmation-step-icon" aria-hidden="true">
              <PackageCheck size={16} />
            </span>
            <div>
              <strong>Accept the right match</strong>
              <p>Contact the finder, verify the item, then release the reward when the source works.</p>
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
        <Metric icon={Banknote} label="Available rewards" value={formatUsdMoney(availablePayout || 640, currencyPreference, { compact: true })} />
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
          {["Reward funded", "Protected source submitted", "Source revealed", "Review requested", "Evidence due in 48 hours"].map((event) => (
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
          <p>Clear answers for posters, finders, rewards, payouts, refunds, disputes, and public browsing.</p>
          <p className="freshness-line">Last updated {siteLastUpdatedDisplay}</p>
        </div>
        <div className="head-actions">
          <button className="primary-button" type="button" onClick={onPost}>
            Post a request
          </button>
          <a className="section-link section-button" href={routeHref("browse")} onClick={(event) => handleRoutedAnchorClick(event, onBrowse)}>
            Browse requests <ArrowRight size={17} />
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
      intro="The operating rules for posters, finders, funded rewards, protected sources, and marketplace review."
      sections={[
        {
          title: "Marketplace role",
          copy: [
            "Posters fund a reward and describe what they want. Finders submit sources, contacts, or handoff paths. The platform records the workflow and review trail.",
            "Payments on the platform cover the request workflow, poster-paid platform fees, and any eligible finder payout. They are not a purchase of the requested item from pleasefindmethis.",
            "The platform is not the seller of the requested item and does not guarantee that a third-party source remains available, authentic, or suitable after review.",
          ],
        },
        {
          title: "Finder payouts",
          copy: [
            "The posted reward remains the finder payout. Platform service and source review fees are paid by the poster at checkout.",
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
      intro="How funded rewards, service fees, failed finds, and disputes are handled."
      sections={[
        {
          title: "Before checkout",
          copy: ["A request is not live until checkout succeeds. Cancelled checkout sessions can be restarted from the post flow."],
        },
        {
          title: "No accepted source",
          copy: [
            "If no valid source or handoff is accepted within the active request window, the funded finder reward can be returned to the poster.",
            "Any separate item purchase from a third-party seller is outside the platform checkout and is not refunded by pleasefindmethis.",
            "Service and source review fees cover hosting the request, payment handling, source review tools, support, and fraud monitoring.",
          ],
        },
        {
          title: "Disputes and holds",
          copy: [
            "When a dispute is open, payout release can be held until evidence is reviewed.",
            "Refunds and reward decisions use the saved request, source, reveal, review, and dispute timeline.",
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
