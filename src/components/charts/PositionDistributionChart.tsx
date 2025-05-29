import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PositionDistributionChartProps {
  rosters: any[];
  players: Record<string, any>;
}

const PositionDistributionChart: React.FC<PositionDistributionChartProps> = ({ rosters, players }) => {
  const positionCounts = rosters.reduce((acc, roster) => {
    roster.players?.forEach((playerId: string) => {
      const player = players[playerId];
      if (player?.position) {
        acc[player.position] = (acc[player.position] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  const totalPlayers: number = Object.values(positionCounts).reduce((sum: number, count: number) => sum + count, 0);
  
  const chartData = Object.entries(positionCounts).map(([position, count]: [string, number]) => ({
    position,
    count: count,
    percentage: totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0
  }));

  const COLORS = {
    QB: '#ef4444',
    RB: '#3b82f6', 
    WR: '#10b981',
    TE: '#f59e0b',
    K: '#8b5cf6',
    DEF: '#6b7280'
  };

  const chartConfig = {
    QB: { label: "Quarterback", color: COLORS.QB },
    RB: { label: "Running Back", color: COLORS.RB },
    WR: { label: "Wide Receiver", color: COLORS.WR },
    TE: { label: "Tight End", color: COLORS.TE },
    K: { label: "Kicker", color: COLORS.K },
    DEF: { label: "Defense", color: COLORS.DEF },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Position Distribution</CardTitle>
        <CardDescription>Player positions across all teams</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ position, percentage }) => `${position} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.position as keyof typeof COLORS] || '#6b7280'} 
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, 'Players']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PositionDistributionChart;
