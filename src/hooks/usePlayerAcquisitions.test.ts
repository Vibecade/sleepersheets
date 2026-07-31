import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlayerAcquisitions } from "./usePlayerAcquisitions";

/**
 * Acquisition attribution decides what the commissioner Pricing tab shows
 * (drafted players need a manual cost; waivers auto-price from the FAAB
 * bid) and what the Waivers tab treats as RFA candidates at season end.
 * Getting a player's source wrong sends them to the wrong bucket, so the
 * precedence rules are worth pinning.
 *
 * The hook is pure — useMemo over its inputs, no network — so renderHook
 * drives it directly.
 */

const render = (args: {
  rosters: any[];
  transactions?: any[];
  draftPicks?: any[];
}) =>
  renderHook(() =>
    usePlayerAcquisitions({
      rosters: args.rosters,
      transactions: args.transactions ?? [],
      draftPicks: args.draftPicks ?? [],
    }),
  ).result.current;

const tx = (over: Record<string, any> = {}) => ({
  transaction_id: "t1",
  status: "complete",
  type: "waiver",
  created: 1_000,
  ...over,
});

describe("usePlayerAcquisitions — roster membership", () => {
  it("counts players on the active roster, reserve, and taxi as rostered", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"], reserve: ["b"], taxi: ["c"] }],
      transactions: [
        tx({ transaction_id: "t1", adds: { a: 1 } }),
        tx({ transaction_id: "t2", adds: { b: 1 } }),
        tx({ transaction_id: "t3", adds: { c: 1 } }),
      ],
    });
    expect(byPlayer.get("a")?.rosterId).toBe(1);
    expect(byPlayer.get("b")?.rosterId).toBe(1);
    expect(byPlayer.get("c")?.rosterId).toBe(1);
  });

  it("omits players who were added then later dropped", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      transactions: [tx({ adds: { dropped_guy: 1 } })],
    });
    expect(byPlayer.has("dropped_guy")).toBe(false);
  });

  it("ignores empty roster slots ('0')", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["0", "a"] }],
      transactions: [tx({ adds: { "0": 1, a: 1 } })],
    });
    expect(byPlayer.has("0")).toBe(false);
    expect(byPlayer.has("a")).toBe(true);
  });
});

describe("usePlayerAcquisitions — draft attribution", () => {
  it("attributes a player still on the team that drafted them", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      draftPicks: [
        { draft: { start_time: 500 }, picks: [{ player_id: "a", roster_id: 1 }] },
      ],
    });
    expect(byPlayer.get("a")).toMatchObject({
      source: "draft",
      rosterId: 1,
      faabBid: 0,
      acquiredAt: 500,
    });
  });

  it("does NOT attribute a drafted player who now sits on another roster", () => {
    // Drafted by team 1, currently on team 2 — the draft is no longer the
    // accurate story, so it must not be recorded as such.
    const { byPlayer } = render({
      rosters: [
        { roster_id: 1, players: [] },
        { roster_id: 2, players: ["a"] },
      ],
      draftPicks: [
        { draft: { start_time: 500 }, picks: [{ player_id: "a", roster_id: 1 }] },
      ],
    });
    expect(byPlayer.has("a")).toBe(false);
  });

  it("tolerates a draft with no start_time", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      draftPicks: [{ draft: {}, picks: [{ player_id: "a", roster_id: 1 }] }],
    });
    expect(byPlayer.get("a")?.acquiredAt).toBeNull();
  });
});

describe("usePlayerAcquisitions — transaction sources", () => {
  it("captures a waiver claim with its FAAB bid and week", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      transactions: [
        tx({ type: "waiver", adds: { a: 1 }, leg: 4, settings: { waiver_bid: 37 } }),
      ],
    });
    expect(byPlayer.get("a")).toMatchObject({
      source: "waiver",
      faabBid: 37,
      week: 4,
      transactionId: "t1",
    });
  });

  it("records a $0 waiver bid as faabBid 0 rather than dropping it", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      transactions: [tx({ type: "waiver", adds: { a: 1 }, settings: { waiver_bid: 0 } })],
    });
    expect(byPlayer.get("a")).toMatchObject({ source: "waiver", faabBid: 0 });
  });

  it("infers the previous owner on a trade from roster_ids", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 2, players: ["a"] }],
      transactions: [
        tx({ type: "trade", adds: { a: 2 }, roster_ids: [1, 2] }),
      ],
    });
    expect(byPlayer.get("a")).toMatchObject({
      source: "trade",
      rosterId: 2,
      fromRosterId: 1,
      faabBid: 0,
    });
  });

  it("maps an unrecognised transaction type to free_agent", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      transactions: [tx({ type: "something_new", adds: { a: 1 } })],
    });
    expect(byPlayer.get("a")?.source).toBe("free_agent");
  });

  it("ignores transactions that never completed", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      transactions: [tx({ status: "failed", adds: { a: 1 } })],
    });
    expect(byPlayer.has("a")).toBe(false);
  });

  it("ignores an add that landed on a different roster than the player's current one", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 2, players: ["a"] }],
      transactions: [tx({ adds: { a: 1 } })], // added to roster 1, now on 2
    });
    expect(byPlayer.has("a")).toBe(false);
  });
});

describe("usePlayerAcquisitions — precedence", () => {
  it("a later transaction supersedes the draft", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      draftPicks: [
        { draft: { start_time: 500 }, picks: [{ player_id: "a", roster_id: 1 }] },
      ],
      transactions: [
        tx({ type: "waiver", adds: { a: 1 }, created: 900, settings: { waiver_bid: 12 } }),
      ],
    });
    expect(byPlayer.get("a")).toMatchObject({ source: "waiver", faabBid: 12 });
  });

  it("the most recent add wins when a player was added more than once", () => {
    const { byPlayer } = render({
      rosters: [{ roster_id: 1, players: ["a"] }],
      transactions: [
        tx({ transaction_id: "old", type: "free_agent", adds: { a: 1 }, created: 100 }),
        tx({ transaction_id: "new", type: "waiver", adds: { a: 1 }, created: 900, settings: { waiver_bid: 5 } }),
      ],
    });
    expect(byPlayer.get("a")).toMatchObject({
      transactionId: "new",
      source: "waiver",
    });
  });

  it("is order-independent — input ordering does not change the winner", () => {
    const older = tx({ transaction_id: "old", type: "free_agent", adds: { a: 1 }, created: 100 });
    const newer = tx({ transaction_id: "new", type: "trade", adds: { a: 1 }, created: 900, roster_ids: [2, 1] });
    const forward = render({ rosters: [{ roster_id: 1, players: ["a"] }], transactions: [older, newer] });
    const reverse = render({ rosters: [{ roster_id: 1, players: ["a"] }], transactions: [newer, older] });
    expect(forward.byPlayer.get("a")?.transactionId).toBe("new");
    expect(reverse.byPlayer.get("a")?.transactionId).toBe("new");
  });
});

describe("usePlayerAcquisitions — grouping", () => {
  it("groups by roster, newest acquisition first", () => {
    const { byRoster } = render({
      rosters: [{ roster_id: 1, players: ["a", "b"] }],
      transactions: [
        tx({ transaction_id: "t1", adds: { a: 1 }, created: 100 }),
        tx({ transaction_id: "t2", adds: { b: 1 }, created: 900 }),
      ],
    });
    expect(byRoster.get(1)?.map((e) => e.playerId)).toEqual(["b", "a"]);
  });

  it("waiverByRoster contains only waiver pickups", () => {
    const { waiverByRoster } = render({
      rosters: [{ roster_id: 1, players: ["w", "t"] }],
      transactions: [
        tx({ transaction_id: "t1", type: "waiver", adds: { w: 1 } }),
        tx({ transaction_id: "t2", type: "trade", adds: { t: 1 }, roster_ids: [1, 2] }),
      ],
    });
    expect(waiverByRoster.get(1)?.map((e) => e.playerId)).toEqual(["w"]);
  });

  it("omits rosters with no waiver pickups entirely", () => {
    const { waiverByRoster } = render({
      rosters: [{ roster_id: 1, players: ["t"] }],
      transactions: [tx({ type: "trade", adds: { t: 1 }, roster_ids: [1, 2] })],
    });
    expect(waiverByRoster.has(1)).toBe(false);
  });

  it("returns empty structures for an empty league", () => {
    const { byPlayer, byRoster, waiverByRoster } = render({ rosters: [] });
    expect(byPlayer.size).toBe(0);
    expect(byRoster.size).toBe(0);
    expect(waiverByRoster.size).toBe(0);
  });
});
