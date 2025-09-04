
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Calendar, ExternalLink } from 'lucide-react';
import { useUserLeagues } from '@/hooks/useUserLeagues';
import { useSleeperUser } from '@/hooks/useSleeperUser';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import SleeperUsernameForm from '@/components/SleeperUsernameForm';
import SleeperLeaguesList from '@/components/SleeperLeaguesList';

interface UserDashboardProps {
  onSelectLeague: (leagueId: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ onSelectLeague }) => {
  const { ownedLeagues, recentLeagues, loading } = useUserLeagues();
  const { sleeperUser } = useSleeperUser();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sleeper Account Configuration */}
      <SleeperUsernameForm />

      {/* Sleeper Leagues */}
      {sleeperUser && <SleeperLeaguesList onSelectLeague={onSelectLeague} />}

      {/* Owned Leagues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Owned Leagues</span>
            <Badge variant="secondary">{ownedLeagues.length}</Badge>
          </CardTitle>
          <CardDescription>
            Leagues you have claimed ownership of in this app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedLeagues.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No owned leagues yet</p>
              <p className="text-sm">Claim a league to start managing it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ownedLeagues.map((league) => (
                <div
                  key={league.league_id}
                  className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white">
                        {league.leagueData?.name || league.league_id}
                      </h3>
                      {league.leagueData && (
                        <Badge variant="outline">{league.leagueData.season}</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Claimed {formatDistanceToNow(new Date(league.claimed_at))} ago</span>
                      </div>
                      {league.leagueData && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{league.leagueData.total_rosters} teams</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSelectLeague(league.league_id)}
                    className="flex items-center space-x-1"
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

      {/* Recent Leagues */}
      {recentLeagues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Recent Leagues</span>
            </CardTitle>
            <CardDescription>
              Quickly access recently viewed leagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {recentLeagues.map((leagueId) => (
                <Button
                  key={leagueId}
                  variant="outline"
                  className="justify-start"
                  onClick={() => onSelectLeague(leagueId)}
                >
                  <span className="font-mono text-sm">{leagueId}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDashboard;
