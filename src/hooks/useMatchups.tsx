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

// Removed duplicate cache - using apiCache instead

export const useMatchups = (leagueId: string, week: number) => {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string>('');

  // Helper function to get current NFL week for projections - season aware
  const getCurrentNFLWeek = (leagueSeason?: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const seasonYear = leagueSeason ? parseInt(leagueSeason) : currentYear;
    
    // Use the league's season year for season start calculation
    const seasonStart = new Date(seasonYear, 8, 5); // September 5th of the league season
    
    console.log(`NFL Week calculation: League season ${seasonYear}, Season start: ${seasonStart.toDateString()}, Current: ${now.toDateString()}`);
    
    if (now < seasonStart) {
      console.log('Before season start, returning week 1');
      return 1; // Pre-season
    }
    
    // Calculate days since season start
    const diffTime = now.getTime() - seasonStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Week transitions on Tuesday (day 2 of the week, where Monday = 1)
    // Add 2 days to account for Tuesday transition
    const weekNumber = Math.floor((diffDays + 2) / 7) + 1;
    
    const calculatedWeek = Math.min(Math.max(weekNumber, 1), 22);
    console.log(`NFL Week calculation result: ${calculatedWeek} (based on ${diffDays} days since season start)`);
    
    // NFL regular season is 18 weeks, playoffs extend further
    return calculatedWeek;
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
      
      // Determine cache TTL based on week (shorter for current week)
      const currentNFLWeek = getCurrentNFLWeek();
      const isCurrentWeek = currentWeek === currentNFLWeek;
      const cacheTTL = isCurrentWeek ? 60 * 1000 : 10 * 60 * 1000; // 1 min for current, 10 min for past
      
      const data = await cachedFetch<Matchup[]>(
        `https://api.sleeper.app/v1/league/${currentLeagueId}/matchups/${currentWeek}`,
        {},
        cacheTTL,
        undefined,
        'high' // High priority for user-facing matchups data
      );
      
      // If we get empty data for current week, try again with cache buster
      if ((!data || data.length === 0) && isCurrentWeek) {
        console.log('🔄 Empty matchups for current week, retrying with cache buster...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const retryData = await cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${currentLeagueId}/matchups/${currentWeek}?cb=${Date.now()}`,
          {},
          30 * 1000, // Very short cache for retry
          undefined,
          'high'
        );
        
        setMatchups(retryData || []);
      } else {
        setMatchups(data || []);
      }
      
      setLastKey(cacheKey);
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