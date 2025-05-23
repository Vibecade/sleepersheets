
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Download, Users, Trophy, FileText, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeagueDataProps {
  data: {
    league: any;
    rosters: any[];
    users: any[];
    players: Record<string, any>;
    transactions?: any[];
    drafts?: any[];
    draftPicks?: any[];
  };
}

const LeagueData: React.FC<LeagueDataProps> = ({ data }) => {
  const { league, rosters, users, players, transactions = [], drafts = [], draftPicks = [] } = data;
  const { toast } = useToast();

  // Create a mapping of user_id to user info
  const userMap = users.reduce((acc, user) => {
    acc[user.user_id] = user;
    return acc;
  }, {});

  // Create a mapping of roster_id to user
  const rosterUserMap = rosters.reduce((acc, roster) => {
    acc[roster.roster_id] = userMap[roster.owner_id];
    return acc;
  }, {});

  const exportRostersToCSV = () => {
    console.log('Preparing Rosters CSV export...');
    
    const csvData = [];
    const headers = ['Team Name', 'Manager', 'Player Name', 'Position', 'NFL Team', 'Status'];
    
    csvData.push(headers);

    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
      const managerName = user?.display_name || 'Unknown Manager';

      // Add active players
      if (roster.players) {
        roster.players.forEach((playerId) => {
          const player = players[playerId];
          if (player) {
            csvData.push([
              teamName,
              managerName,
              `${player.first_name || ''} ${player.last_name || ''}`.trim(),
              player.position || 'Unknown',
              player.team || 'FA',
              'Active'
            ]);
          }
        });
      }

      // Add taxi squad players
      if (roster.taxi) {
        roster.taxi.forEach((playerId) => {
          const player = players[playerId];
          if (player) {
            csvData.push([
              teamName,
              managerName,
              `${player.first_name || ''} ${player.last_name || ''}`.trim(),
              player.position || 'Unknown',
              player.team || 'FA',
              'Taxi Squad'
            ]);
          }
        });
      }

      // Add reserve players
      if (roster.reserve) {
        roster.reserve.forEach((playerId) => {
          const player = players[playerId];
          if (player) {
            csvData.push([
              teamName,
              managerName,
              `${player.first_name || ''} ${player.last_name || ''}`.trim(),
              player.position || 'Unknown',
              player.team || 'FA',
              'Reserve'
            ]);
          }
        });
      }
    });

    downloadCSV(csvData, `${league.name}_rosters_export.csv`);
    
    toast({
      title: "Rosters Export Complete!",
      description: "Your league roster data has been downloaded as CSV"
    });
  };

  const exportTransactionsToCSV = () => {
    console.log('Preparing Transactions CSV export...');
    
    const csvData = [];
    const headers = ['Week', 'Transaction Type', 'Status', 'Team', 'Manager', 'Player Name', 'Position', 'NFL Team', 'Action', 'Creator'];
    
    csvData.push(headers);

    transactions.forEach((transaction) => {
      const creator = userMap[transaction.creator];
      const creatorName = creator?.display_name || 'Unknown';

      // Process drops
      if (transaction.drops) {
        Object.entries(transaction.drops).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
          
          if (player) {
            csvData.push([
              transaction.leg || transaction.week || 'N/A',
              transaction.type || 'Unknown',
              transaction.status || 'Unknown',
              teamName,
              user?.display_name || 'Unknown Manager',
              `${player.first_name || ''} ${player.last_name || ''}`.trim(),
              player.position || 'Unknown',
              player.team || 'FA',
              'Dropped',
              creatorName
            ]);
          }
        });
      }

      // Process adds
      if (transaction.adds) {
        Object.entries(transaction.adds).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
          
          if (player) {
            csvData.push([
              transaction.leg || transaction.week || 'N/A',
              transaction.type || 'Unknown',
              transaction.status || 'Unknown',
              teamName,
              user?.display_name || 'Unknown Manager',
              `${player.first_name || ''} ${player.last_name || ''}`.trim(),
              player.position || 'Unknown',
              player.team || 'FA',
              'Added',
              creatorName
            ]);
          }
        });
      }
    });

    downloadCSV(csvData, `${league.name}_transactions_export.csv`);
    
    toast({
      title: "Transactions Export Complete!",
      description: "Your league transaction data has been downloaded as CSV"
    });
  };

  const exportDraftToCSV = () => {
    console.log('Preparing Draft CSV export...');
    
    const csvData = [];
    const headers = ['Draft Type', 'Round', 'Pick', 'Team', 'Manager', 'Player Name', 'Position', 'NFL Team', 'Is Keeper'];
    
    csvData.push(headers);

    draftPicks.forEach(({ draft, picks }) => {
      picks.forEach((pick) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
        
        csvData.push([
          draft.type || 'Unknown',
          pick.round || 'N/A',
          pick.pick_no || 'N/A',
          teamName,
          user?.display_name || 'Unknown Manager',
          player ? `${player.first_name || ''} ${player.last_name || ''}`.trim() : 'Unknown Player',
          player?.position || 'Unknown',
          player?.team || 'FA',
          pick.is_keeper ? 'Yes' : 'No'
        ]);
      });
    });

    downloadCSV(csvData, `${league.name}_draft_export.csv`);
    
    toast({
      title: "Draft Export Complete!",
      description: "Your league draft data has been downloaded as CSV"
    });
  };

  const downloadCSV = (csvData, filename) => {
    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPlayerCount = (roster) => {
    const active = roster.players?.length || 0;
    const taxi = roster.taxi?.length || 0;
    const reserve = roster.reserve?.length || 0;
    return { active, taxi, reserve, total: active + taxi + reserve };
  };

  return (
    <div className="space-y-6">
      {/* League Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 rounded-lg p-2">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{league.name}</CardTitle>
                <CardDescription>
                  {league.total_rosters} teams • Season {league.season} • Week {league.settings?.week || 'N/A'}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{league.total_rosters}</div>
              <div className="text-sm text-gray-600">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{transactions.length}</div>
              <div className="text-sm text-gray-600">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{draftPicks.reduce((acc, dp) => acc + dp.picks.length, 0)}</div>
              <div className="text-sm text-gray-600">Draft Picks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{drafts.length}</div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teams Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Team Rosters</span>
          </CardTitle>
          <CardDescription>
            Overview of all teams and their current roster sizes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rosters.map((roster) => {
              const user = userMap[roster.owner_id];
              const playerCounts = getPlayerCount(roster);
              const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
              
              return (
                <div key={roster.roster_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage 
                        src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined} 
                      />
                      <AvatarFallback>
                        {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{teamName}</h4>
                      <p className="text-sm text-gray-600 truncate">{user?.display_name || 'Unknown Manager'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Record:</span>
                      <Badge variant="outline">
                        {roster.settings?.wins || 0}-{roster.settings?.losses || 0}-{roster.settings?.ties || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Points:</span>
                      <span className="font-medium">{roster.settings?.fpts?.toFixed(1) || '0.0'}</span>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Active:</span>
                        <span className="font-medium">{playerCounts.active}</span>
                      </div>
                      {playerCounts.taxi > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Taxi:</span>
                          <span className="font-medium">{playerCounts.taxi}</span>
                        </div>
                      )}
                      {playerCounts.reserve > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Reserve:</span>
                          <span className="font-medium">{playerCounts.reserve}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-medium border-t pt-1">
                        <span>Total:</span>
                        <span>{playerCounts.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>
            Download your league data in CSV format for analysis in Excel or Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="text-center">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-medium">Rosters Export</h4>
                  <p className="text-sm text-gray-600 mb-3">All team rosters with player details</p>
                  <Button onClick={exportRostersToCSV} className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="w-4 h-4 mr-2" />
                    Export Rosters
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <ArrowUpDown className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium">Transactions Export</h4>
                  <p className="text-sm text-gray-600 mb-3">All adds, drops, and trades</p>
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
                  <h4 className="font-medium">Draft Export</h4>
                  <p className="text-sm text-gray-600 mb-3">Complete draft results</p>
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">CSV Export includes:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>Rosters:</strong> Team names, manager info, all players with positions and NFL teams</li>
                <li><strong>Transactions:</strong> Weekly adds/drops, trades, waiver claims with details</li>
                <li><strong>Draft:</strong> Complete draft results with pick order and keeper status</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeagueData;
