
import React from 'react';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
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

  const exportRostersToCSV = () => {
    console.log('Preparing clean Rosters CSV export...');
    
    const csvData = [];
    const headers = ['Player Name', 'NFL Team', 'Position', 'Fantasy Team', 'Roster Status'];
    
    csvData.push(headers);

    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      const fantasyTeam = getTeamName(user);

      // Add active players
      if (roster.players) {
        roster.players.forEach((playerId: string) => {
          const player = players[playerId];
          if (player) {
            csvData.push([
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              fantasyTeam,
              'Active'
            ]);
          }
        });
      }

      // Add taxi squad players
      if (roster.taxi) {
        roster.taxi.forEach((playerId: string) => {
          const player = players[playerId];
          if (player) {
            csvData.push([
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              fantasyTeam,
              'Taxi Squad'
            ]);
          }
        });
      }

      // Add reserve players
      if (roster.reserve) {
        roster.reserve.forEach((playerId: string) => {
          const player = players[playerId];
          if (player) {
            csvData.push([
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              fantasyTeam,
              'Reserve'
            ]);
          }
        });
      }
    });

    downloadCSV(csvData, `${league.name}_rosters_export.csv`);
    
    toast({
      title: "Clean Rosters Export Complete!",
      description: "Your league roster data has been downloaded as CSV with clean formatting"
    });
  };

  return (
    <ExportButton
      onClick={exportRostersToCSV}
      icon={Users}
      title="Export Rosters"
      description="Normalized player data with clean headers"
      colorClass="text-green-600"
      hoverColorClass="hover:bg-green-700"
    />
  );
};

export default RosterExport;
