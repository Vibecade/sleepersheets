
import React from 'react';
import LeagueHeader from './LeagueHeader';
import TeamRosters from './TeamRosters';
import DataDashboard from './DataDashboard';
import ExportActions from './ExportActions';
import TradeSimulator from './TradeSimulator';
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

        <div className="slide-up" style={{ animationDelay: '0.2s' }}>
          <ErrorBoundary>
            <TeamRosters
              rosters={rosters}
              userMap={userMap}
              players={players}
            />
          </ErrorBoundary>
        </div>

        <div className="slide-up" style={{ animationDelay: '0.3s' }}>
          <ErrorBoundary>
            <TradeSimulator
              league={league}
              rosters={rosters}
              userMap={userMap}
              players={players}
            />
          </ErrorBoundary>
        </div>

        <div className="slide-up" style={{ animationDelay: '0.4s' }}>
          <ErrorBoundary>
            <DataDashboard
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

        <div className="slide-up" style={{ animationDelay: '0.5s' }}>
          <ErrorBoundary>
            <ExportActions
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
