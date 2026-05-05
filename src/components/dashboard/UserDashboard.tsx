
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Clock, Users, Calendar, ExternalLink, Plus, Search } from 'lucide-react';
import { useUserLeagues } from '@/hooks/useUserLeagues';
import { useSleeperUser } from '@/hooks/useSleeperUser';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import SleeperUsernameForm from '@/components/SleeperUsernameForm';
import SleeperLeaguesList from '@/components/SleeperLeaguesList';
import WhatsNewModal from '@/components/WhatsNewModal';

interface UserDashboardProps {
  onSelectLeague: (leagueId: string) => void;
  onConnectLeague?: () => void;
  showConnectionForm?: boolean;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onSelectLeague, 
  onConnectLeague,
  showConnectionForm = false 
}) => {
  const { ownedLeagues, recentLeagues, loading } = useUserLeagues();
  const { sleeperUser } = useSleeperUser();
  
  // Check if user has any meaningful data to show
  const hasData = ownedLeagues.length > 0 || recentLeagues.length > 0 || sleeperUser;

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

  // Show connection form if user has no data and showConnectionForm is true
  if (!hasData && showConnectionForm) {
    return (
      <div className="space-y-6">
        {/* What's New Modal */}
        <WhatsNewModal />
        
        {/* Welcome message for new authenticated users */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="text-center pb-3">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Search className="w-5 h-5 text-primary" />
              <span>Welcome! Let's Connect Your League</span>
            </CardTitle>
            <CardDescription>
              You're signed in! Now connect to your fantasy football league to start managing salaries and contracts.
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Sleeper Account Configuration for new users */}
        <SleeperUsernameForm />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* What's New Modal */}
      <WhatsNewModal />

      {/* Connect New League Button (always visible) */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={onConnectLeague}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Connect New League</span>
        </Button>
      </div>

      {/* Sleeper Account Configuration */}
      <SleeperUsernameForm />

      {/* Sleeper Leagues */}
      {sleeperUser && <SleeperLeaguesList onSelectLeague={onSelectLeague} />}

      {/* Owned Leagues */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <Trophy className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="truncate">Owned Leagues</span>
            <Badge variant="secondary" className="text-xs">{ownedLeagues.length}</Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Leagues you have claimed ownership of in this app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownedLeagues.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm sm:text-base">No owned leagues yet</p>
              <p className="text-xs sm:text-sm mb-4">Claim a league to start managing it</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onConnectLeague}
                className="flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Your First League</span>
              </Button>
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
              {recentLeagues.map((league) => (
                <Button
                  key={league.leagueId}
                  variant="outline"
                  className="justify-between min-h-[44px] text-left"
                  onClick={() => onSelectLeague(league.leagueId)}
                >
                  <span className="font-medium text-sm truncate">{league.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{league.season}</span>
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
