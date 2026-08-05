-- Baseline schema: the tables the migration history has always assumed.
--
-- Nine tables — including every table that holds money — were created outside
-- version control and exist only in production. The migration folder has
-- therefore never been able to build a database from scratch: the very first
-- migration is `ALTER TABLE public.profiles ADD COLUMN sleeper_username`, and
-- `public.profiles` is defined nowhere. Anyone running `supabase db reset`
-- got an error on statement one, which is why no non-production environment
-- exists and why no migration has ever been tested before being applied.
--
-- This file closes that gap. It is dated 00000000000000 so it sorts ahead of
-- everything else and runs first on a fresh database.
--
-- SAFETY: every statement is wrapped in a check for the table's existence, so
-- against a database that already has these tables this migration does
-- literally nothing — no columns added, no policies created, no ownership
-- changed. That matters because production's write-side RLS was never
-- committed either, and this must not quietly redefine it.
--
-- The definitions reconstruct the schema as it stood *before* the first
-- migration, not as it stands today. Later migrations still do the evolving:
-- `20250904192508` adds `profiles.sleeper_username`, `20250910042954` adds
-- `player_salaries.acquisition_type`, and `20260509120000` adds the
-- (league_id, player_id) unique constraints. Including any of those here
-- would make those migrations fail on a fresh database, which is exactly the
-- class of bug this file exists to end.
--
-- Column names and types are reconstructed from
-- `src/integrations/supabase/types.ts`, which is generated from the live
-- database and is the closest thing to an authoritative record. Production
-- remains the source of truth; where this disagrees, production wins and this
-- file should be corrected.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );

  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- `20250911015723` drops and recreates these by name; creating them here
  -- keeps a fresh database protected in the meantime.
  CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);
END $$;

-- ---------------------------------------------------------------------------
-- league_ownership — the authorization root for nearly every other policy
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.league_ownership') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.league_ownership (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (league_id, user_id)
  );

  ALTER TABLE public.league_ownership ENABLE ROW LEVEL SECURITY;

  -- A user may claim a league for themselves and manage their own claim.
  -- Read access is granted by `20250904222502` ("Anyone can check if league
  -- is owned"), which is how the app shows an unclaimed league as claimable.
  CREATE POLICY "Users can claim leagues for themselves"
    ON public.league_ownership FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can manage their own league claims"
    ON public.league_ownership FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can release their own league claims"
    ON public.league_ownership FOR DELETE USING (auth.uid() = user_id);

  CREATE INDEX idx_league_ownership_league ON public.league_ownership (league_id, is_active);
  CREATE INDEX idx_league_ownership_user ON public.league_ownership (user_id);
END $$;

-- ---------------------------------------------------------------------------
-- Money tables.
--
-- Write policies are owner-only, matching the intent recorded in
-- `20250904210113` ("Keep the existing restrictive owner-only modification
-- policies") — policies that were never actually committed. The names below
-- are deliberately distinct from every name that migration drops, so the
-- cleanup it performs doesn't take these with it.
--
-- Read access is public and granted by later migrations; salary and contract
-- data is visible to the whole league by design.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.league_settings') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.league_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL UNIQUE,
    salary_cap INTEGER,
    faab_cap INTEGER,
    dead_cap_enabled BOOLEAN DEFAULT false,
    reserve_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );

  -- UNIQUE(league_id) is load-bearing: useLeagueSettings upserts with
  -- onConflict 'league_id', which fails without a matching unique index.
  ALTER TABLE public.league_settings ENABLE ROW LEVEL SECURITY;
  -- All four policies for this table are created by `20250904221709`.
END $$;

DO $$
BEGIN
  IF to_regclass('public.player_salaries') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.player_salaries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    salary INTEGER,
    taxi_squad BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );

  ALTER TABLE public.player_salaries ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "League owners can modify player salaries"
    ON public.player_salaries FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = player_salaries.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = player_salaries.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true));

  CREATE INDEX idx_player_salaries_league ON public.player_salaries (league_id);
END $$;

DO $$
BEGIN
  IF to_regclass('public.player_contracts') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.player_contracts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    contract_length INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );

  ALTER TABLE public.player_contracts ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "League owners can modify player contracts"
    ON public.player_contracts FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = player_contracts.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = player_contracts.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true));

  CREATE INDEX idx_player_contracts_league ON public.player_contracts (league_id);
END $$;

DO $$
BEGIN
  IF to_regclass('public.dead_cap_players') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.dead_cap_players (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    player_id TEXT NOT NULL,
    roster_id INTEGER NOT NULL,
    salary INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  );

  ALTER TABLE public.dead_cap_players ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "League owners can modify dead cap players"
    ON public.dead_cap_players FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = dead_cap_players.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = dead_cap_players.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true));

  CREATE INDEX idx_dead_cap_players_league ON public.dead_cap_players (league_id);
END $$;

-- ---------------------------------------------------------------------------
-- Sleeper mirror tables. Populated from the Sleeper API; read-only to users.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.league_drafts') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.league_drafts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    draft_id TEXT NOT NULL,
    season TEXT,
    season_type TEXT,
    sport TEXT,
    status TEXT,
    type TEXT,
    start_time BIGINT,
    settings JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (league_id, draft_id)
  );

  ALTER TABLE public.league_drafts ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "League owners can modify league drafts"
    ON public.league_drafts FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = league_drafts.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = league_drafts.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true));
END $$;

DO $$
BEGIN
  IF to_regclass('public.draft_picks') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.draft_picks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    draft_id TEXT NOT NULL,
    pick_no INTEGER NOT NULL,
    round INTEGER NOT NULL,
    roster_id INTEGER NOT NULL,
    player_id TEXT,
    picked_by TEXT,
    is_keeper BOOLEAN,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (draft_id, pick_no)
  );

  ALTER TABLE public.draft_picks ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "League owners can modify draft picks"
    ON public.draft_picks FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = draft_picks.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = draft_picks.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true));

  CREATE INDEX idx_draft_picks_league ON public.draft_picks (league_id);
END $$;

DO $$
BEGIN
  IF to_regclass('public.league_transactions') IS NOT NULL THEN RETURN; END IF;

  CREATE TABLE public.league_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    type TEXT,
    status TEXT,
    creator TEXT,
    week INTEGER,
    adds JSONB,
    drops JSONB,
    draft_picks JSONB,
    waiver_budget JSONB,
    consenter_ids JSONB,
    -- Not present in the generated types, but `20250910044036` reads
    -- `lt.roster_ids[1]`, so the column has to exist for that migration to
    -- run. Kept as the array type that subscript implies.
    roster_ids INTEGER[],
    settings JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (league_id, transaction_id)
  );

  ALTER TABLE public.league_transactions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "League owners can modify league transactions"
    ON public.league_transactions FOR ALL
    USING (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = league_transactions.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true))
    WITH CHECK (EXISTS (
      SELECT 1 FROM public.league_ownership lo
      WHERE lo.league_id = league_transactions.league_id
        AND lo.user_id = auth.uid() AND lo.is_active = true));

  CREATE INDEX idx_league_transactions_league ON public.league_transactions (league_id);
END $$;
