/**
 * Pure waiver-pricing logic, shared shape with the client-side
 * `useTransactionProcessor`.
 *
 * Deliberately free of Deno APIs, network calls, and Supabase clients so
 * the whole decision layer can be unit-tested by the project's normal
 * vitest suite. `index.ts` is the thin Deno shell that supplies IO.
 *
 * Behaviour must stay in step with src/hooks/useTransactionProcessor.tsx —
 * if the two disagree, the same waiver gets priced differently depending
 * on whether a commissioner happened to have the app open. The tests
 * alongside this file pin the rules that matter.
 */

export interface SleeperTransactionLike {
  transaction_id?: string;
  type?: string;
  status?: string;
  settings?: { waiver_bid?: number } | null;
  adds?: Record<string, unknown> | null;
  /** Epoch ms. Sleeper populates one or both; used to order claims. */
  created?: number | null;
  status_updated?: number | null;
}

export interface WaiverSalaryWrite {
  playerId: string;
  rosterId: number;
  salary: number;
}

export interface WaiverPlan {
  /** Salary rows to upsert, deduped so a player appears at most once. */
  writes: WaiverSalaryWrite[];
  /** Transaction ids to record as processed once the writes succeed. */
  transactionIds: string[];
  /** Transactions skipped because they were already recorded. */
  alreadyProcessed: number;
}

export const MAX_WEEKS = 22;

/**
 * Which weeks a run should sweep, from week 1 up to Sleeper's `leg`.
 *
 * Sweeping the whole season so far — rather than just the last week or
 * two — is what makes the job safe to enable midseason and safe to
 * recover from an outage. A narrow window silently assumes the job has
 * run continuously since week 1; when it hasn't, the skipped weeks are
 * never revisited and those players stay unpriced permanently.
 *
 * The cost is Sleeper reads only: already-processed transactions are
 * filtered against processed_transactions, so a caught-up league plans
 * zero writes however many weeks are fetched. `lookback` narrows the
 * range for cheap runs once a league is known to be current.
 */
export const weeksToSweep = (leg: unknown, lookback?: number): number[] => {
  const current =
    typeof leg === 'number' && leg >= 1 && leg <= MAX_WEEKS
      ? Math.floor(leg)
      : MAX_WEEKS;
  const first = lookback && lookback > 0 ? Math.max(1, current - lookback + 1) : 1;
  const weeks: number[] = [];
  for (let week = first; week <= current; week += 1) weeks.push(week);
  return weeks;
};

/**
 * A transaction prices players only if it's a completed waiver claim that
 * carries a FAAB bid. A bid of 0 is falsy and therefore excluded, matching
 * the client — a $0 pickup gets no auto-price and surfaces in the
 * commissioner Pricing panel instead.
 */
export const isWaiverTransaction = (tx: SleeperTransactionLike): boolean =>
  tx?.type === 'waiver' &&
  tx?.status === 'complete' &&
  typeof tx?.settings?.waiver_bid === 'number' &&
  tx.settings.waiver_bid > 0;

/**
 * The salary rows a single transaction implies: every added player is
 * priced at the winning bid, charged to the roster the player landed on.
 */
export const extractWaiverWrites = (
  tx: SleeperTransactionLike,
): WaiverSalaryWrite[] => {
  if (!isWaiverTransaction(tx)) return [];

  const bid = tx.settings!.waiver_bid as number;
  const adds = tx.adds || {};

  return Object.entries(adds).flatMap(([playerId, rosterId]) => {
    if (!playerId) return [];
    if (typeof rosterId !== 'number') return [];
    return [{ playerId, rosterId, salary: bid }];
  });
};

/**
 * Turn a league's transaction log into the work a single run should do.
 *
 * Idempotency comes from `processedTransactionIds` (backed by the
 * `processed_transactions` table's UNIQUE(league_id, transaction_id)), so
 * re-running is safe and a partially-failed run resumes cleanly.
 *
 * Later transactions win when the same player appears more than once, so
 * a player claimed twice in the window ends up priced at the most recent
 * bid rather than whichever row happened to be written last.
 */
