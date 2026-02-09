import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import { useLeagueData } from '@/components/LeagueDataProvider';
import SalaryDistributionChart from '@/components/analytics/SalaryDistributionChart';
import TransactionActivityChart from '@/components/analytics/TransactionActivityChart';
import PositionValueChart from '@/components/analytics/PositionValueChart';
import LeagueMetricsCards from '@/components/analytics/LeagueMetricsCards';
import TeamPerformanceChart from '@/components/analytics/TeamPerformanceChart';
import PlayerAcquisitionChart from '@/components/analytics/PlayerAcquisitionChart';

export const AnalyticsView: React.FC = () => {
  const { league, rosters, userMap, players, transactions } = useLeagueData();
  const users = Object.values(userMap);
  const leagueId = league.league_id;

  return (
    <div className="main-container">
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">League Analytics</h1>
            <p className="text-muted-foreground">
              Deep dive into your league's performance, trends, and key metrics
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <LeagueMetricsCards 
            rosters={rosters}
            users={users}
            players={players}
            transactions={transactions}
            leagueId={leagueId}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Salary Distribution</CardTitle>
                </div>
              </CardHeader>
              <SalaryDistributionChart 
                rosters={rosters}
                users={users}
                players={players}
                leagueId={leagueId}
                transactions={transactions}
              />
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Transaction Activity</CardTitle>
                </div>
              </CardHeader>
              <TransactionActivityChart 
                transactions={transactions}
                users={users}
              />
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Position Value Analysis</CardTitle>
                </div>
              </CardHeader>
              <PositionValueChart 
                rosters={rosters}
                players={players}
                leagueId={leagueId}
              />
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Team Performance</CardTitle>
                </div>
              </CardHeader>
              <TeamPerformanceChart 
                rosters={rosters}
                users={users}
                players={players}
                transactions={transactions}
                leagueId={leagueId}
              />
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Player Acquisition Trends</CardTitle>
                </div>
              </CardHeader>
              <PlayerAcquisitionChart 
                transactions={transactions}
                players={players}
                users={users}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};