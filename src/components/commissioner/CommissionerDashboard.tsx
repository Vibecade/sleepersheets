import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { selectUnpricedPlayerIds } from '@/utils/pricing';
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

  // Salary state is owned HERE, not inside PlayerPricingPanel, and handed
  // down. usePlayerSalaries keeps `salaries` in local useState and its
  // loader early-returns for an already-seen league, so two instances of
  // the hook for the same league never converge: an edit made in the
  // panel would update the panel's copy while the badge kept rendering
  // the original backlog — the panel could read "0 left" next to a badge
  // still showing 12. One instance, one source of truth.
  //
  // Why the badge exists: waiver pickups auto-price from the FAAB bid,
  // but only while someone with `canModifyLeague` has the app open.
  // Waivers clear Wednesday, so between then and the commissioner's next
  // visit those players carry no salary and every manager's cap figure is
  // short. Drafted and traded players never auto-price at all. This count
  // is that backlog.
  const {
    salaries,
    updateSalary,
    loading: salariesLoading,
  } = usePlayerSalaries(leagueId);
  const unpricedCount = useMemo(
    () => selectUnpricedPlayerIds(leagueData?.rosters || [], salaries).size,
    [leagueData?.rosters, salaries],
  );
  const showPricingBadge = !salariesLoading && unpricedCount > 0;

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
          <TabsTrigger value="pricing" className="gap-1.5">
            Pricing
            {showPricingBadge && (
              <span
                // Count of players still needing a salary. Deliberately
                // plain text in a pill rather than a bare dot — "how much
                // work" is the useful signal, not just "some work".
                className="inline-flex items-center justify-center rounded-full bg-secondary/20 text-secondary font-mono font-semibold min-w-[1.25rem] px-1 leading-none"
                style={{ fontSize: 10, paddingTop: 2, paddingBottom: 2 }}
                aria-label={`${unpricedCount} player${unpricedCount === 1 ? '' : 's'} need a salary`}
                title={`${unpricedCount} rostered player${unpricedCount === 1 ? '' : 's'} still need a salary set`}
              >
                {unpricedCount > 99 ? '99+' : unpricedCount}
              </span>
            )}
          </TabsTrigger>
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
          <PlayerPricingPanel
            leagueId={leagueId}
            leagueData={leagueData}
            salaries={salaries}
            updateSalary={updateSalary}
            salariesLoading={salariesLoading}
          />
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
