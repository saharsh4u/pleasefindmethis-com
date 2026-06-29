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

type RequestCategory = "audio" | "camera" | "watch" | "gaming" | "parts";
type RequestDuration = 14 | 30 | 60;

type PostDraft = {
  itemName: string;
  category: RequestCategory;
  details: string;
  reward: number;
  durationDays: RequestDuration;
};

type EscrowBreakdown = {
  reward: number;
  platformFee: number;
  protection: number;
  total: number;
};

const siteName = "pleasefindmethis.com";
const requestSingular = "request";
const requestPlural = "requests";

const requestCategories: Array<{ value: RequestCategory; label: string }> = [
  { value: "audio", label: "Portable audio" },
  { value: "camera", label: "Camera gear" },
  { value: "watch", label: "Watches" },
  { value: "gaming", label: "Gaming" },
  { value: "parts", label: "Replacement parts" },
];

const initialPostDraft: PostDraft = {
  itemName: "Sony Walkman WM-D6C",
  category: "audio",
  details: "",
  reward: 180,
  durationDays: 30,
};

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
  "submit-find": "Submit a find",
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

const bountyListings: BountyListing[] = [
  {
    id: "fujifilm-x100f-cap",
    name: "Fujifilm X100F",
    detail: "Original silver lens cap",
    reward: "US$120",
    rewardValue: 120,
    closes: "18 days",
    category: "Camera gear",
    status: "Open",
    location: "Ships to United States",
    poster: "Ari P.",
    posted: "2 days ago",
    submissions: 3,
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for the original Fujifilm X100F silver lens cap in clean condition. Aftermarket caps are not useful for this request.",
    mustHaves: ["Original Fujifilm part", "Silver finish", "No deep scratches", "Ships with tracking"],
    timeline: ["Bounty funded", "Three finders watching", "Latest source submitted 2 hours ago"],
  },
  {
    id: "seiko-6139-panda",
    name: "Seiko 6139-6002",
    detail: "Panda dial, running condition",
    reward: "£450",
    rewardValue: 570,
    closes: "12 days",
    category: "Watches",
    status: "Finder in touch",
    location: "United Kingdom",
    poster: "Mina T.",
    posted: "4 days ago",
    submissions: 5,
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=720&q=80",
    description:
      "Searching for a Seiko 6139-6002 with a clean panda dial. Service history is helpful, but originality matters most.",
    mustHaves: ["Panda dial", "Working chronograph", "Clear caseback photos", "Seller accepts escrow process"],
    timeline: ["Bounty funded", "Two shortlisted leads", "Authenticity review in progress"],
  },
  {
    id: "marantz-pm94-knobs",
    name: "Marantz PM-94",
    detail: "Original amplifier knobs",
    reward: "€280",
    rewardValue: 300,
    closes: "20 days",
    category: "Vintage audio",
    status: "Open",
    location: "European Union",
    poster: "Theo N.",
    posted: "1 day ago",
    submissions: 1,
    image:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=720&q=80",
    description:
      "Need a set of original Marantz PM-94 knobs for a restoration project. Close visual match is not enough.",
    mustHaves: ["Original PM-94 parts", "Full knob set preferred", "No cracked stems", "Clear macro photos"],
    timeline: ["Bounty funded", "Parts recyclers contacted", "Waiting on photos"],
  },
  {
    id: "ps3-cecha01",
    name: "PS3 60GB CECHA01",
    detail: "Backward compatible model",
    reward: "US$180",
    rewardValue: 180,
    closes: "9 days",
    category: "Gaming",
    status: "Found",
    location: "North America",
    poster: "Ravi S.",
    posted: "7 days ago",
    submissions: 7,
    image:
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=720&q=80",
    description:
      "Looking for a clean CECHA01 unit that powers on, reads discs, and has not been heavily modified.",
    mustHaves: ["CECHA01 serial proof", "Reads PS2 discs", "No yellow light history", "Video proof requested"],
    timeline: ["Bounty funded", "Finder matched a local unit", "Delivery pending"],
  },
  {
    id: "nikon-ais-35",
    name: "Nikon AIS",
    detail: "35mm f/1.4 lens",
    reward: "A$240",
    rewardValue: 160,
    closes: "15 days",
    category: "Camera gear",
    status: "Delivered",
    location: "Australia",
    poster: "June R.",
    posted: "10 days ago",
    submissions: 4,
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=720&q=80",
    description:
      "Wanted: Nikon 35mm f/1.4 AIS lens with clean optics and smooth focus. Cosmetic wear is acceptable.",
    mustHaves: ["Clean glass", "Smooth focus ring", "No fungus", "Sample photos"],
    timeline: ["Bounty funded", "Finder purchased item", "Payment released"],
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
    timeline: ["Bounty funded", "Finder shortlisted two bodies", "Meter video requested"],
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
    timeline: ["Bounty funded", "Seller found in London", "Authenticity check underway"],
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
    timeline: ["Bounty funded", "Synth forums contacted", "Awaiting test clips"],
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
    mustHaves: ["Large case", "Black dial", "Serial proof", "Seller accepts escrow"],
    timeline: ["Bounty funded", "Three dealers contacted", "Waiting on papers"],
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
    timeline: ["Bounty funded", "Two leads rejected", "New photos requested"],
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
    timeline: ["Bounty funded", "Japan sellers contacted", "First lead under review"],
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
    timeline: ["Bounty funded", "Two leads received", "Waiting on sample photo"],
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
    timeline: ["Bounty funded", "Five submissions", "Battery photos requested"],
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
    timeline: ["Bounty funded", "Collector groups contacted", "Awaiting meter video"],
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
    timeline: ["Bounty funded", "First lead received", "USB proof requested"],
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
    timeline: ["Bounty funded", "Two local stores checked", "One complete copy under review"],
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
    timeline: ["Bounty funded", "DJ repair shops contacted", "Waiting on photos"],
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
    timeline: ["Bounty funded", "Three leads received", "Best lead missing screw"],
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
    timeline: ["Bounty funded", "Four sellers found", "Controller match pending"],
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
    timeline: ["Bounty funded", "Pilot group posted", "Two leads being checked"],
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
    timeline: ["Bounty funded", "Five backs located", "Best one awaiting test roll"],
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
    timeline: ["Bounty funded", "Audiophile forum posted", "One lead needs channel test"],
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
    timeline: ["Bounty funded", "One collector contacted", "Awaiting demo clip"],
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
    timeline: ["Bounty funded", "Two listings reviewed", "Best lead awaiting glass photos"],
  },
];

