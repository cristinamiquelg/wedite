# Stripe integration — pending items

Embedded Stripe payment form (`ui_mode: "form"`, beta) integrated in:

- Server: `src/app/api/checkout/route.ts` (Checkout Session) and `src/lib/stripe.ts` (API version).
- Client: `src/components/site/StripeEmbeddedForm.tsx`, used by `src/app/personalizar/[slug]/confirmar/ConfirmClient.tsx`.

## To do before this works

- [ ] **Publishable key**: set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (or `STRIPE_PUBLISHABLE_KEY`) in Vercel
      (`pk_test_...` on Preview, `pk_live_...` on Production). The server sends it to the browser with the client secret.
- [ ] **Beta access**: the account must have the "custom checkout payment form" preview enabled
      (API version `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1`, beta flag `custom_checkout_payment_form_1`).
      If Stripe rejects the session, ask Stripe to enable it, or go back to hosted Checkout.
- [ ] **Test on staging** with a test card (4242 4242 4242 4242): form shows, payment succeeds, redirect to `/gracias`,
      webhook marks the order paid and sends the welcome email.
- [ ] **Redirect-based payment methods**: `return_url` is `/gracias?...`. Check that a failed or abandoned payment leaves the order `pending`.
- [ ] **Taxes**: `automatic_tax` is now fixed to `false` (previously controlled by `STRIPE_AUTOMATIC_TAX`). Prices are tax-inclusive (21% IVA);
      review with the accountant before launch.
- [ ] **Phone / billing address / name**: collected per the fixed settings (`phone` off, billing address `auto`, individual name on).
- [ ] **Production**: swap to live keys and webhook only when Cristina gives the go-ahead.

## Kept on purpose (the rest of the app depends on them)

`mode: "payment"`, `line_items`, `customer_email`, `client_reference_id`, `metadata` (order/site ids used by the webhook),
`locale`, `invoice_creation`. `success_url` / `cancel_url` were replaced by `return_url` (the form does not accept them).
