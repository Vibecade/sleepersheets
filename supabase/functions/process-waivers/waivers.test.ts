import { describe, it, expect } from "vitest";
import {
  isWaiverTransaction,
  extractWaiverWrites,
  planWaiverWrites,
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
      waiver({ transaction_id: "a", settings: { waiver_bid: 5 } }),
      waiver({ transaction_id: "b", settings: { waiver_bid: 40 } }),
    ]);
    expect(result.writes).toEqual([{ playerId: "p1", rosterId: 3, salary: 40 }]);
    // Both still get recorded so neither is reconsidered next run.
    expect(result.transactionIds).toEqual(["a", "b"]);
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
