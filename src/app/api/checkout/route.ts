import { NextResponse, type NextRequest } from "next/server";
import { getTemplateBySlug } from "@/lib/templates";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, vatIncluded } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a pending order and a Stripe Checkout Session, and returns its URL.
// The price always comes from the server-side catalog, never from the client.
export async function POST(request: NextRequest) {
  let body: { slug?: unknown; email?: unknown; locale?: unknown };
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

  const amountCents = Math.round(template.price * 100);
  const db = supabaseAdmin();

  const { data: order, error } = await db
    .from("orders")
    .insert({
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
      metadata: { order_id: order.id, order_number: order.number },
      success_url: `${origin}/gracias?slug=${template.slug}&order=${order.number}`,
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
