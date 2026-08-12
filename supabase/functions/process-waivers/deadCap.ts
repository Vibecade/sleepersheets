/**
 * Dead cap planning: what a league owes for players it released.
 *
 * Pure, like waivers.ts — no Deno APIs, no Supabase client — so the whole
 * decision layer runs under the project's normal vitest suite. index.ts
 * supplies the IO.
 *
 * A RELEASE, NOT A DROP
 *
 * Sleeper models a trade as the traded player appearing in `drops` for the
 * sending roster and `adds` for the receiver — the same shape a release has
 * from the sender's side. Charging every drop therefore bills a manager for
 * trading a player away, which is not a release at all. A drop only counts
 * here when the player is not re-added by the same transaction, and trades are
 * excluded outright.
 *
 * THE RULE, AND WHY IT IS THIS ONE
 *
 * Dead cap has only ever been created by hand: DeadCapManager asks a
 * commissioner to pick a player, a roster, and type a salary. Nothing encodes
 * who is eligible, so this defines it, following the one thing the app already
 * agrees on — what a player was actually costing against the cap.
 *
 *   - A player with no salary cost nothing, so releasing them owes nothing.
 *   - A FAAB acquisition contributes $0 to the cap
 *     (getSalaryCapContribution returns 0 for acquisition_type 'faab'), so
 *     releasing one likewise owes nothing. Charging for a player who was free
 *     to roster would penalise ordinary waiver churn.
 *   - Everyone else owes dead cap on the salary they carried.
 *
 * Deliberately NOT conditioned on `player_contracts`. Contract rows are
 * optional in this schema — the pricing panel writes them only when a
 * commissioner sets a term, and useTransactionProcessor explicitly skips them
 * for FAAB pickups — so requiring one would make the feature silently do
 * nothing for most releases.
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

export interface DeadCapWrite {
  transactionId: string;
  playerId: string;
  rosterId: number;
  /** The player's salary, undiscounted. The reader applies the penalty. */
  salary: number;
}

export interface DeadCapPlan {
  writes: DeadCapWrite[];
  /** Releases examined but not charged, with the reason. */
  skipped: Array<{ playerId: string; reason: string }>;
}

interface DroppableTransaction {
  transaction_id?: string;
  type?: string;
  status?: string;
  adds?: Record<string, unknown> | null;
  drops?: Record<string, unknown> | null;
  created?: number | string | null;
  status_updated?: number | string | null;
}

const timestampOf = (tx: DroppableTransaction): number => {
  const raw = tx?.created ?? tx?.status_updated ?? 0;
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

const playerIdsIn = (entries: Record<string, unknown> | null | undefined): Set<string> =>
  new Set(entries && typeof entries === 'object' ? Object.keys(entries) : []);

/**
 * Dead cap owed by a league, given its completed transactions.
 *
 * IDEMPOTENCY, AND WHY IT IS NOT THE dead_cap_players ROWS
 *
 * `chargedKeys` is a record of what automation has already charged, kept
 * separately from the `dead_cap_players` rows it produced. Deriving it from
 * those rows instead looks simpler and is wrong twice over: a commissioner who
 * deletes an entry they disagree with would have it silently re-created on the
 * next sweep — contradicting the promise that generated entries can be removed
 * — and there would be no way to tell an automatic charge from a manual one.
 *
 * It is keyed by transaction, not just by player, so a genuine second release
 * of the same player is charged again while a re-run of the same sweep is not.
 *
 * SALARY STATE
 *
 * Salaries are read from the player's current row, because there is no
 * historical salary to read — `player_salaries` is overwritten in place. That
 * is only sound while the current row still describes the player as they were
 * released, so a release is skipped when the player was re-added afterwards:
 * a week-1 release of a contract player who was later re-signed via FAAB would
 * otherwise be judged against the FAAB row and wrongly skipped, or charged at
 * a salary they never had.
 *
 * The cost is under-charging in exactly the cases the data cannot support,
 * which the commissioner can correct by hand. The alternative — billing a
 * manager on a number that was never true — is much worse.
 */
export const planDeadCapWrites = ({
  transactions,
  salariesByPlayer,
  chargedKeys,
}: {
  transactions: DroppableTransaction[];
  salariesByPlayer: Map<string, DroppedPlayerSalary>;
  /** `${transaction_id}:${player_id}` for every charge already made. */
  chargedKeys: Set<string>;
}): DeadCapPlan => {
  const writes: DeadCapWrite[] = [];
  const skipped: Array<{ playerId: string; reason: string }> = [];

  const ordered = [...(transactions || [])]
    .filter((tx) => tx?.status === 'complete' && tx?.transaction_id)
    .sort((a, b) => timestampOf(a) - timestampOf(b));

  // When each player was last picked up. A release before that is a release
  // whose salary state has since been overwritten by the later acquisition.
  const lastAddedAt = new Map<string, number>();
  for (const tx of ordered) {
    const at = timestampOf(tx);
    for (const playerId of playerIdsIn(tx.adds)) {
      const previous = lastAddedAt.get(playerId);
      if (previous === undefined || at > previous) lastAddedAt.set(playerId, at);
    }
  }

  for (const tx of ordered) {
    const drops = tx?.drops;
    if (!drops || typeof drops !== 'object') continue;

    const transactionId = String(tx.transaction_id);
    const at = timestampOf(tx);
    const addedHere = playerIdsIn(tx.adds);

    for (const [playerId, rawRosterId] of Object.entries(drops)) {
      if (!playerId) continue;
      const rosterId = typeof rawRosterId === 'string' ? Number(rawRosterId) : rawRosterId;
      if (typeof rosterId !== 'number' || !Number.isInteger(rosterId)) continue;

      if (chargedKeys.has(`${transactionId}:${playerId}`)) continue;

      // A trade moves a player; it does not release them. Sleeper puts the
      // traded player in drops for the sender and adds for the receiver.
      if (tx.type === 'trade' || addedHere.has(playerId)) {
        skipped.push({ playerId, reason: 'traded, not released' });
        continue;
      }

      const lastAdd = lastAddedAt.get(playerId);
      if (lastAdd !== undefined && lastAdd > at) {
        // Re-acquired since. The current salary row describes that later
        // acquisition, not this release, so there is nothing trustworthy to
        // charge against.
        skipped.push({ playerId, reason: 're-acquired later — salary at release is unknown' });
        continue;
      }

      const salaryRow = salariesByPlayer.get(playerId);
      const salary = Number(salaryRow?.salary ?? 0);

      if (!salaryRow || !Number.isFinite(salary) || salary <= 0) {
        skipped.push({ playerId, reason: 'no salary on record' });
        continue;
      }
      if (salaryRow.acquisition_type === 'faab') {
        // Cost nothing against the cap while rostered, so costs nothing to release.
        skipped.push({ playerId, reason: 'FAAB acquisition — no cap hit to carry' });
        continue;
      }

      writes.push({ transactionId, playerId, rosterId, salary });
    }
  }

  return { writes, skipped };
};