const featuredBounties = bountyListings.slice(0, 5);
const rewardSortedBounties = [...bountyListings].sort((left, right) => right.rewardValue - left.rewardValue);
const topFiveBounties = rewardSortedBounties.slice(0, 5);
const overviewBounties = rewardSortedBounties.slice(5, 20);

const feedItems: FeedItem[] = [
  {
    bounty: "Leica M6 TTL 0.72 Body",
    reward: "US$1,450",
    finder: "Maya L.",
    rating: "4.9",
    location: "New York",
    status: "Finder in touch",
    note: "Source located",
    updated: "2 hours ago",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=160&q=80",
  },
  {
    bounty: "Omega Speedmaster 125th",
    reward: "£820",
    finder: "Jonas K.",
    rating: "4.8",
    location: "London",
    status: "Price agreed",
    note: "Checking authenticity",
    updated: "5 hours ago",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=160&q=80",
  },
  {
    bounty: "PS3 60GB CECHA01",
    reward: "€230",
    finder: "Lina M.",
    rating: "4.7",
    location: "Berlin",
    status: "Found",
    note: "On the way",
    updated: "7 hours ago",
    image:
      "https://images.unsplash.com/photo-1605901309584-818e25960a8f?auto=format&fit=crop&w=160&q=80",
  },
  {
    bounty: "Nikon 35mm f/1.4 AIS Lens",
    reward: "A$390",
    finder: "Noah R.",
    rating: "4.9",
    location: "Singapore",
    status: "Delivered",
    note: "Payment released",
    updated: "1 day ago",
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=160&q=80",
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
    title: "1. You post",
    copy: "Describe what you are looking for, add the reward amount, and set the request window.",
  },
  {
    icon: UserRoundCheck,
    title: "2. Finders hunt it down",
    copy: "Expert finders search networks, markets, and sources to locate exactly what you need.",
  },
  {
    icon: LockKeyhole,
    title: "3. You pay only when it is found",
    copy: "You inspect the valid find. If you are happy, release the payment.",
  },
];

