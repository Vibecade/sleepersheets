import { useState, useEffect, useCallback } from 'react';
import { cachedFetch } from '@/utils/apiCache';
import { Matchup } from './useMatchups';

export interface WeeklyMatchups {
  week: number;
  matchups: Matchup[];
}

export const useHistoricalMatchups = (leagueId: string, currentWeek: number) => {
  const [historicalMatchups, setHistoricalMatchups] = useState<WeeklyMatchups[]>([]);
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
      setHistoricalMatchups(results.filter(result => result.matchups.length > 0));
    } catch (err) {
      console.error('Error fetching historical matchups:', err);
      setError('Failed to fetch historical matchups');
      setHistoricalMatchups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoricalMatchups(leagueId, currentWeek);
  }, [leagueId, currentWeek, fetchHistoricalMatchups]);

  return { historicalMatchups, loading, error };
};