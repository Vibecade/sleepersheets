import { describe, it, expect } from "vitest";
import { selectUnpricedPlayerIds } from "./pricing";

/**
 * This selector backs two surfaces at once — the Pricing tab's count
 * badge and the list inside the panel — so its definition of "unpriced"
 * has to be exact. A badge that disagrees with the rows it points at is
 * worse than no badge.
 */

const roster = (
  roster_id: number,
  opts: { players?: string[]; reserve?: string[]; taxi?: string[] } = {},
) => ({ roster_id, ...opts });

describe("selectUnpricedPlayerIds", () => {
  it("includes players with no salary row at all", () => {
    const ids = selectUnpricedPlayerIds([roster(1, { players: ["a"] })], {});
    expect([...ids]).toEqual(["a"]);
  });

  it("includes players whose salary is explicitly null", () => {
    const ids = selectUnpricedPlayerIds([roster(1, { players: ["a"] })], { a: null });
    expect([...ids]).toEqual(["a"]);
  });

  // $0 is treated the same as unset: a waiver claim won at a $0 bid, or a
  // row written before a real cost was decided, still needs pricing.
  it("includes players priced at $0", () => {
    const ids = selectUnpricedPlayerIds([roster(1, { players: ["a"] })], { a: 0 });
    expect([...ids]).toEqual(["a"]);
  });

  it("excludes players with a positive salary", () => {
    const ids = selectUnpricedPlayerIds([roster(1, { players: ["a"] })], { a: 1 });
    expect(ids.size).toBe(0);
  });

  it("scans active, reserve, and taxi slots", () => {
    const ids = selectUnpricedPlayerIds(
      [roster(1, { players: ["a"], reserve: ["b"], taxi: ["c"] })],
      { a: 100 },
    );
    expect([...ids].sort()).toEqual(["b", "c"]);
  });

  it("ignores empty roster slots and falsy ids", () => {
    const ids = selectUnpricedPlayerIds(
      [roster(1, { players: ["0", "", "a"] as string[] })],
      {},
    );
    expect([...ids]).toEqual(["a"]);
  });

  it("aggregates across every roster in the league", () => {
    const ids = selectUnpricedPlayerIds(
      [roster(1, { players: ["a"] }), roster(2, { players: ["b"] })],
      { a: 500 },
    );
    expect([...ids]).toEqual(["b"]);
  });

  it("dedupes a player id that appears more than once", () => {
    // Shouldn't happen in Sleeper data, but the badge showing a count
    // higher than the number of rows would be a confusing way to find out.
    const ids = selectUnpricedPlayerIds(
      [roster(1, { players: ["a"], taxi: ["a"] })],
      {},
    );
    expect(ids.size).toBe(1);
  });

  it("returns an empty set when every player is priced", () => {
    const ids = selectUnpricedPlayerIds([roster(1, { players: ["a", "b"] })], {
      a: 100,
      b: 200,
    });
    expect(ids.size).toBe(0);
  });

  it("handles rosters with missing slot arrays", () => {
    const ids = selectUnpricedPlayerIds([{ roster_id: 1 }], {});
    expect(ids.size).toBe(0);
  });

  it("survives empty or nullish input", () => {
    expect(selectUnpricedPlayerIds([], {}).size).toBe(0);
    expect(selectUnpricedPlayerIds(null as any, {}).size).toBe(0);
    expect(selectUnpricedPlayerIds([roster(1, { players: ["a"] })], null as any).size).toBe(1);
  });
});
