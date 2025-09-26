import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getTeamName } from '@/utils/leagueDataUtils';
import { MatchupDetailsModal } from './MatchupDetailsModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExpandableMatchupCardProps {
  matchupId: string;
  team1: any;
  team2: any;
  roster1: any;
  roster2: any;
  user1: any;
  user2: any;
  players: Record<string, any>;
  formatPoints: (points: number) => string;
  getTeamRecord: (roster: any) => string;
}

export const ExpandableMatchupCard: React.FC<ExpandableMatchupCardProps> = ({
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const isMobile = useIsMobile();
  
  const team1Winning = team1.points > team2.points;

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowModal(true);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <Card 
        className={`bg-card/50 border border-border/50 transition-all duration-300 cursor-pointer group touch-manipulation ${
          isMobile 
            ? 'hover:bg-card/80 active:bg-card active:scale-[0.98]' 
            : 'hover:bg-card/80 hover:border-border hover:scale-[1.02]'
        }`}
        onClick={handleCardClick}
      >
        <CardContent className={`${isMobile ? 'p-4' : 'p-4 md:p-6'}`}>
          <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0'}`}>
            <div className={`flex-1 text-center transition-all duration-300 ${team1Winning && !isMobile ? 'transform scale-105' : ''} min-w-0`}>
              <div className="flex flex-col items-center space-y-2 mb-3">
                <Avatar className={`transition-all duration-300 ${team1Winning ? 'scale-110 ring-2 ring-primary' : ''}`}>
                  <AvatarImage 
                    src={user1?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user1.avatar}` : undefined}
                    alt={`${getTeamName(user1)} avatar`}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary-foreground">
                    {getTeamName(user1).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`font-medium ${team1Winning ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-300 truncate`}>
                  {getTeamName(user1)}
                </div>
                <div className="text-sm text-muted-foreground transition-colors duration-200">
                  {getTeamRecord(roster1)}
                </div>
              </div>
              <div className={`text-2xl font-bold transition-all duration-300 ${team1Winning ? 'text-primary scale-110' : 'text-foreground'}`}>
                {formatPoints(team1.points)}
              </div>
            </div>
           
            <div className="md:px-6 flex justify-center">
              <div className="text-center text-muted-foreground text-sm font-medium bg-card/50 rounded-full px-3 py-1 md:bg-transparent md:px-0 md:py-0">
                VS
              </div>
            </div>
           
            <div className={`flex-1 text-center transition-all duration-300 ${!team1Winning && !isMobile ? 'transform scale-105' : ''} min-w-0`}>
              <div className="flex flex-col items-center space-y-2 mb-3">
                <Avatar className={`transition-all duration-300 ${!team1Winning ? 'scale-110 ring-2 ring-primary' : ''}`}>
                  <AvatarImage 
                    src={user2?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user2.avatar}` : undefined}
                    alt={`${getTeamName(user2)} avatar`}
                  />
                  <AvatarFallback className="bg-primary/20 text-primary-foreground">
                    {getTeamName(user2).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`font-medium ${!team1Winning ? 'text-primary' : 'text-muted-foreground'} transition-colors duration-300 truncate`}>
                  {getTeamName(user2)}
                </div>
                <div className="text-sm text-muted-foreground transition-colors duration-200">
                  {getTeamRecord(roster2)}
                </div>
              </div>
              <div className={`text-2xl font-bold transition-all duration-300 ${!team1Winning ? 'text-primary scale-110' : 'text-foreground'}`}>
                {formatPoints(team2.points)}
              </div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleExpandClick}
              className={`flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 group-hover:text-primary touch-manipulation ${
                isMobile ? 'min-h-[44px] px-4 py-2' : ''
              }`}
            >
              <span>Click for details</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Preview - shown when expanded */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border/50 animate-fade-in">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground mb-1">{getTeamName(user1)} Starters</p>
                  <p className="text-muted-foreground">{team1.starters?.length || 0} players started</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">{getTeamName(user2)} Starters</p>
                  <p className="text-muted-foreground">{team2.starters?.length || 0} players started</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MatchupDetailsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        matchupId={matchupId}
        team1={team1}
        team2={team2}
        roster1={roster1}
        roster2={roster2}
        user1={user1}
        user2={user2}
        players={players}
        formatPoints={formatPoints}
        getTeamRecord={getTeamRecord}
      />
    </>
  );
};