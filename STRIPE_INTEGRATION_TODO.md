# Stripe integration — pending items

Stripe-hosted Checkout (`ui_mode: "hosted_page"`): the customer is redirected to the page in `session.url`.

## Values to Replace

None. `mode`, `line_items`, `success_url` and `cancel_url` already hold real values in
[src/app/api/checkout/route.ts](src/app/api/checkout/route.ts), so they were kept:

| Field | Current value |
|-------|---------------|
| mode | `payment` (one-time) |
| line_items | `price_data` in EUR from the server-side catalog, tax-inclusive |
| success_url | `/gracias?slug=…&site=…&order=…` |
| cancel_url | `/personalizar/<template>/confirmar` |

## Configured Parameters

Set from Checkout Studio, in [src/app/api/checkout/route.ts](src/app/api/checkout/route.ts):

| Parameter | Value |
|-----------|-------|
| ui_mode | `hosted_page` (stripe SDK ^23, which is ≥ 21.0.0; below 21 it would be `hosted`) |
| billing_address_collection | `auto` |
| phone_number_collection | `{ enabled: false }` |
| automatic_tax | `{ enabled: false }` |
| allow_promotion_codes | `false` |
| submit_type | `auto` |
| name_collection | `{ individual: { enabled: true } }` |
| origin_context | `web` |

`payment_method_collection` is not sent: it only applies to `mode: "subscription"`.
The Stripe client in [src/lib/stripe.ts](src/lib/stripe.ts) no longer pins an API version.

## Kept on purpose (the rest of the app depends on them)

`customer_email`, `client_reference_id` and `metadata` (the webhook uses the order/site ids to mark the order paid and
publish the site), `locale`, and `invoice_creation`. They are not Checkout Studio fields.

## Setup

- `STRIPE_SECRET_KEY` (server only): `sk_test_…` on Preview, `sk_live_…` on Production.
- `STRIPE_WEBHOOK_SECRET`: the `whsec_…` of the webhook destination of that same Stripe environment
  (URL: `<domain>/api/stripe/webhook`; events `checkout.session.completed`, `.expired`, `.async_payment_succeeded`,
  `.async_payment_failed` and `charge.refunded`).
- `STRIPE_PUBLISHABLE_KEY` is no longer needed by the checkout (it was for the embedded form).

## Flow

1. `ConfirmClient` posts the draft to `POST /api/checkout`.
2. The route saves a draft site and a pending order, creates the Checkout Session and returns `{ url }`.
3. The browser goes to Stripe's hosted page and, after paying, to `/gracias`.
4. The webhook marks the order `paid` and publishes the site.

## Testing

Card `4242 4242 4242 4242`, any future date and any CVC, in the sandbox / test environment.

## Next steps

- [ ] **Taxes**: `automatic_tax` is fixed to `false`; prices are tax-inclusive (21% IVA). Review with the accountant before launch.
- [ ] **Cleanup**: `src/components/site/StripeEmbeddedForm.tsx` and the embedded-form branch in `ConfirmClient.tsx`
      are no longer used and can be removed.
- [ ] **Branding**: set logo and colours in Stripe → Settings → Branding (hosted page, invoices, receipts).
- [ ] **Production**: live keys and webhook only when Cristina gives the go-ahead.

Resources: https://support.stripe.com and https://docs.stripe.com/mcp
