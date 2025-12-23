import React, { memo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTeamRostersManager } from '@/hooks/useTeamRostersManager';
import MinimizableDeadCapManager from '@/components/MinimizableDeadCapManager';
import MinimizableContractCalculator from '@/components/MinimizableContractCalculator';
import MinimizableLeagueOptions from '@/components/MinimizableLeagueOptions';
import MinimizablePendingFreeAgents from '@/components/MinimizablePendingFreeAgents';
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
  const [showLeagueOptions, setShowLeagueOptions] = useState(false);
  
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

  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6">
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

        <Card>
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

        {showPendingFreeAgents && showSalaryFeatures && (
          <MinimizablePendingFreeAgents
            open={showPendingFreeAgents}
            onOpenChange={setShowPendingFreeAgents}
            leagueId={leagueId}
            rosters={rosters}
            userMap={userMap}
            players={players}
            salaries={salaries}
          />
        )}
      </div>
    </ErrorBoundary>
  );
});

TeamRosters.displayName = 'TeamRosters';

export default TeamRosters;