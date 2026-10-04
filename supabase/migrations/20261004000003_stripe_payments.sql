-- Stripe payments: link each order to its Checkout Session / PaymentIntent.
alter table public.orders
  add column stripe_checkout_session_id text unique,
  add column stripe_payment_intent_id text;

create index orders_stripe_payment_intent_idx on public.orders (stripe_payment_intent_id);

-- Webhook deliveries already processed (Stripe retries; handlers must be idempotent).
create table public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
