-- Wedite analytics: first-party, cookieless usage events + the aggregation the
-- private dashboard reads. Nothing here identifies a person: events carry a
-- random per-tab session id (never stored on the device beyond the tab), no IP
-- and no user agent.

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table public.events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 40),
  -- Random id generated in the browser tab (sessionStorage); lets us count
  -- visits and funnel steps without cookies or a persistent identifier.
  session_id text check (char_length(session_id) <= 64),
  path text check (char_length(path) <= 300),
  referrer_host text check (char_length(referrer_host) <= 120),
  utm_source text check (char_length(utm_source) <= 80),
  utm_medium text check (char_length(utm_medium) <= 80),
  utm_campaign text check (char_length(utm_campaign) <= 80),
  locale text check (char_length(locale) <= 10),
  device text check (device in ('mobile', 'tablet', 'desktop')),
  -- ISO country code from the edge (Vercel), not from an IP we keep.
  country text check (char_length(country) <= 2),
  template_slug text check (char_length(template_slug) <= 60),
  props jsonb not null default '{}'::jsonb
);

create index events_created_at_idx on public.events (created_at desc);
create index events_name_created_at_idx on public.events (name, created_at desc);
create index events_session_idx on public.events (session_id);

alter table public.events enable row level security;

-- ---------------------------------------------------------------------------
-- dashboard_login_attempts: throttle for the private dashboard's password form
-- (the salted hash of the caller's IP, never the IP itself)
-- ---------------------------------------------------------------------------
create table public.dashboard_login_attempts (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null
);

create index dashboard_login_attempts_idx
  on public.dashboard_login_attempts (ip_hash, created_at desc);

alter table public.dashboard_login_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- dashboard_stats(from, to): everything the dashboard shows, in one call
-- ---------------------------------------------------------------------------
create or replace function public.dashboard_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  tz constant text := 'Europe/Madrid';
  result jsonb;
begin
  with
  ev as (
    select * from events where created_at >= p_from and created_at < p_to
  ),
  views as (
    select * from ev where name = 'page_view'
  ),
  -- One row per session: how it arrived, from where, on what device.
  first_touch as (
    select distinct on (session_id)
      session_id, created_at, path, referrer_host, utm_source, utm_medium,
      utm_campaign, locale, device, country
    from views
    where session_id is not null
    order by session_id, created_at
  ),
  days as (
    select d::date as day
    from generate_series(
      (p_from at time zone tz)::date,
      ((p_to - interval '1 second') at time zone tz)::date,
      interval '1 day'
    ) d
  ),
  daily as (
    select
      days.day,
      coalesce((select count(distinct v.session_id) from views v
                where (v.created_at at time zone tz)::date = days.day), 0) as sessions,
      coalesce((select count(*) from views v
                where (v.created_at at time zone tz)::date = days.day), 0) as page_views
    from days
    order by days.day
  ),
  funnel_sessions as (
    select
      session_id,
      bool_or(true) as visited,
      bool_or(path ~ '^/plantillas/[^/]+$') as viewed_template,
      bool_or(path ~ '^/personalizar/[^/]+$') as started,
      bool_or(path ~ '^/personalizar/[^/]+/confirmar$') as checkout,
      bool_or(path = '/gracias') as completed
    from views
    where session_id is not null
    group by session_id
  ),
  steps as (
    select props->>'step' as step, count(distinct session_id) as sessions
    from ev
    where name = 'wizard_step' and props ? 'step'
    group by 1
  ),
  top_pages as (
    select path, count(*) as views, count(distinct session_id) as sessions
    from views
    where path is not null
    group by path
    order by views desc
    limit 12
  ),
  sources as (
    select
      coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'directo') as source,
      count(*) as sessions
    from first_touch
    group by 1
    order by sessions desc
    limit 10
  ),
  countries as (
    select coalesce(country, '??') as country, count(*) as sessions
    from first_touch group by 1 order by sessions desc limit 10
  ),
  devices as (
    select coalesce(device, 'desconocido') as device, count(*) as sessions
    from first_touch group by 1 order by sessions desc
  ),
  locales as (
    select coalesce(locale, '??') as locale, count(*) as sessions
    from first_touch group by 1 order by sessions desc
  ),
  templates as (
    select
      template_slug as template,
      count(distinct session_id) filter (where path ~ '^/plantillas/[^/]+$') as viewed,
      count(distinct session_id) filter (where path ~ '^/personalizar/[^/]+$') as started,
      count(distinct session_id) filter (where path = '/gracias') as completed
    from views
    where template_slug is not null
    group by template_slug
    order by viewed desc nulls last
  ),
  recent as (
    select created_at, name, path, country, device, template_slug
    from ev
    order by created_at desc
    limit 25
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'kpis', jsonb_build_object(
      'sessions', (select count(*) from first_touch),
      'page_views', (select count(*) from views),
      'started', (select count(*) from funnel_sessions where started),
      'completed', (select count(*) from funnel_sessions where completed),
      'events', (select count(*) from ev)
    ),
    'daily', coalesce((select jsonb_agg(jsonb_build_object(
      'day', day, 'sessions', sessions, 'page_views', page_views) order by day) from daily), '[]'),
    'funnel', jsonb_build_object(
      'visited', (select count(*) from funnel_sessions),
      'viewed_template', (select count(*) from funnel_sessions where viewed_template),
      'started', (select count(*) from funnel_sessions where started),
      'checkout', (select count(*) from funnel_sessions where checkout),
      'completed', (select count(*) from funnel_sessions where completed)
    ),
    'steps', coalesce((select jsonb_agg(jsonb_build_object('step', step, 'sessions', sessions)) from steps), '[]'),
    'top_pages', coalesce((select jsonb_agg(to_jsonb(top_pages)) from top_pages), '[]'),
    'sources', coalesce((select jsonb_agg(to_jsonb(sources)) from sources), '[]'),
    'countries', coalesce((select jsonb_agg(to_jsonb(countries)) from countries), '[]'),
    'devices', coalesce((select jsonb_agg(to_jsonb(devices)) from devices), '[]'),
    'locales', coalesce((select jsonb_agg(to_jsonb(locales)) from locales), '[]'),
    'templates', coalesce((select jsonb_agg(to_jsonb(templates)) from templates), '[]'),
    'recent', coalesce((select jsonb_agg(to_jsonb(recent)) from recent), '[]'),
    -- Business data (from the product tables, not from tracking).
    'business', jsonb_build_object(
      'sites_total', (select count(*) from sites),
      'sites_published', (select count(*) from sites where status = 'published'),
      'sites_new', (select count(*) from sites where created_at >= p_from and created_at < p_to),
      'orders_total', (select count(*) from orders),
      'orders_new', (select count(*) from orders where created_at >= p_from and created_at < p_to),
      'orders_paid', (select count(*) from orders where status = 'paid'),
      'revenue_cents', (select coalesce(sum(amount_cents), 0) from orders where status = 'paid'),
      'rsvps_total', (select count(*) from rsvps),
      'rsvps_new', (select count(*) from rsvps where created_at >= p_from and created_at < p_to),
      'invite_codes_used', (select coalesce(sum(used_count), 0) from invite_codes),
      'ai_generations_new', (select count(*) from ai_generations where created_at >= p_from and created_at < p_to),
      'ai_cost_cents_new', (select coalesce(sum(cost_cents), 0) from ai_generations where created_at >= p_from and created_at < p_to)
    )
  ) into result;

  return result;
end;
$$;

-- Only the server (service role) may call it; the public API keys may not.
revoke all on function public.dashboard_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_stats(timestamptz, timestamptz) to service_role;

-- 'ops' hosts the private dashboard route, so a couple can't claim it as an address.
alter table public.sites drop constraint sites_slug_check1;
alter table public.sites add constraint sites_slug_check1
  check (slug <> all (array[
    'plantillas', 'guias', 'herramientas', 'api', 'personalizar', 'preview',
    'privacidad', 'quienes-somos', 'gracias', 'panel', 'editar', 'admin', 'ops',
    'coming-soon', 'staging', 'www', 'wedite', 'login', 'registro'
  ]));
