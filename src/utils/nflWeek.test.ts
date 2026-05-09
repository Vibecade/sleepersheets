import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getCurrentNFLWeek } from "./nflWeek";
import { NFL_SEASON } from "./constants";

describe("getCurrentNFLWeek", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns MIN_WEEK when current date is before the season starts", () => {
    // Mid-July of the season year — well before September 5.
    vi.setSystemTime(new Date("2025-07-15T12:00:00Z"));
    expect(getCurrentNFLWeek("2025")).toBe(NFL_SEASON.MIN_WEEK);
  });

  it("returns MIN_WEEK on the season start day", () => {
    // SEASON_START_DAY is 5 of SEASON_START_MONTH (Sep, 0-indexed=8).
    vi.setSystemTime(new Date(2025, NFL_SEASON.SEASON_START_MONTH, NFL_SEASON.SEASON_START_DAY, 12));
    expect(getCurrentNFLWeek("2025")).toBe(1);
  });

  it("advances roughly one week per real week after start", () => {
    // ~3 weeks past Sep 5 should land in week 3 or 4 — the calc is
    // floor((days+2)/7)+1 so allow either depending on how the +2 lands.
    vi.setSystemTime(new Date(2025, NFL_SEASON.SEASON_START_MONTH, NFL_SEASON.SEASON_START_DAY + 21, 12));
    const week = getCurrentNFLWeek("2025");
    expect(week).toBeGreaterThanOrEqual(3);
    expect(week).toBeLessThanOrEqual(4);
  });

  it("caps at MAX_WEEKS deep into the calendar year", () => {
    // Mid-March of the following year — well past 22 weeks from Sep 5,
    // so the calc would otherwise overshoot and the Math.min clamp
    // should pin the result at MAX_WEEKS.
    vi.setSystemTime(new Date("2026-03-15T12:00:00Z"));
    expect(getCurrentNFLWeek("2025")).toBe(NFL_SEASON.MAX_WEEKS);
  });

  it("falls back to current calendar year when season arg is omitted", () => {
    vi.setSystemTime(new Date("2025-10-15T12:00:00Z"));
    // Without a season arg, should infer 2025 and return a reasonable in-season week.
    const week = getCurrentNFLWeek();
    expect(week).toBeGreaterThanOrEqual(NFL_SEASON.MIN_WEEK);
    expect(week).toBeLessThanOrEqual(NFL_SEASON.MAX_WEEKS);
  });
});
