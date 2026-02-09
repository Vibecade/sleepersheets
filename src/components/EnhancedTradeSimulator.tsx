import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Search, ArrowLeftRight, DollarSign, AlertTriangle, CheckCircle, Plus, X } from 'lucide-react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { getTeamName } from '@/utils/leagueDataUtils';
import { formatPlayerName } from '@/utils/csvExport';
import { calculateOptimizedSalaries } from '@/utils/salaryCalculations';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';

interface EnhancedTradeSimulatorProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

interface SelectedPlayer {
  playerId: string;
  player: any;
  fromTeam: string;
  fromRosterId: string;
}

interface TeamData {
  rosterId: string;
  teamName: string;
  user: any;
  currentSalary: number;
  capPercentage: number;
  status: 'over' | 'near' | 'under';
  playersOut: SelectedPlayer[];
  playersIn: SelectedPlayer[];
}

const EnhancedTradeSimulator: React.FC<EnhancedTradeSimulatorProps> = ({
  league,
  rosters,
  userMap,
  players
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [teams, setTeams] = useState<Record<string, TeamData>>({});
  
  const { salaries, getSalaryCapContribution } = usePlayerSalaries(league.league_id);
  const { settings } = useLeagueSettings(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);

  const salaryCap = settings?.salary_cap || 200000;

  // Calculate current team salaries using the optimized calculation
  const teamSalaryData = useMemo(() => {
    return calculateOptimizedSalaries({
      rosters,
      deadCapPlayers,
      getSalaryCapContribution,
      salaryCap
    });
  }, [rosters, deadCapPlayers, getSalaryCapContribution, salaryCap]);

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  // Search for players across all rosters
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const allPlayers: SelectedPlayer[] = [];
    
    rosters.forEach(roster => {
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || [])
      ];
      
      allPlayerIds.forEach(playerId => {
        const player = players[playerId];
        if (player && formatPlayerName(player).toLowerCase().includes(searchTerm.toLowerCase())) {
          const user = userMap[roster.owner_id];
          allPlayers.push({
            playerId,
            player,
            fromTeam: getTeamName(user),
            fromRosterId: roster.roster_id.toString()
          });
        }
      });
    });
    
    return allPlayers.slice(0, 12); // Show more results
  }, [searchTerm, rosters, players, userMap]);

  // Add player to a team's trade
  const addPlayerToTrade = (selectedPlayer: SelectedPlayer) => {
    const rosterId = selectedPlayer.fromRosterId;
    
    if (!teams[rosterId]) {
      const roster = rosters.find(r => r.roster_id.toString() === rosterId);
      const user = userMap[roster?.owner_id];
      const currentSalary = teamSalaryData.totalSalaries[roster?.roster_id] || 0;
      const capPercentage = teamSalaryData.capStatus[roster?.roster_id]?.percentage || 0;
      const status = teamSalaryData.capStatus[roster?.roster_id]?.status || 'under';

      setTeams(prev => ({
        ...prev,
        [rosterId]: {
          rosterId,
          teamName: getTeamName(user),
          user,
          currentSalary,
          capPercentage,
          status,
          playersOut: [selectedPlayer],
          playersIn: []
        }
      }));
    } else {
      setTeams(prev => ({
        ...prev,
        [rosterId]: {
          ...prev[rosterId],
          playersOut: [...prev[rosterId].playersOut.filter(p => p.playerId !== selectedPlayer.playerId), selectedPlayer]
        }
      }));
    }
    
    setSearchTerm('');
  };

  // Add incoming player to a team
  const addIncomingPlayer = (targetRosterId: string, selectedPlayer: SelectedPlayer) => {
    if (!teams[targetRosterId]) return;
    
    setTeams(prev => ({
      ...prev,
      [targetRosterId]: {
        ...prev[targetRosterId],
        playersIn: [...prev[targetRosterId].playersIn.filter(p => p.playerId !== selectedPlayer.playerId), selectedPlayer]
      }
    }));
  };

  // Remove player from trade
  const removePlayer = (rosterId: string, playerId: string, type: 'out' | 'in') => {
    setTeams(prev => {
      const team = prev[rosterId];
      if (!team) return prev;
      
      const updatedTeam = {
        ...team,
        [type === 'out' ? 'playersOut' : 'playersIn']: team[type === 'out' ? 'playersOut' : 'playersIn'].filter(p => p.playerId !== playerId)
      };
      
      // Remove team if no players are involved
      if (updatedTeam.playersOut.length === 0 && updatedTeam.playersIn.length === 0) {
        const { [rosterId]: removed, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [rosterId]: updatedTeam };
    });
  };

  // Calculate trade impact
  const calculateTradeImpact = (rosterId: string) => {
    const team = teams[rosterId];
    if (!team) return team?.currentSalary || 0;
    
    const salaryOut = team.playersOut.reduce((total, player) => total + getSalaryCapContribution(player.playerId), 0);
    const salaryIn = team.playersIn.reduce((total, player) => total + getSalaryCapContribution(player.playerId), 0);
    
    return team.currentSalary - salaryOut + salaryIn;
  };

  // Validate trade
  const validateTrade = () => {
    const teamList = Object.values(teams);
    if (teamList.length < 2) {
      return { valid: false, message: 'At least 2 teams required for a trade' };
    }

    // Check if all teams have players going both ways (or are receiving only)
    const hasValidExchange = teamList.every(team => 
      team.playersOut.length > 0 || team.playersIn.length > 0
    );
    
    if (!hasValidExchange) {
      return { valid: false, message: 'Each team must trade away or receive players' };
    }

    // Check salary cap compliance
    const overCapTeams = teamList.filter(team => calculateTradeImpact(team.rosterId) > salaryCap);
    
    if (overCapTeams.length > 0) {
      return { 
        valid: false, 
        message: `Trade would put ${overCapTeams.map(t => t.teamName).join(', ')} over the salary cap`
      };
    }
    
    return { valid: true, message: 'Trade is valid!' };
  };

  const tradeValidation = validateTrade();
  const activeTeams = Object.values(teams);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <ArrowLeftRight className="w-5 h-5 text-blue-400" />
          <div>
            <CardTitle>Enhanced Trade Simulator</CardTitle>
            <CardDescription>
              Search players and build multi-team trades (Salary Cap: {formatSalary(salaryCap)})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Player Search */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Search & Add Players</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for any player to start building a trade..."
              className="pl-10"
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-muted/20 rounded-lg border p-2 space-y-2 max-h-48 overflow-y-auto">
              {searchResults.map((result) => (
                <div key={result.playerId} className="flex items-center justify-between p-2 hover:bg-muted/40 rounded">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{formatPlayerName(result.player)}</span>
                        <Badge variant="outline" className="text-xs">{result.player.position}</Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                        <span>{result.fromTeam}</span>
                        <span>•</span>
                        <span className="text-emerald-600">
                          {formatSalary(getSalaryCapContribution(result.playerId))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addPlayerToTrade(result)}
                    className="shrink-0"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add to Trade
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Hero Cards */}
        {activeTeams.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="grid gap-4">
              {activeTeams.map((team) => {
                const newSalary = calculateTradeImpact(team.rosterId);
                const newPercentage = (newSalary / salaryCap) * 100;
                const newStatus = newPercentage > 100 ? 'over' : newPercentage > 90 ? 'near' : 'under';
                
                return (
                  <Card key={team.rosterId} className="bg-muted/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={team.user?.avatar} />
                            <AvatarFallback>{team.teamName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{team.teamName}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>Current: {formatSalary(team.currentSalary)}</span>
                              <span>After Trade: 
                                <span className={`ml-1 font-medium ${newStatus === 'over' ? 'text-destructive' : newStatus === 'near' ? 'text-yellow-600' : 'text-emerald-600'}`}>
                                  {formatSalary(newSalary)} ({newPercentage.toFixed(1)}%)
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Players Going Out */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Trading Away</h4>
                          {team.playersOut.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No players selected</p>
                          ) : (
                            <div className="space-y-2">
                              {team.playersOut.map((player) => (
                                <div key={player.playerId} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium">{formatPlayerName(player.player)}</span>
                                      <Badge variant="secondary" className="text-xs">{player.player.position}</Badge>
                                    </div>
                                    <span className="text-xs text-emerald-600">
                                      {formatSalary(getSalaryCapContribution(player.playerId))}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removePlayer(team.rosterId, player.playerId, 'out')}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Players Coming In */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">Receiving</h4>
                          {team.playersIn.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic">No players selected</p>
                          ) : (
                            <div className="space-y-2">
                              {team.playersIn.map((player) => (
                                <div key={player.playerId} className="flex items-center justify-between p-2 bg-background rounded border">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium">{formatPlayerName(player.player)}</span>
                                      <Badge variant="secondary" className="text-xs">{player.player.position}</Badge>
                                    </div>
                                    <span className="text-xs text-emerald-600">
                                      {formatSalary(getSalaryCapContribution(player.playerId))}
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removePlayer(team.rosterId, player.playerId, 'in')}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Add from Search Results */}
                      {searchResults.filter(r => r.fromRosterId !== team.rosterId).length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Quick add to this team:</p>
                          <div className="flex flex-wrap gap-1">
                            {searchResults
                              .filter(r => r.fromRosterId !== team.rosterId)
                              .slice(0, 3)
                              .map(result => (
                                <Button
                                  key={result.playerId}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addIncomingPlayer(team.rosterId, result)}
                                  className="text-xs h-7"
                                >
                                  + {formatPlayerName(result.player)}
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Trade Validation */}
        {activeTeams.length > 0 && (
          <>
            <Separator />
            <div className="flex items-center space-x-2 p-4 bg-muted/20 rounded-lg">
              {tradeValidation.valid ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              )}
              <span className={`font-medium ${tradeValidation.valid ? 'text-emerald-600' : 'text-destructive'}`}>
                {tradeValidation.message}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedTradeSimulator;