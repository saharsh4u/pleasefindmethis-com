type AnalyticsValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsValue>;

type DataLayerEvent = {
  event: string;
  [key: string]: unknown;
};

type GoogleAnalyticsContext = {
  ga_client_id?: string;
  ga_session_id?: string;
  page_path?: string;
  referrer_host?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
    gtag?: (...args: unknown[]) => void;
  }
}

const ga4MeasurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID || import.meta.env.VITE_GOOGLE_TAG_ID || "";
const gtmId = import.meta.env.VITE_GTM_ID || "";
const analyticsDebugMode = parseEnvBoolean(import.meta.env.VITE_ANALYTICS_DEBUG_MODE);
const directGtagEventsEnabled = parseEnvBoolean(import.meta.env.VITE_DIRECT_GTAG_EVENTS, !gtmId);
const loadedScriptIds = new Set<string>();
const maxStringLength = 160;

export function initializeGoogleAnalytics() {
  window.dataLayer = window.dataLayer ?? [];

  if (gtmId) {
    loadScriptOnce("google-tag-manager", `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
    window.dataLayer.push({
      event: "gtm.js",
      "gtm.start": Date.now(),
    });
  }

  if (ga4MeasurementId) {
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

  pushDataLayerEvent("page_view", pageViewProperties);

  if (canSendDirectGtagEvents()) {
    window.gtag?.("event", "page_view", pageViewProperties);
  }
}

export function trackMarketingEvent(name: string, properties: AnalyticsProperties = {}) {
  const eventProperties = buildCommonProperties(properties);

  pushDataLayerEvent(name, eventProperties);

  if (canSendDirectGtagEvents()) {
    window.gtag?.("event", name, eventProperties);
  }
}

export function getCheckoutAnalyticsContext(): GoogleAnalyticsContext {
  const utmProperties = getUtmProperties();

  return stripUndefined({
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
  return stripUndefined({
    ...getUtmProperties(),
    ...sanitizeProperties(properties),
    event_id: crypto.randomUUID(),
    page_path: window.location.pathname,
    page_title: document.title,
    referrer_host: getReferrerHost(),
    ...(analyticsDebugMode ? { debug_mode: true } : {}),
  });
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

function getUtmProperties(): AnalyticsProperties {
  const params = new URLSearchParams(window.location.search);

  return stripUndefined({
    utm_source: getSearchParam(params, "utm_source"),
    utm_medium: getSearchParam(params, "utm_medium"),
    utm_campaign: getSearchParam(params, "utm_campaign"),
    utm_content: getSearchParam(params, "utm_content"),
    utm_term: getSearchParam(params, "utm_term"),
  });
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
