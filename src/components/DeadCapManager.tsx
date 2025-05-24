import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skull, Plus, Trash2, Check } from 'lucide-react';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { getTeamName } from '@/utils/leagueDataUtils';

interface DeadCapManagerProps {
  leagueId: string;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

const DeadCapManager: React.FC<DeadCapManagerProps> = ({ 
  leagueId, 
  rosters, 
  userMap, 
  players 
}) => {
  const { deadCapPlayers, addDeadCapPlayer, updateDeadCapPlayer, removeDeadCapPlayer, loading } = useDeadCapPlayers(leagueId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [selectedRosterId, setSelectedRosterId] = useState('');
  const [deadCapSalary, setDeadCapSalary] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);

  // Filter players based on search - add safety check for players object
  const filteredPlayers = players && typeof players === 'object' 
    ? Object.entries(players).filter(([playerId, player]) => {
        if (!player || !playerSearch) return false;
        const fullName = `${player.first_name || ''} ${player.last_name || ''}`.toLowerCase();
        return fullName.includes(playerSearch.toLowerCase()) || 
               (player.last_name && player.last_name.toLowerCase().includes(playerSearch.toLowerCase()));
      }).slice(0, 50) // Limit to 50 results for performance
    : [];

  const handlePlayerSelect = (playerId: string) => {
    const player = players[playerId];
    setSelectedPlayerId(playerId);
    setSelectedPlayerName(`${player.first_name} ${player.last_name}`);
    setPlayerSearch(`${player.first_name} ${player.last_name}`);
    setShowPlayerSearch(false);
  };

  const handleAddDeadCap = async () => {
    if (!selectedPlayerId || !selectedRosterId || !deadCapSalary) {
      return;
    }

    const success = await addDeadCapPlayer(
      selectedPlayerId, 
      parseInt(selectedRosterId), 
      parseFloat(deadCapSalary)
    );

    if (success) {
      setSelectedPlayerId('');
      setSelectedPlayerName('');
      setSelectedRosterId('');
      setDeadCapSalary('');
      setPlayerSearch('');
      setShowAddForm(false);
    }
  };

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getTotalDeadCap = () => {
    return deadCapPlayers.reduce((total, player) => total + (player.salary || 0), 0);
  };

  const getTeamDeadCap = (rosterId: number) => {
    return deadCapPlayers
      .filter(player => player.roster_id === rosterId)
      .reduce((total, player) => total + (player.salary || 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skull className="w-5 h-5 text-red-400" />
            <div>
              <CardTitle>Dynasty Dead Cap</CardTitle>
              <CardDescription>
                Manage dead cap salaries for released players
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-red-400 border-red-400">
              Total: {formatSalary(getTotalDeadCap())}
            </Badge>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dead Cap</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-4">
            <h4 className="font-medium text-white">Add Dead Cap Player</h4>
            
            <div className="space-y-2 relative">
              <label className="text-sm text-gray-300">Search Player</label>
              <div className="relative">
                <Command className="rounded-lg border border-white/20 bg-white/10">
                  <CommandInput
                    placeholder="Search by player name..."
                    value={playerSearch}
                    onValueChange={(value) => {
                      setPlayerSearch(value);
                      setShowPlayerSearch(value.length > 0);
                    }}
                    onFocus={() => setShowPlayerSearch(playerSearch.length > 0)}
                    className="bg-transparent text-white placeholder:text-gray-400"
                  />
                  {showPlayerSearch && filteredPlayers.length > 0 && (
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty>No players found.</CommandEmpty>
                      <CommandGroup>
                        {filteredPlayers.map(([playerId, player]) => (
                          <CommandItem
                            key={playerId}
                            value={`${player.first_name} ${player.last_name}`}
                            onSelect={() => handlePlayerSelect(playerId)}
                            className="text-white hover:bg-gray-700 cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedPlayerId === playerId ? "opacity-100" : "opacity-0"
                              }`}
                            />
                            {player.first_name} {player.last_name} ({player.position}) - {player.team || 'FA'}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  )}
                </Command>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Team</label>
              <Select value={selectedRosterId} onValueChange={setSelectedRosterId}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {rosters.map((roster) => {
                    const user = userMap[roster.owner_id];
                    const teamName = getTeamName(user);
                    return (
                      <SelectItem 
                        key={roster.roster_id} 
                        value={roster.roster_id.toString()}
                        className="text-white hover:bg-gray-700"
                      >
                        {teamName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300">Dead Cap Salary</label>
              <Input
                type="number"
                placeholder="Enter salary amount"
                value={deadCapSalary}
                onChange={(e) => setDeadCapSalary(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
            </div>

            <div className="flex space-x-2">
              <Button onClick={handleAddDeadCap} size="sm">
                Add Dead Cap
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="outline" 
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {deadCapPlayers.length > 0 && (
          <div className="space-y-4">
            <Separator className="bg-white/10" />
            
            {/* Group by team */}
            {rosters.map((roster) => {
              const teamDeadCap = deadCapPlayers.filter(player => player.roster_id === roster.roster_id);
              if (teamDeadCap.length === 0) return null;
              
              const user = userMap[roster.owner_id];
              const teamName = getTeamName(user);
              const teamTotal = getTeamDeadCap(roster.roster_id);
              
              return (
                <div key={roster.roster_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-white">{teamName}</h5>
                    <Badge variant="outline" className="text-red-400 border-red-400">
                      {formatSalary(teamTotal)}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {teamDeadCap.map((deadCapPlayer) => {
                      const player = players[deadCapPlayer.player_id];
                      return (
                        <div 
                          key={deadCapPlayer.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-red-400/20"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {player ? `${player.first_name} ${player.last_name}` : 'Unknown Player'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {player?.position} • {player?.team || 'FA'}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={deadCapPlayer.salary || ''}
                              onChange={(e) => updateDeadCapPlayer(deadCapPlayer.id, parseFloat(e.target.value) || null)}
                              className="w-24 h-8 bg-white/10 border-white/20 text-white text-sm"
                              placeholder="Salary"
                            />
                            <Button
                              onClick={() => removeDeadCapPlayer(deadCapPlayer.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {deadCapPlayers.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-400">
            <Skull className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No dead cap players added yet</p>
            <p className="text-sm">Click "Add Dead Cap" to start tracking released player salaries</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeadCapManager;
