/**
 * Dead cap planning: what a league owes for players it dropped.
 *
 * Pure, like waivers.ts — no Deno APIs, no Supabase client — so the whole
 * decision layer runs under the project's normal vitest suite. index.ts
 * supplies the IO.
 *
 * THE RULE, AND WHY IT IS THIS ONE
 *
 * Dead cap has only ever been created by hand here: DeadCapManager asks a
 * commissioner to pick a player, a roster, and type a salary. Nothing in the
 * codebase encodes who is eligible, so this defines it, and the definition
 * follows the one thing the app already agrees on — what a player was
 * actually costing against the cap.
 *
 *   - A player with no salary cost nothing, so dropping them owes nothing.
 *   - A FAAB acquisition contributes $0 to the cap
 *     (getSalaryCapContribution returns 0 for acquisition_type 'faab'), so
 *     dropping one likewise owes nothing. Charging dead cap for a player who
 *     was free to roster would penalise teams for ordinary waiver churn.
 *   - Everyone else owes dead cap on the salary they carried.
 *
 * Deliberately NOT conditioned on `player_contracts`. Contract rows are
 * optional in this schema — the pricing panel writes them only when a
 * commissioner sets a term, and useTransactionProcessor explicitly skips them
 * for FAAB pickups — so requiring one would make the feature silently do
 * nothing for most drops, which is a worse failure than being slightly broad.
 *
 * The penalty percentage is NOT applied here. `dead_cap_players.salary` holds
 * the player's original salary and calculateOptimizedSalaries charges
 * max(1, round(salary * 0.25)) when reading. Storing an already-discounted
 * figure would apply the penalty twice.
 */

export interface DroppedPlayerSalary {
  player_id?: string | null;
  salary?: number | null;
  acquisition_type?: string | null;
}

export interface ExistingDeadCap {
  player_id?: string | null;
  roster_id?: number | null;
}

export interface DeadCapWrite {
  playerId: string;
  rosterId: number;
  /** The player's salary, undiscounted. The reader applies the penalty. */
  salary: number;
}

export interface DeadCapPlan {
  writes: DeadCapWrite[];
  /** Drops examined but not charged, with the reason. */
  skipped: Array<{ playerId: string; reason: string }>;
}

interface DroppableTransaction {
  transaction_id?: string;
  status?: string;
  drops?: Record<string, unknown> | null;
  created?: number | string | null;
  status_updated?: number | string | null;
}

/**
 * Dead cap owed by a league, given its completed transactions.
 *
 * Idempotent through `existingDeadCap` rather than through
 * processed_transactions. That matters: a waiver claim usually drops a player
 * too, so the same transaction can owe both a salary write and a dead cap
 * row. Keying dead cap off the processed-transactions table would mean
 * whichever capability ran first marked the transaction done and starved the
 * other — and enabling dead cap later would skip every transaction already
 * processed for waivers. The dead cap rows are the state; their existence is
 * the record.
 *
 * One consequence, stated rather than hidden: a player dropped by the same
 * roster twice is charged once. Reading that as one penalty per player per
 * team is defensible, and it is far better than the alternative failure of
 * charging again on every re-run.
 */
export const planDeadCapWrites = ({
  transactions,
  salariesByPlayer,
  existingDeadCap,
}: {
  transactions: DroppableTransaction[];
  salariesByPlayer: Map<string, DroppedPlayerSalary>;
  existingDeadCap: ExistingDeadCap[];
}): DeadCapPlan => {
  const already = new Set(
    (existingDeadCap || [])
      .filter((row) => row?.player_id != null && row?.roster_id != null)
      .map((row) => `${row.player_id}:${row.roster_id}`),
  );

  const writes: DeadCapWrite[] = [];
  const skipped: Array<{ playerId: string; reason: string }> = [];
  // Planned within this run too, so two drops of the same player in one sweep
  // don't produce duplicate inserts.
  const planned = new Set<string>();

  const timestampOf = (tx: DroppableTransaction): number => {
    const raw = tx?.created ?? tx?.status_updated ?? 0;
    const value = typeof raw === 'string' ? Number(raw) : raw;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  };

  const ordered = [...(transactions || [])]
    .filter((tx) => tx?.status === 'complete')
    .sort((a, b) => timestampOf(a) - timestampOf(b));

  for (const tx of ordered) {
    const drops = tx?.drops;
    if (!drops || typeof drops !== 'object') continue;

    for (const [playerId, rawRosterId] of Object.entries(drops)) {
      if (!playerId) continue;
      const rosterId = typeof rawRosterId === 'string' ? Number(rawRosterId) : rawRosterId;
      if (typeof rosterId !== 'number' || !Number.isInteger(rosterId)) continue;

      const key = `${playerId}:${rosterId}`;
      if (already.has(key) || planned.has(key)) continue;

      const salaryRow = salariesByPlayer.get(playerId);
      const salary = Number(salaryRow?.salary ?? 0);

      if (!salaryRow || !Number.isFinite(salary) || salary <= 0) {
        skipped.push({ playerId, reason: 'no salary on record' });
        continue;
      }
      if (salaryRow.acquisition_type === 'faab') {
        // Cost nothing against the cap while rostered, so costs nothing to drop.
        skipped.push({ playerId, reason: 'FAAB acquisition — no cap hit to carry' });
        continue;
      }

      planned.add(key);
      writes.push({ playerId, rosterId, salary });
    }
  }

  return { writes, skipped };
};
