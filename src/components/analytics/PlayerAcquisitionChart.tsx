import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface PlayerAcquisitionChartProps {
  transactions: any[];
  players: Record<string, any>;
  users: any[];
}

const PlayerAcquisitionChart: React.FC<PlayerAcquisitionChartProps> = ({
  transactions,
  players,
  users
}) => {
  const acquisitionData = React.useMemo(() => {
    // Group by week and position
    const weeklyData = new Map<string, Map<string, number>>();
    
    transactions.forEach(transaction => {
      const week = transaction.leg || transaction.week || 'Pre-Season';
      
      if (transaction.adds) {
        Object.keys(transaction.adds).forEach(playerId => {
          const player = players[playerId];
          const position = player?.position || 'Unknown';
          
          if (!weeklyData.has(week)) {
            weeklyData.set(week, new Map());
          }
          
          const weekMap = weeklyData.get(week)!;
          weekMap.set(position, (weekMap.get(position) || 0) + 1);
        });
      }
    });

    // Convert to chart format
    const allPositions = new Set<string>();
    weeklyData.forEach(posMap => {
      posMap.forEach((_, position) => allPositions.add(position));
    });

    const sortedWeeks = Array.from(weeklyData.keys())
      .sort((a, b) => {
        if (a === 'Pre-Season') return -1;
        if (b === 'Pre-Season') return 1;
        return parseInt(a) - parseInt(b);
      });

    return sortedWeeks.map(week => {
      const weekData: any = {
        week: week === 'Pre-Season' ? week : `Week ${week}`,
        weekNum: week === 'Pre-Season' ? 0 : parseInt(week)
      };
      
      allPositions.forEach(position => {
        weekData[position] = weeklyData.get(week)?.get(position) || 0;
      });
      
      return weekData;
    });
  }, [transactions, players]);

  // Get position colors
  const positionColors = {
    'QB': 'hsl(var(--chart-1))',
    'RB': 'hsl(var(--chart-2))',
    'WR': 'hsl(var(--chart-3))',
    'TE': 'hsl(var(--chart-4))',
    'K': 'hsl(var(--chart-5))',
    'DEF': 'hsl(var(--destructive))',
    'Unknown': 'hsl(var(--muted))'
  };

  const positions = Object.keys(positionColors);

  const chartConfig = {
    acquisitions: {
      label: 'Player Acquisitions',
    },
  };

  // Calculate most acquired position
  const positionTotals = React.useMemo(() => {
    const totals = new Map<string, number>();
    
    acquisitionData.forEach(weekData => {
      positions.forEach(position => {
        if (weekData[position]) {
          totals.set(position, (totals.get(position) || 0) + weekData[position]);
        }
      });
    });

    return Array.from(totals.entries())
      .map(([position, total]) => ({ position, total }))
      .sort((a, b) => b.total - a.total);
  }, [acquisitionData, positions]);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Player Acquisition Trends by Position</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={acquisitionData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <XAxis 
                dataKey="week"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `${label}`}
                  />
                }
              />
              {positions.map((position, index) => (
                <Area
                  key={position}
                  type="monotone"
                  dataKey={position}
                  stackId="1"
                  stroke={positionColors[position as keyof typeof positionColors]}
                  fill={positionColors[position as keyof typeof positionColors]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Position Summary */}
        <div>
          <h4 className="text-sm font-medium mb-3">Most Acquired Positions</h4>
          <div className="flex flex-wrap gap-2">
            {positionTotals.slice(0, 6).map((pos, index) => (
              <Badge key={index} variant="outline" className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: positionColors[pos.position as keyof typeof positionColors] }}
                />
                <span>{pos.position}: {pos.total}</span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-muted/20">
            <h4 className="font-medium text-sm mb-1">Total Acquisitions</h4>
            <div className="text-xl font-bold">
              {positionTotals.reduce((sum, pos) => sum + pos.total, 0)}
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/20">
            <h4 className="font-medium text-sm mb-1">Most Active Week</h4>
            <div className="text-xl font-bold">
              {(() => {
                const mostActive = acquisitionData.reduce((max, week) => {
                  const weekTotal = positions.reduce((sum, pos) => sum + (week[pos] || 0), 0);
                  const maxTotal = positions.reduce((sum, pos) => sum + (max[pos] || 0), 0);
                  return weekTotal > maxTotal ? week : max;
                }, acquisitionData[0] || {});
                return mostActive?.week || 'N/A';
              })()}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/20">
            <h4 className="font-medium text-sm mb-1">Top Position</h4>
            <div className="text-xl font-bold">
              {positionTotals[0]?.position || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">
              {positionTotals[0]?.total || 0} acquisitions
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerAcquisitionChart;