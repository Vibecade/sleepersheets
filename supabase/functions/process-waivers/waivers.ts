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

  // Oldest first so a later claim overwrites an earlier one for the same
  // player. Transactions without an id can't be recorded as processed, so
  // they're skipped rather than risking an endless reprocess loop.
  const ordered = [...(transactions || [])].filter(
    (tx): tx is SleeperTransactionLike => Boolean(tx?.transaction_id),
  );

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
