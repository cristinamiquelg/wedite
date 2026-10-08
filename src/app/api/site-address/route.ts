import { NextResponse, type NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isReservedSlug, isValidCustomSlug } from "@/lib/site-address";
import { firstAvailableSuggestion, isSlugAvailable } from "@/lib/site-slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort limit per instance: this endpoint tells whether an address is taken,
// so it should not be usable to list every couple's address.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMIT = 40;
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT;
}

// GET /api/site-address?a=Elena&b=Juan&date=2027-06-12[&email=...]
//   -> { suggestion: "elenayjuan" | null }
// GET /api/site-address?slug=miboda[&email=...]
//   -> { available: boolean, reason?: "invalid" | "reserved" | "taken" }
// `email` (optional) is the buyer's: their own earlier unpaid address counts as free for them.
export async function GET(request: NextRequest) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const params = request.nextUrl.searchParams;
  const db = supabaseAdmin();
  const slug = params.get("slug");
  const emailParam = (params.get("email") ?? "").trim().slice(0, 254);
  const email = EMAIL_RE.test(emailParam) ? emailParam : undefined;

  if (slug !== null) {
    const value = slug.trim().toLowerCase();
    if (isReservedSlug(value)) return NextResponse.json({ available: false, reason: "reserved" });
    if (!isValidCustomSlug(value)) return NextResponse.json({ available: false, reason: "invalid" });
    const available = await isSlugAvailable(db, value, email);
    return NextResponse.json(available ? { available: true } : { available: false, reason: "taken" });
  }

  const a = (params.get("a") ?? "").slice(0, 80);
  const b = (params.get("b") ?? "").slice(0, 80);
  const date = (params.get("date") ?? "").slice(0, 10);
  const suggestion = await firstAvailableSuggestion(db, a, b, date, email);
  return NextResponse.json({ suggestion });
}
