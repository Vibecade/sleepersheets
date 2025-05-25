
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
import ErrorBoundary from '@/components/ErrorBoundary';

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

  // Get league ID from first roster
  const leagueId = rosters[0]?.league_id || '';
  
  // Load data with error boundaries
  const { salaries } = usePlayerSalaries(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);
  const { settings, updateSettings, loading: settingsLoading } = useLeagueSettings(leagueId);

  // Calculate team salaries and dead caps using optimized hook
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

  const handleDeadCapEnabledChange = async (enabled: boolean) => {
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
          <ErrorBoundary>
            <DeadCapManager
              leagueId={leagueId}
              rosters={rosters}
              userMap={userMap}
              players={players}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default TeamRosters;
