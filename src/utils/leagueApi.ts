
import { cachedFetch } from '@/utils/apiCache';
import { rateLimiter } from '@/utils/inputValidation';
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperDraft, SleeperTransaction, SleeperPlayer } from '@/types/sleeper';

export interface CombinedLeagueData {
  league: SleeperLeague;
  rosters: SleeperRoster[];
  users: SleeperUser[];
  players: Record<string, SleeperPlayer>;
  transactions: SleeperTransaction[];
  drafts: SleeperDraft[];
  draftPicks: { draft: SleeperDraft; picks: any[] }[];
}

export const fetchLeagueData = async (targetLeagueId: string): Promise<CombinedLeagueData> => {
  console.log('Fetching league data for ID:', targetLeagueId);

  const clientId = 'league_fetch';
  if (!rateLimiter.isAllowed(clientId, 20, 60000)) { 
    throw new Error('Too many requests. Please wait a moment before trying again.');
  }

  const [league, rosters, users, players] = await Promise.all([
    cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}`, {}, 10 * 60 * 1000) as Promise<SleeperLeague>,
    cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`, {}, 5 * 60 * 1000) as Promise<SleeperRoster[]>,
    cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/users`, {}, 10 * 60 * 1000) as Promise<SleeperUser[]>,
    cachedFetch('https://api.sleeper.app/v1/players/nfl', {}, 60 * 60 * 1000) as Promise<Record<string, SleeperPlayer>>
  ]);

  console.log('League data retrieved:', { 
    name: league.name, 
    season: league.season, 
    league_id: league.league_id 
  });

  const currentWeek = league.settings?.week || 1;
  const [transactions, drafts] = await Promise.all([
    cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${currentWeek}`, {}, 2 * 60 * 1000) as Promise<SleeperTransaction[]>,
    cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`, {}, 10 * 60 * 1000) as Promise<SleeperDraft[]>
  ]);
  
  const draftPicks = [];
  if (drafts.length > 0) {
    const draftPickPromises = drafts.map(async (draft) => {
      const picks = await cachedFetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`, {}, 10 * 60 * 1000);
      return { draft, picks };
    });
    
    const results = await Promise.all(draftPickPromises);
    draftPicks.push(...results.filter(Boolean));
  }

  return {
    league,
    rosters,
    users,
    players,
    transactions,
    drafts,
    draftPicks
  };
};
