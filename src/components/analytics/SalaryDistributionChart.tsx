import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { getTeamName } from '@/utils/leagueDataUtils';

interface SalaryDistributionChartProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  leagueId: string;
}

const SalaryDistributionChart: React.FC<SalaryDistributionChartProps> = ({
  rosters,
  users,
  players,
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
      
      // Calculate total salary for this roster
      const totalSalary = (roster.players || []).reduce((sum: number, playerId: string) => {
        return sum + getEffectiveSalary(playerId);
      }, 0);

      const activePlayers = (roster.players || []).length;
      const reservePlayers = (roster.reserve || []).length;
      const taxiPlayers = (roster.taxi || []).length;

      return {
        team: teamName.length > 12 ? `${teamName.substring(0, 12)}...` : teamName,
        fullTeamName: teamName,
        totalSalary,
        activePlayers,
        reservePlayers,
        taxiPlayers,
        totalPlayers: activePlayers + reservePlayers + taxiPlayers
      };
    }).sort((a, b) => b.totalSalary - a.totalSalary);
  }, [rosters, userMap, getEffectiveSalary]);

  const chartConfig = {
    totalSalary: {
      label: 'Total Salary',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Team Salary Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="team" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => [
                      `$${Number(value).toLocaleString()}`,
                      'Total Salary'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? (
                        <div className="space-y-1">
                          <div className="font-semibold">{data.fullTeamName}</div>
                          <div className="text-sm text-muted-foreground">
                            {data.totalPlayers} total players ({data.activePlayers} active, {data.reservePlayers} reserve, {data.taxiPlayers} taxi)
                          </div>
                        </div>
                      ) : label;
                    }}
                  />
                }
              />
              <Bar 
                dataKey="totalSalary" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default SalaryDistributionChart;