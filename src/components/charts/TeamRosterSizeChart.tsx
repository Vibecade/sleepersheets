
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamRosterSizeChartProps {
  rosters: any[];
  userMap: Record<string, any>;
  title?: string;
}

const TeamRosterSizeChart: React.FC<TeamRosterSizeChartProps> = ({
  rosters,
  userMap,
  title = "Team Roster Sizes"
}) => {
  const chartData = React.useMemo(() => {
    return rosters.map(roster => {
      const user = userMap[roster.owner_id];
      const totalPlayers = roster.players?.length || 0;
      const starterCount = roster.starters?.length || 0;
      const benchCount = totalPlayers - starterCount;
      
      return {
        team: user?.display_name || user?.username || 'Unknown',
        starters: starterCount,
        bench: benchCount,
        total: totalPlayers
      };
    }).sort((a, b) => b.total - a.total);
  }, [rosters, userMap]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, item: any) => sum + item.value, 0);
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-blue-400">Starters: {payload[0]?.value || 0}</p>
          <p className="text-sm text-green-400">Bench: {payload[1]?.value || 0}</p>
          <p className="text-sm font-semibold">Total: {total}</p>
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
          Number of players on each team (starters vs bench)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="team" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="starters" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="bench" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Starters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Bench</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamRosterSizeChart;
