import React, { useState, Suspense, useEffect } from 'react';
import LeagueHeader from './LeagueHeader';
import { LazyTeamOverview, LazyFantasyManager } from './LazyComponents';
import PageNavigation from './PageNavigation';
import ErrorBoundary from './ErrorBoundary';
import PageHead from './PageHead';
import { LeagueDataProvider, useLeagueData } from './LeagueDataProvider';
import LeagueHeaderSkeleton from './skeletons/LeagueHeaderSkeleton';
import TeamOverviewSkeleton from './skeletons/TeamOverviewSkeleton';
import PageNavigationSkeleton from './skeletons/PageNavigationSkeleton';
import LeagueStatusBadge from './LeagueStatusBadge';
import { CommissionerDashboard } from '@/components/commissioner/CommissionerDashboard';
import { MobileAppLayout } from '@/components/mobile/MobileAppLayout';
import { MobileMoreMenu } from '@/components/mobile/MobileMoreMenu';
import { useBottomNav } from '@/hooks/useBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


interface LeagueDataProps {
  data: {
    league: any;
    rosters: any[];
    users: any[];
    players: Record<string, any>;
    transactions?: any[];
    drafts?: any[];
    draftPicks?: any[];
  };
  onRefreshData?: () => Promise<void>;
  onResyncData?: () => Promise<void>;
  onOwnershipChanged?: () => void;
}

