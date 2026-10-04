import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isComingSoon } from "@/lib/launch";
import { isStagingEnv, STAGING_PASSWORD_SHA256 } from "@/lib/environment";

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

// HTTP Basic: any username, the staging password as the password.
async function hasStagingAccess(request: NextRequest): Promise<boolean> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice("Basic ".length));
    const password = decoded.slice(decoded.indexOf(":") + 1);
    return (await sha256Hex(password)) === STAGING_PASSWORD_SHA256;
  } catch {
    return false;
  }
}

// The private dashboard lives under /ops/<secret>. It must stay reachable in
// production while the rest of the site shows "coming soon", and it must never
// be indexed (the page also sets noindex; this covers its server actions too).
const DASHBOARD_PREFIX = "/ops/";

function withNoIndex(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// Audit mode (STAGING_PUBLIC=1, set in Vercel for Preview): lets an outside
// reviewer, such as a lawyer, open the staging pages without the password.
// Only the pages open up. The API (it costs money: image generation) and the
// private dashboard stay behind the password; the one exception is the
// usage-tracking endpoint, which is harmless and keeps the pages working.
function isOpenForAudit(pathname: string): boolean {
  if (process.env.STAGING_PUBLIC !== "1") return false;
  if (pathname === "/api/track") return true;
  return !pathname.startsWith("/api/") && !pathname.startsWith(DASHBOARD_PREFIX);
}

// Stripe's servers call this endpoint, so it can't carry the staging password
// and must stay reachable even while production shows "coming soon". It is
// protected by the Stripe signature check inside the route itself.
const STRIPE_WEBHOOK_PATH = "/api/stripe/webhook";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === STRIPE_WEBHOOK_PATH) return NextResponse.next();

  // Staging and PR previews: nothing is reachable without the password,
  // pages and API alike (unless audit mode opens the pages, see above).
  if (isStagingEnv() && !isOpenForAudit(request.nextUrl.pathname) && !(await hasStagingAccess(request))) {
    return new NextResponse("Staging — authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Wedite staging", charset="UTF-8"' },
    });
  }

  const { pathname } = request.nextUrl;
  if (!isComingSoon()) {
    return pathname.startsWith(DASHBOARD_PREFIX) ? withNoIndex(NextResponse.next()) : NextResponse.next();
  }

  // Production only, and only until LAUNCHED is flipped: every page shows the
  // coming-soon screen and the API (which costs money) is closed.
  if (pathname === "/coming-soon") return NextResponse.next();
  if (pathname.startsWith(DASHBOARD_PREFIX)) return withNoIndex(NextResponse.next());
  // Usage tracking is open (and harmless: it only inserts a small event); it
  // lets us count visits to the coming-soon page itself.
  if (pathname === "/api/track") return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "not_available" }, { status: 404 });
  }
  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

// Static assets stay open: next/image's optimizer fetches /public images from
// the server itself (it can't send the staging password), so gating them
// would break every optimized image on staging. They hold nothing private.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|opengraph-image.png|.*\\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?)$).*)",
  ],
};
