import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cachedFetch } from '@/utils/apiCache';
import { CACHE_TTL } from '@/utils/constants';
import { getCurrentNFLWeek } from '@/utils/nflWeek';
import { isDemoLeagueId } from '@/utils/demoData';

interface UseGamificationInsightsParams {
  leagueId?: string;
  season?: string;
  leagueWeek?: number;
}

export interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points?: number;
}

export interface SleeperBracketEntry {
  [key: string]: unknown;
  w?: number;
  l?: number;
  t1?: number;
  t2?: number;
}

export interface SleeperTradedPick {
  owner_id?: number;
  previous_owner_id?: number;
  season?: string;
  round?: number;
}

export interface SleeperTrendingEntry {
  player_id: string;
  count?: number;
}

export interface GamificationInsightsPayload {
  week: number;
  matchups: SleeperMatchup[];
  winnersBracket: SleeperBracketEntry[];
  losersBracket: SleeperBracketEntry[];
  tradedPicks: SleeperTradedPick[];
  trendingAdds: SleeperTrendingEntry[];
  trendingDrops: SleeperTrendingEntry[];
  unavailableSources: string[];
}

const DEFAULT_PAYLOAD: GamificationInsightsPayload = {
  week: 1,
  matchups: [],
  winnersBracket: [],
  losersBracket: [],
  tradedPicks: [],
  trendingAdds: [],
  trendingDrops: [],
  unavailableSources: [],
};

const getSettledValue = <T>(
  result: PromiseSettledResult<T>,
  sourceName: string,
  fallback: T,
  unavailableSources: string[]
): T => {
  if (result.status === 'fulfilled') {
    return result.value;
  }
  unavailableSources.push(sourceName);
  return fallback;
};

export const useGamificationInsights = ({
  leagueId,
  season,
  leagueWeek,
}: UseGamificationInsightsParams) => {
  const effectiveWeek = useMemo(() => {
    if (typeof leagueWeek === 'number' && leagueWeek > 0) {
      return leagueWeek;
    }
    return getCurrentNFLWeek(season);
  }, [leagueWeek, season]);

  const query = useQuery<GamificationInsightsPayload>({
    queryKey: ['gamification-insights', leagueId, effectiveWeek],
    // DEMO_LEAGUE has no Sleeper counterpart; querying it only produces 404s.
    enabled: Boolean(leagueId) && !isDemoLeagueId(leagueId),
    staleTime: CACHE_TTL.SHORT,
    gcTime: CACHE_TTL.LONG,
    queryFn: async () => {
      if (!leagueId) {
        return { ...DEFAULT_PAYLOAD, week: effectiveWeek };
      }

      const results = await Promise.allSettled([
        cachedFetch<SleeperMatchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${effectiveWeek}`,
          {},
          CACHE_TTL.SHORT,
          `league-${leagueId}`,
          'high'
        ),
        cachedFetch<SleeperBracketEntry[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/winners_bracket`,
          {},
          CACHE_TTL.MEDIUM,
          `league-${leagueId}`
        ),
        cachedFetch<SleeperBracketEntry[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/losers_bracket`,
          {},
          CACHE_TTL.MEDIUM,
          `league-${leagueId}`
        ),
        cachedFetch<SleeperTradedPick[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/traded_picks`,
          {},
          CACHE_TTL.MEDIUM,
          `league-${leagueId}`
        ),
        cachedFetch<SleeperTrendingEntry[]>(
          'https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=12',
          {},
          CACHE_TTL.SHORT
        ),
        cachedFetch<SleeperTrendingEntry[]>(
          'https://api.sleeper.app/v1/players/nfl/trending/drop?lookback_hours=24&limit=12',
          {},
          CACHE_TTL.SHORT
        ),
      ]);

      const unavailableSources: string[] = [];

      return {
        week: effectiveWeek,
        matchups: getSettledValue(results[0], 'matchups', [], unavailableSources),
        winnersBracket: getSettledValue(results[1], 'winners_bracket', [], unavailableSources),
        losersBracket: getSettledValue(results[2], 'losers_bracket', [], unavailableSources),
        tradedPicks: getSettledValue(results[3], 'traded_picks', [], unavailableSources),
        trendingAdds: getSettledValue(results[4], 'trending_add', [], unavailableSources),
        trendingDrops: getSettledValue(results[5], 'trending_drop', [], unavailableSources),
        unavailableSources,
      };
    },
  });

  return {
    data: query.data ?? { ...DEFAULT_PAYLOAD, week: effectiveWeek },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
};
