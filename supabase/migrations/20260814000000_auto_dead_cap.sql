-- Opt-in for automated dead cap, and the record of what it has charged.
--
-- Separate flag from auto_waiver_pricing on purpose. The two write different
-- data for different reasons, and a commissioner may reasonably want their
-- waiver claims priced automatically while still deciding dead cap penalties
-- by hand — dead cap is a league-rules judgement in a way that "price this
-- claim at the bid that won it" is not.
--
-- Off by default, like everything else here. `paused_at` still overrides it.

ALTER TABLE public.league_automation_settings
  ADD COLUMN IF NOT EXISTS auto_dead_cap BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.league_automation_settings.auto_dead_cap IS
  'Charge dead cap automatically when a player carrying a salary is released. '
  'Rows are written to dead_cap_players holding the undiscounted salary; the '
  'cap engine applies the penalty percentage when reading.';

-- ---------------------------------------------------------------------------
-- What automation has charged.
--
-- Kept separately from the dead_cap_players rows it produces, which is the
-- whole point. Using those rows as the idempotency record looks simpler and is
-- wrong twice over:
--
--   1. A commissioner who deletes an entry they disagree with would have it
--      silently re-created on the next sweep. The Dead Cap manager offers to
--      remove entries; that offer has to mean something.
--   2. There would be no way to tell an automatic charge from one a
--      commissioner entered by hand.
--
-- Keyed by transaction as well as player, so a genuine second release of the
-- same player is charged again while a re-run of the same season sweep is not.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dead_cap_charges (
  id BIGSERIAL PRIMARY KEY,
  league_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  roster_id INTEGER NOT NULL,
  -- The salary charged, as it stood at the time. Kept so a commissioner can
  -- see what automation believed rather than having to infer it.
  salary INTEGER NOT NULL,
  charged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (league_id, transaction_id, player_id)
);

ALTER TABLE public.dead_cap_charges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dead_cap_charges'
      AND policyname = 'League owners can view dead cap charges'
  ) THEN
    -- Read-only to owners. The only writer is the scheduled job, which uses
    -- the service-role key and bypasses RLS; there are no write policies, so
    -- the record cannot be edited away through PostgREST to force a re-charge.
    CREATE POLICY "League owners can view dead cap charges"
      ON public.dead_cap_charges FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.league_ownership lo
        WHERE lo.league_id = dead_cap_charges.league_id
          AND lo.user_id = auth.uid()
          AND lo.is_active = true));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dead_cap_charges_league
  ON public.dead_cap_charges (league_id, charged_at DESC);
