import { describe, it, expect } from 'vitest';
import { evaluateLeagueCompliance } from './index';
import type { EvaluateComplianceInput } from './index';

/**
 * Fixtures are deliberately tiny — each test sets up exactly the shape its
 * rule cares about. Salaries are injected through `getSalaryCapContribution`
 * the same way `calculateOptimizedSalaries` takes them, so these exercise the
 * aggregation without reaching into Supabase.
 */
const base = (over: Partial<EvaluateComplianceInput> = {}): EvaluateComplianceInput => ({
  rosters: [],
  transactions: [],
  players: {},
  getSalaryCapContribution: () => 0,
  deadCapByRoster: {},
  salaryCap: 200,
  league: { settings: {} },
  teamName: (id) => `Team ${id}`,
  ...over,
});

const salaries = (map: Record<string, number>) => (id: string) => map[id] ?? 0;

const completedTx = (
  transaction_id: string,
  created: number,
  extra: Record<string, unknown>,
) => ({ transaction_id, created, status: 'complete', ...extra });

describe('cap_ceiling', () => {
  it('flags a trade that leaves a roster over the cap', () => {
    // Team 1 sends `cheap` ($20) and receives `star` ($150), ending with
    // keep ($60) + star ($150) = $210 active, plus $30 dead cap = $240
    // against a $200 cap.
    const report = evaluateLeagueCompliance(
      base({
        rosters: [
          { roster_id: 1, players: ['keep', 'star'] },
          { roster_id: 2, players: ['cheap'] },
        ],
        transactions: [
          completedTx('trade1', 1000, {
            type: 'trade',
            leg: 5,
            adds: { star: 1, cheap: 2 },
            drops: { star: 2, cheap: 1 },
          }),
        ],
        getSalaryCapContribution: salaries({ keep: 60, star: 150, cheap: 20 }),
        deadCapByRoster: { 1: 30 },
        salaryCap: 200,
      }),
    );

    const finding = report.findings.find((f) => f.rule === 'cap_ceiling' && f.rosterId === 1);
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('violation');
    expect(finding!.week).toBe(5);
    expect(finding!.detail.overBy).toBe(40);
    expect(finding!.detail.after).toEqual({ active: 210, deadCap: 30, total: 240 });
  });

  it('does not flag a transaction that leaves the roster within the cap', () => {
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['a', 'b'] }],
        transactions: [completedTx('t1', 1000, { type: 'free_agent', adds: { b: 1 } })],
        getSalaryCapContribution: salaries({ a: 50, b: 50 }),
        salaryCap: 200,
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'cap_ceiling')).toHaveLength(0);
  });

  it('blames only the transaction that caused the overage', () => {
    // Team 1 goes over on t1 and stays over through t2. Reporting both would
    // bury the move that actually broke the rule.
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['a', 'big', 'later'] }],
        transactions: [
          completedTx('t1', 1000, { type: 'free_agent', adds: { big: 1 } }),
          completedTx('t2', 2000, { type: 'free_agent', adds: { later: 1 } }),
        ],
        getSalaryCapContribution: salaries({ a: 50, big: 300, later: 1 }),
        salaryCap: 200,
      }),
    );

    const capFindings = report.findings.filter((f) => f.rule === 'cap_ceiling');
    expect(capFindings).toHaveLength(1);
    expect(capFindings[0].transactionId).toBe('t1');
  });

  it('excludes IR players from the cap total', () => {
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['a', 'hurt'], reserve: ['hurt'] }],
        transactions: [completedTx('t1', 1000, { type: 'free_agent', adds: { a: 1 } })],
        getSalaryCapContribution: salaries({ a: 100, hurt: 500 }),
        salaryCap: 200,
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'cap_ceiling')).toHaveLength(0);
  });

  it('is inert when no salary cap is configured', () => {
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['a'] }],
        transactions: [completedTx('t1', 1000, { adds: { a: 1 } })],
        getSalaryCapContribution: salaries({ a: 9999 }),
        salaryCap: 0,
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'cap_ceiling')).toHaveLength(0);
  });
});

describe('trade_deadline', () => {
  const deadlineLeague = { settings: { trade_deadline: 12 } };

  it('flags a trade completed after the deadline', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: deadlineLeague,
        rosters: [{ roster_id: 1, players: ['p'] }, { roster_id: 2, players: [] }],
        transactions: [
          completedTx('late', 1000, { type: 'trade', leg: 14, adds: { p: 1 }, drops: { p: 2 } }),
        ],
      }),
    );

    const findings = report.findings.filter((f) => f.rule === 'trade_deadline');
    expect(findings).toHaveLength(2); // one per roster involved
    expect(findings[0].summary).toContain('week 14');
    expect(findings[0].summary).toContain('week 12 deadline');
  });

  it('allows a trade in the deadline week itself', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: deadlineLeague,
        rosters: [{ roster_id: 1, players: ['p'] }, { roster_id: 2, players: [] }],
        transactions: [
          completedTx('ok', 1000, { type: 'trade', leg: 12, adds: { p: 1 }, drops: { p: 2 } }),
        ],
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'trade_deadline')).toHaveLength(0);
  });

  it('ignores non-trade transactions after the deadline', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: deadlineLeague,
        rosters: [{ roster_id: 1, players: ['p'] }],
        transactions: [completedTx('fa', 1000, { type: 'free_agent', leg: 15, adds: { p: 1 } })],
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'trade_deadline')).toHaveLength(0);
  });

  it('is inert when the league has no deadline set', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: { settings: {} },
        rosters: [{ roster_id: 1, players: ['p'] }, { roster_id: 2, players: [] }],
        transactions: [
          completedTx('late', 1000, { type: 'trade', leg: 17, adds: { p: 1 }, drops: { p: 2 } }),
        ],
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'trade_deadline')).toHaveLength(0);
  });
});

