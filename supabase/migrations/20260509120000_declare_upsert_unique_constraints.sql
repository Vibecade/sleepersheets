-- Declare the (league_id, player_id) uniqueness that upserts already rely on.
--
-- `player_salaries` and `player_contracts` are both written with
-- `.upsert(..., { onConflict: 'league_id,player_id' })` from several places
-- in the app, and now from the process-waivers edge function too. That
-- syntax requires a matching unique index — without one PostgREST fails
-- with "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification".
--
-- The live database has this uniqueness (verified: 946/946 distinct keys in
-- player_salaries, 190/190 in player_contracts), but it was added outside
-- version control, so it exists in production and nowhere else. A fresh
-- `supabase db reset` would produce a schema where every salary and contract
-- write fails. This migration closes that gap so the schema is reproducible.
--
-- Written to be safe to run against the existing database: it checks
-- pg_index, which covers UNIQUE CONSTRAINTs and bare UNIQUE INDEXes alike,
-- and only adds a constraint where neither is present.
--
-- Note: if a table somehow contains duplicate (league_id, player_id) rows,
-- ADD CONSTRAINT will fail. That is intentional — failing loudly is better
-- than silently discarding one of two conflicting salaries.

DO $$
DECLARE
  target_table text;
  already_unique boolean;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['player_salaries', 'player_contracts'] LOOP
    SELECT EXISTS (
      SELECT 1
      FROM pg_index i
      JOIN pg_class t ON t.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      WHERE n.nspname = 'public'
        AND t.relname = target_table
        AND i.indisunique
        -- Partial and expression indexes don't satisfy an ON CONFLICT
        -- target, so they don't count as "already covered".
        AND i.indpred IS NULL
        AND i.indexprs IS NULL
        AND (
          -- indkey is int2vector; cast so unnest() applies. Column order
          -- is irrelevant to ON CONFLICT matching, hence sorting both
          -- sides and comparing as sets.
          SELECT array_agg(att.attname::text ORDER BY att.attname::text)
          FROM unnest(i.indkey::int2[]) AS k(attnum)
          JOIN pg_attribute att
            ON att.attrelid = t.oid
           AND att.attnum = k.attnum
        ) = ARRAY['league_id', 'player_id']
    ) INTO already_unique;

    IF already_unique THEN
      RAISE NOTICE 'public.% already has a unique index on (league_id, player_id) — skipping', target_table;
    ELSE
      RAISE NOTICE 'adding unique constraint on public.%(league_id, player_id)', target_table;
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I UNIQUE (league_id, player_id)',
        target_table,
        target_table || '_league_id_player_id_key'
      );
    END IF;
  END LOOP;
END $$;

-- processed_transactions already declares UNIQUE(league_id, transaction_id)
-- in its CREATE TABLE, so the edge function's onConflict target there is
-- covered by version control already.
