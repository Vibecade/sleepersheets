-- Put the waiver job's schedule under version control.
--
-- It has lived until now as a fenced SQL snippet in
-- supabase/functions/process-waivers/README.md, applied by hand. That means
-- whether the job runs at all, how often, and against which project has been
-- unknowable from the repo — and a `supabase db reset` produced an
-- environment where it silently never runs.
--
-- WHY IT WAS NOT COMMITTED BEFORE, AND WHY THAT HAS CHANGED
--
-- The README is explicit that this was deliberate: "a migration would start
-- writing on the next deploy, before anyone has verified a run." That was the
-- right call at the time — ownership was the only gate, so scheduling it would
-- have begun writing to every claimed league immediately.
--
-- That gate has changed. Since 20260812000000 a league is only eligible when
-- its commissioner has switched on `auto_waiver_pricing`, and `paused_at`
-- stops it regardless. A newly scheduled job on a fresh deploy now writes to
-- nothing at all; it reports every league as skipped until somebody opts in.
-- The consent gate replaced the "don't schedule it" gate, so the schedule can
-- be reproducible without becoming dangerous.
--
-- SECRETS
--
-- The job needs the project URL and CRON_SECRET, and neither belongs in git.
-- They are read from Supabase Vault at schedule time, so this file references
-- them without containing them. An operator creates them once:
--
--   SELECT vault.create_secret('https://<ref>.supabase.co', 'project_url');
--   SELECT vault.create_secret('<the CRON_SECRET value>', 'cron_secret');
--
-- SAFE WHERE IT CANNOT RUN
--
-- Plain Postgres has no pg_cron, pg_net or Vault, so this migration checks for
-- each and does nothing but raise a notice when they are absent. That keeps
-- `supabase db reset`, local development and the CI migration check working,
-- rather than making a scheduler a prerequisite for having a database.

DO $$
DECLARE
  v_project_url TEXT;
  v_cron_secret TEXT;
  v_command TEXT;
BEGIN
  -- 1. Extensions. Installed only where the binaries actually exist.
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net;
  END IF;

  IF to_regproc('cron.schedule') IS NULL OR to_regproc('net.http_post') IS NULL THEN
    RAISE NOTICE 'pg_cron/pg_net unavailable — skipping waiver schedule. This is expected outside Supabase.';
    RETURN;
  END IF;

  -- 2. Secrets, from Vault rather than from this file.
  IF to_regclass('vault.decrypted_secrets') IS NULL THEN
    RAISE NOTICE 'Vault unavailable — skipping waiver schedule.';
    RETURN;
  END IF;

  SELECT decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets WHERE name = 'project_url';
  SELECT decrypted_secret INTO v_cron_secret
  FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF v_project_url IS NULL OR v_cron_secret IS NULL THEN
    RAISE NOTICE 'Vault secrets project_url and/or cron_secret are not set — skipping waiver schedule.';
    RAISE NOTICE 'Create them, then re-run this migration:';
    RAISE NOTICE '  SELECT vault.create_secret(''https://<ref>.supabase.co'', ''project_url'');';
    RAISE NOTICE '  SELECT vault.create_secret(''<CRON_SECRET>'', ''cron_secret'');';
    RETURN;
  END IF;

  -- 3. Schedule. Unschedule first so re-running updates rather than
  --    duplicating — cron.schedule with an existing name would otherwise
  --    leave two jobs racing each other.
  PERFORM cron.unschedule('process-waivers')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'process-waivers');

  -- apply=true is correct now that eligibility is opt-in. A dry-run schedule
  -- would price nothing and quietly defeat the purpose; the consent check in
  -- selectAutomatedLeagues is what keeps this from touching a league whose
  -- commissioner has not asked for it.
  v_command := format(
    $cmd$SELECT net.http_post(
      url     := %L,
      headers := jsonb_build_object('x-cron-secret', %L)
    );$cmd$,
    v_project_url || '/functions/v1/process-waivers?apply=true',
    v_cron_secret
  );

  -- Waivers clear once or twice a week; every six hours is ample and keeps the
  -- full-season sweep cheap. The sweep is what makes an occasional missed run
  -- harmless — the next pass backfills it.
  PERFORM cron.schedule('process-waivers', '0 */6 * * *', v_command);

  RAISE NOTICE 'Scheduled process-waivers every 6 hours.';
END $$;
