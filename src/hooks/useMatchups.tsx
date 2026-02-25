import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cachedFetch } from '@/utils/apiCache';
import { CACHE_TTL } from '@/utils/constants';
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

export const useMatchups = (leagueId: string, week: number) => {
  const getCurrentNFLWeekForSeason = useCallback((leagueSeason?: string) => {
    return getCurrentNFLWeek(leagueSeason);
  }, []);

  const currentNFLWeek = getCurrentNFLWeekForSeason();
  const isCurrentWeek = week === currentNFLWeek;
  const cacheTTL = isCurrentWeek ? 60 * 1000 : CACHE_TTL.MEDIUM;

  const query = useQuery<Matchup[], Error>({
    queryKey: ['matchups', leagueId, week],
    enabled: Boolean(leagueId && week),
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
