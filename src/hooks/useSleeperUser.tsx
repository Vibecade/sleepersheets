import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  // Load sleeper username from profile
  useEffect(() => {
    if (user?.id) {
      loadSleeperUsername();
    }
  }, [user?.id]);

  const loadSleeperUsername = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('sleeper_username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error is OK
        console.error('Error loading sleeper username:', error);
        return;
      }

      if (data?.sleeper_username) {
        setSleeperUsername(data.sleeper_username);
        // Auto-fetch leagues if username exists
        fetchSleeperData(data.sleeper_username);
      }
    } catch (error) {
      console.error('Error loading sleeper username:', error);
    }
  };

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
        console.error('Error saving sleeper username:', error);
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
      console.error('Error saving sleeper username:', error);
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

  const fetchSleeperData = async (username: string) => {
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
      console.error('Error fetching sleeper data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSleeperLeagues = async (userId: string) => {
    try {
      // Fetch leagues for current season (2024) and previous season (2023)
      const currentYear = new Date().getFullYear();
      const seasons = [currentYear.toString(), (currentYear - 1).toString()];
      
      const leaguesPromises = seasons.map(async (season) => {
        try {
          const response = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`);
          if (response.ok) {
            return await response.json();
          }
          return [];
        } catch (error) {
          console.error(`Error fetching leagues for season ${season}:`, error);
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
      console.error('Error fetching sleeper leagues:', error);
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
        console.error('Error clearing sleeper username:', error);
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
      console.error('Error clearing sleeper data:', error);
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