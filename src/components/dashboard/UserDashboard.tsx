
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
import WhatsNewModal from '@/components/WhatsNewModal';


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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* What's New Modal */}
      <WhatsNewModal />


      {/* Sleeper Account Configuration */}
      <SleeperUsernameForm />

      {/* Sleeper Leagues */}
      {sleeperUser && <SleeperLeaguesList onSelectLeague={onSelectLeague} />}

      {/* Owned Leagues */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <span className="truncate">Owned Leagues</span>
            <Badge variant="secondary" className="text-xs">{ownedLeagues.length}</Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Leagues you have claimed ownership of in this app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedLeagues.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-gray-400">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No owned leagues yet</p>
              <p className="text-xs sm:text-sm">Claim a league to start managing it</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ownedLeagues.map((league) => (
                <div
                  key={league.league_id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h3 className="font-medium text-white text-sm sm:text-base truncate">
                        {league.leagueData?.name || league.league_id}
                      </h3>
                      {league.leagueData && (
                        <Badge variant="outline" className="text-xs w-fit">{league.leagueData.season}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>Claimed {formatDistanceToNow(new Date(league.claimed_at))} ago</span>
                      </div>
                      {league.leagueData && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 flex-shrink-0" />
                          <span>{league.leagueData.total_rosters} teams</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onSelectLeague(league.league_id)}
                    className="flex items-center justify-center space-x-2 w-full sm:w-auto min-h-[44px] sm:min-h-0"
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

      {/* Recent Leagues */}
      {recentLeagues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="truncate">Recent Leagues</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Quickly access recently viewed leagues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {recentLeagues.map((leagueId) => (
                <Button
                  key={leagueId}
                  variant="outline"
                  className="justify-start min-h-[44px] text-left"
                  onClick={() => onSelectLeague(leagueId)}
                >
                  <span className="font-mono text-xs sm:text-sm truncate">{leagueId}</span>
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
