-- Wedite MVP core schema (beta, no user accounts).
--
-- Access model: every table has RLS enabled and NO policies, so the public
-- (publishable/anon) API key can read and write nothing. Only the server,
-- using the service-role key, touches these tables. A couple identifies as the
-- owner of a site with a secret edit link whose token is stored only as a hash.

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- invite codes (private beta: a code replaces the payment)
-- ---------------------------------------------------------------------------
create table public.invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and char_length(code) between 4 and 40),
  note text,
  max_uses integer not null default 1 check (max_uses >= 1),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (used_count <= max_uses)
);

-- ---------------------------------------------------------------------------
-- sites: the couple's website (draft or published)
-- ---------------------------------------------------------------------------
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 40)
    check (slug <> all (array[
      'plantillas', 'guias', 'herramientas', 'api', 'personalizar', 'preview',
      'privacidad', 'quienes-somos', 'gracias', 'panel', 'editar', 'admin',
      'coming-soon', 'staging', 'www', 'wedite', 'login', 'registro'
    ])),
  template_slug text not null,
  template_version integer not null default 1,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- The full WeddingData document, exactly as the wizard produces it.
  data jsonb not null,
  locales text[] not null default array['es'],
  -- Denormalised from `data` so support can search and filter without parsing JSON.
  partner_a text,
  partner_b text,
  wedding_date date,
  owner_email text not null,
  -- sha256 (hex) of the secret edit-link token. The token itself is never stored.
  edit_token_hash text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sites_owner_email_idx on public.sites (lower(owner_email));
create index sites_status_idx on public.sites (status);
create trigger sites_set_updated_at before update on public.sites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders: what was bought, with a snapshot of the price and terms at that moment
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Human-friendly number for support and invoices, e.g. W-2026-00001.
  number text not null unique
    default ('W-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  site_id uuid references public.sites (id) on delete set null,
  email text not null,
  template_slug text not null,
  template_name text not null,
  currency text not null default 'EUR',
  list_price_cents integer not null check (list_price_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  -- tax_cents is the VAT contained in amount_cents (tax-inclusive pricing).
  tax_cents integer not null default 0 check (tax_cents >= 0),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded', 'partially_refunded', 'canceled')),
  -- 'invite_code' during the beta; 'card', 'apple_pay', 'google_pay', ... once Stripe is live.
  payment_method text,
  invite_code_id uuid references public.invite_codes (id),
  locale text,
  -- Terms the customer accepted at checkout (evidence for withdrawal / disputes).
  terms_version text,
  terms_accepted_at timestamptz,
  -- Optional invoicing details: { name, tax_id, address, ... }
  billing jsonb,
  -- Where the order came from: { utm_source, utm_medium, utm_campaign, referrer, landing_path }
  acquisition jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  updated_at timestamptz not null default now()
);
create index orders_email_idx on public.orders (lower(email));
create index orders_site_idx on public.orders (site_id);
create index orders_status_idx on public.orders (status);
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- rsvps: guest answers on a couple's site
-- ---------------------------------------------------------------------------
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  email text,
  attending boolean not null,
  bus boolean,
  -- Allergies / dietary needs can be health data: keep them out of logs and limit retention.
  dietary text,
  -- [{ first_name, last_name, kid, bus, dietary }]
  companions jsonb not null default '[]'::jsonb,
  guests integer not null default 1 check (guests >= 1),
  locale text,
  -- Salted hash of the submitter's IP, only to rate-limit abuse; never the raw IP.
  ip_hash text,
  created_at timestamptz not null default now()
);
create index rsvps_site_created_idx on public.rsvps (site_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ai_generations: every illustration request, to enforce limits and track cost
-- ---------------------------------------------------------------------------
create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references public.sites (id) on delete set null,
  ip_hash text,
  model text not null,
  status text not null check (status in ('ok', 'error')),
  error text,
  cost_cents numeric(10, 2),
  created_at timestamptz not null default now()
);
create index ai_generations_site_idx on public.ai_generations (site_id, created_at desc);
create index ai_generations_created_idx on public.ai_generations (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS: on everywhere, no policies => only the server (service role) gets in.
-- ---------------------------------------------------------------------------
alter table public.invite_codes enable row level security;
alter table public.sites enable row level security;
alter table public.orders enable row level security;
alter table public.rsvps enable row level security;
alter table public.ai_generations enable row level security;

-- ---------------------------------------------------------------------------
-- storage: photos and generated illustrations shown on published sites.
-- Public read (object paths are random UUIDs); uploads only from the server.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets', 'site-assets', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
