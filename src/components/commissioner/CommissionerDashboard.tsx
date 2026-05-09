import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LeagueConfigurationPanel } from './LeagueConfigurationPanel';
import { UserManagement } from './UserManagement';
import { TransactionManagement } from './TransactionManagement';
import { CommissionerOverview } from './CommissionerOverview';
import { WaiverAcquisitionsPanel } from './WaiverAcquisitionsPanel';
import { WalkYearPanel } from './WalkYearPanel';
import { PlayerPricingPanel } from './PlayerPricingPanel';
import type { CommissionerLeagueData } from '@/types/sleeper';

interface CommissionerDashboardProps {
  leagueId: string;
  leagueData: CommissionerLeagueData;
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
        {/* Two new tabs: Walk Year (decisions on expiring contracts, was buried
            at the bottom of Overview) and Pricing (players whose salary is null
            or 0 — i.e. drafted/traded/FA acquisitions where Sleeper doesn't
            give us a cost; waivers auto-price via the FAAB-bid processor). */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="walk-year">Walk Year</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="waivers">Waivers</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CommissionerOverview leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>

        <TabsContent value="walk-year">
          <WalkYearPanel leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>

        <TabsContent value="pricing">
          <PlayerPricingPanel leagueId={leagueId} leagueData={leagueData} />
        </TabsContent>

        <TabsContent value="waivers">
          <WaiverAcquisitionsPanel leagueData={leagueData} />
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
