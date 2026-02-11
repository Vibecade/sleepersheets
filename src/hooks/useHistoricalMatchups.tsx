import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cachedFetch } from '@/utils/apiCache';
import { Matchup } from './useMatchups';
import { CACHE_TTL } from '@/utils/constants';

export interface WeeklyMatchups {
  week: number;
  matchups: Matchup[];
}

export interface WeeklyPerformance {
  week: number;
  points: number;
  aboveAverage: boolean;
  difference: number;
}

export interface TeamWeeklyData {
  rosterId: number;
  weeklyPerformance: WeeklyPerformance[];
}

interface HistoricalMatchupsResult {
  historicalMatchups: WeeklyMatchups[];
  teamWeeklyData: TeamWeeklyData[];
  weeklyAverages: Record<number, number>;
}

const EMPTY_RESULT: HistoricalMatchupsResult = {
  historicalMatchups: [],
  teamWeeklyData: [],
  weeklyAverages: {},
};

export const useHistoricalMatchups = (leagueId: string, currentWeek: number) => {
  const query = useQuery<HistoricalMatchupsResult, Error>({
    queryKey: ['historical-matchups', leagueId, currentWeek],
    enabled: Boolean(leagueId) && currentWeek > 1,
    staleTime: CACHE_TTL.MEDIUM,
    gcTime: CACHE_TTL.LONG,
    queryFn: async () => {
      const promises: Promise<WeeklyMatchups>[] = [];

      for (let week = 1; week < currentWeek; week++) {
        const promise = cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
          {},
          CACHE_TTL.MEDIUM,
          undefined,
          'normal'
        ).then((matchups) => ({
          week,
          matchups: matchups || [],
        }));
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const filteredResults = results.filter((result) => result.matchups.length > 0);
      const averages: Record<number, number> = {};
      const teamData: Record<number, WeeklyPerformance[]> = {};

      filteredResults.forEach(({ week, matchups }) => {
        const weekTotal = matchups.reduce((sum, matchup) => sum + matchup.points, 0);
        const weekAverage = weekTotal / matchups.length;
        averages[week] = weekAverage;

        matchups.forEach((matchup) => {
          if (!teamData[matchup.roster_id]) {
            teamData[matchup.roster_id] = [];
          }

          teamData[matchup.roster_id].push({
            week,
            points: matchup.points,
            aboveAverage: matchup.points > weekAverage,
            difference: matchup.points - weekAverage,
          });
        });
      });

      return {
        historicalMatchups: filteredResults,
        weeklyAverages: averages,
        teamWeeklyData: Object.entries(teamData).map(([rosterId, weeklyPerformance]) => ({
          rosterId: Number(rosterId),
          weeklyPerformance: weeklyPerformance.sort((a, b) => a.week - b.week),
        })),
      };
    },
  });

  const data = useMemo(() => query.data ?? EMPTY_RESULT, [query.data]);
  return {
    historicalMatchups: data.historicalMatchups,
    teamWeeklyData: data.teamWeeklyData,
    weeklyAverages: data.weeklyAverages,
    loading: query.isLoading || query.isFetching,
    error: query.error?.message ?? null,
  };
};
