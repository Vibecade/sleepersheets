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
import PageHead from '@/components/PageHead';

const Analytics: React.FC = () => {
  const { league, rosters, users, players, transactions, stats } = useLeagueData();

  return (
    <div className="main-container">
      <PageHead
        title="League Analytics"
        description={`Advanced analytics and insights for ${league.name} - salary cap trends, trade patterns, and league performance metrics.`}
        leagueName={league.name}
      />
      
      <div className="space-y-8">
        {/* Page Header */}
        <div className="slide-up">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                <div>
                  <CardTitle className="text-2xl">League Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Comprehensive insights into salary distribution, trade patterns, and league performance metrics
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Key Metrics Cards */}
        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <LeagueMetricsCards 
            rosters={rosters}
            users={users}
            players={players}
            transactions={transactions}
            leagueId={league.league_id}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Salary Distribution */}
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <SalaryDistributionChart 
              rosters={rosters}
              users={users}
              players={players}
              leagueId={league.league_id}
              transactions={transactions}
            />
          </div>

          {/* Transaction Activity */}
          <div className="slide-up" style={{ animationDelay: '0.3s' }}>
            <TransactionActivityChart 
              transactions={transactions}
              users={users}
            />
          </div>

          {/* Position Value Analysis */}
          <div className="slide-up" style={{ animationDelay: '0.4s' }}>
            <PositionValueChart 
              rosters={rosters}
              players={players}
              leagueId={league.league_id}
            />
          </div>

          {/* Team Performance Metrics */}
          <div className="slide-up" style={{ animationDelay: '0.5s' }}>
            <TeamPerformanceChart 
              rosters={rosters}
              users={users}
              players={players}
              leagueId={league.league_id}
              transactions={transactions}
            />
          </div>
        </div>

        {/* Full Width Charts */}
        <div className="space-y-6">
          {/* Player Acquisition Trends */}
          <div className="slide-up" style={{ animationDelay: '0.6s' }}>
            <PlayerAcquisitionChart 
              transactions={transactions}
              players={players}
              users={users}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;