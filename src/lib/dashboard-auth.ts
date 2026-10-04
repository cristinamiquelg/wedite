import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { isStagingEnv } from "@/lib/environment";
import { supabaseAdmin } from "@/lib/supabase/admin";

// The private analytics dashboard has two independent secrets, both set as
// environment variables (never in the repo):
//   DASHBOARD_PATH_TOKEN  the unguessable segment of the URL: /ops/<token>
//   DASHBOARD_PASSWORD    asked once per session on that page
// A wrong token is indistinguishable from any other missing page (404).
// On staging the password is optional: the whole deployment is already behind
// the staging password, so the token alone is enough there. Production always
// requires both.

const SESSION_COOKIE = "wd_ops";
const SESSION_HOURS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MINUTES = 15;

export function dashboardConfig(): { token: string; password: string | null } | null {
  const token = process.env.DASHBOARD_PATH_TOKEN;
  const password = process.env.DASHBOARD_PASSWORD || null;
  // A short token would be guessable; refuse to run with one.
  if (!token || token.length < 24) return null;
  if (!password && !isStagingEnv()) return null;
  return { token, password };
}

/** True when the dashboard has no password of its own (staging only). */
export function dashboardIsPasswordless(): boolean {
  const config = dashboardConfig();
  return config !== null && config.password === null;
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function tokenMatches(candidate: string): boolean {
  const config = dashboardConfig();
  return config !== null && safeEqual(candidate, config.token);
}

export function passwordMatches(candidate: string): boolean {
  const config = dashboardConfig();
  return config !== null && config.password !== null && safeEqual(candidate, config.password);
}

// Session value: "<expiry ms>.<hmac>". The key mixes the password and the
// token, so changing either one signs everybody out.
function sign(expiry: string): string {
  const config = dashboardConfig();
  if (!config) return "";
  return createHmac("sha256", `${config.password ?? ""}\n${config.token}`).update(`ops-session:${expiry}`).digest("hex");
}

export async function hasDashboardSession(): Promise<boolean> {
  if (dashboardIsPasswordless()) return true;
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return false;
  const [expiry, signature] = value.split(".");
  if (!expiry || !signature || !/^\d+$/.test(expiry)) return false;
  if (Number(expiry) < Date.now()) return false;
  return safeEqual(signature, sign(expiry));
}

export async function startDashboardSession(token: string): Promise<void> {
  const expiry = String(Date.now() + SESSION_HOURS * 3600_000);
  (await cookies()).set(SESSION_COOKIE, `${expiry}.${sign(expiry)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // Scoped to the dashboard only: never sent to the rest of the site.
    path: `/ops/${token}`,
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endDashboardSession(token: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { path: `/ops/${token}`, maxAge: 0 });
}

// --- brute-force throttle: failed attempts per (salted) IP hash, in the DB ---

async function callerHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const salt = dashboardConfig()?.token ?? "";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

export async function isLockedOut(): Promise<boolean> {
  try {
    const since = new Date(Date.now() - ATTEMPT_WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await supabaseAdmin()
      .from("dashboard_login_attempts")
      .select("id", { head: true, count: "exact" })
      .eq("ip_hash", await callerHash())
      .gte("created_at", since);
    return (count ?? 0) >= MAX_FAILED_ATTEMPTS;
  } catch {
    // If the throttle can't be checked, fail closed: no password guessing.
    return true;
  }
}

export async function recordFailedAttempt(): Promise<void> {
  try {
    await supabaseAdmin().from("dashboard_login_attempts").insert({ ip_hash: await callerHash() });
  } catch {
    // nothing to do; isLockedOut fails closed when the database is unreachable
  }
}
