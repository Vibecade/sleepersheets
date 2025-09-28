import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useHistoricalMatchups } from '@/hooks/useHistoricalMatchups';
import { getTeamName } from '@/utils/leagueDataUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TeamEfficiencyChartProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  leagueId: string;
  transactions?: any[];
}

type ChartType = 'costPerWin' | 'costPerPoint' | 'efficiency';

const TeamEfficiencyChart: React.FC<TeamEfficiencyChartProps> = ({
  rosters,
  users,
  players,
  leagueId,
  transactions = []
}) => {
  const { getSalaryCapContribution } = usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);
  const isMobile = useIsMobile();
  const [chartType, setChartType] = useState<ChartType>('costPerWin');

  // Use a reasonable default for current week (mid-season)
  const currentWeek = 8;
  const { historicalMatchups, loading } = useHistoricalMatchups(leagueId, currentWeek);

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

  const formatEfficiency = (value: number) => {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}K`;
    }
    return `$${Math.round(value)}`;
  };

  const chartData = React.useMemo(() => {
    if (!historicalMatchups?.length) return [];

    // Calculate team performance metrics across all weeks
    const teamStats = rosters.map((roster) => {
      const user = userMap[roster.owner_id];
      const teamName = getTeamName(user);
      
      // Calculate total salary
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      const activeSalary = allPlayerIds.reduce((total, playerId) => {
        return total + getSalaryCapContribution(playerId);
      }, 0);

      const deadCap = deadCapPlayers
        .filter(player => player.roster_id === roster.roster_id)
        .reduce((total, player) => total + Math.max(1, Math.round((player.salary || 0) * 0.25)), 0);

      const totalSalary = activeSalary + deadCap;

      // Calculate wins and points from all historical matchups
      let wins = 0;
      let totalPoints = 0;
      let gamesPlayed = 0;

      historicalMatchups.forEach(({ matchups: weekMatchups }) => {
        // Group matchups by matchup_id to find opponents
        const matchupGroups = weekMatchups.reduce((groups, matchup) => {
          if (!groups[matchup.matchup_id]) {
            groups[matchup.matchup_id] = [];
          }
          groups[matchup.matchup_id].push(matchup);
          return groups;
        }, {} as Record<number, any[]>);

        // Calculate team stats from week's matchups
        Object.values(matchupGroups).forEach(matchupPair => {
          const teamMatchup = matchupPair.find(m => m.roster_id === roster.roster_id);
          if (teamMatchup && teamMatchup.points !== null) {
            totalPoints += teamMatchup.points;
            gamesPlayed++;
            
            // Find opponent
            const opponent = matchupPair.find(m => 
              m.matchup_id === teamMatchup.matchup_id && 
              m.roster_id !== teamMatchup.roster_id
            );
            
            if (opponent && teamMatchup.points > (opponent.points || 0)) {
              wins++;
            }
          }
        });
      });

      const costPerWin = wins > 0 ? totalSalary / wins : totalSalary;
      const costPerPoint = totalPoints > 0 ? totalSalary / totalPoints : 0;
      const winPercentage = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
      const avgPointsPerGame = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;

      return {
        team: isMobile 
          ? (teamName.length > 6 ? `${teamName.substring(0, 6)}...` : teamName)
          : (teamName.length > 10 ? `${teamName.substring(0, 10)}...` : teamName),
        fullTeamName: teamName,
        totalSalary,
        wins,
        totalPoints,
        gamesPlayed,
        costPerWin,
        costPerPoint,
        winPercentage,
        avgPointsPerGame,
        efficiency: costPerWin // Use cost per win as primary efficiency metric
      };
    }).filter(team => team.gamesPlayed > 0);

    return teamStats;
  }, [rosters, userMap, getSalaryCapContribution, deadCapPlayers, historicalMatchups]);

  const getChartConfig = () => {
    switch (chartType) {
      case 'costPerWin':
        return {
          efficiency: { label: 'Cost Per Win', color: 'hsl(220 70% 50%)' }
        };
      case 'costPerPoint':
        return {
          efficiency: { label: 'Cost Per Point', color: 'hsl(142 70% 50%)' }
        };
      case 'efficiency':
        return {
          efficiency: { label: 'Win Rate vs Salary', color: 'hsl(280 70% 50%)' }
        };
      default:
        return {
          efficiency: { label: 'Cost Per Win', color: 'hsl(220 70% 50%)' }
        };
    }
  };

  const getYAxisData = () => {
    switch (chartType) {
      case 'costPerWin':
        return { dataKey: 'costPerWin', label: 'Cost Per Win' };
      case 'costPerPoint':
        return { dataKey: 'costPerPoint', label: 'Cost Per Point' };
      case 'efficiency':
        return { dataKey: 'winPercentage', label: 'Win Percentage (%)' };
      default:
        return { dataKey: 'costPerWin', label: 'Cost Per Win' };
    }
  };

  const chartConfig = getChartConfig();
  const yAxisConfig = getYAxisData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading efficiency data...
      </div>
    );
  }

  if (!chartData?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No efficiency data available - need completed matchup results
      </div>
    );
  }

  // Calculate average for reference line based on chart type
  const getAverageValue = () => {
    switch (chartType) {
      case 'costPerWin':
        return chartData.reduce((sum, team) => sum + team.costPerWin, 0) / chartData.length;
      case 'costPerPoint':
        return chartData.reduce((sum, team) => sum + team.costPerPoint, 0) / chartData.length;
      case 'efficiency':
        return chartData.reduce((sum, team) => sum + team.winPercentage, 0) / chartData.length;
      default:
        return chartData.reduce((sum, team) => sum + team.costPerWin, 0) / chartData.length;
    }
  };

  const avgValue = getAverageValue();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="costPerWin">Cost Per Win</SelectItem>
            <SelectItem value="costPerPoint">Cost Per Point</SelectItem>
            <SelectItem value="efficiency">Win Rate Analysis</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          Weeks 1-{currentWeek - 1} data
        </div>
      </div>
      
      <ChartContainer 
        config={chartConfig} 
        className={`w-full ${isMobile ? 'h-[500px]' : 'h-80'} overflow-hidden`}
      >
      <ScatterChart 
        data={chartData} 
        margin={{ 
          top: 20, 
          right: isMobile ? 15 : 20, 
          left: isMobile ? 15 : 20, 
          bottom: isMobile ? 80 : 60 
        }}
      >
        <XAxis 
          type="number"
          dataKey="totalSalary" 
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatCurrency}
          fontSize={isMobile ? 10 : 12}
          stroke="hsl(var(--foreground))"
          name="Total Salary"
        />
        <YAxis 
          type="number"
          dataKey={yAxisConfig.dataKey}
          domain={['dataMin', 'dataMax']}
          tickFormatter={chartType === 'efficiency' ? (value) => `${value.toFixed(0)}%` : formatEfficiency}
          fontSize={isMobile ? 10 : 12}
          stroke="hsl(var(--foreground))"
          name={yAxisConfig.label}
        />
        <ReferenceLine 
          y={avgValue} 
          stroke="hsl(var(--muted-foreground))" 
          strokeDasharray="5 5"
          opacity={0.7}
        />
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              formatter={(value, name) => [
                chartType === 'efficiency' ? `${Number(value).toFixed(1)}%` : formatEfficiency(Number(value)),
                yAxisConfig.label
              ]}
              labelFormatter={(label, payload) => {
                const data = payload?.[0]?.payload;
                return data ? (
                  <div className="space-y-1">
                    <div className="font-semibold">{data.fullTeamName}</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Total Salary: {formatCurrency(data.totalSalary)}</div>
                      <div>Record: {data.wins}-{data.gamesPlayed - data.wins} ({data.winPercentage.toFixed(1)}%)</div>
                      <div>Cost Per Win: {formatEfficiency(data.costPerWin)}</div>
                      <div>Cost Per Point: {formatEfficiency(data.costPerPoint)}</div>
                      <div>Avg PPG: {data.avgPointsPerGame.toFixed(1)}</div>
                      <div>Total Points: {data.totalPoints.toFixed(1)}</div>
                      <div className="text-xs mt-1">
                        {(() => {
                          const isEfficient = chartType === 'efficiency' 
                            ? data.winPercentage > avgValue 
                            : (yAxisConfig.dataKey === 'costPerWin' ? data.costPerWin < avgValue : data.costPerPoint < avgValue);
                          return isEfficient ? '✅ Above Average' : '📉 Below Average';
                        })()}
                      </div>
                    </div>
                  </div>
                ) : label;
              }}
            />
          }
        />
        <Scatter 
          dataKey={yAxisConfig.dataKey}
          fill={chartConfig.efficiency.color}
          fillOpacity={0.8}
          stroke={chartConfig.efficiency.color}
          strokeWidth={2}
          r={isMobile ? 5 : 7}
        />
      </ScatterChart>
    </ChartContainer>
    </div>
  );
};

export default TeamEfficiencyChart;