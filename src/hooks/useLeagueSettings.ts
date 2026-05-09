import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface LeagueSettings {
  id: string;
  league_id: string;
  salary_cap: number | null;
  dead_cap_enabled: boolean | null;
  faab_cap: number | null;
  reserve_limit: number | null;
  created_at: string;
  updated_at: string;
}

// Cache for league settings to prevent repeated calls
const settingsCache = new Map<string, { data: LeagueSettings | null; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes - standardized across hooks

export const useLeagueSettings = (leagueId: string) => {
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastLeagueId, setLastLeagueId] = useState<string>('');
  const { toast } = useToast();

  // Load existing settings from database
  const loadSettings = useCallback(async (currentLeagueId: string) => {
    if (!currentLeagueId || currentLeagueId === lastLeagueId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      logger.debug('Loading league settings for:', currentLeagueId);
      
      // Check cache first
      const cacheKey = currentLeagueId;
      const cached = settingsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('Using cached league settings for:', currentLeagueId);
        setSettings(cached.data);
        setLastLeagueId(currentLeagueId);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('league_settings')
        .select('*')
        .eq('league_id', currentLeagueId)
        .maybeSingle();

      if (error) {
        logger.error('Error loading league settings:', error);
        return;
      }

      logger.debug('Loaded league settings:', data);
      if (data) {
        setSettings(data);
        settingsCache.set(cacheKey, { data, timestamp: Date.now() });
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          league_id: currentLeagueId,
          salary_cap: 200000,
          dead_cap_enabled: true,
          faab_cap: 100,
          reserve_limit: 100,
        };
        
        const { data: newSettings, error: createError } = await supabase
          .from('league_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          logger.error('Error creating default league settings:', createError);
        } else {
          setSettings(newSettings);
          settingsCache.set(cacheKey, { data: newSettings, timestamp: Date.now() });
        }
      }
      
      setLastLeagueId(currentLeagueId);
    } catch (error) {
      logger.error('Error loading league settings:', error);
    } finally {
      setLoading(false);
    }
  }, [lastLeagueId]);

  useEffect(() => {
    if (leagueId && leagueId !== lastLeagueId) {
      loadSettings(leagueId);
    } else if (!leagueId) {
      setLoading(false);
      setSettings(null);
    }
  }, [leagueId, loadSettings, lastLeagueId]);

  // Update settings in database - using useCallback to stabilize the function reference
  const updateSettings = useCallback(async (updates: Partial<Pick<LeagueSettings, 'salary_cap' | 'dead_cap_enabled' | 'faab_cap' | 'reserve_limit'>>) => {
    try {
      logger.debug('Updating league settings:', updates);
      const { data, error } = await supabase
        .from('league_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('league_id', leagueId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating league settings:', error);
        toast({
          title: "Error",
          description: "Failed to save league settings",
          variant: "destructive"
        });
        return false;
      }

      setSettings(data);
      
      // Update cache
      const cacheKey = leagueId;
      settingsCache.set(cacheKey, { data, timestamp: Date.now() });
      
      toast({
        title: "Success",
        description: "League settings saved successfully",
      });
      return true;
    } catch (error) {
      logger.error('Error updating league settings:', error);
      toast({
        title: "Error",
        description: "Failed to save league settings",
        variant: "destructive"
      });
      return false;
    }
  }, [leagueId, toast]);

  return {
    settings,
    updateSettings,
    loading
  };
};