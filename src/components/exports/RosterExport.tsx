
import React from 'react';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import ExportButton from './ExportButton';

interface RosterExportProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

const RosterExport: React.FC<RosterExportProps> = ({
  league,
  rosters,
  userMap,
  players
}) => {
  const { toast } = useToast();
  const { salaries } = usePlayerSalaries(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);

  const exportRostersToCSV = () => {
    console.log('Preparing clean Rosters CSV export with dead cap data...');
    console.log('Current salaries for export:', salaries);
    console.log('Current dead cap players for export:', deadCapPlayers);
    
    const csvData = [];
    const headers = ['Player Name', 'NFL Team', 'Position', 'Fantasy Team', 'Roster Status', 'Fantasy Salary'];
    
    csvData.push(headers);

    const playerRosterMap = new Map(); // Track players to avoid duplicates

    // Add active roster players
    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      const fantasyTeam = getTeamName(user);

      // Priority order: Active > Reserve > Taxi Squad
      const playerCategories = [
        { players: roster.players || [], status: 'Active' },
        { players: roster.reserve || [], status: 'Reserve' },
        { players: roster.taxi || [], status: 'Taxi Squad' }
      ];

      playerCategories.forEach(({ players: playerList, status }) => {
        playerList.forEach((playerId: string) => {
          // Only add player if not already added (first occurrence wins by priority)
          if (!playerRosterMap.has(playerId)) {
            const player = players[playerId];
            if (player) {
              const salary = salaries[playerId];
              console.log(`Player ${formatPlayerName(player)} (${playerId}) salary:`, salary);
              
              csvData.push([
                formatPlayerName(player),
                player.team || 'FA',
                player.position || 'Unknown',
                fantasyTeam,
                status,
                salary ? `$${salary.toLocaleString()}` : ''
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
          deadCapPlayer.salary ? `$${deadCapPlayer.salary.toLocaleString()}` : ''
        ]);
      }
    });

    console.log('Final CSV data with dead cap:', csvData);
    downloadCSV(csvData, `${league.name}_rosters_export.csv`);
    
    toast({
      title: "Clean Rosters Export Complete!",
      description: "Your league roster data has been downloaded as CSV with clean formatting, fantasy salaries, and dead cap data"
    });
  };

  return (
    <ExportButton
      onClick={exportRostersToCSV}
      icon={Users}
      title="Export Rosters"
      description="Normalized player data with clean headers, fantasy salaries, and dead cap data"
      colorClass="text-green-600"
      hoverColorClass="hover:bg-green-700"
    />
  );
};

export default RosterExport;
