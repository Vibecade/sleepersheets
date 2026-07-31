import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCurrentNFLWeek,
  getSeasonStartDate,
  getLiveNflWeek,
  resolveNflWeek,
} from "./nflWeek";
import { NFL_SEASON } from "./constants";

// Local-time date helper — the week math normalizes to midnight local, so
// tests build dates the same way to avoid UTC-offset drift.
const at = (y: number, m1: number, d: number, h = 12) =>
  new Date(y, m1 - 1, d, h);

describe("getSeasonStartDate", () => {
  // Week 1 kicks off the Thursday after Labor Day (first Monday of Sept).
  // These are the real NFL Week 1 Thursdays — the previous implementation
  // hardcoded Sept 5, which drifts as Labor Day moves.
  it.each([
    [2024, at(2024, 9, 5)],
    [2025, at(2025, 9, 4)],
    [2026, at(2026, 9, 10)],
    [2027, at(2027, 9, 9)],
  ])("resolves %i Week 1 to the Thursday after Labor Day", (year, expected) => {
    const actual = getSeasonStartDate(year as number);
    expect(actual.getFullYear()).toBe((expected as Date).getFullYear());
    expect(actual.getMonth()).toBe((expected as Date).getMonth());
    expect(actual.getDate()).toBe((expected as Date).getDate());
    expect(actual.getDay()).toBe(4); // Thursday
  });
});

describe("getCurrentNFLWeek", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns MIN_WEEK well before the season starts", () => {
    vi.setSystemTime(at(2026, 7, 15));
    expect(getCurrentNFLWeek("2026")).toBe(NFL_SEASON.MIN_WEEK);
  });

  it("returns week 1 on kickoff Thursday", () => {
    vi.setSystemTime(at(2026, 9, 10));
    expect(getCurrentNFLWeek("2026")).toBe(1);
  });

  // REGRESSION: the old hardcoded Sept 5 start reported WEEK 2 on the real
  // Week 1 Sunday of 2026, because Labor Day falls late that year and
  // pushes kickoff to Sept 10. Every week-derived view was off by one for
  // the whole season. Pin the correct answer.
  it("reports week 1 (not 2) on the real Week 1 Sunday of 2026", () => {
    vi.setSystemTime(at(2026, 9, 13));
    expect(getCurrentNFLWeek("2026")).toBe(1);
  });

  it("holds week 1 through the Wednesday before week 2", () => {
    vi.setSystemTime(at(2026, 9, 16));
    expect(getCurrentNFLWeek("2026")).toBe(1);
  });

  it("rolls to week 2 on the next Thursday", () => {
    vi.setSystemTime(at(2026, 9, 17));
    expect(getCurrentNFLWeek("2026")).toBe(2);
  });

  it("advances one week per seven days", () => {
    vi.setSystemTime(at(2026, 10, 8)); // 28 days after Sep 10 kickoff
    expect(getCurrentNFLWeek("2026")).toBe(5);
  });

  it("stays correct for a season whose Labor Day is early (2025)", () => {
    vi.setSystemTime(at(2025, 9, 7)); // real Wk1 Sunday, kickoff Sep 4
    expect(getCurrentNFLWeek("2025")).toBe(1);
  });

  it("caps at MAX_WEEKS deep into the following calendar year", () => {
    vi.setSystemTime(at(2027, 3, 15));
    expect(getCurrentNFLWeek("2026")).toBe(NFL_SEASON.MAX_WEEKS);
  });

  it("falls back to the current calendar year when season is omitted", () => {
    vi.setSystemTime(at(2026, 10, 15));
    const week = getCurrentNFLWeek();
    expect(week).toBeGreaterThanOrEqual(NFL_SEASON.MIN_WEEK);
    expect(week).toBeLessThanOrEqual(NFL_SEASON.MAX_WEEKS);
  });
});

describe("resolveNflWeek", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("prefers Sleeper's settings.leg over the calendar estimate", () => {
    vi.setSystemTime(at(2026, 10, 8)); // calendar would say week 5
    expect(resolveNflWeek({ season: "2026", settings: { leg: 7 } })).toBe(7);
  });

  it("falls back to settings.week when leg is absent", () => {
    vi.setSystemTime(at(2026, 10, 8));
    expect(resolveNflWeek({ season: "2026", settings: { week: 9 } })).toBe(9);
  });

  it("ignores out-of-range values from Sleeper and uses the calendar", () => {
    vi.setSystemTime(at(2026, 10, 8));
    expect(resolveNflWeek({ season: "2026", settings: { leg: 0 } })).toBe(5);
    expect(resolveNflWeek({ season: "2026", settings: { leg: 99 } })).toBe(5);
  });

  it("falls back to the calendar when settings are missing entirely", () => {
    vi.setSystemTime(at(2026, 10, 8));
    expect(resolveNflWeek({ season: "2026" })).toBe(5);
  });

  it("survives a null/undefined league", () => {
    vi.setSystemTime(at(2026, 10, 8));
    expect(resolveNflWeek(null)).toBeGreaterThanOrEqual(NFL_SEASON.MIN_WEEK);
    expect(resolveNflWeek(undefined)).toBeGreaterThanOrEqual(NFL_SEASON.MIN_WEEK);
  });
});

describe("getLiveNflWeek", () => {
  it("returns null in the offseason so we don't render a fake LIVE chip", () => {
    expect(getLiveNflWeek(at(2026, 5, 9))).toBeNull();
    expect(getLiveNflWeek(at(2026, 7, 1))).toBeNull();
  });

  it("returns a week during the regular season", () => {
    expect(getLiveNflWeek(at(2026, 10, 8))).toBe(5);
  });

  it("attributes January to the previous year's season", () => {
    // Jan 2027 is still the 2026 season — should be deep in the playoffs,
    // not clamped back to week 1.
    const week = getLiveNflWeek(at(2027, 1, 10));
    expect(week).not.toBeNull();
    expect(week as number).toBeGreaterThan(15);
  });
});
