import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Users } from 'lucide-react';
import { WeeklyPerformanceIndicators } from '../WeeklyPerformanceIndicators';
import { getTeamName } from '@/utils/leagueDataUtils';

interface StandingsTabProps {
  rosters: any[];
  userMap: Record<string, any>;
  showBonusWins: boolean;
  setShowBonusWins: (show: boolean) => void;
  historicalLoading: boolean;
  historicalMatchups: any[];
  teamBonusWins: Record<number, number>;
  teamWeeklyData: any[];
  weeklyAverages: Record<number, number>;
  expandedTeamId: number | null;
  getTeamRecordWithBonus: (roster: any) => string;
  getTeamRecord: (roster: any) => string;
  handleTeamToggle: (rosterId: number) => void;
}

const StandingsTab: React.FC<StandingsTabProps> = ({
  rosters,
  userMap,
  showBonusWins,
  setShowBonusWins,
  historicalLoading,
  historicalMatchups,
  teamBonusWins,
  teamWeeklyData,
  weeklyAverages,
  expandedTeamId,
  getTeamRecordWithBonus,
  getTeamRecord,
  handleTeamToggle,
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <CardTitle className="text-lg">League Standings</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="bonus-wins-toggle" className="text-sm font-medium">
              Points-Based Bonus Wins
            </Label>
            <Switch
              id="bonus-wins-toggle"
              checked={showBonusWins}
              onCheckedChange={setShowBonusWins}
              disabled={historicalLoading || !historicalMatchups.length}
            />
          </div>
        </div>
        {showBonusWins && (
          <p className="text-sm text-muted-foreground mt-2">
            Teams earn bonus wins for scoring above the weekly league average
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rosters
            .sort((a, b) => {
              let aWins = a.settings?.wins || 0;
              let bWins = b.settings?.wins || 0;
              const aLosses = a.settings?.losses || 0;
              const bLosses = b.settings?.losses || 0;
              
              if (showBonusWins) {
                aWins += teamBonusWins[a.roster_id] || 0;
                bWins += teamBonusWins[b.roster_id] || 0;
              }
              
              const aWinPct = aWins + aLosses > 0 ? aWins / (aWins + aLosses) : 0;
              const bWinPct = bWins + bLosses > 0 ? bWins / (bWins + bLosses) : 0;
              
              if (aWinPct !== bWinPct) {
                return bWinPct - aWinPct;
              }
              
              const aPts = a.settings?.fpts || 0;
              const bPts = b.settings?.fpts || 0;
              return bPts - aPts;
            })
            .map((roster, index) => {
              const user = userMap[roster.owner_id];
              const teamName = getTeamName(user);
              const record = showBonusWins ? getTeamRecordWithBonus(roster) : getTeamRecord(roster);
              
              return (
                <div key={roster.roster_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-100 touch-manipulation">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className={`transition-all duration-300 ${
                        index === 0 ? 'scale-110 ring-2 ring-yellow-500' : 
                        index === 1 ? 'scale-105 ring-2 ring-gray-400' :
                        index === 2 ? 'scale-105 ring-2 ring-amber-600' : ''
                      }`}>
                        <AvatarImage 
                          src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined}
                          alt={`${teamName} avatar`}
                          loading="lazy"
                          decoding="async"
                        />
                        <AvatarFallback className="bg-primary/20 text-primary-foreground">
                          {teamName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        index === 0 ? 'bg-yellow-500 text-black' : 
                        index === 1 ? 'bg-gray-400 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' : 'bg-gray-700 text-white'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-white transition-colors duration-200">{teamName}</div>
                      <div className="text-sm text-gray-400 transition-colors duration-200">{user?.display_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-white transition-colors duration-200">{record}</div>
                    <div className="text-sm text-gray-400 transition-colors duration-200">
                      {roster.settings?.fpts?.toFixed(2) || '0.00'} pts
                    </div>
                    {showBonusWins && teamWeeklyData.length > 0 && (
                      <WeeklyPerformanceIndicators
                        weeklyData={teamWeeklyData.find(team => team.rosterId === roster.roster_id)?.weeklyPerformance || []}
                        weeklyAverages={weeklyAverages}
                        rosterId={roster.roster_id}
                        isExpanded={expandedTeamId === roster.roster_id}
                        onToggle={() => handleTeamToggle(roster.roster_id)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StandingsTab;
