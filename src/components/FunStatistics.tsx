
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Star, Users, Trophy, Activity, Zap, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  // Calculate power rankings with meaningful data and real trends
  const calculatePowerRankings = () => {
    const allPoints = rosters.map(r => r.settings?.fpts || 0);
    const maxPoints = Math.max(...allPoints);
    const avgPoints = allPoints.reduce((sum, p) => sum + p, 0) / allPoints.length;
    
    return rosters
      .map(roster => {
        const user = userMap[roster.owner_id];
        const wins = roster.settings?.wins || 0;
        const losses = roster.settings?.losses || 0;
        const points = roster.settings?.fpts || 0;
        const gamesPlayed = wins + losses;
        const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;
        
        // Improved power score: balanced formula with normalized components
        const normalizedWinPct = winPct; // Already 0-1
        const normalizedPoints = maxPoints > 0 ? points / maxPoints : 0;
        const powerScore = (normalizedWinPct * 0.65) + (normalizedPoints * 0.35);
        
        // Calculate real trend based on streak data
        const streakData = roster.metadata?.streak || '';
        let trend = 'neutral';
        if (streakData) {
          const match = streakData.match(/^(\d+)([WL])$/);
          if (match) {
            const streakCount = parseInt(match[1], 10);
            const streakType = match[2];
            if (streakType === 'W' && streakCount >= 2) trend = 'up';
            else if (streakType === 'L' && streakCount >= 2) trend = 'down';
          }
        }
        
        return {
          rosterId: roster.roster_id,
          teamName: user?.metadata?.team_name || user?.display_name || 'Unknown Team',
          user,
          powerScore,
          wins,
          losses,
          points,
          winPct,
          pointsVsAvg: points - avgPoints,
          trend,
          gamesPlayed
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
      <Card className="transition-all duration-150 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Power Rankings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {powerRankings.slice(0, 8).map((team, index) => (
              <div key={team.rosterId} className="p-5 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-150 hover:bg-card/70 hover:shadow-lg ">
                {!isMobile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="relative">
                        <Avatar className={`w-12 h-12 transition-all duration-150 ${
                          index === 0 ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-background' : 
                          index === 1 ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-background' :
                          index === 2 ? 'ring-2 ring-amber-600 ring-offset-2 ring-offset-background' : ''
                        }`}>
                          <AvatarImage 
                            src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                            alt={`${team.teamName} avatar`}
                          />
                          <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                            {team.teamName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 shadow-lg ${
                          index === 0 ? 'bg-yellow-500 text-black' : 
                          index === 1 ? 'bg-slate-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-lg truncate">{team.teamName}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-3">
                          <span className="font-medium">{team.wins}-{team.losses}</span>
                          <span>•</span>
                          <span>{team.points.toFixed(2)} pts</span>
                          <span>•</span>
                          <span className={team.pointsVsAvg >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {team.pointsVsAvg >= 0 ? '+' : ''}{team.pointsVsAvg.toFixed(2)} vs avg
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground">
                          {(team.winPct * 100).toFixed(0)}% Win Rate
                        </div>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                            style={{ width: `${team.winPct * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="transition-colors duration-150">
                        {team.trend === 'up' ? (
                          <TrendingUp className="w-6 h-6 text-green-400" />
                        ) : team.trend === 'down' ? (
                          <TrendingDown className="w-6 h-6 text-red-400" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="relative">
                          <Avatar className={`w-12 h-12 transition-all duration-150 ${
                            index === 0 ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-background' : 
                            index === 1 ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-background' :
                            index === 2 ? 'ring-2 ring-amber-600 ring-offset-2 ring-offset-background' : ''
                          }`}>
                            <AvatarImage 
                              src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                              alt={`${team.teamName} avatar`}
                            />
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                              {team.teamName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 shadow-lg ${
                            index === 0 ? 'bg-yellow-500 text-black' : 
                            index === 1 ? 'bg-slate-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 max-w-[180px] overflow-hidden">
                          <div className="font-semibold text-foreground text-base truncate">{team.teamName}</div>
                          <div className="text-xs text-muted-foreground overflow-hidden">
                            <div className="flex items-center space-x-2 truncate">
                              <span className="font-medium">{team.wins}-{team.losses}</span>
                              <span>•</span>
                              <span className="truncate">{team.points.toFixed(2)}pts</span>
                              <span>•</span>
                              <span className={`truncate ${team.pointsVsAvg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {team.pointsVsAvg >= 0 ? '+' : ''}{team.pointsVsAvg.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="transition-colors duration-150">
                        {team.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : team.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-16">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Win Rate</span>
                        <span className="text-xs font-semibold">{(team.winPct * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                          style={{ width: `${team.winPct * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hot & Cold Streaks */}
      <Card className="transition-all duration-150 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg">Team Streaks</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-green-400 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Hot Teams</span>
              </h4>
              <div className="space-y-3">
                {streaks.filter(team => team.isHot).slice(0, 4).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 backdrop-blur-sm transition-all duration-150 hover:from-green-500/20 hover:to-emerald-500/20 ">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 ring-2 ring-green-400/50 flex-shrink-0">
                        <AvatarImage 
                          src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                          alt={`${team.teamName} avatar`}
                        />
                        <AvatarFallback className="text-sm bg-green-500/20 text-green-400 font-semibold">
                          {team.teamName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground font-medium text-sm truncate max-w-[120px]">{team.teamName}</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-400/50 font-semibold">
                      {team.streak}W Streak
                    </Badge>
                  </div>
                ))}
                {streaks.filter(team => team.isHot).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No hot streaks yet
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-red-400 mb-4 flex items-center space-x-2">
                <TrendingDown className="w-4 h-4" />
                <span>Cold Teams</span>
              </h4>
              <div className="space-y-3">
                {streaks.filter(team => team.isCold).slice(0, 4).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-xl border border-red-500/30 backdrop-blur-sm transition-all duration-150 hover:from-red-500/20 hover:to-pink-500/20 ">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="w-10 h-10 ring-2 ring-red-400/50 flex-shrink-0">
                        <AvatarImage 
                          src={team.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${team.user.avatar}` : undefined}
                          alt={`${team.teamName} avatar`}
                        />
                        <AvatarFallback className="text-sm bg-red-500/20 text-red-400 font-semibold">
                          {team.teamName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground font-medium text-sm truncate max-w-[120px]">{team.teamName}</span>
                    </div>
                    <Badge className="bg-red-500/20 text-red-400 border-red-400/50 font-semibold">
                      {team.streak}L Streak
                    </Badge>
                  </div>
                ))}
                {streaks.filter(team => team.isCold).length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    No cold streaks yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Activity */}
      <Card className="transition-all duration-150 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Manager Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activity.slice(0, 8).map((manager, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50 transition-all duration-150 hover:bg-card/70 hover:shadow-lg ">
                <div className="flex items-center space-x-4 flex-1 min-w-0 overflow-hidden">
                  <Avatar className="w-11 h-11 transition-all duration-150  flex-shrink-0">
                    <AvatarImage 
                      src={manager.user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${manager.user.avatar}` : undefined}
                      alt={`${manager.teamName} avatar`}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                      {manager.teamName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 max-w-[160px]">
                    <div className="font-semibold text-foreground text-sm truncate">{manager.teamName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {manager.transactionCount} moves
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-2 transition-all duration-150 ${getActivityColor(manager.activityLevel)}`}>
                    <div className="transition-colors duration-150">
                      {getActivityIcon(manager.activityLevel)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getActivityColor(manager.activityLevel)} border-current font-semibold`}
                    >
                      {manager.activityLevel.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* League Insights */}
      <Card className="transition-all duration-150 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">League Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20 transition-all duration-150 hover:from-yellow-500/20 hover:to-orange-500/20 ">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {Math.max(...rosters.map(r => r.settings?.fpts || 0)).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Highest Score</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20 transition-all duration-150 hover:from-blue-500/20 hover:to-cyan-500/20 ">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {transactions.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Total Moves</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20 transition-all duration-150 hover:from-green-500/20 hover:to-emerald-500/20 ">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {rosters.reduce((sum, r) => sum + (r.settings?.wins || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Total Wins</div>
            </div>
            <div className="text-center p-4 md:p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20 transition-all duration-150 hover:from-purple-500/20 hover:to-pink-500/20 ">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {league?.settings?.leg || 1}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Current Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunStatistics;
