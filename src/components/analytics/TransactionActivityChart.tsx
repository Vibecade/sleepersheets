import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { getTeamName } from '@/utils/leagueDataUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionActivityChartProps {
  transactions: any[];
  users: any[];
}

const TransactionActivityChart: React.FC<TransactionActivityChartProps> = ({
  transactions,
  users
}) => {
  const isMobile = useIsMobile();
  
  // Create user map for easy lookup
  const userMap = React.useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.user_id] = user;
      return acc;
    }, {} as Record<string, any>);
  }, [users]);

  const chartData = React.useMemo(() => {
    // Group transactions by week
    const weeklyActivity = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const week = transaction.leg || transaction.week || 'Unknown';
      weeklyActivity.set(week, (weeklyActivity.get(week) || 0) + 1);
    });

    // Convert to array and sort by week
    const data = Array.from(weeklyActivity.entries())
      .map(([week, count]) => ({
        week: week === 'Unknown' ? 'Pre-Season' : `Week ${week}`,
        transactions: count,
        weekNum: week === 'Unknown' ? 0 : parseInt(week) || 0
      }))
      .sort((a, b) => a.weekNum - b.weekNum);

    return data;
  }, [transactions]);

  const chartConfig = {
    transactions: {
      label: 'Transactions',
      color: 'hsl(var(--chart-1))',
    },
  };

  // Calculate transaction type breakdown
  const transactionTypes = React.useMemo(() => {
    const types = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const type = transaction.type || 'unknown';
      types.set(type, (types.get(type) || 0) + 1);
    });

    return Array.from(types.entries()).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: ((count / transactions.length) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count);
  }, [transactions]);

  return (
    <div className="space-y-4">
      <div className={`w-full ${isMobile ? 'h-[400px]' : 'h-64'} overflow-hidden`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ 
              top: 20, 
              right: isMobile ? 15 : 30, 
              left: isMobile ? 15 : 20, 
              bottom: isMobile ? 100 : 60 
            }}
          >
            <XAxis 
              dataKey="week" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 11 : 12}
              angle={-90}
              textAnchor="end"
              height={isMobile ? 100 : 60}
              interval={0}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={isMobile ? 11 : 12}
              width={isMobile ? 50 : 60}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => [value, 'Transactions']}
                />
              }
            />
            <Line 
              type="monotone" 
              dataKey="transactions" 
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Transaction Type Breakdown */}
      <div>
        <h4 className="text-sm font-medium mb-3">Transaction Types</h4>
        <div className="grid grid-cols-2 gap-3">
          {transactionTypes.map((type, index) => (
            <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-muted/20">
              <span className="text-sm">{type.type}</span>
              <div className="text-right">
                <div className="font-medium">{type.count}</div>
                <div className="text-xs text-muted-foreground">{type.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransactionActivityChart;