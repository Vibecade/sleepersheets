import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlayerLineupDisplayProps {
  starters: string[];
  bench: string[];
  players: Record<string, any>;
}

export const PlayerLineupDisplay: React.FC<PlayerLineupDisplayProps> = ({
  starters,
  bench,
  players
}) => {
  const isMobile = useIsMobile();
  const getPlayerInfo = (playerId: string) => {
    const player = players[playerId];
    if (!player) {
      return {
        name: 'Unknown Player',
        position: 'N/A',
        team: 'N/A',
        playerPhotoUrl: null
      };
    }

    return {
      name: `${player.first_name || ''} ${player.last_name || ''}`.trim() || 'Unknown Player',
      position: player.position || 'N/A',
      team: player.team || 'N/A',
      playerPhotoUrl: player.player_id ? `https://sleepercdn.com/content/nfl/players/thumb/${player.player_id}.jpg` : null
    };
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-red-500/20 text-red-300 border-red-500/50';
      case 'RB': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'WR': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'TE': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'K': return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
      case 'DEF': return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
      default: return 'bg-muted/20 text-muted-foreground border-muted/50';
    }
  };

  const PlayerCard = ({ playerId, isStarter }: { playerId: string; isStarter: boolean }) => {
    const { name, position, team, playerPhotoUrl } = getPlayerInfo(playerId);

    return (
      <Card className={`transition-all duration-200 touch-manipulation ${
        isMobile 
          ? 'active:bg-accent/50 min-h-[60px]' 
          : 'hover:bg-accent/50'
      } ${isStarter ? 'border-primary/50' : ''}`}>
        <CardContent className={isMobile ? 'p-4' : 'p-3'}>
          <div className={`flex items-center ${isMobile ? 'space-x-4' : 'space-x-3'}`}>
            <Avatar className={isMobile ? 'w-12 h-12' : 'w-10 h-10'}>
              <AvatarImage 
                src={playerPhotoUrl || undefined}
                alt={`${name} photo`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`font-medium ${isMobile ? 'text-base' : 'text-sm'} truncate`}>{name}</p>
              <div className={`flex items-center ${isMobile ? 'space-x-3 mt-2' : 'space-x-2 mt-1'}`}>
                <Badge variant="outline" className={`${isMobile ? 'text-sm px-3 py-1' : 'text-xs'} ${getPositionColor(position)}`}>
                  {position}
                </Badge>
                <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-muted-foreground`}>{team}</span>
              </div>
            </div>
            {isStarter && (
              <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} text-primary`} />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Starting Lineup */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <User className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Starting Lineup ({starters.length})</h4>
        </div>
        <div className="space-y-2">
          {starters.length > 0 ? (
            starters.map((playerId) => (
              <PlayerCard key={playerId} playerId={playerId} isStarter={true} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No starters found</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Bench */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h4 className="font-semibold text-sm">Bench ({bench.length})</h4>
        </div>
        <div className={`space-y-2 ${isMobile ? 'max-h-64' : 'max-h-48'} overflow-y-auto`}>
          {bench.length > 0 ? (
            bench.map((playerId) => (
              <PlayerCard key={playerId} playerId={playerId} isStarter={false} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No bench players found</p>
          )}
        </div>
      </div>
    </div>
  );
};