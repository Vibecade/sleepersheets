
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
  teamFAAB?: number;
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
  teamFAAB = 0,
  showFAAB = false
}) => {
  const playerCounts = getPlayerCount(roster);
  const teamName = getTeamName(user);

  return (
    <div className="glass-card rounded-lg p-3 sm:p-4 space-y-3 hover-lift">
      <div className="flex items-center space-x-3">
        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
          <AvatarImage 
            src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined} 
            alt={`${teamName} avatar`}
          />
          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold text-sm">
            {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate text-base sm:text-lg leading-tight">{teamName}</h4>
          <p className="text-sm text-gray-300 truncate mt-0.5">{user?.display_name || 'Unknown Manager'}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <span className="text-gray-300 text-sm">Record:</span>
            <Badge variant="outline" className="text-white border-white/20 text-sm w-fit mt-1 sm:mt-0">
              {roster.settings?.wins || 0}-{roster.settings?.losses || 0}-{roster.settings?.ties || 0}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <span className="text-gray-300 text-sm">Points:</span>
            <span className="font-medium text-emerald-400 text-sm sm:text-base mt-1 sm:mt-0">
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

        {showSalaryFeatures && showFAAB && (
          <TeamFAABDisplay
            teamFAAB={teamFAAB}
            showFAAB={showFAAB}
          />
        )}
        
        <Separator className="bg-white/10" />
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-300">Active:</span>
              <span className="font-medium text-white">{playerCounts.active}</span>
            </div>
            {playerCounts.taxi > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-300">Taxi:</span>
                <span className="font-medium text-white">{playerCounts.taxi}</span>
              </div>
            )}
          </div>
          {playerCounts.reserve > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Reserve:</span>
              <span className="font-medium text-white">{playerCounts.reserve}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-medium border-t border-white/10 pt-2">
            <span className="text-gray-200">Total:</span>
            <span className="text-emerald-400 font-semibold">{playerCounts.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRosterCard;
