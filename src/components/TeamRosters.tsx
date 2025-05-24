
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Skull } from 'lucide-react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
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

  // Debounce salary cap updates - fixed to remove updateSettings dependency
  useEffect(() => {
    if (!localSalaryCap || !settings?.salary_cap) return;
    
    const newSalaryCap = Number(localSalaryCap);
    const currentSalaryCap = Number(settings.salary_cap);
    
    console.log('Salary cap comparison:', { newSalaryCap, currentSalaryCap, localSalaryCap });
    
    if (newSalaryCap > 0 && newSalaryCap !== currentSalaryCap) {
      const timeoutId = setTimeout(async () => {
        console.log('Updating salary cap to:', newSalaryCap);
        try {
          await updateSettings({ salary_cap: newSalaryCap });
          console.log('Salary cap update completed');
        } catch (error) {
          console.error('Failed to update salary cap:', error);
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [localSalaryCap, settings?.salary_cap, updateSettings]); // Now updateSettings is stable due to useCallback

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <div>
                <CardTitle>Team Rosters</CardTitle>
                <CardDescription className="text-sm sm:hidden">
                  Team overview and roster sizes
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSalaryFeatures(!showSalaryFeatures)}
                className="flex items-center space-x-2"
              >
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Salary Features</span>
                <span className="sm:hidden">Salaries</span>
              </Button>
              {deadCapEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeadCapManager(!showDeadCapManager)}
                  className="flex items-center space-x-2"
                >
                  <Skull className="w-4 h-4" />
                  <span className="hidden sm:inline">Dynasty Dead Cap</span>
                  <span className="sm:hidden">Dead Cap</span>
                </Button>
              )}
            </div>
          </div>
          
          <CardDescription className="hidden sm:block">
            Overview of all teams and their current roster sizes
            {showSalaryFeatures && ' with salary tracking'}
            {showDeadCapManager && ' and dead cap management'}
          </CardDescription>

          {showSalaryFeatures && (
            <SalarySettings
              localSalaryCap={localSalaryCap}
              setLocalSalaryCap={setLocalSalaryCap}
              salaryCap={salaryCap}
              deadCapEnabled={deadCapEnabled}
              onDeadCapEnabledChange={handleDeadCapEnabledChange}
              settingsLoading={settingsLoading}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