const safetySteps = [
  {
    icon: LockKeyhole,
    title: "You fund the reward",
    copy: "Your reward is held in escrow. The finder does not see your money.",
  },
  {
    icon: Search,
    title: "Finder shares the item",
    copy: "They share details and proof so you can review with confidence.",
  },
  {
    icon: PackageCheck,
    title: "We deliver to you",
    copy: "You receive the item and inspect it in real life.",
  },
  {
    icon: CheckCircle2,
    title: "You release payment",
    copy: "If you are happy, payment is released to the finder.",
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
  ["Money held in escrow", "Yes", "No", "No", "No"],
  ["30-day protection or refund", "Yes", "No", "No", "No"],
  ["Saves your time", "Yes", "Maybe", "No", "No"],
];

const topFinders = [
  ["1", "Maya L.", "4.9", "18 successful finds"],
  ["2", "Jonas K.", "4.8", "14 successful finds"],
  ["3", "Lina M.", "4.9", "12 successful finds"],
];

const finderReviews = [
  ["Ari P.", "Maya found the exact cap in two days and verified every detail before I paid."],
  ["Theo N.", "The proof flow made it easy to avoid a risky seller and choose the right part."],
  ["June R.", "Delivery was tracked, inspected, and paid out cleanly."],
];

const faqItems = [
  {
    question: "When do I pay?",
    answer:
      "You fund the request before it goes live. The reward stays held until a valid find is delivered and accepted.",
  },
  {
    question: "What happens if nobody finds it?",
    answer: "If the request is not fulfilled within 30 days, the reward is returned to you.",
  },
  {
    question: "Can I reject a find?",
    answer:
      "Yes. You can reject submissions that do not match your description or proof requirements. Disputes are reviewed with evidence from both sides.",
  },
  {
    question: "How do finders get paid?",
    answer:
      "Finders earn the posted reward after the poster confirms delivery. Finder dashboard reputation improves with successful, well-documented finds.",
  },
  {
    question: "Is the browse feed public?",
    answer:
      "Yes. Anyone can browse public requests and detail pages. Posting, submitting finds, dashboards, payment, and disputes require sign up or log in.",
  },
];

function parseRoute(): Page {
  const raw = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return routeMap[raw] ?? "landing";
}

function routeHref(page: Page) {
  return `#/${pageRoutes[page]}`;
}

function getCategoryLabel(category: RequestCategory) {
  return requestCategories.find((item) => item.value === category)?.label ?? "General";
}

function getEscrowBreakdown(reward: number): EscrowBreakdown {
  const normalizedReward = Math.max(25, Math.round(Number.isFinite(reward) ? reward : initialPostDraft.reward));
  const platformFee = Math.max(12, Math.round(normalizedReward * 0.08));
  const protection = Math.round(normalizedReward * 0.03);

  return {
    reward: normalizedReward,
    platformFee,
    protection,
    total: normalizedReward + platformFee + protection,
  };
}

function App() {
  const [route, setRoute] = useState<Page>(() => parseRoute());
  const [menuOpen, setMenuOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(() => window.sessionStorage.getItem("pleasefindmethis-signed-in") === "true");
  const [pendingRoute, setPendingRoute] = useState<Page>("post-describe");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [postDraft, setPostDraft] = useState<PostDraft>(initialPostDraft);
  const [selectedFeedBounty, setSelectedFeedBounty] = useState(feedItems[0].bounty);
  const [activeBountyId, setActiveBountyId] = useState(bountyListings[0].id);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    const syncRoute = () => {
      setRoute(parseRoute());
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

  const completeAuth = () => {
    window.sessionStorage.setItem("pleasefindmethis-signed-in", "true");
    setSignedIn(true);
    navigate(pendingRoute);
  };

  const updatePostDraft = (updates: Partial<PostDraft>) => {
    setPostDraft((draft) => ({ ...draft, ...updates }));
  };

  const visibleRoute = !signedIn && protectedPages.has(route) ? "auth" : route;

  useEffect(() => {
    if (!signedIn && protectedPages.has(route)) {
      setPendingRoute(route);
      setAuthMode("signup");
      if (window.location.hash !== routeHref("auth")) {
        window.history.replaceState(null, "", routeHref("auth"));
      }
      setRoute("auth");
    }
  }, [route, signedIn]);

  const pageProps = {
    navigate,
    requireAuth,
    signedIn,
    menuOpen,
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
          onPost={() => requireAuth("post-describe")}
          onSection={scrollToLandingSection}
          selectedFeedBounty={selectedFeedBounty}
          setMenuOpen={setMenuOpen}
          setSelectedFeedBounty={setSelectedFeedBounty}
          setVideoPlaying={setVideoPlaying}
          videoPlaying={videoPlaying}
        />
      ) : (
        <PageChrome {...pageProps}>
          {visibleRoute === "auth" ? (
            <AuthPage
              mode={authMode}
              nextPage={pendingRoute}
              onComplete={completeAuth}
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
          {visibleRoute === "post-pay" ? <PostPayPage draft={postDraft} onBack={() => navigate("post-reward")} onDashboard={() => navigate("poster-dashboard")} /> : null}
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
            <PosterDashboardPage onBounty={() => navigate("bounty-detail")} onDispute={() => navigate("dispute")} onProfile={() => navigate("profile")} />
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
  requireAuth,
  setMenuOpen,
  signedIn,
}: {
  children: React.ReactNode;
  menuOpen: boolean;
  navigate: (page: Page) => void;
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
          <button className="text-button" type="button" onClick={() => requireAuth("poster-dashboard", "login")}>
            {signedIn ? "Account" : "Log in"}
          </button>
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
          </nav>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function LandingPage({
  menuOpen,
  onBrowse,
  onDetail,
  onFinders,
  onLogin,
  onPost,
  onSection,
  selectedFeedBounty,
  setMenuOpen,
  setSelectedFeedBounty,
  setVideoPlaying,
  videoPlaying,
}: {
  menuOpen: boolean;
  onBrowse: () => void;
  onDetail: (bountyId: string) => void;
  onFinders: () => void;
  onLogin: () => void;
  onPost: () => void;
  onSection: (sectionId: string) => void;
  selectedFeedBounty: string;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFeedBounty: React.Dispatch<React.SetStateAction<string>>;
  setVideoPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  videoPlaying: boolean;
}) {
  return (
    <main id="top">
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
            <button className="text-button" type="button" onClick={onLogin}>
              Log in
            </button>
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
            </nav>
          ) : null}
        </div>

        <div className="hero-copy">
          <h1>
            Can&apos;t find it anywhere? Post it on <span className="hero-domain">pleasefindmethis.com</span>.
          </h1>
          <h1 className="mobile-hero-title">Can&apos;t find it anywhere?</h1>
          <p className="micro-line">
            <span>Post what you need</span>
            <ArrowRight size={16} />
            <span>finders track it down</span>
            <ArrowRight size={16} />
            <span>you pay only when it&apos;s found.</span>
          </p>
          <div className="mobile-hero-actions" aria-label="Mobile hero actions">
            <button className="primary-button mobile-post-button" type="button" onClick={onPost}>
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
            You&apos;ve searched every site, called every shop, scrolled for hours, and it&apos;s still nowhere. Let someone who knows where to look find it for you.
          </p>
          <button className="primary-button hero-cta" type="button" onClick={onPost}>
            Post what you&apos;re looking for
          </button>
          <button className="finder-link finder-button hero-secondary-link" type="button" onClick={onFinders}>
            Good at finding things? Earn by finding <ArrowRight size={18} />
          </button>
          <p className="trust-line">
            <LockKeyhole size={18} />
            Your reward is held safely. Not found in 30 days? You get your full reward back.
          </p>
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
            <h2 id="feed-title">Live feed: real requests, real progress</h2>
            <p>Example requests seeded before launch, with status visible as finders work.</p>
          </div>
          <button className="section-link section-button" type="button" onClick={onBrowse}>
            View all requests <ArrowRight size={17} />
          </button>
        </div>
        <div className="feed-table" role="table" aria-label="Live request feed">
          <div className="feed-row feed-header" role="row">
            <span>Bounty</span>
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
              <CheckCircle2 size={18} /> Earn securely when the item is delivered
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
              We release payment fast once delivery is confirmed.
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
  mode,
  nextPage,
  onComplete,
  onModeChange,
  onPublicBrowse,
}: {
  mode: AuthMode;
  nextPage: Page;
  onComplete: () => void;
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
            Public browsing is open. Posting a request, submitting a find, dashboards, payments, and disputes need a verified account so escrow and reputation stay trustworthy.
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
                <option value="both">Post and find requests</option>
                <option value="poster">Post requests only</option>
                <option value="finder">Find requests only</option>
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
            <input value={draft.itemName} placeholder="Sony Walkman WM-D6C, working condition" onChange={(event) => onDraftChange({ itemName: event.target.value })} />
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
          <div className="upload-box">
            <ImagePlus size={24} />
            <span>
              <strong>Add reference images</strong>
              Photos help finders match the exact item.
            </span>
          </div>
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
              <CheckCircle2 size={18} /> What proof you need
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
          <p>The reward is what the finder earns after your item is delivered and accepted.</p>
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
            <LockKeyhole size={18} /> The buyer pays into your Dodo account. You keep the service fee and handle finder payout after delivery.
          </p>
        </aside>
      </section>
    </main>
  );
}

function PostPayPage({ draft, onBack }: { draft: PostDraft; onBack: () => void; onDashboard: () => void }) {
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState<"idle" | "loading" | "error">("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const breakdown = getEscrowBreakdown(draft.reward);
  const itemName = draft.itemName.trim() || "your request";

  const startCheckout = async () => {
    setCheckoutStatus("loading");
    setCheckoutMessage("");

    try {
      const response = await fetch("/api/dodo/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            email: customerEmail,
            name: customerName,
          },
          draft: {
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
        throw new Error(payload?.error || "Could not start Dodo checkout.");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (error) {
      setCheckoutStatus("error");
      setCheckoutMessage(error instanceof Error ? error.message : "Could not start Dodo checkout.");
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
          <h1 id="pay-title">Fund escrow with Dodo Payments.</h1>
          <p>
            Your request goes live after the hosted checkout is paid. The full payment lands in your Dodo account, including your service fee.
          </p>
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
              <strong>Dodo hosted checkout</strong>
              Card details are collected by Dodo, not by this app. Use the API key and product from your own Dodo dashboard so payments settle to you.
            </span>
          </div>
          <button className="primary-button" type="button" disabled={checkoutStatus === "loading"} onClick={startCheckout}>
            <CreditCard size={18} /> {checkoutStatus === "loading" ? "Opening Dodo checkout..." : `Pay US$${breakdown.total} with Dodo`}
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
            <span>Charged through your Dodo merchant account for {itemName}.</span>
          </div>
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
              <dt>Total charged</dt>
              <dd>US${breakdown.total}</dd>
            </div>
          </dl>
          <ul className="check-list">
            <li>
              <ShieldCheck size={18} /> You receive the full Dodo payment
            </li>
            <li>
              <Banknote size={18} /> Service fee stays with the marketplace
            </li>
            <li>
              <TimerReset size={18} /> Finder payout is handled after delivery
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
        <h1 id="browse-title">Top five requests</h1>
        <p>The highest rewards on the board right now, shown first so expert finders can jump straight into the most valuable hunts.</p>
        <div className="gallery-hero-actions">
          <button className="primary-button" type="button" onClick={onPost}>
            Post a request <ArrowRight size={18} />
          </button>
          <button className="section-link section-button" type="button" onClick={onBrowseAll}>
            Browse all <ArrowRight size={17} />
          </button>
        </div>
      </section>

      <section className="top-bounty-grid" aria-label="Top five requests by reward">
        {topFiveBounties.map((bounty, index) => (
          <BountySquareCard bounty={bounty} featured={index === 0} key={bounty.id} onDetail={onDetail} rank={index + 1} />
        ))}
      </section>

      <section className="gallery-section" aria-labelledby="more-bounties-title">
        <div className="gallery-section-head">
          <div>
            <h2 id="more-bounties-title">More requests closing soon</h2>
            <p>Fifteen active hunts with real rewards, live submissions, and a 30-day protection window.</p>
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
  const categories = ["All", "Camera gear", "Watches", "Vintage audio", "Gaming", "Portable audio"];
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
          <h1 id="browse-all-title">Browse all bounties</h1>
          <p>Scroll the full bounty board. More cards load as you move down until you reach the end of the current bounty list.</p>
        </div>
        <button className="primary-button" type="button" onClick={onPost}>
          Post a bounty <ArrowRight size={18} />
        </button>
      </section>
      <section className="browse-toolbar" aria-label="Browse filters">
        <div className="search-field">
          <Search size={18} />
          <input placeholder="Search bounties" value={query} onChange={(event) => setQuery(event.target.value)} />
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
          <span>Finder reward</span>
          <button className="primary-button wide-button" type="button" onClick={onSubmit}>
            Submit a find <Send size={18} />
          </button>
          <button className="section-link section-button center-link" type="button" onClick={onPosterProfile}>
            View poster trust page <ArrowRight size={17} />
          </button>
          <div className="timeline-panel">
            <h2>Request timeline</h2>
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

  return (
    <main className="route-page" aria-labelledby="submit-title">
      <section className="two-column-page">
        <div className="form-panel">
          <button className="back-button" type="button" onClick={onBack}>
            <ArrowLeft size={17} /> Request detail
          </button>
          <h1 id="submit-title">Submit a find for {bounty.name}.</h1>
          <p>Give the poster enough proof to review the item quickly and release payment after delivery.</p>
          <label>
            Source or seller link
            <input placeholder="https://..." />
          </label>
          <label>
            Item price
            <input placeholder="Seller asking price" />
          </label>
          <label>
            Proof notes
            <textarea placeholder="Condition, serial proof, authenticity checks, shipping route, seller reliability..." />
          </label>
          <div className="upload-box">
            <Upload size={24} />
            <span>
              <strong>Upload proof</strong>
              Add screenshots, photos, or video evidence.
            </span>
          </div>
          <button className="primary-button" type="button" onClick={() => setSubmitted(true)}>
            Submit find for review
          </button>
          {submitted ? (
            <button className="section-link section-button" type="button" onClick={onDashboard}>
              Go to finder dashboard <ArrowRight size={17} />
            </button>
          ) : null}
        </div>
        <aside className="side-panel">
          <h2>Review checklist</h2>
          <ul className="check-list">
            <li>
              <CheckCircle2 size={18} /> Matches the poster's must-haves
            </li>
            <li>
              <CheckCircle2 size={18} /> Seller can provide proof
            </li>
            <li>
              <CheckCircle2 size={18} /> Delivery path is clear
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
  onBounty,
  onDispute,
  onProfile,
}: {
  onBounty: () => void;
  onDispute: () => void;
  onProfile: () => void;
}) {
  return (
    <main className="route-page dashboard-page" aria-labelledby="poster-dashboard-title">
      <section className="dashboard-head">
        <div>
          <p className="route-kicker">Poster dashboard</p>
          <h1 id="poster-dashboard-title">Review finds and release payment.</h1>
        </div>
        <button className="section-link section-button" type="button" onClick={onProfile}>
          Public trust page <ArrowRight size={17} />
        </button>
      </section>
      <section className="metric-grid">
        <Metric icon={LockKeyhole} label="Escrow funded" value="US$1,280" />
        <Metric icon={MessageSquare} label="Finds awaiting review" value="4" />
        <Metric icon={PackageCheck} label="Deliveries pending" value="2" />
        <Metric icon={CheckCircle2} label="Released this month" value="US$930" />
      </section>
      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h2>Finds to review</h2>
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
          <h3>Fujifilm X100F original cap</h3>
          <p>Finder shared seller photos, packaging proof, and tracked shipping estimate. Item matches all must-have details.</p>
          <div className="action-row">
            <button className="primary-button" type="button">
              Accept and release on delivery
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
          <h1 id="finder-dashboard-title">Track earnings and build reputation.</h1>
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
        <Metric icon={Banknote} label="Available payout" value="US$640" />
        <Metric icon={Star} label="Reputation" value="4.9" />
        <Metric icon={Trophy} label="Successful finds" value="18" />
        <Metric icon={Clock3} label="Pending reviews" value="3" />
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
              <CheckCircle2 size={18} /> 94% proof accepted first review
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
          <p>Use this page when a find, delivery, or proof package does not match the funded request.</p>
          <label>
            Dispute reason
            <select defaultValue="mismatch">
              <option value="mismatch">Item does not match request</option>
              <option value="condition">Condition issue</option>
              <option value="shipping">Shipping or delivery issue</option>
              <option value="payment">Payment release issue</option>
            </select>
          </label>
          <label>
            Evidence summary
            <textarea placeholder="Explain what went wrong and include specific proof references." />
          </label>
          <div className="upload-box">
            <FileText size={24} />
            <span>
              <strong>Attach evidence</strong>
              Receipts, photos, messages, and delivery proof.
            </span>
          </div>
          <button className="danger-button strong-danger" type="button">
            Submit dispute for review
          </button>
        </div>
        <aside className="side-panel dispute-side">
          <h2>Case timeline</h2>
          {["Reward funded", "Find submitted", "Poster requested review", "Evidence due in 48 hours"].map((event) => (
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
        <Metric icon={Trophy} label="Successful finds" value="18" />
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
              <CheckCircle2 size={18} /> Average delivery proof within 1 day
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
          <p>Clear answers for posters, finders, escrow, refunds, disputes, and public browsing.</p>
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
