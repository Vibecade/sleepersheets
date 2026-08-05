// Deno runtime. Not compiled by tsconfig.app.json (which only includes
// src/) and not linted by eslint — see eslint.config.js ignores. It IS
// type-checked, by `npm run check:edge` (deno check) in CI.
//
// All decision logic lives in ./waivers.ts, which is plain TS covered by
// the vitest suite. Keep this file thin enough to read in one sitting.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import {
  planWaiverWrites,
  weeksToSweep,
  type SleeperTransactionLike,
} from './waivers.ts';

const createDb = (url: string, serviceRoleKey: string) =>
  createClient(url, serviceRoleKey, { auth: { persistSession: false } });

/** Exactly the client `createDb` returns — avoids a generics mismatch. */
type Db = ReturnType<typeof createDb>;

const SLEEPER_API = 'https://api.sleeper.app/v1';

/**
 * Scheduled waiver pricing.
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
 *   - Idempotent via processed_transactions (UNIQUE league_id,
 *     transaction_id). Re-running is a no-op.
 *   - Only ever writes acquisition_type='faab' salary rows for players
 *     named by a completed waiver claim.
 *   - Never deletes, and never touches contracts.
 */

interface RunSummary {
  leagueId: string;
  week: number | null;
  weeksSwept: number;
  planned: number;
  written: number;
  alreadyProcessed: number;
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

const processLeague = async (
  supabase: Db,
  leagueId: string,
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

    const plan = planWaiverWrites({
      transactions,
      processedTransactionIds: new Set(
        (processedRows ?? []).map((row) => String(row.transaction_id)),
      ),
    });

    summary.planned = plan.writes.length;
    summary.alreadyProcessed = plan.alreadyProcessed;

    if (!apply || plan.writes.length === 0) return summary;

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

  // Claimed leagues are the ones with an owner who expects this to run.
  let query = supabase.from('league_ownership').select('league_id').eq('is_active', true);
  if (onlyLeague) query = query.eq('league_id', onlyLeague);

  const { data: owned, error } = await query;
  if (error) return json({ error: error.message }, 500);

  const leagueIds = [...new Set((owned ?? []).map((row) => String(row.league_id)))];

  const results: RunSummary[] = [];
  for (const leagueId of leagueIds) {
    results.push(await processLeague(supabase, leagueId, apply, lookback));
  }

  return json({
    mode: apply ? 'apply' : 'dry-run',
    sweep: lookback ? `last ${lookback} week(s)` : 'full season',
    leagues: leagueIds.length,
    totalPlanned: results.reduce((n, r) => n + r.planned, 0),
    totalWritten: results.reduce((n, r) => n + r.written, 0),
    errors: results.filter((r) => r.error).length,
    results,
  });
});
