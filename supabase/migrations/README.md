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

## Change history

`20260810000000_player_change_history.sql` records every salary and contract
change in `player_change_history`, via an `AFTER INSERT OR UPDATE OR DELETE`
trigger on `player_salaries` and `player_contracts`.

A trigger rather than application code, because auditing written by hand has
already proven unreliable here: `commissioner_actions` covers five write
paths and misses the rest — including `usePlayerSalaries`, the main one — and
the calls that exist are fire-and-forget, so a mutation can succeed while its
audit row silently disappears. The scheduled waiver function bypasses the
client entirely. A trigger is the only place that sees every writer.

**`source` is derived, not trusted.** A caller may declare intent by setting
`app.change_source`, but when unset it falls back to whether the write carried
an authenticated user — service-role writes have no `auth.uid()`. An automated
change therefore cannot be mistaken for a human one just because a job forgot
to announce itself.

```sql
-- A job announcing itself, and grouping its writes so they can be reversed
-- together. This is how the season rollover will become undoable.
SET LOCAL app.change_source = 'rollover';
SET LOCAL app.change_batch  = '...uuid...';
```

**It watches every column that feeds the cap, not just `salary`.**
`getSalaryCapContribution()` charges $0 for an `acquisition_type` of `'faab'`
and 25% for a `taxi_squad` player, so flipping either moves a team's cap
number while the salary column sits still — and `updateTaxiSquadStatus()`
writes exactly that shape. Watching only `salary` would have left the most
common cap change with no explanation, which is the gap this table exists to
close. A write that moves two tracked columns records one row for each.

Values are stored as text because the tracked columns aren't all numbers
(`taxi_squad` is boolean, `acquisition_type` a string); callers reversing a
rollover cast back.

**No-op updates are not recorded.** The app upserts salaries on load, so most
writes leave a given column untouched; logging those would bury the real
changes.

The table is append-only from outside the database. Read access is limited to
league owners (it carries `changed_by` user ids); there are no INSERT, UPDATE
or DELETE policies at all, so the only writer is the `SECURITY DEFINER`
trigger. Verified: a league owner can read their league's history but cannot
delete, alter, or forge a row.

## Automation opt-in and kill switch

`20260812000000_league_automation_settings.sql` adds per-league consent for
background writes. Before it, the scheduled waiver job selected its work from
`league_ownership.is_active` alone — so claiming a league silently enrolled it
in having a job write to the salary table.

`auto_waiver_pricing` is **off by default** and there is no backfill. Enabling
existing leagues automatically would preserve current behaviour at the cost of
re-creating the exact thing this removes. Commissioners opt in from the
Settings tab; an operator can enable one directly:

```sql
INSERT INTO public.league_automation_settings (league_id, auto_waiver_pricing)
VALUES ('<league_id>', true)
ON CONFLICT (league_id) DO UPDATE SET auto_waiver_pricing = true;
```

`paused_at` is the kill switch — it stops every capability for a league
regardless of the individual flags, and leaves those flags intact so resuming
doesn't require remembering what was on.

**Why not columns on `league_settings`:** that table is created through a
policy with `WITH CHECK (true)`, so anyone can insert a row for any league —
the app depends on it to seed defaults on first view. A control whose whole
purpose is consent cannot inherit an open INSERT. Verified against a rebuilt
schema: a user who owns nothing can create a `league_settings` row for someone
else's league, and cannot create a `league_automation_settings` row for it.

## The waiver schedule

`20260813000000_schedule_process_waivers.sql` puts the job's cron entry under
version control. It previously existed only as a snippet in the edge
function's README, so whether the job ran, how often, and against which
project were all unknowable from the repo.

The project URL and `CRON_SECRET` are read from Supabase Vault at schedule
time, so the migration references them without containing them:

```sql
SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
SELECT vault.create_secret('<the CRON_SECRET value>', 'cron_secret');
```

It skips with a notice — rather than failing — wherever `pg_cron`, `pg_net` or
Vault are absent, or the secrets are unset. That keeps `supabase db reset`,
local development and the CI migration check working without a scheduler.

## Still outstanding

- **`league_settings` INSERT is open.** `20250904221709` creates
  "Allow creation of default league settings" with `WITH CHECK (true)`, so
  anyone can seed cap settings for any unclaimed league. `useLeagueSettings`
  depends on this to create defaults on first view, so tightening it needs a
  matching client change rather than a policy edit alone.
