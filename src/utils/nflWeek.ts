import { NFL_SEASON } from './constants';

/**
 * Compute the current NFL week for a given season year.
 * Falls back to the current year when a season value is not provided.
 */
export const getCurrentNFLWeek = (season?: string): number => {
  const now = new Date();
  const fallbackYear = now.getFullYear();
  const seasonYear = Number.parseInt(season ?? `${fallbackYear}`, 10) || fallbackYear;
  const seasonStart = new Date(
    seasonYear,
    NFL_SEASON.SEASON_START_MONTH,
    NFL_SEASON.SEASON_START_DAY
  );

  if (now < seasonStart) {
    return NFL_SEASON.MIN_WEEK;
  }

  const diffTime = now.getTime() - seasonStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const weekNumber = Math.floor((diffDays + 2) / 7) + 1;

  return Math.min(Math.max(weekNumber, NFL_SEASON.MIN_WEEK), NFL_SEASON.MAX_WEEKS);
};
