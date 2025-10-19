import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';

interface LeagueMetricsCardsProps {
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  transactions: any[];
  leagueId: string;
}

const LeagueMetricsCards: React.FC<LeagueMetricsCardsProps> = ({
  rosters,
  users,
  players,
  transactions,
  leagueId
}) => {
  const { getSalaryCapContribution } = usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${Math.round(amount / 1000)}K`;
    }
    return `$${Math.round(amount)}`;
  };

  // Calculate key metrics with accurate data
  const totalTeams = rosters.length;
  const totalTransactions = transactions.length;
  const activeUsers = users.filter(user => 
    rosters.some(roster => roster.owner_id === user.user_id)
  ).length;

  const faabTransactions = transactions.filter(t => 
    t.settings?.waiver_bid && t.status === 'complete'
  );
  const totalFAABSpent = faabTransactions.reduce((sum, t) => 
    sum + (t.settings?.waiver_bid || 0), 0
  );

  const avgFAABPerTransaction = faabTransactions.length > 0 
    ? totalFAABSpent / faabTransactions.length 
    : 0;

  const recentActivity = transactions.filter(t => {
    const transactionDate = new Date(t.created);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return transactionDate >= weekAgo;
  }).length;

  // Calculate total league salary and cap usage
  const salaryCap = settings?.salary_cap || 200000;
  const totalLeagueSalary = rosters.reduce((total, roster) => {
    const allPlayerIds = [
      ...(roster.players || []),
      ...(roster.taxi || [])
    ];
    
    const activeSalary = allPlayerIds.reduce((sum, playerId) => {
      return sum + getSalaryCapContribution(playerId);
    }, 0);

    const deadCap = deadCapPlayers
      .filter(player => player.roster_id === roster.roster_id)
      .reduce((sum, player) => sum + Math.max(1, Math.round((player.salary || 0) * 0.25)), 0);

    return total + activeSalary + deadCap;
  }, 0);

  const avgTeamSalary = totalTeams > 0 ? totalLeagueSalary / totalTeams : 0;
  const totalCapSpace = (salaryCap * totalTeams) - totalLeagueSalary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Teams</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold text-primary">{totalTeams}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeUsers} active managers
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">League Salary</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold text-accent">{formatCurrency(totalLeagueSalary)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(avgTeamSalary)} avg per team
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Cap Space</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold text-chart-2">{formatCurrency(totalCapSpace)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(salaryCap)} per team cap
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">FAAB Activity</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-2xl font-bold text-chart-3">
            ${totalFAABSpent}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {faabTransactions.length} FAAB bids
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeagueMetricsCards;