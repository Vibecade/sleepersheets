import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import TeamEfficiencyChart from '@/components/analytics/TeamEfficiencyChart';
import TransactionActivityChart from '@/components/analytics/TransactionActivityChart';
import PositionValueChart from '@/components/analytics/PositionValueChart';
import LeagueMetricsCards from '@/components/analytics/LeagueMetricsCards';
import TeamPerformanceChart from '@/components/analytics/TeamPerformanceChart';
import PlayerAcquisitionChart from '@/components/analytics/PlayerAcquisitionChart';

interface AnalyticsAccordionContentProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  transactions: any[];
  leagueId: string;
}

const AnalyticsAccordionContent: React.FC<AnalyticsAccordionContentProps> = ({
  rosters,
  users,
  players,
  transactions,
  leagueId,
}) => {
  return (
    <div className="space-y-4">
      <LeagueMetricsCards
        rosters={rosters}
        users={users}
        players={players}
        transactions={transactions}
        leagueId={leagueId}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Team Efficiency Analysis</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <TeamEfficiencyChart
              rosters={rosters}
              users={users}
              players={players}
              leagueId={leagueId}
              transactions={transactions}
            />
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Transaction Activity</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <TransactionActivityChart
              transactions={transactions}
              users={users}
            />
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Position Value Analysis</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <PositionValueChart
              rosters={rosters}
              players={players}
              leagueId={leagueId}
            />
          </div>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Team Performance</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <TeamPerformanceChart
              rosters={rosters}
              users={users}
              players={players}
              transactions={transactions}
              leagueId={leagueId}
            />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Player Acquisition Trends</CardTitle>
            </div>
          </CardHeader>
          <div className="px-6 pb-6">
            <PlayerAcquisitionChart
              transactions={transactions}
              players={players}
              users={users}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsAccordionContent;
