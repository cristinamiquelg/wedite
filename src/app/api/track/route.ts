import { NextResponse, type NextRequest } from "next/server";
import { EVENT_NAMES, SESSION_ID_PATTERN } from "@/lib/analytics";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|node-fetch|axios/i;
const DEVICES = new Set(["mobile", "tablet", "desktop"]);

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim().slice(0, max);
  return v || null;
}

function referrerHost(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    return new URL(value).hostname.replace(/^www\./, "").slice(0, 120) || null;
  } catch {
    return null;
  }
}

// Props are free-form on the client; keep only a few small scalars.
function cleanProps(value: unknown): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  if (!value || typeof value !== "object") return out;
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 8)) {
    if (typeof v === "string") out[k.slice(0, 30)] = v.slice(0, 80);
    else if (typeof v === "number" || typeof v === "boolean") out[k.slice(0, 30)] = v;
  }
  return out;
}

// Receives usage events from the browser. Always answers 204 (even when the
// event is dropped or the database is down) so tracking can never surface an
// error to a visitor. Stores no IP and no user agent.
export async function POST(request: NextRequest) {
  const drop = new NextResponse(null, { status: 204 });
  try {
    if (BOT_UA.test(request.headers.get("user-agent") ?? "")) return drop;

    const raw = await request.text();
    if (raw.length > 4000) return drop;
    const body = JSON.parse(raw) as Record<string, unknown>;

    const name = body.name;
    const sid = body.sid;
    if (typeof name !== "string" || !(EVENT_NAMES as readonly string[]).includes(name)) return drop;
    if (typeof sid !== "string" || !SESSION_ID_PATTERN.test(sid)) return drop;

    const utm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;
    const device = typeof body.device === "string" && DEVICES.has(body.device) ? body.device : null;
    const country = request.headers.get("x-vercel-ip-country");

    await supabaseAdmin()
      .from("events")
      .insert({
        name,
        session_id: sid,
        path: clip(body.path, 300),
        referrer_host: referrerHost(body.referrer),
        utm_source: clip(utm.source, 80),
        utm_medium: clip(utm.medium, 80),
        utm_campaign: clip(utm.campaign, 80),
        locale: clip(body.locale, 10),
        device,
        country: country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : null,
        template_slug: clip(body.template, 60),
        props: cleanProps(body.props),
      });
  } catch {
    // swallow: see above
  }
  return drop;
}
