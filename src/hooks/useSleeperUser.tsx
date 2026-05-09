import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { cachedFetch } from '@/utils/apiCache';
import { CACHE_TTL } from '@/utils/constants';
import type { SleeperNflState } from './useNflState';

interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string;
}

interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  season_type: string;
  total_rosters: number;
  avatar?: string;
}

export const useSleeperUser = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sleeperUsername, setSleeperUsername] = useState<string>('');
  const [sleeperUser, setSleeperUser] = useState<SleeperUser | null>(null);
  const [sleeperLeagues, setSleeperLeagues] = useState<SleeperLeague[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSleeperLeagues = useCallback(async (userId: string) => {
    try {
      // Sleeper's `state.league_season` is the canonical "season for new
      // league fetches" — bumped to the upcoming year during the
      // Feb–Aug offseason transition. Falling back to `getFullYear()`
      // returned wrong leagues from Feb–July (Sleeper's NFL year cuts
      // over in early summer, calendar year doesn't).
      const fallbackYear = String(new Date().getFullYear());
      let leagueSeason: string = fallbackYear;
      try {
        const state = await cachedFetch<SleeperNflState>(
          'https://api.sleeper.app/v1/state/nfl',
          {},
          CACHE_TTL.MEDIUM,
        );
        leagueSeason = state?.league_season || state?.season || fallbackYear;
      } catch (stateErr) {
        logger.warn('Falling back to calendar year for league fetch — NFL state unavailable', stateErr);
      }

      const previousSeason = String(Number(leagueSeason) - 1);
      const seasons = [leagueSeason, previousSeason];

      const leaguesPromises = seasons.map(async (season) => {
        try {
          const response = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`);
          if (response.ok) {
            return await response.json();
          }
          return [];
        } catch (error) {
          logger.error(`Error fetching leagues for season ${season}:`, error);
          return [];
        }
      });

      const allLeagues = await Promise.all(leaguesPromises);
      const flattenedLeagues = allLeagues.flat();
      
      // Sort by season (newest first) and name
      const sortedLeagues = flattenedLeagues.sort((a, b) => {
        if (a.season !== b.season) {
          return b.season.localeCompare(a.season);
        }
        return a.name.localeCompare(b.name);
      });

      setSleeperLeagues(sortedLeagues);
    } catch (error) {
      logger.error('Error fetching sleeper leagues:', error);
    }
  }, []);

  const fetchSleeperData = useCallback(async (username: string) => {
    setLoading(true);
    try {
      // Fetch user data
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setSleeperUser(userData);
        await fetchSleeperLeagues(userData.user_id);
      }
    } catch (error) {
      logger.error('Error fetching sleeper data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchSleeperLeagues]);

  const loadSleeperUsername = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('sleeper_username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        logger.error('Error loading sleeper username:', error);
        return;
      }

      if (data?.sleeper_username) {
        setSleeperUsername(data.sleeper_username);
        // Auto-fetch leagues if username exists
        await fetchSleeperData(data.sleeper_username);
      }
    } catch (error) {
      logger.error('Error loading sleeper username:', error);
    }
  }, [user?.id, fetchSleeperData]);

  // Load sleeper username from profile
  useEffect(() => {
    if (user?.id) {
      loadSleeperUsername();
    }
  }, [user?.id, loadSleeperUsername]);

  const saveSleeperUsername = async (username: string) => {
    if (!user?.id) return false;

    setSaving(true);
    try {
      // First validate the username by fetching user data
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      
      if (!userResponse.ok) {
        toast({
          title: "Invalid Username",
          description: "Could not find a Sleeper user with that username",
          variant: "destructive"
        });
        return false;
      }

      const userData = await userResponse.json();
      
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          sleeper_username: username,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name
        });

      if (error) {
        logger.error('Error saving sleeper username:', error);
        toast({
          title: "Error",
          description: "Failed to save Sleeper username",
          variant: "destructive"
        });
        return false;
      }

      setSleeperUsername(username);
      setSleeperUser(userData);
      
      // Fetch leagues for this user
      await fetchSleeperLeagues(userData.user_id);
      
      toast({
        title: "Success!",
        description: "Sleeper username saved and leagues loaded"
      });
      
      return true;
    } catch (error) {
      logger.error('Error saving sleeper username:', error);
      toast({
        title: "Error",
        description: "Failed to validate or save Sleeper username",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const clearSleeperData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ sleeper_username: null })
        .eq('id', user.id);

      if (error) {
        logger.error('Error clearing sleeper username:', error);
        return;
      }

      setSleeperUsername('');
      setSleeperUser(null);
      setSleeperLeagues([]);

      toast({
        title: "Cleared",
        description: "Sleeper username has been removed"
      });
    } catch (error) {
      logger.error('Error clearing sleeper data:', error);
    }
  }, [user?.id, toast]);

  return {
    sleeperUsername,
    sleeperUser,
    sleeperLeagues,
    loading,
    saving,
    saveSleeperUsername,
    clearSleeperData,
    refreshLeagues: () => sleeperUser && fetchSleeperLeagues(sleeperUser.user_id)
  };
};
