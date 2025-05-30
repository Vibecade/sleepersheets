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
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export const useLeagueOwnership = () => {
  const [ownedLeagues, setOwnedLeagues] = useState<LeagueOwnership[]>([]);
  const [leagueOwnership, setLeagueOwnership] = useState<Record<string, LeagueOwnership | null>>({});
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

  // Check ownership for a specific league
  const checkLeagueOwnership = async (leagueId: string) => {
    if (leagueOwnership[leagueId] !== undefined) {
      return leagueOwnership[leagueId];
    }

    try {
      const { data, error } = await supabase
        .from('league_ownership')
        .select('*')
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking league ownership:', error);
        return null;
      }

      // If we have ownership data, try to get the profile info separately
      let ownershipWithProfile: LeagueOwnership | null = data;
      if (data) {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', data.user_id)
            .maybeSingle();
          
          ownershipWithProfile = {
            ...data,
            profiles: profileData
          } as LeagueOwnership;
        } catch (profileError) {
          console.log('Could not fetch profile data:', profileError);
          // Keep the ownership data without profile info
        }
      }

      setLeagueOwnership(prev => ({
        ...prev,
        [leagueId]: ownershipWithProfile
      }));

      return ownershipWithProfile;
    } catch (error) {
      console.error('Error checking league ownership:', error);
      return null;
    }
  };

  // Check if user owns a specific league
  const isLeagueOwned = (leagueId: string): boolean => {
    return ownedLeagues.some(ownership => ownership.league_id === leagueId);
  };

  // Check if current user can modify a specific league
  const canModifyLeague = (leagueId: string): boolean => {
    if (!user) return false;
    return isLeagueOwned(leagueId);
  };

  // Get league ownership info
  const getLeagueOwnership = (leagueId: string): LeagueOwnership | null => {
    return leagueOwnership[leagueId] || null;
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

      // Reload owned leagues and clear ownership cache for this league
      const { data } = await supabase
        .from('league_ownership')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      setOwnedLeagues(data || []);
      
      // Clear and reload ownership info for this league
      setLeagueOwnership(prev => {
        const newState = { ...prev };
        delete newState[leagueId];
        return newState;
      });
      
      await checkLeagueOwnership(leagueId);

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
    checkLeagueOwnership,
    getLeagueOwnership,
    loading
  };
};
