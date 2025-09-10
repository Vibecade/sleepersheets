import React, { useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ChevronDown, ChevronUp, Users, ArrowUpDown, FileText } from 'lucide-react';
import DataDashboard from './DataDashboard';

interface MinimizableDataDashboardProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

const MinimizableDataDashboard: React.FC<MinimizableDataDashboardProps> = memo(({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    // Count total players across all rosters
    const totalPlayers = rosters.reduce((total, roster) => {
      const active = roster.players?.length || 0;
      const taxi = roster.taxi?.length || 0;
      const reserve = roster.reserve?.length || 0;
      return total + active + taxi + reserve;
    }, 0);

    // Count transactions
    const totalTransactions = transactions.length;
    
    // Count draft picks
    const totalDraftPicks = draftPicks.reduce((total, draft) => total + draft.picks.length, 0);

    // Find most active team by transaction count
    const teamTransactionCounts: Record<string, number> = {};
    transactions.forEach(transaction => {
      if (transaction.adds) {
        Object.values(transaction.adds as Record<string, string>).forEach(rosterId => {
          const user = rosterUserMap[rosterId];
          if (user) {
            const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
            teamTransactionCounts[teamName] = (teamTransactionCounts[teamName] || 0) + 1;
          }
        });
      }
      if (transaction.drops) {
        Object.values(transaction.drops as Record<string, string>).forEach(rosterId => {
          const user = rosterUserMap[rosterId];
          if (user) {
            const teamName = user?.metadata?.team_name || user?.display_name || 'Unknown Team';
            teamTransactionCounts[teamName] = (teamTransactionCounts[teamName] || 0) + 1;
          }
        });
      }
    });

    const mostActiveTeam = Object.entries(teamTransactionCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalPlayers,
      totalTransactions,
      totalDraftPicks,
      mostActiveTeam: mostActiveTeam ? `${mostActiveTeam[0]} (${mostActiveTeam[1]} moves)` : 'None'
    };
  }, [rosters, transactions, draftPicks, rosterUserMap]);

  if (isExpanded) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <div>
                <CardTitle>Data Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete league data with editing capabilities
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              Collapse
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <DataDashboard
            league={league}
            rosters={rosters}
            userMap={userMap}
            rosterUserMap={rosterUserMap}
            players={players}
            transactions={transactions}
            draftPicks={draftPicks}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsExpanded(true)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <CardTitle className="text-lg">Data Dashboard</CardTitle>
              <p className="text-sm text-muted-foreground">
                League data overview • Click to expand full dashboard
              </p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{summaryStats.totalPlayers}</p>
              <p className="text-xs text-muted-foreground">Total Players</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <ArrowUpDown className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{summaryStats.totalTransactions}</p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium">{summaryStats.totalDraftPicks}</p>
              <p className="text-xs text-muted-foreground">Draft Picks</p>
            </div>
          </div>
          
          <div className="col-span-2 md:col-span-1">
            <Badge variant="outline" className="text-xs w-full justify-center">
              Most Active: {summaryStats.mostActiveTeam}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MinimizableDataDashboard.displayName = 'MinimizableDataDashboard';

export default MinimizableDataDashboard;