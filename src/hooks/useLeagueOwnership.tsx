import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateAndSanitizeLeagueId } from '@/utils/enhancedInputValidation';
import { logLeagueOwnershipClaim, logUnauthorizedAccess } from '@/utils/securityLogger';

interface LeagueOwnership {
  id: string;
  league_id: string;
  user_id: string;
  claimed_at: string;
  is_active: boolean;
}

// Cache for owned leagues to prevent repeated calls
const ownedLeaguesCache = new Map<string, { data: LeagueOwnership[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

    // Check cache first
    const cacheKey = `owned-leagues-${user.id}`;
    const cached = ownedLeaguesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Using cached owned leagues data');
      setOwnedLeagues(cached.data);
      return;
    }

    try {
      setLoading(true);
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
      
      // Cache the result
      ownedLeaguesCache.set(cacheKey, { data: data || [], timestamp: Date.now() });
    } catch (error) {
      console.error('Error loading owned leagues:', error);
    } finally {
      setLoading(false);
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
      logUnauthorizedAccess(undefined, `league:${leagueId}`, 'claim_league');
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
      logLeagueOwnershipClaim(user.id, leagueId, false);
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
          logLeagueOwnershipClaim(user.id, sanitizedLeagueId, false);
          // Don't show toast for 409 errors since we'll dismiss the banner instead
          console.log('League already claimed by another user');
          return { success: false, alreadyClaimed: true };
        } else {
          logLeagueOwnershipClaim(user.id, sanitizedLeagueId, false);
          console.error('Error claiming league:', error);
          toast({
            title: "Error",
            description: "Failed to claim league. Please try again.",
            variant: "destructive"
          });
          return { success: false, alreadyClaimed: false };
        }
      }

      // Log successful claim
      logLeagueOwnershipClaim(user.id, sanitizedLeagueId, true);

      // Reload owned leagues after successful claim
      await loadOwnedLeagues();
      
      // Clear ownership cache for this league
      const cacheKey = `ownership-${sanitizedLeagueId}-${user.id}`;
      if (ownedLeaguesCache.has(cacheKey)) {
        ownedLeaguesCache.delete(cacheKey);
      }

      toast({
        title: "Success!",
        description: "League claimed successfully. You can now modify league settings.",
      });
      return { success: true, alreadyClaimed: false };
    } catch (error) {
      logLeagueOwnershipClaim(user.id, sanitizedLeagueId, false);
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

  // Function to clear owned leagues cache - useful for external cache invalidation
  const clearOwnedLeaguesCache = useCallback(() => {
    if (user?.id) {
      const cacheKey = `owned-leagues-${user.id}`;
      ownedLeaguesCache.delete(cacheKey);
      // Reload the data immediately
      loadOwnedLeagues();
    }
  }, [user?.id, loadOwnedLeagues]);

  return {
    ownedLeagues,
    isLeagueOwned,
    canModifyLeague,
    claimLeague,
    loading,
    clearOwnedLeaguesCache
  };
};