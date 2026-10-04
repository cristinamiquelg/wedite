import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stripe is the source of truth for payment: an order becomes 'paid' only here,
// never because the customer landed on the thank-you page.
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new NextResponse("not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    // The signature is computed over the raw body, so don't parse it as JSON first.
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new NextResponse("invalid signature", { status: 400 });
  }

  const db = supabaseAdmin();

  // Idempotency: Stripe retries deliveries.
  const { error: dupe } = await db.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dupe) {
    if (dupe.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("stripe webhook: could not record event", dupe);
    return new NextResponse("server error", { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;
        await db
          .from("orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            amount_cents: session.amount_total ?? undefined,
            tax_cents: session.total_details?.amount_tax || undefined,
            stripe_payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          })
          .eq("id", session.client_reference_id ?? session.metadata?.order_id ?? "")
          .eq("status", "pending");
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await db
          .from("orders")
          .update({ status: event.type.endsWith("expired") ? "canceled" : "failed" })
          .eq("id", session.client_reference_id ?? session.metadata?.order_id ?? "")
          .eq("status", "pending");
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        if (typeof charge.payment_intent === "string") {
          await db
            .from("orders")
            .update({ status: charge.refunded ? "refunded" : "partially_refunded" })
            .eq("stripe_payment_intent_id", charge.payment_intent);
        }
        break;
      }
    }
  } catch (err) {
    // Forget the event so Stripe's retry reprocesses it.
    console.error("stripe webhook: handler failed", err);
    await db.from("stripe_events").delete().eq("id", event.id);
    return new NextResponse("server error", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
