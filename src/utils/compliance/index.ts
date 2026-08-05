/**
 * The compliance engine.
 *
 * Evaluates a league against its own rules and returns findings for the
 * commissioner. Pure — no React, no Supabase, no network — following the
 * `src/utils/pricing.ts` precedent, so the whole thing is testable with plain
 * fixtures.
 *
 * It never changes anything. Sleeper's API is read-only, so there is no way to
 * reverse a trade or undo a signing from here; a finding is a claim routed to
 * a human who acts in Sleeper.
 */

import { replayRosters } from './rosterReplay';
import type { ReplayableRoster, ReplayableTransaction } from './rosterReplay';
import {
  capCeilingRule,
  tradeDeadlineRule,
  taxiEligibilityRule,
  irStashRule,
} from './rules';
import type {
  ComplianceContext,
  ComplianceFinding,
  ComplianceLeague,
  CompliancePlayer,
  ComplianceReport,
  ComplianceRule,
} from './types';

export * from './types';
export { replayRosters } from './rosterReplay';
export type { ReplayResult, RosterState } from './rosterReplay';
export { capCeilingRule, tradeDeadlineRule, taxiEligibilityRule, irStashRule } from './rules';

export interface EvaluateComplianceInput {
  rosters: ReplayableRoster[];
  transactions: ReplayableTransaction[];
  players: Record<string, CompliancePlayer>;
  getSalaryCapContribution: (playerId: string) => number;
  deadCapByRoster: Record<number, number>;
  salaryCap: number;
  league: ComplianceLeague;
  teamName?: (rosterId: number) => string;
}

/**
 * Rules whose verdict depends on reconstructing roster history. When the
 * transaction log contradicts current rosters these are withheld, because a
 * wrong accusation against a manager costs the commissioner more credibility
 * than a missed violation does.
 *
 * The others read current rosters directly and stay trustworthy regardless.
 */
const HISTORY_DEPENDENT: ReadonlySet<ComplianceRule> = new Set(['cap_ceiling', 'trade_deadline']);

/** Violations first, then most recent, so the worst thing is at the top. */
const bySeverityThenRecency = (a: ComplianceFinding, b: ComplianceFinding): number => {
  if (a.severity !== b.severity) return a.severity === 'violation' ? -1 : 1;
  const weekDiff = (b.week ?? 0) - (a.week ?? 0);
  if (weekDiff !== 0) return weekDiff;
  return a.id.localeCompare(b.id);
};

export const evaluateLeagueCompliance = ({
  rosters,
  transactions,
  players,
  getSalaryCapContribution,
  deadCapByRoster,
  salaryCap,
  league,
  teamName,
}: EvaluateComplianceInput): ComplianceReport => {
  const replay = replayRosters(rosters || [], transactions || []);

  const ctx: ComplianceContext = {
    rosters: rosters || [],
    transactions: transactions || [],
    players: players || {},
    getSalaryCapContribution,
    deadCapByRoster: deadCapByRoster || {},
    salaryCap,
    league: league || {},
    replay,
    teamName: teamName || ((rosterId: number) => `Team ${rosterId}`),
  };

  const findings = [
    ...capCeilingRule(ctx),
    ...tradeDeadlineRule(ctx),
    ...taxiEligibilityRule(ctx),
    ...irStashRule(ctx),
  ].filter((finding) => replay.converged || !HISTORY_DEPENDENT.has(finding.rule));

  return {
    findings: findings.sort(bySeverityThenRecency),
    converged: replay.converged,
    anomalies: replay.anomalies,
  };
};
