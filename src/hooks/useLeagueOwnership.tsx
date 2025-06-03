
import { useState, useEffect, useCallback } from 'react';
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

  // Memoize the loadOwnedLeagues function
  const loadOwnedLeagues = useCallback(async () => {
    if (!user?.id) {
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
  }, [user?.id]); // Only depend on user.id

  // Load user's owned leagues when user changes
  useEffect(() => {
    loadOwnedLeagues();
  }, [loadOwnedLeagues]);

  // Check if user owns a specific league
  const isLeagueOwned = useCallback((leagueId: string): boolean => {
    return ownedLeagues.some(ownership => ownership.league_id === leagueId);
  }, [ownedLeagues]);

  // Check if current user can modify a specific league
  const canModifyLeague = useCallback((leagueId: string): boolean => {
    if (!user) return false;
    return isLeagueOwned(leagueId);
  }, [user, isLeagueOwned]);

  // Claim a league - returns the ownership status result
  const claimLeague = useCallback(async (leagueId: string): Promise<{ success: boolean; alreadyClaimed: boolean }> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim a league",
        variant: "destructive"
      });
      return { success: false, alreadyClaimed: false };
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
        if (error.code === '23505') { // Unique constraint violation - league already claimed
          toast({
            title: "League Already Claimed",
            description: "This league has already been claimed by another user",
            variant: "destructive"
          });
          return { success: false, alreadyClaimed: true };
        } else {
          console.error('Error claiming league:', error);
          toast({
            title: "Error",
            description: "Failed to claim league",
            variant: "destructive"
          });
          return { success: false, alreadyClaimed: false };
        }
      }

      // Reload owned leagues after successful claim
      await loadOwnedLeagues();

      toast({
        title: "Success!",
        description: "League claimed successfully. You can now modify league settings.",
      });
      return { success: true, alreadyClaimed: false };
    } catch (error) {
      console.error('Error claiming league:', error);
      toast({
        title: "Error",
        description: "Failed to claim league",
        variant: "destructive"
      });
      return { success: false, alreadyClaimed: false };
    } finally {
      setLoading(false);
    }
  }, [user, toast, loadOwnedLeagues]);

  return {
    ownedLeagues,
    isLeagueOwned,
    canModifyLeague,
    claimLeague,
    loading
  };
};
