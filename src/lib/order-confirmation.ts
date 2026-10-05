import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { sendEmail } from "@/lib/email/resend";
import { generateAccessCode, hashCode } from "@/lib/responses-access";

/** sha256 (hex) of a secret link token: the only form in which it is stored. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Sends the welcome email once per paid order: the site, the share links and the
// private link to the guests' answers.
//
// The responses link carries a fresh secret token and an access code generated
// here; only their hashes go into the database (sites.edit_token_hash and
// sites.responses_code_hash). That is safe to rotate because
// no earlier link has been delivered to anyone. If sending fails this throws, so
// the Stripe webhook answers 500 and Stripe retries it; the sent-at marker keeps
// a retry from emailing twice.
export async function sendOrderConfirmation(db: SupabaseClient, orderId: string, origin: string): Promise<"sent" | "skipped"> {
  const { data: order } = await db
    .from("orders")
    .select("id, number, email, template_name, locale, status, site_id, confirmation_email_sent_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.status !== "paid" || order.confirmation_email_sent_at || !order.site_id) return "skipped";

  const { data: site } = await db
    .from("sites")
    .select("id, slug, partner_a, partner_b, wedding_date, data, status")
    .eq("id", order.site_id)
    .maybeSingle();
  if (!site || site.status !== "published") return "skipped";

  const token = randomBytes(32).toString("base64url");
  const accessCode = generateAccessCode();
  const { error: tokenError } = await db
    .from("sites")
    .update({ edit_token_hash: hashToken(token), responses_code_hash: hashCode(accessCode) })
    .eq("id", site.id);
  if (tokenError) throw new Error(`could not store the responses link: ${tokenError.message}`);

  const email = buildOrderConfirmationEmail({
    locale: order.locale === "en" ? "en" : "es",
    origin,
    siteSlug: site.slug,
    responsesToken: token,
    accessCode,
    orderNumber: order.number,
    templateName: order.template_name,
    partnerA: site.partner_a,
    partnerB: site.partner_b,
    weddingDate: site.wedding_date,
    venue: (site.data as { estateName?: string } | null)?.estateName,
    place: (site.data as { estateLocation?: string } | null)?.estateLocation,
  });
  await sendEmail({ to: order.email, ...email });

  await db.from("orders").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", order.id);
  return "sent";
}
