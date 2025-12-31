import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, addExportOptionsToCSV, ExportOptionsData, getPlayerFranchiseValue } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { cachedFetch } from '@/utils/apiCache';

interface ExportAllProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
  exportOptions?: ExportOptionsData;
}

interface Matchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

const ExportAll: React.FC<ExportAllProps> = ({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks,
  exportOptions
}) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const { salaries } = usePlayerSalaries(league.league_id);
  const { contracts } = usePlayerContracts(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);
  const { settings: dbSettings } = useLeagueSettings(league.league_id);

  const exportAllData = async () => {
    setExporting(true);
    toast({
      title: "Preparing Export",
      description: "Gathering all league data..."
    });

    try {
      // Export Rosters
      const rosterData = generateRosterCSV();
      downloadCSV(rosterData, `${league.name}_rosters.csv`);
      
      // Export Standings
      const standingsData = generateStandingsCSV();
      downloadCSV(standingsData, `${league.name}_standings.csv`);
      
      // Export Transactions
      if (transactions.length > 0) {
        const transData = generateTransactionsCSV();
        downloadCSV(transData, `${league.name}_transactions.csv`);
      }
      
      // Export Draft
      if (draftPicks.length > 0) {
        const draftData = generateDraftCSV();
        downloadCSV(draftData, `${league.name}_draft.csv`);
      }
      
      // Export Settings
      const settingsData = generateSettingsCSV();
      downloadCSV(settingsData, `${league.name}_settings.csv`);
      
      // Export Matchups
      const matchupsData = await generateMatchupsCSV();
      if (matchupsData.length > 1) {
        downloadCSV(matchupsData, `${league.name}_matchups.csv`);
      }

      toast({
        title: "Export Complete!",
        description: "All league data has been downloaded as separate CSV files"
      });
    } catch (error) {
      console.error('Error exporting all data:', error);
      toast({
        title: "Export Failed",
        description: "Some exports may have failed. Please try individual exports.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const generateRosterCSV = () => {
    const csvData: string[][] = [];
    const headers = ['Player Name', 'NFL Team', 'Position', 'Fantasy Team', 'Roster Status', 'Fantasy Salary', 'Contract Years', 'Franchise Value'];
    csvData.push(headers);

    const playerRosterMap = new Map();

    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      const fantasyTeam = getTeamName(user);

      const playerCategories = [
        { players: roster.players || [], status: 'Active' },
        { players: roster.reserve || [], status: 'Reserve' },
        { players: roster.taxi || [], status: 'Taxi Squad' }
      ];

      playerCategories.forEach(({ players: playerList, status }) => {
        playerList.forEach((playerId: string) => {
          if (!playerRosterMap.has(playerId)) {
            const player = players[playerId];
            if (player) {
              const salary = salaries[playerId];
              const contractYears = contracts[playerId];
              const franchiseValue = getPlayerFranchiseValue(player);
              
              csvData.push([
                formatPlayerName(player),
                player.team || 'FA',
                player.position || 'Unknown',
                fantasyTeam,
                status,
                salary ? `$${salary.toLocaleString()}` : '',
                contractYears ? String(contractYears) : '',
                franchiseValue
              ]);
              
              playerRosterMap.set(playerId, true);
            }
          }
        });
      });
    });

    // Add dead cap players
    deadCapPlayers.forEach((deadCapPlayer) => {
      const player = players[deadCapPlayer.player_id];
      const roster = rosters.find(r => r.roster_id === deadCapPlayer.roster_id);
      const user = roster ? userMap[roster.owner_id] : null;
      const fantasyTeam = user ? getTeamName(user) : 'Unknown Team';

      if (player) {
        csvData.push([
          formatPlayerName(player),
          player.team || 'FA',
          player.position || 'Unknown',
          fantasyTeam,
          'Dead Cap',
          deadCapPlayer.salary ? `$${deadCapPlayer.salary.toLocaleString()}` : '',
          '',
          getPlayerFranchiseValue(player)
        ]);
      }
    });

    return exportOptions ? addExportOptionsToCSV(csvData, exportOptions, league.name) : csvData;
  };

  const generateStandingsCSV = () => {
    const csvData: string[][] = [];
    csvData.push(['Rank', 'Team Name', 'Owner', 'Wins', 'Losses', 'Ties', 'Win %', 'Points For', 'Points Against', 'Point Differential']);

    const sortedRosters = [...rosters].sort((a, b) => {
      const aWins = a.settings?.wins || 0;
      const bWins = b.settings?.wins || 0;
      const aLosses = a.settings?.losses || 0;
      const bLosses = b.settings?.losses || 0;
      
      const aWinPct = aWins + aLosses > 0 ? aWins / (aWins + aLosses) : 0;
      const bWinPct = bWins + bLosses > 0 ? bWins / (bWins + bLosses) : 0;
      
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
    });

    sortedRosters.forEach((roster, index) => {
      const user = userMap[roster.owner_id];
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      const ties = roster.settings?.ties || 0;
      const gamesPlayed = wins + losses + ties;
      const winPct = gamesPlayed > 0 ? ((wins + (ties * 0.5)) / gamesPlayed * 100).toFixed(1) : '0.0';
      const pointsFor = roster.settings?.fpts || 0;
      const pointsAgainst = roster.settings?.fpts_against || 0;
      const pointDiff = pointsFor - pointsAgainst;
      
      csvData.push([
        String(index + 1),
        getTeamName(user),
        user?.display_name || user?.username || 'Unknown',
        String(wins),
        String(losses),
        String(ties),
        `${winPct}%`,
        pointsFor.toFixed(2),
        pointsAgainst.toFixed(2),
        pointDiff >= 0 ? `+${pointDiff.toFixed(2)}` : pointDiff.toFixed(2)
      ]);
    });

    return exportOptions ? addExportOptionsToCSV(csvData, exportOptions, league.name) : csvData;
  };

  const generateTransactionsCSV = () => {
    const csvData: string[][] = [];
    csvData.push(['Week', 'Transaction Type', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Action', 'Fantasy Salary', 'Franchise Value']);

    transactions.forEach((transaction) => {
      const week = transaction.leg || transaction.week || 'N/A';
      const txType = transaction.type || 'unknown';

      if (transaction.drops) {
        Object.entries(transaction.drops as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          if (player) {
            csvData.push([
              String(week),
              txType,
              getTeamName(user),
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Drop',
              salaries[playerId] ? `$${salaries[playerId].toLocaleString()}` : '',
              getPlayerFranchiseValue(player)
            ]);
          }
        });
      }

      if (transaction.adds) {
        Object.entries(transaction.adds as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          if (player) {
            csvData.push([
              String(week),
              txType,
              getTeamName(user),
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Add',
              salaries[playerId] ? `$${salaries[playerId].toLocaleString()}` : '',
              getPlayerFranchiseValue(player)
            ]);
          }
        });
      }
    });

    return exportOptions ? addExportOptionsToCSV(csvData, exportOptions, league.name) : csvData;
  };

  const generateDraftCSV = () => {
    const csvData: string[][] = [];
    csvData.push(['Round', 'Pick', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Is Keeper', 'Fantasy Salary', 'Contract Years', 'Franchise Value']);

    draftPicks.forEach(({ draft, picks }) => {
      picks.forEach((pick: any) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        
        csvData.push([
          String(pick.round || 'N/A'),
          String(pick.pick_no || 'N/A'),
          getTeamName(user),
          player ? formatPlayerName(player) : 'Unknown Player',
          player?.team || 'FA',
          player?.position || 'Unknown',
          pick.is_keeper ? 'Yes' : 'No',
          salaries[pick.player_id] ? `$${salaries[pick.player_id].toLocaleString()}` : '',
          contracts[pick.player_id] ? String(contracts[pick.player_id]) : '',
          player ? getPlayerFranchiseValue(player) : ''
        ]);
      });
    });

    return exportOptions ? addExportOptionsToCSV(csvData, exportOptions, league.name) : csvData;
  };

  const generateSettingsCSV = () => {
    const csvData: string[][] = [];
    
    csvData.push(['=== LEAGUE INFORMATION ===']);
    csvData.push(['Setting', 'Value']);
    csvData.push(['League Name', league.name || 'Unknown']);
    csvData.push(['Season', league.season || 'Unknown']);
    csvData.push(['Total Rosters', String(league.total_rosters || 0)]);
    csvData.push(['League Type', league.settings?.type === 2 ? 'Dynasty' : 'Redraft']);
    csvData.push([]);
    
    if (dbSettings) {
      csvData.push(['=== SALARY CAP SETTINGS ===']);
      csvData.push(['Salary Cap', dbSettings.salary_cap ? `$${dbSettings.salary_cap.toLocaleString()}` : 'Not Set']);
      csvData.push(['FAAB Budget', dbSettings.faab_cap ? `$${dbSettings.faab_cap}` : 'Not Set']);
      csvData.push(['Dead Cap Enabled', dbSettings.dead_cap_enabled ? 'Yes' : 'No']);
    }

    return exportOptions ? addExportOptionsToCSV(csvData, exportOptions, league.name) : csvData;
  };

  const generateMatchupsCSV = async () => {
    const csvData: string[][] = [];
    csvData.push(['Week', 'Team 1', 'Team 1 Score', 'Team 2', 'Team 2 Score', 'Winner', 'Point Margin']);
    
    const rosterMap: Record<number, any> = {};
    rosters.forEach(roster => {
      rosterMap[roster.roster_id] = userMap[roster.owner_id];
    });
    
    const currentWeek = league.settings?.leg || 1;
    const maxWeeks = Math.min(currentWeek, 18);
    
    for (let week = 1; week <= maxWeeks; week++) {
      try {
        const matchups = await cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`,
          {},
          5 * 60 * 1000
        );
        
        if (!matchups || matchups.length === 0) continue;
        
        const matchupGroups: Record<number, Matchup[]> = {};
        matchups.forEach(m => {
          if (!matchupGroups[m.matchup_id]) matchupGroups[m.matchup_id] = [];
          matchupGroups[m.matchup_id].push(m);
        });
        
        Object.values(matchupGroups).forEach(pair => {
          if (pair.length !== 2) return;
          const [team1, team2] = pair;
          const team1Name = getTeamName(rosterMap[team1.roster_id]);
          const team2Name = getTeamName(rosterMap[team2.roster_id]);
          const team1Score = team1.points || 0;
          const team2Score = team2.points || 0;
          
          let winner = 'Tie';
          if (team1Score > team2Score) winner = team1Name;
          else if (team2Score > team1Score) winner = team2Name;
          
          csvData.push([
            String(week),
            team1Name,
            team1Score.toFixed(2),
            team2Name,
            team2Score.toFixed(2),
            winner,
            Math.abs(team1Score - team2Score).toFixed(2)
          ]);
        });
      } catch (err) {
        console.warn(`Failed to fetch week ${week}:`, err);
      }
    }

    return exportOptions ? addExportOptionsToCSV(csvData, exportOptions, league.name) : csvData;
  };

  return (
    <Button
      onClick={exportAllData}
      disabled={exporting}
      className="w-full h-auto py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
    >
      <div className="flex items-center justify-center gap-3">
        {exporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        <div className="text-left">
          <div className="font-semibold">
            {exporting ? "Exporting All Data..." : "Export All League Data"}
          </div>
          <div className="text-xs opacity-80">
            Downloads rosters, standings, matchups, transactions, draft & settings
          </div>
        </div>
      </div>
    </Button>
  );
};

export default ExportAll;
