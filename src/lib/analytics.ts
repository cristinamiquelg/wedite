// Client side of Wedite's first-party analytics. Cookieless: events carry a
// random id that lives in this tab's sessionStorage only, so there is nothing
// persistent on the device and no IP or user agent is stored (see
// supabase/migrations/20261003000002_analytics.sql).

export const EVENT_NAMES = ["page_view", "wizard_step", "checkout_submit"] as const;
export type EventName = (typeof EVENT_NAMES)[number];

export const SESSION_ID_PATTERN = /^[a-z0-9]{8,40}$/;

// Set from the private dashboard so your own visits don't count.
export const OPT_OUT_KEY = "wedite:no-track";

const SESSION_KEY = "wedite:sid";

function sessionId(): string | null {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("");
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function optedOut(): boolean {
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

function device(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  return w < 640 ? "mobile" : w < 1024 ? "tablet" : "desktop";
}

// The template a path is about, so the dashboard can break the funnel down by
// design: /plantillas/ribera, /personalizar/ribera/..., /preview/ribera/...
function templateFromPath(path: string): string | null {
  const m = path.match(/^\/(?:plantillas|personalizar|preview)\/([^/]+)/);
  return m ? m[1] : null;
}

let lastPath: string | null = null;

export function trackEvent(name: EventName, extra: { props?: Record<string, string | number | boolean>; template?: string | null } = {}) {
  if (typeof window === "undefined") return;
  // The wizard's live preview is an iframe of the site; counting it would
  // double every visit.
  if (window.self !== window.top) return;
  if (optedOut()) return;
  const sid = sessionId();
  if (!sid) return;

  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const body = {
    name,
    sid,
    path,
    referrer: name === "page_view" ? document.referrer || null : null,
    utm: name === "page_view"
      ? { source: params.get("utm_source"), medium: params.get("utm_medium"), campaign: params.get("utm_campaign") }
      : null,
    locale: document.documentElement.lang || null,
    device: device(),
    template: extra.template ?? templateFromPath(path) ?? params.get("slug"),
    props: extra.props ?? {},
  };

  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // analytics must never break the page
  }
}

// One page_view per navigation (React strict mode / re-renders can call twice).
export function trackPageView(path: string) {
  if (path === lastPath) return;
  lastPath = path;
  trackEvent("page_view");
}
