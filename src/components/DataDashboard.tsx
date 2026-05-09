import React, { memo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, ArrowUpDown, FileText, Eye } from 'lucide-react';
import { formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import EditableSalary from '@/components/EditableSalary';
import EditableContractLength from '@/components/EditableContractLength';
import TaxiSquadToggle from '@/components/TaxiSquadToggle';
import { LoadingText } from '@/components/ui/loading-states';

interface DataDashboardProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

// Memoize the entire component to prevent unnecessary re-renders
const DataDashboard: React.FC<DataDashboardProps> = memo(({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks
}) => {
  const [rosterFilter, setRosterFilter] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('');
  const [draftFilter, setDraftFilter] = useState('');

  const { 
    salaries, 
    taxiSquadStatus, 
    updateSalary, 
    updateTaxiSquadStatus, 
    getEffectiveSalary, 
    loading: salariesLoading 
  } = usePlayerSalaries(league.league_id);
  const { contracts, updateContract, loading: contractsLoading } = usePlayerContracts(league.league_id);

  // Prepare roster data with duplicate removal
  const rosterData = React.useMemo(() => {
    const data: any[] = [];
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
              data.push(playerData);
              playerRosterMap.set(playerId, playerData);
            }
          }
        });
      });
    });
    
    return data;
  }, [rosters, userMap, players]);

  // Prepare transaction data
  const transactionData = React.useMemo(() => {
    const data: any[] = [];
    
    transactions.forEach((transaction) => {
      const week = transaction.leg || transaction.week || 'N/A';

      // Process drops
      if (transaction.drops) {
        Object.entries(transaction.drops as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const fantasyTeam = getTeamName(user);
          
          if (player) {
            data.push({
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
            data.push({
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
    
    return data;
  }, [transactions, players, rosterUserMap]);

  // Prepare draft data
  const draftData = React.useMemo(() => {
    const data: any[] = [];
    
    draftPicks.forEach(({ draft, picks }) => {
      picks.forEach((pick: any) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        const fantasyTeam = getTeamName(user);
        
        data.push({
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
    
    return data;
  }, [draftPicks, players, rosterUserMap]);

  // Filter roster data based on search term
  const filteredRosterData = React.useMemo(() => {
    if (!rosterFilter) return rosterData;
    
    const lowerFilter = rosterFilter.toLowerCase();
    return rosterData.filter(row => 
      row.playerName.toLowerCase().includes(lowerFilter) ||
      row.position.toLowerCase().includes(lowerFilter) ||
      row.nflTeam.toLowerCase().includes(lowerFilter) ||
      row.fantasyTeam.toLowerCase().includes(lowerFilter)
    );
  }, [rosterData, rosterFilter]);

  // Filter transaction data based on search term
  const filteredTransactionData = React.useMemo(() => {
    if (!transactionFilter) return transactionData;
    
    const lowerFilter = transactionFilter.toLowerCase();
    return transactionData.filter(row => 
      row.playerName.toLowerCase().includes(lowerFilter) ||
      row.position.toLowerCase().includes(lowerFilter) ||
      row.nflTeam.toLowerCase().includes(lowerFilter) ||
      row.fantasyTeam.toLowerCase().includes(lowerFilter) ||
      row.action.toLowerCase().includes(lowerFilter)
    );
  }, [transactionData, transactionFilter]);

  // Filter draft data based on search term
  const filteredDraftData = React.useMemo(() => {
    if (!draftFilter) return draftData;
    
    const lowerFilter = draftFilter.toLowerCase();
    return draftData.filter(row => 
      row.playerName.toLowerCase().includes(lowerFilter) ||
      row.position.toLowerCase().includes(lowerFilter) ||
      row.nflTeam.toLowerCase().includes(lowerFilter) ||
      row.fantasyTeam.toLowerCase().includes(lowerFilter) ||
      (row.round.toString().includes(lowerFilter)) ||
      (row.pick.toString().includes(lowerFilter))
    );
  }, [draftData, draftFilter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5" />
          <span>Data Dashboard</span>
        </div>
        <CardDescription>
          Preview all your league data in clean, organized tables before exporting. Click on salary values and contract lengths to edit them. Toggle taxi squad status to apply 25% rookie salary discount.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rosters" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="rosters" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
             <span>Rosters ({filteredRosterData.length}/{rosterData.length})</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2">
              <ArrowUpDown className="w-4 h-4" />
             <span>Transactions ({filteredTransactionData.length}/{transactionData.length})</span>
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
             <span>Draft ({filteredDraftData.length}/{draftData.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rosters" className="mt-6">
           <div className="mb-4">
             <Input
               placeholder="Search players, positions, teams..."
               value={rosterFilter}
               onChange={(e) => setRosterFilter(e.target.value)}
               className="bg-white/10 border-white/20 text-white"
             />
           </div>
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
                    <TableHead className="text-white font-semibold">Effective Salary</TableHead>
                    <TableHead className="text-white font-semibold">Contract Length</TableHead>
                    <TableHead className="text-white font-semibold">Taxi Squad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {filteredRosterData.map((row, index) => (
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
                          <LoadingText size="sm" />
                        ) : (
                          <EditableSalary
                            playerId={row.playerId}
                            currentSalary={salaries[row.playerId] || null}
                            onSalaryUpdate={updateSalary}
                            leagueId={league.league_id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {salariesLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <div className="text-emerald-400 font-medium">
                            ${getEffectiveSalary(row.playerId).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {contractsLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <EditableContractLength
                            playerId={row.playerId}
                            currentLength={contracts[row.playerId] || null}
                            onContractUpdate={updateContract}
                            leagueId={league.league_id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {salariesLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <TaxiSquadToggle
                            playerId={row.playerId}
                            currentStatus={taxiSquadStatus[row.playerId] || false}
                            onToggle={updateTaxiSquadStatus}
                            leagueId={league.league_id}
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
           <div className="mb-4">
             <Input
               placeholder="Search transactions by player, team, or action..."
               value={transactionFilter}
               onChange={(e) => setTransactionFilter(e.target.value)}
               className="bg-white/10 border-white/20 text-white"
             />
           </div>
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
                    <TableHead className="text-white font-semibold">Effective Salary</TableHead>
                    <TableHead className="text-white font-semibold">Contract Length</TableHead>
                    <TableHead className="text-white font-semibold">Taxi Squad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {filteredTransactionData.map((row, index) => (
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
                          <LoadingText size="sm" />
                        ) : (
                          <EditableSalary
                            playerId={row.playerId}
                            currentSalary={salaries[row.playerId] || null}
                            onSalaryUpdate={updateSalary}
                            leagueId={league.league_id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {salariesLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <div className="text-emerald-400 font-medium">
                            ${getEffectiveSalary(row.playerId).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {contractsLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <EditableContractLength
                            playerId={row.playerId}
                            currentLength={contracts[row.playerId] || null}
                            onContractUpdate={updateContract}
                            leagueId={league.league_id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {salariesLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <TaxiSquadToggle
                            playerId={row.playerId}
                            currentStatus={taxiSquadStatus[row.playerId] || false}
                            onToggle={updateTaxiSquadStatus}
                            leagueId={league.league_id}
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
           <div className="mb-4">
             <Input
               placeholder="Search draft by player, position, round, or pick..."
               value={draftFilter}
               onChange={(e) => setDraftFilter(e.target.value)}
               className="bg-white/10 border-white/20 text-white"
             />
           </div>
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
                    <TableHead className="text-white font-semibold">Effective Salary</TableHead>
                    <TableHead className="text-white font-semibold">Contract Length</TableHead>
                    <TableHead className="text-white font-semibold">Taxi Squad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                 {filteredDraftData.map((row, index) => (
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
                          <LoadingText size="sm" />
                        ) : (
                          <EditableSalary
                            playerId={row.playerId}
                            currentSalary={salaries[row.playerId] || null}
                            onSalaryUpdate={updateSalary}
                            leagueId={league.league_id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {salariesLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <div className="text-emerald-400 font-medium">
                            ${getEffectiveSalary(row.playerId).toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {contractsLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <EditableContractLength
                            playerId={row.playerId}
                            currentLength={contracts[row.playerId] || null}
                            onContractUpdate={updateContract}
                            leagueId={league.league_id}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {salariesLoading ? (
                          <LoadingText size="sm" />
                        ) : (
                          <TaxiSquadToggle
                            playerId={row.playerId}
                            currentStatus={taxiSquadStatus[row.playerId] || false}
                            onToggle={updateTaxiSquadStatus}
                            leagueId={league.league_id}
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
});

DataDashboard.displayName = 'DataDashboard';

export default DataDashboard;