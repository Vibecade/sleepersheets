import type { ReplayResult, ReplayableRoster, ReplayableTransaction } from './rosterReplay';

export type ComplianceRule =
  | 'cap_ceiling'
  | 'trade_deadline'
  | 'taxi_eligibility'
  | 'ir_stash';

/**
 * `violation` breaks a stated league rule. `warning` is something a
 * commissioner probably wants to look at but that no rule strictly forbids.
 * Nothing here is ever enforced automatically — Sleeper's API is read-only,
 * so every finding ends as a human decision.
 */
export type Severity = 'violation' | 'warning';

export interface ComplianceFinding {
  /** Stable across re-evaluations, so UI state can key off it. */
  id: string;
  rule: ComplianceRule;
  severity: Severity;
  rosterId: number;
  transactionId?: string;
  /** Week the offending transaction happened, when it came from one. */
  week?: number;
  /** One line, already human-readable. */
  summary: string;
  /** The arithmetic behind the summary, for the expandable breakdown. */
  detail: Record<string, unknown>;
}

export interface RosterCapBreakdown {
  /** Salary of players counting against the cap (excludes IR). */
  active: number;
  deadCap: number;
  total: number;
}

export interface CompliancePlayer {
  player_id?: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  years_exp?: number;
  injury_status?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface ComplianceLeague {
  season?: string;
  settings?: {
    leg?: number;
    week?: number;
    trade_deadline?: number;
    taxi_years?: number;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface ComplianceContext {
  rosters: ReplayableRoster[];
  transactions: ReplayableTransaction[];
  players: Record<string, CompliancePlayer>;
  /**
   * Injected the same way `calculateOptimizedSalaries` takes it, so the
   * compliance engine and the cap display can never disagree about what a
   * player costs.
   */
  getSalaryCapContribution: (playerId: string) => number;
  deadCapByRoster: Record<number, number>;
  salaryCap: number;
  league: ComplianceLeague;
  replay: ReplayResult;
  /** Team label for a roster, for readable summaries. */
  teamName: (rosterId: number) => string;
}

export interface ComplianceReport {
  findings: ComplianceFinding[];
  /**
   * False when roster history could not be reconstructed. Findings derived
   * from the transaction log are withheld in that case.
   */
  converged: boolean;
  anomalies: string[];
}
