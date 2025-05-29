import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamRosters from './TeamRosters';
import ExportActions from './ExportActions';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import ThemeToggle from './ThemeToggle';
import { BarChart3, Users, Download } from 'lucide-react';

interface LeagueDataProps {
  league: any;
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

const LeagueData: React.FC<LeagueDataProps> = ({ 
  league, 
  rosters, 
  users, 
  players, 
  transactions, 
  draftPicks 
}) => {
  const [activeTab, setActiveTab] = useState('rosters');

  // Create user maps for easy lookup
  const userMap = users.reduce((acc, user) => {
    acc[user.user_id] = user;
    return acc;
  }, {} as Record<string, any>);

  const rosterUserMap = rosters.reduce((acc, roster) => {
    const user = users.find(u => u.user_id === roster.owner_id);
    acc[roster.roster_id] = user;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-6">
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold gradient-text">{league.name}</h1>
          <p className="text-muted-foreground">
            {league.total_rosters} teams • {league.settings?.playoff_teams || 4} playoff spots
          </p>
        </div>
        <ThemeToggle />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="rosters" className="text-sm py-2 px-3 min-h-[44px]">
            <Users className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Team Rosters</span>
            <span className="sm:hidden">Rosters</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm py-2 px-3 min-h-[44px]">
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Charts</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="text-sm py-2 px-3 min-h-[44px]">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rosters" className="mt-6">
          <TeamRosters 
            rosters={rosters}
            players={players}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard
            league={league}
            rosters={rosters}
            rosterUserMap={rosterUserMap}
            players={players}
          />
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <ExportActions
            league={league}
            rosters={rosters}
            userMap={userMap}
            rosterUserMap={rosterUserMap}
            players={players}
            transactions={transactions}
            draftPicks={draftPicks}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeagueData;
