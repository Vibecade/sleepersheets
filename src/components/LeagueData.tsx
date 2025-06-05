
import React, { useState, Suspense } from 'react';
import LeagueHeader from './LeagueHeader';
import { LazyTeamOverview, LazyFantasyManager } from './LazyComponents';
import PageNavigation from './PageNavigation';
import ErrorBoundary from './ErrorBoundary';
import LeagueOwnershipChecker from './home/LeagueOwnershipChecker';
import PageHead from './PageHead';
import { LeagueDataProvider, useLeagueData } from './LeagueDataProvider';
import LeagueHeaderSkeleton from './skeletons/LeagueHeaderSkeleton';
import TeamOverviewSkeleton from './skeletons/TeamOverviewSkeleton';
import PageNavigationSkeleton from './skeletons/PageNavigationSkeleton';

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
}

const LeagueDataContent: React.FC<{ onRefreshData?: () => Promise<void> }> = React.memo(({ onRefreshData }) => {
  const { league, rosters, userMap, rosterUserMap, players, transactions, draftPicks, stats } = useLeagueData();
  const [currentPage, setCurrentPage] = useState<'overview' | 'manager'>('overview');

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
        title={currentPage === 'overview' ? 'League Overview' : 'Fantasy Manager'}
        description={`Manage your ${league.name} fantasy football league with salary cap tracking, contract management, and trade simulation tools.`}
        leagueName={league.name}
      />
      
      <div className="space-y-8">
        <div className="slide-up">
          <ErrorBoundary>
            <LeagueOwnershipChecker 
              leagueId={league.league_id} 
              leagueName={league.name}
            />
          </ErrorBoundary>
        </div>

        <div className="slide-up">
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
  );
});

LeagueDataContent.displayName = 'LeagueDataContent';

const LeagueData: React.FC<LeagueDataProps> = React.memo(({ data, onRefreshData }) => {
  return (
    <LeagueDataProvider data={data}>
      <LeagueDataContent onRefreshData={onRefreshData} />
    </LeagueDataProvider>
  );
});

LeagueData.displayName = 'LeagueData';

export default LeagueData;
