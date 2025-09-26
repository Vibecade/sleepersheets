import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { getTeamName } from '@/utils/leagueDataUtils';

interface SalaryDistributionChartProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  leagueId: string;
  transactions?: any[];
}

const SalaryDistributionChart: React.FC<SalaryDistributionChartProps> = ({
  rosters,
  users,
  players,
  leagueId,
  transactions = []
}) => {
  const { getSalaryCapContribution } = usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);

  // Create user map for easy lookup
  const userMap = React.useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.user_id] = user;
      return acc;
    }, {} as Record<string, any>);
  }, [users]);

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${Math.round(amount)}`;
  };

  const chartData = React.useMemo(() => {
    const salaryCap = settings?.salary_cap || 200000;
    
    return rosters.map((roster) => {
      const user = userMap[roster.owner_id];
      const teamName = getTeamName(user);
      
      // Calculate active salary using the same method as Fantasy Manager
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      const activeSalary = allPlayerIds.reduce((total, playerId) => {
        return total + getSalaryCapContribution(playerId);
      }, 0);

      // Calculate dead cap
      const deadCap = deadCapPlayers
        .filter(player => player.roster_id === roster.roster_id)
        .reduce((total, player) => total + Math.max(1, Math.round((player.salary || 0) * 0.25)), 0);

      const totalSalary = activeSalary + deadCap;
      const capPercentage = (totalSalary / salaryCap) * 100;

      const activePlayers = (roster.players || []).length;
      const reservePlayers = (roster.reserve || []).length;
      const taxiPlayers = (roster.taxi || []).length;

      return {
        team: teamName.length > 8 ? `${teamName.substring(0, 8)}...` : teamName,
        fullTeamName: teamName,
        activeSalary,
        deadCap,
        totalSalary,
        capPercentage,
        activePlayers,
        reservePlayers,
        taxiPlayers,
        totalPlayers: activePlayers + reservePlayers + taxiPlayers
      };
    }).sort((a, b) => b.totalSalary - a.totalSalary);
  }, [rosters, userMap, getSalaryCapContribution, deadCapPlayers, settings?.salary_cap]);

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
        <ChartContainer config={chartConfig} className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ 
                top: 20, 
                right: 10, 
                left: 10, 
                bottom: window.innerWidth < 768 ? 40 : 60 
              }}
            >
              <XAxis 
                dataKey="team" 
                angle={window.innerWidth < 768 ? -90 : -45}
                textAnchor="end"
                height={window.innerWidth < 768 ? 60 : 80}
                fontSize={window.innerWidth < 768 ? 10 : 12}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={window.innerWidth < 768 ? 10 : 12}
                tickFormatter={formatSalary}
                domain={[0, 'dataMax']}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => [
                      formatSalary(Number(value)),
                      'Total Salary'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? (
                        <div className="space-y-1">
                          <div className="font-semibold">{data.fullTeamName}</div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Active: {formatSalary(data.activeSalary)}</div>
                            {data.deadCap > 0 && <div>Dead Cap: {formatSalary(data.deadCap)}</div>}
                            <div>{data.capPercentage.toFixed(1)}% of cap used</div>
                            <div className="text-xs">
                              {data.totalPlayers} total players ({data.activePlayers} active, {data.reservePlayers} reserve, {data.taxiPlayers} taxi)
                            </div>
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