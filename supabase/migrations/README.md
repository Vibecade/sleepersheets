# Migrations

## Pending: quest snapshots

`20260226101500_quest_snapshots.sql` is **in this repo but has never been
applied to production**. Until it is, `gamification_quest_snapshots` does not
exist and every read returns `PGRST205` / HTTP 404.

The app handles this: `useQuestSnapshots` detects the missing table via
`isMissingTableError` and turns snapshot history off quietly. Weekly quests
themselves are computed client-side and are unaffected — the only loss is
week-over-week history. Applying the migration turns the feature on; no code
change is needed.

The migration has been verified to apply cleanly against a scratch Postgres 16
with its prerequisites in place (`public.league_ownership`, `auth.uid()`,
`public.validate_league_before_insert()`, `public.update_updated_at_column()` —
all of which exist in production). It creates the table, two RLS policies, two
triggers, and a lookup index.

```bash
supabase db push
```

## The repo and the live database have drifted in both directions

Worth knowing before you trust `supabase db reset`:

- **In the repo, not in production** — the quest snapshots table above.
- **In production, not in the repo** — `public.league_ownership` is not
  created by any migration, and the `(league_id, player_id)` unique
  constraints on `player_salaries` / `player_contracts` were added by hand
  before `20260509120000_declare_upsert_unique_constraints.sql` back-filled
  them into version control.

Because `league_ownership` is missing from the migration set, a from-scratch
`supabase db reset` will fail on the quest-snapshots migration, whose RLS
policy references that table. Closing that gap means capturing the live schema
as a baseline migration — worth doing, not yet done.
