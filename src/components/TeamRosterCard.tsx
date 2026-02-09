import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getPlayerCount, getTeamName } from '@/utils/leagueDataUtils';
import TeamSalaryDisplay from './TeamSalaryDisplay';
import TeamFAABDisplay from './TeamFAABDisplay';

interface TeamRosterCardProps {
  roster: any;
  user: any;
  showSalaryFeatures: boolean;
  deadCapEnabled: boolean;
  teamSalary: number;
  teamDeadCap: number;
  salaryCap: number;
  teamFAAB?: { available: number; spent: number; total: number } | number;
  showFAAB?: boolean;
}

const TeamRosterCard: React.FC<TeamRosterCardProps> = ({
  roster,
  user,
  showSalaryFeatures,
  deadCapEnabled,
  teamSalary,
  teamDeadCap,
  salaryCap,
  teamFAAB = { available: 0, spent: 0, total: 0 },
  showFAAB = false
}) => {
  const playerCounts = getPlayerCount(roster);
  const teamName = getTeamName(user);

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5 lg:p-6 space-y-4 lg:space-y-5 card-hover desktop-card-hover border border-border-light bg-gradient-to-br from-card to-card-light">
      <div className="flex items-center space-x-4 lg:space-x-5">
        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all duration-200">
          <AvatarImage 
            src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined} 
            alt={`${teamName} avatar`}
            loading="lazy"
            decoding="async"
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-sm">
            {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground truncate text-lg sm:text-xl lg:text-2xl leading-tight">{teamName}</h4>
          <p className="text-sm lg:text-base text-muted-foreground truncate mt-1">{user?.display_name || 'Unknown Manager'}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/30 rounded-lg p-3 border border-border-light">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Record</span>
            <div className="mt-1">
              <Badge variant="outline" className="text-foreground border-border text-sm font-bold">
                {roster.settings?.wins || 0}-{roster.settings?.losses || 0}-{roster.settings?.ties || 0}
              </Badge>
            </div>
          </div>
          <div className="bg-success/10 rounded-lg p-3 border border-success/20">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Points</span>
            <div className="mt-1">
              <span className="font-bold text-success text-lg">
                {roster.settings?.fpts?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {showSalaryFeatures && (teamSalary > 0 || (deadCapEnabled && teamDeadCap > 0)) && (
          <TeamSalaryDisplay
            teamSalary={teamSalary}
            teamDeadCap={teamDeadCap}
            deadCapEnabled={deadCapEnabled}
            salaryCap={salaryCap}
            teamFAABSpent={typeof teamFAAB === 'object' ? teamFAAB.spent : 0}
          />
        )}

        {showSalaryFeatures && showFAAB && (
          <TeamFAABDisplay
            teamFAAB={teamFAAB}
            showFAAB={showFAAB}
          />
        )}
        
        <Separator className="bg-border-light" />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-accent/20 rounded-lg p-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Active</span>
              <span className="font-bold text-foreground">{playerCounts.active}</span>
            </div>
            {playerCounts.taxi > 0 && (
              <div className="bg-accent/20 rounded-lg p-2 flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Taxi</span>
                <span className="font-bold text-foreground">{playerCounts.taxi}</span>
              </div>
            )}
          </div>
          {playerCounts.reserve > 0 && (
            <div className="bg-accent/20 rounded-lg p-2 flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Reserve</span>
              <span className="font-bold text-foreground">{playerCounts.reserve}</span>
            </div>
          )}
          <div className="bg-primary/10 rounded-lg p-3 flex justify-between items-center border border-primary/20">
            <span className="text-foreground font-bold">Total Players</span>
            <span className="text-primary font-bold text-lg">{playerCounts.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRosterCard;