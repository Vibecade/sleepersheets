
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Search, ArrowLeftRight, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { getTeamName } from '@/utils/leagueDataUtils';
import { formatPlayerName } from '@/utils/csvExport';

interface TradeSimulatorProps {
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

const TradeSimulator: React.FC<TradeSimulatorProps> = ({
  league,
  rosters,
  userMap,
  players
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam1, setSelectedTeam1] = useState<string>('');
  const [selectedTeam2, setSelectedTeam2] = useState<string>('');
  const [team1Players, setTeam1Players] = useState<SelectedPlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<SelectedPlayer[]>([]);
  
  const { salaries } = usePlayerSalaries(league.league_id);
  const { settings } = useLeagueSettings(league.league_id);

  // Use the league's saved salary cap, fallback to 200000 if not set
  const salaryCap = settings?.salary_cap || 200000;

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getTeamCurrentSalary = (rosterId: string) => {
    const roster = rosters.find(r => r.roster_id.toString() === rosterId);
    if (!roster) return 0;
    
    const allPlayerIds = [
      ...(roster.players || []),
      ...(roster.taxi || [])
    ];
    
    return allPlayerIds.reduce((total, playerId) => {
      const salary = salaries[playerId];
      return total + (salary || 0);
    }, 0);
  };

  const calculateTradeImpact = (teamRosterId: string, playersOut: SelectedPlayer[], playersIn: SelectedPlayer[]) => {
    const currentSalary = getTeamCurrentSalary(teamRosterId);
    const salaryOut = playersOut.reduce((total, player) => total + (salaries[player.playerId] || 0), 0);
    const salaryIn = playersIn.reduce((total, player) => total + (salaries[player.playerId] || 0), 0);
    
    return currentSalary - salaryOut + salaryIn;
  };

  const searchPlayers = () => {
    if (!searchTerm.trim()) return [];
    
    const allPlayers = [];
    
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
    
    return allPlayers.slice(0, 10); // Limit to 10 results
  };

  const addPlayerToTrade = (selectedPlayer: SelectedPlayer, team: 1 | 2) => {
    if (team === 1) {
      if (!team1Players.some(p => p.playerId === selectedPlayer.playerId)) {
        setTeam1Players([...team1Players, selectedPlayer]);
      }
    } else {
      if (!team2Players.some(p => p.playerId === selectedPlayer.playerId)) {
        setTeam2Players([...team2Players, selectedPlayer]);
      }
    }
    setSearchTerm('');
  };

  const removePlayer = (playerId: string, team: 1 | 2) => {
    if (team === 1) {
      setTeam1Players(team1Players.filter(p => p.playerId !== playerId));
    } else {
      setTeam2Players(team2Players.filter(p => p.playerId !== playerId));
    }
  };

  const getTradeStatus = () => {
    if (team1Players.length === 0 || team2Players.length === 0) {
      return { valid: false, message: 'Add players to both sides of the trade' };
    }

    // Check if players are from the selected teams
    const team1Valid = team1Players.every(p => p.fromRosterId === selectedTeam1);
    const team2Valid = team2Players.every(p => p.fromRosterId === selectedTeam2);
    
    if (!team1Valid || !team2Valid) {
      return { valid: false, message: 'Players must match their selected teams' };
    }

    // Calculate salary cap impact
    const team1NewSalary = calculateTradeImpact(selectedTeam1, team1Players, team2Players);
    const team2NewSalary = calculateTradeImpact(selectedTeam2, team2Players, team1Players);
    
    if (team1NewSalary > salaryCap || team2NewSalary > salaryCap) {
      return { 
        valid: false, 
        message: `Trade would exceed salary cap (${formatSalary(salaryCap)})`,
        team1NewSalary,
        team2NewSalary
      };
    }
    
    return { 
      valid: true, 
      message: 'Trade is valid!',
      team1NewSalary,
      team2NewSalary
    };
  };

  const tradeStatus = getTradeStatus();
  const searchResults = searchPlayers();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-400" />
            <div>
              <CardTitle>Trade Simulator</CardTitle>
              <CardDescription>
                Simulate trades and check salary cap impact (Cap: {formatSalary(salaryCap)})
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Team Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Team 1</label>
            <Select value={selectedTeam1} onValueChange={setSelectedTeam1}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {rosters.map((roster) => {
                  const user = userMap[roster.owner_id];
                  return (
                    <SelectItem key={roster.roster_id} value={roster.roster_id.toString()}>
                      {getTeamName(user)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Team 2</label>
            <Select value={selectedTeam2} onValueChange={setSelectedTeam2}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {rosters.map((roster) => {
                  const user = userMap[roster.owner_id];
                  return (
                    <SelectItem key={roster.roster_id} value={roster.roster_id.toString()}>
                      {getTeamName(user)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Player Search */}
        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">Search Players</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a player to trade..."
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white/5 rounded-lg border border-white/10 p-2 space-y-2 max-h-40 overflow-y-auto">
              {searchResults.map((result) => (
                <div key={result.playerId} className="flex items-center justify-between p-2 hover:bg-white/10 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-white">
                      {formatPlayerName(result.player)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {result.player.position}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {result.fromTeam}
                    </span>
                    <span className="text-xs text-emerald-400">
                      {salaries[result.playerId] ? formatSalary(salaries[result.playerId]) : 'No salary'}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addPlayerToTrade(result, 1)}
                      disabled={!selectedTeam1}
                      className="text-xs"
                    >
                      → Team 1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addPlayerToTrade(result, 2)}
                      disabled={!selectedTeam2}
                      className="text-xs"
                    >
                      → Team 2
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trade Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team 1 Players */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">
              {selectedTeam1 ? getTeamName(userMap[rosters.find(r => r.roster_id.toString() === selectedTeam1)?.owner_id]) : 'Team 1'} Trades Away
            </h4>
            {team1Players.length === 0 ? (
              <p className="text-gray-400 text-sm">No players selected</p>
            ) : (
              <div className="space-y-2">
                {team1Players.map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white">{formatPlayerName(player.player)}</span>
                      <Badge variant="outline" className="text-xs">{player.player.position}</Badge>
                      <span className="text-xs text-emerald-400">
                        {salaries[player.playerId] ? formatSalary(salaries[player.playerId]) : '$0'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePlayer(player.playerId, 1)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Team 2 Players */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">
              {selectedTeam2 ? getTeamName(userMap[rosters.find(r => r.roster_id.toString() === selectedTeam2)?.owner_id]) : 'Team 2'} Trades Away
            </h4>
            {team2Players.length === 0 ? (
              <p className="text-gray-400 text-sm">No players selected</p>
            ) : (
              <div className="space-y-2">
                {team2Players.map((player) => (
                  <div key={player.playerId} className="flex items-center justify-between p-2 bg-white/10 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white">{formatPlayerName(player.player)}</span>
                      <Badge variant="outline" className="text-xs">{player.player.position}</Badge>
                      <span className="text-xs text-emerald-400">
                        {salaries[player.playerId] ? formatSalary(salaries[player.playerId]) : '$0'}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removePlayer(player.playerId, 2)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trade Analysis */}
        {(team1Players.length > 0 || team2Players.length > 0) && (
          <>
            <Separator className="bg-white/10" />
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {tradeStatus.valid ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
                <span className={`font-medium ${tradeStatus.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {tradeStatus.message}
                </span>
              </div>

              {tradeStatus.team1NewSalary !== undefined && tradeStatus.team2NewSalary !== undefined && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-medium text-white mb-2">
                      {selectedTeam1 ? getTeamName(userMap[rosters.find(r => r.roster_id.toString() === selectedTeam1)?.owner_id]) : 'Team 1'} Salary Impact
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Current:</span>
                        <span className="text-white">{formatSalary(getTeamCurrentSalary(selectedTeam1))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">After Trade:</span>
                        <span className={tradeStatus.team1NewSalary > salaryCap ? 'text-red-400' : 'text-emerald-400'}>
                          {formatSalary(tradeStatus.team1NewSalary)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-medium text-white mb-2">
                      {selectedTeam2 ? getTeamName(userMap[rosters.find(r => r.roster_id.toString() === selectedTeam2)?.owner_id]) : 'Team 2'} Salary Impact
                    </h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Current:</span>
                        <span className="text-white">{formatSalary(getTeamCurrentSalary(selectedTeam2))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">After Trade:</span>
                        <span className={tradeStatus.team2NewSalary > salaryCap ? 'text-red-400' : 'text-emerald-400'}>
                          {formatSalary(tradeStatus.team2NewSalary)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeSimulator;
