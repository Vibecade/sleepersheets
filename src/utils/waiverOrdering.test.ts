import { describe, it, expect } from "vitest";
import { waiverTimestamp, sortWaiversOldestFirst } from "./waiverOrdering";

/**
 * Waiver salary writes are last-write-wins per player, so ordering decides
 * the final number. `fetchLeagueData` concatenates each week's
 * transactions in week order but does not sort within a week, so array
 * order is not a safe proxy for chronology.
 *
 * The same rules are implemented in
 * supabase/functions/process-waivers/waivers.ts — a claim priced by the
 * client and by the scheduled job must land on the same value.
 */

describe("waiverTimestamp", () => {
  it("prefers created", () => {
    expect(waiverTimestamp({ created: 500, status_updated: 900 })).toBe(500);
  });

  it("falls back to status_updated when created is absent", () => {
    expect(waiverTimestamp({ status_updated: 900 })).toBe(900);
    expect(waiverTimestamp({ created: null, status_updated: 900 })).toBe(900);
  });

  it("coerces numeric strings", () => {
    expect(waiverTimestamp({ created: "1500" })).toBe(1500);
  });

  // Sorting first means an undated claim can never displace a dated one.
  it("treats missing or unparseable timestamps as 0", () => {
    expect(waiverTimestamp({})).toBe(0);
    expect(waiverTimestamp({ created: null, status_updated: null })).toBe(0);
    expect(waiverTimestamp({ created: "not-a-number" })).toBe(0);
  });
});

describe("sortWaiversOldestFirst", () => {
  const tx = (id: string, created: number | null) => ({ id, created });

  it("orders oldest first", () => {
    const sorted = sortWaiversOldestFirst([
      tx("c", 900),
      tx("a", 100),
      tx("b", 500),
    ]);
    expect(sorted.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input", () => {
    const input = [tx("c", 900), tx("a", 100)];
    const copy = [...input];
    sortWaiversOldestFirst(input);
    expect(input).toEqual(copy);
  });

  it("sorts undated claims ahead of dated ones", () => {
    const sorted = sortWaiversOldestFirst([tx("dated", 100), tx("undated", null)]);
    expect(sorted.map((t) => t.id)).toEqual(["undated", "dated"]);
  });

  it("mixes created and status_updated on a common scale", () => {
    const sorted = sortWaiversOldestFirst([
      { id: "b", status_updated: 900 },
      { id: "a", created: 100 },
    ]);
    expect(sorted.map((t) => (t as { id: string }).id)).toEqual(["a", "b"]);
  });

  it("survives empty and nullish input", () => {
    expect(sortWaiversOldestFirst([])).toEqual([]);
    expect(sortWaiversOldestFirst(null as never)).toEqual([]);
  });

  /**
   * The scenario this exists for: a player claimed twice in the fetched
   * window. Whichever claim is applied LAST sets the salary, so the
   * newest must sort last regardless of how the API returned them.
   */
  it("puts the newest claim last regardless of input order", () => {
    const older = tx("older-5-dollar-bid", 100);
    const newer = tx("newer-40-dollar-bid", 900);

    expect(sortWaiversOldestFirst([older, newer]).at(-1)?.id).toBe(
      "newer-40-dollar-bid",
    );
    expect(sortWaiversOldestFirst([newer, older]).at(-1)?.id).toBe(
      "newer-40-dollar-bid",
    );
  });
});
