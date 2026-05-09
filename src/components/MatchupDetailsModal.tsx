import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamName } from '@/utils/leagueDataUtils';
import { PlayerLineupDisplay } from './PlayerLineupDisplay';
import { RosterComparison } from './RosterComparison';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Matchup } from '@/hooks/useMatchups';
import type { SleeperRoster, SleeperUser, SleeperPlayer } from '@/types/sleeper';

interface MatchupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchupId: string;
  team1: Matchup;
  team2: Matchup;
  roster1: SleeperRoster;
  roster2: SleeperRoster;
  user1: SleeperUser | undefined;
  user2: SleeperUser | undefined;
  players: Record<string, SleeperPlayer>;
  formatPoints: (points: number) => string;
  getTeamRecord: (roster: SleeperRoster) => string;
}

export const MatchupDetailsModal: React.FC<MatchupDetailsModalProps> = ({
  isOpen,
  onClose,
  matchupId,
  team1,
  team2,
  roster1,
  roster2,
  user1,
  user2,
  players,
  formatPoints,
  getTeamRecord
}) => {
  const team1Winning = team1.points > team2.points;
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${
        isMobile 
          ? 'w-full h-full max-w-none max-h-none m-0 rounded-none' 
          : 'max-w-4xl max-h-[90vh]'
      } overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Matchup Details
          </DialogTitle>
        </DialogHeader>

        {/* Matchup Header */}
        <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} py-4 border-b border-border/50`}>
          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-3`}>
            <Avatar className={`${team1Winning ? 'ring-2 ring-primary' : ''}`}>
              <AvatarImage 
                src={user1?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user1.avatar}` : undefined}
                alt={`${getTeamName(user1)} avatar`}
              />
              <AvatarFallback className="bg-primary/20 text-primary-foreground">
                {getTeamName(user1).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className={`font-semibold ${team1Winning ? 'text-primary' : ''}`}>
                {getTeamName(user1)}
              </p>
              <p className="text-sm text-muted-foreground">{getTeamRecord(roster1)}</p>
            </div>
            <Badge variant={team1Winning ? "default" : "secondary"} className="ml-2">
              {formatPoints(team1.points)}
            </Badge>
          </div>

          {!isMobile && (
            <div className="text-center px-4">
              <p className="text-sm text-muted-foreground">VS</p>
            </div>
          )}

          <div className={`flex items-center ${isMobile ? 'justify-center' : ''} space-x-3`}>
            <Badge variant={!team1Winning ? "default" : "secondary"} className="mr-2">
              {formatPoints(team2.points)}
            </Badge>
            <div className="text-right">
              <p className={`font-semibold ${!team1Winning ? 'text-primary' : ''}`}>
                {getTeamName(user2)}
              </p>
              <p className="text-sm text-muted-foreground">{getTeamRecord(roster2)}</p>
            </div>
            <Avatar className={`${!team1Winning ? 'ring-2 ring-primary' : ''}`}>
              <AvatarImage 
                src={user2?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user2.avatar}` : undefined}
                alt={`${getTeamName(user2)} avatar`}
              />
              <AvatarFallback className="bg-primary/20 text-primary-foreground">
                {getTeamName(user2).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="lineups" className="w-full">
          <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'h-12' : ''}`}>
            <TabsTrigger value="lineups" className={isMobile ? 'text-sm touch-manipulation' : ''}>
              {isMobile ? 'Lineups' : 'Starting Lineups'}
            </TabsTrigger>
            <TabsTrigger value="comparison" className={isMobile ? 'text-sm touch-manipulation' : ''}>
              {isMobile ? 'Analysis' : 'Roster Analysis'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lineups" className="space-y-4">
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage 
                        src={user1?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user1.avatar}` : undefined}
                        alt={`${getTeamName(user1)} avatar`}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                        {getTeamName(user1).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{getTeamName(user1)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerLineupDisplay
                    starters={team1.starters || []}
                    bench={team1.players?.filter((p: string) => !team1.starters?.includes(p)) || []}
                    players={players}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage 
                        src={user2?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user2.avatar}` : undefined}
                        alt={`${getTeamName(user2)} avatar`}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                        {getTeamName(user2).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{getTeamName(user2)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PlayerLineupDisplay
                    starters={team2.starters || []}
                    bench={team2.players?.filter((p: string) => !team2.starters?.includes(p)) || []}
                    players={players}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison">
            <RosterComparison
              team1={{
                name: getTeamName(user1),
                avatar: user1?.avatar,
                roster: roster1,
                starters: team1.starters || [],
                bench: team1.players?.filter((p: string) => !team1.starters?.includes(p)) || [],
                points: team1.points
              }}
              team2={{
                name: getTeamName(user2),
                avatar: user2?.avatar,
                roster: roster2,
                starters: team2.starters || [],
                bench: team2.players?.filter((p: string) => !team2.starters?.includes(p)) || [],
                points: team2.points
              }}
              players={players}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};