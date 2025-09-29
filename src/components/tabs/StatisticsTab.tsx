import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity } from 'lucide-react';
import FunStatistics from '../FunStatistics';

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
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <CardTitle className="text-lg">League Statistics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[70vh] w-full">
          <div className="p-6">
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
