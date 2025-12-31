import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import RosterExport from './exports/RosterExport';
import TransactionsExport from './exports/TransactionsExport';
import DraftExport from './exports/DraftExport';
import StandingsExport from './exports/StandingsExport';
import LeagueSettingsExport from './exports/LeagueSettingsExport';
import MatchupsExport from './exports/MatchupsExport';
import ExportAll from './exports/ExportAll';
import ExportInfo from './exports/ExportInfo';
import ExportOptions, { ExportOptionsData } from './exports/ExportOptions';
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
  const [exportOptions, setExportOptions] = useState<ExportOptionsData>({
    includeLeagueRules: false,
    leagueRules: '',
    includeFAAB: false,
    faabBudget: '',
    faabNotes: '',
    includeDraftOrder: false,
    draftOrder: ''
  });

  const refreshSalaries = async () => {
    window.location.reload();
  };

  const isLoading = salariesLoading || deadCapLoading;

  const handleOptionsChange = (options: ExportOptionsData) => {
    setExportOptions(options);
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-lg sm:text-xl">Export Center</CardTitle>
        <CardDescription className="text-sm">
          Download comprehensive league data for analysis, archiving, or AI processing
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <Tabs defaultValue="exports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1">
            <TabsTrigger value="exports" className="text-sm py-2 px-3 min-h-[44px]">
              Data Exports
            </TabsTrigger>
            <TabsTrigger value="options" className="text-sm py-2 px-3 min-h-[44px]">
              Export Options
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="exports" className="space-y-6 mt-4 sm:mt-6">
            {/* Quick Export All */}
            <div className="mb-6">
              <ExportAll
                league={league}
                rosters={rosters}
                userMap={userMap}
                rosterUserMap={rosterUserMap}
                players={players}
                transactions={transactions}
                draftPicks={draftPicks}
                exportOptions={exportOptions}
              />
            </div>
            
            <Separator />
            
            {/* Core Data Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Core Data</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex justify-center">
                  <RosterExport 
                    league={league}
                    rosters={rosters}
                    userMap={userMap}
                    players={players}
                    exportOptions={exportOptions}
                  />
                </div>
                <div className="flex justify-center">
                  <StandingsExport
                    league={league}
                    rosters={rosters}
                    userMap={userMap}
                    exportOptions={exportOptions}
                  />
                </div>
                <div className="flex justify-center">
                  <MatchupsExport
                    league={league}
                    rosters={rosters}
                    userMap={userMap}
                    exportOptions={exportOptions}
                  />
                </div>
              </div>
            </div>
            
            {/* Activity Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity & History</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="flex justify-center">
                  <TransactionsExport 
                    league={league}
                    transactions={transactions}
                    rosterUserMap={rosterUserMap}
                    players={players}
                    exportOptions={exportOptions}
                  />
                </div>
                <div className="flex justify-center">
                  <DraftExport 
                    league={league}
                    draftPicks={draftPicks}
                    rosterUserMap={rosterUserMap}
                    players={players}
                    exportOptions={exportOptions}
                  />
                </div>
                <div className="flex justify-center">
                  <LeagueSettingsExport
                    league={league}
                    exportOptions={exportOptions}
                  />
                </div>
              </div>
            </div>

            <ExportInfo 
              onRefreshSalaries={refreshSalaries}
              refreshing={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="options" className="mt-4 sm:mt-6">
            <ExportOptions onOptionsChange={handleOptionsChange} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExportActions;
