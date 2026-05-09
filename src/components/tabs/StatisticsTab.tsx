import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Newspaper } from 'lucide-react';
import FunStatistics from '../FunStatistics';
import PlayerNewsFeed from '../PlayerNewsFeed';
import LeagueAtAGlance from './LeagueAtAGlance';

interface StatisticsTabProps {
  league: any;
  rosters: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
  transactions?: any[];
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({
  league,
  rosters,
  players,
  userMap,
  transactions = [],
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <CardTitle className="text-base sm:text-lg">League Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh] md:h-[62vh] w-full">
          <div className="space-y-5 p-4 sm:p-5">
            {/* League data first — anchors the tab even in the offseason. */}
            <LeagueAtAGlance
              league={league}
              rosters={rosters}
              transactions={transactions}
            />

            <FunStatistics
              league={league}
              rosters={rosters}
              players={players}
              userMap={userMap}
              transactions={transactions}
            />

            {/* News & updates pushed to its own labeled section so the tab
                title ("League Statistics") matches what's at the top. */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                <Newspaper className="w-4 h-4" />
                News &amp; Updates
              </div>
              <PlayerNewsFeed />
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StatisticsTab;
