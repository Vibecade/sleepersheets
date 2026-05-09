import { useMemo } from 'react';
import { useLeagueData } from '@/components/LeagueDataContext';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { getPlayerFranchiseValue } from '@/utils/csvExport';

export interface RosterInsights {
  expiringThisYear: number;
  finalYearNextYear: number;
  noContract: number;
  // TODO: swap to dynasty value once feat/waivers-export-and-dynasty-values merges
  totalValue: number;
  avgContractLength: number | null;
  playerCount: number;
}

const parseFranchiseValue = (player: any): number => {
  const formatted = getPlayerFranchiseValue(player);
  if (!formatted) return 0;
  const numeric = parseFloat(formatted.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

export const useRosterInsights = (rosterId: number | null): RosterInsights | null => {
  const { rosters, players, league } = useLeagueData();
  const { contracts } = usePlayerContracts(league?.league_id ?? '');

  return useMemo(() => {
    if (rosterId == null) return null;
    const roster = rosters.find((r: any) => r.roster_id === rosterId);
    if (!roster) return null;

    const playerIds = Array.from(
      new Set<string>([
        ...((roster.players as string[]) || []),
        ...((roster.reserve as string[]) || []),
        ...((roster.taxi as string[]) || []),
      ])
    );

    let expiringThisYear = 0;
    let finalYearNextYear = 0;
    let noContract = 0;
    let totalValue = 0;
    let contractLengthSum = 0;
    let contractedCount = 0;

    for (const playerId of playerIds) {
      const player = (players as Record<string, any>)[playerId];
      if (!player) continue;

      const length = contracts[playerId];
      if (length === 1) expiringThisYear++;
      if (length === 2) finalYearNextYear++;

      // contract_length === 0 is treated as "no contract" elsewhere in the
      // codebase (see usePendingFreeAgents); commissioner overrides allow 0
      // explicitly. Match that convention here.
      if (length == null || length === 0) {
        noContract++;
      } else {
        contractLengthSum += length;
        contractedCount++;
      }

      totalValue += parseFranchiseValue(player);
    }

    const avgContractLength =
      contractedCount > 0
        ? Math.round((contractLengthSum / contractedCount) * 10) / 10
        : null;

    return {
      expiringThisYear,
      finalYearNextYear,
      noContract,
      totalValue,
      avgContractLength,
      playerCount: playerIds.length,
    };
  }, [rosterId, rosters, players, contracts]);
};
