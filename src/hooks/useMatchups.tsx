import { useState, useEffect, useCallback } from 'react';
import { cachedFetch } from '@/utils/apiCache';

export interface Matchup {
  starters: string[];
  roster_id: number;
  players: string[];
  matchup_id: number;
  points: number;
  custom_points: number | null;
}

// Cache for matchups to prevent repeated calls
const matchupsCache = new Map<string, { data: Matchup[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useMatchups = (leagueId: string, week: number) => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string>('');

  // Helper function to get current NFL week for projections
  const getCurrentNFLWeek = () => {
    const now = new Date();
    const year = now.getFullYear();
    
    // NFL 2024 season started September 5th (Thursday Night Football)
    // Week transitions happen on Tuesday after Monday Night Football
    const seasonStart = new Date(year, 8, 5); // September 5th, 2024
    
    if (now < seasonStart) {
      return 1; // Pre-season
    }
    
    // Calculate days since season start
    const diffTime = now.getTime() - seasonStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Week transitions on Tuesday (day 2 of the week, where Monday = 1)
    // Add 2 days to account for Tuesday transition
    const weekNumber = Math.floor((diffDays + 2) / 7) + 1;
    
    // NFL regular season is 18 weeks, playoffs extend further
    return Math.min(Math.max(weekNumber, 1), 22);
  };

  const fetchMatchups = useCallback(async (currentLeagueId: string, currentWeek: number) => {
    const cacheKey = `${currentLeagueId}-${currentWeek}`;
    if (!currentLeagueId || !currentWeek || cacheKey === lastKey) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching matchups for league ${currentLeagueId}, week ${currentWeek}`);
      
      // Check cache first
      const cached = matchupsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('Using cached matchups data');
        setMatchups(cached.data);
        setLastKey(cacheKey);
        setLoading(false);
        return;
      }
      
      const data = await cachedFetch<Matchup[]>(
        `https://api.sleeper.app/v1/league/${currentLeagueId}/matchups/${currentWeek}`,
        {},
        5 * 60 * 1000 // 5 minutes cache
      );
      
      setMatchups(data || []);
      setLastKey(cacheKey);
      
      // Cache the result
      matchupsCache.set(cacheKey, { data: data || [], timestamp: Date.now() });
    } catch (err) {
      console.error('Error fetching matchups:', err);
      setError('Failed to fetch matchups');
      setMatchups([]);
    } finally {
      setLoading(false);
    }
  }, [lastKey]);

  useEffect(() => {
    const cacheKey = `${leagueId}-${week}`;
    if (cacheKey !== lastKey) {
      fetchMatchups(leagueId, week);
    }
  }, [leagueId, week, fetchMatchups, lastKey]);

  return { matchups, loading, error, getCurrentNFLWeek };
};