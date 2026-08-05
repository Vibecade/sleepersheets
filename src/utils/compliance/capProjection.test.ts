import { describe, it, expect } from 'vitest';
import { evaluateTradeCap, isOverCap, projectTotalAfterTrade } from './capProjection';
import { evaluateLeagueCompliance } from './index';

describe('isOverCap', () => {
  it('is inert when no cap is configured', () => {
    // An unset cap is not a cap of zero that everyone instantly breaches.
    expect(isOverCap(500, 0)).toBe(false);
    expect(isOverCap(500, -1)).toBe(false);
  });

  it('treats exactly at the cap as compliant', () => {
    expect(isOverCap(200, 200)).toBe(false);
    expect(isOverCap(201, 200)).toBe(true);
  });
});

describe('projectTotalAfterTrade', () => {
  it('subtracts what leaves and adds what arrives', () => {
    expect(
      projectTotalAfterTrade({
        rosterId: 1,
        teamName: 'A',
        currentTotal: 100,
        salaryOut: 30,
        salaryIn: 70,
      }),
    ).toBe(140);
  });

  it('tolerates missing amounts', () => {
    expect(
      projectTotalAfterTrade({
        rosterId: 1,
        teamName: 'A',
        currentTotal: 100,
      } as never),
    ).toBe(100);
  });
});

describe('evaluateTradeCap', () => {
  it('names every team the trade would put over', () => {
    const verdict = evaluateTradeCap(
      [
        { rosterId: 1, teamName: 'Over', currentTotal: 190, salaryOut: 10, salaryIn: 60 },
        { rosterId: 2, teamName: 'Fine', currentTotal: 100, salaryOut: 60, salaryIn: 10 },
      ],
      200,
    );

    expect(verdict.valid).toBe(false);
    expect(verdict.overCapTeams).toEqual([
      { rosterId: 1, teamName: 'Over', projectedTotal: 240, overBy: 40 },
    ]);
  });

  it('passes a trade that keeps everyone under', () => {
    expect(
      evaluateTradeCap(
        [{ rosterId: 1, teamName: 'A', currentTotal: 100, salaryOut: 50, salaryIn: 50 }],
        200,
      ).valid,
    ).toBe(true);
  });
});

/**
 * The reason `capProjection` exists.
 *
 * The trade simulator judges a hypothetical trade by adjusting a team's
 * current total by the salaries moving each way. The compliance engine judges
 * a completed trade by summing the replayed roster from scratch. Different
 * routes, and they used to be different code — so a manager could be told a
 * trade was legal and then flagged for making it.
 *
 * These tests drive both paths with the same trade and assert they agree.
 */
describe('parity: simulator and compliance engine agree', () => {
  const salaries: Record<string, number> = { keep: 60, star: 150, cheap: 20 };
  const contribution = (id: string) => salaries[id] ?? 0;
  const SALARY_CAP = 200;
  const DEAD_CAP = 30;

  // Team 1 currently holds keep + cheap ($80) plus $30 dead cap = $110.
  // The trade sends cheap out and brings star in: 110 - 20 + 150 = $240.
  const simulatorVerdict = evaluateTradeCap(
    [
      {
        rosterId: 1,
        teamName: 'Team 1',
        currentTotal: 60 + 20 + DEAD_CAP,
        salaryOut: salaries.cheap,
        salaryIn: salaries.star,
      },
    ],
    SALARY_CAP,
  );

  // The same trade, completed: team 1 ends up holding keep + star.
  const engineReport = evaluateLeagueCompliance({
    rosters: [
      { roster_id: 1, players: ['keep', 'star'] },
      { roster_id: 2, players: ['cheap'] },
    ],
    transactions: [
      {
        transaction_id: 'trade1',
        created: 1000,
        status: 'complete',
        type: 'trade',
        leg: 5,
        adds: { star: 1, cheap: 2 },
        drops: { star: 2, cheap: 1 },
      },
    ],
    players: {},
    getSalaryCapContribution: contribution,
    deadCapByRoster: { 1: DEAD_CAP },
    salaryCap: SALARY_CAP,
    league: { settings: {} },
  });

  const engineFinding = engineReport.findings.find(
    (f) => f.rule === 'cap_ceiling' && f.rosterId === 1,
  );

  it('both flag the same roster', () => {
    expect(simulatorVerdict.valid).toBe(false);
    expect(simulatorVerdict.overCapTeams[0].rosterId).toBe(1);
    expect(engineFinding).toBeDefined();
  });

  it('both compute the same projected total', () => {
    expect(simulatorVerdict.overCapTeams[0].projectedTotal).toBe(240);
    expect((engineFinding!.detail.after as { total: number }).total).toBe(240);
  });

  it('both compute the same overage', () => {
    expect(simulatorVerdict.overCapTeams[0].overBy).toBe(engineFinding!.detail.overBy);
  });

  it('agree that a within-cap trade is legal', () => {
    const cheapTrade = evaluateTradeCap(
      [
        {
          rosterId: 1,
          teamName: 'Team 1',
          currentTotal: 60 + 150,
          salaryOut: salaries.star,
          salaryIn: salaries.cheap,
        },
      ],
      SALARY_CAP,
    );

    const report = evaluateLeagueCompliance({
      rosters: [
        { roster_id: 1, players: ['keep', 'cheap'] },
        { roster_id: 2, players: ['star'] },
      ],
      transactions: [
        {
          transaction_id: 'trade2',
          created: 1000,
          status: 'complete',
          type: 'trade',
          leg: 5,
          adds: { cheap: 1, star: 2 },
          drops: { cheap: 2, star: 1 },
        },
      ],
      players: {},
      getSalaryCapContribution: contribution,
      deadCapByRoster: {},
      salaryCap: SALARY_CAP,
      league: { settings: {} },
    });

    expect(cheapTrade.valid).toBe(true);
    expect(report.findings.filter((f) => f.rule === 'cap_ceiling')).toHaveLength(0);
  });
});
