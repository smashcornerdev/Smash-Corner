-- Smash Corner · every-minute job (spec §18 Scheduled jobs): call the tick Supabase Edge Function (supabase/functions/tick).
-- Run AFTER deploying the function (supabase functions deploy tick --no-verify-jwt) and setting its secrets.
-- Replace the two placeholders first:
--   <PROJECT_REF>  the Supabase project ref, e.g. abcdefghijklmnop (from https://<PROJECT_REF>.supabase.co)
--   <CRON_SECRET>  the same value as the CRON_SECRET Edge Function secret
-- The secret is kept in Supabase Vault, not in the job text. Safe to run again: it replaces the secrets and the job, so it
-- also moves an older setup (which called the website's /api/cron/tick) over to the Edge Function.

create extension if not exists pg_cron;
create extension if not exists pg_net;

delete from vault.secrets where name in ('smashcorner_cron_secret', 'smashcorner_tick_url', 'smashcorner_site_url');
select vault.create_secret('WC1z3_QGMGuhF3XEg6UmPJ85FF3UW3rwsEbtj1xVy1c', 'smashcorner_cron_secret');
select vault.create_secret('https://aqkmwgzluhzqrivrbqju.supabase.co/functions/v1/tick', 'smashcorner_tick_url');

select cron.unschedule(jobid) from cron.job where jobname = 'smashcorner-tick';
select cron.schedule(
  'smashcorner-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'smashcorner_tick_url'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'smashcorner_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);
