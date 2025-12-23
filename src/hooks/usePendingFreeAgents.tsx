import { useMemo } from 'react';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';

export interface PendingFreeAgent {
  playerId: string;
  rosterId: number;
  salary: number;
  contractLength: number | null;
  reason: 'expiring' | 'no_contract' | 'faab';
}

export interface TeamFreeAgentSummary {
  rosterId: number;
  players: PendingFreeAgent[];
  totalExpiringValue: number;
  potentialCapSpace: number;
}

interface UsePendingFreeAgentsProps {
  rosters: any[];
  leagueId: string;
  salaries: Record<string, number | null>;
}

export const usePendingFreeAgents = ({ rosters, leagueId, salaries }: UsePendingFreeAgentsProps) => {
  const { contracts, loading: contractsLoading } = usePlayerContracts(leagueId);

  const { pendingFreeAgents, teamSummaries, leagueTotals } = useMemo(() => {
    if (!rosters.length || contractsLoading) {
      return {
        pendingFreeAgents: [] as PendingFreeAgent[],
        teamSummaries: {} as Record<number, TeamFreeAgentSummary>,
        leagueTotals: { totalPlayers: 0, totalExpiringValue: 0 }
      };
    }

    const allPendingFreeAgents: PendingFreeAgent[] = [];
    const summaries: Record<number, TeamFreeAgentSummary> = {};

    rosters.forEach((roster) => {
      const rosterId = roster.roster_id;
      const allPlayers = [
        ...(roster.players || []),
        ...(roster.taxi || []),
      ];

      const teamPlayers: PendingFreeAgent[] = [];

      allPlayers.forEach((playerId: string) => {
        const contractLength = contracts[playerId];
        const salary = salaries[playerId] || 0;

        if (contractLength === 1) {
          teamPlayers.push({
            playerId,
            rosterId,
            salary,
            contractLength,
            reason: 'expiring'
          });
        } else if (contractLength === null || contractLength === undefined || contractLength === 0) {
          if (salary > 0) {
            teamPlayers.push({
              playerId,
              rosterId,
              salary,
              contractLength,
              reason: 'no_contract'
            });
          }
        }
      });

      const totalExpiringValue = teamPlayers
        .filter(p => p.reason === 'expiring')
        .reduce((sum, p) => sum + p.salary, 0);

      const allPotentialValue = teamPlayers.reduce((sum, p) => sum + p.salary, 0);

      summaries[rosterId] = {
        rosterId,
        players: teamPlayers,
        totalExpiringValue,
        potentialCapSpace: allPotentialValue
      };

      allPendingFreeAgents.push(...teamPlayers);
    });

    const leagueTotals = {
      totalPlayers: allPendingFreeAgents.length,
      totalExpiringValue: allPendingFreeAgents
        .filter(p => p.reason === 'expiring')
        .reduce((sum, p) => sum + p.salary, 0)
    };

    return { pendingFreeAgents: allPendingFreeAgents, teamSummaries: summaries, leagueTotals };
  }, [rosters, contracts, salaries, contractsLoading]);

  return {
    pendingFreeAgents,
    teamSummaries,
    leagueTotals,
    loading: contractsLoading
  };
};
