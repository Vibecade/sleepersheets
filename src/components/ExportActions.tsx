
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RosterExport from './exports/RosterExport';
import TransactionsExport from './exports/TransactionsExport';
import DraftExport from './exports/DraftExport';
import ExportInfo from './exports/ExportInfo';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';

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

  const refreshSalaries = async () => {
    // Force a page reload to refresh all salary data
    window.location.reload();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clean Export Options</CardTitle>
        <CardDescription>
          Download your league data in clean CSV format optimized for Google Sheets and Excel
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            
            <div className="flex justify-center">
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
            refreshing={salariesLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportActions;
