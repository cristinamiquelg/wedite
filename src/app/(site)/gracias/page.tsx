import { getTemplateBySlug } from "@/lib/templates";
import GraciasContent from "@/components/site/GraciasContent";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Stripe's own session ids look like cs_test_a1B2... / cs_live_...
const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

/**
 * The email this purchase was made with, so the page can say where the
 * information goes. It is looked up by the Stripe session id, which only the
 * buyer's browser has (an order number is sequential and guessable, so it is
 * never enough to reveal an email).
 */
async function emailForSession(sessionId: string | undefined): Promise<string | undefined> {
  if (!sessionId || !SESSION_ID_RE.test(sessionId)) return undefined;
  try {
    const { data } = await supabaseAdmin()
      .from("orders")
      .select("email")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();
    return typeof data?.email === "string" ? data.email : undefined;
  } catch {
    return undefined;
  }
}

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; site?: string; session_id?: string }>;
}) {
  const { slug, site, session_id } = await searchParams;
  const template = slug ? getTemplateBySlug(slug) : undefined;
  const email = await emailForSession(session_id);

  return <GraciasContent slug={slug} site={site} template={template} email={email} />;
}
