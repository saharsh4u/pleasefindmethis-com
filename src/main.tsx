import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
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
  DollarSign,
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
  Play,
  Scale,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  TimerReset,
  Trophy,
  Upload,
  UserRoundCheck,
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
  | "faq";

type AuthMode = "signup" | "login";

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
};

type FeedItem = {
  bounty: string;
  reward: string;
  finder: string;
  rating: string;
  location: string;
  status: string;
  note: string;
  updated: string;
  image: string;
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

type EscrowBreakdown = {
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

const siteName = "pleasefindmethis.com";
const requestSingular = "request";
const requestPlural = "requests";

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
]);

const pageLabels: Record<Page, string> = {
  landing: "Landing page",
  auth: "Sign up / Log in",
  "post-describe": "Post Request - Describe",
  "post-reward": "Post Request - Set reward",
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
};

const routeMap: Record<string, Page> = {
  "": "landing",
  "/": "landing",
  landing: "landing",
  auth: "auth",
  "post/describe": "post-describe",
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
};

const pageRoutes: Record<Page, string> = {
  landing: "/",
  auth: "auth",
  "post-describe": "post/describe",
  "post-reward": "post/reward",
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
};

const signedInStorageKey = "pleasefindmethis-signed-in";
const pendingRouteStorageKey = "pleasefindmethis-pending-route";
const authProviderStorageKey = "pleasefindmethis-auth-provider";
const authEmailStorageKey = "pleasefindmethis-auth-email";
const checkoutSnapshotStorageKey = "pleasefindmethis-last-checkout";
const requestReferenceImagesBucket = "request-reference-images";
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
    timeline: ["Reward funded", "Four people helping", "Latest lead received today"],
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
    timeline: ["Reward funded", "Two leads received", "Model number being checked"],
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
    timeline: ["Reward funded", "New request", "Finders can submit leads"],
  },
  {
    id: "leica-m6-ttl",
    name: "Leica M6 TTL",
    detail: "0.72 black body",
    reward: "US$1,450",
    rewardValue: 1450,
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
      "Searching for a clean Leica M6 TTL 0.72 black body with working meter and clear finder.",
    mustHaves: ["0.72 finder", "Working meter", "No shutter issue", "Serial photo required"],
    timeline: ["Reward funded", "Finder shortlisted two bodies", "Meter video requested"],
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
    timeline: ["Reward funded", "Two leads rejected", "New photos requested"],
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
    timeline: ["Reward funded", "Japan sellers contacted", "First lead under review"],
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
    timeline: ["Reward funded", "Two leads received", "Waiting on sample photo"],
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
    timeline: ["Reward funded", "First lead received", "USB proof requested"],
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
    timeline: ["Reward funded", "Three leads received", "Best lead missing screw"],
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
    timeline: ["Reward funded", "Pilot group posted", "Two leads being checked"],
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
    timeline: ["Reward funded", "Audiophile forum posted", "One lead needs channel test"],
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
    timeline: ["Reward funded", "Two listings reviewed", "Best lead awaiting glass photos"],
  },
];

const featuredBounties = bountyListings.slice(0, 5);
const rewardSortedBounties = [...bountyListings].sort((left, right) => right.rewardValue - left.rewardValue);
const topFiveBounties = featuredBounties;
const overviewBounties = bountyListings.slice(5, 20);

const feedItems: FeedItem[] = [
  {
    bounty: "Help me find this art",
    reward: "US$50",
    finder: "Maya L.",
    rating: "4.9",
    location: "New York",
    status: "Found",
    note: "Print source shared",
    updated: "2 hours ago",
    image: "/find-requests/duck-wall-art-reddit.jpg",
  },
  {
    bounty: "Help me find this blanket",
    reward: "US$50",
    finder: "Jonas K.",
    rating: "4.8",
    location: "London",
    status: "Open",
    note: "Two similar leads",
    updated: "5 hours ago",
    image: "/find-requests/childhood-blanket.jpg",
  },
  {
    bounty: "Help me find this pillow",
    reward: "US$35",
    finder: "Lina M.",
    rating: "4.7",
    location: "Berlin",
    status: "Open",
    note: "Target resale checked",
    updated: "7 hours ago",
    image: "/find-requests/yellow-home-pillow.jpg",
  },
  {
    bounty: "Does anyone know this watch?",
    reward: "US$20",
    finder: "Noah R.",
    rating: "4.9",
    location: "Singapore",
    status: "Open",
    note: "Model number matched",
    updated: "1 day ago",
    image: "/find-requests/seiko-wired-watch.jpg",
  },
];

const problemItems = [
  {
    icon: Store,
    title: "Discontinued products",
    copy: "The model you loved is no longer made.",
  },
  {
    icon: Globe2,
    title: "Not shipped to your country",
    copy: "Official stores do not deliver to you.",
  },
  {
    icon: TimerReset,
    title: "Out of stock everywhere",
    copy: "Every site says the same thing.",
  },
  {
    icon: ShieldX,
    title: "Scammers and risky deals",
    copy: "Hard to trust random sellers and ads.",
  },
  {
    icon: Clock3,
    title: "Too much time wasted",
    copy: "Hours gone with no real result.",
  },
];

const workSteps = [
  {
    icon: Search,
    title: "1. Poster requests it",
    copy: "Describe what you need, why it is hard to find, the must-have details, and the reward amount.",
  },
  {
    icon: UserRoundCheck,
    title: "2. Finder submits a source",
    copy: "Finders can share a link, a friend or shop contact, or say they personally have the item.",
  },
  {
    icon: MessageSquare,
    title: "3. You discuss next steps",
    copy: "The poster reviews the source and contacts the finder by email to work out delivery, pickup, or purchase details.",
  },
];

const leftFindRequests = [
  {
    copy: "Help me find this art. I will give $50.",
    image: "/find-requests/duck-wall-art-reddit.jpg",
  },
  {
    copy: "Help me find this blanket. I can pay $50.",
    image: "/find-requests/childhood-blanket.jpg",
  },
  {
    copy: "Does anyone know where to find this watch? $20.",
    image: "/find-requests/seiko-wired-watch.jpg",
  },
  {
    copy: "Can someone find this yellow pillow? I will pay $35.",
    image: "/find-requests/yellow-home-pillow.jpg",
  },
  {
    copy: "Please help me find this cat mug. I can pay $20.",
    image: "/find-requests/living-and-co-mug.jpg",
  },
];

const rightFindRequests = [
  {
    copy: "I want this framed duck print for my room. $50 reward.",
    image: "/find-requests/duck-wall-art-reddit.jpg",
  },
  {
    copy: "Looking for the same pink rose blanket. I can pay $50.",
    image: "/find-requests/childhood-blanket.jpg",
  },
  {
    copy: "Need a dupe of this Seiko Wired watch. $20.",
    image: "/find-requests/seiko-wired-watch.jpg",
  },
  {
    copy: "Does anyone know where this pillow is sold?",
    image: "/find-requests/yellow-home-pillow.jpg",
  },
  {
    copy: "Trying to find this Living & Co cat mug.",
    image: "/find-requests/living-and-co-mug.jpg",
  },
];

