import React, { memo, useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTeamRostersManager } from '@/hooks/useTeamRostersManager';
import ScrollableModal from '@/components/ScrollableModal';
import DeadCapManager from '@/components/DeadCapManager';
import ContractDeadCapCalculator from '@/components/ContractDeadCapCalculator';
import MinimizableLeagueOptions from '@/components/MinimizableLeagueOptions';
import MinimizablePendingFreeAgents from '@/components/MinimizablePendingFreeAgents';
import TeamRostersHeader from '@/components/TeamRostersHeader';
import TeamRostersGrid from '@/components/TeamRostersGrid';
import ErrorBoundaryWithRetry from '@/components/ErrorBoundaryWithRetry';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface TeamRostersProps {
  rosters: any[];
  userMap: Record<string, any>;
  players?: Record<string, any>;
  transactions?: any[];
}

const TeamRosters: React.FC<TeamRostersProps> = memo(({ rosters, userMap, players = {}, transactions = [] }) => {
  const [showLeagueOptions, setShowLeagueOptions] = useState(false);
  const [showTeamGrid, setShowTeamGrid] = useState(false);
  const [hasHydratedRostersState, setHasHydratedRostersState] = useState(false);
  
  const {
    leagueId,
    showSalaryFeatures,
    setShowSalaryFeatures,
    showDeadCapManager,
    setShowDeadCapManager,
    showFAAB,
    setShowFAAB,
    showContractCalculator,
    setShowContractCalculator,
    showPendingFreeAgents,
    setShowPendingFreeAgents,
    localSalaryCap,
    setLocalSalaryCap,
    localFaabCap,
    setLocalFaabCap,
    localReserveLimit,
    setLocalReserveLimit,
    settingsLoading,
    handleSalaryCapSave,
    handleFaabSettingsSave,
    handleDeadCapEnabledChange,
    teamSalaries,
    teamDeadCaps,
    teamFAAB,
    salaryCap,
    deadCapEnabled,
    faabCap,
    reserveLimit,
    canModify,
    salaries,
  } = useTeamRostersManager({ rosters, transactions });
  const rosterStorageKey = useMemo(
    () => (leagueId ? `sleepersheets:league-ui:${leagueId}:team-rosters` : null),
    [leagueId]
  );

  useEffect(() => {
    setHasHydratedRostersState(false);
    if (!rosterStorageKey || typeof window === 'undefined') {
      setHasHydratedRostersState(true);
      return;
    }

    try {
      const storedState = localStorage.getItem(rosterStorageKey);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        if (typeof parsed.showLeagueOptions === 'boolean') {
          setShowLeagueOptions(parsed.showLeagueOptions);
        }
        if (typeof parsed.showTeamGrid === 'boolean') {
          setShowTeamGrid(parsed.showTeamGrid);
        }
      }
    } catch {
      // Ignore malformed local storage and fallback to defaults.
    } finally {
      setHasHydratedRostersState(true);
    }
  }, [rosterStorageKey]);

  useEffect(() => {
    if (!hasHydratedRostersState || !rosterStorageKey || typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(
      rosterStorageKey,
      JSON.stringify({
        showLeagueOptions,
        showTeamGrid,
      })
    );
  }, [hasHydratedRostersState, rosterStorageKey, showLeagueOptions, showTeamGrid]);

  return (
    <ErrorBoundaryWithRetry fallbackMessage="Failed to load team rosters">
      <div className="section-stack">
        <MinimizableLeagueOptions
          open={showLeagueOptions}
          onOpenChange={setShowLeagueOptions}
          showSalaryFeatures={showSalaryFeatures}
          showFAAB={showFAAB}
          onToggleSalaryFeatures={() => setShowSalaryFeatures(!showSalaryFeatures)}
          onToggleFAAB={() => setShowFAAB(!showFAAB)}
          localSalaryCap={localSalaryCap}
          setLocalSalaryCap={setLocalSalaryCap}
          salaryCap={salaryCap}
          deadCapEnabled={deadCapEnabled}
          onDeadCapEnabledChange={handleDeadCapEnabledChange}
          settingsLoading={settingsLoading}
          onSalaryCapSave={handleSalaryCapSave}
          faabCap={faabCap}
          reserveLimit={reserveLimit}
          localFaabCap={localFaabCap}
          localReserveLimit={localReserveLimit}
          setLocalFaabCap={setLocalFaabCap}
          setLocalReserveLimit={setLocalReserveLimit}
          onFaabSettingsSave={handleFaabSettingsSave}
          canModifyLeague={canModify}
        />

        {!showSalaryFeatures && (
          <Card className="border-border/50 bg-card/40">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Salary tools are currently hidden.</p>
                  <p className="text-sm text-muted-foreground">Enable salary features to view cap tracking, dead cap, and contract tools.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowSalaryFeatures(true);
                    setShowLeagueOptions(true);
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enable Salary Features
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Card className="border-border/50">
          <TeamRostersHeader
            showDeadCapManager={showDeadCapManager}
            deadCapEnabled={deadCapEnabled}
            onToggleDeadCapManager={() => setShowDeadCapManager(!showDeadCapManager)}
            showContractCalculator={showContractCalculator}
            onToggleContractCalculator={() => setShowContractCalculator(!showContractCalculator)}
            showPendingFreeAgents={showPendingFreeAgents}
            onTogglePendingFreeAgents={() => setShowPendingFreeAgents(!showPendingFreeAgents)}
            showSalaryFeatures={showSalaryFeatures}
            canModifyLeague={canModify}
            showTeamGrid={showTeamGrid}
            onToggleTeamGrid={() => setShowTeamGrid(!showTeamGrid)}
            teamCount={rosters.length}
          />

          {showTeamGrid ? (
            <TeamRostersGrid
              rosters={rosters}
              userMap={userMap}
              showSalaryFeatures={showSalaryFeatures}
              deadCapEnabled={deadCapEnabled}
              teamSalaries={teamSalaries}
              teamDeadCaps={teamDeadCaps}
              salaryCap={salaryCap}
              teamFAAB={teamFAAB}
              showFAAB={showFAAB}
              canModifyLeague={canModify}
            />
          ) : (
            <div className="px-6 pb-5 text-sm text-muted-foreground space-y-3">
              <p>
                Team cards are hidden to keep this page compact. Use <span className="text-foreground font-medium">Show Teams</span> to expand.
              </p>
              <Button size="sm" onClick={() => setShowTeamGrid(true)}>
                Show Teams
              </Button>
            </div>
          )}
        </Card>

        {showDeadCapManager && deadCapEnabled && (
          <ScrollableModal
            open
            onOpenChange={setShowDeadCapManager}
            title="Dynasty Dead Cap Manager"
            maxHeight="85vh"
          >
            <DeadCapManager
              leagueId={leagueId}
              rosters={rosters}
              userMap={userMap}
              players={players}
            />
          </ScrollableModal>
        )}

        {showContractCalculator && (
          <ScrollableModal
            open
            onOpenChange={setShowContractCalculator}
            title="Contract Dead Cap Calculator"
            maxHeight="85vh"
          >
            <ContractDeadCapCalculator
              leagueId={leagueId}
              players={players}
            />
          </ScrollableModal>
        )}

        {showPendingFreeAgents && showSalaryFeatures && (
          <MinimizablePendingFreeAgents
            open={showPendingFreeAgents}
            onOpenChange={setShowPendingFreeAgents}
            leagueId={leagueId}
            rosters={rosters}
            userMap={userMap}
            players={players}
            salaries={salaries}
            salaryCap={salaryCap}
            teamSalaries={teamSalaries}
          />
        )}
      </div>
    </ErrorBoundaryWithRetry>
  );
});

TeamRosters.displayName = 'TeamRosters';

export default TeamRosters;
