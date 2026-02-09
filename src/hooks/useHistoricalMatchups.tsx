import { useState, useEffect, useCallback } from 'react';
import { cachedFetch } from '@/utils/apiCache';
import { Matchup } from './useMatchups';

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

export const useHistoricalMatchups = (leagueId: string, currentWeek: number) => {
  const [historicalMatchups, setHistoricalMatchups] = useState<WeeklyMatchups[]>([]);
  const [teamWeeklyData, setTeamWeeklyData] = useState<TeamWeeklyData[]>([]);
  const [weeklyAverages, setWeeklyAverages] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalMatchups = useCallback(async (leagueId: string, currentWeek: number) => {
    if (!leagueId || currentWeek <= 1) {
      setHistoricalMatchups([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const promises: Promise<WeeklyMatchups>[] = [];
      
      // Fetch matchups for all completed weeks (weeks 1 through currentWeek - 1)
      for (let week = 1; week < currentWeek; week++) {
        const promise = cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
          {},
          10 * 60 * 1000, // 10 minute cache for historical data
          undefined,
          'normal'
        ).then(matchups => ({
          week,
          matchups: matchups || []
        }));
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      const filteredResults = results.filter(result => result.matchups.length > 0);
      setHistoricalMatchups(filteredResults);
      
      // Calculate weekly averages and team performance data
      const averages: Record<number, number> = {};
      const teamData: Record<number, WeeklyPerformance[]> = {};
      
      filteredResults.forEach(({ week, matchups: weekMatchups }) => {
        if (weekMatchups.length > 0) {
          const weekTotal = weekMatchups.reduce((sum, matchup) => sum + matchup.points, 0);
          const weekAverage = weekTotal / weekMatchups.length;
          averages[week] = weekAverage;
          
          // Track each team's performance for this week
          weekMatchups.forEach(matchup => {
            if (!teamData[matchup.roster_id]) {
              teamData[matchup.roster_id] = [];
            }
            
            const difference = matchup.points - weekAverage;
            teamData[matchup.roster_id].push({
              week,
              points: matchup.points,
              aboveAverage: matchup.points > weekAverage,
              difference
            });
          });
        }
      });
      
      setWeeklyAverages(averages);
      setTeamWeeklyData(
        Object.entries(teamData).map(([rosterId, weeklyPerformance]) => ({
          rosterId: Number(rosterId),
          weeklyPerformance: weeklyPerformance.sort((a, b) => a.week - b.week)
        }))
      );
    } catch (err) {
      console.error('Error fetching historical matchups:', err);
      setError('Failed to fetch historical matchups');
      setHistoricalMatchups([]);
      setTeamWeeklyData([]);
      setWeeklyAverages({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoricalMatchups(leagueId, currentWeek);
  }, [leagueId, currentWeek, fetchHistoricalMatchups]);

  return { historicalMatchups, teamWeeklyData, weeklyAverages, loading, error };
};