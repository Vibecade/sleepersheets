import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeagueConfigurationPanel } from './LeagueConfigurationPanel';
import { UserManagement } from './UserManagement';
import { TransactionManagement } from './TransactionManagement';
import { CommissionerOverview } from './CommissionerOverview';

interface CommissionerDashboardProps {
  leagueId: string;
  leagueData: any;
}

export const CommissionerDashboard = ({ leagueId, leagueData }: CommissionerDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1
          className="font-headline font-bold uppercase text-foreground"
          style={{ fontSize: 28, letterSpacing: '0.04em', lineHeight: 1 }}
        >
          Commissioner Dashboard
        </h1>
        <p
          className="font-mono text-muted-foreground mt-2"
          style={{ fontSize: 11, letterSpacing: '0.15em' }}
        >
          LEAGUE MANAGEMENT TOOLS FOR {(leagueData?.name || 'YOUR LEAGUE').toUpperCase()}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CommissionerOverview leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>

        <TabsContent value="settings">
          <LeagueConfigurationPanel leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionManagement leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