const mobileFindRequests = [...leftFindRequests, ...rightFindRequests];
const reversedMobileFindRequests = [...mobileFindRequests].reverse();

const safetySteps = [
  {
    icon: LockKeyhole,
    title: "You fund the reward",
    copy: "Your reward is held in escrow. The finder does not see your money.",
  },
  {
    icon: Search,
    title: "Finder shares the source",
    copy: "They add the link if one exists, or explain who has it and leave their contact email.",
  },
  {
    icon: MessageSquare,
    title: "You review and connect",
    copy: "You decide whether the source matches, then contact the finder to arrange the next step.",
  },
  {
    icon: CheckCircle2,
    title: "You release payment",
    copy: "If the source is valid and the handoff works, payment is released to the finder.",
  },
  {
    icon: Banknote,
    title: "30-day protection",
    copy: "Not found in 30 days? You get your full reward back.",
  },
];

const comparisonRows = [
  ["Finds hard-to-source items", "Yes", "Limited", "Rare", "Not always"],
  ["Community of expert finders", "Yes", "No", "No", "No"],
  ["Source link or contact handoff", "Yes", "Maybe", "Maybe", "No"],
  ["Money held in escrow", "Yes", "No", "No", "No"],
  ["30-day protection or refund", "Yes", "No", "No", "No"],
  ["Saves your time", "Yes", "Maybe", "No", "No"],
];

const topFinders = [
  ["1", "Maya L.", "4.9", "18 accepted sources"],
  ["2", "Jonas K.", "4.8", "14 accepted sources"],
  ["3", "Lina M.", "4.9", "12 accepted sources"],
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
      "You fund the request before it goes live. The reward stays held until you accept a valid source or complete the handoff with the finder.",
  },
  {
    question: "What happens if nobody finds it?",
    answer: "If the request is not fulfilled within 30 days, the reward is returned to you.",
  },
  {
    question: "Can I reject a find?",
    answer:
      "Yes. You can reject submissions that do not match your description, do not include enough source detail, or do not provide a clear contact path.",
  },
  {
    question: "How do finders get paid?",
    answer:
      "Finders earn the posted reward after the poster accepts the source or confirms that the direct handoff worked. Reputation improves with clear links, useful contact details, and successful outcomes.",
  },
  {
    question: "Is the browse feed public?",
    answer:
      "Yes. Anyone can browse public requests and detail pages. Posting, submitting sources, dashboards, payment, and disputes require sign up or log in.",
  },
];

function parseRoute(): Page {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return routeMap[raw] ?? "landing";
}

function parseCheckoutReturnStatus(): CheckoutReturnStatus {
  const query = window.location.hash.split("?")[1] ?? "";
  const status = new URLSearchParams(query).get("checkout");
  return status === "success" || status === "cancelled" ? status : null;
}

function routeHref(page: Page) {
  if (page === "landing") {
    return "#/";
  }

  return `#/${pageRoutes[page]}`;
}

function getCategoryLabel(category: RequestCategory) {
  return requestCategories.find((item) => item.value === category)?.label ?? "General";
}

