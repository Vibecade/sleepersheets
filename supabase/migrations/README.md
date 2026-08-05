# Migrations

## The folder can now build a database from scratch

It could not before. Nine tables — including every table that holds money —
were created outside version control and existed only in production, so the
very first migration was an `ALTER TABLE` on a table defined nowhere.
`supabase db reset` had never once succeeded, which is why no non-production
environment existed and why no migration was ever tested before being applied.

Two things fixed it:

- **`00000000000000_baseline_schema.sql`** defines the nine missing tables:
  `profiles`, `league_ownership`, `league_settings`, `player_salaries`,
  `player_contracts`, `dead_cap_players`, `league_drafts`, `draft_picks`,
  `league_transactions`.
- **Two byte-identical duplicate migrations were emptied.**
  `20250910052006` was a verbatim copy of `20250910051942` — unguarded
  `CREATE TABLE`/`FUNCTION`/`POLICY`/`TRIGGER` — and aborted any rebuild.
  `20250910050458` duplicated `20250910050447` the same way. Both were emptied
  rather than deleted, so the versions recorded in production's
  `supabase_migrations.schema_migrations` still have corresponding files.

`npm run check:migrations` applies the whole folder to an empty Postgres and is
gated in CI, so this cannot silently rot again.

### The baseline is a no-op against production

Every statement in it is guarded by an existence check on its table, so
applying it to a database that already has these tables changes nothing — no
columns, no policies, no indexes. CI asserts that property on every run by
re-applying it and comparing the catalog before and after.

It reconstructs the schema **as it stood before the first migration**, not as
it stands today. Later migrations still do the evolving: `20250904192508` adds
`profiles.sleeper_username`, `20250910042954` adds
`player_salaries.acquisition_type`, and `20260509120000` adds the
`(league_id, player_id)` unique constraints. Putting any of those in the
baseline would make those migrations fail on a fresh database.

Column names and types were reconstructed from
`src/integrations/supabase/types.ts`, which is generated from the live
database. **Production remains the source of truth** — where the baseline
disagrees, production wins and the baseline should be corrected. Two known
imprecisions:

- The **write-side RLS policies** in the baseline are a reconstruction of
  intent, not a copy. `20250904210113` drops the permissive policies and notes
  "keep the existing restrictive owner-only modification policies" — policies
  that were never committed, so what production actually enforces is unknown
  from the repo. The baseline creates owner-only write policies under names
  that no migration drops. Because it never touches an existing database,
  this does not change production; it only gives a fresh database a sane
  equivalent.
- `league_transactions.roster_ids` is not in the generated types, but
  `20250910044036` reads `lt.roster_ids[1]`, so the column must exist for that
  migration to run. It is included as `INTEGER[]`.

## Pending: quest snapshots

`20260226101500_quest_snapshots.sql` is **in this repo but has never been
applied to production**. Until it is, `gamification_quest_snapshots` does not
exist and every read returns `PGRST205` / HTTP 404.

The app handles this: `useQuestSnapshots` detects the missing table via
`isMissingTableError` and turns snapshot history off quietly. Weekly quests
themselves are computed client-side and are unaffected — the only loss is
week-over-week history. Applying the migration turns the feature on; no code
change is needed.

```bash
supabase db push
```

## Applying the baseline to production

You almost certainly do not need to. Production already has every table the
baseline defines, and the baseline is a no-op there by construction.

Its purpose is to make fresh databases — local, CI, a staging project —
reproducible. If you do push it, note that its `00000000000000` version sorts
before every already-applied migration, so the Supabase CLI may skip it as
out-of-order; `supabase db push --include-all` applies it, harmlessly.

## Still outstanding

- **No change history.** Nothing records who changed a salary or contract, or
  what the previous value was, so "why did my cap change?" has no answer. The
  scheduled waiver function writes with the service-role key and logs no audit
  row at all.
- **`league_settings` INSERT is open.** `20250904221709` creates
  "Allow creation of default league settings" with `WITH CHECK (true)`, so
  anyone can seed cap settings for any unclaimed league. `useLeagueSettings`
  depends on this to create defaults on first view, so tightening it needs a
  matching client change rather than a policy edit alone.
- **The waiver job's schedule is not in version control.** It exists only as a
  fenced SQL snippet in `supabase/functions/process-waivers/README.md`.
