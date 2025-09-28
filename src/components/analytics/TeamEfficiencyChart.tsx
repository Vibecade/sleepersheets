import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useMatchups, Matchup } from '@/hooks/useMatchups';
import { getTeamName } from '@/utils/leagueDataUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TeamEfficiencyChartProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  leagueId: string;
  transactions?: any[];
}

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
  const { matchups } = useMatchups(leagueId, 1);
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

  const formatEfficiency = (value: number) => {
    if (value >= 1000) {
      return `$${Math.round(value / 1000)}K`;
    }
    return `$${Math.round(value)}`;
  };

  const chartData = React.useMemo(() => {
    if (!matchups?.length) return [];

    // Calculate team performance metrics
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

      // Calculate wins and points from matchups
      let wins = 0;
      let totalPoints = 0;
      let gamesPlayed = 0;

      // Group matchups by matchup_id to find opponents
      const matchupGroups = matchups.reduce((groups, matchup) => {
        if (!groups[matchup.matchup_id]) {
          groups[matchup.matchup_id] = [];
        }
        groups[matchup.matchup_id].push(matchup);
        return groups;
      }, {} as Record<number, Matchup[]>);

      // Calculate team stats from all matchups
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
  }, [rosters, userMap, getSalaryCapContribution, deadCapPlayers, matchups]);

  const chartConfig = {
    efficiency: {
      label: 'Cost Per Win',
      color: 'hsl(var(--primary))',
    },
  };

  if (!chartData?.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No efficiency data available - need matchup results
      </div>
    );
  }

  // Calculate average cost per win for reference line
  const avgCostPerWin = chartData.reduce((sum, team) => sum + team.costPerWin, 0) / chartData.length;

  return (
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
          stroke="hsl(var(--muted-foreground))"
          name="Total Salary"
        />
        <YAxis 
          type="number"
          dataKey="costPerWin"
          domain={['dataMin', 'dataMax']}
          tickFormatter={formatEfficiency}
          fontSize={isMobile ? 10 : 12}
          stroke="hsl(var(--muted-foreground))"
          name="Cost Per Win"
        />
        <ReferenceLine 
          y={avgCostPerWin} 
          stroke="hsl(var(--muted-foreground))" 
          strokeDasharray="5 5"
          opacity={0.5}
        />
        <ChartTooltip 
          content={
            <ChartTooltipContent 
              formatter={(value, name) => [
                name === 'costPerWin' ? formatEfficiency(Number(value)) : value,
                name === 'costPerWin' ? 'Cost Per Win' : name
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
                      <div className="text-xs mt-1">
                        {data.costPerWin < avgCostPerWin ? '✅ Efficient' : '❌ Overpaying'}
                      </div>
                    </div>
                  </div>
                ) : label;
              }}
            />
          }
        />
        <Scatter 
          dataKey="costPerWin" 
          fill="hsl(var(--primary))"
          fillOpacity={0.7}
          stroke="hsl(var(--primary))"
          strokeWidth={1}
          r={isMobile ? 4 : 6}
        />
      </ScatterChart>
    </ChartContainer>
  );
};

export default TeamEfficiencyChart;