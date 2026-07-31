import { NFL_SEASON } from './constants';

/**
 * NFL week resolution.
 *
 * There are two possible sources for "what week is it":
 *
 *   1. `league.settings.leg` — Sleeper's own value. Authoritative.
 *   2. A calendar computation from the season start. A fallback for the
 *      cases where we have no league object (marketing header, standalone
 *      analytics charts).
 *
 * Prefer `resolveNflWeek(league)` whenever a league object is in scope.
 * `getCurrentNFLWeek()` is the calendar fallback and should only be reached
 * when Sleeper hasn't told us.
 *
 * The calendar math derives Week 1 from Labor Day rather than a fixed
 * calendar date. NFL Week 1 kicks off the Thursday after Labor Day (the
 * first Monday in September), which moves year to year — a hardcoded date
 * drifts. It was previously pinned to Sept 5, which was correct for 2024,
 * survived 2025 by a day, and would have reported Week 2 during the real
 * Week 1 of 2026.
 */

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Calendar-day index for a date, computed in UTC from its *local* Y/M/D.
 *
 * Subtracting two local midnights and dividing by a fixed 24h is wrong
 * across a DST transition — the elapsed time between them isn't a whole
 * number of days. In Australia/Sydney, for example, Sep 10 → Oct 8 2026
 * spans a spring-forward and measures 27.958 days, so a floor() would
 * report week 4 for the whole of real week 5. Projecting the local
 * calendar date onto UTC removes the offset entirely, so the difference
 * is always an exact multiple of a day in every timezone.
 */
const toCalendarDay = (date: Date): number =>
  Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

/** Whole calendar days from `from` to `to`. DST-safe. */
const daysBetween = (from: Date, to: Date): number =>
  Math.round((toCalendarDay(to) - toCalendarDay(from)) / MS_PER_DAY);

/** First Monday of September for the given year. */
const getLaborDay = (seasonYear: number): Date => {
  const date = new Date(seasonYear, NFL_SEASON.SEASON_START_MONTH, 1);
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }
  return date;
};

/**
 * Kickoff date for Week 1 of a given season — the Thursday after Labor Day.
 * Exported for tests and for anything that needs the season boundary.
 */
export const getSeasonStartDate = (seasonYear: number): Date => {
  const laborDay = getLaborDay(seasonYear);
  const kickoff = new Date(laborDay);
  kickoff.setDate(laborDay.getDate() + NFL_SEASON.WEEK1_OFFSET_FROM_LABOR_DAY);
  return kickoff;
};

/**
 * Start of the *fantasy* week-1 window — the Tuesday before kickoff.
 *
 * Fantasy weeks don't run Thursday→Wednesday alongside the NFL schedule.
 * Sleeper advances `settings.leg` on Tuesday, once the previous week's
 * Monday-night game is final and waivers roll. Anchoring the calendar
 * fallback to that Tuesday keeps it in step with `resolveNflWeek(league)`;
 * anchoring to kickoff instead left the two disagreeing every Tuesday and
 * Wednesday, so callers without a league object (the marketing header,
 * standalone analytics) would label and fetch the previous week.
 */
const getWeekWindowStart = (seasonYear: number): Date => {
  const kickoff = getSeasonStartDate(seasonYear);
  const tuesday = new Date(kickoff);
  tuesday.setDate(kickoff.getDate() - NFL_SEASON.WEEK_ROLLOVER_DAYS_BEFORE_KICKOFF);
  return tuesday;
};

/**
 * Calendar-derived NFL week for a season. Falls back to the current
 * calendar year when no season is supplied.
 *
 * Prefer `resolveNflWeek(league)` when a league object is available —
 * Sleeper's `settings.leg` is authoritative and this is only an estimate.
 */
export const getCurrentNFLWeek = (season?: string, now: Date = new Date()): number => {
  const fallbackYear = now.getFullYear();
  const seasonYear = Number.parseInt(season ?? `${fallbackYear}`, 10) || fallbackYear;
  const windowStart = getWeekWindowStart(seasonYear);

  const diffDays = daysBetween(windowStart, now);
  if (diffDays < 0) {
    return NFL_SEASON.MIN_WEEK;
  }

  const weekNumber = Math.floor(diffDays / 7) + 1;

  return Math.min(Math.max(weekNumber, NFL_SEASON.MIN_WEEK), NFL_SEASON.MAX_WEEKS);
};

/**
 * The current NFL week for a league, preferring Sleeper's own value.
 *
 * `settings.leg` is Sleeper's current week pointer; `settings.week` is a
 * legacy alias some payloads still carry. Either is trusted when it's a
 * sane week number; otherwise we fall back to the calendar estimate keyed
 * off the league's season.
 */
export const resolveNflWeek = (league: any, now: Date = new Date()): number => {
  const candidates = [league?.settings?.leg, league?.settings?.week];

  for (const value of candidates) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= NFL_SEASON.MIN_WEEK &&
      value <= NFL_SEASON.MAX_WEEKS
    ) {
      return value;
    }
  }

  return getCurrentNFLWeek(league?.season, now);
};

/**
 * Current NFL week for display when no league is loaded (marketing header).
 * Returns `null` outside the season window so we don't render a fake
 * "LIVE" indicator in June.
 */
export const getLiveNflWeek = (now: Date = new Date()): number | null => {
  const month = now.getMonth();
  const day = now.getDate();

  // In-season window: Sept 1 → Feb 14 (regular season + playoffs).
  const inSeason = month >= NFL_SEASON.SEASON_START_MONTH || month === 0 || (month === 1 && day <= 14);
  if (!inSeason) return null;

  // Jan / early Feb belong to the previous calendar year's season.
  const seasonYear = month <= 1 ? now.getFullYear() - 1 : now.getFullYear();
  return getCurrentNFLWeek(String(seasonYear), now);
};
