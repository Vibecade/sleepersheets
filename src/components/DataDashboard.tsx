import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, ArrowUpDown, FileText, Eye } from 'lucide-react';
import { formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import EditableSalary from '@/components/EditableSalary';
import EditableContractLength from '@/components/EditableContractLength';

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
  const { salaries, updateSalary, loading: salariesLoading } = usePlayerSalaries(league.league_id);
  const { contracts, updateContract, loading: contractsLoading } = usePlayerContracts(league.league_id);

  // Prepare roster data with duplicate removal
  const rosterData = [];
  const playerRosterMap = new Map(); // Track players to avoid duplicates
  
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
            const playerData = {
              playerId,
              playerName: formatPlayerName(player),
              nflTeam: player.team || 'FA',
              position: player.position || 'Unknown',
              fantasyTeam,
              rosterStatus: status
            };
            rosterData.push(playerData);
            playerRosterMap.set(playerId, playerData);
          }
        }
      });
    });
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
            playerId,
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
            playerId,
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
        playerId: pick.player_id,
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

  console.log('Current salaries in DataDashboard:', salaries);
  console.log('Current contracts in DataDashboard:', contracts);
  console.log('Salaries loading status:', salariesLoading);
  console.log('Contracts loading status:', contractsLoading);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="w-5 h-5" />
          <span>Data Dashboard</span>
        </CardTitle>
        <CardDescription>
          Preview all your league data in clean, organized tables before exporting. Click on salary values and contract lengths to edit them.
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
                    <TableHead className="text-white font-semibold">Fantasy Salary</TableHead>
                    <TableHead className="text-white font-semibold">Contract Length</TableHead>
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
                      <TableCell>
                        {salariesLoading ? (
                          <div className="text-gray-400 text-xs">Loading...</div>
                        ) : (
                          <EditableSalary
                            playerId={row.playerId}
                            currentSalary={salaries[row.playerId] || null}
                            onSalaryUpdate={updateSalary}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {contractsLoading ? (
                          <div className="text-gray-400 text-xs">Loading...</div>
                        ) : (
                          <EditableContractLength
                            playerId={row.playerId}
                            currentLength={contracts[row.playerId] || null}
                            onContractUpdate={updateContract}
                          />
                        )}
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
                    <TableHead className="text-white font-semibold">Fantasy Salary</TableHead>
                    <TableHead className="text-white font-semibold">Contract Length</TableHead>
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
                      <TableCell>
                        {salariesLoading ? (
                          <div className="text-gray-400 text-xs">Loading...</div>
                        ) : (
                          <EditableSalary
                            playerId={row.playerId}
                            currentSalary={salaries[row.playerId] || null}
                            onSalaryUpdate={updateSalary}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {contractsLoading ? (
                          <div className="text-gray-400 text-xs">Loading...</div>
                        ) : (
                          <EditableContractLength
                            playerId={row.playerId}
                            currentLength={contracts[row.playerId] || null}
                            onContractUpdate={updateContract}
                          />
                        )}
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
                    <TableHead className="text-white font-semibold">Fantasy Salary</TableHead>
                    <TableHead className="text-white font-semibold">Contract Length</TableHead>
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
                      <TableCell>
                        {salariesLoading ? (
                          <div className="text-gray-400 text-xs">Loading...</div>
                        ) : (
                          <EditableSalary
                            playerId={row.playerId}
                            currentSalary={salaries[row.playerId] || null}
                            onSalaryUpdate={updateSalary}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {contractsLoading ? (
                          <div className="text-gray-400 text-xs">Loading...</div>
                        ) : (
                          <EditableContractLength
                            playerId={row.playerId}
                            currentLength={contracts[row.playerId] || null}
                            onContractUpdate={updateContract}
                          />
                        )}
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
