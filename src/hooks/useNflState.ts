import { useQuery } from '@tanstack/react-query';
import { cachedFetch } from '@/utils/apiCache';
import { CACHE_TTL } from '@/utils/constants';

/**
 * Sleeper's authoritative "what's happening in the NFL right now" endpoint.
 * Cached for 5 minutes — Sleeper updates this server-side as games progress
 * and as the season type rolls over (preseason → regular → post → off).
 *
 * Docs: https://docs.sleeper.com  → "Get NFL state"
 */
export interface SleeperNflState {
  /** 1-based week number for the current season_type. 0 in deep offseason. */
  week: number;
  /** Same as `week` for most callers; Sleeper sometimes diverges these for UI. */
  display_week?: number;
  /** Active season ("2026"). Use for league fetches once league_season is past. */
  season: string;
  /** `pre` | `regular` | `post` | `off` */
  season_type: 'pre' | 'regular' | 'post' | 'off';
  /** Last completed season ("2025"). */
  previous_season: string;
  /** Season scheduled for the next regular-season kickoff ("2026-09-10"). */
  season_start_date?: string;
  /**
   * Sleeper's recommended season string for new league fetches. During
   * July (after the previous season ended but before the new one starts),
   * Sleeper bumps `league_season` to the upcoming year so league lookups
   * return the new season's leagues. Use THIS over `getFullYear()` when
   * fetching `/v1/user/{id}/leagues/nfl/{season}`.
   */
  league_season: string;
  /** Season string for any new league creation flows. */
  league_create_season?: string;
}

const NFL_STATE_URL = 'https://api.sleeper.app/v1/state/nfl';

const fetchNflState = async (): Promise<SleeperNflState> => {
  return cachedFetch<SleeperNflState>(NFL_STATE_URL, {}, CACHE_TTL.MEDIUM);
};

/**
 * Returns Sleeper's live NFL state — current week, season, season type,
 * and the canonical `league_season` to use when fetching user leagues.
 *
 * Always returns a `data` value (defaults to a sensible fallback during
 * the initial fetch / on error) so callers don't need to handle loading.
 */
export const useNflState = () => {
  const query = useQuery<SleeperNflState>({
    queryKey: ['nfl-state'],
    queryFn: fetchNflState,
    staleTime: CACHE_TTL.MEDIUM,
    gcTime: CACHE_TTL.LONG,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const fallbackYear = String(new Date().getFullYear());
  const data: SleeperNflState = query.data ?? {
    week: 0,
    season: fallbackYear,
    season_type: 'off',
    previous_season: String(Number(fallbackYear) - 1),
    league_season: fallbackYear,
  };

  return {
    state: data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

// -- Helpers callers can use without subscribing to the hook ------------

/**
 * Postseason round labels keyed by week relative to `playoff_week_start`.
 * NFL playoffs follow this structure since the 14-team format adopted
 * in 2020:
 *   wild card → divisional → conference → super bowl
 * Sleeper's `state.week` increments through them as `season_type === 'post'`.
 */
const POSTSEASON_LABELS: Record<number, string> = {
  1: 'WILD CARD',
  2: 'DIVISIONAL',
  3: 'CONFERENCE',
  4: 'SUPER BOWL',
};

/**
 * Human-readable label for a given NFL state. Pure function — no hooks.
 * Returns short uppercase strings appropriate for nav badges and chips.
 */
export const formatNflStateLabel = (state: SleeperNflState | null | undefined): string => {
  if (!state) return '';
  switch (state.season_type) {
    case 'pre':
      return state.week > 0 ? `PRE WK ${state.week}` : 'PRESEASON';
    case 'regular':
      return state.week > 0 ? `WK ${state.week} · LIVE` : `${state.season} SEASON`;
    case 'post':
      return POSTSEASON_LABELS[state.week] || 'PLAYOFFS';
    case 'off':
    default:
      // Show the upcoming league season so users don't see "2025" in summer 2026.
      return `OFFSEASON · ${state.league_season ?? state.season}`;
  }
};

/**
 * Should the live "pulsing dot" indicator render? Only true during the
 * regular season and playoffs — keeps preseason/offseason visually quieter.
 */
export const isLiveWeek = (state: SleeperNflState | null | undefined): boolean => {
  if (!state) return false;
  return (state.season_type === 'regular' || state.season_type === 'post') && state.week > 0;
};
