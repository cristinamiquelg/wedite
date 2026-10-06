-- dashboard_stage_times: the purchase funnel in detail. For each stage (visit ->
-- sees a template -> starts configuring -> reaches payment -> buys) how many visits
-- reach it (nested: that stage or a later one) and how long they take to get to the
-- next stage. A visit's time to a stage is the first time it opened that page;
-- the gap between two stages counts only when the later one is strictly after the
-- earlier one and under 2 hours (longer means the tab was left). Couples' own
-- sites are left out, and the optional filter narrows the visits like in
-- dashboard_stats.

create or replace function public.dashboard_stage_times(
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
  max_gap constant interval := interval '2 hours';
  result jsonb;
begin
  if p_filter_kind is not null and p_filter_kind not in ('source', 'locale', 'device', 'country') then
    raise exception 'unknown filter kind: %', p_filter_kind;
  end if;

  with
  views as (
    select * from events
    where created_at >= p_from and created_at < p_to
      and name = 'page_view'
      and (path is null or split_part(path, '/', 2) not in (select slug from sites))
  ),
  first_touch as (
    select distinct on (session_id)
      session_id, utm_source, referrer_host, locale, device, country
    from views
    where session_id is not null
    order by session_id, created_at
  ),
  allowed as (
    select session_id from first_touch ft
    where p_filter_kind is null
      or (case p_filter_kind
        when 'source' then coalesce(nullif(ft.utm_source, ''), nullif(ft.referrer_host, ''), 'directo')
        when 'locale' then coalesce(ft.locale, '??')
        when 'device' then coalesce(ft.device, 'desconocido')
        when 'country' then coalesce(ft.country, '??')
      end) = p_filter_value
  ),
  sess as (
    select
      session_id,
      min(created_at) as t_visit,
      min(created_at) filter (where path ~ '^/plantillas/[^/]+$') as t_template,
      min(created_at) filter (where path ~ '^/personalizar/[^/]+$') as t_start,
      min(created_at) filter (where path ~ '^/personalizar/[^/]+/confirmar$') as t_checkout,
      min(created_at) filter (where path = '/gracias') as t_done
    from views
    where session_id in (select session_id from allowed)
    group by session_id
  ),
  reached as (
    select
      count(*) as visited,
      count(*) filter (where coalesce(t_template, t_start, t_checkout, t_done) is not null) as viewed_template,
      count(*) filter (where coalesce(t_start, t_checkout, t_done) is not null) as started,
      count(*) filter (where coalesce(t_checkout, t_done) is not null) as checkout,
      count(*) filter (where t_done is not null) as completed
    from sess
  ),
  gaps as (
    select 'visited' as stage, extract(epoch from (t_template - t_visit)) as secs from sess
      where t_template > t_visit and t_template - t_visit <= max_gap
    union all
    select 'viewed_template', extract(epoch from (t_start - t_template)) from sess
      where t_start > t_template and t_start - t_template <= max_gap
    union all
    select 'started', extract(epoch from (t_checkout - t_start)) from sess
      where t_checkout > t_start and t_checkout - t_start <= max_gap
    union all
    select 'checkout', extract(epoch from (t_done - t_checkout)) from sess
      where t_done > t_checkout and t_done - t_checkout <= max_gap
    union all
    select 'total', extract(epoch from (t_done - t_visit)) from sess
      where t_done > t_visit and t_done - t_visit <= max_gap * 12
  ),
  gap_stats as (
    select
      stage,
      count(*) as n,
      round(percentile_cont(0.5) within group (order by secs))::int as median_seconds,
      round(avg(secs))::int as avg_seconds
    from gaps
    group by stage
  )
  select jsonb_build_object(
    'reached', (select to_jsonb(reached) from reached),
    'gaps', coalesce((select jsonb_object_agg(stage, jsonb_build_object(
      'n', n, 'median_seconds', median_seconds, 'avg_seconds', avg_seconds)) from gap_stats), '{}'::jsonb)
  ) into result;

  return result;
end;
$$;

-- Only the server (service role) may call it; the public API keys may not.
revoke all on function public.dashboard_stage_times(timestamptz, timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.dashboard_stage_times(timestamptz, timestamptz, text, text) to service_role;
