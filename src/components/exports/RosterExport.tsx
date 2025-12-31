import React from 'react';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, addExportOptionsToCSV, ExportOptionsData, getPlayerFranchiseValue } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import ExportButton from './ExportButton';

interface RosterExportProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  exportOptions?: ExportOptionsData;
}

const RosterExport: React.FC<RosterExportProps> = ({
  league,
  rosters,
  userMap,
  players,
  exportOptions
}) => {
  const { toast } = useToast();
  const { salaries } = usePlayerSalaries(league.league_id);
  const { contracts } = usePlayerContracts(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);

  const exportRostersToCSV = () => {
    console.log('Preparing enhanced Rosters CSV export...');
    
    const csvData: string[][] = [];
    const headers = [
      'Player Name',
      'NFL Team',
      'Position',
      'Fantasy Team',
      'Roster Status',
      'Fantasy Salary',
      'Contract Years',
      'Acquisition Type',
      'Franchise Value'
    ];
    
    csvData.push(headers);

    const playerRosterMap = new Map();

    // Add active roster players
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
                contractYears ? `${contractYears} year${contractYears > 1 ? 's' : ''}` : '',
                'Contract',
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
        const franchiseValue = getPlayerFranchiseValue(player);
        csvData.push([
          formatPlayerName(player),
          player.team || 'FA',
          player.position || 'Unknown',
          fantasyTeam,
          'Dead Cap',
          deadCapPlayer.salary ? `$${deadCapPlayer.salary.toLocaleString()}` : '',
          '',
          'Dead Cap',
          franchiseValue
        ]);
      }
    });

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_rosters_export.csv`);
    
    toast({
      title: "Rosters Export Complete!",
      description: "Player data with salaries, contracts, and franchise values downloaded"
    });
  };

  return (
    <ExportButton
      onClick={exportRostersToCSV}
      icon={Users}
      title="Export Rosters"
      description="Players with salaries, contract years, and franchise values"
      colorClass="text-green-600"
      hoverColorClass="hover:bg-green-700"
    />
  );
};

export default RosterExport;