const LeagueDataContent: React.FC<{ onRefreshData?: () => Promise<void>; onResyncData?: () => Promise<void>; onOwnershipChanged?: () => void; }> = React.memo(({ onRefreshData, onResyncData, onOwnershipChanged }) => {
  const { league, rosters, userMap, rosterUserMap, players, transactions, draftPicks, stats } = useLeagueData();
  const [currentPage, setCurrentPage] = useState<'overview' | 'manager' | 'commissioner' | 'more'>('overview');
  const [activeOverviewTab, setActiveOverviewTab] = useState<string>('matchups');
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { checkOwnershipStatus } = useLeagueOwnershipStatus();
  const [isOwner, setIsOwner] = useState(false);

  // Check if current user is the league owner
  useEffect(() => {
    const checkOwnership = async () => {
      if (user && league?.league_id) {
        const status = await checkOwnershipStatus(league.league_id);
        setIsOwner(status.ownedByCurrentUser);
      } else {
        setIsOwner(false);
      }
    };
    checkOwnership();
  }, [user, league?.league_id, checkOwnershipStatus]);
  
  const { bottomNavItems } = useBottomNav({
    leagueId: league.league_id,
    onPageChange: (page) => {
      if (page === 'overview') {
        setCurrentPage('overview');
        setActiveOverviewTab('standings');
      } else if (page === 'matchups') {
        setCurrentPage('overview');
        setActiveOverviewTab('matchups');
      } else if (page === 'stats') {
        setCurrentPage('overview');
        setActiveOverviewTab('statistics');
      } else if (page === 'more') {
        setCurrentPage('more');
      } else if (page === 'manager') {
        setCurrentPage('manager');
      } else {
        setCurrentPage(page as 'overview' | 'manager' | 'commissioner');
      }
    }
  });

  const getActiveNavItem = () => {
    if (currentPage === 'more') return '#more';
    if (currentPage === 'manager') return '#manager';
    if (currentPage === 'overview') {
      if (activeOverviewTab === 'statistics') return '#stats';
      if (activeOverviewTab === 'matchups') return '#matchups';
      return '#overview';
    }
    return '#overview';
  };

  // Prepare league data for export navigation
  const leagueDataForExport = React.useMemo(() => ({
    league_id: league.league_id,
    name: league.name,
    season: league.season,
    sport: league.sport,
    total_rosters: league.total_rosters,
    league,
    rosters,
    users: Object.values(userMap),
    players,
    transactions,
    drafts: [],
    draftPicks
  }), [league, rosters, userMap, players, transactions, draftPicks]);

  return (
    <MobileAppLayout
      bottomNavItems={bottomNavItems}
      activeItem={getActiveNavItem()}
      showBottomNav={isMobile}
    >
      <div className="main-container">
        <PageHead
          title={
            currentPage === 'overview' 
              ? 'League Overview' 
              : currentPage === 'commissioner'
              ? 'Commissioner Dashboard'
              : 'Fantasy Manager'
          }
          description={`Manage your ${league.name} fantasy football league with salary cap tracking, contract management, and trade simulation tools.`}
          leagueName={league.name}
        />
        
        <div className="space-y-8">
          <div className="slide-up">
            <div className="flex justify-end mb-4">
              <LeagueStatusBadge leagueId={league.league_id} onOwnershipChanged={onOwnershipChanged} />
            </div>
            <ErrorBoundary fallback={<LeagueHeaderSkeleton />}>
              <Suspense fallback={<LeagueHeaderSkeleton />}>
                <LeagueHeader
                  league={league}
                  transactionCount={stats.transactionCount}
                  draftPickCount={stats.draftPickCount}
                  draftCount={stats.draftCount}
                  onRefreshData={onRefreshData}
                  compact={isMobile}
                />
              </Suspense>
            </ErrorBoundary>
          </div>

          {/* Hide PageNavigation on mobile, use bottom nav instead */}
          {!isMobile && (
            <div className="slide-up" style={{ animationDelay: '0.1s' }}>
              <ErrorBoundary fallback={<PageNavigationSkeleton />}>
                <Suspense fallback={<PageNavigationSkeleton />}>
                  <PageNavigation
                    currentPage={currentPage === 'more' ? 'overview' : currentPage}
                    onPageChange={setCurrentPage}
                    leagueData={leagueDataForExport}
                  />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}

        {currentPage === 'commissioner' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            {isOwner ? (
              <ErrorBoundary fallback={<div>Error loading commissioner dashboard</div>}>
                <Suspense fallback={<div>Loading commissioner dashboard...</div>}>
                  <CommissionerDashboard leagueId={league.league_id} leagueData={leagueDataForExport} />
                </Suspense>
              </ErrorBoundary>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Only league commissioners can access the Commissioner Dashboard.
                  </p>
                  <Button onClick={() => setCurrentPage('overview')}>
                    Back to League
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentPage === 'more' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundary fallback={<div>Error loading menu</div>}>
              <Suspense fallback={<div>Loading...</div>}>
                <MobileMoreMenu
                  leagueId={league.league_id}
                  leagueData={leagueDataForExport}
                  isCommissioner={isOwner}
                  onNavigateToCommissioner={() => setCurrentPage('commissioner')}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {currentPage === 'overview' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundary fallback={<TeamOverviewSkeleton />}>
              <Suspense fallback={<TeamOverviewSkeleton />}>
                <LazyTeamOverview
                  league={league}
                  rosters={rosters}
                  userMap={userMap}
                  players={players}
                  transactions={transactions}
                  onResyncData={onResyncData}
                  initialTab={activeOverviewTab}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {currentPage === 'manager' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundary>
              <Suspense fallback={<TeamOverviewSkeleton />}>
                <LazyFantasyManager
                  league={league}
                  rosters={rosters}
                  userMap={userMap}
                  rosterUserMap={rosterUserMap}
                  players={players}
                  transactions={transactions}
                  draftPicks={draftPicks}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}
        </div>
      </div>
    </MobileAppLayout>
  );
});

LeagueDataContent.displayName = 'LeagueDataContent';

const LeagueData: React.FC<LeagueDataProps> = React.memo(({ data, onRefreshData, onResyncData, onOwnershipChanged }) => {
  return (
    <LeagueDataProvider data={data}>
      <LeagueDataContent onRefreshData={onRefreshData} onResyncData={onResyncData} onOwnershipChanged={onOwnershipChanged} />
    </LeagueDataProvider>
  );
});

LeagueData.displayName = 'LeagueData';

export default LeagueData;