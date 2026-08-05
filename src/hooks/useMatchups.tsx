import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cachedFetch } from '@/utils/apiCache';
import { CACHE_TTL } from '@/utils/constants';
import { isDemoLeagueId } from '@/utils/demoData';
import { getCurrentNFLWeek } from '@/utils/nflWeek';
import { logger } from '@/utils/logger';

export interface Matchup {
  starters: string[];
  roster_id: number;
  players: string[];
  matchup_id: number;
  points: number;
  custom_points: number | null;
}

/**
 * @param currentWeek The league's resolved current week. Callers that have
 *   a league object should pass `resolveNflWeek(league)` so the "is this
 *   the live week?" decision (60s cache + empty-response retry) is keyed
 *   off Sleeper's truth. Omitting it falls back to the calendar estimate,
 *   which has no season context and is wrong in Jan/Feb during playoffs.
 */
export const useMatchups = (leagueId: string, week: number, currentWeek?: number) => {
  const getCurrentNFLWeekForSeason = useCallback((leagueSeason?: string) => {
    return getCurrentNFLWeek(leagueSeason);
  }, []);

  const currentNFLWeek = currentWeek ?? getCurrentNFLWeekForSeason();
  const isCurrentWeek = week === currentNFLWeek;
  const cacheTTL = isCurrentWeek ? 60 * 1000 : CACHE_TTL.MEDIUM;

  const query = useQuery<Matchup[], Error>({
    queryKey: ['matchups', leagueId, week],
    // DEMO_LEAGUE has no Sleeper counterpart; querying it only produces 404s.
    enabled: Boolean(leagueId && week) && !isDemoLeagueId(leagueId),
    staleTime: cacheTTL,
    gcTime: CACHE_TTL.LONG,
    queryFn: async () => {
      logger.debug(`Fetching matchups for league ${leagueId}, week ${week}`);

      const data = await cachedFetch<Matchup[]>(
        `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
        {},
        cacheTTL,
        undefined,
        'high'
      );

      if ((!data || data.length === 0) && isCurrentWeek) {
        logger.debug('Empty current-week matchups response. Retrying with cache buster.');
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const retryData = await cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}?cb=${Date.now()}`,
          {},
          30 * 1000,
          undefined,
          'high'
        );

        return retryData || [];
      }

      return data || [];
    },
  });

  return {
    matchups: query.data ?? [],
    loading: query.isLoading || query.isFetching,
    error: query.error?.message ?? null,
    getCurrentNFLWeek: getCurrentNFLWeekForSeason,
  };
};
