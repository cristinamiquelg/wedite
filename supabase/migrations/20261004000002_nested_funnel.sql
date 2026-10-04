-- Nested purchase funnel: a visit counts at a stage if it reached that stage
-- or any later one (e.g. landing straight on /personalizar still counts as
-- having "viewed a template"), so each step is never larger than the one
-- before it. Same signature as before, so this just replaces the function.

create or replace function public.dashboard_stats(
  p_from timestamptz,
  p_to timestamptz,
  p_filter_kind text default null,
  p_filter_value text default null
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  tz constant text := 'Europe/Madrid';
  -- Longest gap between two events that still counts as "time on a step";
  -- longer means the tab was left open.
  idle_cap constant interval := interval '30 minutes';
  result jsonb;
begin
  if p_filter_kind is not null and p_filter_kind not in ('source', 'locale', 'device', 'country') then
    raise exception 'unknown filter kind: %', p_filter_kind;
  end if;

  with
  ev as (
    select * from events where created_at >= p_from and created_at < p_to
  ),
  all_views as (
    select * from ev where name = 'page_view'
  ),
  -- A couple's own site lives at wedite.com/<slug>; everything else is Wedite.
  guest_views as (
    select *, split_part(path, '/', 2) as site_slug
    from all_views
    where path is not null and split_part(path, '/', 2) in (select slug from sites)
  ),
  views as (
    select * from all_views
    where path is null or split_part(path, '/', 2) not in (select slug from sites)
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
  -- Sessions the funnels look at: everyone, or only those matching the filter.
  allowed as (
    select distinct e.session_id
    from ev e
    where e.session_id is not null
      and (
        p_filter_kind is null
        or e.session_id in (
          select ft.session_id from first_touch ft
          where case p_filter_kind
            when 'source' then coalesce(nullif(ft.utm_source, ''), nullif(ft.referrer_host, ''), 'directo')
            when 'locale' then coalesce(ft.locale, '??')
            when 'device' then coalesce(ft.device, 'desconocido')
            when 'country' then coalesce(ft.country, '??')
          end = p_filter_value
        )
      )
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
  -- Unfiltered: feeds the headline numbers.
  all_funnel_sessions as (
    select
      session_id,
      bool_or(path ~ '^/personalizar/[^/]+$') as started,
      bool_or(path = '/gracias') as completed
    from views
    where session_id is not null
    group by session_id
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
    where session_id in (select session_id from allowed)
    group by session_id
  ),
  -- Wizard steps in order; a visit "reached" a step if it opened that step or
  -- any later one (the step pills let people jump around).
  step_order(step, pos) as (
    values ('language', 1), ('couple', 2), ('story', 3), ('itinerary', 4), ('details', 5), ('rsvp', 6)
  ),
  session_depth as (
    select e.session_id, max(so.pos) as max_pos
    from ev e
    join step_order so on so.step = e.props->>'step'
    where e.name = 'wizard_step' and e.session_id in (select session_id from allowed)
    group by e.session_id
  ),
  steps as (
    select
      so.step,
      (select count(*) from session_depth sd where sd.max_pos >= so.pos) as reached,
      (select count(distinct e.session_id) from ev e
        where e.name = 'wizard_step' and e.props->>'step' = so.step
          and e.session_id in (select session_id from allowed)) as sessions
    from step_order so
    order by so.pos
  ),
  -- Time on each step: from opening it to the visit's next event (another
  -- step, the checkout page...). The visit's very last event has no "next",
  -- so it adds no time; gaps over idle_cap are treated as an abandoned tab.
  timeline as (
    select
      session_id, name, props->>'step' as step, created_at,
      lead(created_at) over (partition by session_id order by created_at, id) as next_at
    from ev
    where session_id in (select session_id from allowed)
  ),
  step_time_per_session as (
    select session_id, step, sum(extract(epoch from (next_at - created_at))) as seconds
    from timeline
    where name = 'wizard_step' and step is not null
      and next_at is not null and next_at - created_at <= idle_cap
    group by session_id, step
  ),
  step_times as (
    select step, round(avg(seconds))::int as avg_seconds, count(*) as sessions
    from step_time_per_session
    group by step
  ),
  -- Where visits that never reached checkout left off: the last step opened.
  last_steps as (
    select distinct on (e.session_id) e.session_id, e.props->>'step' as step
    from ev e
    where e.name = 'wizard_step' and e.props ? 'step'
      and e.session_id in (select session_id from allowed)
    order by e.session_id, e.created_at desc, e.id desc
  ),
  dropoff as (
    select ls.step, count(*) as sessions
    from last_steps ls
    where not exists (
      select 1 from views v
      where v.session_id = ls.session_id and (v.path ~ '^/personalizar/[^/]+/confirmar$' or v.path = '/gracias')
    )
    and not exists (
      select 1 from ev c where c.session_id = ls.session_id and c.name = 'checkout_submit'
    )
    group by ls.step
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
  campaigns as (
    select
      ft.utm_source as source, ft.utm_medium as medium, ft.utm_campaign as campaign,
      count(*) as sessions,
      count(*) filter (where afs.started or afs.completed) as started,
      count(*) filter (where afs.completed) as completed
    from first_touch ft
    left join all_funnel_sessions afs using (session_id)
    where ft.utm_source is not null or ft.utm_medium is not null or ft.utm_campaign is not null
    group by 1, 2, 3
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
  -- Guests visiting couples' own sites, and the RSVPs those sites received.
  guest_visits as (
    select site_slug, count(distinct session_id) as visits
    from guest_views
    group by site_slug
  ),
  guest_rsvps as (
    select s.slug as site_slug, count(*) as rsvps, count(*) filter (where r.attending) as attending
    from rsvps r
    join sites s on s.id = r.site_id
    where r.created_at >= p_from and r.created_at < p_to
    group by s.slug
  ),
  guest_sites as (
    select
      coalesce(v.site_slug, r.site_slug) as site,
      coalesce(v.visits, 0) as visits,
      coalesce(r.rsvps, 0) as rsvps,
      coalesce(r.attending, 0) as attending
    from guest_visits v
    full join guest_rsvps r on r.site_slug = v.site_slug
    order by visits desc, rsvps desc
    limit 20
  ),
  -- Which blocks the couples' sites actually use (drafts and published; not archived).
  feature_sites as (
    select
      count(*) as total,
      count(*) filter (where
        (jsonb_typeof(data->'phases') = 'array' and jsonb_array_length(data->'phases') > 0)
        or (jsonb_typeof(data->'timeline') = 'array' and jsonb_array_length(data->'timeline') > 0)
      ) as itinerary,
      count(*) filter (where
        nullif(trim(coalesce(data->>'rsvpNote', '')), '') is not null
        or exists (select 1 from rsvps r where r.site_id = sites.id)
      ) as rsvp,
      count(*) filter (where nullif(trim(coalesce(data->>'giftAccount', '')), '') is not null) as gift,
      count(*) filter (where data->>'storyImageKind' = 'illustration') as ai_illustration
    from sites
    where status <> 'archived'
  ),
  -- Paid sites whose edit link was opened on a later day than the payment.
  purchased_sites as (
    select o.site_id, min(o.paid_at) as paid_at
    from orders o
    where o.status = 'paid' and o.site_id is not null
    group by o.site_id
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
    'filter', case when p_filter_kind is null then null
                   else jsonb_build_object('kind', p_filter_kind, 'value', p_filter_value) end,
    'kpis', jsonb_build_object(
      'sessions', (select count(*) from first_touch),
      'page_views', (select count(*) from views),
      'started', (select count(*) from all_funnel_sessions where started or completed),
      'completed', (select count(*) from all_funnel_sessions where completed),
      'events', (select count(*) from ev)
    ),
    'daily', coalesce((select jsonb_agg(jsonb_build_object(
      'day', day, 'sessions', sessions, 'page_views', page_views) order by day) from daily), '[]'),
    'funnel', jsonb_build_object(
      'visited', (select count(*) from funnel_sessions),
      'viewed_template', (select count(*) from funnel_sessions where viewed_template or started or checkout or completed),
      'started', (select count(*) from funnel_sessions where started or checkout or completed),
      'checkout', (select count(*) from funnel_sessions where checkout or completed),
      'completed', (select count(*) from funnel_sessions where completed)
    ),
    'steps', coalesce((select jsonb_agg(jsonb_build_object(
      'step', step, 'sessions', sessions, 'reached', reached) order by reached desc, step) from steps), '[]'),
    'step_times', coalesce((select jsonb_agg(jsonb_build_object(
      'step', step, 'avg_seconds', avg_seconds, 'sessions', sessions)) from step_times), '[]'),
    'dropoff', coalesce((select jsonb_agg(jsonb_build_object(
      'step', step, 'sessions', sessions) order by sessions desc) from dropoff), '[]'),
    'top_pages', coalesce((select jsonb_agg(to_jsonb(top_pages)) from top_pages), '[]'),
    'sources', coalesce((select jsonb_agg(to_jsonb(sources)) from sources), '[]'),
    'campaigns', coalesce((select jsonb_agg(to_jsonb(campaigns)) from campaigns), '[]'),
    'countries', coalesce((select jsonb_agg(to_jsonb(countries)) from countries), '[]'),
    'devices', coalesce((select jsonb_agg(to_jsonb(devices)) from devices), '[]'),
    'locales', coalesce((select jsonb_agg(to_jsonb(locales)) from locales), '[]'),
    'templates', coalesce((select jsonb_agg(to_jsonb(templates)) from templates), '[]'),
    'guest_sites', coalesce((select jsonb_agg(to_jsonb(guest_sites)) from guest_sites), '[]'),
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
      'ai_cost_cents_new', (select coalesce(sum(cost_cents), 0) from ai_generations where created_at >= p_from and created_at < p_to),
      'features', (select jsonb_build_object(
        'sites', total, 'itinerary', itinerary, 'rsvp', rsvp, 'gift', gift, 'ai_illustration', ai_illustration
      ) from feature_sites),
      'purchased_sites', (select count(*) from purchased_sites),
      'purchased_sites_reedited', (
        select count(*) from purchased_sites ps
        where exists (
          select 1 from site_edit_opens eo
          where eo.site_id = ps.site_id and eo.opened_on > (ps.paid_at at time zone tz)::date
        )
      )
    )
  ) into result;

  return result;
end;
$$;

-- Only the server (service role) may call it; the public API keys may not.
revoke all on function public.dashboard_stats(timestamptz, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.dashboard_stats(timestamptz, timestamptz, text, text) to service_role;
