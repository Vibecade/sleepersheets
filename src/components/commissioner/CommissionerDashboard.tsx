import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Settings, Users, FileX } from 'lucide-react';
import { LeagueConfigurationPanel } from './LeagueConfigurationPanel';
import { UserManagement } from './UserManagement';
import { TransactionManagement } from './TransactionManagement';
import { CommissionerAuditLog } from './CommissionerAuditLog';

interface CommissionerDashboardProps {
  leagueId: string;
  leagueData: any;
}

export const CommissionerDashboard = ({ leagueId, leagueData }: CommissionerDashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commissioner Dashboard</h1>
          <p className="text-muted-foreground">
            League management tools for {leagueData?.name || 'Your League'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leagueData?.total_rosters || 0}</div>
                <p className="text-xs text-muted-foreground">Active team owners</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Season</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leagueData?.season || '2024'}</div>
                <p className="text-xs text-muted-foreground">{leagueData?.sport || 'NFL'} League</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">League Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">Commissioner controlled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actions Today</CardTitle>
                <FileX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Commissioner actions</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Commissioner Actions</CardTitle>
              <CardDescription>
                Your latest league management activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionerAuditLog leagueId={leagueId} />
            </CardContent>
          </Card>
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