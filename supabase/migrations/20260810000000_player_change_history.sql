-- Change history for salaries and contracts.
--
-- Nothing today can answer "why did my cap change?". Salary and contract rows
-- are overwritten in place, `commissioner_actions` covers only five of the
-- write paths in the app, and the primary one — `usePlayerSalaries` — logs
-- nothing at all. The scheduled waiver function writes with the service-role
-- key and records no audit row whatsoever, so a manager whose cap moved
-- overnight has no way to find out what happened.
--
-- This is also the prerequisite for undoing the annual contract rollover.
-- `player_contracts` stores only `contract_length`, with no start year to
-- recompute from, so a rollover is irreversible unless the previous values
-- were captured before it ran. `batch_id` groups a rollover's rows so the
-- whole thing can be reversed as a unit.
--
-- WHY A TRIGGER, NOT APPLICATION CODE
--
-- Auditing in this app is already written by hand in five places and missing
-- from the rest, and the calls that do exist are fire-and-forget (`void
-- logAction(...)`), so the mutation can succeed while its audit row silently
-- disappears. More importantly the edge function bypasses the client
-- entirely. A trigger is the only place that sees every writer, including
-- service-role writes that bypass RLS. It cannot be forgotten when a new
-- write path is added.

CREATE TABLE IF NOT EXISTS public.player_change_history (
  id BIGSERIAL PRIMARY KEY,
  league_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  -- Which column changed. Both tables funnel into one history so that
  -- "what happened to this player" is a single query rather than a union.
  --
  -- `salary` is not the only thing that moves a cap number.
  -- getSalaryCapContribution() charges $0 for an acquisition_type of 'faab'
  -- and 25% for a taxi_squad player, so flipping either changes a team's cap
  -- hit while the salary column sits still. updateTaxiSquadStatus() writes
  -- exactly that — same salary, different flag — and it would be the most
  -- common cap change with no explanation if this only watched `salary`.
  field TEXT NOT NULL CHECK (
    field IN ('salary', 'taxi_squad', 'acquisition_type', 'contract_length')
  ),
  -- Text rather than integer because the tracked columns aren't all numbers:
  -- taxi_squad is boolean and acquisition_type is an enum-ish string. Callers
  -- reversing a rollover cast back.
  previous_value TEXT,
  new_value TEXT,
  operation TEXT NOT NULL CHECK (operation IN ('insert', 'update', 'delete')),
  -- Who or what made the change. Derived, not trusted from the caller:
  -- see public.record_player_change().
  source TEXT NOT NULL,
  changed_by UUID,
  -- Set for changes applied as one logical operation (a season rollover),
  -- so they can be reversed together.
  batch_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.player_change_history ENABLE ROW LEVEL SECURITY;

-- Read is owner-only. Salary values themselves are world-readable, but this
-- table also carries `changed_by` user ids, and the audience for it is the
-- commissioner investigating a change.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'player_change_history'
      AND policyname = 'League owners can view change history'
  ) THEN
    CREATE POLICY "League owners can view change history"
      ON public.player_change_history FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.league_ownership lo
        WHERE lo.league_id = player_change_history.league_id
          AND lo.user_id = auth.uid()
          AND lo.is_active = true));
  END IF;
END $$;

-- No INSERT/UPDATE/DELETE policies exist, deliberately. The only writer is
-- the SECURITY DEFINER trigger below, which runs as the table owner and is
-- therefore exempt from RLS. History is append-only from every other angle:
-- nobody can rewrite or delete their own tracks through PostgREST.

CREATE INDEX IF NOT EXISTS idx_player_change_history_player
  ON public.player_change_history (league_id, player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_change_history_league
  ON public.player_change_history (league_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_change_history_batch
  ON public.player_change_history (batch_id) WHERE batch_id IS NOT NULL;

/**
 * Records every change to the columns it is asked to watch.
 *
 * The columns are passed as trigger arguments, so one function serves both
 * tables, and a write that moves two of them at once produces one row each
 * rather than collapsing into a single ambiguous entry.
 *
 * `source` is derived rather than taken on trust. A caller may declare intent
 * by setting `app.change_source` (the rollover job sets 'rollover', the
 * waiver function 'waiver_job'), but when it is unset the value falls back to
 * whether the write carried an authenticated user. Service-role writes have
 * no `auth.uid()`, so an automated change can never be mistaken for a human
 * one just because a job forgot to announce itself.
 */
CREATE OR REPLACE FUNCTION public.record_player_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- NULL on the side that doesn't exist for this operation, which makes the
  -- comparison below handle insert and delete without special cases.
  v_old JSONB := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_new JSONB := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;
  v_row JSONB := COALESCE(v_new, v_old);
  v_field TEXT;
  v_previous TEXT;
  v_next TEXT;
  v_actor UUID := auth.uid();
  v_source TEXT;
  v_batch UUID;
  v_operation TEXT := lower(TG_OP);
BEGIN
  v_source := COALESCE(
    NULLIF(current_setting('app.change_source', true), ''),
    CASE WHEN v_actor IS NULL THEN 'service_role' ELSE 'user' END
  );

  BEGIN
    v_batch := NULLIF(current_setting('app.change_batch', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    -- A malformed batch id must not cost us the history row.
    v_batch := NULL;
  END;

  FOREACH v_field IN ARRAY TG_ARGV LOOP
    v_previous := v_old ->> v_field;
    v_next     := v_new ->> v_field;

    -- The app upserts salaries on load, so most writes leave a given column
    -- untouched. Recording those would bury the real changes in noise.
    CONTINUE WHEN v_previous IS NOT DISTINCT FROM v_next;

    INSERT INTO public.player_change_history (
      league_id, player_id, field, previous_value, new_value,
      operation, source, changed_by, batch_id
    ) VALUES (
      v_row ->> 'league_id', v_row ->> 'player_id', v_field, v_previous, v_next,
      v_operation, v_source, v_actor, v_batch
    );
  END LOOP;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

-- Every column that feeds getSalaryCapContribution(), not just `salary`.
DROP TRIGGER IF EXISTS record_salary_change ON public.player_salaries;
CREATE TRIGGER record_salary_change
  AFTER INSERT OR UPDATE OR DELETE ON public.player_salaries
  FOR EACH ROW EXECUTE FUNCTION
    public.record_player_change('salary', 'taxi_squad', 'acquisition_type');

DROP TRIGGER IF EXISTS record_contract_change ON public.player_contracts;
CREATE TRIGGER record_contract_change
  AFTER INSERT OR UPDATE OR DELETE ON public.player_contracts
  FOR EACH ROW EXECUTE FUNCTION public.record_player_change('contract_length');
