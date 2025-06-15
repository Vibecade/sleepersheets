
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

export const useLeagueSettings = (leagueId: string) => {
  const [settings, setSettings] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing settings from database
  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        console.log('Loading league settings for:', leagueId);
        const { data, error } = await supabase
          .from('league_settings')
          .select('*')
          .eq('league_id', leagueId)
          .maybeSingle();

        if (error) {
          console.error('Error loading league settings:', error);
          return;
        }

        console.log('Loaded league settings:', data);
        if (data) {
          setSettings(data);
        } else {
          // Create default settings if none exist
          const defaultSettings = {
            league_id: leagueId,
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
            console.error('Error creating default league settings:', createError);
          } else {
            setSettings(newSettings);
          }
        }
      } catch (error) {
        console.error('Error loading league settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      loadSettings();
    } else {
      setLoading(false);
      setSettings(null);
    }
  }, [leagueId]);

  // Update settings in database - using useCallback to stabilize the function reference
  const updateSettings = useCallback(async (updates: Partial<Pick<LeagueSettings, 'salary_cap' | 'dead_cap_enabled' | 'faab_cap' | 'reserve_limit'>>) => {
    try {
      console.log('Updating league settings:', updates);
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
        console.error('Error updating league settings:', error);
        toast({
          title: "Error",
          description: "Failed to save league settings",
          variant: "destructive"
        });
        return false;
      }

      setSettings(data);
      toast({
        title: "Success",
        description: "League settings saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating league settings:', error);
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

