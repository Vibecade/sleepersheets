import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { getTeamName } from '@/utils/leagueDataUtils';

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
  const { getEffectiveSalary } = usePlayerSalaries(leagueId);

  // Create user map for easy lookup
  const userMap = React.useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.user_id] = user;
      return acc;
    }, {} as Record<string, any>);
  }, [users]);

  const chartData = React.useMemo(() => {
    return rosters.map((roster) => {
      const user = userMap[roster.owner_id];
      const teamName = getTeamName(user);
      
      // Calculate total salary
      const totalSalary = (roster.players || []).reduce((sum: number, playerId: string) => {
        return sum + getEffectiveSalary(playerId);
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
        team: teamName.length > 10 ? `${teamName.substring(0, 10)}...` : teamName,
        fullTeamName: teamName,
        totalSalary,
        transactionActivity,
        efficiencyScore,
        totalPlayers
      };
    });
  }, [rosters, userMap, getEffectiveSalary, transactions]);

  const chartConfig = {
    teams: {
      label: 'Teams',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Salary vs Activity Analysis</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis 
                type="number"
                dataKey="totalSalary"
                name="Total Salary"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                type="number"
                dataKey="transactionActivity"
                name="Transaction Activity"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => {
                      if (name === 'totalSalary') {
                        return [`$${Number(value).toLocaleString()}`, 'Total Salary'];
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
                r={6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Analysis Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      ${highestSpender?.totalSalary.toLocaleString()}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPerformanceChart;