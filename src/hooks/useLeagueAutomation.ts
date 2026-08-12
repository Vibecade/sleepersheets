import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { isMissingTableError } from '@/utils/supabaseErrors';

export interface LeagueAutomation {
  auto_waiver_pricing: boolean;
  auto_dead_cap: boolean;
  paused_at: string | null;
  paused_reason: string | null;
}

/**
 * Every capability is off and nothing is paused. Used when no row exists,
 * which is the normal state for a league nobody has configured — absence
 * means off, the same reading the scheduled job takes.
 */
const DEFAULTS: LeagueAutomation = {
  auto_waiver_pricing: false,
  auto_dead_cap: false,
  paused_at: null,
  paused_reason: null,
};

/**
 * Reads and writes a league's automation consent.
 *
 * Deliberately not folded into `useLeagueSettings`: that table is created
 * through a policy anyone can insert through, so the app can seed defaults on
 * first view. Automation consent needs the opposite property, and lives in its
 * own owner-only table.
 */
export const useLeagueAutomation = (leagueId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [automation, setAutomation] = useState<LeagueAutomation>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // The table ships with this feature, so a deployment that hasn't run the
  // migration yet should degrade quietly rather than shouting on every load.
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    if (!leagueId) {
      setAutomation(DEFAULTS);
      setLoading(false);
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('league_automation_settings')
          .select('auto_waiver_pricing, auto_dead_cap, paused_at, paused_reason')
          .eq('league_id', leagueId)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;
        setAutomation(data ? (data as LeagueAutomation) : DEFAULTS);
      } catch (error) {
        if (!active) return;
        if (isMissingTableError(error)) {
          setIsUnavailable(true);
          logger.debug('Automation settings table is not deployed.');
        } else {
          logger.error('Failed to load automation settings:', error);
        }
        setAutomation(DEFAULTS);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [leagueId]);

  const update = useCallback(
    async (changes: Partial<LeagueAutomation>): Promise<boolean> => {
      if (!leagueId || isUnavailable) return false;

      setSaving(true);
      const next = { ...automation, ...changes };
      try {
        const { error } = await supabase.from('league_automation_settings').upsert(
          {
            league_id: leagueId,
            auto_waiver_pricing: next.auto_waiver_pricing,
            auto_dead_cap: next.auto_dead_cap,
            paused_at: next.paused_at,
            paused_reason: next.paused_reason,
            updated_by: user?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'league_id' },
        );
        if (error) throw error;

        setAutomation(next);
        return true;
      } catch (error) {
        logger.error('Failed to save automation settings:', error);
        toast({
          title: 'Could not save',
          description: 'Automation settings were not changed. Please try again.',
          variant: 'destructive',
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [automation, isUnavailable, leagueId, toast, user?.id],
  );

  /** Stop everything for this league, keeping the flags for when it resumes. */
  const pause = useCallback(
    (reason?: string) => update({ paused_at: new Date().toISOString(), paused_reason: reason ?? null }),
    [update],
  );

  const resume = useCallback(
    () => update({ paused_at: null, paused_reason: null }),
    [update],
  );

  return {
    automation,
    isPaused: Boolean(automation.paused_at),
    loading,
    saving,
    isUnavailable,
    update,
    pause,
    resume,
  };
};
