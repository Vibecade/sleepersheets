
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RosterValueChartProps {
  rosters: any[];
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
}

const RosterValueChart: React.FC<RosterValueChartProps> = ({ rosters, rosterUserMap, players }) => {
  const chartData = rosters.map(roster => {
    const user = rosterUserMap[roster.roster_id];
    const teamName = user?.display_name || user?.username || 'Unknown Team';
    
    // Calculate total roster value
    const totalValue = roster.players?.reduce((sum: number, playerId: string) => {
      const player = players[playerId];
      if (player?.fantasy_data_nfl?.fantasy_positions_value) {
        return sum + (player.fantasy_data_nfl.fantasy_positions_value / 100);
      }
      return sum;
    }, 0) || 0;

    return {
      team: teamName.length > 12 ? teamName.substring(0, 12) + '...' : teamName,
      value: Math.round(totalValue),
      fullTeamName: teamName
    };
  }).sort((a, b) => b.value - a.value);

  const chartConfig = {
    value: {
      label: "Roster Value ($)",
      color: "#eab308",
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Roster Values</CardTitle>
        <CardDescription>Total franchise value by team</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="team" 
                angle={-45}
                textAnchor="end"
                height={60}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip 
                content={<ChartTooltipContent />}
                formatter={(value: number, name: string, props: any) => [
                  `$${value.toLocaleString()}`, 
                  props.payload.fullTeamName
                ]}
              />
              <Bar 
                dataKey="value" 
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default RosterValueChart;
