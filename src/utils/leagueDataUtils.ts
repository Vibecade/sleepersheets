
import type { SleeperUser, SleeperUserMap } from '@/types/sleeper';

export const createUserMap = (users: any[]) => {
  return users.reduce((acc, user) => {
    acc[user.user_id] = user;
    return acc;
  }, {});
};

/**
 * Normalize a `users` value into a map keyed by `user_id`.
 *
 * Upstream `LeagueData.tsx` builds `leagueDataForExport` with
 * `users: Object.values(userMap)` — an array — but multiple
 * downstream panels indexed it as a map (`users[ownerId]`),
 * which silently returned `undefined` for every lookup. PR #10 fixed
 * UserManagement; PR #?? caught the same pattern in TransactionManagement
 * (creator name was always rendering as "Unknown User").
 *
 * Use this helper anywhere a panel needs map-keyed lookup so the bug
 * can't recur. Accepts array, map, or null/undefined; returns a fresh
 * map. Map shape passes through unchanged (cheap).
 */
export const normalizeUsersToMap = (
  users: SleeperUser[] | SleeperUserMap | null | undefined
): SleeperUserMap => {
  if (!users) return {};
  if (Array.isArray(users)) {
    return users.reduce<SleeperUserMap>((acc, user) => {
      if (user?.user_id) acc[user.user_id] = user;
      return acc;
    }, {});
  }
  return users;
};

export const createRosterUserMap = (rosters: any[], userMap: Record<string, any>) => {
  return rosters.reduce((acc, roster) => {
    acc[roster.roster_id] = userMap[roster.owner_id];
    return acc;
  }, {});
};

export const getPlayerCount = (roster: any) => {
  const active = roster.players?.length || 0;
  const taxi = roster.taxi?.length || 0;
  const reserve = roster.reserve?.length || 0;
  return { active, taxi, reserve, total: active + taxi + reserve };
};

export const getTeamName = (user: any): string => {
  return user?.metadata?.team_name || user?.display_name || 'Unknown Team';
};
