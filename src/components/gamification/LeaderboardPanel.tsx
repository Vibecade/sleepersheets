import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';

interface LeaderboardPanelProps {
  leagueId: string;
}

const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ leagueId }) => {
  const { leaderboard, userRank, loading } = useLeaderboard(leagueId);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold">{rank}</span>;
    }
  };
  
  const getRankClass = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-400 to-amber-600";
      case 2: return "bg-gradient-to-br from-gray-300 to-gray-400";
      case 3: return "bg-gradient-to-br from-amber-600 to-amber-700";
      default: return "bg-gray-700";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-2">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle>Manager Leaderboard</CardTitle>
            <CardDescription>
              Top managers ranked by achievements and activity
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-gray-800/50 animate-pulse rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4 mt-2"></div>
                </div>
                <div className="h-5 bg-gray-700 rounded w-12"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  user.isCurrentUser 
                    ? "bg-purple-900/30 border border-purple-500/30" 
                    : "bg-gray-800/50 hover:bg-gray-700/50"
                }`}
              >
                <div className={`w-8 h-8 ${getRankClass(index + 1)} rounded-full flex items-center justify-center text-white`}>
                  {getRankIcon(index + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-gray-700 text-gray-300">
                        {user.displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white truncate">{user.displayName}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-400">Level {user.level}</p>
                        {user.achievements > 0 && (
                          <Badge variant="outline" className="text-xs py-0 h-4">
                            <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                            {user.achievements}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-400">{user.points} XP</p>
                </div>
              </div>
            ))}
            
            {userRank && userRank > 5 && (
              <>
                <div className="flex justify-center">
                  <div className="w-1 h-6 border-l-2 border-dashed border-gray-600"></div>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-900/30 border border-purple-500/30">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white">
                    <span className="text-sm font-bold">{userRank}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <Avatar className="w-8 h-8 mr-2">
                        <AvatarImage src={leaderboard.find(u => u.isCurrentUser)?.avatarUrl} />
                        <AvatarFallback className="bg-gray-700 text-gray-300">
                          {leaderboard.find(u => u.isCurrentUser)?.displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white truncate">You</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-400">Level {leaderboard.find(u => u.isCurrentUser)?.level}</p>
                          <Badge variant="outline" className="text-xs py-0 h-4">
                            <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                            {leaderboard.find(u => u.isCurrentUser)?.achievements}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-400">{leaderboard.find(u => u.isCurrentUser)?.points} XP</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardPanel;