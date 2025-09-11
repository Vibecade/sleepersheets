import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Users, Calendar } from 'lucide-react';
import type { SleeperLeague } from '@/types/sleeper';

interface SleeperLeagueGridProps {
  leagues: SleeperLeague[];
  onSelectLeague: (leagueId: string) => void;
  loading?: boolean;
}

export const SleeperLeagueGrid: React.FC<SleeperLeagueGridProps> = ({
  leagues,
  onSelectLeague,
  loading = false
}) => {
  const getStatusBadge = (league: SleeperLeague) => {
    const currentYear = new Date().getFullYear();
    const isCurrentYear = league.season === currentYear.toString();
    
    if (league.status === 'complete') {
      return (
        <Badge variant="secondary" className="bg-gray-500/20 text-gray-400 border-gray-500/20">
          Complete
        </Badge>
      );
    } else if (league.status === 'in_season' || league.status === 'drafting') {
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/20">
          In Season
        </Badge>
      );
    } else if (league.status === 'pre_draft') {
      return (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/20">
          Pre-Draft
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
        {league.status}
      </Badge>
    );
  };

  if (leagues.length === 0) {
    return (
      <Card className="border-yellow-500/20">
        <CardContent className="pt-6 text-center">
          <div className="text-muted-foreground mb-4">
            No NFL leagues found for the current season
          </div>
          <p className="text-sm text-muted-foreground">
            Make sure you have joined NFL leagues in Sleeper
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">YOUR SLEEPER LEAGUES</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {leagues.map((league) => (
          <Card 
            key={league.league_id} 
            className="border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-200 group"
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <Trophy className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-white truncate" title={league.name}>
                      {league.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{league.season}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(league)}
              </div>
              
              <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{league.total_rosters} teams</span>
                </div>
                {league.settings?.type && (
                  <div className="capitalize">
                    {league.settings.type}
                  </div>
                )}
              </div>
              
              <Button
                onClick={() => onSelectLeague(league.league_id)}
                disabled={loading}
                size="mobile"
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-semibold group-hover:shadow-lg group-hover:shadow-yellow-500/25 transition-all duration-200 mobile-text-wrap"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  'OPEN'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};