import React from 'react';
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

  // Create mappings
  const userMap = createUserMap(users);
  const rosterUserMap = createRosterUserMap(rosters, userMap);

  // Calculate stats for header
  const transactionCount = transactions.length;
  const draftPickCount = draftPicks.reduce((acc, dp) => acc + dp.picks.length, 0);
  const draftCount = drafts.length;

  return (
    <div className="main-container">
      <div className="space-y-8">
        <div className="slide-up">
          <LeagueHeader 
            league={league}
            transactionCount={transactionCount}
            draftPickCount={draftPickCount}
            draftCount={draftCount}
            onRefreshData={onRefreshData}
          />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.2s' }}>
          <TeamRosters 
            rosters={rosters}
            userMap={userMap}
            players={players}
          />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.3s' }}>
          <TradeSimulator
            league={league}
            rosters={rosters}
            userMap={userMap}
            players={players}
          />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.4s' }}>
          <DataDashboard
            league={league}
            rosters={rosters}
            userMap={userMap}
            rosterUserMap={rosterUserMap}
            players={players}
            transactions={transactions}
            draftPicks={draftPicks}
          />
        </div>

        <div className="slide-up" style={{ animationDelay: '0.5s' }}>
          <ExportActions
            league={league}
            rosters={rosters}
            userMap={userMap}
            rosterUserMap={rosterUserMap}
            players={players}
            transactions={transactions}
            draftPicks={draftPicks}
          />
        </div>
      </div>
    </div>
  );
};

export default LeagueData;
