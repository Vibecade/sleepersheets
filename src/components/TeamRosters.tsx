import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { useTeamRostersManager } from '@/hooks/useTeamRostersManager';
import MinimizableDeadCapManager from '@/components/MinimizableDeadCapManager';
import MinimizableContractCalculator from '@/components/MinimizableContractCalculator';
import TeamRostersHeader from '@/components/TeamRostersHeader';
import TeamRostersGrid from '@/components/TeamRostersGrid';
import ErrorBoundary from '@/components/ErrorBoundary';

interface TeamRostersProps {
  rosters: any[];
  userMap: Record<string, any>;
  players?: Record<string, any>;
  transactions?: any[];
}

const TeamRosters: React.FC<TeamRostersProps> = memo(({ rosters, userMap, players = {}, transactions = [] }) => {
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
  } = useTeamRostersManager({ rosters, transactions });

  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6">
        <Card>
          <TeamRostersHeader
            showSalaryFeatures={showSalaryFeatures}
            showDeadCapManager={showDeadCapManager}
            deadCapEnabled={deadCapEnabled}
            onToggleSalaryFeatures={() => setShowSalaryFeatures(!showSalaryFeatures)}
            onToggleDeadCapManager={() => setShowDeadCapManager(!showDeadCapManager)}
            localSalaryCap={localSalaryCap}
            setLocalSalaryCap={setLocalSalaryCap}
            salaryCap={salaryCap}
            onDeadCapEnabledChange={handleDeadCapEnabledChange}
            settingsLoading={settingsLoading}
            onSalaryCapSave={handleSalaryCapSave}
            showFAAB={showFAAB}
            onToggleFAAB={() => setShowFAAB(!showFAAB)}
            showContractCalculator={showContractCalculator}
            onToggleContractCalculator={() => setShowContractCalculator(!showContractCalculator)}
            faabCap={faabCap}
            reserveLimit={reserveLimit}
            localFaabCap={localFaabCap}
            localReserveLimit={localReserveLimit}
            setLocalFaabCap={setLocalFaabCap}
            setLocalReserveLimit={setLocalReserveLimit}
            onFaabSettingsSave={handleFaabSettingsSave}
            canModifyLeague={canModify}
          />
          
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
        </Card>

        {showDeadCapManager && deadCapEnabled && (
          <MinimizableDeadCapManager
            open={showDeadCapManager && deadCapEnabled}
            onOpenChange={setShowDeadCapManager}
            leagueId={leagueId}
            rosters={rosters}
            userMap={userMap}
            players={players}
          />
        )}

        {showContractCalculator && (
          <MinimizableContractCalculator
            open={showContractCalculator}
            onOpenChange={setShowContractCalculator}
            leagueId={leagueId}
            players={players}
          />
        )}
      </div>
    </ErrorBoundary>
  );
});

TeamRosters.displayName = 'TeamRosters';

export default TeamRosters;