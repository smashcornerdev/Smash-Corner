-- Smash Corner · monthly report email (spec §19 Monthly report email, §18 Scheduled jobs, v6.21)
-- At 8:00 AM Manila time on the 1st of every month (00:00 UTC; Manila is UTC+8 with no DST), call the monthly-report
-- Supabase Edge Function, which emails every super-admin last month's report with an Excel file of the confirmed records.
--
-- Run AFTER 0002_cron.sql (it reuses the smashcorner_cron_secret Vault secret) and after deploying the function:
--   supabase functions deploy monthly-report --no-verify-jwt
--   supabase secrets set CRON_SECRET=<same as the app> RESEND_API_KEY=… SITE_URL=https://smashcorner-qc.com
-- Replace the placeholder first:
--   <PROJECT_REF>  the Supabase project ref, e.g. abcdefghijklmnop (from https://<PROJECT_REF>.supabase.co)

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/monthly-report', 'smashcorner_monthly_report_url');

select cron.schedule(
  'smashcorner-monthly-report',
  '0 0 1 * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'smashcorner_monthly_report_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'smashcorner_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
