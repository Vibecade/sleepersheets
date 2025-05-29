
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PositionData {
  position: string;
  count: number;
  percentage: number;
}

interface PositionDistributionChartProps {
  rosters: any[];
  players: Record<string, any>;
  title?: string;
}

const POSITION_COLORS = {
  QB: '#3b82f6',
  RB: '#ef4444',
  WR: '#10b981',
  TE: '#f59e0b',
  K: '#8b5cf6',
  DEF: '#6b7280',
  Other: '#ec4899'
};

const PositionDistributionChart: React.FC<PositionDistributionChartProps> = ({
  rosters,
  players,
  title = "League Position Distribution"
}) => {
  const positionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    
    rosters.forEach(roster => {
      roster.players?.forEach((playerId: string) => {
        const player = players[playerId];
        if (player?.position) {
          const position = player.position === 'DST' ? 'DEF' : player.position;
          counts[position] = (counts[position] || 0) + 1;
        }
      });
    });

    const totalPlayers = (Object.values(counts) as number[]).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(counts)
      .map(([position, count]) => ({
        position,
        count,
        percentage: totalPlayers > 0 ? Math.round((count / totalPlayers) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [rosters, players]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.position}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} players ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Distribution of players by position across all teams
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={positionCounts}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
                label={({ position, percentage }) => `${position} (${percentage}%)`}
                labelLine={false}
              >
                {positionCounts.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={POSITION_COLORS[entry.position as keyof typeof POSITION_COLORS] || POSITION_COLORS.Other}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionDistributionChart;
