
import React from 'react';
import LeagueHeader from './LeagueHeader';
import TeamRosters from './TeamRosters';
import ExportActions from './ExportActions';
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
}

const LeagueData: React.FC<LeagueDataProps> = ({ data }) => {
  const { league, rosters, users, players, transactions = [], drafts = [], draftPicks = [] } = data;

  // Create mappings
  const userMap = createUserMap(users);
  const rosterUserMap = createRosterUserMap(rosters, userMap);

  // Calculate stats for header
  const transactionCount = transactions.length;
  const draftPickCount = draftPicks.reduce((acc, dp) => acc + dp.picks.length, 0);
  const draftCount = drafts.length;

  return (
    <div className="space-y-6">
      <LeagueHeader 
        league={league}
        transactionCount={transactionCount}
        draftPickCount={draftPickCount}
        draftCount={draftCount}
      />

      <TeamRosters 
        rosters={rosters}
        userMap={userMap}
      />

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
  );
};

export default LeagueData;
