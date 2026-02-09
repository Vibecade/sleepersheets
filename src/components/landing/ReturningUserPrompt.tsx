import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Clock, Trophy, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentLeague {
  leagueId: string;
  name: string;
  season: string;
  totalRosters: number;
  lastAccessed: string;
}

interface ReturningUserPromptProps {
  recentLeagues: RecentLeague[];
  onSelectLeague: (leagueId: string) => void;
  onConnectNew: () => void;
}

const ReturningUserPrompt: React.FC<ReturningUserPromptProps> = ({
  recentLeagues,
  onSelectLeague,
  onConnectNew,
}) => {
  if (recentLeagues.length === 0) return null;

  const mostRecent = recentLeagues[0];
  const otherRecent = recentLeagues.slice(1, 3);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-lg mb-8">
      <CardContent className="pt-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Welcome message and primary action */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Welcome back!</h2>
            </div>
            
            <Button
              size="lg"
              onClick={() => onSelectLeague(mostRecent.leagueId)}
              className="w-full sm:w-auto group"
            >
              <span>Continue to {mostRecent.name}</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last accessed {formatDistanceToNow(new Date(mostRecent.lastAccessed))} ago
              <span className="mx-1">•</span>
              <Trophy className="w-3 h-3" />
              {mostRecent.season} • {mostRecent.totalRosters} teams
            </p>
          </div>

          {/* Other recent leagues */}
          {otherRecent.length > 0 && (
            <div className="flex flex-col gap-2 lg:border-l lg:border-border/50 lg:pl-4">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Other leagues</span>
              <div className="flex flex-wrap gap-2">
                {otherRecent.map((league) => (
                  <Button
                    key={league.leagueId}
                    variant="outline"
                    size="sm"
                    onClick={() => onSelectLeague(league.leagueId)}
                    className="text-xs"
                  >
                    {league.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Connect new league */}
          <div className="lg:border-l lg:border-border/50 lg:pl-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onConnectNew}
              className="text-muted-foreground hover:text-foreground"
            >
              + Connect different league
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReturningUserPrompt;
