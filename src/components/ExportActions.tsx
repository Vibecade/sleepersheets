
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, ArrowUpDown, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';

interface ExportActionsProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

const ExportActions: React.FC<ExportActionsProps> = ({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks
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

  const exportTransactionsToCSV = () => {
    console.log('Preparing clean Transactions CSV export...');
    
    const csvData = [];
    const headers = ['Week', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Action (Add/Drop/Trade)'];
    
    csvData.push(headers);

    transactions.forEach((transaction) => {
      const week = transaction.leg || transaction.week || 'N/A';

      // Process drops
      if (transaction.drops) {
        Object.entries(transaction.drops as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const fantasyTeam = getTeamName(user);
          
          if (player) {
            csvData.push([
              week,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Drop'
            ]);
          }
        });
      }

      // Process adds
      if (transaction.adds) {
        Object.entries(transaction.adds as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const fantasyTeam = getTeamName(user);
          
          if (player) {
            csvData.push([
              week,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Add'
            ]);
          }
        });
      }
    });

    downloadCSV(csvData, `${league.name}_transactions_export.csv`);
    
    toast({
      title: "Clean Transactions Export Complete!",
      description: "Your league transaction data has been downloaded as CSV with clean formatting"
    });
  };

  const exportDraftToCSV = () => {
    console.log('Preparing clean Draft CSV export...');
    
    const csvData = [];
    const headers = ['Round', 'Pick', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Is Keeper'];
    
    csvData.push(headers);

    draftPicks.forEach(({ draft, picks }) => {
      picks.forEach((pick: any) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        const fantasyTeam = getTeamName(user);
        
        csvData.push([
          pick.round || 'N/A',
          pick.pick_no || 'N/A',
          fantasyTeam,
          player ? formatPlayerName(player) : 'Unknown Player',
          player?.team || 'FA',
          player?.position || 'Unknown',
          pick.is_keeper ? 'Yes' : 'No'
        ]);
      });
    });

    downloadCSV(csvData, `${league.name}_draft_export.csv`);
    
    toast({
      title: "Clean Draft Export Complete!",
      description: "Your league draft data has been downloaded as CSV with clean formatting"
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clean Export Options</CardTitle>
        <CardDescription>
          Download your league data in clean CSV format optimized for Google Sheets and Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="text-center">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium">Clean Rosters</h4>
                <p className="text-sm text-gray-600 mb-3">Normalized player data with clean headers</p>
                <Button onClick={exportRostersToCSV} className="w-full bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export Rosters
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-center">
                <ArrowUpDown className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium">Clean Transactions</h4>
                <p className="text-sm text-gray-600 mb-3">Simplified add/drop data</p>
                <Button 
                  onClick={exportTransactionsToCSV} 
                  disabled={transactions.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Transactions
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-center">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium">Clean Draft</h4>
                <p className="text-sm text-gray-600 mb-3">Organized draft results</p>
                <Button 
                  onClick={exportDraftToCSV} 
                  disabled={draftPicks.length === 0}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Draft
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">Clean CSV Format includes:</h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
              <li><strong>Rosters:</strong> Player Name, NFL Team, Position, Fantasy Team, Roster Status</li>
              <li><strong>Transactions:</strong> Week, Fantasy Team, Player Name, NFL Team, Position, Action</li>
              <li><strong>Draft:</strong> Round, Pick, Fantasy Team, Player Name, NFL Team, Position, Is Keeper</li>
              <li><strong>No IDs or raw data:</strong> All columns use human-readable names and values</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportActions;
