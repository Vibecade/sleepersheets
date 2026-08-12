# process-waivers

Scheduled waiver pricing.

Waiver pickups are priced from their FAAB bid. On the client that only happens
while someone with `canModifyLeague` has the app open (`useTransactionProcessor`),
so between Wednesday's waiver run and the commissioner's next visit every
manager's cap figure is short by the value of the pickups. This job closes that
window.

## Safety posture

This writes salary data with the **service-role key**, which bypasses RLS. It's
built to be hard to misuse:

| Guard | Behaviour |
|---|---|
| **Dry run by default** | Writes nothing unless `?apply=true`. A fresh deploy is inert. |
| **Per-league opt-in** | Ownership is not consent. A league is skipped unless it has enabled at least one capability (`auto_waiver_pricing`, `auto_dead_cap`) in `league_automation_settings`, and skipped again if `paused_at` is set. No settings row means off. |
| **Dead cap cannot double-charge** | Idempotency comes from the `dead_cap_players` rows themselves, not `processed_transactions` — so a re-run, or enabling dead cap long after waivers, never charges a team twice. |
| **Fails closed** | Returns 500 if `CRON_SECRET` is unset; 401 if the header doesn't match. |
| **Idempotent** | Skips anything already in `processed_transactions` (`UNIQUE(league_id, transaction_id)`). Re-running is a no-op. |
| **Self-healing** | Sweeps the whole season by default, so enabling it midseason or recovering from an outage backfills rather than leaving a permanent hole. |
| **Deterministic ordering** | Claims are sorted oldest-first by `created`/`status_updated`, so a player claimed twice lands on the later bid regardless of API ordering. |
| **Ordered writes** | Salaries land *before* transactions are marked processed, so a mid-run failure retries instead of being skipped forever. |
| **Narrow blast radius** | Only upserts `acquisition_type='faab'` salary rows for players named by a completed waiver claim. Never deletes. Never touches contracts. |
| **Explicit conflict target** | `onConflict: 'league_id,player_id'` — without it PostgREST inserts duplicates rather than updating. |

## Which leagues it touches

Owned **and** opted in. Claiming a league used to be the entire test, which
meant claiming enrolled you in having a background job write to your salary
table without ever being asked. A league is now only eligible when it has a
row in `league_automation_settings` with at least one capability enabled and
`paused_at IS NULL`. Capabilities travel with the league, so one run can price
waivers for one league and charge dead cap for another.

Commissioners control this from the Settings tab of the commissioner
dashboard. `paused_at` is the kill switch: it stops every capability for a
league while leaving the individual flags as they are, so resuming doesn't
mean remembering what was switched on.

**Leagues that are skipped are reported, not dropped.** The run summary lists
each one with a reason (`automation not configured`, `waiver pricing not
enabled`, `automation paused`) — a job that quietly does nothing looks
identical to a job that is broken.

```json
{
  "mode": "dry-run",
  "leagues": 1,
  "skipped": [{ "leagueId": "9876...", "reason": "automation not configured" }],
  ...
}
```

## Dead cap

Enabled separately, with `auto_dead_cap`. When a player carrying a salary is
dropped, a `dead_cap_players` row is written holding the player's
**undiscounted** salary — `calculateOptimizedSalaries` applies
`max(1, round(salary * 0.25))` when reading, so storing a pre-discounted
figure would charge the penalty twice.

Who is charged, and why that rule: nothing in this codebase encoded dead cap
eligibility before — `DeadCapManager` asks a commissioner to pick a player and
type a number. The rule here follows what the app already agrees a player was
costing:

| Dropped player | Charged? |
|---|---|
| Carries a salary | Yes, on the full salary |
| Acquired with FAAB | No — contributes $0 to the cap while rostered, so dropping costs nothing |
| No salary on record | No |

It is deliberately **not** conditioned on `player_contracts`. Contract rows
are optional here — the pricing panel writes them only when a commissioner
sets a term, and the client processor skips them for FAAB — so requiring one
would make the feature silently do nothing for most drops.

Idempotency comes from the existing `dead_cap_players` rows, not from
`processed_transactions`. A waiver claim usually drops a player too, so
sharing that key would let whichever capability ran first mark the transaction
done and starve the other — and enabling dead cap later would skip everything
already processed for waivers. One consequence, stated rather than hidden: a
player dropped twice by the same roster is charged once.

Every row is visible and editable in the Dead Cap manager, so a charge the
commissioner disagrees with can be corrected or removed.

## What it does

For each eligible league:

