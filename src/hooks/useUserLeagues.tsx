
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cachedFetch } from '@/utils/apiCache';

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

  // Load owned leagues
  useEffect(() => {
    const loadOwnedLeagues = async () => {
      if (!user) {
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

        // Fetch league data for each owned league
        const leaguesWithData = await Promise.all(
          (data || []).map(async (ownership) => {
            try {
              const leagueData = await cachedFetch(
                `https://api.sleeper.app/v1/league/${ownership.league_id}`,
                {},
                10 * 60 * 1000 // 10 minutes cache
              );
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

        setOwnedLeagues(leaguesWithData);
      } catch (error) {
        console.error('Error loading owned leagues:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOwnedLeagues();
  }, [user]);

  // Load recent leagues from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentLeagues');
    if (stored) {
      try {
        setRecentLeagues(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing recent leagues:', error);
      }
    }
  }, []);

  const addRecentLeague = (leagueId: string) => {
    setRecentLeagues(prev => {
      const updated = [leagueId, ...prev.filter(id => id !== leagueId)].slice(0, 5);
      localStorage.setItem('recentLeagues', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentLeagues = () => {
    setRecentLeagues([]);
    localStorage.removeItem('recentLeagues');
  };

  return {
    ownedLeagues,
    recentLeagues,
    loading,
    addRecentLeague,
    clearRecentLeagues
  };
};
