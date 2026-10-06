import "server-only";
import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Access code for the private responses page. The link carries a secret token;
// the code is a second thing the couple types the first time they open it, so a
// link that leaks on its own (history, a screenshot) doesn't show the answers.
// Only the code's hash is stored. Note it travels in the same email as the link:
// it protects against the link leaking alone, not against forwarding the email.

// No 0/O, 1/I/L: the code is read from an email and typed by hand.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const SESSION_COOKIE = "wd_resp";
const SESSION_DAYS = 30;
const MAX_FAILS_PER_IP = 5; // per 15 minutes
const MAX_FAILS_PER_SITE = 25; // per hour, whoever is trying

/** A readable code such as K7PX-4M9Q (shown with the dash, stored without). */
export function generateAccessCode(): string {
  const pick = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick()}-${pick()}`;
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashCode(code: string): string {
  return createHash("sha256").update(`wedite-responses|${normalizeCode(code)}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

// The session value is "<expiry ms>.<hmac>", keyed with the stored code hash:
// it can't be forged without the database, and rotating the code ends sessions.
function sign(codeHash: string, expiry: string): string {
  return createHmac("sha256", codeHash).update(`responses-session:${expiry}`).digest("hex");
}

export async function hasResponsesSession(token: string, codeHash: string): Promise<boolean> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return false;
  const [expiry, signature] = value.split(".");
  if (!expiry || !signature || !/^\d+$/.test(expiry) || Number(expiry) < Date.now()) return false;
  return safeEqual(signature, sign(codeHash, expiry));
}

export async function startResponsesSession(token: string, codeHash: string): Promise<void> {
  const expiry = String(Date.now() + SESSION_DAYS * 86_400_000);
  (await cookies()).set(SESSION_COOKIE, `${expiry}.${sign(codeHash, expiry)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Scoped to this one page and its CSV: never sent anywhere else.
    path: `/respuestas/${token}`,
    maxAge: SESSION_DAYS * 86_400,
  });
}

async function callerHash(siteId: string): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`responses|${siteId}|${ip}`).digest("hex");
}

export async function isLockedOut(siteId: string): Promise<boolean> {
  try {
    const db = supabaseAdmin();
    const quarter = new Date(Date.now() - 15 * 60_000).toISOString();
    const hour = new Date(Date.now() - 60 * 60_000).toISOString();
    const [perIp, perSite] = await Promise.all([
      db
        .from("responses_access_attempts")
        .select("id", { head: true, count: "exact" })
        .eq("site_id", siteId)
        .eq("ip_hash", await callerHash(siteId))
        .gte("created_at", quarter),
      db.from("responses_access_attempts").select("id", { head: true, count: "exact" }).eq("site_id", siteId).gte("created_at", hour),
    ]);
    return (perIp.count ?? 0) >= MAX_FAILS_PER_IP || (perSite.count ?? 0) >= MAX_FAILS_PER_SITE;
  } catch {
    // If the limit can't be checked, fail closed: no code guessing.
    return true;
  }
}

export async function recordFailedAttempt(siteId: string): Promise<void> {
  try {
    await supabaseAdmin().from("responses_access_attempts").insert({ site_id: siteId, ip_hash: await callerHash(siteId) });
  } catch {
    // isLockedOut fails closed when the database is unreachable
  }
}
