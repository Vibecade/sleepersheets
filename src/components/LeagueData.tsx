
import React, { useMemo } from 'react';
import LeagueHeader from './LeagueHeader';
import TeamRosters from './TeamRosters';
import DataDashboard from './DataDashboard';
import ExportActions from './ExportActions';
import TradeSimulator from './TradeSimulator';
import { createUserMap, createRosterUserMap } from '@/utils/leagueDataUtils';

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

const LeagueData: React.FC<LeagueDataProps> = ({ data, onRefreshData }) => {
  const { league, rosters, users, players, transactions = [], drafts = [], draftPicks = [] } = data;

  // Memoize expensive calculations
  const userMap = useMemo(() => createUserMap(users), [users]);
  const rosterUserMap = useMemo(() => createRosterUserMap(rosters, userMap), [rosters, userMap]);
  
  const stats = useMemo(() => ({
    transactionCount: transactions.length,
    draftPickCount: draftPicks.reduce((acc, dp) => acc + dp.picks.length, 0),
    draftCount: drafts.length
  }), [transactions.length, draftPicks, drafts.length]);

  // Memoize component props to prevent unnecessary re-renders
  const headerProps = useMemo(() => ({
    league,
    transactionCount: stats.transactionCount,
    draftPickCount: stats.draftPickCount,
    draftCount: stats.draftCount,
    onRefreshData
  }), [league, stats.transactionCount, stats.draftPickCount, stats.draftCount, onRefreshData]);

  const rosterProps = useMemo(() => ({
    rosters,
    userMap,
    players
  }), [rosters, userMap, players]);

  const tradeSimulatorProps = useMemo(() => ({
    league,
    rosters,
    userMap,
    players
  }), [league, rosters, userMap, players]);

  const dashboardProps = useMemo(() => ({
    league,
    rosters,
    userMap,
    rosterUserMap,
    players,
    transactions,
    draftPicks
  }), [league, rosters, userMap, rosterUserMap, players, transactions, draftPicks]);

  const exportProps = useMemo(() => ({
    league,
    rosters,
    userMap,
    rosterUserMap,
    players,
    transactions,
    draftPicks
  }), [league, rosters, userMap, rosterUserMap, players, transactions, draftPicks]);

  return (
    <div className="main-container">
      <div className="space-y-8">
        <div className="slide-up">
          <LeagueHeader {...headerProps} />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.2s' }}>
          <TeamRosters {...rosterProps} />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.3s' }}>
          <TradeSimulator {...tradeSimulatorProps} />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.4s' }}>
          <DataDashboard {...dashboardProps} />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.5s' }}>
          <ExportActions {...exportProps} />
        </div>
      </div>
    </div>
  );
};

export default React.memo(LeagueData);
