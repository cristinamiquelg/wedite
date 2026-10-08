import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { emptyWeddingData, type WeddingData } from "@/lib/wedding-types";
import { isKnownTemplateSlug } from "@/components/templates/registry";
import { getTemplateBySlug } from "@/lib/templates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, vatIncluded } from "@/lib/stripe";
import { isRandomSlug, isValidCustomSlug } from "@/lib/site-address";
import { createDraftSite, type AddressChoice } from "@/lib/site-slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_DRAFT_BYTES = 4_000_000;

// Creates a pending order and an embedded-form Stripe Checkout Session, and returns its client secret.
// The price always comes from the server-side catalog, never from the client.
export async function POST(request: NextRequest) {
  let body: { slug?: unknown; email?: unknown; locale?: unknown; data?: unknown; address?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const template = typeof body.slug === "string" ? getTemplateBySlug(body.slug) : undefined;
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const locale = body.locale === "en" ? "en" : "es";
  if (!template || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (!isKnownTemplateSlug(template.slug) || !body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const data: WeddingData = { ...emptyWeddingData, ...(body.data as Partial<WeddingData>) };
  if (JSON.stringify(data).length > MAX_DRAFT_BYTES) {
    return NextResponse.json({ error: "too_large" }, { status: 413 });
  }

  const amountCents = Math.round(template.price * 100);
  const db = supabaseAdmin();

  // Create the couple's site as a draft; it is published when the payment is confirmed.
  // The edit token is generated here and only its hash is stored. Delivering it
  // to the couple (edit link) is not built yet.
  const editToken = randomBytes(32).toString("base64url");
  // Public address: the suggested one the couple saw, one they typed, or a random one.
  const address = (body.address && typeof body.address === "object" ? body.address : {}) as {
    kind?: unknown;
    slug?: unknown;
  };
  const chosen = typeof address.slug === "string" ? address.slug.trim().toLowerCase() : "";
  let choice: AddressChoice = { kind: "random" };
  if (address.kind === "random" && typeof address.slug === "string" && isRandomSlug(address.slug)) {
    // The random address the couple was shown (case matters: it is mixed case).
    choice = { kind: "random", slug: address.slug };
  }
  if ((address.kind === "suggested" || address.kind === "custom") && isValidCustomSlug(chosen)) {
    choice = {
      kind: "slug",
      slug: chosen,
      partnerA: data.partnerA,
      partnerB: data.partnerB,
      date: data.date,
      fallbackToSuggestions: address.kind === "suggested",
    };
  } else if (address.kind === "suggested" || address.kind === "custom") {
    return NextResponse.json({ error: "slug_invalid" }, { status: 400 });
  }

  const created = await createDraftSite(
    db,
    {
      template_slug: template.slug,
      status: "draft",
      data,
      locales: data.locales,
      partner_a: data.partnerA || null,
      partner_b: data.partnerB || null,
      wedding_date: data.date || null,
      owner_email: email,
      edit_token_hash: createHash("sha256").update(editToken).digest("hex"),
    },
    choice,
  );
  if ("error" in created) {
    return NextResponse.json(
      { error: created.error },
      { status: created.error === "slug_taken" ? 409 : 500 },
    );
  }
  const site = created.site;

  const { data: order, error } = await db
    .from("orders")
    .insert({
      site_id: site.id,
      email,
      template_slug: template.slug,
      template_name: template.name,
      currency: "EUR",
      list_price_cents: amountCents,
      amount_cents: amountCents,
      tax_cents: vatIncluded(amountCents),
      status: "pending",
      payment_method: "card",
      locale,
    })
    .select("id, number")
    .single();
  if (error || !order) {
    console.error("checkout: could not create order", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const origin = request.nextUrl.origin;
  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      // Stripe-hosted payment page (the customer is redirected to session.url).
      ui_mode: "hosted_page",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      allow_promotion_codes: false,
      submit_type: "auto",
      name_collection: { individual: { enabled: true } },
      origin_context: "web",
      customer_email: email,
      client_reference_id: order.id,
      locale,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            tax_behavior: "inclusive", // the price already includes IVA
            product_data: { name: `Wedite · ${template.name}` },
          },
        },
      ],
      automatic_tax: { enabled: false },
      invoice_creation: {
        enabled: true,
        invoice_data: { description: `Wedite ${template.name} · pedido ${order.number}` },
      },
      metadata: { order_id: order.id, site_id: site.id, order_number: order.number },
      success_url: `${origin}/gracias?slug=${template.slug}&site=${site.slug}&order=${order.number}`,
      cancel_url: `${origin}/personalizar/${template.slug}/confirmar`,
    });
    await db.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    if (!session.url) throw new Error("Checkout Session has no url");
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout: Stripe session failed", err);
    await db.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }
}
