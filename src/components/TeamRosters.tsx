
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useToast } from '@/hooks/use-toast';
import { useSalaryCalculations } from '@/hooks/useSalaryCalculations';
import DeadCapManager from '@/components/DeadCapManager';
import TeamRostersHeader from '@/components/TeamRostersHeader';
import TeamRostersGrid from '@/components/TeamRostersGrid';

interface TeamRostersProps {
  rosters: any[];
  userMap: Record<string, any>;
  players?: Record<string, any>;
}

const TeamRosters: React.FC<TeamRostersProps> = ({ rosters, userMap, players = {} }) => {
  const [showSalaryFeatures, setShowSalaryFeatures] = useState(false);
  const [showDeadCapManager, setShowDeadCapManager] = useState(false);
  const [localSalaryCap, setLocalSalaryCap] = useState<string>('');
  const { toast } = useToast();

  // Get league ID from first roster (assuming all rosters are from same league)
  const leagueId = rosters[0]?.league_id || '';
  const { salaries } = usePlayerSalaries(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);
  const { settings, updateSettings, loading: settingsLoading } = useLeagueSettings(leagueId);

  // Calculate team salaries and dead caps using the new hook
  const { teamSalaries, teamDeadCaps } = useSalaryCalculations({
    rosters,
    salaries,
    deadCapPlayers
  });

  // Update local salary cap when settings change
  useEffect(() => {
    if (settings?.salary_cap) {
      setLocalSalaryCap(settings.salary_cap.toString());
    }
  }, [settings?.salary_cap]);

  const handleSalaryCapSave = async () => {
    console.log('Manual save triggered with value:', localSalaryCap);
    
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
    
    console.log('Saving salary cap:', newSalaryCap);
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

  const handleDeadCapEnabledChange = async (enabled: boolean) => {
    await updateSettings({ dead_cap_enabled: enabled });
  };

  const salaryCap = settings?.salary_cap || 200000;
  const deadCapEnabled = settings?.dead_cap_enabled ?? true;

  return (
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
        />
        
        <TeamRostersGrid
          rosters={rosters}
          userMap={userMap}
          showSalaryFeatures={showSalaryFeatures}
          deadCapEnabled={deadCapEnabled}
          teamSalaries={teamSalaries}
          teamDeadCaps={teamDeadCaps}
          salaryCap={salaryCap}
        />
      </Card>

      {showDeadCapManager && deadCapEnabled && (
        <DeadCapManager
          leagueId={leagueId}
          rosters={rosters}
          userMap={userMap}
          players={players}
        />
      )}
    </div>
  );
};

export default TeamRosters;
