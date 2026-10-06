-- dashboard_segments: the main charts split by one visitor characteristic
-- (source | locale | device | country). Returns the five biggest segments plus
-- "__other", visits per day, the nested purchase funnel and the wizard steps
-- reached, each per segment. Same rules as dashboard_stats: visits are random
-- per-tab sessions, couples' own sites are left out, and the segment is the one
-- the visit arrived with. An optional filter narrows the visits first.

create or replace function public.dashboard_segments(
  p_from timestamptz,
  p_to timestamptz,
  p_dim text,
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
  result jsonb;
begin
  if p_dim not in ('source', 'locale', 'device', 'country') then
    raise exception 'unknown segment dimension: %', p_dim;
  end if;
  if p_filter_kind is not null and p_filter_kind not in ('source', 'locale', 'device', 'country') then
    raise exception 'unknown filter kind: %', p_filter_kind;
  end if;

  with
  ev as (
    select * from events where created_at >= p_from and created_at < p_to
  ),
  views as (
    select * from ev
    where name = 'page_view'
      and (path is null or split_part(path, '/', 2) not in (select slug from sites))
  ),
  first_touch as (
    select distinct on (session_id)
      session_id,
      coalesce(nullif(utm_source, ''), nullif(referrer_host, ''), 'directo') as src,
      coalesce(locale, '??') as loc,
      coalesce(device, 'desconocido') as dev,
      coalesce(country, '??') as cty
    from views
    where session_id is not null
    order by session_id, created_at
  ),
  seg_raw as (
    select
      session_id,
      case p_dim when 'source' then src when 'locale' then loc when 'device' then dev else cty end as seg
    from first_touch
    where p_filter_kind is null
      or (case p_filter_kind when 'source' then src when 'locale' then loc when 'device' then dev else cty end) = p_filter_value
  ),
  top_segs as (
    select seg from seg_raw group by seg order by count(*) desc, seg limit 5
  ),
  seg_final as (
    select session_id, case when seg in (select seg from top_segs) then seg else '__other' end as segment
    from seg_raw
  ),
  segments as (
    select segment, count(*) as sessions
    from seg_final
    group by segment
  ),
  daily as (
    select (v.created_at at time zone tz)::date as day, sf.segment, count(distinct v.session_id) as sessions
    from views v
    join seg_final sf using (session_id)
    group by 1, 2
  ),
  flags as (
    select
      v.session_id,
      bool_or(v.path ~ '^/plantillas/[^/]+$') as viewed_template,
      bool_or(v.path ~ '^/personalizar/[^/]+$') as started,
      bool_or(v.path ~ '^/personalizar/[^/]+/confirmar$') as checkout,
      bool_or(v.path = '/gracias') as completed
    from views v
    where v.session_id in (select session_id from seg_final)
    group by v.session_id
  ),
  funnel as (
    select
      sf.segment,
      count(*) as visited,
      count(*) filter (where f.viewed_template or f.started or f.checkout or f.completed) as viewed_template,
      count(*) filter (where f.started or f.checkout or f.completed) as started,
      count(*) filter (where f.checkout or f.completed) as checkout,
      count(*) filter (where f.completed) as completed
    from seg_final sf
    left join flags f using (session_id)
    group by sf.segment
  ),
  step_order(step, pos) as (
    values ('language', 1), ('couple', 2), ('story', 3), ('itinerary', 4), ('details', 5), ('rsvp', 6)
  ),
  depth as (
    select e.session_id, max(so.pos) as max_pos
    from ev e
    join step_order so on so.step = e.props->>'step'
    where e.name = 'wizard_step' and e.session_id in (select session_id from seg_final)
    group by e.session_id
  ),
  steps as (
    select
      s.segment, so.step, so.pos,
      (select count(*) from depth d
        join seg_final sf on sf.session_id = d.session_id
        where sf.segment = s.segment and d.max_pos >= so.pos) as reached
    from segments s
    cross join step_order so
  )
  select jsonb_build_object(
    'from', p_from,
    'to', p_to,
    'dim', p_dim,
    'segments', coalesce((select jsonb_agg(jsonb_build_object('segment', segment, 'sessions', sessions)
      order by (segment = '__other'), sessions desc, segment) from segments), '[]'),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'segment', segment, 'sessions', sessions)
      order by day, segment) from daily), '[]'),
    'funnel', coalesce((select jsonb_agg(to_jsonb(funnel)) from funnel), '[]'),
    'steps', coalesce((select jsonb_agg(jsonb_build_object('segment', segment, 'step', step, 'reached', reached)
      order by segment, pos) from steps), '[]')
  ) into result;

  return result;
end;
$$;

-- Only the server (service role) may call it; the public API keys may not.
revoke all on function public.dashboard_segments(timestamptz, timestamptz, text, text, text) from public, anon, authenticated;
grant execute on function public.dashboard_segments(timestamptz, timestamptz, text, text, text) to service_role;
