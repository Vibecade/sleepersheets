import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';
import FunStatistics from '../FunStatistics';
import PlayerNewsFeed from '../PlayerNewsFeed';

interface StatisticsTabProps {
  league: any;
  rosters: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
}

const StatisticsTab: React.FC<StatisticsTabProps> = ({
  league,
  rosters,
  players,
  userMap,
}) => {
  return (
<<<<<<< HEAD
    <Card className="transition-all duration-150 hover:shadow-lg">
      <CardHeader>
=======
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
>>>>>>> 9639500acfca1a9e0a83d6b073a9d2d3cb7e11b0
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4" />
          <CardTitle className="text-base sm:text-lg">League Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
<<<<<<< HEAD
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-6 space-y-6">
            <PlayerNewsFeed />
=======
        <ScrollArea className="h-[60vh] md:h-[62vh] w-full">
          <div className="p-4 sm:p-5">
>>>>>>> 9639500acfca1a9e0a83d6b073a9d2d3cb7e11b0
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
