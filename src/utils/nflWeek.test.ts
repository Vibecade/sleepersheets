import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getCurrentNFLWeek,
  getSeasonStartDate,
  getLiveNflWeek,
  resolveNflWeek,
  describeLeagueWeek,
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

  it("holds week 1 through Monday night", () => {
    vi.setSystemTime(at(2026, 9, 14)); // Monday of week 1
    expect(getCurrentNFLWeek("2026")).toBe(1);
  });

  // Fantasy weeks roll on Tuesday once MNF is final and waivers process —
  // that's when Sleeper advances settings.leg. Anchoring to Thursday
  // kickoff instead left the calendar fallback a week behind every
  // Tuesday and Wednesday.
  it("rolls to week 2 on Tuesday, not Thursday", () => {
    vi.setSystemTime(at(2026, 9, 15)); // Tuesday
    expect(getCurrentNFLWeek("2026")).toBe(2);
  });

  it("is already week 2 by Wednesday", () => {
    vi.setSystemTime(at(2026, 9, 16));
    expect(getCurrentNFLWeek("2026")).toBe(2);
  });

  it("stays week 2 through that week's Thursday kickoff", () => {
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

  // Guards the DST bug: subtracting local midnights and dividing by a
  // fixed 24h undercounts across a spring-forward, which reported week 4
  // for the whole of real week 5 in southern-hemisphere timezones. The
  // calculation now projects local calendar dates onto UTC, so time of
  // day is irrelevant and no offset can creep in.
  it("is independent of time of day", () => {
    const hours = [0, 1, 6, 12, 18, 23];
    const weeks = hours.map((h) => {
      vi.setSystemTime(at(2026, 10, 8, h));
      return getCurrentNFLWeek("2026");
    });
    expect(new Set(weeks).size).toBe(1);
  });

  it("counts whole weeks across a DST transition", () => {
    // Oct 6 and Nov 3 2026 are both Tuesdays, exactly 4 weeks apart, and
    // most northern-hemisphere zones change clocks between them.
    vi.setSystemTime(at(2026, 10, 6));
    const before = getCurrentNFLWeek("2026");
    vi.setSystemTime(at(2026, 11, 3));
    const after = getCurrentNFLWeek("2026");
    expect(after - before).toBe(4);
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

describe('describeLeagueWeek', () => {
  const leagueAt = (week: number, playoffStart?: number) => ({
    settings: { leg: week, ...(playoffStart === undefined ? {} : { playoff_week_start: playoffStart }) },
  });

  it('counts the regular season as playoff_week_start - 1', () => {
    // playoff_week_start: 15 means weeks 1-14 are the regular season.
    const result = describeLeagueWeek(leagueAt(5, 15));
    expect(result.totalWeeks).toBe(14);
    expect(result.label).toBe('WEEK 5 OF 14');
    expect(result.isPlayoffs).toBe(false);
  });

  it('does not render "WEEK 15 OF 14" once the playoffs start', () => {
    // The regression this helper exists for. Every league hit this, every
    // year, as soon as leg reached playoff_week_start.
    const result = describeLeagueWeek(leagueAt(15, 15));
    expect(result.label).toBe('WEEK 15 · PLAYOFFS');
    expect(result.isPlayoffs).toBe(true);
    expect(result.label).not.toContain(' OF ');
  });

  it('stays in playoff phrasing for later playoff weeks', () => {
    expect(describeLeagueWeek(leagueAt(17, 15)).label).toBe('WEEK 17 · PLAYOFFS');
  });

  it('switches phrasing exactly at the cutoff, not before', () => {
    expect(describeLeagueWeek(leagueAt(14, 15)).isPlayoffs).toBe(false);
    expect(describeLeagueWeek(leagueAt(15, 15)).isPlayoffs).toBe(true);
  });

  it('honours a non-default playoff start', () => {
    expect(describeLeagueWeek(leagueAt(12, 14)).label).toBe('WEEK 12 OF 13');
    expect(describeLeagueWeek(leagueAt(14, 14)).label).toBe('WEEK 14 · PLAYOFFS');
  });

  it('reports preseason rather than "WEEK 0 OF 14"', () => {
    const result = describeLeagueWeek(leagueAt(0, 15));
    expect(result.label).toBe('PRESEASON');
    expect(result.isPreseason).toBe(true);
  });

  it('falls back to a 17-week regular season when playoff_week_start is missing', () => {
    expect(describeLeagueWeek(leagueAt(5)).label).toBe('WEEK 5 OF 17');
  });

  it('drops the denominator rather than assert a total it cannot back up', () => {
    // No playoff info and past the fallback length: "WEEK 18 OF 17" would
    // be the same bug in a different costume.
    expect(describeLeagueWeek(leagueAt(18)).label).toBe('WEEK 18');
  });

  it('reads the legacy settings.week alias', () => {
    expect(describeLeagueWeek({ settings: { week: 6, playoff_week_start: 15 } }).label).toBe('WEEK 6 OF 14');
  });

  it('prefers leg over the legacy alias', () => {
    expect(
      describeLeagueWeek({ settings: { leg: 8, week: 3, playoff_week_start: 15 } }).label
    ).toBe('WEEK 8 OF 14');
  });

  it('treats a missing or malformed league as preseason instead of throwing', () => {
    expect(describeLeagueWeek(undefined).label).toBe('PRESEASON');
    expect(describeLeagueWeek({}).label).toBe('PRESEASON');
    expect(describeLeagueWeek({ settings: { leg: 'not-a-number' } }).label).toBe('PRESEASON');
  });

  it('ignores a playoff_week_start of 1, which would imply a zero-week season', () => {
    expect(describeLeagueWeek(leagueAt(5, 1)).totalWeeks).toBe(17);
  });
});
