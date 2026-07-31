import { describe, it, expect } from "vitest";
import { calculateOptimizedSalaries } from "./salaryCalculations";

/**
 * Cap math is the highest-consequence logic in the app — it decides whether
 * a manager can make a claim or complete a trade — and had zero coverage
 * before this suite.
 *
 * `getSalaryCapContribution` is injected, so these tests drive the roster
 * aggregation directly with a stub. The real implementation
 * (usePlayerSalaries) applies its own rules — FAAB acquisitions contribute
 * $0, taxi-squad players contribute max(1, round(salary * 0.25)) — which
 * are exercised here through representative stub values rather than by
 * reaching into Supabase.
 */

// Convenience: contribution stub backed by a plain player_id -> amount map.
const contributionFrom =
  (map: Record<string, number>) =>
  (playerId: string): number =>
    map[playerId] ?? 0;

const roster = (
  roster_id: number,
  opts: { players?: string[]; taxi?: string[]; reserve?: string[] } = {},
) => ({ roster_id, ...opts });

describe("calculateOptimizedSalaries — active salary", () => {
  it("sums contributions across players and taxi", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a", "b"], taxi: ["c"] })],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({ a: 100, b: 250, c: 50 }),
      salaryCap: 1000,
    });
    expect(result.teamSalaries[1]).toBe(400);
  });

  it("EXCLUDES reserve/IR players from the cap hit", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"], reserve: ["ir1", "ir2"] })],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({ a: 100, ir1: 9999, ir2: 9999 }),
      salaryCap: 1000,
    });
    expect(result.teamSalaries[1]).toBe(100);
  });

  it("treats missing roster arrays as empty", () => {
    const result = calculateOptimizedSalaries({
      rosters: [{ roster_id: 1 }],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamSalaries[1]).toBe(0);
  });

  it("keeps each roster's totals independent", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] }), roster(2, { players: ["b"] })],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({ a: 100, b: 700 }),
      salaryCap: 1000,
    });
    expect(result.teamSalaries).toEqual({ 1: 100, 2: 700 });
  });
});

describe("calculateOptimizedSalaries — dead cap", () => {
  it("charges 25% of the released player's salary, rounded", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: [] })],
      deadCapPlayers: [{ roster_id: 1, salary: 400 }],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[1]).toBe(100);
  });

  it("rounds to nearest dollar rather than truncating", () => {
    // 25% of 410 = 102.5 -> 103
    const result = calculateOptimizedSalaries({
      rosters: [roster(1)],
      deadCapPlayers: [{ roster_id: 1, salary: 410 }],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[1]).toBe(103);
  });

  // The Math.max(1, ...) floor means ANY dead-cap entry costs at least $1,
  // even a $0-salary player. Pinning this so it can't silently become $0.
  it.each([
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ])("applies a $1 floor: salary %i -> dead cap %i", (salary, expected) => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1)],
      deadCapPlayers: [{ roster_id: 1, salary }],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[1]).toBe(expected);
  });

  it("treats a missing salary as $0 (and therefore the $1 floor)", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1)],
      deadCapPlayers: [{ roster_id: 1 }],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[1]).toBe(1);
  });

  it("accumulates multiple dead-cap players on the same roster", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1)],
      deadCapPlayers: [
        { roster_id: 1, salary: 400 }, // 100
        { roster_id: 1, salary: 800 }, // 200
        { roster_id: 1, salary: 0 }, //     1 (floor)
      ],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[1]).toBe(301);
  });

  it("reports $0 dead cap for a roster with no released players", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1), roster(2)],
      deadCapPlayers: [{ roster_id: 1, salary: 400 }],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[2]).toBe(0);
  });

  it("ignores dead-cap rows for rosters not in the league", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1)],
      deadCapPlayers: [{ roster_id: 99, salary: 4000 }],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamDeadCaps[1]).toBe(0);
    expect(result.teamDeadCaps[99]).toBeUndefined();
  });
});

