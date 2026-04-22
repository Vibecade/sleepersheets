import { useMemo, type ReactNode } from 'react';
import { LeagueDataContext } from './LeagueDataContext';
import type {
  SleeperDraftPick,
  SleeperLeagueDataBundle,
  SleeperLeagueDataContextValue,
  SleeperRoster,
  SleeperUser,
  SleeperUserMap,
} from '@/types/sleeper';

interface LeagueDataProviderProps {
  data: SleeperLeagueDataBundle;
  children: ReactNode;
}

const buildUserMap = (users: SleeperUser[]): SleeperUserMap =>
  users.reduce<SleeperUserMap>((acc, user) => {
    acc[user.user_id] = user;
    return acc;
  }, {});

const getDraftPickCount = (draftPicks: SleeperDraftPick[]) =>
  draftPicks.reduce((acc, draftPick) => acc + (draftPick.picks?.length ?? 0), 0);

const buildRosterUserMap = (rosters: SleeperRoster[], userMap: SleeperUserMap) =>
  rosters.reduce<Record<number, SleeperUser | undefined>>((acc, roster) => {
    acc[roster.roster_id] = userMap[roster.owner_id];
    return acc;
  }, {});

export const LeagueDataProvider = ({ data, children }: LeagueDataProviderProps) => {
  const {
    league,
    rosters,
    users,
    players,
    transactions = [],
    drafts = [],
    draftPicks = [],
  } = data;

  const contextValue = useMemo<SleeperLeagueDataContextValue>(() => {
    const userMap = buildUserMap(users);

    return {
      league,
      rosters,
      users,
      players,
      transactions,
      drafts,
      draftPicks,
      userMap,
      rosterUserMap: buildRosterUserMap(rosters, userMap),
      stats: {
        transactionCount: transactions.length,
        draftPickCount: getDraftPickCount(draftPicks),
        draftCount: drafts.length,
      },
    };
  }, [league, rosters, users, players, transactions, drafts, draftPicks]);

  return (
    <LeagueDataContext.Provider value={contextValue}>
      {children}
    </LeagueDataContext.Provider>
  );
};
