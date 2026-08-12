import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { isMissingTableError } from '@/utils/supabaseErrors';

/** Activity types written by the scheduled job. */
export const AUTOMATION_ACTIVITY_TYPES = [
  'automation_waiver_pricing',
  'automation_dead_cap',
] as const;

export type AutomationActivityType = (typeof AUTOMATION_ACTIVITY_TYPES)[number];

export interface AutopilotActivity {
  id: string;
  activity_type: AutomationActivityType;
  title: string;
  description: string | null;
  metadata: {
    totalSalary?: number;
    totalSalaryCharged?: number;
    players?: Array<{ playerId: string; salary: number }>;
  } | null;
  created_at: string;
}

const LIMIT = 15;

/**
 * What the scheduled job has done to this league.
 *
 * Filtered to the automation activity types on purpose. `league_activities`
 * was built for a broader event feed that was never wired up, and a
 * commissioner opening this wants to know what ran unattended — not to have
 * that mixed in with whatever else might later be recorded there.
 */
export const useAutopilotActivity = (leagueId: string) => {
  const [activity, setActivity] = useState<AutopilotActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnavailable, setIsUnavailable] = useState(false);

  const load = useCallback(async () => {
    if (!leagueId) {
      setActivity([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('league_activities')
        .select('id, activity_type, title, description, metadata, created_at')
        .eq('league_id', leagueId)
        .in('activity_type', [...AUTOMATION_ACTIVITY_TYPES])
        .order('created_at', { ascending: false })
        .limit(LIMIT);

      if (error) throw error;
      setActivity((data || []) as unknown as AutopilotActivity[]);
    } catch (error) {
      if (isMissingTableError(error)) {
        // Ships with a migration; a deployment that hasn't run it yet should
        // degrade quietly rather than shouting on every dashboard load.
        setIsUnavailable(true);
        logger.debug('league_activities is not deployed; hiding autopilot feed.');
      } else {
        logger.error('Failed to load autopilot activity:', error);
      }
      setActivity([]);
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { activity, loading, isUnavailable, reload: load };
};
