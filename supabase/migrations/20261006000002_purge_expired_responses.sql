-- Retention: guests' RSVP answers are deleted automatically 90 days after the
-- wedding (the couple can download them as Excel before that). Sites with no
-- wedding date fall back to one year after they were created.
-- Wrong-code attempts on the responses page are only kept for 30 days.

create extension if not exists pg_cron;

create or replace function public.purge_expired_responses(retention interval default interval '90 days')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rsvps_deleted integer;
  attempts_deleted integer;
begin
  delete from public.rsvps r
  using public.sites s
  where s.id = r.site_id
    and (coalesce(s.wedding_date, (s.created_at at time zone 'Europe/Madrid')::date + 365) + retention)::date
        < (now() at time zone 'Europe/Madrid')::date;
  get diagnostics rsvps_deleted = row_count;

  delete from public.responses_access_attempts where created_at < now() - interval '30 days';
  get diagnostics attempts_deleted = row_count;

  return jsonb_build_object('rsvps_deleted', rsvps_deleted, 'attempts_deleted', attempts_deleted);
end;
$$;

-- Not callable from the public API (PostgREST exposes public functions as RPC).
revoke all on function public.purge_expired_responses(interval) from public, anon, authenticated;
grant execute on function public.purge_expired_responses(interval) to service_role;

-- Every day at 03:30 UTC. Scheduling by name replaces an existing job.
select cron.schedule('purge-expired-responses', '30 3 * * *', $$select public.purge_expired_responses()$$);
