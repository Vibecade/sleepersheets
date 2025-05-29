
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SalaryCapChartProps {
  rosters: any[];
  userMap: Record<string, any>;
  teamSalaries: Record<number, number>;
  salaryCap: number;
  title?: string;
}

const SalaryCapChart: React.FC<SalaryCapChartProps> = ({
  rosters,
  userMap,
  teamSalaries,
  salaryCap,
  title = "Team Salary Cap Utilization"
}) => {
  const chartData = React.useMemo(() => {
    return rosters.map(roster => {
      const user = userMap[roster.owner_id];
      const teamSalary = teamSalaries[roster.roster_id] || 0;
      const utilizationPercent = salaryCap > 0 ? (teamSalary / salaryCap) * 100 : 0;
      const remainingCap = Math.max(0, salaryCap - teamSalary);
      
      return {
        team: user?.display_name || user?.username || 'Unknown',
        used: teamSalary,
        remaining: remainingCap,
        utilizationPercent: Math.round(utilizationPercent),
        isOverCap: teamSalary > salaryCap
      };
    }).sort((a, b) => b.used - a.used);
  }, [rosters, userMap, teamSalaries, salaryCap]);

  const getBarColor = (utilizationPercent: number, isOverCap: boolean) => {
    if (isOverCap) return '#ef4444'; // Red for over cap
    if (utilizationPercent > 90) return '#f59e0b'; // Yellow for high utilization
    if (utilizationPercent > 75) return '#10b981'; // Green for good utilization
    return '#3b82f6'; // Blue for low utilization
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-sm">Used: ${data.used.toLocaleString()}</p>
          <p className="text-sm">Remaining: ${data.remaining.toLocaleString()}</p>
          <p className="text-sm">Utilization: {data.utilizationPercent}%</p>
          {data.isOverCap && (
            <p className="text-sm text-red-500 font-semibold">Over Cap!</p>
          )}
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
          Salary cap usage by team (Cap: ${salaryCap.toLocaleString()})
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
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                fontSize={12}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="used" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.utilizationPercent, entry.isOverCap)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Good Space (&lt;75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>High Usage (75-90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Near Cap (&gt;90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Over Cap</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryCapChart;
