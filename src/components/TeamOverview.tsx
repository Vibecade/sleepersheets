
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Calendar, BarChart3 } from 'lucide-react';
import { useMatchups } from '@/hooks/useMatchups';
import { getTeamName } from '@/utils/leagueDataUtils';
import FunStatistics from './FunStatistics';

interface TeamOverviewProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  league,
  rosters,
  userMap,
  players
}) => {
  const [selectedWeek, setSelectedWeek] = useState(league?.settings?.leg || 1);
  const { matchups, loading: matchupsLoading } = useMatchups(league?.league_id, selectedWeek);

  // Group matchups by matchup_id
  const groupedMatchups = matchups.reduce((acc, matchup) => {
    if (!acc[matchup.matchup_id]) {
      acc[matchup.matchup_id] = [];
    }
    acc[matchup.matchup_id].push(matchup);
    return acc;
  }, {} as Record<number, typeof matchups>);

  const formatPoints = (points: number) => {
    return points?.toFixed(1) || '0.0';
  };

  const getRosterById = (rosterId: number) => {
    return rosters.find(r => r.roster_id === rosterId);
  };

  const getTeamRecord = (roster: any) => {
    const wins = roster.settings?.wins || 0;
    const losses = roster.settings?.losses || 0;
    const ties = roster.settings?.ties || 0;
    return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* League Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <CardTitle className="text-2xl">{league?.name}</CardTitle>
                <p className="text-gray-400">
                  {league?.season} Season • Week {league?.settings?.leg || 1}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {rosters.length} Teams
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="matchups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="matchups" className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Matchups</span>
          </TabsTrigger>
          <TabsTrigger value="standings" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Standings</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Fun Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matchups">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <CardTitle className="text-lg">Matchups</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="week-select" className="text-sm">Week:</Label>
                  <Input
                    id="week-select"
                    type="number"
                    min="1"
                    max="18"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="w-20 bg-gray-800/50 border-gray-600"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {matchupsLoading ? (
                <div className="text-center py-8 text-gray-400">
                  Loading matchups...
                </div>
              ) : Object.keys(groupedMatchups).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No matchups found for week {selectedWeek}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedMatchups).map(([matchupId, teams]) => {
                    if (teams.length < 2) return null;
                    
                    const team1 = teams[0];
                    const team2 = teams[1];
                    const roster1 = getRosterById(team1.roster_id);
                    const roster2 = getRosterById(team2.roster_id);
                    const user1 = userMap[roster1?.owner_id];
                    const user2 = userMap[roster2?.owner_id];

                    return (
                      <div key={matchupId} className="bg-white/5 rounded-lg p-4 border border-white/10 card-hover">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 text-center">
                            <div className="font-medium text-yellow-500">
                              {getTeamName(user1)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {getTeamRecord(roster1)}
                            </div>
                            <div className="text-lg font-bold text-yellow-400">
                              {formatPoints(team1.points)}
                            </div>
                          </div>
                          
                          <div className="px-4">
                            <div className="text-center text-gray-400 text-sm">VS</div>
                          </div>
                          
                          <div className="flex-1 text-center">
                            <div className="font-medium text-yellow-500">
                              {getTeamName(user2)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {getTeamRecord(roster2)}
                            </div>
                            <div className="text-lg font-bold text-yellow-400">
                              {formatPoints(team2.points)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standings">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <CardTitle className="text-lg">League Standings</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rosters
                  .sort((a, b) => {
                    const aWins = a.settings?.wins || 0;
                    const bWins = b.settings?.wins || 0;
                    const aLosses = a.settings?.losses || 0;
                    const bLosses = b.settings?.losses || 0;
                    
                    // Sort by win percentage
                    const aWinPct = aWins + aLosses > 0 ? aWins / (aWins + aLosses) : 0;
                    const bWinPct = bWins + bLosses > 0 ? bWins / (bWins + bLosses) : 0;
                    
                    return bWinPct - aWinPct;
                  })
                  .map((roster, index) => {
                    const user = userMap[roster.owner_id];
                    const teamName = getTeamName(user);
                    const record = getTeamRecord(roster);
                    
                    return (
                      <div key={roster.roster_id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 card-hover">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white">{teamName}</div>
                            <div className="text-sm text-gray-400">{user?.display_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white">{record}</div>
                          <div className="text-sm text-gray-400">
                            {roster.settings?.fpts?.toFixed(1) || '0.0'} pts
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <FunStatistics
            league={league}
            rosters={rosters}
            userMap={userMap}
            players={players}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamOverview;
