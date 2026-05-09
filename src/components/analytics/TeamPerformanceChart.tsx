import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { getTeamName } from '@/utils/leagueDataUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TeamPerformanceChartProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  transactions: any[];
  leagueId: string;
}

const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({
  rosters,
  users,
  players,
  transactions,
  leagueId
}) => {
  const { getSalaryCapContribution } = usePlayerSalaries(leagueId);
  const isMobile = useIsMobile();

  // Create user map for easy lookup
  const userMap = React.useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.user_id] = user;
      return acc;
    }, {} as Record<string, any>);
  }, [users]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${Math.round(amount)}`;
  };

  const chartData = React.useMemo(() => {
    return rosters.map((roster) => {
      const user = userMap[roster.owner_id];
      const teamName = getTeamName(user);
      
      // Calculate total salary using accurate method
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || [])
      ];
      
      const totalSalary = allPlayerIds.reduce((sum, playerId) => {
        return sum + getSalaryCapContribution(playerId);
      }, 0);

      // Count transaction activity for this roster
      const transactionActivity = transactions.filter(transaction => {
        return transaction.roster_ids?.includes(roster.roster_id) || 
               (transaction.adds && Object.values(transaction.adds).includes(roster.roster_id.toString())) ||
               (transaction.drops && Object.values(transaction.drops).includes(roster.roster_id.toString()));
      }).length;

      // Calculate roster efficiency (players per dollar)
      const totalPlayers = (roster.players?.length || 0) + (roster.reserve?.length || 0);
      const efficiencyScore = totalSalary > 0 ? (totalPlayers / totalSalary) * 1000000 : 0; // Normalize to make readable

      return {
        team: isMobile 
          ? (teamName.length > 8 ? `${teamName.substring(0, 8)}...` : teamName)
          : (teamName.length > 10 ? `${teamName.substring(0, 10)}...` : teamName),
        fullTeamName: teamName,
        totalSalary,
        transactionActivity,
        efficiencyScore,
        totalPlayers
      };
    });
  }, [rosters, userMap, getSalaryCapContribution, transactions, isMobile]);

  const chartConfig = {
    teams: {
      label: 'Teams',
      color: 'hsl(var(--primary))',
    },
  };

  if (!chartData?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No performance data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChartContainer 
        config={chartConfig} 
        className={`w-full ${isMobile ? 'h-[400px]' : 'h-80'} overflow-hidden`}
      >
        <ScatterChart
          data={chartData}
          margin={{ 
            top: 20, 
            right: isMobile ? 15 : 30, 
            left: isMobile ? 20 : 30, 
            bottom: isMobile ? 60 : 40 
          }}
        >
          <XAxis 
            type="number"
            dataKey="totalSalary"
            name="Total Salary"
            tickFormatter={formatCurrency}
            stroke="hsl(var(--muted-foreground))"
            fontSize={isMobile ? 11 : 12}
            width={isMobile ? 80 : 100}
          />
          <YAxis 
            type="number"
            dataKey="transactionActivity"
            name="Transaction Activity"
            stroke="hsl(var(--muted-foreground))"
            fontSize={isMobile ? 11 : 12}
            width={isMobile ? 60 : 80}
          />
          <ChartTooltip 
            cursor={{ strokeDasharray: '3 3' }}
            content={
              <ChartTooltipContent 
                formatter={(value, name, props) => {
                  if (name === 'totalSalary') {
                    return [formatCurrency(Number(value)), 'Total Salary'];
                  }
                  return [value, 'Transactions'];
                }}
                labelFormatter={(label, payload) => {
                  const data = payload?.[0]?.payload;
                  return data ? (
                    <div className="space-y-1">
                      <div className="font-semibold">{data.fullTeamName}</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Players: {data.totalPlayers}</div>
                        <div>Efficiency Score: {data.efficiencyScore.toFixed(2)}</div>
                      </div>
                    </div>
                  ) : label;
                }}
              />
            }
          />
          <Scatter 
            name="Teams" 
            dataKey="transactionActivity" 
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary-foreground))"
            strokeWidth={1}
            r={isMobile ? 5 : 7}
          />
        </ScatterChart>
      </ChartContainer>

      {/* Analysis Summary */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-muted/20">
          <h4 className="font-medium text-sm mb-2">Most Active Team</h4>
          <div className="space-y-1">
            {(() => {
              const mostActive = chartData.reduce((max, team) => 
                team.transactionActivity > max.transactionActivity ? team : max
              , chartData[0]);
              return (
                <div>
                  <div className="font-medium">{mostActive?.fullTeamName}</div>
                  <div className="text-sm text-muted-foreground">
                    {mostActive?.transactionActivity} transactions
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/20">
          <h4 className="font-medium text-sm mb-2">Highest Spender</h4>
          <div className="space-y-1">
            {(() => {
              const highestSpender = chartData.reduce((max, team) => 
                team.totalSalary > max.totalSalary ? team : max
              , chartData[0]);
              return (
                <div>
                  <div className="font-medium">{highestSpender?.fullTeamName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(highestSpender?.totalSalary)}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformanceChart;
