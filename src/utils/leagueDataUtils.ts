
export const createUserMap = (users: any[]) => {
  return users.reduce((acc, user) => {
    acc[user.user_id] = user;
    return acc;
  }, {});
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
