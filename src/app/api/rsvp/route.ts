import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const CLIENT_REF_RE = /^[A-Za-z0-9_-]{8,64}$/;
const MAX_COMPANIONS = 12;
// Per site and per (hashed) IP: this many submissions in the window, then 429.
const LIMIT = 8;
const WINDOW_MINUTES = 10;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function yesNo(value: unknown): boolean | null {
  return value === true || value === "si" ? true : value === false || value === "no" ? false : null;
}

// Receives a guest's RSVP from a couple's published site. The IP is only used to
// rate-limit abuse and is stored as a salted hash, never as such.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 40_000) return NextResponse.json({ error: "too_large" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const slug = text(body.slug, 40);
  const firstName = text(body.firstName, 80);
  const lastName = text(body.lastName, 80);
  const email = text(body.email, 254);
  const phone = text(body.phone, 30);
  const clientRef = typeof body.clientRef === "string" && CLIENT_REF_RE.test(body.clientRef) ? body.clientRef : null;
  const attending = yesNo(body.attending);
  if (!slug || !firstName || !lastName || attending === null || (email && !EMAIL_RE.test(email))) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const companions = (Array.isArray(body.companions) ? body.companions : [])
    .slice(0, MAX_COMPANIONS)
    .map((c) => {
      const o = (c && typeof c === "object" ? c : {}) as Record<string, unknown>;
      return {
        first_name: text(o.firstName, 80),
        last_name: text(o.lastName, 80),
        kid: o.kid === true,
        bus: yesNo(o.bus),
        dietary: text(o.dietary, 300),
      };
    })
    .filter((c) => c.first_name);

  try {
    const db = supabaseAdmin();
    const { data: site } = await db.from("sites").select("id").eq("slug", slug).eq("status", "published").maybeSingle();
    if (!site) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const ipHash = createHash("sha256").update(`${process.env.RSVP_IP_SALT ?? "wedite-rsvp"}|${slug}|${ip}`).digest("hex");
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await db
      .from("rsvps")
      .select("id", { head: true, count: "exact" })
      .eq("site_id", site.id)
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if ((count ?? 0) >= LIMIT) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const row = {
      site_id: site.id,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email: email || null,
      attending,
      bus: attending ? yesNo(body.bus) : null,
      dietary: attending ? text(body.dietary, 300) || null : null,
      companions: attending ? companions : [],
      guests: attending ? 1 + companions.length : 1,
      locale: body.locale === "en" ? "en" : "es",
      ip_hash: ipHash,
      client_ref: clientRef,
    };
    // A guest who edits and resubmits from the same tab updates their answer.
    const { error } = clientRef
      ? await db.from("rsvps").upsert(row, { onConflict: "site_id,client_ref" })
      : await db.from("rsvps").insert(row);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("rsvp: could not save", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
