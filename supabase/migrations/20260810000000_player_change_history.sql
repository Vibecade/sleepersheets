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
  -- Which value changed. Both tables funnel into one history so that
  -- "what happened to this player" is a single query rather than a union.
  field TEXT NOT NULL CHECK (field IN ('salary', 'contract_length')),
  previous_value INTEGER,
  new_value INTEGER,
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
 * Records one salary or contract change.
 *
 * Attached with the changing column's name as the first trigger argument,
 * so one function serves both tables.
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
  v_field TEXT := TG_ARGV[0];
  v_previous INTEGER;
  v_new INTEGER;
  v_league TEXT;
  v_player TEXT;
  v_actor UUID := auth.uid();
  v_source TEXT;
  v_batch UUID;
  v_operation TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_operation := 'delete';
    v_previous  := (to_jsonb(OLD) ->> v_field)::INTEGER;
    v_new       := NULL;
    v_league    := OLD.league_id;
    v_player    := OLD.player_id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_operation := 'update';
    v_previous  := (to_jsonb(OLD) ->> v_field)::INTEGER;
    v_new       := (to_jsonb(NEW) ->> v_field)::INTEGER;
    v_league    := NEW.league_id;
    v_player    := NEW.player_id;
    -- The app upserts salaries on load, so most updates change nothing.
    -- Recording those would bury the real changes in noise.
    IF v_previous IS NOT DISTINCT FROM v_new THEN
      RETURN NEW;
    END IF;
  ELSE
    v_operation := 'insert';
    v_previous  := NULL;
    v_new       := (to_jsonb(NEW) ->> v_field)::INTEGER;
    v_league    := NEW.league_id;
    v_player    := NEW.player_id;
  END IF;

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

  INSERT INTO public.player_change_history (
    league_id, player_id, field, previous_value, new_value,
    operation, source, changed_by, batch_id
  ) VALUES (
    v_league, v_player, v_field, v_previous, v_new,
    v_operation, v_source, v_actor, v_batch
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS record_salary_change ON public.player_salaries;
CREATE TRIGGER record_salary_change
  AFTER INSERT OR UPDATE OR DELETE ON public.player_salaries
  FOR EACH ROW EXECUTE FUNCTION public.record_player_change('salary');

DROP TRIGGER IF EXISTS record_contract_change ON public.player_contracts;
CREATE TRIGGER record_contract_change
  AFTER INSERT OR UPDATE OR DELETE ON public.player_contracts
  FOR EACH ROW EXECUTE FUNCTION public.record_player_change('contract_length');
