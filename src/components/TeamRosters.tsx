import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Users, DollarSign, Settings, Skull } from 'lucide-react';
import { getPlayerCount, getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useToast } from '@/hooks/use-toast';
import DeadCapManager from '@/components/DeadCapManager';

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

  // Debounce salary cap updates
  useEffect(() => {
    if (localSalaryCap && settings?.salary_cap && localSalaryCap !== settings.salary_cap.toString()) {
      const timeoutId = setTimeout(() => {
        const newSalaryCap = Number(localSalaryCap);
        if (newSalaryCap > 0 && newSalaryCap !== settings.salary_cap) {
          handleSalaryCapChange(newSalaryCap);
        }
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [localSalaryCap, settings?.salary_cap]);

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

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getSalaryCapStatus = (teamSalary: number, deadCap: number = 0) => {
    const salaryCap = settings?.salary_cap || 200000;
    const totalSalary = teamSalary + deadCap;
    const percentage = (totalSalary / salaryCap) * 100;
    if (percentage > 100) return { color: 'text-red-400', bg: 'bg-red-500/10', status: 'Over Cap' };
    if (percentage > 90) return { color: 'text-amber-400', bg: 'bg-amber-500/10', status: 'Near Cap' };
    return { color: 'text-green-400', bg: 'bg-green-500/10', status: 'Under Cap' };
  };

  const handleSalaryCapChange = async (newSalaryCap: number) => {
    await updateSettings({ salary_cap: newSalaryCap });
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

          {showSalaryFeatures && !settingsLoading && (
            <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <label className="text-sm font-medium text-blue-200">Salary Cap:</label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300">$</span>
                  <Input
                    type="number"
                    value={localSalaryCap}
                    onChange={(e) => setLocalSalaryCap(e.target.value)}
                    className="w-32 h-8 bg-white/10 border-white/20 text-white"
                    placeholder="200000"
                  />
                </div>
                <Badge variant="outline" className="text-white border-white/20">
                  Cap: {formatSalary(salaryCap)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Skull className="w-4 h-4 text-red-400" />
                  <label className="text-sm font-medium text-red-200">Enable Dead Cap:</label>
                </div>
                <Switch
                  checked={deadCapEnabled}
                  onCheckedChange={handleDeadCapEnabledChange}
                />
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rosters.map((roster) => {
              const user = userMap[roster.owner_id];
              const playerCounts = getPlayerCount(roster);
              const teamName = getTeamName(user);
              const teamSalary = calculateTeamSalary(roster);
              const teamDeadCap = deadCapEnabled ? calculateTeamDeadCap(roster.roster_id) : 0;
              const salaryStatus = getSalaryCapStatus(teamSalary, teamDeadCap);
              
              return (
                <div key={roster.roster_id} className="glass-card rounded-lg p-3 sm:p-4 space-y-3 hover-lift">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                      <AvatarImage 
                        src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-green-600 text-white font-semibold text-xs sm:text-sm">
                        {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white truncate text-sm sm:text-base">{teamName}</h4>
                      <p className="text-xs sm:text-sm text-gray-300 truncate">{user?.display_name || 'Unknown Manager'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Record:</span>
                        <Badge variant="outline" className="text-white border-white/20 text-xs">
                          {roster.settings?.wins || 0}-{roster.settings?.losses || 0}-{roster.settings?.ties || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Points:</span>
                        <span className="font-medium text-emerald-400 text-xs sm:text-sm">
                          {roster.settings?.fpts?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                    </div>

                    {(showSalaryFeatures && (teamSalary > 0 || (deadCapEnabled && teamDeadCap > 0))) && (
                      <>
                        <Separator className="bg-white/10" />
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-xs sm:text-sm">Active Salary:</span>
                            <span className={`font-medium text-xs sm:text-sm text-emerald-400`}>
                              {formatSalary(teamSalary)}
                            </span>
                          </div>
                          {deadCapEnabled && teamDeadCap > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300 text-xs sm:text-sm">Dead Cap:</span>
                              <span className="font-medium text-xs sm:text-sm text-red-400">
                                {formatSalary(teamDeadCap)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-xs sm:text-sm">Total:</span>
                            <span className={`font-medium text-xs sm:text-sm ${salaryStatus.color}`}>
                              {formatSalary(teamSalary + teamDeadCap)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-xs">Status:</span>
                            <Badge variant="outline" className={`${salaryStatus.bg} ${salaryStatus.color} border-current text-xs`}>
                              {salaryStatus.status}
                            </Badge>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <Separator className="bg-white/10" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-300">Active:</span>
                        <span className="font-medium text-white">{playerCounts.active}</span>
                      </div>
                      {playerCounts.taxi > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-300">Taxi:</span>
                          <span className="font-medium text-white">{playerCounts.taxi}</span>
                        </div>
                      )}
                      {playerCounts.reserve > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-300">Reserve:</span>
                          <span className="font-medium text-white">{playerCounts.reserve}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs sm:text-sm font-medium border-t border-white/10 pt-1">
                        <span className="text-gray-200">Total:</span>
                        <span className="text-emerald-400">{playerCounts.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
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
