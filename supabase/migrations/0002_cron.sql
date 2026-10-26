-- Smash Corner · scheduled job (spec §18): every minute, call the app's /api/cron/tick.
-- Run AFTER deploying the site. Replace the two placeholders first:
--   <SITE_URL>     e.g. https://smashcorner-qc.com   (staging: https://staging.smashcorner-qc.com)
--   <CRON_SECRET>  the same value as CRON_SECRET in the app's environment
-- The secret is kept in Supabase Vault, not in the job text.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<CRON_SECRET>', 'smashcorner_cron_secret');
select vault.create_secret('<SITE_URL>', 'smashcorner_site_url');

select cron.schedule(
  'smashcorner-tick',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'smashcorner_site_url') || '/api/cron/tick',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'smashcorner_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 50000
  );
  $$
);
