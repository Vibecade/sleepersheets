
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RosterExport from './exports/RosterExport';
import TransactionsExport from './exports/TransactionsExport';
import DraftExport from './exports/DraftExport';
import ExportInfo from './exports/ExportInfo';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';

interface ExportActionsProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

const ExportActions: React.FC<ExportActionsProps> = ({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks
}) => {
  const { salaries, loading: salariesLoading } = usePlayerSalaries(league.league_id);
  const { deadCapPlayers, loading: deadCapLoading } = useDeadCapPlayers(league.league_id);

  const refreshSalaries = async () => {
    // Force a page reload to refresh all salary data including dead cap
    window.location.reload();
  };

  const isLoading = salariesLoading || deadCapLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Clean Export Options</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Download your league data in clean CSV format optimized for Google Sheets and Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex justify-center">
              <RosterExport 
                league={league}
                rosters={rosters}
                userMap={userMap}
                players={players}
              />
            </div>
            
            <div className="flex justify-center">
              <TransactionsExport 
                league={league}
                transactions={transactions}
                rosterUserMap={rosterUserMap}
                players={players}
              />
            </div>
            
            <div className="flex justify-center sm:col-span-2 lg:col-span-1">
              <DraftExport 
                league={league}
                draftPicks={draftPicks}
                rosterUserMap={rosterUserMap}
                players={players}
              />
            </div>
          </div>

          <ExportInfo 
            onRefreshSalaries={refreshSalaries}
            refreshing={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportActions;
