
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OwnershipStatus {
  isOwned: boolean;
  ownedByCurrentUser: boolean;
  ownerInfo?: {
    id: string;
    claimed_at: string;
  };
}

export const useLeagueOwnershipStatus = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const checkOwnershipStatus = async (leagueId: string): Promise<OwnershipStatus> => {
    if (!leagueId.trim()) {
      return { isOwned: false, ownedByCurrentUser: false };
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_ownership')
        .select('user_id, claimed_at')
        .eq('league_id', leagueId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking ownership status:', error);
        return { isOwned: false, ownedByCurrentUser: false };
      }

      if (!data) {
        return { isOwned: false, ownedByCurrentUser: false };
      }

      const ownedByCurrentUser = user ? data.user_id === user.id : false;

      return {
        isOwned: true,
        ownedByCurrentUser,
        ownerInfo: {
          id: data.user_id,
          claimed_at: data.claimed_at
        }
      };
    } catch (error) {
      console.error('Error checking ownership status:', error);
      return { isOwned: false, ownedByCurrentUser: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    checkOwnershipStatus,
    loading
  };
};
