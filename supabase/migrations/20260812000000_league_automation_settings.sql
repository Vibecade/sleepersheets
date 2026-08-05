-- Per-league opt-in and a kill switch for automated writes.
--
-- Today the scheduled waiver function selects its work with nothing but
-- `league_ownership.is_active`, which means claiming a league silently opts
-- you into having a background job write to your salary table. Nobody agreed
-- to that, and there is no way to say no short of un-claiming the league.
--
-- Automation is now off unless a commissioner turns it on, and `paused_at`
-- stops everything for a league regardless of the individual flags — the
-- lever you reach for when something is going wrong and you want it to stop
-- now, without having to remember which capabilities were enabled.
--
-- WHY A SEPARATE TABLE, NOT COLUMNS ON league_settings
--
-- `league_settings` is created by a policy with `WITH CHECK (true)`
-- (20250904221709, "Allow creation of default league settings"), so anyone
-- may insert a settings row for any league — the app relies on that to seed
-- defaults on first view. Putting an automation flag behind an open INSERT
-- would let a stranger create a row for an unclaimed league with automation
-- already switched on. A control whose entire purpose is consent cannot
-- inherit that hole.

CREATE TABLE IF NOT EXISTS public.league_automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id TEXT NOT NULL UNIQUE,

  -- Off by default, deliberately. A league that has never been configured
  -- must not be written to by a background job.
  auto_waiver_pricing BOOLEAN NOT NULL DEFAULT false,

  -- The kill switch. Set, every capability stops for this league regardless
  -- of the flags above, and the flags keep their values so resuming doesn't
  -- require remembering what was on.
  paused_at TIMESTAMP WITH TIME ZONE,
  paused_reason TEXT,

  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.league_automation_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'league_automation_settings'
      AND policyname = 'League owners can manage automation settings'
  ) THEN
    -- Owner-only for every operation including SELECT and INSERT. Unlike
    -- league_settings there is no "anyone can create the default row" escape
    -- hatch: absent means off, which is the safe reading.
    CREATE POLICY "League owners can manage automation settings"
      ON public.league_automation_settings FOR ALL
      USING (EXISTS (
        SELECT 1 FROM public.league_ownership lo
        WHERE lo.league_id = league_automation_settings.league_id
          AND lo.user_id = auth.uid()
          AND lo.is_active = true))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.league_ownership lo
        WHERE lo.league_id = league_automation_settings.league_id
          AND lo.user_id = auth.uid()
          AND lo.is_active = true));
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_league_automation_settings_updated_at
  ON public.league_automation_settings;
CREATE TRIGGER update_league_automation_settings_updated_at
  BEFORE UPDATE ON public.league_automation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deliberately NOT backfilled with auto_waiver_pricing = true for existing
-- claimed leagues. Doing so would preserve current behaviour at the cost of
-- re-creating the exact thing this migration removes: automation running
-- against leagues whose owner never agreed to it. Commissioners opt in from
-- the Settings tab, or an operator can enable a specific league directly:
--
--   INSERT INTO public.league_automation_settings (league_id, auto_waiver_pricing)
--   VALUES ('<league_id>', true)
--   ON CONFLICT (league_id) DO UPDATE SET auto_waiver_pricing = true;