describe("calculateOptimizedSalaries — totals vs cap percentage", () => {
  it("totalSalaries INCLUDES dead cap", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] })],
      deadCapPlayers: [{ roster_id: 1, salary: 400 }], // 100 dead
      getSalaryCapContribution: contributionFrom({ a: 500 }),
      salaryCap: 1000,
    });
    expect(result.totalSalaries[1]).toBe(600);
  });

  /**
   * KNOWN INCONSISTENCY — pinned deliberately, not endorsed.
   *
   * `totalSalaries` includes dead cap but `capStatus.percentage` does not.
   * EnhancedTradeSimulator reads BOTH onto the same team card, so a roster
   * carrying dead cap displays a dollar figure and a percentage that
   * disagree — e.g. $200,000 of a $200,000 cap rendered as "90% (under)".
   *
   * Whether dead cap should count against the cap is a league-policy
   * decision, so this suite documents the current behavior rather than
   * changing it. If the policy is "dead cap counts" (the usual dynasty
   * convention), `percentage` should switch to `total / salaryCap` and
   * these two tests should be updated together.
   */
  it("capStatus.percentage EXCLUDES dead cap (see comment above)", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] })],
      deadCapPlayers: [{ roster_id: 1, salary: 400 }], // 100 dead
      getSalaryCapContribution: contributionFrom({ a: 500 }),
      salaryCap: 1000,
    });
    // 500 active / 1000 cap = 50%, NOT 600/1000 = 60%
    expect(result.capStatus[1].percentage).toBe(50);
  });

  it("a roster at the cap only once dead cap is counted still reads 'under'", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] })],
      deadCapPlayers: [{ roster_id: 1, salary: 400 }], // 100 dead
      getSalaryCapContribution: contributionFrom({ a: 900 }),
      salaryCap: 1000,
    });
    expect(result.totalSalaries[1]).toBe(1000); // exactly at the cap
    expect(result.capStatus[1].status).toBe("under"); // ...but reported under
  });
});

describe("calculateOptimizedSalaries — cap status thresholds", () => {
  const statusAt = (activeSalary: number, salaryCap = 1000) =>
    calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] })],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({ a: activeSalary }),
      salaryCap,
    }).capStatus[1];

  it.each([
    [0, "under"],
    [500, "under"],
    [900, "under"], // exactly 90% — boundary is `> 90`
    [901, "near"],
    [999, "near"],
    [1000, "near"], // exactly 100% — boundary is `> 100`
    [1001, "over"],
    [2000, "over"],
  ])("active %i -> %s", (salary, expected) => {
    expect(statusAt(salary as number).status).toBe(expected);
  });

  it("computes percentage as a plain ratio of the cap", () => {
    expect(statusAt(250).percentage).toBe(25);
  });
});

describe("calculateOptimizedSalaries — degenerate inputs", () => {
  it("returns empty maps for no rosters", () => {
    const result = calculateOptimizedSalaries({
      rosters: [],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({}),
      salaryCap: 1000,
    });
    expect(result.teamSalaries).toEqual({});
    expect(result.capStatus).toEqual({});
  });

  // A salary cap of 0 divides by zero. Guarding this is a product decision
  // (reject the setting vs. render "—"), so for now just pin what happens
  // so nobody is surprised by "NaN%" or "Infinity%" in the UI.
  it("yields Infinity% (status 'over') when the cap is 0 and salaries exist", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] })],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({ a: 100 }),
      salaryCap: 0,
    });
    expect(result.capStatus[1].percentage).toBe(Infinity);
    expect(result.capStatus[1].status).toBe("over");
  });

  it("yields NaN% (status 'under') when both the cap and salaries are 0", () => {
    const result = calculateOptimizedSalaries({
      rosters: [roster(1, { players: ["a"] })],
      deadCapPlayers: [],
      getSalaryCapContribution: contributionFrom({ a: 0 }),
      salaryCap: 0,
    });
    expect(Number.isNaN(result.capStatus[1].percentage)).toBe(true);
    expect(result.capStatus[1].status).toBe("under");
  });
});
