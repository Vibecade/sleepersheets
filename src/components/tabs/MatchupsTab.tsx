import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { ExpandableMatchupCard } from '../ExpandableMatchupCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MatchupsTabProps {
  selectedWeek: number;
  setSelectedWeek: (week: number) => void;
  matchupsLoading: boolean;
  groupedMatchups: Record<number, any[]>;
  getRosterById: (id: number) => any;
  userMap: Record<string, any>;
  players: Record<string, any>;
  formatPoints: (points: number) => string;
  getTeamRecord: (roster: any) => string;
}

const MatchupsTab: React.FC<MatchupsTabProps> = ({
  selectedWeek,
  setSelectedWeek,
  matchupsLoading,
  groupedMatchups,
  getRosterById,
  userMap,
  players,
  formatPoints,
  getTeamRecord,
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <CardTitle className="text-base sm:text-lg">Matchups</CardTitle>
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
      <CardContent className="pt-0">
        <ScrollArea className="h-[58vh] md:h-[62vh] w-full pr-1">
          {matchupsLoading ? (
            <div className="space-y-3 pr-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} showHeader={false} lines={2} />
              ))}
            </div>
          ) : Object.keys(groupedMatchups).length === 0 ? (
            <div className="text-center py-10 text-gray-400 transition-opacity duration-300">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-base">No matchups found for week {selectedWeek}</p>
              <p className="text-sm">Try selecting a different week</p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {Object.entries(groupedMatchups).map(([matchupId, teams]) => {
                if (teams.length < 2) return null;
                
                const team1 = teams[0];
                const team2 = teams[1];
                const roster1 = getRosterById(team1.roster_id);
                const roster2 = getRosterById(team2.roster_id);
                const user1 = userMap[roster1?.owner_id];
                const user2 = userMap[roster2?.owner_id];

                return (
                  <ExpandableMatchupCard
                    key={matchupId}
                    matchupId={matchupId}
                    team1={team1}
                    team2={team2}
                    roster1={roster1}
                    roster2={roster2}
                    user1={user1}
                    user2={user2}
                    players={players}
                    formatPoints={formatPoints}
                    getTeamRecord={getTeamRecord}
                  />
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MatchupsTab;
