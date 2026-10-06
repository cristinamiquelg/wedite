import "server-only";
import Stripe from "stripe";

// Server-only Stripe client. STRIPE_SECRET_KEY must be a test key (sk_test_...)
// on Preview/staging and the live key only on Production.
let client: Stripe | null = null;

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set for this environment.");
  client ??= new Stripe(key);
  return client;
}

/** Spanish standard VAT rate. Prices are tax-inclusive. */
export const VAT_RATE = 0.21;

/** VAT contained in a tax-inclusive amount, in cents. */
export function vatIncluded(amountCents: number): number {
  return Math.round(amountCents - amountCents / (1 + VAT_RATE));
}
