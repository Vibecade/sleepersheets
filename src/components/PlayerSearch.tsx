import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, X, DollarSign, Clock } from 'lucide-react';
import { formatPlayerName } from '@/utils/csvExport';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import EditableSalary from '@/components/EditableSalary';
import EditableContractLength from '@/components/EditableContractLength';
import TaxiSquadToggle from '@/components/TaxiSquadToggle';
import { getTeamName } from '@/utils/leagueDataUtils';

interface PlayerSearchProps {
  leagueId: string;
  players: Record<string, any>;
  rosters: any[];
  userMap: Record<string, any>;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({
  leagueId,
  players,
  rosters,
  userMap
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [rosterInfo, setRosterInfo] = useState<any | null>(null);
  
  const { 
    salaries, 
    taxiSquadStatus, 
    updateSalary, 
    updateTaxiSquadStatus, 
    getEffectiveSalary 
  } = usePlayerSalaries(leagueId);
  
  const { contracts, updateContract } = usePlayerContracts(leagueId);

  // Create a map of player IDs to roster info for quick lookup
  const playerRosterMap = React.useMemo(() => {
    const map = new Map();
    
    rosters.forEach(roster => {
      const user = userMap[roster.owner_id];
      const teamName = getTeamName(user);
      
      // Map active players
      (roster.players || []).forEach((playerId: string) => {
        map.set(playerId, { 
          rosterId: roster.roster_id,
          teamName,
          status: 'Active'
        });
      });
      
      // Map reserve players
      (roster.reserve || []).forEach((playerId: string) => {
        map.set(playerId, { 
          rosterId: roster.roster_id,
          teamName,
          status: 'Reserve'
        });
      });
      
      // Map taxi squad players
      (roster.taxi || []).forEach((playerId: string) => {
        map.set(playerId, { 
          rosterId: roster.roster_id,
          teamName,
          status: 'Taxi Squad'
        });
      });
    });
    
    return map;
  }, [rosters, userMap]);

  // Search players when search term changes
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = Object.entries(players)
      .filter(([_, player]) => {
        const fullName = `${player.first_name || ''} ${player.last_name || ''}`.toLowerCase();
        return fullName.includes(lowerSearchTerm);
      })
      .map(([playerId, player]) => ({
        playerId,
        player,
        rosterInfo: playerRosterMap.get(playerId) || null
      }))
      .slice(0, 20); // Limit to 20 results for performance
    
    setSearchResults(results);
  }, [searchTerm, players, playerRosterMap]);

  const handleSelectPlayer = (result: any) => {
    setSelectedPlayer(result);
    setRosterInfo(result.rosterInfo);
    setSearchTerm(''); // Clear search after selection
    setSearchResults([]); // Clear results
  };

  const handleClearSelection = () => {
    setSelectedPlayer(null);
    setRosterInfo(null);
  };

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Search className="w-5 h-5 text-blue-400" />
          <span>Player Search</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a player by name..."
            className="pl-10 bg-white/10 border-white/20 text-white"
          />
        </div>
        
        {searchResults.length > 0 && !selectedPlayer && (
          <ScrollArea className="h-60 rounded-md border border-white/10 bg-white/5">
            <div className="p-2 space-y-1">
              {searchResults.map((result) => (
                <div 
                  key={result.playerId}
                  className="flex items-center justify-between p-2 hover:bg-white/10 rounded-md cursor-pointer"
                  onClick={() => handleSelectPlayer(result)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-white">{formatPlayerName(result.player)}</span>
                    <Badge variant="outline" className="text-xs">
                      {result.player.position}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {result.player.team || 'FA'}
                    </span>
                  </div>
                  {result.rosterInfo && (
                    <Badge className="text-xs">
                      {result.rosterInfo.teamName}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {selectedPlayer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-white">
                  {formatPlayerName(selectedPlayer.player)}
                </h3>
                <Badge variant="outline" className="text-emerald-300 border-emerald-400/30">
                  {selectedPlayer.player.position}
                </Badge>
                <span className="text-sm text-gray-400">
                  {selectedPlayer.player.team || 'Free Agent'}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearSelection}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Salary Information</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Base Salary</p>
                    <EditableSalary
                      playerId={selectedPlayer.playerId}
                      currentSalary={salaries[selectedPlayer.playerId] || null}
                      onSalaryUpdate={updateSalary}
                      leagueId={leagueId}
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Effective Salary</p>
                    <div className="text-emerald-400 font-medium">
                      {formatSalary(getEffectiveSalary(selectedPlayer.playerId))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Taxi Squad Status</p>
                  <TaxiSquadToggle
                    playerId={selectedPlayer.playerId}
                    currentStatus={taxiSquadStatus[selectedPlayer.playerId] || false}
                    onToggle={updateTaxiSquadStatus}
                    leagueId={leagueId}
                  />
                </div>
              </div>
              
              <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="font-medium text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Contract Information</span>
                </h4>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Contract Length</p>
                  <EditableContractLength
                    playerId={selectedPlayer.playerId}
                    currentLength={contracts[selectedPlayer.playerId] || null}
                    onContractUpdate={updateContract}
                    leagueId={leagueId}
                  />
                </div>
                
                {rosterInfo && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-1">Team Information</p>
                    <div className="flex flex-col space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Team:</span>
                        <span className="text-sm font-medium text-white">{rosterInfo.teamName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-300">Status:</span>
                        <Badge variant="outline" className="text-xs">
                          {rosterInfo.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {!rosterInfo && (
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-md border border-amber-500/20">
                    <p className="text-sm text-amber-300">
                      This player is not currently on any roster in this league.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {!selectedPlayer && searchTerm.length > 0 && searchResults.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No players found matching "{searchTerm}"</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        )}
        
        {!selectedPlayer && searchTerm.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Search for a player to view and edit their contract details</p>
            <p className="text-sm">Enter a player name to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerSearch;