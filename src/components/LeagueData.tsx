import React, { useState, Suspense, useEffect } from 'react';
import LeagueHeader from './LeagueHeader';
import { LazyTeamOverview, LazyFantasyManager, LazyGamificationCenter } from './LazyComponents';
import PageNavigation from './PageNavigation';
import ErrorBoundaryWithRetry from './ErrorBoundaryWithRetry';
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
import { SkeletonCard } from '@/components/ui/skeleton-card';

const VALID_PAGES = ['gamification', 'overview', 'manager', 'commissioner', 'more'] as const;
const VALID_OVERVIEW_TABS = ['matchups', 'standings', 'transactions', 'statistics'] as const;

const isValidPage = (value: string): value is (typeof VALID_PAGES)[number] => {
  return VALID_PAGES.includes(value as (typeof VALID_PAGES)[number]);
};

const isValidOverviewTab = (value: string): value is (typeof VALID_OVERVIEW_TABS)[number] => {
  return VALID_OVERVIEW_TABS.includes(value as (typeof VALID_OVERVIEW_TABS)[number]);
};

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

const LeagueDataContent: React.FC<{ onRefreshData?: () => Promise<void>; onOwnershipChanged?: () => void; }> = React.memo(({ onRefreshData, onOwnershipChanged }) => {
  const { league, rosters, userMap, rosterUserMap, players, transactions, draftPicks, stats } = useLeagueData();
  const [currentPage, setCurrentPage] = useState<'gamification' | 'overview' | 'manager' | 'commissioner' | 'more'>('gamification');
  const [activeOverviewTab, setActiveOverviewTab] = useState<string>('matchups');
  const [compactMode, setCompactMode] = useState(false);
  const [hasHydratedUIState, setHasHydratedUIState] = useState(false);
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { checkOwnershipStatus } = useLeagueOwnershipStatus();
  const [isOwner, setIsOwner] = useState(false);
  const uiStoragePrefix = React.useMemo(
    () => (league?.league_id ? `sleepersheets:league-ui:${league.league_id}` : null),
    [league?.league_id]
  );

  useEffect(() => {
    setHasHydratedUIState(false);
    if (!uiStoragePrefix || typeof window === 'undefined') {
      setCompactMode(isMobile);
      setHasHydratedUIState(true);
      return;
    }

    try {
      const storedPage = localStorage.getItem(`${uiStoragePrefix}:page`);
      const storedOverviewTab = localStorage.getItem(`${uiStoragePrefix}:overview-tab`);
      const storedCompactMode = localStorage.getItem(`${uiStoragePrefix}:compact`);

      setCurrentPage(storedPage && isValidPage(storedPage) ? storedPage : 'gamification');
      setActiveOverviewTab(storedOverviewTab && isValidOverviewTab(storedOverviewTab) ? storedOverviewTab : 'matchups');
      setCompactMode(storedCompactMode ? storedCompactMode === '1' : isMobile);
    } catch {
      setCurrentPage('gamification');
      setActiveOverviewTab('matchups');
      setCompactMode(isMobile);
    } finally {
      setHasHydratedUIState(true);
    }
  }, [uiStoragePrefix, isMobile]);

  useEffect(() => {
    if (!hasHydratedUIState || !uiStoragePrefix || typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(`${uiStoragePrefix}:page`, currentPage);
  }, [hasHydratedUIState, uiStoragePrefix, currentPage]);

  useEffect(() => {
    if (!hasHydratedUIState || !uiStoragePrefix || typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(`${uiStoragePrefix}:overview-tab`, activeOverviewTab);
  }, [hasHydratedUIState, uiStoragePrefix, activeOverviewTab]);

  useEffect(() => {
    if (!hasHydratedUIState || !uiStoragePrefix || typeof window === 'undefined') {
      return;
    }
    localStorage.setItem(`${uiStoragePrefix}:compact`, compactMode ? '1' : '0');
  }, [hasHydratedUIState, uiStoragePrefix, compactMode]);

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
      } else if (page === 'gamify' || page === 'gamification') {
        setCurrentPage('gamification');
      } else if (page === 'matchups') {
        setCurrentPage('overview');
        setActiveOverviewTab('matchups');
      } else if (page === 'stats' || page === 'news') {
        setCurrentPage('overview');
        setActiveOverviewTab('statistics');
      } else if (page === 'more') {
        setCurrentPage('more');
      } else if (page === 'manager') {
        setCurrentPage('manager');
      } else {
        setCurrentPage(page as 'gamification' | 'overview' | 'manager' | 'commissioner');
      }
    }
  });

  const getActiveNavItem = () => {
    if (currentPage === 'gamification') return '#gamify';
    if (currentPage === 'more') return '#more';
    if (currentPage === 'manager') return '#manager';
    if (currentPage === 'overview') {
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
      <div className={`main-container ${compactMode ? 'ui-compact' : ''}`}>
        <PageHead
          title={
            currentPage === 'gamification'
              ? 'Gamification Hub'
              : currentPage === 'overview'
              ? 'League Overview' 
              : currentPage === 'commissioner'
              ? 'Commissioner Dashboard'
              : 'Fantasy Manager'
          }
          description={`Manage your ${league.name} fantasy football league with salary cap tracking, contract management, and trade simulation tools.`}
          leagueName={league.name}
        />
        
        <div className="section-stack">
          <div className="slide-up">
            <div className="flex justify-end mb-2">
              <LeagueStatusBadge leagueId={league.league_id} onOwnershipChanged={onOwnershipChanged} />
            </div>
            <ErrorBoundaryWithRetry fallbackMessage="Failed to load league header">
              <Suspense fallback={<LeagueHeaderSkeleton />}>
                <LeagueHeader
                  league={league}
                  transactionCount={stats.transactionCount}
                  draftPickCount={stats.draftPickCount}
                  draftCount={stats.draftCount}
                  onRefreshData={onRefreshData}
                  compact={isMobile ? compactMode : false}
                  isCompactMode={compactMode}
                  onToggleCompactMode={() => setCompactMode((prev) => !prev)}
                />
              </Suspense>
            </ErrorBoundaryWithRetry>
          </div>

          {/* Hide PageNavigation on mobile, use bottom nav instead */}
          {!isMobile && (
            <div className="slide-up" style={{ animationDelay: '0.1s' }}>
              <ErrorBoundaryWithRetry fallbackMessage="Failed to load navigation">
                <Suspense fallback={<PageNavigationSkeleton />}>
                  <PageNavigation
                    currentPage={currentPage === 'more' ? 'overview' : currentPage}
                    onPageChange={setCurrentPage}
                    leagueData={leagueDataForExport}
                  />
                </Suspense>
              </ErrorBoundaryWithRetry>
            </div>
          )}

        {currentPage === 'commissioner' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            {isOwner ? (
              <ErrorBoundaryWithRetry fallbackMessage="Error loading commissioner dashboard">
                <Suspense fallback={<SkeletonCard lines={4} />}>
                  <CommissionerDashboard leagueId={league.league_id} leagueData={leagueDataForExport} />
                </Suspense>
              </ErrorBoundaryWithRetry>
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
            <ErrorBoundaryWithRetry fallbackMessage="Error loading menu">
              <Suspense fallback={<SkeletonCard lines={3} />}>
                <MobileMoreMenu
                  leagueId={league.league_id}
                  leagueData={leagueDataForExport}
                  isCommissioner={isOwner}
                  onNavigateToCommissioner={() => setCurrentPage('commissioner')}
                />
              </Suspense>
            </ErrorBoundaryWithRetry>
          </div>
        )}

        {currentPage === 'gamification' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundaryWithRetry fallbackMessage="Failed to load gamification hub">
              <Suspense fallback={<TeamOverviewSkeleton />}>
                <LazyGamificationCenter
                  league={league}
                  rosters={rosters}
                  userMap={userMap}
                  players={players}
                  transactions={transactions}
                />
              </Suspense>
            </ErrorBoundaryWithRetry>
          </div>
        )}

        {currentPage === 'overview' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundaryWithRetry fallbackMessage="Failed to load team overview">
              <Suspense fallback={<TeamOverviewSkeleton />}>
                <LazyTeamOverview
                  league={league}
                  rosters={rosters}
                  userMap={userMap}
                  players={players}
                  transactions={transactions}
                  initialTab={activeOverviewTab}
                  onTabChange={setActiveOverviewTab}
                  onRefreshData={onRefreshData}
                />
              </Suspense>
            </ErrorBoundaryWithRetry>
          </div>
        )}

        {currentPage === 'manager' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundaryWithRetry fallbackMessage="Failed to load fantasy manager">
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
            </ErrorBoundaryWithRetry>
          </div>
        )}
        </div>
      </div>
    </MobileAppLayout>
  );
});

LeagueDataContent.displayName = 'LeagueDataContent';

const LeagueData: React.FC<LeagueDataProps> = React.memo(({ data, onRefreshData, onOwnershipChanged }) => {
  return (
    <LeagueDataProvider data={data}>
      <LeagueDataContent onRefreshData={onRefreshData} onOwnershipChanged={onOwnershipChanged} />
    </LeagueDataProvider>
  );
});

LeagueData.displayName = 'LeagueData';

export default LeagueData;
