import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Users, Calendar, ExternalLink, Loader2 } from 'lucide-react';
import { useSleeperUser } from '@/hooks/useSleeperUser';

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
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            <span className="ml-2 text-gray-400">Loading leagues...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-purple-500" />
          <span>Your Sleeper Leagues</span>
          <Badge variant="secondary">{sleeperLeagues.length}</Badge>
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
                className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <Avatar className="w-10 h-10">
                    {league.avatar ? (
                      <AvatarImage 
                        src={`https://sleepercdn.com/avatars/thumbs/${league.avatar}`} 
                        alt={league.name}
                      />
                    ) : null}
                    <AvatarFallback>
                      <Trophy className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white truncate">
                        {league.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={
                          league.season === new Date().getFullYear().toString()
                            ? 'text-green-400 border-green-400'
                            : 'text-gray-400 border-gray-400'
                        }
                      >
                        {league.season}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          league.status === 'in_season'
                            ? 'text-blue-400 border-blue-400'
                            : league.status === 'complete'
                            ? 'text-gray-400 border-gray-400'
                            : 'text-yellow-400 border-yellow-400'
                        }
                      >
                        {league.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{league.total_rosters} teams</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{league.season_type}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onSelectLeague(league.league_id)}
                  className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700"
                >
                  <span>Open</span>
                  <ExternalLink className="w-3 h-3" />
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