1. Read the league from Sleeper to get `settings.leg` (same "Sleeper is
   authoritative" convention the app uses for week resolution).
2. Fetch transactions for **week 1 through the current week**. Sweeping the whole
   season is what makes the job safe to enable midseason and safe to recover
   from an outage — a narrow window would assume it had run continuously since
   week 1, and any week it skipped would never be revisited. Pass
   `?lookback=N` to narrow the range once a league is known to be caught up;
   the extra cost is Sleeper reads only, since already-processed transactions
   plan zero writes.
3. Skip anything already in `processed_transactions`.
4. Price each added player at the winning bid.
5. Upsert salaries, then record the transaction ids.

Decision logic lives in [`waivers.ts`](./waivers.ts) — plain TypeScript, no Deno
APIs — and is covered by the project's vitest suite
([`waivers.test.ts`](./waivers.test.ts)). `index.ts` is the IO shell and is kept
thin because it can't be unit-tested the same way.

## Deploy

```bash
supabase functions deploy process-waivers
supabase secrets set CRON_SECRET="$(openssl rand -hex 32)"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.

## Verify before scheduling

Do these in order. Don't skip to the cron.

**1. Dry run, one league.** Reports what it *would* write, touching nothing:

```bash
curl -s -H "x-cron-secret: $CRON_SECRET" \
  "https://<project-ref>.supabase.co/functions/v1/process-waivers?league_id=<league_id>"
```

Check `totalPlanned` against the Pricing tab's badge count. If it's wildly
different, stop and work out why before applying anything.

**2. Apply to one league.** Then confirm in the UI that those players now carry
the salary you expect:

```bash
curl -s -H "x-cron-secret: $CRON_SECRET" \
  "https://<project-ref>.supabase.co/functions/v1/process-waivers?league_id=<league_id>&apply=true"
```

**3. Re-run the same command.** `totalWritten` should be `0` and
`alreadyProcessed` should be non-zero. That proves idempotency on real data.

**4. Dry run across all leagues** before enabling the schedule.

## Schedule

Committed, in `supabase/migrations/20260813000000_schedule_process_waivers.sql`.
It runs `process-waivers` every six hours with `apply=true`.

This used to be a snippet here that you applied by hand, deliberately: a
migration "would start writing on the next deploy, before anyone has verified
a run." That was right while ownership was the only gate. It no longer is —
since `20260812000000` a league is eligible only when its commissioner has
switched on `auto_waiver_pricing`, so a freshly scheduled job on a new deploy
writes to nothing and reports every league as skipped. Consent replaced
"don't schedule it", which is what makes the schedule safe to reproduce.

### Before it can run: two Vault secrets

The job needs the project URL and the shared secret, and neither belongs in
git, so the migration reads them from Vault. Create them once, then re-run the
migration:

```sql
SELECT vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
SELECT vault.create_secret('<the CRON_SECRET value>', 'cron_secret');
```

Until they exist the migration skips with a notice telling you this. It also
skips wherever `pg_cron`, `pg_net` or Vault are absent, so local development
and CI are unaffected — a scheduler is not a prerequisite for having a
database.

Re-running updates the job rather than duplicating it.

### Verifying before you enable a league

The steps above still apply, and they matter more than the schedule does. The
schedule existing does not mean anything gets written: nothing happens until a
commissioner enables `auto_waiver_pricing` for a specific league. Work through
the dry runs first, enable one league, confirm the numbers, then widen.

```sql
SELECT jobname, schedule FROM cron.job;
SELECT cron.unschedule('process-waivers');   -- to stop it entirely
```

To stop automation for a single league without touching the schedule, use the
Pause switch on that league's commissioner Settings tab.

## Relationship to the client processor

There is one implementation. `waivers.ts` is it, and
`src/hooks/useTransactionProcessor.tsx` imports from here via the `@edge`
alias — so a rule change lands in both paths at once and they cannot drift.

It used to be written out twice, with instructions in this file to keep the
copies in step by hand. They drifted anyway: the client tested
`settings?.waiver_bid` for truthiness, which accepts a **negative** bid and
wrote it through as a negative salary, while this file required
`typeof === 'number' && > 0` and skipped it. The same claim was priced
differently depending on whether a commissioner had the app open.

The direction of the dependency is deliberate. The canonical copy stays inside
`supabase/functions/` so that deploying the function never depends on files
outside it; the app reaches in, not the other way around. Keep this module free
of imports — it has to be loadable by both Deno and Vite.

The rules that matter (completed waivers only, bid must be a number greater
than zero, every added player priced at the winning bid) are pinned in
`waivers.test.ts`, which runs in the project's normal vitest suite.
