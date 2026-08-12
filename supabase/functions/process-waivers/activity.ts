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
 *
 * Titles count players rather than naming them, and metadata carries the
 * player ids. Naming them here would mean this job downloading Sleeper's
 * ~5MB player file on every run that writes anything, purely to bake a name
 * into a string — and baking it in freezes it, so a later name change would
 * leave the feed disagreeing with the rest of the app. The dashboard already
 * holds the player map and resolves the ids when it renders.
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

export const buildActivityRows = ({
  leagueId,
  waiverWrites,
  deadCapWrites,
}: {
  leagueId: string;
  waiverWrites: WaiverSalaryWriteLike[];
  deadCapWrites: DeadCapWriteLike[];
}): ActivityRow[] => {
  const rows: ActivityRow[] = [];

  const waivers = waiverWrites ?? [];
  if (waivers.length > 0) {
    const total = waivers.reduce((sum, w) => sum + (Number(w.salary) || 0), 0);
    rows.push({
      league_id: leagueId,
      activity_type: 'automation_waiver_pricing',
      title: `Priced ${plural(waivers.length, 'waiver claim', 'waiver claims')}`,
      description: `${plural(waivers.length, 'player', 'players')} priced from their winning FAAB bid, totalling ${money(total)}.`,
      metadata: {
        totalSalary: total,
        players: waivers.map((w) => ({ playerId: w.playerId, salary: w.salary })),
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
      title: `Dead cap — ${plural(deadCap.length, 'player released', 'players released')}`,
      description:
        `${plural(deadCap.length, 'released player', 'released players')} charged dead cap on ` +
        `${money(total)} of salary. The cap engine applies the penalty percentage to that figure.`,
      metadata: {
        // The salary charged against, NOT the penalty. Stored this way
        // everywhere so the discount is applied exactly once, at read time.
        totalSalaryCharged: total,
        players: deadCap.map((w) => ({ playerId: w.playerId, salary: w.salary })),
      },
      user_id: null,
    });
  }

  return rows;
};
