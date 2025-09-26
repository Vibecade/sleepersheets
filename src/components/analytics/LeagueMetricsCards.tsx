import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Activity, TrendingUp, Calculator, Crown } from 'lucide-react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { getTeamName } from '@/utils/leagueDataUtils';

interface LeagueMetricsCardsProps {
  league: any;
  rosters: any[];
  transactions: any[];
  players: Record<string, any>;
}

const LeagueMetricsCards: React.FC<LeagueMetricsCardsProps> = ({
  league,
  rosters,
  transactions,
  players
}) => {
  const { salaries, getEffectiveSalary } = usePlayerSalaries(league.league_id);

  // Calculate total salary cap used across all teams
  const totalSalaryCap = React.useMemo(() => {
    return rosters.reduce((total, roster) => {
      const rosterSalary = (roster.players || []).reduce((sum: number, playerId: string) => {
        return sum + getEffectiveSalary(playerId);
      }, 0);
      return total + rosterSalary;
    }, 0);
  }, [rosters, getEffectiveSalary]);

  // Calculate average salary per team
  const avgSalaryPerTeam = rosters.length > 0 ? totalSalaryCap / rosters.length : 0;

  // Calculate total players across all rosters
  const totalPlayers = React.useMemo(() => {
    return rosters.reduce((total, roster) => {
      return total + (roster.players?.length || 0) + (roster.reserve?.length || 0) + (roster.taxi?.length || 0);
    }, 0);
  }, [rosters]);

  // Find most active trader
  const mostActiveTrader = React.useMemo(() => {
    const tradeActivity = new Map();
    
    transactions.forEach(transaction => {
      if (transaction.type === 'trade' && transaction.roster_ids) {
        transaction.roster_ids.forEach((rosterId: number) => {
          tradeActivity.set(rosterId, (tradeActivity.get(rosterId) || 0) + 1);
        });
      }
    });

    let maxTrades = 0;
    let mostActiveRosterId = null;
    
    tradeActivity.forEach((trades, rosterId) => {
      if (trades > maxTrades) {
        maxTrades = trades;
        mostActiveRosterId = rosterId;
      }
    });

    if (mostActiveRosterId) {
      const roster = rosters.find(r => r.roster_id === mostActiveRosterId);
      const user = roster ? league.users?.find((u: any) => u.user_id === roster.owner_id) : null;
      return {
        name: user ? getTeamName(user) : 'Unknown',
        trades: maxTrades
      };
    }
    
    return { name: 'None', trades: 0 };
  }, [transactions, rosters, league.users]);

  // Calculate league competitiveness (standard deviation of salaries)
  const competitivenessScore = React.useMemo(() => {
    if (rosters.length === 0) return 0;
    
    const teamSalaries = rosters.map(roster => {
      return (roster.players || []).reduce((sum: number, playerId: string) => {
        return sum + getEffectiveSalary(playerId);
      }, 0);
    });
    
    const mean = teamSalaries.reduce((a, b) => a + b, 0) / teamSalaries.length;
    const variance = teamSalaries.reduce((sum, salary) => sum + Math.pow(salary - mean, 2), 0) / teamSalaries.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to a 0-100 competitive score (lower std dev = higher competitiveness)
    const maxPossibleStdDev = mean * 0.5; // Assume max 50% variation
    return Math.max(0, Math.min(100, 100 - (stdDev / maxPossibleStdDev) * 100));
  }, [rosters, getEffectiveSalary]);

  const metrics = [
    {
      title: 'Total Salary Cap Used',
      value: `$${totalSalaryCap.toLocaleString()}`,
      icon: DollarSign,
      description: 'Across all teams',
      change: null
    },
    {
      title: 'Average Team Salary',
      value: `$${Math.round(avgSalaryPerTeam).toLocaleString()}`,
      icon: Calculator,
      description: `${rosters.length} teams`,
      change: null
    },
    {
      title: 'Total Players',
      value: totalPlayers.toString(),
      icon: Users,
      description: 'Active, reserve & taxi',
      change: null
    },
    {
      title: 'Transaction Activity',
      value: transactions.length.toString(),
      icon: Activity,
      description: 'Total transactions',
      change: null
    },
    {
      title: 'Most Active Trader',
      value: mostActiveTrader.name,
      icon: Crown,
      description: `${mostActiveTrader.trades} trades`,
      change: null
    },
    {
      title: 'League Competitiveness',
      value: `${Math.round(competitivenessScore)}%`,
      icon: TrendingUp,
      description: 'Salary balance score',
      change: competitivenessScore >= 75 ? 'high' : competitivenessScore >= 50 ? 'medium' : 'low'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-xs text-muted-foreground">{metric.description}</p>
              {metric.change && (
                <Badge 
                  variant={metric.change === 'high' ? 'default' : metric.change === 'medium' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {metric.change}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LeagueMetricsCards;