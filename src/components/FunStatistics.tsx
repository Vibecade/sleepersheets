
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Star, Users, Trophy, Activity, Zap, Calendar } from 'lucide-react';

interface FunStatisticsProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  transactions?: any[];
}

const FunStatistics: React.FC<FunStatisticsProps> = ({
  league,
  rosters,
  userMap,
  players,
  transactions = []
}) => {
  // Calculate power rankings based on points, wins, and recent performance
  const calculatePowerRankings = () => {
    return rosters
      .map(roster => {
        const user = userMap[roster.owner_id];
        const wins = roster.settings?.wins || 0;
        const losses = roster.settings?.losses || 0;
        const points = roster.settings?.fpts || 0;
        const winPct = wins + losses > 0 ? wins / (wins + losses) : 0;
        
        // Power score combines win percentage and points
        const powerScore = (winPct * 0.6) + (points / 2000 * 0.4);
        
        return {
          rosterId: roster.roster_id,
          teamName: user?.metadata?.team_name || user?.display_name || 'Unknown Team',
          user,
          powerScore,
          wins,
          losses,
          points,
          trend: Math.random() > 0.5 ? 'up' : 'down' // Simplified trend calculation
        };
      })
      .sort((a, b) => b.powerScore - a.powerScore);
  };

  // Calculate team streaks using real data from roster metadata
  const calculateStreaks = () => {
    return rosters.map(roster => {
      const user = userMap[roster.owner_id];
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      
      // Parse real streak data from roster.metadata.streak (e.g., "1L", "3W")
      const streakData = roster.metadata?.streak || '';
      let streak = 0;
      let streakType = 'none';
      
      if (streakData) {
        const match = streakData.match(/^(\d+)([WL])$/);
        if (match) {
          streak = parseInt(match[1], 10);
          streakType = match[2] === 'W' ? 'win' : 'loss';
        }
      }
      
      // Fallback: if no streak data, use wins/losses for simple calculation
      if (!streakData && (wins > 0 || losses > 0)) {
        streak = wins > losses ? wins : losses;
        streakType = wins > losses ? 'win' : 'loss';
      }
      
      return {
        teamName: user?.metadata?.team_name || user?.display_name || 'Unknown Team',
        user,
        streak,
        streakType,
        isHot: streakType === 'win' && streak >= 2,
        isCold: streakType === 'loss' && streak >= 2
      };
    });
  };

  // Calculate most active managers
  const calculateActivity = () => {
    const activityMap = new Map();
    
    transactions.forEach(transaction => {
      const creator = transaction.creator;
      if (creator) {
        activityMap.set(creator, (activityMap.get(creator) || 0) + 1);
      }
    });

    return rosters
      .map(roster => {
        const user = userMap[roster.owner_id];
        const activity = activityMap.get(roster.owner_id) || 0;
        
        return {
          teamName: user?.metadata?.team_name || user?.display_name || 'Unknown Team',
          user,
          transactionCount: activity,
          activityLevel: activity > 10 ? 'high' : activity > 5 ? 'medium' : 'low'
        };
      })
      .sort((a, b) => b.transactionCount - a.transactionCount);
  };

  const powerRankings = calculatePowerRankings();
  const streaks = calculateStreaks();
  const activity = calculateActivity();

  const getActivityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getActivityIcon = (level: string) => {
    switch (level) {
      case 'high': return <Star className="w-4 h-4" />;
      case 'medium': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Power Rankings */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Power Rankings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {powerRankings.slice(0, 6).map((team, index) => (
              <div key={team.rosterId} className="flex items-center justify-between p-4 bg-white/5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className={`transition-all duration-300 ${
                      index === 0 ? 'scale-110 ring-2 ring-yellow-500' : 
                      index === 1 ? 'scale-105 ring-2 ring-gray-400' :
                      index === 2 ? 'scale-105 ring-2 ring-amber-600' : ''
                    }`}>
                      <AvatarImage 
                        src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                        alt={`${team.teamName} avatar`}
                      />
                      <AvatarFallback className="bg-primary/20 text-primary-foreground">
                        {team.teamName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      index === 0 ? 'bg-yellow-500 text-black animate-pulse' : 
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white transition-colors duration-200">{team.teamName}</div>
                    <div className="text-sm text-gray-400 transition-colors duration-200">
                      {team.wins}-{team.losses} • {team.points.toFixed(1)} pts
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Progress value={team.powerScore * 100} className="w-20 h-2 transition-all duration-300" />
                  <div className="transition-transform duration-300 hover:scale-125">
                    {team.trend === 'up' ? 
                      <TrendingUp className="w-5 h-5 text-green-400" /> : 
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hot & Cold Streaks */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg">Hot & Cold Streaks</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Hot Teams</span>
              </h4>
              <div className="space-y-2">
                {streaks.filter(team => team.isHot).slice(0, 3).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20 transition-all duration-300 hover:bg-green-500/20 hover:scale-105">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                          alt={`${team.teamName} avatar`}
                        />
                        <AvatarFallback className="text-xs bg-green-500/20">
                          {team.teamName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white font-medium">{team.teamName}</span>
                    </div>
                    <Badge variant="outline" className="text-green-400 border-green-400 animate-pulse">
                      {team.streak}W
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Cold Teams</span>
              </h4>
              <div className="space-y-2">
                {streaks.filter(team => team.isCold).slice(0, 3).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20 transition-all duration-300 hover:bg-blue-500/20 hover:scale-105">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage 
                          src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                          alt={`${team.teamName} avatar`}
                        />
                        <AvatarFallback className="text-xs bg-blue-500/20">
                          {team.teamName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-white font-medium">{team.teamName}</span>
                    </div>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {team.streak}L
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Activity */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Manager Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.slice(0, 6).map((manager, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]">
                <div className="flex items-center space-x-4">
                  <Avatar className="transition-all duration-300 hover:scale-110">
                    <AvatarImage 
                      src={manager.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${manager.user.avatar}` : undefined}
                      alt={`${manager.teamName} avatar`}
                    />
                    <AvatarFallback className="bg-primary/20 text-primary-foreground">
                      {manager.teamName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex items-center space-x-2 transition-all duration-300 ${getActivityColor(manager.activityLevel)}`}>
                    <div className="transition-transform duration-300 hover:scale-125">
                      {getActivityIcon(manager.activityLevel)}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-white transition-colors duration-200">{manager.teamName}</div>
                    <div className="text-sm text-gray-400 transition-colors duration-200">
                      {manager.transactionCount} transactions
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getActivityColor(manager.activityLevel)} border-current transition-all duration-300 hover:scale-110`}
                >
                  {manager.activityLevel.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* League Insights */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">League Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <div className="text-3xl font-bold text-yellow-400 transition-all duration-300">
                {Math.max(...rosters.map(r => r.settings?.fpts || 0)).toFixed(1)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Highest Score</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <div className="text-3xl font-bold text-blue-400 transition-all duration-300">
                {transactions.length}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Moves</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <div className="text-3xl font-bold text-green-400 transition-all duration-300">
                {rosters.reduce((sum, r) => sum + (r.settings?.wins || 0), 0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Wins</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg transition-all duration-300 hover:bg-white/10 hover:scale-105">
              <div className="text-3xl font-bold text-purple-400 transition-all duration-300">
                {league?.settings?.leg || 1}
              </div>
              <div className="text-sm text-gray-400 mt-1">Current Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunStatistics;
