
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateAndSanitizeLeagueId } from '@/utils/enhancedInputValidation';

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
  }, [user?.id]);

  useEffect(() => {
    loadOwnedLeagues();
  }, [loadOwnedLeagues]);

  const isLeagueOwned = useCallback((leagueId: string): boolean => {
    const validation = validateAndSanitizeLeagueId(leagueId);
    if (!validation.isValid) {
      return false;
    }
    
    return ownedLeagues.some(ownership => ownership.league_id === validation.sanitizedValue);
  }, [ownedLeagues]);

  const canModifyLeague = useCallback((leagueId: string): boolean => {
    if (!user) return false;
    return isLeagueOwned(leagueId);
  }, [user, isLeagueOwned]);

  const claimLeague = useCallback(async (leagueId: string): Promise<{ success: boolean; alreadyClaimed: boolean }> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim a league",
        variant: "destructive"
      });
      return { success: false, alreadyClaimed: false };
    }

    // Validate league ID before claiming
    const validation = validateAndSanitizeLeagueId(leagueId);
    if (!validation.isValid) {
      toast({
        title: "Invalid League ID",
        description: validation.error || "Invalid league ID format",
        variant: "destructive"
      });
      return { success: false, alreadyClaimed: false };
    }

    const sanitizedLeagueId = validation.sanitizedValue!;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('league_ownership')
        .insert({
          league_id: sanitizedLeagueId,
          user_id: user.id
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation - league already claimed
          // Don't show toast for 409 errors since we'll dismiss the banner instead
          console.log('League already claimed by another user');
          return { success: false, alreadyClaimed: true };
        } else {
          console.error('Error claiming league:', error);
          toast({
            title: "Error",
            description: "Failed to claim league. Please try again.",
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
        description: "Failed to claim league. Please try again.",
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
