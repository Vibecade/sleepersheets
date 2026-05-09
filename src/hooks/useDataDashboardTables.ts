import { useMemo } from 'react';
import { formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';

/**
 * Pure-data layer extracted from DataDashboard. Builds the three flat
 * tables (rosters / transactions / draft picks) the dashboard renders,
 * plus the filtered views for each tab's search box.
 *
 * Keeping this in a hook (a) makes the table shaping testable
 * independently from the render layer, and (b) lets DataDashboard.tsx
 * shrink to pure presentation + edit handlers.
 */

export interface RosterRow {
  playerId: string;
  playerName: string;
  nflTeam: string;
  position: string;
  fantasyTeam: string;
  rosterStatus: 'Active' | 'Reserve' | 'Taxi Squad';
}

export interface TransactionRow {
  playerId: string;
  week: number | string;
  fantasyTeam: string;
  playerName: string;
  nflTeam: string;
  position: string;
  action: 'Add' | 'Drop';
}

export interface DraftRow {
  playerId: string;
  round: number | string;
  pick: number | string;
  fantasyTeam: string;
  playerName: string;
  nflTeam: string;
  position: string;
  isKeeper: 'Yes' | 'No';
}

interface UseDataDashboardTablesParams {
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
  rosterFilter: string;
  transactionFilter: string;
  draftFilter: string;
}

const matchesAny = (haystack: string, needle: string) =>
  haystack.toLowerCase().includes(needle);

export const useDataDashboardTables = ({
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks,
  rosterFilter,
  transactionFilter,
  draftFilter,
}: UseDataDashboardTablesParams) => {
  // Flatten each roster's players into rows. Priority order on dedup:
  // Active > Reserve > Taxi Squad — so a player on multiple lists is only
  // counted once, with their highest-priority status.
  const rosterData = useMemo<RosterRow[]>(() => {
    const data: RosterRow[] = [];
    const seen = new Map<string, RosterRow>();

    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      const fantasyTeam = getTeamName(user);

      const playerCategories = [
        { players: roster.players || [], status: 'Active' as const },
        { players: roster.reserve || [], status: 'Reserve' as const },
        { players: roster.taxi || [], status: 'Taxi Squad' as const },
      ];

      playerCategories.forEach(({ players: playerList, status }) => {
        playerList.forEach((playerId: string) => {
          if (seen.has(playerId)) return;
          const player = players[playerId];
          if (!player) return;
          const row: RosterRow = {
            playerId,
            playerName: formatPlayerName(player),
            nflTeam: player.team || 'FA',
            position: player.position || 'Unknown',
            fantasyTeam,
            rosterStatus: status,
          };
          data.push(row);
          seen.set(playerId, row);
        });
      });
    });

    return data;
  }, [rosters, userMap, players]);

  // One row per add/drop event in each transaction.
  const transactionData = useMemo<TransactionRow[]>(() => {
    const data: TransactionRow[] = [];

    transactions.forEach((transaction) => {
      const week: number | string = transaction.leg || transaction.week || 'N/A';

      if (transaction.drops) {
        Object.entries(transaction.drops as Record<string, string>).forEach(
          ([playerId, rosterId]) => {
            const player = players[playerId];
            if (!player) return;
            const user = rosterUserMap[rosterId];
            data.push({
              playerId,
              week,
              fantasyTeam: getTeamName(user),
              playerName: formatPlayerName(player),
              nflTeam: player.team || 'FA',
              position: player.position || 'Unknown',
              action: 'Drop',
            });
          }
        );
      }

      if (transaction.adds) {
        Object.entries(transaction.adds as Record<string, string>).forEach(
          ([playerId, rosterId]) => {
            const player = players[playerId];
            if (!player) return;
            const user = rosterUserMap[rosterId];
            data.push({
              playerId,
              week,
              fantasyTeam: getTeamName(user),
              playerName: formatPlayerName(player),
              nflTeam: player.team || 'FA',
              position: player.position || 'Unknown',
              action: 'Add',
            });
          }
        );
      }
    });

    return data;
  }, [transactions, players, rosterUserMap]);

  // One row per draft pick across all drafts the league has produced.
  const draftData = useMemo<DraftRow[]>(() => {
    const data: DraftRow[] = [];

    draftPicks.forEach(({ picks }: { picks: any[] }) => {
      picks.forEach((pick) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        data.push({
          playerId: pick.player_id,
          round: pick.round || 'N/A',
          pick: pick.pick_no || 'N/A',
          fantasyTeam: getTeamName(user),
          playerName: player ? formatPlayerName(player) : 'Unknown Player',
          nflTeam: player?.team || 'FA',
          position: player?.position || 'Unknown',
          isKeeper: pick.is_keeper ? 'Yes' : 'No',
        });
      });
    });

    return data;
  }, [draftPicks, players, rosterUserMap]);

  // Search filters: case-insensitive substring match across the
  // user-visible columns of each table.
  const filteredRosterData = useMemo<RosterRow[]>(() => {
    if (!rosterFilter) return rosterData;
    const needle = rosterFilter.toLowerCase();
    return rosterData.filter(
      (row) =>
        matchesAny(row.playerName, needle) ||
        matchesAny(row.position, needle) ||
        matchesAny(row.nflTeam, needle) ||
        matchesAny(row.fantasyTeam, needle)
    );
  }, [rosterData, rosterFilter]);

  const filteredTransactionData = useMemo<TransactionRow[]>(() => {
    if (!transactionFilter) return transactionData;
    const needle = transactionFilter.toLowerCase();
    return transactionData.filter(
      (row) =>
        matchesAny(row.playerName, needle) ||
        matchesAny(row.position, needle) ||
        matchesAny(row.nflTeam, needle) ||
        matchesAny(row.fantasyTeam, needle) ||
        matchesAny(row.action, needle)
    );
  }, [transactionData, transactionFilter]);

  const filteredDraftData = useMemo<DraftRow[]>(() => {
    if (!draftFilter) return draftData;
    const needle = draftFilter.toLowerCase();
    return draftData.filter(
      (row) =>
        matchesAny(row.playerName, needle) ||
        matchesAny(row.position, needle) ||
        matchesAny(row.nflTeam, needle) ||
        matchesAny(row.fantasyTeam, needle) ||
        row.round.toString().includes(needle) ||
        row.pick.toString().includes(needle)
    );
  }, [draftData, draftFilter]);

  return {
    rosterData,
    transactionData,
    draftData,
    filteredRosterData,
    filteredTransactionData,
    filteredDraftData,
  };
};
