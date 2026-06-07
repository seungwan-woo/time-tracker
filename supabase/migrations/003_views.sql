create view daily_wearing_summary
with (security_invoker = true)
as
select
  family_id,
  child_id,
  report_date,
  count(*) as session_count,
  coalesce(sum(duration_minutes), 0) as total_minutes
from wearing_sessions
where
  status = 'closed'
  and deleted_at is null
group by family_id, child_id, report_date;

create view weekly_wearing_summary
with (security_invoker = true)
as
select
  family_id,
  child_id,
  date_trunc('week', report_date::timestamp)::date as week_start_date,
  count(*) as session_count,
  coalesce(sum(duration_minutes), 0) as total_minutes
from wearing_sessions
where
  status = 'closed'
  and deleted_at is null
group by family_id, child_id, date_trunc('week', report_date::timestamp)::date;

create view monthly_wearing_summary
with (security_invoker = true)
as
select
  family_id,
  child_id,
  date_trunc('month', report_date::timestamp)::date as month_start_date,
  count(*) as session_count,
  coalesce(sum(duration_minutes), 0) as total_minutes
from wearing_sessions
where
  status = 'closed'
  and deleted_at is null
group by family_id, child_id, date_trunc('month', report_date::timestamp)::date;
