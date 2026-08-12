import { describe, it, expect } from "vitest";
import {
  isWaiverTransaction,
  extractWaiverWrites,
  planWaiverWrites,
  weeksToSweep,
  selectAutomatedLeagues,
  MAX_WEEKS,
} from "./waivers";

/**
 * This is the decision layer for a job that writes salary data on a
 * schedule with service-role privileges. Nothing here touches the network,
 * so it's the part that can actually be verified — the Deno shell in
 * index.ts is deliberately kept thin because it can't be.
 *
 * The rules must match src/hooks/useTransactionProcessor.tsx: a waiver
 * priced by the cron and the same waiver priced by a commissioner opening
 * the app have to produce the same number.
 */

const waiver = (over: Record<string, unknown> = {}) => ({
  transaction_id: "t1",
  type: "waiver",
  status: "complete",
  settings: { waiver_bid: 25 },
  adds: { p1: 3 },
  ...over,
});

describe("isWaiverTransaction", () => {
  it("accepts a completed waiver with a bid", () => {
    expect(isWaiverTransaction(waiver())).toBe(true);
  });

  it("rejects a claim that did not complete", () => {
    expect(isWaiverTransaction(waiver({ status: "failed" }))).toBe(false);
  });

  it("rejects non-waiver transaction types", () => {
    expect(isWaiverTransaction(waiver({ type: "trade" }))).toBe(false);
    expect(isWaiverTransaction(waiver({ type: "free_agent" }))).toBe(false);
  });

  // Matches the client: a $0 bid is falsy there, so it never auto-prices.
  // Those players surface in the commissioner Pricing panel instead.
  it("rejects a $0 bid", () => {
    expect(isWaiverTransaction(waiver({ settings: { waiver_bid: 0 } }))).toBe(false);
  });

  it("rejects a missing or malformed settings block", () => {
    expect(isWaiverTransaction(waiver({ settings: null }))).toBe(false);
    expect(isWaiverTransaction(waiver({ settings: {} }))).toBe(false);
    expect(isWaiverTransaction(waiver({ settings: { waiver_bid: "25" } }))).toBe(false);
  });
});

describe("extractWaiverWrites", () => {
  it("prices the added player at the winning bid", () => {
    expect(extractWaiverWrites(waiver())).toEqual([
      { playerId: "p1", rosterId: 3, salary: 25 },
    ]);
  });

  it("prices every player in a multi-add claim", () => {
    const writes = extractWaiverWrites(waiver({ adds: { p1: 3, p2: 3 } }));
    expect(writes).toHaveLength(2);
    expect(writes.every((w) => w.salary === 25)).toBe(true);
  });

  it("skips adds whose roster id is not numeric", () => {
    expect(extractWaiverWrites(waiver({ adds: { p1: "3" } }))).toEqual([]);
  });

  it("returns nothing for a transaction with no adds", () => {
    expect(extractWaiverWrites(waiver({ adds: null }))).toEqual([]);
  });

  it("returns nothing for a transaction that isn't a priceable waiver", () => {
    expect(extractWaiverWrites(waiver({ status: "failed" }))).toEqual([]);
  });
});

describe("planWaiverWrites", () => {
  const plan = (transactions: any[], processed: string[] = []) =>
    planWaiverWrites({
      transactions,
      processedTransactionIds: new Set(processed),
    });

  it("plans a write and records the transaction id", () => {
    const result = plan([waiver()]);
    expect(result.writes).toEqual([{ playerId: "p1", rosterId: 3, salary: 25 }]);
    expect(result.transactionIds).toEqual(["t1"]);
  });

  // Idempotency is the whole safety story for a cron: re-running must not
  // re-write, and a partially-failed run must resume rather than restart.
  it("skips transactions already recorded as processed", () => {
    const result = plan([waiver()], ["t1"]);
    expect(result.writes).toEqual([]);
    expect(result.transactionIds).toEqual([]);
    expect(result.alreadyProcessed).toBe(1);
  });

  it("processes only the unprocessed remainder of a mixed batch", () => {
    const result = plan(
      [
        waiver({ transaction_id: "old", adds: { p1: 3 } }),
        waiver({ transaction_id: "new", adds: { p2: 4 }, settings: { waiver_bid: 8 } }),
      ],
      ["old"],
    );
    expect(result.transactionIds).toEqual(["new"]);
    expect(result.writes).toEqual([{ playerId: "p2", rosterId: 4, salary: 8 }]);
    expect(result.alreadyProcessed).toBe(1);
  });

  it("keeps the most recent bid when a player is claimed twice", () => {
    const result = plan([
      waiver({ transaction_id: "a", created: 100, settings: { waiver_bid: 5 } }),
      waiver({ transaction_id: "b", created: 900, settings: { waiver_bid: 40 } }),
    ]);
    expect(result.writes).toEqual([{ playerId: "p1", rosterId: 3, salary: 40 }]);
    // Both still get recorded so neither is reconsidered next run.
    expect(result.transactionIds.sort()).toEqual(["a", "b"]);
  });

  /**
   * index.ts concatenates several weeks' API responses unchanged, and
   * Sleeper doesn't guarantee ordering within a week either — so the
   * winner has to come from an explicit sort, not from array position.
   * This is unrecoverable if wrong: once both claims are marked
   * processed, nothing revisits them and the stale salary sticks.
   */
  it("picks the latest claim regardless of input order", () => {
    const older = waiver({ transaction_id: "a", created: 100, settings: { waiver_bid: 5 } });
    const newer = waiver({ transaction_id: "b", created: 900, settings: { waiver_bid: 40 } });

    expect(plan([older, newer]).writes[0].salary).toBe(40);
    expect(plan([newer, older]).writes[0].salary).toBe(40);
  });

  it("falls back to status_updated when created is absent", () => {
    const result = plan([
      waiver({ transaction_id: "b", created: null, status_updated: 900, settings: { waiver_bid: 40 } }),
      waiver({ transaction_id: "a", created: null, status_updated: 100, settings: { waiver_bid: 5 } }),
    ]);
    expect(result.writes[0].salary).toBe(40);
  });

  it("ignores transactions with no id — they can't be marked processed", () => {
    // Writing these would price the player every single run, forever.
    const result = plan([waiver({ transaction_id: undefined })]);
    expect(result.writes).toEqual([]);
    expect(result.transactionIds).toEqual([]);
  });

  it("does not record ids for transactions that produced no writes", () => {
    const result = plan([waiver({ type: "trade" })]);
    expect(result.transactionIds).toEqual([]);
  });

  it("returns an empty plan for an empty or nullish log", () => {
    expect(plan([]).writes).toEqual([]);
    expect(planWaiverWrites({
      transactions: null as any,
      processedTransactionIds: new Set(),
    }).writes).toEqual([]);
  });
});

