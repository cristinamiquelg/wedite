-- Purchase confirmation email + storing guests' RSVP answers.

-- When the "purchase confirmed" email went out (null = not yet): keeps it to one
-- email per order even if Stripe retries the webhook.
alter table public.orders add column confirmation_email_sent_at timestamptz;

-- The browser tab that sent an RSVP picks a random id, so a guest who edits and
-- resubmits updates their answer instead of adding a second row.
alter table public.rsvps add column client_ref text;
alter table public.rsvps add constraint rsvps_site_client_ref_key unique (site_id, client_ref);

-- The private responses page finds a site by the hash of its secret link.
create index sites_edit_token_hash_idx on public.sites (edit_token_hash);

-- Abuse limit: recent submissions from the same (hashed) IP on one site.
create index rsvps_site_ip_created_idx on public.rsvps (site_id, ip_hash, created_at desc);
