import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * FAAB spend drives every team's remaining waiver budget — the number
 * managers check before deciding what to bid. It's derived purely from the
 * transaction log, but lives behind four Supabase-backed hooks, so those
 * are mocked out here and the transaction math is driven directly.
 *
 * Scope note: `teamFAAB` (which blends budget with salary-cap state) and
 * the dead-cap helpers are not covered here — they need real settings and
 * salary fixtures. This suite covers the spend ledger and the
 * per-player FAAB lookups that the Pricing panel's waiver gating relies on.
 */

const mockSalaries = { salaries: {}, getEffectiveSalary: vi.fn(), getSalaryCapContribution: vi.fn() };
const mockSettings = { settings: { salary_cap: 200000, faab_cap: 100 } };
const mockDeadCap = { deadCapPlayers: [] as any[] };
const mockContracts = { contracts: {} as Record<string, number | null> };

vi.mock("./usePlayerSalaries", () => ({
  usePlayerSalaries: () => mockSalaries,
}));
vi.mock("./useLeagueSettings", () => ({
  useLeagueSettings: () => mockSettings,
}));
vi.mock("./useDeadCapPlayers", () => ({
  useDeadCapPlayers: () => mockDeadCap,
}));
vi.mock("./usePlayerContracts", () => ({
  usePlayerContracts: () => mockContracts,
}));

import { useFAABCalculations } from "./useFAABCalculations";

const render = (transactions: any[], rosters: any[] = [{ roster_id: 1 }]) =>
  renderHook(() =>
    useFAABCalculations({ rosters, leagueId: "L1", transactions }),
  ).result.current;

const waiver = (over: Record<string, any> = {}) => ({
  transaction_id: "t1",
  status: "complete",
  type: "waiver",
  roster_ids: [1],
  adds: { p1: 1 },
  settings: { waiver_bid: 25 },
  ...over,
});

beforeEach(() => {
  mockContracts.contracts = {};
});

describe("faabSpentByRoster", () => {
  it("accumulates a completed waiver bid against the claiming roster", () => {
    const { faabSpentByRoster } = render([waiver()]);
    expect(faabSpentByRoster[1]).toBe(25);
  });

  it("sums multiple claims by the same roster", () => {
    const { faabSpentByRoster } = render([
      waiver({ transaction_id: "a", settings: { waiver_bid: 25 } }),
      waiver({ transaction_id: "b", adds: { p2: 1 }, settings: { waiver_bid: 40 } }),
    ]);
    expect(faabSpentByRoster[1]).toBe(65);
  });

  it("keeps rosters separate", () => {
    const { faabSpentByRoster } = render([
      waiver({ transaction_id: "a", roster_ids: [1], adds: { p1: 1 }, settings: { waiver_bid: 25 } }),
      waiver({ transaction_id: "b", roster_ids: [2], adds: { p2: 2 }, settings: { waiver_bid: 10 } }),
    ]);
    expect(faabSpentByRoster).toEqual({ 1: 25, 2: 10 });
  });

  it("does NOT charge for a failed claim", () => {
    // Losing a waiver shouldn't cost budget — this is the one that would
    // most visibly overcharge a manager if it regressed.
    const { faabSpentByRoster } = render([waiver({ status: "failed" })]);
    expect(faabSpentByRoster[1]).toBeUndefined();
  });

  it("does NOT charge when the bid won but no player actually landed on the roster", () => {
    const { faabSpentByRoster } = render([waiver({ adds: { p1: 2 } })]); // added to roster 2, bid by 1
    expect(faabSpentByRoster[1]).toBeUndefined();
  });

  it("ignores a transaction with no bid", () => {
    const { faabSpentByRoster } = render([waiver({ settings: {} })]);
    expect(faabSpentByRoster[1]).toBeUndefined();
  });

  it("ignores a free-agent add with no FAAB attached", () => {
    const { faabSpentByRoster } = render([
      waiver({ type: "free_agent", settings: undefined }),
    ]);
    expect(faabSpentByRoster[1]).toBeUndefined();
  });

  it("charges the sender on a FAAB transfer between teams", () => {
    const { faabSpentByRoster } = render([
      {
        transaction_id: "trade1",
        status: "complete",
        type: "trade",
        roster_ids: [1, 2],
        waiver_budget: [{ sender: 2, receiver: 1, amount: 15 }],
      },
    ]);
    expect(faabSpentByRoster[2]).toBe(15);
  });

  it("combines a bid and a budget transfer in one pass", () => {
    const { faabSpentByRoster } = render([
      waiver({ transaction_id: "w", settings: { waiver_bid: 25 } }),
      {
        transaction_id: "tr",
        status: "complete",
        type: "trade",
        roster_ids: [1, 2],
        waiver_budget: [{ sender: 1, receiver: 2, amount: 5 }],
      },
    ]);
    expect(faabSpentByRoster[1]).toBe(30);
  });

  it("returns an empty ledger for no transactions", () => {
    const { faabSpentByRoster } = render([]);
    expect(faabSpentByRoster).toEqual({});
  });
});

describe("getPlayerFAABCost / isPlayerFAABAcquisition", () => {
  it("returns the winning bid for a player claimed on waivers", () => {
    const { getPlayerFAABCost } = render([waiver({ settings: { waiver_bid: 33 } })]);
    expect(getPlayerFAABCost("p1", 1)).toBe(33);
  });

  it("returns 0 for a player on a different roster", () => {
    const { getPlayerFAABCost } = render([waiver()]);
    expect(getPlayerFAABCost("p1", 2)).toBe(0);
  });

  it("returns 0 for a player never claimed", () => {
    const { getPlayerFAABCost } = render([waiver()]);
    expect(getPlayerFAABCost("never_claimed", 1)).toBe(0);
  });

  it("ignores incomplete transactions", () => {
    const { getPlayerFAABCost } = render([waiver({ status: "processing" })]);
    expect(getPlayerFAABCost("p1", 1)).toBe(0);
  });

  it("flags a bid-winning player as a FAAB acquisition", () => {
    const { isPlayerFAABAcquisition } = render([waiver({ settings: { waiver_bid: 10 } })]);
    expect(isPlayerFAABAcquisition("p1", 1)).toBe(true);
  });

  /**
   * Documents the guard split the Pricing panel works around: this check is
   * bid-based (`cost > 0`), so a $0-bid waiver claim reads as NOT a FAAB
   * acquisition here — while `usePlayerContracts.updateContract` rejects it
   * as one, because the salary row was stamped acquisition_type='faab' by
   * the auto-applier regardless of bid size. The Pricing panel hides the
   * contract control for waiver-sourced players rather than relying on
   * these two agreeing.
   */
  it("does NOT flag a $0-bid waiver claim as a FAAB acquisition", () => {
    const { isPlayerFAABAcquisition } = render([waiver({ settings: { waiver_bid: 0 } })]);
    expect(isPlayerFAABAcquisition("p1", 1)).toBe(false);
  });
});
