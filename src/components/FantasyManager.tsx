import React, { memo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import TeamRosters from './TeamRosters';
import TradeSimulator from './TradeSimulator';
import DataDashboard from './DataDashboard';
import PlayerSearch from './PlayerSearch';
import ProTierUpgrade from './ProTierUpgrade';

interface FantasyManagerProps {
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  league: any;
  transactions: any[];
  draftPicks: any[];
}

// Memoize the entire component to prevent unnecessary re-renders
const FantasyManager: React.FC<FantasyManagerProps> = memo(({
  rosters,
  userMap,
  rosterUserMap,
  players,
  league,
  transactions,
  draftPicks
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <div>
              <CardTitle className="text-2xl">Fantasy Manager</CardTitle>
              <p className="text-gray-400">
                Advanced tools for salary cap, FAAB, dead cap management, detailed roster analysis, and trade simulation
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Pro Tier Upgrade - Hidden by default */}
      <ProTierUpgrade hidden={true} />

     {/* Player Search */}
     <PlayerSearch
       leagueId={league.league_id}
       players={players}
       rosters={rosters}
       userMap={userMap}
     />

      {/* Team Rosters with all advanced features */}
      <TeamRosters
        rosters={rosters}
        userMap={userMap}
        players={players}
      />

      {/* Trade Simulator */}
      <TradeSimulator
        league={league}
        rosters={rosters}
        userMap={userMap}
        players={players}
      />

      {/* Data Dashboard */}
      <DataDashboard
        league={league}
        rosters={rosters}
        userMap={userMap}
        rosterUserMap={rosterUserMap}
        players={players}
        transactions={transactions}
        draftPicks={draftPicks}
      />
    </div>
  );
});

FantasyManager.displayName = 'FantasyManager';

export default FantasyManager;