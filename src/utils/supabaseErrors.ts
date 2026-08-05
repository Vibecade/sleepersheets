/**
 * Helpers for telling apart "this feature's table was never deployed" from
 * "something actually went wrong".
 *
 * The distinction matters because the two need opposite handling. A genuine
 * failure — a broken policy, a bad payload, the network — should be loud, so
 * it gets noticed and fixed. A table that simply isn't in the database yet is
 * a deploy gap, not a runtime fault: the feature can't work, nothing the user
 * did caused it, and logging it as an error on every single page load just
 * buries the real errors underneath it.
 *
 * `gamification_quest_snapshots` is exactly that case today. Its migration
 * (supabase/migrations/20260226101500_quest_snapshots.sql) is in the repo but
 * has never been applied to production, so every load of the gamification hub
 * fires a request that comes back 404 and writes a red line to the console.
 */

/**
 * PostgREST error codes for "that relation isn't in the schema cache".
 *
 * PGRST205 is the modern code (returned as HTTP 404); PGRST202 is the older
 * spelling still emitted by some deployments. 42P01 is Postgres' own
 * undefined_table SQLSTATE, which surfaces when the request gets past the
 * schema cache and fails at the database.
 */
const MISSING_TABLE_CODES = new Set(['PGRST205', 'PGRST202', '42P01']);

interface MaybePostgrestError {
  code?: unknown;
  message?: unknown;
}

/**
 * True when `error` says the table does not exist.
 *
 * Deliberately narrow: it matches on the error codes rather than on the
 * message text wherever it can, so a genuine failure that happens to mention
 * a table name is never mistaken for a missing one. The message check is a
 * fallback for clients that drop the code, and requires both a "could not
 * find"/"does not exist" phrase and the word table.
 */
export const isMissingTableError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;

  const { code, message } = error as MaybePostgrestError;

  if (typeof code === 'string' && MISSING_TABLE_CODES.has(code)) {
    return true;
  }

  if (typeof message !== 'string') return false;

  const text = message.toLowerCase();
  const saysMissing = text.includes('could not find') || text.includes('does not exist');
  return saysMissing && text.includes('table');
};
