/**
 * The one place that decides whether a roster is over the cap.
 *
 * Two callers need this answer and used to compute it separately: the trade
 * simulator, judging a hypothetical trade a manager is building, and the
 * compliance engine, judging a real one that already happened. They arrive at
 * the total by different routes — the simulator adjusts a team's current
 * total by the salaries moving each way, while the engine sums the replayed
 * roster outright — but they must never disagree about the verdict, or a
 * manager gets told a trade is legal and then flagged for making it.
 *
 * Totals here always include dead cap, matching how cap status is reported
 * everywhere else in the app.
 */

export interface TradeSide {
  rosterId: number;
  teamName: string;
  /** Cap total today: active salary + dead cap. */
  currentTotal: number;
  /** Salary leaving this roster. */
  salaryOut: number;
  /** Salary arriving at this roster. */
  salaryIn: number;
}

export interface OverCapTeam {
  rosterId: number;
  teamName: string;
  projectedTotal: number;
  overBy: number;
}

export interface TradeCapVerdict {
  valid: boolean;
  overCapTeams: OverCapTeam[];
}

/**
 * A cap of zero or less means the league hasn't configured one, which is not
 * the same as a cap of zero that everyone instantly breaches. Unset caps make
 * the rule inert.
 */
export const isOverCap = (total: number, salaryCap: number): boolean =>
  salaryCap > 0 && total > salaryCap;

export const projectTotalAfterTrade = (side: TradeSide): number =>
  (side.currentTotal || 0) - (side.salaryOut || 0) + (side.salaryIn || 0);

export const evaluateTradeCap = (sides: TradeSide[], salaryCap: number): TradeCapVerdict => {
  const overCapTeams: OverCapTeam[] = [];

  (sides || []).forEach((side) => {
    const projectedTotal = projectTotalAfterTrade(side);
    if (!isOverCap(projectedTotal, salaryCap)) return;
    overCapTeams.push({
      rosterId: side.rosterId,
      teamName: side.teamName,
      projectedTotal,
      overBy: projectedTotal - salaryCap,
    });
  });

  return { valid: overCapTeams.length === 0, overCapTeams };
};
