
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';
import { getPlayerCount, getTeamName } from '@/utils/leagueDataUtils';

interface TeamRostersProps {
  rosters: any[];
  userMap: Record<string, any>;
}

const TeamRosters: React.FC<TeamRostersProps> = ({ rosters, userMap }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Team Rosters</span>
        </CardTitle>
        <CardDescription>
          Overview of all teams and their current roster sizes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rosters.map((roster) => {
            const user = userMap[roster.owner_id];
            const playerCounts = getPlayerCount(roster);
            const teamName = getTeamName(user);
            
            return (
              <div key={roster.roster_id} className="glass-card rounded-lg p-4 space-y-3 hover-lift">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined} 
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold">
                      {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white truncate">{teamName}</h4>
                    <p className="text-sm text-gray-300 truncate">{user?.display_name || 'Unknown Manager'}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Record:</span>
                    <Badge variant="outline" className="text-white border-white/20">
                      {roster.settings?.wins || 0}-{roster.settings?.losses || 0}-{roster.settings?.ties || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Points:</span>
                    <span className="font-medium text-emerald-400">{roster.settings?.fpts?.toFixed(1) || '0.0'}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Active:</span>
                      <span className="font-medium text-white">{playerCounts.active}</span>
                    </div>
                    {playerCounts.taxi > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Taxi:</span>
                        <span className="font-medium text-white">{playerCounts.taxi}</span>
                      </div>
                    )}
                    {playerCounts.reserve > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Reserve:</span>
                        <span className="font-medium text-white">{playerCounts.reserve}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium border-t border-white/10 pt-1">
                      <span className="text-gray-200">Total:</span>
                      <span className="text-emerald-400">{playerCounts.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamRosters;
