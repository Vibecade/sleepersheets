
import React, { useState } from 'react';
import LeagueHeader from './LeagueHeader';
import TeamOverview from './TeamOverview';
import FantasyManager from './FantasyManager';
import PageNavigation from './PageNavigation';
import ErrorBoundary from './ErrorBoundary';
import { LeagueDataProvider, useLeagueData } from './LeagueDataProvider';

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

const LeagueDataContent: React.FC<{ onRefreshData?: () => Promise<void> }> = ({ onRefreshData }) => {
  const { league, rosters, userMap, rosterUserMap, players, transactions, draftPicks, stats } = useLeagueData();
  const [currentPage, setCurrentPage] = useState<'overview' | 'manager'>('overview');

  return (
    <div className="main-container">
      <div className="space-y-8">
        <div className="slide-up">
          <ErrorBoundary>
            <LeagueHeader
              league={league}
              transactionCount={stats.transactionCount}
              draftPickCount={stats.draftPickCount}
              draftCount={stats.draftCount}
              onRefreshData={onRefreshData}
            />
          </ErrorBoundary>
        </div>

        <div className="slide-up" style={{ animationDelay: '0.1s' }}>
          <ErrorBoundary>
            <PageNavigation
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </ErrorBoundary>
        </div>

        {currentPage === 'overview' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundary>
              <TeamOverview
                league={league}
                rosters={rosters}
                userMap={userMap}
                players={players}
              />
            </ErrorBoundary>
          </div>
        )}

        {currentPage === 'manager' && (
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <ErrorBoundary>
              <FantasyManager
                league={league}
                rosters={rosters}
                userMap={userMap}
                rosterUserMap={rosterUserMap}
                players={players}
                transactions={transactions}
                draftPicks={draftPicks}
              />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
};

const LeagueData: React.FC<LeagueDataProps> = ({ data, onRefreshData }) => {
  return (
    <LeagueDataProvider data={data}>
      <LeagueDataContent onRefreshData={onRefreshData} />
    </LeagueDataProvider>
  );
};

export default React.memo(LeagueData);
