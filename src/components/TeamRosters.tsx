
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { useToast } from '@/hooks/use-toast';
import { useSalaryCalculations } from '@/hooks/useSalaryCalculations';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import MinimizableDeadCapManager from '@/components/MinimizableDeadCapManager';
import MinimizableContractCalculator from '@/components/MinimizableContractCalculator';
import TeamRostersHeader from '@/components/TeamRostersHeader';
import TeamRostersGrid from '@/components/TeamRostersGrid';
import ErrorBoundary from '@/components/ErrorBoundary';

interface TeamRostersProps {
  rosters: any[];
  userMap: Record<string, any>;
  players?: Record<string, any>;
}

const TeamRosters: React.FC<TeamRostersProps> = ({ rosters, userMap, players = {} }) => {
  const [showSalaryFeatures, setShowSalaryFeatures] = useState(false);
  const [showDeadCapManager, setShowDeadCapManager] = useState(false);
  const [showFAAB, setShowFAAB] = useState(false);
  const [showContractCalculator, setShowContractCalculator] = useState(false);
  const [localSalaryCap, setLocalSalaryCap] = useState<string>('');
  const [localFaabCap, setLocalFaabCap] = useState<string>('');
  const [localReserveLimit, setLocalReserveLimit] = useState<string>('');
  const { toast } = useToast();

  // Get league ID from first roster
  const leagueId = rosters[0]?.league_id || '';
  
  // Load data with error boundaries
  const { salaries, getEffectiveSalary } = usePlayerSalaries(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);
  const { settings, updateSettings, loading: settingsLoading } = useLeagueSettings(leagueId);
  const { canModifyLeague } = useLeagueOwnership();

  // Check if current user can modify this league
  const canModify = canModifyLeague(leagueId);

  // Calculate team salaries and dead caps using optimized hook
  const { teamSalaries, teamDeadCaps } = useSalaryCalculations({
    rosters,
    salaries,
    deadCapPlayers,
    getEffectiveSalary
  });

  // Calculate FAAB for teams
  const { teamFAAB } = useFAABCalculations({ rosters, leagueId });

  // Update local values when settings change
  useEffect(() => {
    if (settings?.salary_cap) {
      setLocalSalaryCap(settings.salary_cap.toString());
    }
    if (settings?.faab_cap !== null && settings?.faab_cap !== undefined) {
      setLocalFaabCap(settings.faab_cap.toString());
    } else {
      setLocalFaabCap('100'); // Default FAAB cap
    }
    if (settings?.reserve_limit !== null && settings?.reserve_limit !== undefined) {
      setLocalReserveLimit(settings.reserve_limit.toString());
    } else {
      setLocalReserveLimit('100'); // Default reserve limit
    }
  }, [settings]);

  const handleSalaryCapSave = async () => {
    if (!canModify) {
      toast({
        title: "Access Denied",
        description: "You must claim this league to modify settings",
        variant: "destructive"
      });
      return;
    }

    if (!localSalaryCap) {
      toast({
        title: "Error",
        description: "Please enter a valid salary cap amount",
        variant: "destructive"
      });
      return;
    }
    
    const newSalaryCap = Number(localSalaryCap);
    
    if (newSalaryCap <= 0) {
      toast({
        title: "Error",
        description: "Salary cap must be greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateSettings({ salary_cap: newSalaryCap });
      toast({
        title: "Success!",
        description: `Salary cap updated to $${newSalaryCap.toLocaleString()}`,
      });
    } catch (error) {
      console.error('Failed to update salary cap:', error);
      toast({
        title: "Error",
        description: "Failed to update salary cap",
        variant: "destructive"
      });
    }
  };

  const handleFaabSettingsSave = async () => {
    if (!canModify) {
      toast({
        title: "Access Denied",
        description: "You must claim this league to modify settings",
        variant: "destructive"
      });
      return;
    }

    if (!localFaabCap || !localReserveLimit) {
      toast({
        title: "Error",
        description: "Please enter valid FAAB settings",
        variant: "destructive"
      });
      return;
    }
    
    const newFaabCap = Number(localFaabCap);
    const newReserveLimit = Number(localReserveLimit);
    
    if (newFaabCap <= 0 || newReserveLimit < 0) {
      toast({
        title: "Error",
        description: "FAAB cap must be greater than 0 and reserve limit cannot be negative",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateSettings({ 
        faab_cap: newFaabCap,
        reserve_limit: newReserveLimit
      });
      toast({
        title: "Success!",
        description: `FAAB settings updated: Cap $${newFaabCap}, Reserve $${newReserveLimit}`,
      });
    } catch (error) {
      console.error('Failed to update FAAB settings:', error);
      toast({
        title: "Error",
        description: "Failed to update FAAB settings",
        variant: "destructive"
      });
    }
  };

  const handleDeadCapEnabledChange = async (enabled: boolean) => {
    if (!canModify) {
      toast({
        title: "Access Denied",
        description: "You must claim this league to modify settings",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateSettings({ dead_cap_enabled: enabled });
    } catch (error) {
      console.error('Failed to update dead cap setting:', error);
      toast({
        title: "Error",
        description: "Failed to update dead cap setting",
        variant: "destructive"
      });
    }
  };

  const salaryCap = settings?.salary_cap || 200000;
  const deadCapEnabled = settings?.dead_cap_enabled ?? true;
  const faabCap = settings?.faab_cap || 100;
  const reserveLimit = settings?.reserve_limit || 100;

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

        <MinimizableDeadCapManager
          open={showDeadCapManager && deadCapEnabled}
          onOpenChange={setShowDeadCapManager}
          leagueId={leagueId}
          rosters={rosters}
          userMap={userMap}
          players={players}
        />

        <MinimizableContractCalculator
          open={showContractCalculator}
          onOpenChange={setShowContractCalculator}
          leagueId={leagueId}
          players={players}
        />
      </div>
    </ErrorBoundary>
  );
};

export default TeamRosters;
