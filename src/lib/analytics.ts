import { initDataFast, type CustomProperties, type DataFastWeb } from "datafast";

type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

type UtmKey = "utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term";

type DataLayerEvent = {
  event: string;
  [key: string]: unknown;
};

type AcquisitionAttribution = {
  first_landing_page?: string;
  first_referrer_host?: string;
  first_landed_at?: string;
  first_source?: string;
  first_channel?: string;
  first_utm_source?: string;
  first_utm_medium?: string;
  first_utm_campaign?: string;
  first_utm_content?: string;
  first_utm_term?: string;
  latest_landing_page?: string;
  latest_referrer_host?: string;
  latest_landed_at?: string;
  latest_source?: string;
  latest_channel?: string;
  latest_utm_source?: string;
  latest_utm_medium?: string;
  latest_utm_campaign?: string;
  latest_utm_content?: string;
  latest_utm_term?: string;
};

type GoogleAnalyticsContext = AcquisitionAttribution & {
  datafast_visitor_id?: string;
  ga_client_id?: string;
  ga_session_id?: string;
  page_path?: string;
  referrer_host?: string;
  current_source?: string;
  current_channel?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type StoredAttributionTouch = {
  landing_page?: string;
  referrer_host?: string;
  landed_at?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type StoredAttribution = {
  first?: StoredAttributionTouch;
  latest?: StoredAttributionTouch;
  updated_at?: string;
};

type SimpleEventDefinition = {
  eventName: string;
  whatHappened: string;
  actionType: string;
  buttonName?: string;
  funnelStep?: string;
};

declare global {
  interface Window {
    datafast?: {
      visitorId?: string;
    };
    dataLayer?: DataLayerEvent[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ga4MeasurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID || import.meta.env.VITE_GOOGLE_TAG_ID || "";
const gtmId = import.meta.env.VITE_GTM_ID || "";
const dataFastWebsiteId = import.meta.env.VITE_DATAFAST_WEBSITE_ID || "dfid_oKAGjqAhs9HTD5Ic9yvxt";
const analyticsDebugMode = parseEnvBoolean(import.meta.env.VITE_ANALYTICS_DEBUG_MODE);
const directGtagEventsEnabled = parseEnvBoolean(import.meta.env.VITE_DIRECT_GTAG_EVENTS, !gtmId);
const directSimpleGtagEventsEnabled = parseEnvBoolean(import.meta.env.VITE_SIMPLE_DIRECT_GTAG_EVENTS, true);
const loadedScriptIds = new Set<string>();
const maxStringLength = 160;
const attributionStorageKey = "pleasefindmethis-attribution-v1";
const attributionMaxAgeMs = 90 * 24 * 60 * 60 * 1000;
const utmKeys: UtmKey[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
const simpleEventDefinitions: Record<string, SimpleEventDefinition> = {
  landing_view: {
    eventName: "user_viewed_homepage",
    whatHappened: "User viewed the homepage",
    actionType: "page_view",
  },
  starter_link_viewed: {
    eventName: "user_opened_prefilled_link",
    whatHappened: "User opened a link that prefilled the request form",
    actionType: "link_open",
    funnelStep: "prefilled_request",
  },
  start_request: {
    eventName: "user_clicked_start_request",
    whatHappened: "User clicked a button to start a request",
    actionType: "button_click",
    buttonName: "Start request",
    funnelStep: "start_request",
  },
  signup_code_requested: {
    eventName: "user_requested_signup_code",
    whatHappened: "User asked for a signup code",
    actionType: "form_submit",
    buttonName: "Send signup code",
    funnelStep: "signup_code",
  },
  login_code_requested: {
    eventName: "user_requested_login_code",
    whatHappened: "User asked for a login code",
    actionType: "form_submit",
    buttonName: "Send login code",
    funnelStep: "login_code",
  },
  auth_completed: {
    eventName: "user_signed_in",
    whatHappened: "User signed in",
    actionType: "login",
    funnelStep: "signed_in",
  },
  category_selected: {
    eventName: "user_chose_item_category",
    whatHappened: "User chose an item category",
    actionType: "form_change",
    funnelStep: "describe_request",
  },
  upload_reference_image: {
    eventName: "user_added_photo",
    whatHappened: "User added a reference photo",
    actionType: "file_upload",
    buttonName: "Add reference images",
    funnelStep: "describe_request",
  },
  post_describe_completed: {
    eventName: "user_completed_item_details",
    whatHappened: "User completed the item details step",
    actionType: "form_step",
    buttonName: "Continue",
    funnelStep: "item_details_done",
  },
  choose_visibility: {
    eventName: "user_chose_request_visibility",
    whatHappened: "User chose request visibility",
    actionType: "form_step",
    buttonName: "Continue",
    funnelStep: "visibility_chosen",
  },
  publish_request_started: {
    eventName: "user_started_free_request_publish",
    whatHappened: "User started publishing a free request",
    actionType: "button_click",
    buttonName: "Publish free request",
    funnelStep: "publish_started",
  },
  request_published: {
    eventName: "user_published_free_request",
    whatHappened: "User published a free request",
    actionType: "form_submit",
    buttonName: "Publish free request",
    funnelStep: "request_published",
  },
  request_publish_failed: {
    eventName: "free_request_publish_failed",
    whatHappened: "Free request publishing failed",
    actionType: "error",
    funnelStep: "publish_error",
  },
  checkout_started: {
    eventName: "user_started_checkout",
    whatHappened: "User clicked the checkout button",
    actionType: "button_click",
    buttonName: "Start checkout",
    funnelStep: "checkout_started",
  },
  checkout_redirected: {
    eventName: "user_went_to_payment",
    whatHappened: "User was sent to the payment page",
    actionType: "redirect",
    funnelStep: "payment_redirect",
  },
  checkout_failed: {
    eventName: "checkout_did_not_start",
    whatHappened: "Checkout did not start",
    actionType: "error",
    funnelStep: "checkout_error",
  },
  submit_source: {
    eventName: "helper_submitted_source_suggestion",
    whatHappened: "Helper submitted a source suggestion",
    actionType: "form_submit",
    buttonName: "Share source suggestion",
    funnelStep: "source_submitted",
  },
  source_revealed: {
    eventName: "requester_opened_source_details",
    whatHappened: "Requester opened source details",
    actionType: "button_click",
    buttonName: "Open source details",
    funnelStep: "source_details_opened",
  },
  source_accepted: {
    eventName: "requester_marked_source_useful",
    whatHappened: "Requester marked a source useful",
    actionType: "button_click",
    buttonName: "Mark useful",
    funnelStep: "source_accepted",
  },
  source_sent_to_review: {
    eventName: "requester_sent_source_to_review",
    whatHappened: "Requester sent a source to review",
    actionType: "button_click",
    buttonName: "Send to review",
    funnelStep: "source_review",
  },
};
let attributionCapturedForPage = false;
let dataFastClientPromise: Promise<DataFastWeb | null> | null = null;

export function initializeGoogleAnalytics() {
  captureAttribution();
  initializeDataFast();
  window.dataLayer = window.dataLayer ?? [];

  if (gtmId) {
    window.dataLayer.push({
      event: "gtm.js",
      "gtm.start": Date.now(),
    });
    loadScriptOnce("google-tag-manager", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
  }

  if (ga4MeasurementId && (directGtagEventsEnabled || directSimpleGtagEventsEnabled)) {
    window.gtag =
      window.gtag ??
      function gtag(...args: unknown[]) {
        window.dataLayer = window.dataLayer ?? [];
        window.dataLayer.push(args as unknown as DataLayerEvent);
      };

    loadScriptOnce("google-tag", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4MeasurementId)}`);
    window.gtag("js", new Date());
    window.gtag("config", ga4MeasurementId, {
      send_page_view: false,
      ...(analyticsDebugMode ? { debug_mode: true } : {}),
    });
  }
}

export function trackPageView(properties: AnalyticsProperties = {}) {
  const commonProperties = buildCommonProperties(properties);
  const pageViewProperties = {
    ...commonProperties,
    page_title: document.title,
    page_location: `${window.location.origin}${window.location.pathname}`,
    page_referrer: document.referrer || undefined,
  };

  sendAnalyticsEvent("page_view", pageViewProperties);
  sendDataFastPageView();
  sendSimplePageViewEvent(pageViewProperties);
}

export function trackMarketingEvent(name: string, properties: AnalyticsProperties = {}) {
  const eventProperties = buildCommonProperties(properties);

  sendAnalyticsEvent(name, eventProperties);
  sendDataFastEvent(name, eventProperties);
  sendSimpleMarketingEvent(name, eventProperties);
}

export async function getCheckoutAnalyticsContext(): Promise<GoogleAnalyticsContext> {
  const utmProperties = getUtmProperties();
  const attributionProperties = getAttributionProperties();
  const readableProperties = getReadableSourceProperties(attributionProperties, utmProperties);
  const dataFastVisitorId = await getDataFastVisitorId();

  return stripUndefined({
    ...attributionProperties,
    ...readableProperties,
    datafast_visitor_id: dataFastVisitorId,
    ga_client_id: getGaClientId(),
    ga_session_id: getGaSessionId(),
    page_path: window.location.pathname,
    referrer_host: getReferrerHost(),
    utm_source: utmProperties.utm_source,
    utm_medium: utmProperties.utm_medium,
    utm_campaign: utmProperties.utm_campaign,
    utm_content: utmProperties.utm_content,
    utm_term: utmProperties.utm_term,
  });
}

function buildCommonProperties(properties: AnalyticsProperties) {
  const attributionProperties = getAttributionProperties();
  const utmProperties = getUtmProperties();
  const readableProperties = getReadableSourceProperties(attributionProperties, utmProperties);

  return stripUndefined({
    ...attributionProperties,
    ...readableProperties,
    ...utmProperties,
    ...sanitizeProperties(properties),
    event_id: crypto.randomUUID(),
    page_path: window.location.pathname,
    page_title: document.title,
    referrer_host: getReferrerHost(),
    ...(analyticsDebugMode ? { debug_mode: true } : {}),
  });
}

function getReadableSourceProperties(attribution: AcquisitionAttribution, utmProperties: Partial<Record<UtmKey, string>>) {
  return stripUndefined({
    current_source: getReadableSource(utmProperties.utm_source, getReferrerHost()),
    current_channel: getReadableChannel(utmProperties.utm_source, getReferrerHost()),
    first_source: getReadableSource(attribution.first_utm_source, attribution.first_referrer_host),
    first_channel: getReadableChannel(attribution.first_utm_source, attribution.first_referrer_host),
    latest_source: getReadableSource(attribution.latest_utm_source, attribution.latest_referrer_host),
    latest_channel: getReadableChannel(attribution.latest_utm_source, attribution.latest_referrer_host),
  });
}

function getReadableSource(utmSource?: string, referrerHost?: string) {
  if (utmSource) {
    return sanitizeReadableValue(utmSource);
  }

  if (referrerHost) {
    return sanitizeReadableValue(referrerHost);
  }

  return "direct";
}

function getReadableChannel(utmSource?: string, referrerHost?: string) {
  const combined = `${utmSource ?? ""} ${referrerHost ?? ""}`.toLowerCase();

  if (!combined.trim()) {
    return "Direct";
  }

  if (combined.includes("reddit")) {
    return "Reddit";
  }

  if (combined.includes("google")) {
    return "Google";
  }

  if (combined.includes("bing")) {
    return "Bing";
  }

  if (combined.includes("pinterest")) {
    return "Pinterest";
  }

  if (combined.includes("tiktok")) {
    return "TikTok";
  }

  if (combined.includes("instagram")) {
    return "Instagram";
  }

  if (combined.includes("facebook") || combined.includes("fb.")) {
    return "Facebook";
  }

  if (combined.includes("youtube") || combined.includes("youtu.be")) {
    return "YouTube";
  }

  if (combined.includes("twitter") || combined.includes("x.com") || combined.includes("t.co")) {
    return "X / Twitter";
  }

  if (combined.includes("linkedin")) {
    return "LinkedIn";
  }

  if (combined.includes("newsletter") || combined.includes("email")) {
    return "Email";
  }

  return titleCaseReadableSource(utmSource || referrerHost || "Other");
}

function titleCaseReadableSource(value: string) {
  return sanitizeReadableValue(value)
    .replace(/\.[a-z]{2,}$/i, "")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ") || "Other";
}

function sanitizeReadableValue(value: string) {
  return value.replace(/^www\./i, "").trim().slice(0, maxStringLength);
}

function getReadablePageName(route: unknown, pageTitle: unknown) {
  if (typeof route === "string" && route.trim()) {
    return titleCaseReadableSource(route.replace(/-/g, " "));
  }

  if (typeof pageTitle === "string" && pageTitle.trim()) {
    return pageTitle.split("|")[0].trim().slice(0, maxStringLength);
  }

  return "Current page";
}

function sendAnalyticsEvent(name: string, properties: AnalyticsProperties, options: { sendDirect?: boolean } = {}) {
  pushDataLayerEvent(name, properties);

  const shouldSendDirect = options.sendDirect ?? canSendDirectGtagEvents();

  if (shouldSendDirect) {
    window.gtag?.("event", name, properties);
  }
}

function sendSimplePageViewEvent(properties: AnalyticsProperties) {
  const pageName = getReadablePageName(properties.route, properties.page_title);
  sendAnalyticsEvent("user_went_to_page", stripUndefined({
    ...properties,
    simple_event: "user_went_to_page",
    original_event: "page_view",
    what_happened: `User went to ${pageName}`,
    action_type: "page_view",
    page_name: pageName,
  }), { sendDirect: canSendDirectSimpleGtagEvents() });
}

function sendSimpleMarketingEvent(name: string, properties: AnalyticsProperties) {
  const definition = simpleEventDefinitions[name];

  if (!definition) {
    return;
  }

  sendAnalyticsEvent(definition.eventName, stripUndefined({
    ...properties,
    simple_event: definition.eventName,
    original_event: name,
    what_happened: definition.whatHappened,
    action_type: definition.actionType,
    button_name: definition.buttonName,
    funnel_step: definition.funnelStep,
    page_name: getReadablePageName(properties.route, properties.page_title),
  }), { sendDirect: canSendDirectSimpleGtagEvents() });
}

function initializeDataFast() {
  if (!dataFastWebsiteId || dataFastClientPromise) {
    return dataFastClientPromise;
  }

  dataFastClientPromise = initDataFast({
    websiteId: dataFastWebsiteId,
    autoCapturePageviews: false,
    debug: analyticsDebugMode,
  }).catch((error: unknown) => {
    if (analyticsDebugMode) {
      console.warn("[Analytics] DataFast initialization failed", error);
    }

    return null;
  });

  return dataFastClientPromise;
}

function sendDataFastPageView() {
  void initializeDataFast()?.then((client) => client?.trackPageview()).catch((error) => {
    if (analyticsDebugMode) {
      console.warn("[Analytics] DataFast pageview failed", error);
    }
  });
}

function sendDataFastEvent(name: string, properties: AnalyticsProperties) {
  const eventName = toDataFastEventName(name);

  if (!eventName) {
    return;
  }

  void initializeDataFast()?.then((client) => client?.track(eventName, toDataFastProperties(properties))).catch((error) => {
    if (analyticsDebugMode) {
      console.warn("[Analytics] DataFast event failed", error);
    }
  });
}

async function getDataFastVisitorId() {
  const cookieVisitorId = getCookie("datafast_visitor_id");

  if (cookieVisitorId) {
    return cookieVisitorId.slice(0, maxStringLength);
  }

  const client = await initializeDataFast();
  const clientVisitorId = client?.getVisitorId?.();

  if (clientVisitorId) {
    return clientVisitorId.slice(0, maxStringLength);
  }

  const windowVisitorId = typeof window.datafast?.visitorId === "string" ? window.datafast.visitorId.trim() : "";
  return windowVisitorId ? windowVisitorId.slice(0, maxStringLength) : undefined;
}

function toDataFastEventName(name: string) {
  const normalized = name.trim().toLowerCase().replace(/[^a-z0-9_:-]+/g, "_").slice(0, 64);
  return normalized || null;
}

function toDataFastProperties(properties: AnalyticsProperties): CustomProperties {
  const selected: CustomProperties = {};
  const priorityKeys = [
    "route",
    "page_path",
    "page_title",
    "signed_in",
    "category",
    "bounty_id",
    "request_id",
    "source_type",
    "reward",
    "total_due",
    "current_channel",
    "current_source",
    "utm_source",
    "utm_medium",
    "utm_campaign",
  ];

  for (const key of priorityKeys) {
    addDataFastProperty(selected, key, properties[key]);
  }

  for (const [key, value] of Object.entries(properties)) {
    if (Object.keys(selected).length >= 10) {
      break;
    }

    addDataFastProperty(selected, key, value);
  }

  return selected;
}

function addDataFastProperty(properties: CustomProperties, key: string, value: AnalyticsValue) {
  if (Object.keys(properties).length >= 10 || value === null || value === undefined) {
    return;
  }

  const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").slice(0, 64);

  if (!normalizedKey || properties[normalizedKey] !== undefined) {
    return;
  }

  if (typeof value === "string") {
    properties[normalizedKey] = value.slice(0, 255);
    return;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    properties[normalizedKey] = value;
    return;
  }

  if (typeof value === "boolean") {
    properties[normalizedKey] = value;
  }
}

function pushDataLayerEvent(name: string, properties: AnalyticsProperties) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event: name,
    ...properties,
  });
}

function canSendDirectGtagEvents() {
  return Boolean(ga4MeasurementId && directGtagEventsEnabled);
}

function canSendDirectSimpleGtagEvents() {
  return Boolean(ga4MeasurementId && directSimpleGtagEventsEnabled);
}

function loadScriptOnce(id: string, src: string) {
  if (loadedScriptIds.has(id) || document.getElementById(id)) {
    return;
  }

  loadedScriptIds.add(id);
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function sanitizeProperties(properties: AnalyticsProperties): AnalyticsProperties {
  const sanitized: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(key) || value === undefined) {
      continue;
    }

    if (typeof value === "string") {
      sanitized[key] = value.slice(0, maxStringLength);
      continue;
    }

    if (typeof value === "number") {
      if (Number.isFinite(value)) {
        sanitized[key] = value;
      }
      continue;
    }

    if (typeof value === "boolean" || value === null) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function getUtmProperties(): Partial<Record<UtmKey, string>> {
  const params = new URLSearchParams(window.location.search);

  return stripUndefined({
    utm_source: getSearchParam(params, "utm_source"),
    utm_medium: getSearchParam(params, "utm_medium"),
    utm_campaign: getSearchParam(params, "utm_campaign"),
    utm_content: getSearchParam(params, "utm_content"),
    utm_term: getSearchParam(params, "utm_term"),
  });
}

function getAttributionProperties(): AcquisitionAttribution {
  const attribution = captureAttribution();

  return stripUndefined({
    ...prefixAttributionTouch("first", attribution.first),
    ...prefixAttributionTouch("latest", attribution.latest),
  });
}

function captureAttribution(): StoredAttribution {
  const currentTouch = getCurrentAttributionTouch();

  try {
    const now = Date.now();
    const existingAttribution = readStoredAttribution();
    const stored = isAttributionExpired(existingAttribution, now) ? {} : existingAttribution;
    const shouldUpdateLatest = !attributionCapturedForPage && (hasUtmProperties(currentTouch) || Boolean(currentTouch.referrer_host));
    const next: StoredAttribution = {
      first: stored.first ?? currentTouch,
      latest: stored.latest ?? currentTouch,
      updated_at: new Date(now).toISOString(),
    };

    if (shouldUpdateLatest) {
      next.latest = currentTouch;
    }

    attributionCapturedForPage = true;
    window.localStorage.setItem(attributionStorageKey, JSON.stringify(next));
    return next;
  } catch {
    attributionCapturedForPage = true;
    return {
      first: currentTouch,
      latest: currentTouch,
    };
  }
}

function readStoredAttribution(): StoredAttribution {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(attributionStorageKey) || "null");

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const record = parsed as Record<string, unknown>;
    const first = sanitizeStoredAttributionTouch(record.first);
    const latest = sanitizeStoredAttributionTouch(record.latest);
    const updatedAt = sanitizeAttributionString(record.updated_at);

    return {
      ...(first ? { first } : {}),
      ...(latest ? { latest } : {}),
      ...(updatedAt ? { updated_at: updatedAt } : {}),
    };
  } catch {
    return {};
  }
}

function getCurrentAttributionTouch(): StoredAttributionTouch {
  const utmProperties = getUtmProperties();

  return stripUndefined({
    landing_page: window.location.pathname,
    referrer_host: getExternalReferrerHost(),
    landed_at: new Date().toISOString(),
    utm_source: utmProperties.utm_source,
    utm_medium: utmProperties.utm_medium,
    utm_campaign: utmProperties.utm_campaign,
    utm_content: utmProperties.utm_content,
    utm_term: utmProperties.utm_term,
  });
}

function sanitizeStoredAttributionTouch(value: unknown): StoredAttributionTouch | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const touch = stripUndefined({
    landing_page: sanitizeAttributionString(record.landing_page),
    referrer_host: sanitizeAttributionString(record.referrer_host),
    landed_at: sanitizeAttributionString(record.landed_at),
    utm_source: sanitizeAttributionString(record.utm_source),
    utm_medium: sanitizeAttributionString(record.utm_medium),
    utm_campaign: sanitizeAttributionString(record.utm_campaign),
    utm_content: sanitizeAttributionString(record.utm_content),
    utm_term: sanitizeAttributionString(record.utm_term),
  });

  return Object.keys(touch).length ? touch : undefined;
}

function prefixAttributionTouch(prefix: "first" | "latest", touch?: StoredAttributionTouch): AcquisitionAttribution {
  if (!touch) {
    return {};
  }

  if (prefix === "first") {
    return stripUndefined({
      first_landing_page: touch.landing_page,
      first_referrer_host: touch.referrer_host,
      first_landed_at: touch.landed_at,
      first_utm_source: touch.utm_source,
      first_utm_medium: touch.utm_medium,
      first_utm_campaign: touch.utm_campaign,
      first_utm_content: touch.utm_content,
      first_utm_term: touch.utm_term,
    });
  }

  return stripUndefined({
    latest_landing_page: touch.landing_page,
    latest_referrer_host: touch.referrer_host,
    latest_landed_at: touch.landed_at,
    latest_utm_source: touch.utm_source,
    latest_utm_medium: touch.utm_medium,
    latest_utm_campaign: touch.utm_campaign,
    latest_utm_content: touch.utm_content,
    latest_utm_term: touch.utm_term,
  });
}

function isAttributionExpired(attribution: StoredAttribution, now: number) {
  if (!attribution.updated_at) {
    return false;
  }

  const updatedAt = Date.parse(attribution.updated_at);
  return Number.isFinite(updatedAt) && now - updatedAt > attributionMaxAgeMs;
}

function hasUtmProperties(touch: StoredAttributionTouch) {
  return utmKeys.some((key) => Boolean(touch[key]));
}

function sanitizeAttributionString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxStringLength) : undefined;
}

function getSearchParam(params: URLSearchParams, key: string) {
  const value = params.get(key)?.trim();
  return value ? value.slice(0, maxStringLength) : undefined;
}

function getGaClientId() {
  const value = getCookie("_ga");
  const match = value.match(/^GA\d+\.\d+\.(.+)$/);
  return match?.[1] || undefined;
}

function getGaSessionId() {
  if (!ga4MeasurementId.startsWith("G-")) {
    return undefined;
  }

  const streamCookie = getCookie(`_ga_${ga4MeasurementId.slice(2)}`);
  const gs2Match = streamCookie.match(/[.$]s(\d+)/);

  if (gs2Match?.[1]) {
    return gs2Match[1];
  }

  const parts = streamCookie.split(".");
  const gs1SessionId = parts[2];
  return /^\d+$/.test(gs1SessionId) ? gs1SessionId : undefined;
}

function getCookie(name: string) {
  const encodedName = `${encodeURIComponent(name)}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(encodedName));

  return entry ? decodeURIComponent(entry.slice(encodedName.length)) : "";
}

function getReferrerHost() {
  if (!document.referrer) {
    return undefined;
  }

  try {
    return new URL(document.referrer).hostname.slice(0, maxStringLength);
  } catch {
    return undefined;
  }
}

function getExternalReferrerHost() {
  const referrerHost = getReferrerHost();

  if (!referrerHost) {
    return undefined;
  }

  return normalizeHost(referrerHost) === normalizeHost(window.location.hostname) ? undefined : referrerHost;
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function stripUndefined<T extends Record<string, AnalyticsValue>>(properties: T) {
  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined)) as T;
}

function parseEnvBoolean(value: string | boolean | undefined, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
