import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useIsMobile } from '@/hooks/use-mobile';

interface PositionValueChartProps {
  rosters: any[];
  players: Record<string, any>;
  leagueId: string;
}

const PositionValueChart: React.FC<PositionValueChartProps> = ({
  rosters,
  players,
  leagueId
}) => {
  const { getSalaryCapContribution } = usePlayerSalaries(leagueId);
  const isMobile = useIsMobile();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${Math.round(amount)}`;
  };

  const positionData = React.useMemo(() => {
    const positionSalaries = new Map<string, number>();
    const positionCounts = new Map<string, number>();

    rosters.forEach(roster => {
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      allPlayerIds.forEach((playerId: string) => {
        const player = players[playerId];
        if (player) {
          const position = player.position || 'Unknown';
          const salary = getSalaryCapContribution(playerId);
          
          positionSalaries.set(position, (positionSalaries.get(position) || 0) + salary);
          positionCounts.set(position, (positionCounts.get(position) || 0) + 1);
        }
      });
    });

    const colors = {
      'QB': 'hsl(var(--chart-1))',
      'RB': 'hsl(var(--chart-2))', 
      'WR': 'hsl(var(--chart-3))',
      'TE': 'hsl(var(--chart-4))',
      'K': 'hsl(var(--chart-5))',
      'DEF': 'hsl(var(--destructive))',
      'Unknown': 'hsl(var(--muted))'
    };

    return Array.from(positionSalaries.entries())
      .map(([position, totalSalary]) => ({
        position,
        totalSalary,
        count: positionCounts.get(position) || 0,
        averageSalary: Math.round(totalSalary / (positionCounts.get(position) || 1)),
        fill: colors[position as keyof typeof colors] || 'hsl(var(--muted))'
      }))
      .sort((a, b) => b.totalSalary - a.totalSalary);
  }, [rosters, players, getSalaryCapContribution]);

  const totalValue = positionData.reduce((sum, item) => sum + item.totalSalary, 0);

  const chartConfig = {
    position: {
      label: 'Position',
    },
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Position Value Distribution</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={isMobile ? "h-80" : "h-80"}>
          <ResponsiveContainer width="100%" height="100%" minHeight={320}>
            <PieChart>
              <Pie
                data={positionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ position, value, percent }) => 
                  percent > 0.08 && !isMobile ? `${position} ${(percent * 100).toFixed(1)}%` : ''
                }
                outerRadius={isMobile ? 80 : 100}
                fill="#8884d8"
                dataKey="totalSalary"
              >
                {positionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name, props) => [
                      formatCurrency(Number(value)),
                      'Total Value'
                    ]}
                    labelFormatter={(label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? (
                        <div className="space-y-1">
                          <div className="font-semibold">{data.position}</div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{data.count} players</div>
                            <div>Avg: {formatCurrency(data.averageSalary)}</div>
                            <div>{((data.totalSalary / totalValue) * 100).toFixed(1)}% of total</div>
                          </div>
                        </div>
                      ) : label;
                    }}
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Position Breakdown Table */}
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Detailed Breakdown</h4>
          <div className="space-y-2">
            {positionData.map((pos, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/20">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: pos.fill }}
                  />
                  <span className="font-medium">{pos.position}</span>
                  <span className="text-sm text-muted-foreground">({pos.count} players)</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(pos.totalSalary)}</div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(pos.averageSalary)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionValueChart;