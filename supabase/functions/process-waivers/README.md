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
**released**, a `dead_cap_players` row is written holding the player's
**undiscounted** salary — `calculateOptimizedSalaries` applies
`max(1, round(salary * 0.25))` when reading, so storing a pre-discounted
figure would charge the penalty twice.

### A release, not a drop

Sleeper models a trade as the traded player appearing in `drops` for the
sending roster and `adds` for the receiver — the same shape a release has from
the sender's side. Charging every drop bills a manager for trading a player
away. A drop only counts when the player is not re-added by the same
transaction, and `type: 'trade'` is excluded outright.

### Who is charged

Nothing in this codebase encoded dead cap eligibility before — `DeadCapManager`
asks a commissioner to pick a player and type a number. The rule follows what
the app already agrees a player was costing:

| Released player | Charged? |
|---|---|
| Carries a salary | Yes, on the full salary |
| Acquired with FAAB | No — contributes $0 to the cap while rostered, so releasing costs nothing |
| No salary on record | No |
| Traded away | No — not a release |
| Re-acquired since | No — see below |

It is deliberately **not** conditioned on `player_contracts`. Contract rows are
optional here — the pricing panel writes them only when a commissioner sets a
term, and the client processor skips them for FAAB — so requiring one would
make the feature silently do nothing for most releases.

### Salary state at the time of release

`player_salaries` is overwritten in place, so there is no historical salary to
read. The current row is only a sound basis while it still describes the player
as they were released, which is why a release is skipped when the player was
re-acquired afterwards. A contract player released in week 1 and re-signed via
FAAB in week 4 would otherwise be judged against the FAAB row — and the job
sweeps the whole season on every run, so this is the normal case, not an edge
one.

That under-charges exactly where the data cannot support a charge, and the
commissioner can add those by hand. Billing a manager on a number that was
never true is much worse.

### What stops it double-charging

`dead_cap_charges` — a record of every charge automation has made, kept
separately from the `dead_cap_players` rows it produces. Deriving idempotency
from those rows instead is wrong twice over: a commissioner who deletes an
entry they disagree with would have it silently re-created on the next sweep,
and there would be no way to tell an automatic charge from a manual one.

It is keyed by transaction as well as player, so a genuine second release of
the same player is charged again while a re-run of the same sweep is not.

The ledger row is written **before** the visible penalty. If a run dies between
the two, the league is under-charged and a commissioner adds it by hand; the
other order would re-charge on every sweep until someone noticed.

## What it records

Every run that actually writes something leaves an entry in
`league_activities`, surfaced as "Automated Changes" on the commissioner
Overview tab. It answers the question nothing could answer before: what did
this job do to my league's money while I wasn't looking.

Only real writes are recorded. The job sweeps every enabled league every six
hours, so recording runs that did nothing would bury the handful of entries
that matter under thousands that don't.

Two notes on the table, which was dead schema until now — defined, policied,
and never read or written by a line of application code:

- Its `activity_type` CHECK did not allow automation values. Reusing `'waiver'`
  would have made an automated charge indistinguishable from a human one in the
  very feed built to tell them apart, so the constraint was extended.
- Its INSERT policy was `WITH CHECK (true)`, meaning any authenticated caller
  could put entries in any league's feed. Harmless while nothing read the
  table; not harmless once a commissioner believes what it says. The policy is
  dropped — the job writes with the service-role key and needs no policy, so
  the feed is now unforgeable through PostgREST. Verified: neither a stranger
  nor the league's own owner can insert a row.

Each capability records its entry as soon as its own writes land, not once at
the end of the run. Dead cap commits first and `dead_cap_charges` suppresses it
on every future sweep, so a later waiver write throwing would otherwise lose
that entry permanently — for a charge that did happen.

Entries count players and carry their ids; the dashboard resolves names when it
renders. Naming them in the job would mean downloading Sleeper's ~5MB player
file on every run that writes anything, and a name baked in at write time
freezes while the rest of the app moves on.

Recording failures are swallowed deliberately. By that point the salaries and
dead cap are committed, and throwing would mark the run errored and leave the
transactions unprocessed — so the next sweep would try to write them again.
Losing a feed entry is a much smaller problem than repeating a money write
because the note about it failed.

**This is a pull, not a push.** It tells you what happened once you look.
Actual notification needs an outbound channel, which this app has none of.

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
