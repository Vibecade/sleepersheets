import React, { memo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import TeamRosters from './TeamRosters';
import TradeSimulator from './TradeSimulator';
import MinimizableDataDashboard from './MinimizableDataDashboard';
import EnhancedTradeSimulator from './EnhancedTradeSimulator';
import PlayerSearch from './PlayerSearch';
import ProTierUpgrade from './ProTierUpgrade';
import MinimizableFAABContractManager from './MinimizableFAABContractManager';
import { AnalyticsAccordion } from './analytics/AnalyticsAccordion';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';

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
  const { salaries } = usePlayerSalaries(league.league_id);
  const { contracts } = usePlayerContracts(league.league_id);
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
        players={players}
        leagueId={league.league_id}
        salaries={salaries}
        contracts={contracts}
      />

      {/* FAAB Contract Manager */}
      <MinimizableFAABContractManager
        transactions={transactions}
        players={players}
        userMap={userMap}
        rosters={rosters}
        leagueId={league.league_id}
      />

      {/* Team Rosters with all advanced features */}
      <TeamRosters
        rosters={rosters}
        userMap={userMap}
        players={players}
        transactions={transactions}
      />

      {/* Enhanced Trade Simulator */}
      <EnhancedTradeSimulator
        league={league}
        rosters={rosters}
        userMap={userMap}
        players={players}
      />

      {/* Minimizable Data Dashboard */}
      <MinimizableDataDashboard
        league={league}
        rosters={rosters}
        userMap={userMap}
        rosterUserMap={rosterUserMap}
        players={players}
        transactions={transactions}
        draftPicks={draftPicks}
      />

      {/* Advanced Analytics Accordion */}
      <AnalyticsAccordion />
    </div>
  );
});

FantasyManager.displayName = 'FantasyManager';

export default FantasyManager;