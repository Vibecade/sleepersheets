import { useMemo } from 'react';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { calculateOptimizedSalaries } from '@/utils/salaryCalculations';
import { evaluateLeagueCompliance } from '@/utils/compliance';
import type { ComplianceReport } from '@/utils/compliance';
import { getTeamName, normalizeUsersToMap, createRosterUserMap } from '@/utils/leagueDataUtils';
import type { CommissionerLeagueData } from '@/types/sleeper';

interface UseComplianceFindingsParams {
  leagueId: string;
  leagueData: CommissionerLeagueData;
  /**
   * Passed in rather than pulled from `usePlayerSalaries` here, for the same
   * reason the Pricing badge takes its salaries from the dashboard: the hook
   * keeps state in local `useState` and early-returns for an already-seen
   * league, so a second instance never converges with the first. The tab
   * badge and the panel have to count the same findings.
   */
  getSalaryCapContribution: (playerId: string) => number;
  salariesLoading: boolean;
}

export interface UseComplianceFindingsResult extends ComplianceReport {
  loading: boolean;
}

const EMPTY_REPORT: ComplianceReport = { findings: [], converged: true, anomalies: [] };

/**
 * Runs the league through the compliance rules.
 *
 * All the real work is in `utils/compliance`, which is pure and tested; this
 * only assembles the inputs from the hooks that already own them. Dead cap in
 * particular comes from `calculateOptimizedSalaries` rather than being
 * recomputed, so the review queue and the cap figures on the Overview tab are
 * derived from the same arithmetic.
 */
export const useComplianceFindings = ({
  leagueId,
  leagueData,
  getSalaryCapContribution,
  salariesLoading,
}: UseComplianceFindingsParams): UseComplianceFindingsResult => {
  const { settings, loading: settingsLoading } = useLeagueSettings(leagueId);
  const { deadCapPlayers, loading: deadCapLoading } = useDeadCapPlayers(leagueId);

  const rosters = useMemo(() => leagueData?.rosters || [], [leagueData?.rosters]);
  const transactions = useMemo(() => leagueData?.transactions || [], [leagueData?.transactions]);
  const players = useMemo(() => leagueData?.players || {}, [leagueData?.players]);
  const salaryCap = settings?.salary_cap || 0;

  const teamNameFor = useMemo(() => {
    const userMap = normalizeUsersToMap(leagueData?.users);
    const rosterUserMap = createRosterUserMap(rosters, userMap);
    return (rosterId: number) => getTeamName(rosterUserMap[rosterId]) || `Team ${rosterId}`;
  }, [leagueData?.users, rosters]);

  // Dead cap per roster, taken straight from the shared cap engine so the
  // review queue can't disagree with what the Overview tab shows.
  const deadCapByRoster = useMemo(
    () =>
      calculateOptimizedSalaries({
        rosters,
        deadCapPlayers,
        getSalaryCapContribution,
        salaryCap: salaryCap || 1,
      }).teamDeadCaps,
    [rosters, deadCapPlayers, getSalaryCapContribution, salaryCap],
  );

  const loading = salariesLoading || settingsLoading || deadCapLoading;

  const report = useMemo(() => {
    // Evaluating against half-loaded salaries would report violations that
    // vanish a moment later — worse than showing nothing.
    if (loading) return EMPTY_REPORT;

    return evaluateLeagueCompliance({
      rosters,
      transactions,
      players,
      getSalaryCapContribution,
      deadCapByRoster,
      salaryCap,
      league: leagueData?.league || {},
      teamName: teamNameFor,
    });
  }, [
    loading,
    rosters,
    transactions,
    players,
    getSalaryCapContribution,
    deadCapByRoster,
    salaryCap,
    leagueData?.league,
    teamNameFor,
  ]);

  return { ...report, loading };
};
