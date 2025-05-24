
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getPlayerCount, getTeamName } from '@/utils/leagueDataUtils';
import TeamSalaryDisplay from './TeamSalaryDisplay';

interface TeamRosterCardProps {
  roster: any;
  user: any;
  showSalaryFeatures: boolean;
  deadCapEnabled: boolean;
  teamSalary: number;
  teamDeadCap: number;
  salaryCap: number;
}

const TeamRosterCard: React.FC<TeamRosterCardProps> = ({
  roster,
  user,
  showSalaryFeatures,
  deadCapEnabled,
  teamSalary,
  teamDeadCap,
  salaryCap
}) => {
  const playerCounts = getPlayerCount(roster);
  const teamName = getTeamName(user);

  return (
    <div className="glass-card rounded-lg p-3 sm:p-4 space-y-3 hover-lift">
      <div className="flex items-center space-x-3">
        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
          <AvatarImage 
            src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined} 
          />
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold text-xs sm:text-sm">
            {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate text-sm sm:text-base">{teamName}</h4>
          <p className="text-xs sm:text-sm text-gray-300 truncate">{user?.display_name || 'Unknown Manager'}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Record:</span>
            <Badge variant="outline" className="text-white border-white/20 text-xs">
              {roster.settings?.wins || 0}-{roster.settings?.losses || 0}-{roster.settings?.ties || 0}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Points:</span>
            <span className="font-medium text-emerald-400 text-xs sm:text-sm">
              {roster.settings?.fpts?.toFixed(1) || '0.0'}
            </span>
          </div>
        </div>

        {showSalaryFeatures && (teamSalary > 0 || (deadCapEnabled && teamDeadCap > 0)) && (
          <TeamSalaryDisplay
            teamSalary={teamSalary}
            teamDeadCap={teamDeadCap}
            deadCapEnabled={deadCapEnabled}
            salaryCap={salaryCap}
          />
        )}
        
        <Separator className="bg-white/10" />
        <div className="space-y-1">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-gray-300">Active:</span>
            <span className="font-medium text-white">{playerCounts.active}</span>
          </div>
          {playerCounts.taxi > 0 && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-300">Taxi:</span>
              <span className="font-medium text-white">{playerCounts.taxi}</span>
            </div>
          )}
          {playerCounts.reserve > 0 && (
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-300">Reserve:</span>
              <span className="font-medium text-white">{playerCounts.reserve}</span>
            </div>
          )}
          <div className="flex justify-between text-xs sm:text-sm font-medium border-t border-white/10 pt-1">
            <span className="text-gray-200">Total:</span>
            <span className="text-emerald-400">{playerCounts.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRosterCard;
