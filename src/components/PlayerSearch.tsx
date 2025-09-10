import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Filter, Users, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';

interface Player {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string;
  team?: string;
  active?: boolean;
}

interface PlayerSearchProps {
  players: Record<string, Player>;
  onPlayerSelect?: (player: Player) => void;
  className?: string;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({
  players,
  onPlayerSelect,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("");
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const getPlayerName = useCallback((player: Player): string => {
    return player.full_name || `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player';
  }, []);

  const filteredPlayers = useMemo(() => {
    if (!searchTerm && !positionFilter && !teamFilter) return [];

    return Object.values(players)
      .filter(player => {
        if (!player.active) return false;
        
        const matchesSearch = !searchTerm || 
          getPlayerName(player).toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPosition = !positionFilter || 
          player.position === positionFilter;
        
        const matchesTeam = !teamFilter || 
          player.team === teamFilter;

        return matchesSearch && matchesPosition && matchesTeam;
      })
      .slice(0, 10);
  }, [players, searchTerm, positionFilter, teamFilter, getPlayerName]);

  const positions = useMemo(() => {
    const posSet = new Set<string>();
    Object.values(players).forEach(player => {
      if (player.position && player.active) {
        posSet.add(player.position);
      }
    });
    return Array.from(posSet).sort();
  }, [players]);

  const teams = useMemo(() => {
    const teamSet = new Set<string>();
    Object.values(players).forEach(player => {
      if (player.team && player.active) {
        teamSet.add(player.team);
      }
    });
    return Array.from(teamSet).sort();
  }, [players]);

  const handlePlayerSelect = (player: Player) => {
    onPlayerSelect?.(player);
    setSearchTerm("");
    setIsOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setPositionFilter("");
    setTeamFilter("");
    setIsOpen(false);
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-blue-500/20 text-blue-400 border-blue-400';
      case 'RB': return 'bg-green-500/20 text-green-400 border-green-400';
      case 'WR': return 'bg-purple-500/20 text-purple-400 border-purple-400';
      case 'TE': return 'bg-orange-500/20 text-orange-400 border-orange-400';
      case 'K': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400';
      case 'DEF': return 'bg-red-500/20 text-red-400 border-red-400';
      default: return 'bg-muted/20 text-muted-foreground border-muted';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 bg-card/50 border-border-light transition-all duration-200 focus:bg-card"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="bg-card/50 border-border-light hover:bg-card transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Position</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setPositionFilter("")}>
              All Positions
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {positions.map(position => (
              <DropdownMenuItem 
                key={position}
                onClick={() => setPositionFilter(position)}
              >
                {position}
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Team</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setTeamFilter("")}>
              All Teams
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {teams.slice(0, 10).map(team => (
              <DropdownMenuItem 
                key={team}
                onClick={() => setTeamFilter(team)}
              >
                {team}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {(searchTerm || positionFilter || teamFilter) && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            className="bg-card/50 border-border-light hover:bg-destructive/20 hover:border-destructive transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {(positionFilter || teamFilter) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {positionFilter && (
            <Badge 
              variant="outline" 
              className={`${getPositionColor(positionFilter)} text-xs`}
            >
              {positionFilter}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setPositionFilter("")}
              />
            </Badge>
          )}
          {teamFilter && (
            <Badge variant="outline" className="text-xs">
              {teamFilter}
              <X 
                className="w-3 h-3 ml-1 cursor-pointer" 
                onClick={() => setTeamFilter("")}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Search Results */}
      {isOpen && (searchTerm || positionFilter || teamFilter) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto bg-popover border-border-light shadow-lg">
          {filteredPlayers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No players found</p>
              <p className="text-xs">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredPlayers.map(player => (
                <div
                  key={player.player_id}
                  onClick={() => handlePlayerSelect(player)}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-accent/50 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {getPlayerName(player)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge 
                          variant="outline" 
                          className={`${getPositionColor(player.position || '')} text-xs px-1.5 py-0.5`}
                        >
                          {player.position}
                        </Badge>
                        <span>{player.team}</span>
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default PlayerSearch;