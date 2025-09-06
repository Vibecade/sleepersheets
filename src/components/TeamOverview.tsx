import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Calendar, Activity, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { useMatchups } from '@/hooks/useMatchups';
import { useHistoricalProjections } from '@/hooks/useHistoricalProjections';
import { ProjectedPointsDisplay } from './ProjectedPointsDisplay';
import { getTeamName } from '@/utils/leagueDataUtils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import FunStatistics from './FunStatistics';
import TransactionsList from './TransactionsList';

interface TeamOverviewProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  transactions?: any[];
  onResyncData?: () => void;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  league,
  rosters,
  userMap,
  players,
  transactions = [],
  onResyncData
}) => {
  const [selectedWeek, setSelectedWeek] = useState(league?.settings?.leg || 1);
  const { matchups, loading: matchupsLoading, getCurrentNFLWeek } = useMatchups(league?.league_id, selectedWeek);
  
  // Get projections for current week
  const currentWeek = getCurrentNFLWeek();
  const { projections, loading: projectionsLoading } = useHistoricalProjections(
    league?.league_id || '',
    currentWeek
  );

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
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <CardTitle className="text-2xl transition-colors duration-200">{league?.name}</CardTitle>
                <p className="text-gray-400 transition-colors duration-200">
                  {league?.season} Season • Week {league?.settings?.leg || 1}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {onResyncData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResyncData}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-sync Data
                </Button>
              )}
              <Badge variant="outline" className="text-green-400 border-green-400 transition-all duration-200 hover:bg-green-400/10">
                {rosters.length} Teams
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="matchups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 transition-all duration-200">
          <TabsTrigger value="matchups" className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80">
            <Calendar className="w-4 h-4" />
            <span>Matchups</span>
          </TabsTrigger>
          <TabsTrigger value="standings" className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80">
            <Users className="w-4 h-4" />
            <span>Standings</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80">
            <Activity className="w-4 h-4" />
            <span>Fun Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matchups" className="animate-fade-in">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <CardTitle className="text-lg">Matchups</CardTitle>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="week-select" className="text-sm">Week:</Label>
                    <Input
                      id="week-select"
                      type="number"
                      min="1"
                      max="18"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(Number(e.target.value))}
                      className="w-20 bg-gray-800/50 border-gray-600 transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {matchupsLoading && <LoadingSpinner size="sm" />}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {matchupsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} showHeader={false} lines={2} />
                  ))}
                </div>
              ) : Object.keys(groupedMatchups).length === 0 ? (
                <div className="text-center py-12 text-gray-400 transition-opacity duration-300">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No matchups found for week {selectedWeek}</p>
                  <p className="text-sm">Try selecting a different week</p>
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
                    const team1Winning = team1.points > team2.points;

                    return (
                      <div key={matchupId} className="bg-white/5 rounded-lg p-6 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]">
                         <div className="flex items-center justify-between">
                           <div className={`flex-1 text-center transition-all duration-300 ${team1Winning ? 'transform scale-105' : ''}`}>
                             <div className={`font-medium ${team1Winning ? 'text-green-400' : 'text-yellow-500'} transition-colors duration-300`}>
                               {getTeamName(user1)}
                             </div>
                             <div className="text-sm text-gray-400 mb-2 transition-colors duration-200">
                               {getTeamRecord(roster1)}
                             </div>
                             <div className={`text-2xl font-bold transition-all duration-300 ${team1Winning ? 'text-green-300 scale-110' : 'text-yellow-400'}`}>
                               {formatPoints(team1.points)}
                             </div>
                             {!projectionsLoading && projections[team1.roster_id] && selectedWeek >= currentWeek && (
                               <div className="mt-2">
                                 <ProjectedPointsDisplay 
                                   projection={projections[team1.roster_id]}
                                   actualPoints={selectedWeek === currentWeek ? team1.points : undefined}
                                   showActual={selectedWeek === currentWeek}
                                   size="sm"
                                 />
                               </div>
                             )}
                           </div>
                          
                          <div className="px-6">
                            <div className="text-center text-gray-400 text-sm font-medium">VS</div>
                          </div>
                          
                           <div className={`flex-1 text-center transition-all duration-300 ${!team1Winning ? 'transform scale-105' : ''}`}>
                             <div className={`font-medium ${!team1Winning ? 'text-green-400' : 'text-yellow-500'} transition-colors duration-300`}>
                               {getTeamName(user2)}
                             </div>
                             <div className="text-sm text-gray-400 mb-2 transition-colors duration-200">
                               {getTeamRecord(roster2)}
                             </div>
                             <div className={`text-2xl font-bold transition-all duration-300 ${!team1Winning ? 'text-green-300 scale-110' : 'text-yellow-400'}`}>
                               {formatPoints(team2.points)}
                             </div>
                             {!projectionsLoading && projections[team2.roster_id] && selectedWeek >= currentWeek && (
                               <div className="mt-2">
                                 <ProjectedPointsDisplay 
                                   projection={projections[team2.roster_id]}
                                   actualPoints={selectedWeek === currentWeek ? team2.points : undefined}
                                   showActual={selectedWeek === currentWeek}
                                   size="sm"
                                 />
                               </div>
                             )}
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

        <TabsContent value="standings" className="animate-fade-in">
          <Card className="transition-all duration-300 hover:shadow-lg">
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
                      <div key={roster.roster_id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                            index === 0 ? 'bg-yellow-500 text-black scale-110' : 
                            index === 1 ? 'bg-gray-400 text-black scale-105' :
                            index === 2 ? 'bg-amber-600 text-white scale-105' : 'bg-gray-700 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-white transition-colors duration-200">{teamName}</div>
                            <div className="text-sm text-gray-400 transition-colors duration-200">{user?.display_name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-white transition-colors duration-200">{record}</div>
                          <div className="text-sm text-gray-400 transition-colors duration-200">
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

        <TabsContent value="transactions" className="animate-fade-in">
          <TransactionsList
            transactions={transactions}
            userMap={userMap}
            players={players}
            league={league}
          />
        </TabsContent>

        <TabsContent value="statistics" className="animate-fade-in">
          <FunStatistics
            league={league}
            rosters={rosters}
            userMap={userMap}
            players={players}
            transactions={transactions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamOverview;