function getEscrowBreakdown(reward: number): EscrowBreakdown {
  const normalizedReward = Math.max(25, Math.round(Number.isFinite(reward) ? reward : initialPostDraft.reward));
  const platformFee = Math.max(12, Math.round(normalizedReward * 0.08));
  const protection = Math.round(normalizedReward * 0.03);
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

function App() {
  const [route, setRoute] = useState<Page>(() => parseRoute());
  const [checkoutReturnStatus, setCheckoutReturnStatus] = useState<CheckoutReturnStatus>(() => parseCheckoutReturnStatus());
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(() => window.sessionStorage.getItem(signedInStorageKey) === "true");
  const [pendingRoute, setPendingRoute] = useState<Page>(() => readStoredPendingRoute());
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [postDraft, setPostDraft] = useState<PostDraft>(initialPostDraft);
  const [selectedFeedBounty, setSelectedFeedBounty] = useState(feedItems[0].bounty);
  const [activeBountyId, setActiveBountyId] = useState(bountyListings[0].id);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(parseRoute());
      setCheckoutReturnStatus(parseCheckoutReturnStatus());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", syncRoute);
    return () => window.removeEventListener("hashchange", syncRoute);
  }, []);

  const activeBounty = useMemo(
    () => bountyListings.find((bounty) => bounty.id === activeBountyId) ?? bountyListings[0],
    [activeBountyId],
  );

  const navigate = (page: Page) => {
    setMenuOpen(false);
    if (window.location.hash === routeHref(page)) {
      setRoute(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = pageRoutes[page];
  };

  const requireAuth = (target: Page, mode: AuthMode = "signup") => {
    setPendingRoute(target);
    setAuthMode(mode);
    setAuthMessage("");
    window.sessionStorage.setItem(pendingRouteStorageKey, target);
    if (signedIn) {
      navigate(target);
      return;
    }
    navigate("auth");
  };

  const goToDetail = (bountyId: string) => {
    setActiveBountyId(bountyId);
    navigate("bounty-detail");
  };

  const scrollToLandingSection = (sectionId: string) => {
    setMenuOpen(false);
    if (route !== "landing") {
      window.location.hash = pageRoutes.landing;
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const markSignedIn = (provider = "email-demo") => {
    window.sessionStorage.setItem(signedInStorageKey, "true");
    window.sessionStorage.setItem(authProviderStorageKey, provider);
    window.sessionStorage.removeItem(pendingRouteStorageKey);
    setSignedIn(true);
    navigate(pendingRoute);
  };

  const completeAuth = () => {
    markSignedIn("email-demo");
  };

  const logOut = async () => {
    const shouldReturnHome = protectedPages.has(route) || route === "auth";

    setMenuOpen(false);
    setAuthMessage("");

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
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${routeHref("landing")}`);
      setRoute("landing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setSignedIn(false);
  };

  const signInWithGoogle = async () => {
    setAuthBusy(true);
    setAuthMessage("");
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
      setAuthBusy(false);
    }
  };

  const updatePostDraft = (updates: Partial<PostDraft>) => {
    setPostDraft((draft) => ({ ...draft, ...updates }));
  };

  const visibleRoute = !signedIn && protectedPages.has(route) ? "auth" : route;

  useEffect(() => {
    if (!signedIn && protectedPages.has(route)) {
      setPendingRoute(route);
      setAuthMode("signup");
      window.sessionStorage.setItem(pendingRouteStorageKey, route);
      if (window.location.hash !== routeHref("auth")) {
        window.history.replaceState(null, "", routeHref("auth"));
      }
      setRoute("auth");
    }
  }, [route, signedIn]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;
    const finishOAuthSession = () => {
      const storedRoute = readStoredPendingRoute();
      window.sessionStorage.setItem(signedInStorageKey, "true");
      window.sessionStorage.setItem(authProviderStorageKey, "google");
      window.sessionStorage.removeItem(pendingRouteStorageKey);
      setSignedIn(true);
      setPendingRoute(storedRoute);
      navigate(storedRoute);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || !data.session) {
        return;
      }
      finishOAuthSession();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || !session) {
        return;
      }
      finishOAuthSession();
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
    <>
      {visibleRoute === "landing" ? (
        <LandingPage
          menuOpen={menuOpen}
          onBrowse={() => navigate("browse")}
          onDetail={goToDetail}
          onFinders={() => requireAuth("finder-dashboard")}
          onLogin={() => {
            setPendingRoute("poster-dashboard");
            setAuthMode("login");
            navigate("auth");
          }}
          onAccount={() => navigate("poster-dashboard")}
          onLogOut={logOut}
          onPost={() => requireAuth("post-describe")}
          onSection={scrollToLandingSection}
          selectedFeedBounty={selectedFeedBounty}
          setMenuOpen={setMenuOpen}
          setSelectedFeedBounty={setSelectedFeedBounty}
          signedIn={signedIn}
          setVideoPlaying={setVideoPlaying}
          videoPlaying={videoPlaying}
        />
      ) : (
        <PageChrome {...pageProps}>
          {visibleRoute === "auth" ? (
            <AuthPage
              authBusy={authBusy}
              authMessage={authMessage}
              mode={authMode}
              nextPage={pendingRoute}
              onComplete={completeAuth}
              onGoogleAuth={signInWithGoogle}
              onModeChange={setAuthMode}
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
            <BrowsePage onBrowseAll={() => navigate("browse-all")} onDetail={goToDetail} onPost={() => requireAuth("post-describe")} />
          ) : null}
          {visibleRoute === "browse-all" ? <BrowseAllPage onDetail={goToDetail} onPost={() => requireAuth("post-describe")} /> : null}
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
            <PosterDashboardPage checkoutReturnStatus={checkoutReturnStatus} onBounty={() => navigate("bounty-detail")} onDispute={() => navigate("dispute")} onProfile={() => navigate("profile")} />
          ) : null}
          {visibleRoute === "finder-dashboard" ? (
            <FinderDashboardPage onBrowse={() => navigate("browse")} onSubmit={() => navigate("submit-find")} onProfile={() => navigate("profile")} />
          ) : null}
          {visibleRoute === "dispute" ? <DisputePage onBack={() => navigate("poster-dashboard")} /> : null}
          {visibleRoute === "profile" ? <TrustProfilePage onBrowse={() => navigate("browse")} onFinder={() => requireAuth("finder-dashboard")} /> : null}
          {visibleRoute === "faq" ? <FaqPage onBrowse={() => navigate("browse")} onPost={() => requireAuth("post-describe")} /> : null}
        </PageChrome>
      )}
    </>
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
        <button className="brand brand-button" type="button" onClick={() => navigate("landing")} aria-label={`${siteName} home`}>
          <span className="brand-mark" aria-hidden="true">
            <Search size={16} />
          </span>
          {siteName}
        </button>
        <nav className="desktop-nav app-nav" aria-label="Primary navigation">
          {navItems.map(([label, page, gated]) => (
            <button key={label} type="button" onClick={() => (gated ? requireAuth(page) : navigate(page))}>
              {label}
            </button>
          ))}
        </nav>
        <div className="canvas-actions">
          {signedIn ? (
            <>
              <button className="text-button" type="button" onClick={() => requireAuth("poster-dashboard", "login")}>
                Account
              </button>
              <button className="text-button logout-button" type="button" onClick={onLogOut}>
                <LogOut size={15} aria-hidden="true" />
                Log out
              </button>
            </>
          ) : (
            <button className="text-button" type="button" onClick={() => requireAuth("poster-dashboard", "login")}>
              Log in
            </button>
          )}
          <button
            className="icon-button mobile-menu-button"
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen ? (
          <nav className="mobile-nav app-mobile-nav" aria-label="Mobile navigation">
            {navItems.map(([label, page, gated]) => (
              <button key={label} type="button" onClick={() => (gated ? requireAuth(page) : navigate(page))}>
                {label}
              </button>
            ))}
            {signedIn ? (
              <>
                <button type="button" onClick={() => requireAuth("poster-dashboard", "login")}>
                  Account
                </button>
                <button className="logout-menu-button" type="button" onClick={onLogOut}>
                  Log out
                </button>
              </>
            ) : (
              <button type="button" onClick={() => requireAuth("poster-dashboard", "login")}>
                Log in
              </button>
            )}
          </nav>
        ) : null}
      </header>
      {children}
    </div>
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
            <img src={request.image} alt="" loading="lazy" />
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

  return (
    <article className={`board-request-card ${variant === "reward" ? "board-request-card-reward" : ""}`}>
      <button type="button" onClick={() => onDetail(bounty.id)} aria-label={`Open ${bounty.name}`}>
        <span className={`board-status ${activeStatus ? "active" : ""}`}>{formatBoardStatus(bounty.status)}</span>
        <img src={bounty.image} alt="" />
        <span className="board-card-copy">
          <strong>{bounty.name}</strong>
          <em>{bounty.detail}</em>
        </span>
        <span className="board-card-stats" aria-label={`${bounty.reward} reward, closes in ${bounty.closes}, ${bounty.submissions} leads`}>
          <span>
            <small>Reward</small>
            <b>{bounty.reward}</b>
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
      </button>
    </article>
  );
}

function LandingPage({
  menuOpen,
  onAccount,
  onBrowse,
  onDetail,
  onFinders,
  onLogin,
  onLogOut,
  onPost,
  onSection,
  selectedFeedBounty,
  setMenuOpen,
  setSelectedFeedBounty,
  signedIn,
  setVideoPlaying,
  videoPlaying,
}: {
  menuOpen: boolean;
  onAccount: () => void;
  onBrowse: () => void;
  onDetail: (bountyId: string) => void;
  onFinders: () => void;
  onLogin: () => void;
  onLogOut: () => void;
  onPost: () => void;
  onSection: (sectionId: string) => void;
  selectedFeedBounty: string;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFeedBounty: React.Dispatch<React.SetStateAction<string>>;
  signedIn: boolean;
  setVideoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  videoPlaying: boolean;
}) {
  const [heroSearch, setHeroSearch] = useState("");
  const recentBoardBounties = bountyListings.slice(0, 4);

  const submitHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = heroSearch.trim().toLowerCase();
    const match = bountyListings.find((bounty) => `${bounty.name} ${bounty.detail}`.toLowerCase().includes(normalizedQuery));

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
          <button className="brand brand-button" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label={`${siteName} home`}>
            <span className="brand-mark" aria-hidden="true">
              <Search size={16} />
            </span>
            {siteName}
          </button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <button type="button" onClick={() => onSection("how")}>
              How it works
            </button>
            <button type="button" onClick={onBrowse}>
              Browse feed
            </button>
            <button type="button" onClick={() => onSection("safety")}>
              Safety
            </button>
            <button type="button" onClick={onFinders}>
              For finders
            </button>
          </nav>
          <div className="canvas-actions">
            {signedIn ? (
              <>
                <button className="text-button" type="button" onClick={onAccount}>
                  Account
                </button>
                <button className="text-button logout-button" type="button" onClick={onLogOut}>
                  <LogOut size={15} aria-hidden="true" />
                  Log out
                </button>
              </>
            ) : (
              <button className="text-button" type="button" onClick={onLogin}>
                Log in
              </button>
            )}
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          {menuOpen ? (
            <nav className="mobile-nav" aria-label="Mobile navigation">
              <button type="button" onClick={() => onSection("how")}>
                How it works
              </button>
              <button type="button" onClick={onBrowse}>
                Browse feed
              </button>
              <button type="button" onClick={() => onSection("safety")}>
                Safety
              </button>
              <button type="button" onClick={onFinders}>
                For finders
              </button>
              {signedIn ? (
                <>
                  <button type="button" onClick={onAccount}>
                    Account
                  </button>
                  <button className="logout-menu-button" type="button" onClick={onLogOut}>
                    Log out
                  </button>
                </>
              ) : (
                <button type="button" onClick={onLogin}>
                  Log in
                </button>
              )}
            </nav>
          ) : null}
        </div>

        <div className="side-find-rail side-find-rail-left" aria-hidden="true">
          <div className="side-find-track side-find-track-down">
            {[...leftFindRequests, ...leftFindRequests].map((request, index) => (
              <article className="side-find-card" key={`left-find-${index}`}>
                <p>{request.copy}</p>
                <img className="side-find-image" src={request.image} alt="" loading="lazy" />
              </article>
            ))}
          </div>
        </div>

        <div className="side-find-rail side-find-rail-right" aria-hidden="true">
          <div className="side-find-track side-find-track-up">
            {[...rightFindRequests, ...rightFindRequests].map((request, index) => (
              <article className="side-find-card" key={`right-find-${index}`}>
                <p>{request.copy}</p>
                <img className="side-find-image" src={request.image} alt="" loading="lazy" />
              </article>
            ))}
          </div>
        </div>

        <div className="hero-copy">
          <p className="hero-site-tag">{siteName}</p>
          <h1>Can&apos;t find it anywhere?</h1>
          <h1 className="mobile-hero-title">Can&apos;t find it anywhere?</h1>
          <p className="micro-line">
            <span>Post what you need</span>
            <ArrowRight size={16} />
            <span>finders share a source</span>
            <ArrowRight size={16} />
            <span>you connect and get it.</span>
          </p>
          <form className="hero-search-form" onSubmit={submitHeroSearch}>
            <Search size={20} aria-hidden="true" />
            <input value={heroSearch} aria-label="Search requests" onChange={(event) => setHeroSearch(event.target.value)} placeholder="yellow pillow or wall art" />
            <button type="submit">Search</button>
          </form>
          <div className="mobile-hero-actions" aria-label="Hero actions">
            <button className="primary-button mobile-post-button hero-plus-button" type="button" onClick={onPost}>
              <span aria-hidden="true">+</span>
              Post it now
            </button>
            <button className="mobile-browse-button" type="button" onClick={onBrowse}>
              Browse feed
            </button>
          </div>
        </div>

        <aside className="market-preview" aria-label="Featured request preview">
          <span className="floating-tag cyan">Rare finds</span>
          <span className="floating-tag orange">Escrow held</span>
          <div className="featured-grid">
            {featuredBounties.map((bounty, index) => (
              <article className={`bounty-card bounty-card-${index + 1}`} key={bounty.name}>
                <img src={bounty.image} alt="" />
                <button className="save-button" type="button" aria-label={`Open ${bounty.name}`} onClick={() => onDetail(bounty.id)}>
                  <BadgeCheck size={15} />
                </button>
                <h3>{bounty.name}</h3>
                <p>{bounty.detail}</p>
                <div className="bounty-meta">
                  <span>
                    Reward<strong>{bounty.reward}</strong>
                  </span>
                  <span>
                    Closes in<strong>{bounty.closes}</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        </aside>

        <div className="hero-lower">
          <p className="hero-subline">
            You&apos;ve searched every site, called every shop, scrolled for hours, and it&apos;s still nowhere. Let someone who knows the link, the shop, the friend, or the hidden source point you to it.
          </p>
          <button className="primary-button hero-cta" type="button" onClick={onPost}>
            Post what you&apos;re looking for
          </button>
          <button className="finder-link finder-button hero-secondary-link" type="button" onClick={onFinders}>
            Good at finding things? Earn by finding <ArrowRight size={18} />
          </button>
          <p className="trust-line">
            <LockKeyhole size={18} />
            Your reward is held safely. No useful source in 30 days? You get your full reward back.
          </p>
        </div>

        <div className="landing-recent-board board-rails" aria-label="Request board preview">
          <section className="board-row" aria-labelledby="recent-board-title">
            <div className="board-row-head">
              <h2 id="recent-board-title">Recently posted</h2>
              <button className="board-view-all" type="button" onClick={onBrowse}>
                View all <ArrowRight size={18} />
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
        <h2 id="problem-title">You're not alone. Hard-to-find things are hiding all over the world.</h2>
        <div className="problem-grid">
          {problemItems.map((item) => {
            const ItemIcon = item.icon;
            return (
              <article className="problem-item" key={item.title}>
                <ItemIcon size={30} />
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="how-section" id="how" aria-labelledby="how-title">
        <h2 id="how-title">How {siteName} works</h2>
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
      </section>

      <section className="feed-section" id="feed" aria-labelledby="feed-title">
        <div className="section-head split-head">
          <div>
            <h2 id="feed-title">Live feed: simple requests, real rewards</h2>
            <p>Short posts with clear photos, simple captions, and a small reward for anyone who finds the right source.</p>
          </div>
          <button className="section-link section-button" type="button" onClick={onBrowse}>
            View all requests <ArrowRight size={17} />
          </button>
        </div>
        <div className="feed-table" role="table" aria-label="Live request feed">
          <div className="feed-row feed-header" role="row">
            <span>Request</span>
            <span>Reward</span>
            <span>Finder</span>
            <span>Location</span>
            <span>Status</span>
            <span>Updated</span>
          </div>
          {feedItems.map((item) => (
            <button
              className={`feed-row ${selectedFeedBounty === item.bounty ? "selected" : ""}`}
              key={item.bounty}
              role="row"
              type="button"
              onClick={() => setSelectedFeedBounty(item.bounty)}
            >
              <span className="feed-bounty">
                <img src={item.image} alt="" />
                <strong>{item.bounty}</strong>
              </span>
              <span className="reward-cell">{item.reward}</span>
              <span>
                {item.finder}
                <small>{item.rating} ★ verified</small>
              </span>
              <span>{item.location}</span>
              <span>
                <strong className="status-text">{item.status}</strong>
                <small>{item.note}</small>
              </span>
              <span>{item.updated}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="safety-section" id="safety" aria-labelledby="safety-title">
        <h2 id="safety-title">Why your money is safe</h2>
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
        <h2 id="comparison-title">{siteName} vs other ways to find it</h2>
        <div className="comparison-table">
          <div className="comparison-row comparison-header">
            <span />
            <strong>{siteName}</strong>
            <strong>General Marketplaces</strong>
            <strong>Local Classifieds</strong>
            <strong>Direct sellers</strong>
          </div>
          {comparisonRows.map((row) => (
            <div className="comparison-row" key={row[0]}>
              <strong>{row[0]}</strong>
              {row.slice(1).map((value, index) => (
                <span
                  className={value === "Yes" ? "yes-cell" : value === "Maybe" || value === "Limited" || value === "Rare" ? "maybe-cell" : "no-cell"}
                  key={`${row[0]}-${index}`}
                  data-label={[siteName, "General Marketplaces", "Local Classifieds", "Direct sellers"][index]}
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
          <h2 id="finder-title">Good at finding things? Earn by finding.</h2>
          <ul>
            <li>
              <CheckCircle2 size={18} /> Access live requests posted by real people
            </li>
            <li>
              <CheckCircle2 size={18} /> Use your network and sourcing skills
            </li>
            <li>
              <CheckCircle2 size={18} /> Earn securely when your source is accepted
            </li>
          </ul>
          <button className="finder-link finder-button large-link" type="button" onClick={onFinders}>
            Join as a finder <ArrowRight size={18} />
          </button>
        </div>
        <div className="leaderboard">
          <div className="panel-header">
            <h3>Top finders this month</h3>
            <Trophy size={20} />
          </div>
          {topFinders.map((finder) => (
            <div className="finder-row" key={finder[1]}>
              <strong>{finder[0]}</strong>
              <span className="avatar">{finder[1][0]}</span>
              <span>
                {finder[1]}
                <small>★ {finder[2]}</small>
              </span>
              <em>{finder[3]}</em>
            </div>
          ))}
          <button className="section-link section-button" type="button" onClick={onFinders}>
            See full leaderboard <ArrowRight size={17} />
          </button>
        </div>
        <div className="finder-protection">
          <h3>Finder protection</h3>
          <div>
            <ShieldCheck size={28} />
            <span>
              <strong>Your payouts are secure</strong>
              We release payment fast once a valid source or handoff is accepted.
            </span>
          </div>
          <div>
            <BadgeCheck size={28} />
            <span>
              <strong>Fair and transparent</strong>
              Clear communication and ratings built by real results.
            </span>
          </div>
          <div>
            <Headphones size={28} />
            <span>
              <strong>Support when you need it</strong>
              Our team is here if you run into any issue.
            </span>
          </div>
        </div>
      </section>

      <section className="founder-section" aria-labelledby="founder-title">
        <div className="founder-copy">
          <h2 id="founder-title">From the founder</h2>
          <p>
            We built {siteName} because we were tired of not finding the things we loved. This is the simplest, safest way to get help from people who know where to look.
          </p>
          <strong>- Karthik R., Founder</strong>
        </div>
        <button
          className={`video-frame ${videoPlaying ? "playing" : ""}`}
          type="button"
          aria-label={videoPlaying ? "Pause founder video preview" : "Play founder video preview"}
          onClick={() => setVideoPlaying((value) => !value)}
        >
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1280&q=80" alt="" />
          <span className="play-button">{videoPlaying ? <Sparkles size={32} /> : <Play size={34} fill="currentColor" />}</span>
          <span className="video-controls">
            <span className="progress">
              <span style={{ width: videoPlaying ? "68%" : "18%" }} />
            </span>
            <span>{videoPlaying ? "0:47" : "0:00"} / 1:32</span>
          </span>
        </button>
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
    </main>
  );
}

function AuthPage({
  authBusy,
  authMessage,
  mode,
  nextPage,
  onComplete,
  onGoogleAuth,
  onModeChange,
  onPublicBrowse,
}: {
  authBusy: boolean;
  authMessage: string;
  mode: AuthMode;
  nextPage: Page;
  onComplete: () => void;
  onGoogleAuth: () => void;
  onModeChange: (mode: AuthMode) => void;
  onPublicBrowse: () => void;
}) {
  return (
    <main className="route-page auth-route" aria-labelledby="auth-title">
      <section className="route-hero auth-hero">
        <div>
          <p className="route-kicker">Account required for this action</p>
          <h1 id="auth-title">{mode === "signup" ? "Create your account to continue." : "Log in to continue."}</h1>
          <p>
            Public browsing is open. Posting a request, submitting a source, dashboards, payments, and disputes need a verified account so rewards and reputation stay trustworthy.
          </p>
        </div>
        <div className="auth-panel">
          <div className="segmented-control" role="tablist" aria-label="Authentication mode">
            <button className={mode === "signup" ? "active" : ""} type="button" onClick={() => onModeChange("signup")}>
              Sign up
            </button>
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => onModeChange("login")}>
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
            {authBusy ? "Opening Google..." : "Continue with Google"}
          </button>
          <div className="auth-divider">
            <span>or continue with email</span>
          </div>
          {authMessage ? (
            <p className="auth-message" role="status">
              {authMessage}
            </p>
          ) : null}
          <label>
            Email
            <input type="email" placeholder="you@example.com" />
          </label>
          <label>
            Password
            <input type="password" placeholder="Minimum 8 characters" />
          </label>
          {mode === "signup" ? (
            <label>
              Account type
              <select defaultValue="both">
                <option value="both">Post requests and submit sources</option>
                <option value="poster">Post requests only</option>
                <option value="finder">Submit sources only</option>
              </select>
            </label>
          ) : null}
          <button className="primary-button wide-button" type="button" onClick={onComplete}>
            Continue to {pageLabels[nextPage]}
          </button>
          <button className="section-link section-button center-link" type="button" onClick={onPublicBrowse}>
            Browse public feed instead <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </main>
  );
}

function PostProgress({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    ["Describe", "post-describe"],
    ["Set reward", "post-reward"],
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
            Continue to reward <ArrowRight size={18} />
          </button>
        </div>
        <aside className="side-panel">
          <h2>What finders see</h2>
          <div className="mini-bounty-card">
            <img src={bountyListings[5].image} alt="" />
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
  const breakdown = getEscrowBreakdown(draft.reward);
  const setReward = (value: string) => {
    const nextReward = Number(value);

    if (Number.isFinite(nextReward)) {
      onDraftChange({ reward: Math.max(25, Math.round(nextReward)) });
    }
  };

  return (
    <main className="route-page" aria-labelledby="reward-title">
      <PostProgress current={2} />
      <section className="two-column-page">
        <div className="form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Describe
          </button>
          <h1 id="reward-title">Set a reward that gets attention.</h1>
          <p>The reward is what the finder earns after you accept their source or complete the handoff.</p>
          <label>
            Reward amount
            <input type="number" min="25" value={draft.reward} onChange={(event) => setReward(event.target.value)} />
          </label>
          <div className="reward-slider">
            <input type="range" min="25" max="1000" value={Math.min(draft.reward, 1000)} onChange={(event) => setReward(event.target.value)} />
            <div>
              <span>Low urgency</span>
              <span>High urgency</span>
            </div>
          </div>
          <div className="radio-grid" role="group" aria-label="Request duration">
            <label>
              <input type="radio" name="duration" checked={draft.durationDays === 30} onChange={() => onDraftChange({ durationDays: 30 })} />
              <span>30 days</span>
            </label>
            <label>
              <input type="radio" name="duration" checked={draft.durationDays === 14} onChange={() => onDraftChange({ durationDays: 14 })} />
              <span>14 days</span>
            </label>
            <label>
              <input type="radio" name="duration" checked={draft.durationDays === 60} onChange={() => onDraftChange({ durationDays: 60 })} />
              <span>60 days</span>
            </label>
          </div>
          <button className="primary-button" type="button" onClick={onNext}>
            Continue to payment <ArrowRight size={18} />
          </button>
        </div>
        <aside className="side-panel receipt-panel">
          <h2>Escrow estimate</h2>
          <dl>
            <div>
              <dt>Finder reward</dt>
              <dd>US${breakdown.reward}</dd>
            </div>
            <div>
              <dt>Your service fee</dt>
              <dd>US${breakdown.platformFee}</dd>
            </div>
            <div>
              <dt>Protection reserve</dt>
              <dd>US${breakdown.protection}</dd>
            </div>
            <div className="total-row">
              <dt>Total due today</dt>
              <dd>US${breakdown.total}</dd>
            </div>
          </dl>
          <p>
            <LockKeyhole size={18} /> The buyer pays through hosted checkout. You keep the service fee and handle finder payout after the source or handoff is accepted.
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
  const [customerEmail, setCustomerEmail] = useState(() => window.sessionStorage.getItem(authEmailStorageKey) ?? "");
  const [customerName, setCustomerName] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const breakdown = getEscrowBreakdown(draft.reward);
  const itemName = draft.itemName.trim() || "your request";

  const startCheckout = async () => {
    if (!supabase) {
      setCheckoutStatus("error");
      setCheckoutMessage("Supabase is not configured, so the request and photos cannot be saved yet.");
      return;
    }

    setCheckoutStatus("loading");
    setCheckoutMessage("");

    const uploadedPaths: string[] = [];
    let createdRequestId: string | null = null;

    try {
      const normalizedEmail = customerEmail.trim();
      const normalizedName = customerName.trim();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error("Sign in again before funding this request.");
      }

      const requestId = crypto.randomUUID();
      const uploadedImages = [];

      window.sessionStorage.setItem(authEmailStorageKey, normalizedEmail);
      window.sessionStorage.setItem(
        checkoutSnapshotStorageKey,
        JSON.stringify({
          requestId,
          itemName,
          provider: "hosted checkout",
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

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.checkoutUrl) {
        throw new Error(payload?.error || "Could not start hosted checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      if (!createdRequestId && uploadedPaths.length) {
        await supabase.storage.from(requestReferenceImagesBucket).remove(uploadedPaths);
      }

      setCheckoutStatus("error");
      setCheckoutMessage(error instanceof Error ? error.message : "Could not start hosted checkout.");
    }
  };

  return (
    <main className="route-page" aria-labelledby="pay-title">
      <PostProgress current={3} />
      <section className="two-column-page pay-layout">
        <div className="form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Reward
          </button>
          <h1 id="pay-title">Fund the reward with secure checkout.</h1>
          <p>
            The poster pays once through hosted checkout. The payment is recorded as a marketplace split: finder payout is held for release after an accepted source, and the platform keeps the service fee plus protection reserve.
          </p>
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
              <strong>Hosted checkout</strong>
              Card and wallet details are collected by the payment processor, not by this app. The charge settles to the platform account; this app tracks the finder payable and platform share for release, refund, or dispute handling.
            </span>
          </div>
          <button className="primary-button" type="button" disabled={checkoutStatus === "loading"} onClick={startCheckout}>
            <CreditCard size={18} /> {checkoutStatus === "loading" ? "Opening checkout..." : `Pay US$${breakdown.total} securely`}
          </button>
          {checkoutMessage ? (
            <p className="dialog-error" role="status">
              {checkoutMessage}
            </p>
          ) : null}
        </div>
        <aside className="side-panel payment-summary receipt-panel">
          <h2>Payment summary</h2>
          <div className="summary-card">
            <DollarSign size={28} />
            <strong>US${breakdown.total} due today</strong>
            <span>Poster payment for {itemName}, split into finder payable and platform share.</span>
          </div>
          <dl>
            <div>
              <dt>Finder payout</dt>
              <dd>US${breakdown.reward}</dd>
            </div>
            <div>
              <dt>Platform service fee</dt>
              <dd>US${breakdown.platformFee}</dd>
            </div>
            <div>
              <dt>Protection reserve</dt>
              <dd>US${breakdown.protection}</dd>
            </div>
            <div>
              <dt>Platform share</dt>
              <dd>US${breakdown.platformShare}</dd>
            </div>
            <div className="total-row">
              <dt>Poster pays today</dt>
              <dd>US${breakdown.total}</dd>
            </div>
          </dl>
          <ul className="check-list">
            <li>
              <ShieldCheck size={18} /> The processor collects the full poster payment
            </li>
            <li>
              <Banknote size={18} /> Platform share is US${breakdown.platformShare}
            </li>
            <li>
              <TimerReset size={18} /> Finder payout becomes payable after acceptance
            </li>
          </ul>
        </aside>
      </section>
    </main>
  );
}

function BrowsePage({
  onBrowseAll,
  onDetail,
  onPost,
}: {
  onBrowseAll: () => void;
  onDetail: (bountyId: string) => void;
  onPost: () => void;
}) {
  return (
    <main className="route-page bounty-gallery-page" aria-labelledby="browse-title">
      <section className="gallery-hero">
        <h1 id="browse-title">Featured requests</h1>
        <p>Simple posts with clear photos and small rewards, shown first so finders can quickly spot what they recognize.</p>
        <div className="gallery-hero-actions">
          <button className="primary-button" type="button" onClick={onPost}>
            Post a request <ArrowRight size={18} />
          </button>
          <button className="section-link section-button" type="button" onClick={onBrowseAll}>
            Browse all <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="top-bounty-grid" aria-label="Featured requests">
        {topFiveBounties.map((bounty, index) => (
          <BountySquareCard bounty={bounty} featured={index === 0} key={bounty.id} onDetail={onDetail} rank={index + 1} />
        ))}
      </section>

      <section className="gallery-section" aria-labelledby="more-bounties-title">
        <div className="gallery-section-head">
          <div>
            <h2 id="more-bounties-title">More requests closing soon</h2>
            <p>Active requests with real rewards, live source submissions, and a 30-day protection window.</p>
          </div>
          <button className="section-link section-button" type="button" onClick={onBrowseAll}>
            Browse all <ArrowRight size={17} />
          </button>
        </div>
        <div className="bounty-square-grid">
          {overviewBounties.map((bounty, index) => (
            <BountySquareCard bounty={bounty} compact key={bounty.id} onDetail={onDetail} rank={index + 6} />
          ))}
        </div>
      </section>
    </main>
  );
}

function BrowseAllPage({ onDetail, onPost }: { onDetail: (bountyId: string) => void; onPost: () => void }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(16);
  const categories = ["All", "Home goods", "Art & decor", "Kitchen", "Watches", "Camera gear", "Vintage audio", "Gaming", "Portable audio"];
  const filteredBounties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rewardSortedBounties.filter((bounty) => {
      const matchesCategory = filter === "All" || bounty.category === filter;
      const searchable = `${bounty.name} ${bounty.detail} ${bounty.category} ${bounty.location}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, query]);

  useEffect(() => {
    setVisibleCount(16);
  }, [filter, query]);

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
          <p>Scroll the full request board. More cards load as you move down until you reach the end of the current request list.</p>
        </div>
        <button className="primary-button" type="button" onClick={onPost}>
          Post a request <ArrowRight size={18} />
        </button>
      </section>
      <section className="browse-toolbar" aria-label="Browse filters">
        <div className="search-field">
          <Search size={18} />
          <input placeholder="Search requests" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div className="filter-pills">
          {categories.map((category) => (
            <button className={filter === category ? "active" : ""} key={category} type="button" onClick={() => setFilter(category)}>
              {category}
            </button>
          ))}
        </div>
        <button className="icon-label-button" type="button">
          <SlidersHorizontal size={18} /> More filters
        </button>
      </section>
      <section className="bounty-square-grid full-gallery-grid" aria-label="All request results">
        {visibleBounties.map((bounty) => (
          <BountySquareCard bounty={bounty} key={bounty.id} onDetail={onDetail} />
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
}: {
  bounty: BountyListing;
  compact?: boolean;
  featured?: boolean;
  onDetail: (bountyId: string) => void;
  rank?: number;
}) {
  return (
    <article className={`bounty-square-card tone-${rank ? ((rank - 1) % 5) + 1 : (bounty.rewardValue % 5) + 1} ${compact ? "compact" : ""} ${featured ? "featured" : ""}`}>
      <button className="square-card-hit" type="button" onClick={() => onDetail(bounty.id)} aria-label={`View ${bounty.name}`}>
        <span className="square-rank">{rank ? `#${rank}` : bounty.category}</span>
        <span className="square-price">{bounty.reward}</span>
        <span className="square-image-wrap">
          <img src={bounty.image} alt="" />
        </span>
        <span className="square-copy">
          <strong>{bounty.name}</strong>
          <em>{bounty.detail}</em>
        </span>
        <span className="square-meta">
          <span>
            <Clock3 size={14} /> {bounty.closes}
          </span>
          <span>
            <MessageSquare size={14} /> {bounty.submissions}
          </span>
        </span>
      </button>
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
  return (
    <main className="route-page" aria-labelledby="detail-title">
      <button className="back-button page-back" type="button" onClick={onBrowse}>
        <ArrowLeft size={17} /> Browse feed
      </button>
      <section className="detail-layout">
        <article className="detail-main">
          <img className="detail-image" src={bounty.image} alt="" />
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
          <strong className="detail-reward">{bounty.reward}</strong>
          <span>Reward for accepted source</span>
          <button className="primary-button wide-button" type="button" onClick={onSubmit}>
            Submit a source <Send size={18} />
          </button>
          <button className="section-link section-button center-link" type="button" onClick={onPosterProfile}>
            View poster trust page <ArrowRight size={17} />
          </button>
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
  const [submitted, setSubmitted] = useState(false);
  const [sourceType, setSourceType] = useState<FindSourceType>("source-link");
  const [sourceLink, setSourceLink] = useState("");
  const [contactEmail, setContactEmail] = useState(() => window.sessionStorage.getItem("pleasefindmethis-auth-email") ?? "");
  const [itemTerms, setItemTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const selectedSource = findSourceOptions.find((option) => option.value === sourceType) ?? findSourceOptions[0];
  const linkRequired = sourceType === "source-link";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = contactEmail.trim();
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

    setSubmitError("");
    setContactEmail(normalizedEmail);
    setSubmitted(true);
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
              Screenshots, photos, messages, or proof are optional but help the poster review faster.
            </span>
          </div>
          {submitError ? (
            <p className="dialog-error" role="alert">
              {submitError}
            </p>
          ) : null}
          <button className="primary-button" type="submit">
            Submit source for review
          </button>
          {submitted ? (
            <>
              <div className="summary-card submission-success" role="status">
                <CheckCircle2 size={24} />
                <strong>Source submitted for poster review</strong>
                <span>{sourceLink.trim() ? `Link shared: ${sourceLink.trim()}` : "No public link shared. The poster will use your email to discuss the source or handoff."}</span>
                <span>Contact: {contactEmail}</span>
                {itemTerms.trim() ? <span>Terms: {itemTerms.trim()}</span> : null}
              </div>
              <button className="section-link section-button" type="button" onClick={onDashboard}>
                Go to finder dashboard <ArrowRight size={17} />
              </button>
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
          </ul>
          <div className="mini-bounty-card">
            <img src={bounty.image} alt="" />
            <div>
              <strong>{bounty.name}</strong>
              <span>{bounty.reward} reward · {bounty.closes} left</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function PosterDashboardPage({
  checkoutReturnStatus,
  onBounty,
  onDispute,
  onProfile,
}: {
  checkoutReturnStatus: CheckoutReturnStatus;
  onBounty: () => void;
  onDispute: () => void;
  onProfile: () => void;
}) {
  const checkoutSnapshot = readStoredCheckoutSnapshot();

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
        <button className="section-link section-button" type="button" onClick={onProfile}>
          Public trust page <ArrowRight size={17} />
        </button>
      </section>
      <section className="metric-grid">
        <Metric icon={LockKeyhole} label="Escrow funded" value="US$1,280" />
        <Metric icon={MessageSquare} label="Sources awaiting review" value="4" />
        <Metric icon={PackageCheck} label="Handoffs in discussion" value="2" />
        <Metric icon={CheckCircle2} label="Accepted this month" value="US$930" />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Sources to review</h2>
            <Filter size={18} />
          </div>
          {bountyListings.slice(0, 4).map((bounty) => (
            <button className="review-row" key={bounty.id} type="button" onClick={onBounty}>
              <img src={bounty.image} alt="" />
              <span>
                <strong>{bounty.name}</strong>
                <small>{bounty.submissions} submissions · {bounty.status}</small>
              </span>
              <em>{bounty.reward}</em>
            </button>
          ))}
        </div>
        <div className="dashboard-panel active-review">
          <div className="panel-header">
            <h2>Recommended find</h2>
            <BadgeCheck size={20} />
          </div>
          <h3>Help me find this art</h3>
          <p>Finder shared a print source, a seller link, and the handoff questions to ask next. The image matches the framed duck art request.</p>
          <div className="action-row">
            <button className="primary-button" type="button">
              Accept source and contact finder
            </button>
            <button className="danger-button" type="button" onClick={onDispute}>
              Open dispute
            </button>
          </div>
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
  const itemName = checkoutSnapshot?.itemName ?? "Your request";
  const confirmationCode = formatConfirmationCode(checkoutSnapshot?.requestId);
  const postedDate = formatConfirmationDate(checkoutSnapshot?.createdAt);
  const durationText = checkoutSnapshot?.durationDays ? `${checkoutSnapshot.durationDays} days` : "Active window";
  const categoryText = checkoutSnapshot?.category ?? "Public request";
  const paidTodayText = checkoutSnapshot ? `US$${checkoutSnapshot.total}` : "Payment processed";
  const rewardText = checkoutSnapshot ? `US$${checkoutSnapshot.reward}` : "Held after acceptance";
  const receiptTarget = checkoutSnapshot?.email ? `Receipt sent to ${checkoutSnapshot.email}` : "Receipt saved to your checkout account";
  const platformShareText = checkoutSnapshot
    ? `Platform share is US$${checkoutSnapshot.platformShare}, including service fee and protection reserve.`
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
          Your payment is recorded, the finder reward is held for acceptance, and the request is ready for sources. Use this confirmation to track the post while finders start working.
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
          <button className="section-link section-button" type="button" onClick={onProfile}>
            Open trust page <ArrowRight size={17} />
          </button>
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
  onBrowse,
  onProfile,
  onSubmit,
}: {
  onBrowse: () => void;
  onProfile: () => void;
  onSubmit: () => void;
}) {
  return (
    <main className="route-page dashboard-page" aria-labelledby="finder-dashboard-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Finder dashboard</p>
          <h1 id="finder-dashboard-title">Submit sources and build reputation.</h1>
        </div>
        <div className="head-actions">
          <button className="section-link section-button" type="button" onClick={onProfile}>
            Profile <ArrowRight size={17} />
          </button>
          <button className="primary-button" type="button" onClick={onBrowse}>
            Find requests
          </button>
        </div>
      </section>
      <section className="metric-grid">
        <Metric icon={Banknote} label="Available reward" value="US$640" />
        <Metric icon={Star} label="Reputation" value="4.9" />
        <Metric icon={Trophy} label="Accepted sources" value="18" />
        <Metric icon={Clock3} label="Pending source reviews" value="3" />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Active opportunities</h2>
            <Search size={18} />
          </div>
          {bountyListings.slice(0, 4).map((bounty) => (
            <button className="review-row" key={bounty.id} type="button" onClick={onSubmit}>
              <img src={bounty.image} alt="" />
              <span>
                <strong>{bounty.name}</strong>
                <small>{bounty.category} · {bounty.closes} left</small>
              </span>
              <em>{bounty.reward}</em>
            </button>
          ))}
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
  return (
    <main className="route-page" aria-labelledby="dispute-title">
      <section className="two-column-page">
        <div className="form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Poster dashboard
          </button>
          <h1 id="dispute-title">Open a dispute.</h1>
          <p>Use this page when a source, contact, handoff, or proof package does not match the funded request.</p>
          <label>
            Dispute reason
            <select defaultValue="mismatch">
              <option value="mismatch">Item does not match request</option>
              <option value="condition">Condition issue</option>
              <option value="shipping">Shipping or handoff issue</option>
              <option value="payment">Payment release issue</option>
            </select>
          </label>
          <label>
            Evidence summary
            <textarea placeholder="Explain what went wrong and include source links, messages, or proof references." />
          </label>
          <div className="upload-box">
            <FileText size={24} />
            <span>
              <strong>Attach evidence</strong>
              Source links, receipts, photos, messages, and handoff proof.
            </span>
          </div>
          <button className="danger-button strong-danger" type="button">
            Submit dispute for review
          </button>
        </div>
        <aside className="side-panel dispute-side">
          <h2>Case timeline</h2>
          {["Reward funded", "Source submitted", "Poster requested review", "Evidence due in 48 hours"].map((event) => (
            <div className="timeline-item" key={event}>
              <span />
              <p>{event}</p>
            </div>
          ))}
          <div className="summary-card warning-card">
            <AlertTriangle size={26} />
            <strong>Escrow remains locked</strong>
            <span>No funds are released while the dispute is under review.</span>
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
            <p>Verified finder in New York with a 4.9 rating across rare camera gear, watches, and vintage electronics.</p>
          </div>
        </div>
        <div className="profile-actions">
          <button className="primary-button" type="button" onClick={onFinder}>
            Work as a finder
          </button>
          <button className="section-link section-button" type="button" onClick={onBrowse}>
            Browse requests <ArrowRight size={17} />
          </button>
        </div>
      </section>
      <section className="metric-grid">
        <Metric icon={Star} label="Rating" value="4.9" />
        <Metric icon={Trophy} label="Accepted sources" value="18" />
        <Metric icon={ShieldCheck} label="Verification" value="ID + payout" />
        <Metric icon={Scale} label="Disputes lost" value="0" />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Trust signals</h2>
            <ShieldCheck size={20} />
          </div>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} /> Verified identity and payout method
            </li>
            <li>
              <CheckCircle2 size={18} /> 92% accepted on first submission
            </li>
            <li>
              <CheckCircle2 size={18} /> Average source details within 1 day
            </li>
          </ul>
        </div>
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Recent reviews</h2>
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
  const [openQuestion, setOpenQuestion] = useState(faqItems[0].question);

  return (
    <main className="route-page faq-page" aria-labelledby="faq-title">
      <section className="route-hero">
        <div>
          <h1 id="faq-title">FAQ</h1>
          <p>Clear answers for posters, finders, rewards, refunds, disputes, and public browsing.</p>
        </div>
        <div className="head-actions">
          <button className="primary-button" type="button" onClick={onPost}>
            Post a request
          </button>
          <button className="section-link section-button" type="button" onClick={onBrowse}>
            Browse feed <ArrowRight size={17} />
          </button>
        </div>
      </section>
      <section className="faq-list">
        {faqItems.map((item) => {
          const isOpen = openQuestion === item.question;
          return (
            <article className={isOpen ? "faq-item open" : "faq-item"} key={item.question}>
              <button type="button" onClick={() => setOpenQuestion(isOpen ? "" : item.question)}>
                <span>{item.question}</span>
                {isOpen ? <X size={18} /> : <CircleHelp size={18} />}
              </button>
              {isOpen ? <p>{item.answer}</p> : null}
            </article>
          );
        })}
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

type RootWindow = Window & {
  __bountyMarketplaceRoot?: ReturnType<typeof createRoot>;
};

const rootElement = document.getElementById("root")!;
const rootWindow = window as RootWindow;
const root = rootWindow.__bountyMarketplaceRoot ?? createRoot(rootElement);

rootWindow.__bountyMarketplaceRoot = root;
root.render(<App />);
