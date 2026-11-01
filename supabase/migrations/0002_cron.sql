-- Hourly reminder job. Replace <PROJECT_REF> and <CRON_SECRET> before running.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'bilghayb-daily-push',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-push',
    headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Daily cleanup at 03:17 UTC: keeps the database well under the free 500 MB.
select cron.schedule('bilghayb-cleanup', '17 3 * * *', $$ select public.cleanup_old_rows(); $$);
