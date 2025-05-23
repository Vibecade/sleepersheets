
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowUpDown, FileText, Eye } from 'lucide-react';
import { formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';

interface DataDashboardProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

const DataDashboard: React.FC<DataDashboardProps> = ({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks
}) => {
  // Prepare roster data
  const rosterData = [];
  rosters.forEach((roster) => {
    const user = userMap[roster.owner_id];
    const fantasyTeam = getTeamName(user);

    // Add active players
    if (roster.players) {
      roster.players.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          rosterData.push({
            playerName: formatPlayerName(player),
            nflTeam: player.team || 'FA',
            position: player.position || 'Unknown',
            fantasyTeam,
            rosterStatus: 'Active'
          });
        }
      });
    }

    // Add taxi squad players
    if (roster.taxi) {
      roster.taxi.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          rosterData.push({
            playerName: formatPlayerName(player),
            nflTeam: player.team || 'FA',
            position: player.position || 'Unknown',
            fantasyTeam,
            rosterStatus: 'Taxi Squad'
          });
        }
      });
    }

    // Add reserve players
    if (roster.reserve) {
      roster.reserve.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          rosterData.push({
            playerName: formatPlayerName(player),
            nflTeam: player.team || 'FA',
            position: player.position || 'Unknown',
            fantasyTeam,
            rosterStatus: 'Reserve'
          });
        }
      });
    }
  });

  // Prepare transaction data
  const transactionData = [];
  transactions.forEach((transaction) => {
    const week = transaction.leg || transaction.week || 'N/A';

    // Process drops
    if (transaction.drops) {
      Object.entries(transaction.drops as Record<string, string>).forEach(([playerId, rosterId]) => {
        const player = players[playerId];
        const user = rosterUserMap[rosterId];
        const fantasyTeam = getTeamName(user);
        
        if (player) {
          transactionData.push({
            week,
            fantasyTeam,
            playerName: formatPlayerName(player),
            nflTeam: player.team || 'FA',
            position: player.position || 'Unknown',
            action: 'Drop'
          });
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
          transactionData.push({
            week,
            fantasyTeam,
            playerName: formatPlayerName(player),
            nflTeam: player.team || 'FA',
            position: player.position || 'Unknown',
            action: 'Add'
          });
        }
      });
    }
  });

  // Prepare draft data
  const draftData = [];
  draftPicks.forEach(({ draft, picks }) => {
    picks.forEach((pick: any) => {
      const player = players[pick.player_id];
      const user = rosterUserMap[pick.roster_id];
      const fantasyTeam = getTeamName(user);
      
      draftData.push({
        round: pick.round || 'N/A',
        pick: pick.pick_no || 'N/A',
        fantasyTeam,
        playerName: player ? formatPlayerName(player) : 'Unknown Player',
        nflTeam: player?.team || 'FA',
        position: player?.position || 'Unknown',
        isKeeper: pick.is_keeper ? 'Yes' : 'No'
      });
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="w-5 h-5" />
          <span>Data Dashboard</span>
        </CardTitle>
        <CardDescription>
          Preview all your league data in clean, organized tables before exporting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rosters" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="rosters" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Rosters ({rosterData.length})</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4" />
              <span>Transactions ({transactionData.length})</span>
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Draft ({draftData.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rosters" className="mt-6">
            <div className="glass rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white font-semibold">Player Name</TableHead>
                    <TableHead className="text-white font-semibold">NFL Team</TableHead>
                    <TableHead className="text-white font-semibold">Position</TableHead>
                    <TableHead className="text-white font-semibold">Fantasy Team</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rosterData.map((row, index) => (
                    <TableRow key={index} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{row.playerName}</TableCell>
                      <TableCell className="text-gray-300">{row.nflTeam}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                          {row.position}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">{row.fantasyTeam}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={row.rosterStatus === 'Active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {row.rosterStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <div className="glass rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white font-semibold">Week</TableHead>
                    <TableHead className="text-white font-semibold">Fantasy Team</TableHead>
                    <TableHead className="text-white font-semibold">Player Name</TableHead>
                    <TableHead className="text-white font-semibold">NFL Team</TableHead>
                    <TableHead className="text-white font-semibold">Position</TableHead>
                    <TableHead className="text-white font-semibold">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionData.map((row, index) => (
                    <TableRow key={index} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{row.week}</TableCell>
                      <TableCell className="text-white">{row.fantasyTeam}</TableCell>
                      <TableCell className="text-white font-medium">{row.playerName}</TableCell>
                      <TableCell className="text-gray-300">{row.nflTeam}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                          {row.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={row.action === 'Add' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {row.action}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <div className="glass rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white font-semibold">Round</TableHead>
                    <TableHead className="text-white font-semibold">Pick</TableHead>
                    <TableHead className="text-white font-semibold">Fantasy Team</TableHead>
                    <TableHead className="text-white font-semibold">Player Name</TableHead>
                    <TableHead className="text-white font-semibold">NFL Team</TableHead>
                    <TableHead className="text-white font-semibold">Position</TableHead>
                    <TableHead className="text-white font-semibold">Keeper</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {draftData.map((row, index) => (
                    <TableRow key={index} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-white font-medium">{row.round}</TableCell>
                      <TableCell className="text-white font-medium">{row.pick}</TableCell>
                      <TableCell className="text-white">{row.fantasyTeam}</TableCell>
                      <TableCell className="text-white font-medium">{row.playerName}</TableCell>
                      <TableCell className="text-gray-300">{row.nflTeam}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                          {row.position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={row.isKeeper === 'Yes' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {row.isKeeper}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DataDashboard;
