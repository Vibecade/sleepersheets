/**
 * Reconstructs roster membership at each point in the season.
 *
 * To judge whether a transaction broke a league rule you need the rosters as
 * they stood at that moment, and Sleeper only serves the rosters as they
 * stand *now*. What it does give is a complete per-week transaction log with
 * `adds` and `drops` keyed player_id -> roster_id, which is enough to walk
 * backwards from the present.
 *
 * So: rewind from current state to the start of the log, then replay forward,
 * recording the state after each transaction along the way.
 *
 * Salaries don't need the same treatment — `player_salaries` is keyed
 * (league_id, player_id), so a player's cost is the same no matter who owns
 * him. A salary edited after the fact will change a past verdict, which is
 * one of the reasons change history is worth having.
 */

import { sortWaiversOldestFirst } from '@/utils/waiverOrdering';

export interface ReplayableTransaction {
  transaction_id?: string;
  status?: string;
  type?: string;
  adds?: Record<string, unknown> | null;
  drops?: Record<string, unknown> | null;
  created?: number | string | null;
  status_updated?: number | string | null;
  [key: string]: unknown;
}

export interface ReplayableRoster {
  roster_id?: number;
  players?: string[] | null;
  taxi?: string[] | null;
  reserve?: string[] | null;
  [key: string]: unknown;
}

/** roster_id -> set of player_ids on that roster. */
export type RosterState = Map<number, Set<string>>;

export interface ReplayResult {
  /** Roster membership immediately after each transaction, by transaction_id. */
  stateAfter: Map<string, RosterState>;
  /** Roster membership immediately before each transaction, by transaction_id. */
  stateBefore: Map<string, RosterState>;
  /** Transactions actually applied, oldest first. */
  ordered: ReplayableTransaction[];
  /**
   * False when the log contradicts current rosters. See `anomalies`.
   * Callers must suppress findings when this is false.
   */
  converged: boolean;
  /**
   * Human-readable descriptions of each contradiction found while rewinding.
   * Capped — the first few explain the problem as well as all of them.
   */
  anomalies: string[];
}

const MAX_ANOMALIES = 10;

/**
 * Sleeper keys adds/drops as player_id -> roster_id. Values arrive as numbers
 * from the live API; be tolerant of numeric strings and reject anything else,
 * so a differently-shaped payload is ignored rather than misread. (The demo
 * fixture, for instance, keys by user_id with array values — this drops it
 * instead of inventing moves from it.)
 */
const normalizeMoves = (
  entries: Record<string, unknown> | null | undefined,
): Array<{ playerId: string; rosterId: number }> => {
  if (!entries || typeof entries !== 'object') return [];
  const moves: Array<{ playerId: string; rosterId: number }> = [];
  Object.entries(entries).forEach(([playerId, rawRosterId]) => {
    if (!playerId) return;
    const rosterId = typeof rawRosterId === 'string' ? Number(rawRosterId) : rawRosterId;
    if (typeof rosterId !== 'number' || !Number.isInteger(rosterId)) return;
    moves.push({ playerId, rosterId });
  });
  return moves;
};

/** Every player on a roster, whatever slot they occupy. */
const membersOf = (roster: ReplayableRoster): Set<string> =>
  new Set<string>([
    ...(roster?.players || []),
    ...(roster?.taxi || []),
    ...(roster?.reserve || []),
  ]);

const cloneState = (state: RosterState): RosterState => {
  const copy: RosterState = new Map();
  state.forEach((players, rosterId) => copy.set(rosterId, new Set(players)));
  return copy;
};

const rosterHolding = (state: RosterState, playerId: string): number | null => {
  for (const [rosterId, players] of state) {
    if (players.has(playerId)) return rosterId;
  }
  return null;
};

export const buildCurrentState = (rosters: ReplayableRoster[]): RosterState => {
  const state: RosterState = new Map();
  (rosters || []).forEach((roster) => {
    if (typeof roster?.roster_id !== 'number') return;
    state.set(roster.roster_id, membersOf(roster));
  });
  return state;
};

/**
 * Rewind to the start of the log, then replay forward.
 *
 * The convergence check deserves a note, because the obvious version of it is
 * useless. Comparing the replayed final state against current rosters always
 * passes: replay is the exact inverse of the rewind that produced the
 * starting state, so it reproduces the input by construction no matter how
 * wrong the log is.
 *
 * What actually detects drift is checking each undo for coherence *while*
 * rewinding. Undoing an add means the player should be sitting on the roster
 * the transaction added him to; undoing a drop means he should be on no
 * roster at all. When either doesn't hold, something moved him that isn't in
 * the log — a commissioner editing rosters directly in Sleeper, or a
 * truncated transaction history — and every verdict downstream is suspect.
 *
 * A false accusation against a manager is far worse than a missed one, so
 * this reports `converged: false` and callers show nothing rather than
 * guessing.
 */
export const replayRosters = (
  rosters: ReplayableRoster[],
  transactions: ReplayableTransaction[],
): ReplayResult => {
  const ordered = sortWaiversOldestFirst(
    (transactions || []).filter((tx) => tx?.status === 'complete' && tx?.transaction_id),
  );

  const anomalies: string[] = [];
  const noteAnomaly = (message: string) => {
    if (anomalies.length < MAX_ANOMALIES) anomalies.push(message);
  };

  // --- Rewind: newest -> oldest, undoing each transaction. ---
  const state = buildCurrentState(rosters);

  for (let i = ordered.length - 1; i >= 0; i -= 1) {
    const tx = ordered[i];
    const txId = String(tx.transaction_id);
    const adds = normalizeMoves(tx.adds);
    const drops = normalizeMoves(tx.drops);

    // Undo adds first: a trade both drops and adds the same player, and he
    // has to come off the receiving roster before he can go back on the
    // sending one.
    adds.forEach(({ playerId, rosterId }) => {
      const holder = state.get(rosterId);
      if (!holder?.has(playerId)) {
        noteAnomaly(
          `${txId}: expected player ${playerId} on roster ${rosterId} to undo an add, but found him ${
            rosterHolding(state, playerId) === null
              ? 'on no roster'
              : `on roster ${rosterHolding(state, playerId)}`
          }`,
        );
        return;
      }
      holder.delete(playerId);
    });

    drops.forEach(({ playerId, rosterId }) => {
      const currentHolder = rosterHolding(state, playerId);
      if (currentHolder !== null) {
        noteAnomaly(
          `${txId}: expected player ${playerId} to be unrostered to undo a drop, but found him on roster ${currentHolder}`,
        );
        return;
      }
      if (!state.has(rosterId)) state.set(rosterId, new Set());
      state.get(rosterId)!.add(playerId);
    });
  }

  // --- Replay: oldest -> newest, recording the state after each step. ---
  const stateAfter = new Map<string, RosterState>();
  const stateBefore = new Map<string, RosterState>();

  ordered.forEach((tx) => {
    const txId = String(tx.transaction_id);
    stateBefore.set(txId, cloneState(state));
    normalizeMoves(tx.drops).forEach(({ playerId, rosterId }) => {
      state.get(rosterId)?.delete(playerId);
    });
    normalizeMoves(tx.adds).forEach(({ playerId, rosterId }) => {
      if (!state.has(rosterId)) state.set(rosterId, new Set());
      state.get(rosterId)!.add(playerId);
    });
    stateAfter.set(txId, cloneState(state));
  });

  return { stateAfter, stateBefore, ordered, converged: anomalies.length === 0, anomalies };
};
