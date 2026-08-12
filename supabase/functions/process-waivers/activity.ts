/**
 * Turns what a run actually wrote into feed entries.
 *
 * Pure, like waivers.ts and deadCap.ts, so the whole decision layer runs under
 * the project's normal vitest suite.
 *
 * Only real writes are recorded. A run that priced nothing produces no entry —
 * the job sweeps every enabled league on a six-hourly schedule, so recording
 * "nothing to do" would bury the handful of entries that matter under
 * thousands that don't, and a feed nobody can skim is a feed nobody reads.
 */

export interface WaiverSalaryWriteLike {
  playerId: string;
  salary: number;
}

export interface DeadCapWriteLike {
  playerId: string;
  salary: number;
}

export interface ActivityRow {
  league_id: string;
  activity_type: 'automation_waiver_pricing' | 'automation_dead_cap';
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  /** Null: nobody did this. That is the point of recording it. */
  user_id: null;
}

/** "$47" — whole dollars, which is how every salary in this app is stored. */
const money = (amount: number): string => `$${Math.round(amount)}`;

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`;

/**
 * Names a player if the run touched exactly one, otherwise counts them.
 *
 * A single-player entry reading "priced 1 waiver claim" makes the
 * commissioner open the metadata to learn something the title had room for.
 */
const nameOrCount = (
  writes: Array<{ playerId: string }>,
  playerNames: Map<string, string>,
  one: string,
  many: string,
): string => {
  if (writes.length === 1) {
    const name = playerNames.get(writes[0].playerId);
    if (name) return name;
  }
  return plural(writes.length, one, many);
};

export const buildActivityRows = ({
  leagueId,
  waiverWrites,
  deadCapWrites,
  playerNames,
}: {
  leagueId: string;
  waiverWrites: WaiverSalaryWriteLike[];
  deadCapWrites: DeadCapWriteLike[];
  /** player_id -> display name, for readable titles. Optional. */
  playerNames?: Map<string, string>;
}): ActivityRow[] => {
  const names = playerNames ?? new Map<string, string>();
  const rows: ActivityRow[] = [];

  const waivers = waiverWrites ?? [];
  if (waivers.length > 0) {
    const total = waivers.reduce((sum, w) => sum + (Number(w.salary) || 0), 0);
    rows.push({
      league_id: leagueId,
      activity_type: 'automation_waiver_pricing',
      title: `Priced ${nameOrCount(waivers, names, 'waiver claim', 'waiver claims')}`,
      description: `${plural(waivers.length, 'player', 'players')} priced from their winning FAAB bid, totalling ${money(total)}.`,
      metadata: {
        totalSalary: total,
        players: waivers.map((w) => ({
          playerId: w.playerId,
          name: names.get(w.playerId) ?? null,
          salary: w.salary,
        })),
      },
      user_id: null,
    });
  }

  const deadCap = deadCapWrites ?? [];
  if (deadCap.length > 0) {
    const total = deadCap.reduce((sum, w) => sum + (Number(w.salary) || 0), 0);
    rows.push({
      league_id: leagueId,
      activity_type: 'automation_dead_cap',
      title: `Dead cap — ${nameOrCount(deadCap, names, 'player released', 'players released')}`,
      description:
        `${plural(deadCap.length, 'released player', 'released players')} charged dead cap on ` +
        `${money(total)} of salary. The cap engine applies the penalty percentage to that figure.`,
      metadata: {
        // The salary charged against, NOT the penalty. Stored this way
        // everywhere so the discount is applied exactly once, at read time.
        totalSalaryCharged: total,
        players: deadCap.map((w) => ({
          playerId: w.playerId,
          name: names.get(w.playerId) ?? null,
          salary: w.salary,
        })),
      },
      user_id: null,
    });
  }

  return rows;
};
