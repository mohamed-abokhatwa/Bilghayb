-- Run in Supabase → SQL Editor AFTER deploying the daily-push function.
-- Replace PASTE-YOUR-CRON-SECRET below with the same text
-- you saved as the CRON_SECRET secret in Edge Functions → Secrets.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Hourly: sends morning / last-third-of-night / Friday reminders at each user's local time.
select cron.schedule(
  'bilghayb-daily-push',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://gbwauitktbtiwsmozvhr.supabase.co/functions/v1/daily-push',
    headers := '{"Content-Type":"application/json","x-cron-secret":"PASTE-YOUR-CRON-SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Daily at 03:17 UTC: deletes old prayer rows so the database stays inside the free plan.
select cron.schedule('bilghayb-cleanup', '17 3 * * *', $$ select public.cleanup_old_rows(); $$);
