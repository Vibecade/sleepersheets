import { describe, it, expect } from "vitest";
import { planDeadCapWrites } from "./deadCap";
import type { DroppedPlayerSalary } from "./deadCap";

const salaries = (map: Record<string, DroppedPlayerSalary>) => new Map(Object.entries(map));

interface TxOpts {
  type?: string;
  status?: string;
  adds?: Record<string, unknown>;
  drops?: Record<string, unknown>;
}
const tx = (transaction_id: string, created: number, opts: TxOpts = {}) => ({
  transaction_id,
  created,
  status: "complete",
  type: "free_agent",
  ...opts,
});

const plan = (
  transactions: ReturnType<typeof tx>[],
  salariesByPlayer: Map<string, DroppedPlayerSalary>,
  charged: string[] = [],
) =>
  planDeadCapWrites({
    transactions,
    salariesByPlayer,
    chargedKeys: new Set(charged),
  });

describe("planDeadCapWrites", () => {
  it("charges a released player's full salary, undiscounted", () => {
    // dead_cap_players.salary holds the original; the cap engine applies
    // max(1, round(salary * 0.25)) when reading. Discounting here would
    // charge the penalty twice.
    const result = plan([tx("t1", 1000, { drops: { p1: 3 } })], salaries({ p1: { salary: 80 } }));

    expect(result.writes).toEqual([
      { transactionId: "t1", playerId: "p1", rosterId: 3, salary: 80 },
    ]);
  });

  describe("a trade is not a release", () => {
    // Sleeper puts a traded player in `drops` for the sender and `adds` for
    // the receiver — the same shape a release has from the sender's side.
    // Charging it bills a manager for trading someone away.
    it("does not charge the sender of a trade", () => {
      const result = plan(
        [tx("trade1", 1000, { type: "trade", adds: { p1: 4 }, drops: { p1: 3 } })],
        salaries({ p1: { salary: 80 } }),
      );

      expect(result.writes).toEqual([]);
      expect(result.skipped[0].reason).toBe("traded, not released");
    });

    it("does not charge when a player is dropped and re-added in one transaction", () => {
      // Belt and braces: even if the type is not 'trade', a player who ends
      // the transaction on a roster was not released by it.
      const result = plan(
        [tx("t1", 1000, { adds: { p1: 4 }, drops: { p1: 3 } })],
        salaries({ p1: { salary: 80 } }),
      );

      expect(result.writes).toEqual([]);
    });

    it("still charges the released player in a waiver claim that drops someone else", () => {
      // adds and drops name DIFFERENT players — this is a real release.
      const result = plan(
        [tx("t1", 1000, { type: "waiver", adds: { newGuy: 3 }, drops: { oldGuy: 3 } })],
        salaries({ oldGuy: { salary: 40 }, newGuy: { salary: 12 } }),
      );

      expect(result.writes).toEqual([
        { transactionId: "t1", playerId: "oldGuy", rosterId: 3, salary: 40 },
      ]);
    });
  });

  describe("salary state at the time of release", () => {
    // player_salaries is overwritten in place, so there is no historical
    // salary to read. A release is only chargeable while the current row
    // still describes the player as they were released.
    it("does not charge a release when the player was re-acquired afterwards", () => {
      // Released in week 1 under contract, re-signed later via FAAB. The
      // current row says FAAB, which describes the re-signing, not the
      // release — charging or skipping on that basis would both be guesses.
      const result = plan(
        [
          tx("release", 1000, { drops: { p1: 3 } }),
          tx("resign", 2000, { type: "waiver", adds: { p1: 5 } }),
        ],
        salaries({ p1: { salary: 12, acquisition_type: "faab" } }),
      );

      expect(result.writes).toEqual([]);
      expect(result.skipped[0].reason).toContain("re-acquired later");
    });

    it("charges a release that is the player's last movement", () => {
      const result = plan(
        [
          tx("add", 1000, { adds: { p1: 3 } }),
          tx("release", 2000, { drops: { p1: 3 } }),
        ],
        salaries({ p1: { salary: 80 } }),
      );

      expect(result.writes).toHaveLength(1);
      expect(result.writes[0].transactionId).toBe("release");
    });
  });

  describe("eligibility", () => {
    it("does not charge a FAAB acquisition", () => {
      // Contributes $0 to the cap while rostered, so releasing costs nothing.
      const result = plan(
        [tx("t1", 1000, { drops: { p1: 3 } })],
        salaries({ p1: { salary: 40, acquisition_type: "faab" } }),
      );

      expect(result.writes).toEqual([]);
      expect(result.skipped[0].reason).toContain("FAAB");
    });

    it("does not charge a player with no salary on record", () => {
      const result = plan([tx("t1", 1000, { drops: { p1: 3 } })], salaries({}));
      expect(result.writes).toEqual([]);
      expect(result.skipped[0].reason).toBe("no salary on record");
    });

    it("does not charge a zero or negative salary", () => {
      const result = plan(
        [tx("t1", 1000, { drops: { p1: 3, p2: 3 } })],
        salaries({ p1: { salary: 0 }, p2: { salary: -5 } }),
      );
      expect(result.writes).toEqual([]);
    });

    it("ignores transactions that did not complete", () => {
      const result = plan(
        [tx("t1", 1000, { status: "failed", drops: { p1: 3 } })],
        salaries({ p1: { salary: 80 } }),
      );
      expect(result.writes).toEqual([]);
    });
  });

  describe("idempotency", () => {
    it("does not re-charge a release already in the ledger", () => {
      const result = plan(
        [tx("t1", 1000, { drops: { p1: 3 } })],
        salaries({ p1: { salary: 80 } }),
        ["t1:p1"],
      );
      expect(result.writes).toEqual([]);
    });

    it("does NOT re-charge after a commissioner deletes the dead cap entry", () => {
      // The reason the ledger is separate from dead_cap_players. Deleting the
      // visible penalty must not resurrect it on the next sweep — the Dead Cap
      // manager offers to remove entries and that offer has to mean something.
      const result = plan(
        [tx("t1", 1000, { drops: { p1: 3 } })],
        salaries({ p1: { salary: 80 } }),
        ["t1:p1"], // ledger remembers, even with no dead_cap_players row left
      );
      expect(result.writes).toEqual([]);
    });

    it("charges a genuine second release of the same player", () => {
      // Released, re-signed, released again. Two releases, two penalties —
      // which is why the ledger is keyed by transaction and not just player.
      const result = plan(
        [
          tx("release1", 1000, { drops: { p1: 3 } }),
          tx("resign", 2000, { adds: { p1: 3 } }),
          tx("release2", 3000, { drops: { p1: 3 } }),
        ],
        salaries({ p1: { salary: 80 } }),
        ["release1:p1"],
      );

      expect(result.writes).toEqual([
        { transactionId: "release2", playerId: "p1", rosterId: 3, salary: 80 },
      ]);
    });

    it("is stable when fed its own output", () => {
      const s = salaries({ p1: { salary: 80 } });
      const txs = [tx("t1", 1000, { drops: { p1: 3 } })];
      const first = plan(txs, s);
      const second = plan(txs, s, first.writes.map((w) => `${w.transactionId}:${w.playerId}`));

      expect(first.writes).toHaveLength(1);
      expect(second.writes).toEqual([]);
    });
  });

  describe("malformed input", () => {
    it("ignores drops that are not player_id -> roster_id", () => {
      const result = plan(
        [tx("t1", 1000, { drops: { p1: ["x"] } })],
        salaries({ p1: { salary: 80 } }),
      );
      expect(result.writes).toEqual([]);
    });

    it("accepts a numeric string roster id", () => {
      const result = plan([tx("t1", 1000, { drops: { p1: "3" } })], salaries({ p1: { salary: 80 } }));
      expect(result.writes).toEqual([
        { transactionId: "t1", playerId: "p1", rosterId: 3, salary: 80 },
      ]);
    });

    it("survives null drops and empty input", () => {
      expect(
        planDeadCapWrites({
          transactions: [],
          salariesByPlayer: new Map(),
          chargedKeys: new Set(),
        }).writes,
      ).toEqual([]);
      expect(plan([tx("t1", 1000, { drops: undefined })], salaries({})).writes).toEqual([]);
    });
  });

  it("charges several rosters releasing players in one sweep", () => {
    const result = plan(
      [tx("t1", 1000, { drops: { p1: 3 } }), tx("t2", 2000, { drops: { p2: 4 } })],
      salaries({ p1: { salary: 50 }, p2: { salary: 60 } }),
    );
    expect(result.writes.map((w) => w.playerId)).toEqual(["p1", "p2"]);
  });
});
