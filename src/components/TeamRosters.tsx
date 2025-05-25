import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Skull } from 'lucide-react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useToast } from '@/hooks/use-toast';
import DeadCapManager from '@/components/DeadCapManager';
import TeamRosterCard from '@/components/TeamRosterCard';
import SalarySettings from '@/components/SalarySettings';

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

  // Remove the debounced auto-save useEffect to avoid conflicts
  // The manual save button will handle all saves

  const calculateTeamSalary = (roster: any) => {
    const allPlayerIds = [
      ...(roster.players || []),
      ...(roster.taxi || []),
      ...(roster.reserve || [])
    ];
    
    return allPlayerIds.reduce((total, playerId) => {
      const salary = salaries[playerId];
      return total + (salary || 0);
    }, 0);
  };

  const calculateTeamDeadCap = (rosterId: number) => {
    return deadCapPlayers
      .filter(player => player.roster_id === rosterId)
      .reduce((total, player) => total + (player.salary || 0), 0);
  };

  const handleDeadCapEnabledChange = async (enabled: boolean) => {
    await updateSettings({ dead_cap_enabled: enabled });
  };

  const salaryCap = settings?.salary_cap || 200000;
  const deadCapEnabled = settings?.dead_cap_enabled ?? true;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex flex-col space-y-3 sm:space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 flex-shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-lg sm:text-xl">Team Rosters</CardTitle>
                  <CardDescription className="text-sm">
                    Team overview and roster sizes
                    {showSalaryFeatures && ' with salary tracking'}
                    {showDeadCapManager && ' and dead cap management'}
                  </CardDescription>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col xs:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSalaryFeatures(!showSalaryFeatures)}
                className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
              >
                <DollarSign className="w-4 h-4" />
                <span>Salary Features</span>
              </Button>
              {deadCapEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeadCapManager(!showDeadCapManager)}
                  className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
                >
                  <Skull className="w-4 h-4" />
                  <span>Dynasty Dead Cap</span>
                </Button>
              )}
            </div>
          </div>

          {showSalaryFeatures && (
            <div className="pt-3 sm:pt-4 border-t border-white/10">
              <SalarySettings
                localSalaryCap={localSalaryCap}
                setLocalSalaryCap={setLocalSalaryCap}
                salaryCap={salaryCap}
                deadCapEnabled={deadCapEnabled}
                onDeadCapEnabledChange={handleDeadCapEnabledChange}
                settingsLoading={settingsLoading}
                onSalaryCapSave={handleSalaryCapSave}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {rosters.map((roster) => {
              const user = userMap[roster.owner_id];
              const teamSalary = calculateTeamSalary(roster);
              const teamDeadCap = deadCapEnabled ? calculateTeamDeadCap(roster.roster_id) : 0;
              
              return (
                <TeamRosterCard
                  key={roster.roster_id}
                  roster={roster}
                  user={user}
                  showSalaryFeatures={showSalaryFeatures}
                  deadCapEnabled={deadCapEnabled}
                  teamSalary={teamSalary}
                  teamDeadCap={teamDeadCap}
                  salaryCap={salaryCap}
                />
              );
            })}
          </div>
        </CardContent>
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
