import { createHash, randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { emptyWeddingData, type WeddingData } from "@/lib/wedding-types";
import { isKnownTemplateSlug } from "@/components/templates/registry";
import { getTemplateBySlug } from "@/lib/templates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, vatIncluded } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

/** Random lowercase letters and digits, so the public URL can't be guessed from the names. */
function randomSuffix(length = 6): string {
  return Array.from(randomBytes(length), (b) => SUFFIX_CHARS[b % SUFFIX_CHARS.length]).join("");
}

const MAX_DRAFT_BYTES = 4_000_000;

/** "Laura" + "Álvaro" -> "laura-alvaro" (the public URL of the couple's site). */
function baseSiteSlug(a: string, b: string): string {
  const clean = (v: string) =>
    v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slug = [clean(a), clean(b)].filter(Boolean).join("-").slice(0, 32).replace(/-+$/, "");
  return slug.length >= 3 ? slug : "boda";
}

// Creates a pending order and a Stripe Checkout Session, and returns its URL.
// The price always comes from the server-side catalog, never from the client.
export async function POST(request: NextRequest) {
  let body: { slug?: unknown; email?: unknown; locale?: unknown; data?: unknown };
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
  const base = baseSiteSlug(data.partnerA, data.partnerB);
  let site: { id: string; slug: string } | null = null;
  for (let attempt = 0; attempt < 5 && !site; attempt++) {
    const slug = `${base}-${randomSuffix()}`;
    const { data: row, error: siteError } = await db
      .from("sites")
      .insert({
        slug,
        template_slug: template.slug,
        status: "draft",
        data,
        locales: data.locales,
        partner_a: data.partnerA || null,
        partner_b: data.partnerB || null,
        wedding_date: data.date || null,
        owner_email: email,
        edit_token_hash: createHash("sha256").update(editToken).digest("hex"),
      })
      .select("id, slug")
      .single();
    if (row) site = row;
    // 23505 = slug taken: draw another suffix.
    else if (siteError?.code !== "23505") {
      console.error("checkout: could not create site", siteError);
      break;
    }
  }
  if (!site) return NextResponse.json({ error: "server_error" }, { status: 500 });

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
      // Needs Stripe Tax enabled in the dashboard; opt-in so checkout works before that.
      automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" },
      invoice_creation: {
        enabled: true,
        invoice_data: { description: `Wedite ${template.name} · pedido ${order.number}` },
      },
      metadata: { order_id: order.id, site_id: site.id, order_number: order.number },
      success_url: `${origin}/gracias?slug=${template.slug}&site=${site.slug}&order=${order.number}`,
      cancel_url: `${origin}/personalizar/${template.slug}/confirmar`,
    });
    await db.from("orders").update({ stripe_checkout_session_id: session.id }).eq("id", order.id);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("checkout: Stripe session failed", err);
    await db.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "stripe_error" }, { status: 502 });
  }
}
