import React, { useState, Suspense } from 'react';
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
import Analytics from '@/pages/Analytics';

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
  const [currentPage, setCurrentPage] = useState<'overview' | 'manager' | 'analytics'>('overview');

  // Prepare league data for export navigation
  const leagueDataForExport = React.useMemo(() => ({
    league,
    rosters,
    users: Object.values(userMap),
    players,
    transactions,
    drafts: [],
    draftPicks
  }), [league, rosters, userMap, players, transactions, draftPicks]);

  return (
    <div className="main-container">
      <PageHead
        title={
          currentPage === 'overview' 
            ? 'League Overview' 
            : currentPage === 'analytics' 
            ? 'League Analytics' 
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
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <ErrorBoundary fallback={<PageNavigationSkeleton />}>
            <Suspense fallback={<PageNavigationSkeleton />}>
              <PageNavigation
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                leagueData={leagueDataForExport}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

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
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        )}

        {currentPage === 'analytics' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundary>
              <Suspense fallback={<TeamOverviewSkeleton />}>
                <Analytics />
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
