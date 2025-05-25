
import React, { createContext, useContext, useMemo, ReactNode } from 'react';

interface LeagueDataContextType {
  league: any;
  rosters: any[];
  users: any[];
  players: Record<string, any>;
  transactions: any[];
  drafts: any[];
  draftPicks: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<number, any>;
  stats: {
    transactionCount: number;
    draftPickCount: number;
    draftCount: number;
  };
}

const LeagueDataContext = createContext<LeagueDataContextType | null>(null);

interface LeagueDataProviderProps {
  data: {
    league: any;
    rosters: any[];
    users: any[];
    players: Record<string, any>;
    transactions?: any[];
    drafts?: any[];
    draftPicks?: any[];
  };
  children: ReactNode;
}

export const LeagueDataProvider: React.FC<LeagueDataProviderProps> = ({ data, children }) => {
  const { 
    league, 
    rosters, 
    users, 
    players, 
    transactions = [], 
    drafts = [], 
    draftPicks = [] 
  } = data;

  const contextValue = useMemo(() => {
    // Create user map
    const userMap: Record<string, any> = {};
    users.forEach(user => {
      userMap[user.user_id] = user;
    });

    // Create roster-user map
    const rosterUserMap: Record<number, any> = {};
    rosters.forEach(roster => {
      rosterUserMap[roster.roster_id] = userMap[roster.owner_id];
    });

    // Calculate stats
    const stats = {
      transactionCount: transactions.length,
      draftPickCount: draftPicks.reduce((acc, dp) => acc + dp.picks.length, 0),
      draftCount: drafts.length
    };

    return {
      league,
      rosters,
      users,
      players,
      transactions,
      drafts,
      draftPicks,
      userMap,
      rosterUserMap,
      stats
    };
  }, [league, rosters, users, players, transactions, drafts, draftPicks]);

  return (
    <LeagueDataContext.Provider value={contextValue}>
      {children}
    </LeagueDataContext.Provider>
  );
};

export const useLeagueData = () => {
  const context = useContext(LeagueDataContext);
  if (!context) {
    throw new Error('useLeagueData must be used within a LeagueDataProvider');
  }
  return context;
};