export const planWaiverWrites = ({
  transactions,
  processedTransactionIds,
}: {
  transactions: SleeperTransactionLike[];
  processedTransactionIds: Set<string>;
}): WaiverPlan => {
  const byPlayer = new Map<string, WaiverSalaryWrite>();
  const transactionIds: string[] = [];
  let alreadyProcessed = 0;

  // Sort oldest-first so a later claim overwrites an earlier one for the
  // same player. This must be an explicit sort, not an assumption about
  // API order: index.ts concatenates several weeks' responses unchanged,
  // and Sleeper doesn't guarantee ordering within a week either. Getting
  // it wrong is unrecoverable — once both claims are marked processed,
  // nothing revisits them, so a stale salary sticks permanently.
  //
  // Transactions without an id can't be recorded as processed, so they're
  // skipped rather than risking an endless reprocess loop.
  const timestampOf = (tx: SleeperTransactionLike): number =>
    tx.created ?? tx.status_updated ?? 0;

  const ordered = [...(transactions || [])]
    .filter((tx): tx is SleeperTransactionLike => Boolean(tx?.transaction_id))
    .sort((a, b) => timestampOf(a) - timestampOf(b));

  for (const tx of ordered) {
    const id = tx.transaction_id as string;

    if (processedTransactionIds.has(id)) {
      alreadyProcessed += 1;
      continue;
    }
    if (!isWaiverTransaction(tx)) continue;

    const writes = extractWaiverWrites(tx);
    if (writes.length === 0) continue;

    for (const write of writes) {
      byPlayer.set(write.playerId, write);
    }
    transactionIds.push(id);
  }

  return {
    writes: [...byPlayer.values()],
    transactionIds,
    alreadyProcessed,
  };
};

/** A row of `league_automation_settings`, as the job reads it. */
export interface AutomationSettingsLike {
  league_id?: string | null;
  auto_waiver_pricing?: boolean | null;
  paused_at?: string | null;
}

export interface LeagueSelection {
  /** Leagues this run may write to. */
  enabled: string[];
  /** Leagues deliberately left alone, and why. */
  skipped: Array<{ leagueId: string; reason: string }>;
}

/**
 * Decides which owned leagues this run is allowed to touch.
 *
 * Ownership alone used to be the whole test, which meant claiming a league
 * silently enrolled it in automated salary writes. Now a league must have
 * opted in, and must not be paused.
 *
 * Absence of a settings row means off, not on: a league nobody has configured
 * is exactly the league that should not be written to unattended.
 *
 * Skips are returned rather than dropped so the run summary can say what it
 * declined to do. A job that quietly does nothing looks identical to a job
 * that is broken.
 */
export const selectAutomatedLeagues = (
  ownedLeagueIds: string[],
  automationRows: AutomationSettingsLike[],
): LeagueSelection => {
  const settingsByLeague = new Map<string, AutomationSettingsLike>();
  for (const row of automationRows || []) {
    if (row?.league_id) settingsByLeague.set(String(row.league_id), row);
  }

  const enabled: string[] = [];
  const skipped: Array<{ leagueId: string; reason: string }> = [];

  for (const leagueId of [...new Set(ownedLeagueIds || [])]) {
    const settings = settingsByLeague.get(leagueId);

    if (!settings) {
      skipped.push({ leagueId, reason: 'automation not configured' });
      continue;
    }
    if (settings.paused_at) {
      skipped.push({ leagueId, reason: 'automation paused' });
      continue;
    }
    if (!settings.auto_waiver_pricing) {
      skipped.push({ leagueId, reason: 'waiver pricing not enabled' });
      continue;
    }
    enabled.push(leagueId);
  }

  return { enabled, skipped };
};
