
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateAndSanitizeLeagueId } from '@/utils/enhancedInputValidation';

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

  const checkOwnershipStatus = useCallback(async (leagueId: string): Promise<OwnershipStatus> => {
    // Validate input before making database call
    const validation = validateAndSanitizeLeagueId(leagueId);
    if (!validation.isValid) {
      console.error('Invalid league ID provided to checkOwnershipStatus:', validation.error);
      return { isOwned: false, ownedByCurrentUser: false };
    }

    const sanitizedLeagueId = validation.sanitizedValue!;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_ownership')
        .select('user_id, claimed_at')
        .eq('league_id', sanitizedLeagueId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Database error checking ownership status:', error);
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
  }, [user?.id]);

  return {
    checkOwnershipStatus,
    loading
  };
};
