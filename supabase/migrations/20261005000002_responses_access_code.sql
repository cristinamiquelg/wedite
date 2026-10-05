-- The private responses page asks for an access code (sent in the welcome email),
-- on top of its secret link. Only the hash of the code is stored.
alter table public.sites add column responses_code_hash text;

-- Wrong-code attempts, to lock the form against guessing: per site and per
-- (hashed) IP. The IP is only used for this limit and never stored as such.
create table public.responses_access_attempts (
  id bigint generated always as identity primary key,
  site_id uuid not null references public.sites (id) on delete cascade,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index responses_access_attempts_site_idx on public.responses_access_attempts (site_id, created_at desc);
create index responses_access_attempts_ip_idx on public.responses_access_attempts (site_id, ip_hash, created_at desc);
alter table public.responses_access_attempts enable row level security;