describe('taxi_eligibility', () => {
  it('flags a veteran on the taxi squad', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: { settings: { taxi_years: 1 } },
        rosters: [{ roster_id: 1, players: ['vet'], taxi: ['vet'] }],
        players: { vet: { full_name: 'Old Guy', years_exp: 7, position: 'WR' } },
      }),
    );

    const finding = report.findings.find((f) => f.rule === 'taxi_eligibility');
    expect(finding).toBeDefined();
    expect(finding!.summary).toContain('Old Guy');
    expect(finding!.detail).toMatchObject({ yearsExp: 7, maxYears: 1 });
  });

  it('allows a player at exactly the limit', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: { settings: { taxi_years: 1 } },
        rosters: [{ roster_id: 1, players: ['soph'], taxi: ['soph'] }],
        players: { soph: { full_name: 'Second Year', years_exp: 1 } },
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'taxi_eligibility')).toHaveLength(0);
  });

  it('treats unknown experience as no evidence of a violation', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: { settings: { taxi_years: 0 } },
        rosters: [{ roster_id: 1, players: ['mystery'], taxi: ['mystery'] }],
        players: { mystery: { full_name: 'Unknown' } },
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'taxi_eligibility')).toHaveLength(0);
  });

  it('is inert when the league sets no taxi_years', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: { settings: {} },
        rosters: [{ roster_id: 1, players: ['vet'], taxi: ['vet'] }],
        players: { vet: { years_exp: 10 } },
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'taxi_eligibility')).toHaveLength(0);
  });
});

describe('ir_stash', () => {
  it('flags a healthy player on IR and reports the sheltered salary', () => {
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['fit'], reserve: ['fit'] }],
        players: { fit: { full_name: 'Healthy Starter', injury_status: null } },
        getSalaryCapContribution: salaries({ fit: 54 }),
      }),
    );

    const finding = report.findings.find((f) => f.rule === 'ir_stash');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe('warning');
    expect(finding!.detail.shelteredSalary).toBe(54);
  });

  it('does not flag a genuinely injured player', () => {
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['hurt'], reserve: ['hurt'] }],
        players: { hurt: { full_name: 'Injured', injury_status: 'IR' } },
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'ir_stash')).toHaveLength(0);
  });

  it('recognises injury designations case-insensitively', () => {
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['a', 'b'], reserve: ['a', 'b'] }],
        players: { a: { injury_status: 'Out' }, b: { injury_status: 'doubtful' } },
      }),
    );

    expect(report.findings.filter((f) => f.rule === 'ir_stash')).toHaveLength(0);
  });
});

describe('report assembly', () => {
  it('withholds history-dependent findings when the replay does not converge', () => {
    // The log claims a player was added who is nowhere to be found, so roster
    // history cannot be trusted. The cap verdict is withheld — but the IR
    // finding, which reads current rosters directly, still stands.
    const report = evaluateLeagueCompliance(
      base({
        rosters: [{ roster_id: 1, players: ['a', 'fit'], reserve: ['fit'] }],
        transactions: [
          completedTx('ghost', 1000, { type: 'trade', leg: 3, adds: { nobody: 1 } }),
        ],
        players: { fit: { full_name: 'Healthy', injury_status: null } },
        getSalaryCapContribution: salaries({ a: 9999, fit: 10 }),
        salaryCap: 200,
      }),
    );

    expect(report.converged).toBe(false);
    expect(report.anomalies.length).toBeGreaterThan(0);
    expect(report.findings.some((f) => f.rule === 'cap_ceiling')).toBe(false);
    expect(report.findings.some((f) => f.rule === 'ir_stash')).toBe(true);
  });

  it('sorts violations before warnings', () => {
    const report = evaluateLeagueCompliance(
      base({
        league: { settings: { taxi_years: 0 } },
        rosters: [
          { roster_id: 1, players: ['vet', 'fit'], taxi: ['vet'], reserve: ['fit'] },
        ],
        players: {
          vet: { full_name: 'Vet', years_exp: 5 },
          fit: { full_name: 'Fit', injury_status: null },
        },
      }),
    );

    expect(report.findings.map((f) => f.severity)).toEqual(['violation', 'warning']);
  });

  it('produces stable ids across repeated evaluations', () => {
    const input = base({
      league: { settings: { taxi_years: 0 } },
      rosters: [{ roster_id: 1, players: ['vet'], taxi: ['vet'] }],
      players: { vet: { years_exp: 4 } },
    });

    expect(evaluateLeagueCompliance(input).findings.map((f) => f.id)).toEqual(
      evaluateLeagueCompliance(input).findings.map((f) => f.id),
    );
  });

  it('returns nothing for an empty league', () => {
    const report = evaluateLeagueCompliance(base());
    expect(report.findings).toEqual([]);
    expect(report.converged).toBe(true);
  });
});
