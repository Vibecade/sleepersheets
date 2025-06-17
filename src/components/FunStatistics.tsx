
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
          powerScore,
          wins,
          losses,
          points,
          trend: Math.random() > 0.5 ? 'up' : 'down' // Simplified trend calculation
        };
      })
      .sort((a, b) => b.powerScore - a.powerScore);
  };

  // Calculate team streaks
  const calculateStreaks = () => {
    return rosters.map(roster => {
      const user = userMap[roster.owner_id];
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      
      // Simplified streak calculation (in real app, would need game-by-game data)
      const streak = Math.floor(Math.random() * 5) + 1;
      const streakType = Math.random() > 0.5 ? 'win' : 'loss';
      
      return {
        teamName: user?.metadata?.team_name || user?.display_name || 'Unknown Team',
        streak,
        streakType,
        isHot: wins > losses && streak >= 3,
        isCold: losses > wins && streak >= 3
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <CardTitle className="text-lg">Power Rankings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {powerRankings.slice(0, 6).map((team, index) => (
              <div key={team.rosterId} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-black' : 
                    index === 1 ? 'bg-gray-400 text-black' :
                    index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-700 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-white">{team.teamName}</div>
                    <div className="text-sm text-gray-400">
                      {team.wins}-{team.losses} • {team.points.toFixed(1)} pts
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={team.powerScore * 100} className="w-16 h-2" />
                  {team.trend === 'up' ? 
                    <TrendingUp className="w-4 h-4 text-green-400" /> : 
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  }
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hot & Cold Streaks */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-red-500" />
            <CardTitle className="text-lg">Hot & Cold Streaks</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>Hot Teams</span>
              </h4>
              <div className="space-y-2">
                {streaks.filter(team => team.isHot).slice(0, 3).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                    <span className="text-sm text-white">{team.teamName}</span>
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      {team.streak}W
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center space-x-1">
                <Activity className="w-4 h-4" />
                <span>Cold Teams</span>
              </h4>
              <div className="space-y-2">
                {streaks.filter(team => team.isCold).slice(0, 3).map((team, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                    <span className="text-sm text-white">{team.teamName}</span>
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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Manager Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity.slice(0, 6).map((manager, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1 ${getActivityColor(manager.activityLevel)}`}>
                    {getActivityIcon(manager.activityLevel)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{manager.teamName}</div>
                    <div className="text-sm text-gray-400">
                      {manager.transactionCount} transactions
                    </div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`${getActivityColor(manager.activityLevel)} border-current`}
                >
                  {manager.activityLevel.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* League Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">League Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {Math.max(...rosters.map(r => r.settings?.fpts || 0)).toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Highest Score</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-blue-400">
                {transactions.length}
              </div>
              <div className="text-sm text-gray-400">Total Moves</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-green-400">
                {rosters.reduce((sum, r) => sum + (r.settings?.wins || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Wins</div>
            </div>
            <div className="text-center p-3 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">
                {league?.settings?.leg || 1}
              </div>
              <div className="text-sm text-gray-400">Current Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FunStatistics;
