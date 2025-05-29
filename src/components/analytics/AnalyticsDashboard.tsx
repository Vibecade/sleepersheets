
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RosterValueChart from '@/components/charts/RosterValueChart';
import PositionDistributionChart from '@/components/charts/PositionDistributionChart';
import { TrendingUp, Users, DollarSign, Trophy } from 'lucide-react';

interface AnalyticsDashboardProps {
  league: any;
  rosters: any[];
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  league,
  rosters,
  rosterUserMap,
  players
}) => {
  const totalPlayers = rosters.reduce((sum, roster) => sum + (roster.players?.length || 0), 0);
  const avgPlayersPerTeam = Math.round(totalPlayers / rosters.length);
  
  const totalValue = rosters.reduce((sum, roster) => {
    return sum + (roster.players?.reduce((teamSum: number, playerId: string) => {
      const player = players[playerId];
      if (player?.fantasy_data_nfl?.fantasy_positions_value) {
        return teamSum + (player.fantasy_data_nfl.fantasy_positions_value / 100);
      }
      return teamSum;
    }, 0) || 0);
  }, 0);

  const avgTeamValue = Math.round(totalValue / rosters.length);

  const stats = [
    {
      title: "Total Teams",
      value: rosters.length,
      icon: Users,
      description: "Active teams in league"
    },
    {
      title: "Total Players",
      value: totalPlayers,
      icon: Trophy,
      description: "Players rostered"
    },
    {
      title: "Avg Team Value",
      value: `$${avgTeamValue.toLocaleString()}`,
      icon: DollarSign,
      description: "Average roster value"
    },
    {
      title: "Avg Roster Size",
      value: avgPlayersPerTeam,
      icon: TrendingUp,
      description: "Players per team"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="roster-values" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="roster-values">Roster Values</TabsTrigger>
          <TabsTrigger value="position-distribution">Position Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roster-values" className="space-y-4">
          <RosterValueChart 
            rosters={rosters}
            rosterUserMap={rosterUserMap}
            players={players}
          />
        </TabsContent>
        
        <TabsContent value="position-distribution" className="space-y-4">
          <PositionDistributionChart 
            rosters={rosters}
            players={players}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
