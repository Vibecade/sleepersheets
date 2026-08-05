/**
 * Ordering helpers for waiver processing.
 *
 * Waiver salary writes are last-write-wins per player, so the order they
 * are applied in decides the final value. `fetchLeagueData` concatenates
 * each week's transactions in week order but does not sort within a week,
 * so processing in array order is not safe to assume.
 *
 * Mirrors the sort in supabase/functions/process-waivers/waivers.ts —
 * a claim priced by the client and the same claim priced by the scheduled
 * job must land on the same number.
 */

export interface WaiverOrderable {
  /** Epoch ms. Sleeper populates one or both. */
  created?: number | string | null;
  status_updated?: number | string | null;
}

/**
 * Epoch ms for a transaction, falling back through the fields Sleeper
 * actually populates. Unparseable or missing timestamps sort first, so an
 * undated claim can never displace a dated one.
 */
export const waiverTimestamp = (transaction: WaiverOrderable): number => {
  const raw = transaction?.created ?? transaction?.status_updated ?? 0;
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

/**
 * Oldest first, so a later claim for the same player overwrites an
 * earlier one rather than the reverse. Does not mutate the input.
 */
export const sortWaiversOldestFirst = <T extends WaiverOrderable>(
  transactions: T[],
): T[] =>
  [...(transactions || [])].sort((a, b) => waiverTimestamp(a) - waiverTimestamp(b));
