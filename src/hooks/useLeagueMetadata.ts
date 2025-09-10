import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logLeagueDataSync, logLeagueIntegrityCheck } from '@/utils/securityLogger';
import { useAuth } from '@/contexts/AuthContext';

interface LeagueMetadata {
  id: string;
  league_id: string;
  name?: string;
  season?: string;
  season_type?: string;
  sport?: string;
  total_rosters?: number;
  scoring_settings?: any;
  roster_positions?: any;
  sleeper_verified_at?: string;
  last_synced_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface LeagueMetadataCache {
  [leagueId: string]: {
    data: LeagueMetadata;
    lastFetched: Date;
    ttl: number;
  };
}

export const useLeagueMetadata = () => {
  const [cache, setCache] = useState<LeagueMetadataCache>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  const getLeagueMetadata = useCallback(async (leagueId: string): Promise<LeagueMetadata | null> => {
    // Check cache first (5 minute TTL)
    const cached = cache[leagueId];
    if (cached && Date.now() - cached.lastFetched.getTime() < cached.ttl) {
      logLeagueDataSync(userId, leagueId, 'metadata_cache_hit', true);
      return cached.data;
    }

    setLoading(true);
    try {
      // Try to fetch from database first
      const { data: existing, error: fetchError } = await supabase
        .from('league_metadata')
        .select('*')
        .eq('league_id', leagueId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // If exists and recently synced (within 6 hours), use it
      if (existing && new Date(existing.last_synced_at).getTime() > Date.now() - (6 * 60 * 60 * 1000)) {
        const metadata = existing as LeagueMetadata;
        
        // Update cache
        setCache(prev => ({
          ...prev,
          [leagueId]: {
            data: metadata,
            lastFetched: new Date(),
            ttl: 5 * 60 * 1000 // 5 minutes
          }
        }));

        logLeagueDataSync(userId, leagueId, 'metadata_db_hit', true);
        return metadata;
      }

      // If no recent data, we'll need to sync with Sleeper API
      // For now, return existing data if any, or null
      if (existing) {
        const metadata = existing as LeagueMetadata;
        
        // Update cache even if stale
        setCache(prev => ({
          ...prev,
          [leagueId]: {
            data: metadata,
            lastFetched: new Date(),
            ttl: 5 * 60 * 1000
          }
        }));

        logLeagueDataSync(userId, leagueId, 'metadata_stale_hit', true, {
          last_synced: existing.last_synced_at
        });
        return metadata;
      }

      logLeagueDataSync(userId, leagueId, 'metadata_miss', true);
      return null;

    } catch (error) {
      console.error('Error fetching league metadata:', error);
      logLeagueDataSync(userId, leagueId, 'metadata_error', false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Error",
        description: "Failed to fetch league metadata",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [cache, userId, toast]);

  const updateLeagueMetadata = useCallback(async (leagueId: string, updates: Partial<LeagueMetadata>): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('league_metadata')
        .upsert({
          league_id: leagueId,
          last_synced_at: new Date().toISOString(),
          ...updates
        });

      if (error) throw error;

      // Clear cache for this league to force refetch
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[leagueId];
        return newCache;
      });

      logLeagueDataSync(userId, leagueId, 'metadata_update', true, updates);
      return true;

    } catch (error) {
      console.error('Error updating league metadata:', error);
      logLeagueDataSync(userId, leagueId, 'metadata_update_error', false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Error",
        description: "Failed to update league metadata",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const verifyLeagueIntegrity = useCallback(async (leagueId: string): Promise<boolean> => {
    try {
      // Check if league metadata exists
      const metadata = await getLeagueMetadata(leagueId);
      
      if (!metadata) {
        logLeagueIntegrityCheck(leagueId, 'metadata_missing', false);
        return false;
      }

      // Check if league has been verified recently (within 24 hours)
      const isRecentlyVerified = metadata.sleeper_verified_at && 
        new Date(metadata.sleeper_verified_at).getTime() > Date.now() - (24 * 60 * 60 * 1000);

      if (!isRecentlyVerified) {
        logLeagueIntegrityCheck(leagueId, 'verification_stale', false, {
          last_verified: metadata.sleeper_verified_at
        });
      }

      logLeagueIntegrityCheck(leagueId, 'integrity_check', true, {
        has_metadata: true,
        recently_verified: isRecentlyVerified
      });

      return true;

    } catch (error) {
      logLeagueIntegrityCheck(leagueId, 'integrity_check_error', false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }, [getLeagueMetadata]);

  const clearCache = useCallback((leagueId?: string) => {
    if (leagueId) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[leagueId];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  return {
    getLeagueMetadata,
    updateLeagueMetadata,
    verifyLeagueIntegrity,
    clearCache,
    loading
  };
};