import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';
import FunStatistics from '../FunStatistics';
import PlayerNewsFeed from '../PlayerNewsFeed';
import GamificationHub from '../GamificationHub';

interface StatisticsTabProps {
  league: any;
  rosters: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
  transactions: any[];
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({
  league,
  rosters,
  players,
  userMap,
  transactions,
}) => {
  return (
    <Card className="transition-all duration-150 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <CardTitle className="text-base sm:text-lg">News</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh] md:h-[62vh] w-full">
          <div className="space-y-5 p-4 sm:p-5">
            <GamificationHub
              league={league}
              rosters={rosters}
              players={players}
              userMap={userMap}
              transactions={transactions}
            />
            <PlayerNewsFeed />
            <FunStatistics
              league={league}
              rosters={rosters}
              players={players}
              userMap={userMap}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default StatisticsTab;
