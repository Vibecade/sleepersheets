
import { useState, useEffect } from 'react';
import { cachedFetch } from '@/utils/apiCache';

export interface Matchup {
  starters: string[];
  roster_id: number;
  players: string[];
  matchup_id: number;
  points: number;
  custom_points: number | null;
}

export const useMatchups = (leagueId: string, week: number) => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatchups = async () => {
      if (!leagueId || !week) return;
      
      try {
        setLoading(true);
        setError(null);
        console.log(`Fetching matchups for league ${leagueId}, week ${week}`);
        
        const data = await cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
        );
        
        setMatchups(data || []);
      } catch (err) {
        console.error('Error fetching matchups:', err);
        setError('Failed to fetch matchups');
        setMatchups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchups();
  }, [leagueId, week]);

  return { matchups, loading, error };
};
