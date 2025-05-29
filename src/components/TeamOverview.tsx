
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import TeamRosterSizeChart from './charts/TeamRosterSizeChart';
import PositionDistributionChart from './charts/PositionDistributionChart';
import TeamRostersGrid from './TeamRostersGrid';

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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Users className="w-6 h-6 text-green-500" />
            <div>
              <CardTitle className="text-2xl">League Overview</CardTitle>
              <CardDescription>
                {league.name} - {league.season} Season ({rosters.length} teams)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400">Total Teams</h3>
              <p className="text-2xl font-bold">{rosters.length}</p>
            </div>
            <div className="bg-card/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-400">Total Players</h3>
              <p className="text-2xl font-bold">
                {rosters.reduce((sum, roster) => sum + (roster.players?.length || 0), 0)}
              </p>
            </div>
            <div className="bg-card/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-400">Avg Roster Size</h3>
              <p className="text-2xl font-bold">
                {Math.round(rosters.reduce((sum, roster) => sum + (roster.players?.length || 0), 0) / rosters.length)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts - Only on Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TeamRosterSizeChart 
          rosters={rosters}
          userMap={userMap}
        />
        
        <PositionDistributionChart 
          rosters={rosters}
          players={players}
        />
      </div>

      {/* Team Rosters Grid - Show actual teams */}
      <TeamRostersGrid
        rosters={rosters}
        userMap={userMap}
        showSalaryFeatures={false}
        deadCapEnabled={false}
        teamSalaries={{}}
        teamDeadCaps={{}}
        salaryCap={200000}
        teamFAAB={{}}
        showFAAB={false}
        canModifyLeague={false}
      />
    </div>
  );
};

export default TeamOverview;
