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

// Cache for ownership status to prevent repeated calls
const ownershipCache = new Map<string, { data: OwnershipStatus; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes - increased from 5 minutes

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
    const cacheKey = `ownership-${sanitizedLeagueId}-${user?.id || 'anonymous'}`;
    
    // Check cache first
    const cached = ownershipCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Using cached ownership status for:', sanitizedLeagueId);
      return cached.data;
    }

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

      const result: OwnershipStatus = data ? {
        isOwned: true,
        ownedByCurrentUser: user ? data.user_id === user.id : false,
        ownerInfo: {
          id: data.user_id,
          claimed_at: data.claimed_at
        }
      } : { isOwned: false, ownedByCurrentUser: false };

      // Cache the result
      ownershipCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      return result;
    } catch (error) {
      console.error('Error checking ownership status:', error);
      return { isOwned: false, ownedByCurrentUser: false };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Function to clear ownership status cache - useful for external cache invalidation
  const clearOwnershipStatusCache = useCallback((leagueId?: string) => {
    if (leagueId) {
      // Clear cache for specific league
      const cacheKey = `ownership-${leagueId}-${user?.id || 'anonymous'}`;
      ownershipCache.delete(cacheKey);
    } else {
      // Clear all cache entries for this user
      const keysToDelete: string[] = [];
      ownershipCache.forEach((_, key) => {
        if (key.includes(`-${user?.id || 'anonymous'}`)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => ownershipCache.delete(key));
    }
  }, [user?.id]);

  return {
    checkOwnershipStatus,
    loading,
    clearOwnershipStatusCache
  };
};