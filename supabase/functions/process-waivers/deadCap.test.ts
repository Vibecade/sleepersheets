import { describe, it, expect } from "vitest";
import { planDeadCapWrites } from "./deadCap";
import type { DroppedPlayerSalary, ExistingDeadCap } from "./deadCap";

const salaries = (map: Record<string, DroppedPlayerSalary>) =>
  new Map(Object.entries(map));

const drop = (
  transaction_id: string,
  created: number,
  drops: Record<string, number>,
  status = "complete",
) => ({ transaction_id, created, status, drops });

const plan = (
  transactions: ReturnType<typeof drop>[],
  salariesByPlayer: Map<string, DroppedPlayerSalary>,
  existingDeadCap: ExistingDeadCap[] = [],
) => planDeadCapWrites({ transactions, salariesByPlayer, existingDeadCap });

describe("planDeadCapWrites", () => {
  it("charges a dropped player's full salary, undiscounted", () => {
    // dead_cap_players.salary holds the original; the cap engine applies
    // max(1, round(salary * 0.25)) when reading. Discounting here would
    // charge the penalty twice.
    const result = plan([drop("t1", 1000, { p1: 3 })], salaries({ p1: { salary: 80 } }));

    expect(result.writes).toEqual([{ playerId: "p1", rosterId: 3, salary: 80 }]);
  });

  it("does not charge a FAAB acquisition", () => {
    // A FAAB player contributes $0 to the cap while rostered, so dropping one
    // costs nothing. Charging here would penalise ordinary waiver churn.
    const result = plan(
      [drop("t1", 1000, { p1: 3 })],
      salaries({ p1: { salary: 40, acquisition_type: "faab" } }),
    );

    expect(result.writes).toEqual([]);
    expect(result.skipped[0].reason).toContain("FAAB");
  });

  it("does not charge a player with no salary on record", () => {
    const result = plan([drop("t1", 1000, { p1: 3 })], salaries({}));
    expect(result.writes).toEqual([]);
    expect(result.skipped[0].reason).toBe("no salary on record");
  });

  it("does not charge a zero or negative salary", () => {
    const result = plan(
      [drop("t1", 1000, { p1: 3, p2: 3 })],
      salaries({ p1: { salary: 0 }, p2: { salary: -5 } }),
    );
    expect(result.writes).toEqual([]);
  });

  it("ignores transactions that did not complete", () => {
    const result = plan(
      [drop("t1", 1000, { p1: 3 }, "failed")],
      salaries({ p1: { salary: 80 } }),
    );
    expect(result.writes).toEqual([]);
  });

  describe("idempotency", () => {
    it("does not re-charge a player who already has a dead cap row", () => {
      const result = plan(
        [drop("t1", 1000, { p1: 3 })],
        salaries({ p1: { salary: 80 } }),
        [{ player_id: "p1", roster_id: 3 }],
      );
      expect(result.writes).toEqual([]);
    });

    it("charges a different roster that drops the same player", () => {
      // Roster 3 already paid. Roster 4 dropping him later is its own penalty.
      const result = plan(
        [drop("t1", 1000, { p1: 4 })],
        salaries({ p1: { salary: 80 } }),
        [{ player_id: "p1", roster_id: 3 }],
      );
      expect(result.writes).toEqual([{ playerId: "p1", rosterId: 4, salary: 80 }]);
    });

    it("charges once when the same drop appears twice in one sweep", () => {
      // The job sweeps the whole season every run, so the same player being
      // dropped, re-added and dropped again must not produce two inserts.
      const result = plan(
        [drop("t1", 1000, { p1: 3 }), drop("t2", 2000, { p1: 3 })],
        salaries({ p1: { salary: 80 } }),
      );
      expect(result.writes).toHaveLength(1);
    });

    it("is stable across repeated runs given its own output", () => {
      const s = salaries({ p1: { salary: 80 } });
      const first = plan([drop("t1", 1000, { p1: 3 })], s);
      const asExisting = first.writes.map((w) => ({
        player_id: w.playerId,
        roster_id: w.rosterId,
      }));
      const second = plan([drop("t1", 1000, { p1: 3 })], s, asExisting);

      expect(first.writes).toHaveLength(1);
      expect(second.writes).toEqual([]);
    });
  });

  describe("malformed input", () => {
    it("ignores drops that are not player_id -> roster_id", () => {
      const result = plan(
        [{ transaction_id: "t1", created: 1, status: "complete", drops: { p1: ["x"] } } as never],
        salaries({ p1: { salary: 80 } }),
      );
      expect(result.writes).toEqual([]);
    });

    it("accepts a numeric string roster id", () => {
      const result = plan(
        [{ transaction_id: "t1", created: 1, status: "complete", drops: { p1: "3" } } as never],
        salaries({ p1: { salary: 80 } }),
      );
      expect(result.writes).toEqual([{ playerId: "p1", rosterId: 3, salary: 80 }]);
    });

    it("survives null drops and empty input", () => {
      expect(planDeadCapWrites({
        transactions: [],
        salariesByPlayer: new Map(),
        existingDeadCap: [],
      }).writes).toEqual([]);
      expect(
        plan([{ transaction_id: "t1", created: 1, status: "complete", drops: null } as never], salaries({}))
          .writes,
      ).toEqual([]);
    });
  });

  it("charges several rosters from one transaction", () => {
    const result = plan(
      [drop("trade", 1000, { p1: 3, p2: 4 })],
      salaries({ p1: { salary: 50 }, p2: { salary: 60 } }),
    );
    expect(result.writes).toEqual([
      { playerId: "p1", rosterId: 3, salary: 50 },
      { playerId: "p2", rosterId: 4, salary: 60 },
    ]);
  });
});