describe("weeksToSweep", () => {
  /**
   * The default sweep covers the whole season so far. A narrow window
   * would assume the job had run continuously since week 1 — untrue when
   * it's first enabled midseason, and untrue after any outage longer than
   * the window. Skipped weeks are never revisited, so those players would
   * stay unpriced permanently.
   */
  it("covers week 1 through the current week by default", () => {
    expect(weeksToSweep(5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("backfills the whole season when first enabled late", () => {
    expect(weeksToSweep(14)).toHaveLength(14);
    expect(weeksToSweep(14)[0]).toBe(1);
  });

  it("returns just week 1 at the start of the season", () => {
    expect(weeksToSweep(1)).toEqual([1]);
  });

  it("narrows to the last N weeks when lookback is given", () => {
    expect(weeksToSweep(10, 2)).toEqual([9, 10]);
    expect(weeksToSweep(10, 1)).toEqual([10]);
  });

  it("clamps a lookback larger than the season so far", () => {
    expect(weeksToSweep(3, 99)).toEqual([1, 2, 3]);
  });

  it("sweeps the full season when leg is missing or out of range", () => {
    // Better to over-fetch than to silently skip weeks — already-processed
    // transactions cost nothing to re-read.
    expect(weeksToSweep(undefined)).toHaveLength(MAX_WEEKS);
    expect(weeksToSweep(0)).toHaveLength(MAX_WEEKS);
    expect(weeksToSweep(99)).toHaveLength(MAX_WEEKS);
    expect(weeksToSweep("7" as unknown)).toHaveLength(MAX_WEEKS);
  });
});

describe("selectAutomatedLeagues", () => {
  const on = (league_id: string) => ({ league_id, auto_waiver_pricing: true, paused_at: null });

  it("runs for a league that opted in", () => {
    const result = selectAutomatedLeagues(["L1"], [on("L1")]);
    expect(result.enabled).toEqual(["L1"]);
    expect(result.skipped).toEqual([]);
  });

  it("treats a league with no settings row as off", () => {
    // Absence must mean off. A league nobody configured is exactly the one
    // that should not be written to unattended.
    const result = selectAutomatedLeagues(["L1"], []);
    expect(result.enabled).toEqual([]);
    expect(result.skipped).toEqual([{ leagueId: "L1", reason: "automation not configured" }]);
  });

  it("does not run for a league that opted out", () => {
    const result = selectAutomatedLeagues(
      ["L1"],
      [{ league_id: "L1", auto_waiver_pricing: false, paused_at: null }],
    );
    expect(result.enabled).toEqual([]);
    expect(result.skipped[0].reason).toBe("waiver pricing not enabled");
  });

  it("pause overrides an enabled flag", () => {
    // The whole point of the kill switch: it stops things without needing the
    // individual capabilities to be found and switched off first.
    const result = selectAutomatedLeagues(
      ["L1"],
      [{ league_id: "L1", auto_waiver_pricing: true, paused_at: "2026-08-01T00:00:00Z" }],
    );
    expect(result.enabled).toEqual([]);
    expect(result.skipped[0].reason).toBe("automation paused");
  });

  it("ignores settings for leagues this run does not own", () => {
    const result = selectAutomatedLeagues(["L1"], [on("L1"), on("L2")]);
    expect(result.enabled).toEqual(["L1"]);
  });

  it("partitions a mixed set and reports every skip", () => {
    const result = selectAutomatedLeagues(
      ["L1", "L2", "L3", "L4"],
      [
        on("L1"),
        { league_id: "L2", auto_waiver_pricing: false, paused_at: null },
        { league_id: "L3", auto_waiver_pricing: true, paused_at: "2026-08-01T00:00:00Z" },
      ],
    );
    expect(result.enabled).toEqual(["L1"]);
    expect(result.skipped.map((s) => s.leagueId).sort()).toEqual(["L2", "L3", "L4"]);
  });

  it("de-duplicates repeated ownership rows", () => {
    const result = selectAutomatedLeagues(["L1", "L1"], [on("L1")]);
    expect(result.enabled).toEqual(["L1"]);
  });

  it("survives empty and malformed input", () => {
    expect(selectAutomatedLeagues([], []).enabled).toEqual([]);
    expect(
      selectAutomatedLeagues(["L1"], [{ auto_waiver_pricing: true } as never]).enabled,
    ).toEqual([]);
  });
});
