import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Users, Calendar, ExternalLink } from 'lucide-react';
import { useSleeperUser } from '@/hooks/useSleeperUser';
import { Skeleton } from '@/components/ui/skeleton';

interface SleeperLeaguesListProps {
  onSelectLeague: (leagueId: string) => void;
}

const SleeperLeaguesList: React.FC<SleeperLeaguesListProps> = ({ onSelectLeague }) => {
  const { sleeperLeagues, loading, sleeperUser } = useSleeperUser();

  if (!sleeperUser) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-purple-500" />
            <span>Your Sleeper Leagues</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-lg border p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <Trophy className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <span className="truncate">Your Sleeper Leagues</span>
          <Badge variant="secondary" className="text-xs">{sleeperLeagues.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sleeperLeagues.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No leagues found</p>
            <p className="text-sm">You might not be in any leagues for recent seasons</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sleeperLeagues.map((league) => (
              <div
                key={league.league_id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    {league.avatar ? (
                      <AvatarImage 
                        src={`https://sleepercdn.com/avatars/thumbs/${league.avatar}`} 
                        alt={league.name}
                      />
                    ) : null}
                    <AvatarFallback>
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h3 className="font-medium text-white text-sm sm:text-base truncate">
                        {league.name}
                      </h3>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            league.season === new Date().getFullYear().toString()
                              ? 'text-green-400 border-green-400'
                              : 'text-gray-400 border-gray-400'
                          }`}
                        >
                          {league.season}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            league.status === 'in_season'
                              ? 'text-blue-400 border-blue-400'
                              : league.status === 'complete'
                              ? 'text-gray-400 border-gray-400'
                              : 'text-yellow-400 border-yellow-400'
                          }`}
                        >
                          {league.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3 flex-shrink-0" />
                        <span>{league.total_rosters} teams</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{league.season_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectLeague(league.league_id)}
                  className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-[44px] sm:min-h-0"
                >
                  <span className="text-sm">Open</span>
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SleeperLeaguesList;
