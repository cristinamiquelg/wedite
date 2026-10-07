import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { isStagingEnv } from "@/lib/environment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Where the "your legal texts may need updating" alerts go.
const ALERT_TO = process.env.LEGAL_ALERT_EMAIL || "crismiquelg@gmail.com";

// One event per visitor choice: far too noisy to email in production, and not
// actionable. Staging still emails them so LexVibe's test delivery (a sample
// consent.recorded) proves the whole chain works.
const IGNORED_EVENTS = new Set(["consent.recorded"]);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

// LexVibe signs the exact raw body: x-lexvibe-signature = hex(HMAC-SHA256(secret, body)).
function validSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(signature.trim(), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

// Called by LexVibe's servers (no staging password possible; see proxy.ts).
// Authenticated only by the signature check. Emails us when LexVibe says the
// legal documents changed, so the copies hosted on wedite.com can be updated.
export async function POST(request: NextRequest) {
  const secret = process.env.LEXVIBE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEXVIBE_WEBHOOK_SECRET is not set: LexVibe webhook rejected.");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  if (rawBody.length > 20_000 || !validSignature(rawBody, request.headers.get("x-lexvibe-signature"), secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: { type?: unknown; data?: unknown; at?: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const type = typeof event.type === "string" ? event.type.slice(0, 80) : "unknown";
  if (!isStagingEnv() && IGNORED_EVENTS.has(type)) return new NextResponse(null, { status: 204 });

  const details = JSON.stringify(event, null, 2).slice(0, 4000);
  try {
    await sendEmail({
      to: ALERT_TO,
      subject: `LexVibe: ${type}. Revisa los textos legales de Wedite`,
      text:
        `LexVibe ha enviado el aviso "${type}".\n\n` +
        `Si cambian los documentos, copia el texto nuevo desde el panel de LexVibe ` +
        `(Legal documents → View) y actualiza /privacidad y /terminos en Wedite.\n\n${details}`,
      html:
        `<p>LexVibe ha enviado el aviso <strong>${escapeHtml(type)}</strong>.</p>` +
        `<p>Si cambian los documentos, copia el texto nuevo desde el panel de LexVibe ` +
        `(Legal documents → View) y actualiza <code>/privacidad</code> y <code>/terminos</code> en Wedite.</p>` +
        `<pre>${escapeHtml(details)}</pre>`,
    });
  } catch (err) {
    console.error("LexVibe webhook: could not send alert email", err);
    // 500 so LexVibe can retry the delivery.
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }
  return new NextResponse(null, { status: 204 });
}
