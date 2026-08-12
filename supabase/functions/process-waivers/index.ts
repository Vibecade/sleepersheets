// Deno runtime. Not compiled by tsconfig.app.json (which only includes
// src/) and not linted by eslint — see eslint.config.js ignores. It IS
// type-checked, by `npm run check:edge` (deno check) in CI.
//
// All decision logic lives in ./waivers.ts, which is plain TS covered by
// the vitest suite. Keep this file thin enough to read in one sitting.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {
  planWaiverWrites,
  selectAutomatedLeagues,
  weeksToSweep,
  type AutomationSettingsLike,
  type LeagueCapabilities,
  type SleeperTransactionLike,
} from './waivers.ts';
import { planDeadCapWrites } from './deadCap.ts';
import { buildActivityRows } from './activity.ts';

const createDb = (url: string, serviceRoleKey: string) =>
  createClient(url, serviceRoleKey, { auth: { persistSession: false } });

/** Exactly the client `createDb` returns — avoids a generics mismatch. */
type Db = ReturnType<typeof createDb>;

const SLEEPER_API = 'https://api.sleeper.app/v1';

/**
 * Scheduled league bookkeeping.
 *
 * Named process-waivers because that is all it did originally, and renaming a
 * deployed function means redeploying under a new name and rewriting the cron
 * entry — not worth doing mid-season. It now also charges dead cap.
 *
 * Waiver pickups are priced from their FAAB bid. On the client that only
 * happens while someone with `canModifyLeague` has the app open, so
 * between Wednesday's waiver run and the commissioner's next visit every
 * manager's cap figure is short. This job closes that window.
 *
 * Safety posture — this writes salary data with the service-role key,
 * which bypasses RLS:
 *
 *   - Dry run unless `?apply=true`. A fresh deploy cannot write.
 *   - Requires a shared secret; fails closed if CRON_SECRET is unset.
 *   - Per-league opt-in. Ownership is no longer consent: a league must have
 *     `auto_waiver_pricing` enabled and must not be paused. Absence of a
 *     settings row means off.
 *   - Idempotent via processed_transactions (UNIQUE league_id,
 *     transaction_id). Re-running is a no-op.
 *   - Writes only two things: acquisition_type='faab' salary rows for
 *     players named by a completed waiver claim, and dead_cap_players rows
 *     for players dropped while carrying a salary.
 *   - Dead cap is idempotent through the dead_cap_players rows themselves,
 *     so a re-run cannot charge a team twice.
 *   - Never deletes, and never touches contracts.
 */

interface RunSummary {
  leagueId: string;
  week: number | null;
  weeksSwept: number;
  planned: number;
  written: number;
  alreadyProcessed: number;
  /** Dead cap rows this run would write, and did. */
  deadCapPlanned: number;
  deadCapWritten: number;
  error?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const fetchJson = async <T>(url: string): Promise<T | null> => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as T;
};

/**
 * Writes the feed entries for what a run actually did.
 *
 * Deliberately swallows its own failures. The salaries and dead cap are
 * already committed by this point, and throwing here would mark the run
 * errored and — worse — leave the transactions unprocessed, so the next sweep
 * would try to write them again. Losing a feed entry is a far smaller problem
 * than re-running a money write because the note about it failed.
 */
const recordActivity = async (
  supabase: Db,
  leagueId: string,
  waiverWrites: Array<{ playerId: string; salary: number }>,
  deadCapWrites: Array<{ playerId: string; salary: number }>,
): Promise<void> => {
  const rows = buildActivityRows({ leagueId, waiverWrites, deadCapWrites });
  if (rows.length === 0) return;

  const { error } = await supabase.from('league_activities').insert(rows);
  if (error) {
    console.error(`league_activities insert failed for ${leagueId}: ${error.message}`);
  }
};

