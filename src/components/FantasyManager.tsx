import React, { memo, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, ChevronDown, ChevronUp, Users, ArrowLeftRight } from 'lucide-react';
import MinimizableDataDashboard from './MinimizableDataDashboard';
import PlayerSearch from './PlayerSearch';
import MinimizableFAABContractManager from './MinimizableFAABContractManager';
import RosterInsightsCard from './roster/RosterInsightsCard';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FantasyManagerProps {
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  league: any;
  transactions: any[];
  draftPicks: any[];
}

const LazyTeamRosters = lazy(() => import('./TeamRosters'));
const LazyEnhancedTradeSimulator = lazy(() => import('./EnhancedTradeSimulator'));
const LazyAnalyticsAccordion = lazy(() => import('./analytics/AnalyticsAccordion'));

const SectionFallback: React.FC = () => (
  <div className="px-6 py-5 text-sm text-muted-foreground">Loading section...</div>
);

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
  const [showTeamRosters, setShowTeamRosters] = useState(false);
  const [showTradeSimulator, setShowTradeSimulator] = useState(false);
  const [hasHydratedManagerState, setHasHydratedManagerState] = useState(false);
  const { salaries } = usePlayerSalaries(league.league_id);
  const { contracts } = usePlayerContracts(league.league_id);
  const managerStorageKey = useMemo(
    () => (league?.league_id ? `sleepersheets:league-ui:${league.league_id}:manager` : null),
    [league?.league_id]
  );

  useEffect(() => {
    setHasHydratedManagerState(false);
    if (!managerStorageKey || typeof window === 'undefined') {
      setHasHydratedManagerState(true);
      return;
    }

    try {
      const storedState = localStorage.getItem(managerStorageKey);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        if (typeof parsed.showTeamRosters === 'boolean') {
          setShowTeamRosters(parsed.showTeamRosters);
        }
        if (typeof parsed.showTradeSimulator === 'boolean') {
          setShowTradeSimulator(parsed.showTradeSimulator);
        }
      }
    } catch {
      // Ignore malformed local storage and fallback to defaults.
    } finally {
      setHasHydratedManagerState(true);
    }
  }, [managerStorageKey]);

  useEffect(() => {
    if (!hasHydratedManagerState || !managerStorageKey || typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(
      managerStorageKey,
      JSON.stringify({
        showTeamRosters,
        showTradeSimulator,
      })
    );
  }, [hasHydratedManagerState, managerStorageKey, showTeamRosters, showTradeSimulator]);

  return (
    <div className="section-stack">
      <div className="glass-card rounded-xl border border-border/50 p-4 section-sticky-header">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-blue-500" />
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Fantasy Manager</h2>
            <p className="text-sm text-muted-foreground">
              Salary, contracts, FAAB, rosters, trades, and analytics in one workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Owner-only roster insights — renders nothing if the signed-in Sleeper user
          doesn't own a roster in this league. */}
      <RosterInsightsCard />

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

      <Collapsible open={showTeamRosters} onOpenChange={setShowTeamRosters}>
        <Card className="border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 section-sticky-header">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Team Rosters & Tools
                </span>
                {showTeamRosters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              {showTeamRosters && (
                <Suspense fallback={<SectionFallback />}>
                  <LazyTeamRosters
                    rosters={rosters}
                    userMap={userMap}
                    players={players}
                    transactions={transactions}
                  />
                </Suspense>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible open={showTradeSimulator} onOpenChange={setShowTradeSimulator}>
        <Card className="border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 section-sticky-header">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4 text-blue-400" />
                  Trade Simulator
                </span>
                {showTradeSimulator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              {showTradeSimulator && (
                <Suspense fallback={<SectionFallback />}>
                  <LazyEnhancedTradeSimulator
                    league={league}
                    rosters={rosters}
                    userMap={userMap}
                    players={players}
                  />
                </Suspense>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
      <Suspense fallback={<SectionFallback />}>
        <LazyAnalyticsAccordion />
      </Suspense>
    </div>
  );
});

FantasyManager.displayName = 'FantasyManager';

export default FantasyManager;
