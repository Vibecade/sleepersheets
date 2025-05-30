
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface LeagueOwnership {
  id: string;
  league_id: string;
  user_id: string;
  claimed_at: string;
  is_active: boolean;
}

export const useLeagueOwnership = () => {
  const [ownedLeagues, setOwnedLeagues] = useState<LeagueOwnership[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load user's owned leagues
  useEffect(() => {
    const loadOwnedLeagues = async () => {
      if (!user) {
        setOwnedLeagues([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('league_ownership')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (error) {
          console.error('Error loading owned leagues:', error);
          return;
        }

        setOwnedLeagues(data || []);
      } catch (error) {
        console.error('Error loading owned leagues:', error);
      }
    };

    loadOwnedLeagues();
  }, [user]);

  // Check if user owns a specific league
  const isLeagueOwned = (leagueId: string): boolean => {
    return ownedLeagues.some(ownership => ownership.league_id === leagueId);
  };

  // Check if current user can modify a specific league
  const canModifyLeague = (leagueId: string): boolean => {
    if (!user) return false;
    return isLeagueOwned(leagueId);
  };

  // Claim a league
  const claimLeague = async (leagueId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim a league",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('league_ownership')
        .insert({
          league_id: leagueId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "League Already Claimed",
            description: "This league has already been claimed by another user",
            variant: "destructive"
          });
        } else {
          console.error('Error claiming league:', error);
          toast({
            title: "Error",
            description: "Failed to claim league",
            variant: "destructive"
          });
        }
        return false;
      }

      // Reload owned leagues
      const { data } = await supabase
        .from('league_ownership')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      setOwnedLeagues(data || []);

      toast({
        title: "Success!",
        description: "League claimed successfully. You can now modify league settings.",
      });
      return true;
    } catch (error) {
      console.error('Error claiming league:', error);
      toast({
        title: "Error",
        description: "Failed to claim league",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    ownedLeagues,
    isLeagueOwned,
    canModifyLeague,
    claimLeague,
    loading
  };
};