const processLeague = async (
  supabase: Db,
  leagueId: string,
  capabilities: LeagueCapabilities,
  apply: boolean,
  lookback?: number,
): Promise<RunSummary> => {
  const summary: RunSummary = {
    leagueId,
    week: null,
    weeksSwept: 0,
    planned: 0,
    written: 0,
    alreadyProcessed: 0,
    deadCapPlanned: 0,
    deadCapWritten: 0,
  };

  try {
    const league = await fetchJson<{ settings?: { leg?: number } }>(
      `${SLEEPER_API}/league/${leagueId}`,
    );
    if (!league) {
      summary.error = 'league not found on Sleeper';
      return summary;
    }

    const weeks = weeksToSweep(league.settings?.leg, lookback);
    summary.week = weeks[weeks.length - 1] ?? null;
    summary.weeksSwept = weeks.length;

    const perWeek = await Promise.all(
      weeks.map((week) =>
        fetchJson<SleeperTransactionLike[]>(`${SLEEPER_API}/league/${leagueId}/transactions/${week}`),
      ),
    );
    const transactions = perWeek.flatMap((list) => list ?? []);

    const { data: processedRows, error: processedError } = await supabase
      .from('processed_transactions')
      .select('transaction_id')
      .eq('league_id', leagueId);
    if (processedError) throw processedError;

    const plan = capabilities.waiverPricing
      ? planWaiverWrites({
          transactions,
          processedTransactionIds: new Set(
            (processedRows ?? []).map((row) => String(row.transaction_id)),
          ),
        })
      : { writes: [], transactionIds: [], alreadyProcessed: 0 };

    summary.planned = plan.writes.length;
    summary.alreadyProcessed = plan.alreadyProcessed;

    // Dead cap is planned against the same transaction sweep but tracked
    // separately: its idempotency comes from the dead_cap_players rows
    // themselves, not processed_transactions. A waiver claim usually drops a
    // player too, so sharing that key would let whichever capability ran
    // first mark the transaction done and starve the other.
    let deadCapPlan: {
      writes: Array<{ transactionId: string; playerId: string; rosterId: number; salary: number }>;
    } = { writes: [] };

    if (capabilities.deadCap) {
      const [{ data: salaryRows, error: salaryError }, { data: chargeRows, error: chargeError }] =
        await Promise.all([
          supabase
            .from('player_salaries')
            .select('player_id, salary, acquisition_type')
            .eq('league_id', leagueId),
          // The charge ledger, NOT dead_cap_players. A commissioner who
          // deletes an entry they disagree with must not have it re-created
          // on the next sweep.
          supabase
            .from('dead_cap_charges')
            .select('transaction_id, player_id')
            .eq('league_id', leagueId),
        ]);
      if (salaryError) throw salaryError;
      if (chargeError) throw chargeError;

      deadCapPlan = planDeadCapWrites({
        transactions,
        salariesByPlayer: new Map(
          (salaryRows ?? []).map((row) => [String(row.player_id), row]),
        ),
        chargedKeys: new Set(
          (chargeRows ?? []).map((row) => `${row.transaction_id}:${row.player_id}`),
        ),
      });
      summary.deadCapPlanned = deadCapPlan.writes.length;
    }

    if (!apply) return summary;

    if (deadCapPlan.writes.length > 0) {
      // Ledger first, then the visible penalty. Ordered this way on purpose:
      // if the run dies between the two, the league is under-charged and a
      // commissioner adds it by hand. The other order would re-charge every
      // sweep until someone noticed.
      const { error: chargeWriteError } = await supabase.from('dead_cap_charges').insert(
        deadCapPlan.writes.map((w) => ({
          league_id: leagueId,
          transaction_id: w.transactionId,
          player_id: w.playerId,
          roster_id: w.rosterId,
          salary: w.salary,
        })),
      );
      if (chargeWriteError) throw chargeWriteError;

      const { error: deadCapWriteError } = await supabase.from('dead_cap_players').insert(
        deadCapPlan.writes.map((w) => ({
          league_id: leagueId,
          player_id: w.playerId,
          roster_id: w.rosterId,
          // Undiscounted. calculateOptimizedSalaries applies the penalty.
          salary: w.salary,
        })),
      );
      if (deadCapWriteError) throw deadCapWriteError;
      summary.deadCapWritten = deadCapPlan.writes.length;

      // Recorded here, not at the end of the run. The charge is committed and
      // dead_cap_charges will suppress it on every future sweep, so if a later
      // waiver write throws and we bail out, this is the only chance to record
      // it — the entry would otherwise be lost permanently for a charge that
      // did happen.
      await recordActivity(supabase, leagueId, [], deadCapPlan.writes);
    }

    if (plan.writes.length === 0) return summary;

    // onConflict is required: without it PostgREST inserts a new row
    // instead of updating, which would duplicate salary rows on every
    // run and make the effective salary nondeterministic.
    const { error: salaryError } = await supabase.from('player_salaries').upsert(
      plan.writes.map((w) => ({
        league_id: leagueId,
        player_id: w.playerId,
        salary: w.salary,
        acquisition_type: 'faab',
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'league_id,player_id' },
    );
    if (salaryError) throw salaryError;

    // Only mark processed AFTER the salaries land, so a failure mid-run
    // is retried next time rather than silently skipped forever.
    const { error: markError } = await supabase.from('processed_transactions').upsert(
      plan.transactionIds.map((transaction_id) => ({
        league_id: leagueId,
        transaction_id,
        player_updates: plan.writes,
      })),
      { onConflict: 'league_id,transaction_id' },
    );
    if (markError) throw markError;

    summary.written = plan.writes.length;

    // Dead cap already recorded its own entry above, if it wrote anything.
    await recordActivity(supabase, leagueId, plan.writes, []);
    return summary;
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
    return summary;
  }
};

Deno.serve(async (req: Request) => {
  const secret = Deno.env.get('CRON_SECRET');
  // Fail closed: an unset secret means the function is unconfigured, not
  // that anyone may call it.
  if (!secret) {
    return json({ error: 'CRON_SECRET is not configured' }, 500);
  }
  if (req.headers.get('x-cron-secret') !== secret) {
    return json({ error: 'unauthorized' }, 401);
  }

  const url = new URL(req.url);
  const apply = url.searchParams.get('apply') === 'true';
  const onlyLeague = url.searchParams.get('league_id');
  // Optional: limit the sweep to the last N weeks. Omitted = whole season
  // so far, which is what makes first-run and post-outage backfill work.
  const lookbackParam = Number(url.searchParams.get('lookback'));
  const lookback = Number.isFinite(lookbackParam) && lookbackParam > 0
    ? Math.floor(lookbackParam)
    : undefined;

  const supabase = createDb(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Ownership establishes who the league belongs to; it does not by itself
  // grant permission to write to it. That is what the automation settings are
  // for — see selectAutomatedLeagues.
  let query = supabase.from('league_ownership').select('league_id').eq('is_active', true);
  if (onlyLeague) query = query.eq('league_id', onlyLeague);

  const { data: owned, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const ownedLeagueIds = (owned ?? []).map((row) => String(row.league_id));

  const { data: automation, error: automationError } = await supabase
    .from('league_automation_settings')
    .select('league_id, auto_waiver_pricing, auto_dead_cap, paused_at');
  if (automationError) return json({ error: automationError.message }, 500);

  const { enabled: leagueIds, skipped } = selectAutomatedLeagues(
    ownedLeagueIds,
    (automation ?? []) as AutomationSettingsLike[],
  );

  const results: RunSummary[] = [];
  for (const { leagueId, capabilities } of leagueIds) {
    results.push(await processLeague(supabase, leagueId, capabilities, apply, lookback));
  }

  return json({
    mode: apply ? 'apply' : 'dry-run',
    sweep: lookback ? `last ${lookback} week(s)` : 'full season',
    leagues: leagueIds.length,
    // Reported, not dropped. A run that declined every league otherwise looks
    // exactly like a run that is broken.
    skipped,
    totalPlanned: results.reduce((n, r) => n + r.planned, 0),
    totalWritten: results.reduce((n, r) => n + r.written, 0),
    totalDeadCapPlanned: results.reduce((n, r) => n + r.deadCapPlanned, 0),
    totalDeadCapWritten: results.reduce((n, r) => n + r.deadCapWritten, 0),
    errors: results.filter((r) => r.error).length,
    results,
  });
});
