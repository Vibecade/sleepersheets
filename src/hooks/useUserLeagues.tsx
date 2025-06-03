
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cachedFetch } from '@/utils/apiCache';
import type { SleeperLeague } from '@/types/sleeper';

interface UserLeague {
  league_id: string;
  claimed_at: string;
  leagueData?: {
    name: string;
    season: string;
    total_rosters: number;
  };
}

export const useUserLeagues = () => {
  const [ownedLeagues, setOwnedLeagues] = useState<UserLeague[]>([]);
  const [recentLeagues, setRecentLeagues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Memoize the loadOwnedLeagues function to prevent recreation on every render
  const loadOwnedLeagues = useCallback(async () => {
    if (!user?.id) {
      setOwnedLeagues([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_ownership')
        .select('league_id, claimed_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('claimed_at', { ascending: false });

      if (error) {
        console.error('Error loading owned leagues:', error);
        return;
      }

      if (!data || data.length === 0) {
        setOwnedLeagues([]);
        return;
      }

      // Fetch league data for each owned league with error handling
      const leaguesWithData = await Promise.allSettled(
        data.map(async (ownership) => {
          try {
            const leagueData = await cachedFetch(
              `https://api.sleeper.app/v1/league/${ownership.league_id}`,
              {},
              10 * 60 * 1000 // 10 minutes cache
            ) as SleeperLeague;
            
            return {
              ...ownership,
              leagueData: {
                name: leagueData.name,
                season: leagueData.season,
                total_rosters: leagueData.total_rosters
              }
            };
          } catch (error) {
            console.error(`Error fetching league data for ${ownership.league_id}:`, error);
            return ownership;
          }
        })
      );

      // Filter out rejected promises and extract fulfilled values
      const successfulLeagues = leaguesWithData
        .filter((result): result is PromiseFulfilledResult<UserLeague> => result.status === 'fulfilled')
        .map(result => result.value);

      setOwnedLeagues(successfulLeagues);
    } catch (error) {
      console.error('Error loading owned leagues:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user.id

  // Load owned leagues when user changes
  useEffect(() => {
    loadOwnedLeagues();
  }, [loadOwnedLeagues]);

  // Load recent leagues from localStorage (only once)
  useEffect(() => {
    const stored = localStorage.getItem('recentLeagues');
    if (stored) {
      try {
        setRecentLeagues(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing recent leagues:', error);
        localStorage.removeItem('recentLeagues'); // Clean up corrupted data
      }
    }
  }, []); // Empty dependency array - only run once

  const addRecentLeague = useCallback((leagueId: string) => {
    setRecentLeagues(prev => {
      const updated = [leagueId, ...prev.filter(id => id !== leagueId)].slice(0, 5);
      try {
        localStorage.setItem('recentLeagues', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving recent leagues:', error);
      }
      return updated;
    });
  }, []);

  const clearRecentLeagues = useCallback(() => {
    setRecentLeagues([]);
    try {
      localStorage.removeItem('recentLeagues');
    } catch (error) {
      console.error('Error clearing recent leagues:', error);
    }
  }, []);

  return {
    ownedLeagues,
    recentLeagues,
    loading,
    addRecentLeague,
    clearRecentLeagues
  };
};
