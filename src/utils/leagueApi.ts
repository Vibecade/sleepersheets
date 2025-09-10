import { cachedFetch } from '@/utils/apiCache';
import { rateLimiter } from '@/utils/inputValidation';
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperDraft, SleeperTransaction, SleeperPlayer } from '@/types/sleeper';

export interface SleeperProjection {
  player_id: string;
  week: number;
  season: string;
  pts_half_ppr?: number;
  pts_ppr?: number;
  pts_std?: number;
  [key: string]: any;
}

export interface CombinedLeagueData {
  league: SleeperLeague;
  rosters: SleeperRoster[];
  users: SleeperUser[];
  players: Record<string, SleeperPlayer>;
  transactions: SleeperTransaction[];
  drafts: SleeperDraft[];
  draftPicks: { draft: SleeperDraft; picks: any[] }[];
}

// Cache for player data since it rarely changes
let playersCache: Record<string, SleeperPlayer> | null = null;
let playersCacheTimestamp = 0;
const PLAYERS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const fetchLeagueData = async (targetLeagueId: string): Promise<CombinedLeagueData> => {
  console.log('Fetching league data for ID:', targetLeagueId);

  const clientId = 'league_fetch';
  if (!rateLimiter.isAllowed(clientId, 5, 60000)) { // Reduced from 20 to 5 requests per minute
    throw new Error('Too many requests. Please wait a moment before trying again.');
  }

  // Fetch league, rosters, and users in parallel
  const [league, rosters, users] = await Promise.all([
    cachedFetch<SleeperLeague>(
      `https://api.sleeper.app/v1/league/${targetLeagueId}`, 
      {}, 
      10 * 60 * 1000 // 10 minutes cache
    ),
    cachedFetch<SleeperRoster[]>(
      `https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`, 
      {}, 
      5 * 60 * 1000 // 5 minutes cache
    ),
    cachedFetch<SleeperUser[]>(
      `https://api.sleeper.app/v1/league/${targetLeagueId}/users`, 
      {}, 
      10 * 60 * 1000 // 10 minutes cache
    )
  ]);

  console.log('League data retrieved:', { 
    name: league.name, 
    season: league.season, 
    league_id: league.league_id 
  });

  // Use cached players data if available and not expired
  let players: Record<string, SleeperPlayer>;
  if (playersCache && Date.now() - playersCacheTimestamp < PLAYERS_CACHE_TTL) {
    console.log('Using cached players data');
    players = playersCache;
  } else {
    console.log('Fetching fresh players data');
    players = await cachedFetch<Record<string, SleeperPlayer>>(
      'https://api.sleeper.app/v1/players/nfl', 
      {}, 
      24 * 60 * 60 * 1000 // 24 hours cache
    );
    playersCache = players;
    playersCacheTimestamp = Date.now();
  }

  // Fetch transactions from multiple weeks to capture all FAAB activity
  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay to avoid rate limiting
  
  const currentWeek = league.settings?.week || 1;
  const season = league.season || '2024';
  
  // Fetch transactions from current week and previous weeks (up to 18 weeks)
  const weeksToFetch = [];
  for (let week = Math.max(1, currentWeek - 5); week <= currentWeek; week++) {
    weeksToFetch.push(week);
  }
  
  console.log(`Fetching transactions for weeks: ${weeksToFetch.join(', ')}`);
  
  // Fetch transactions from all weeks in parallel with league-specific cache keys
  const allTransactions = await Promise.all(
    weeksToFetch.map(async (week) => {
      try {
        return await cachedFetch<SleeperTransaction[]>(
          `https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${week}`,
          {},
          5 * 60 * 1000, // 5 minutes cache
          `league-${targetLeagueId}` // League-specific cache prefix
        );
      } catch (error) {
        console.warn(`Failed to fetch transactions for week ${week}:`, error);
        return [];
      }
    })
  );
  
  // Flatten and deduplicate transactions
  const transactionMap = new Map();
  allTransactions.flat().forEach(transaction => {
    if (transaction && transaction.transaction_id) {
      transactionMap.set(transaction.transaction_id, transaction);
    }
  });
  const transactions = Array.from(transactionMap.values());
  
  await new Promise(resolve => setTimeout(resolve, 500)); // Add delay to avoid rate limiting
  
  const drafts = await cachedFetch<SleeperDraft[]>(
    `https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`, 
    {}, 
    10 * 60 * 1000 // 10 minutes cache
  );
  
  // Fetch draft picks with rate limiting
  const draftPicks = [];
  if (drafts.length > 0) {
    // Only fetch picks for the most recent draft to reduce API calls
    const mostRecentDraft = drafts[0];
    await new Promise(resolve => setTimeout(resolve, 500)); // Add delay to avoid rate limiting
    
    try {
      const picks = await cachedFetch(
        `https://api.sleeper.app/v1/draft/${mostRecentDraft.draft_id}/picks`, 
        {}, 
        10 * 60 * 1000 // 10 minutes cache
      );
      draftPicks.push({ draft: mostRecentDraft, picks });
    } catch (error) {
      console.error(`Error fetching picks for draft ${mostRecentDraft.draft_id}:`, error);
      draftPicks.push({ draft: mostRecentDraft, picks: [] });
    }
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

export const fetchSleeperProjections = async (week: number, season: string = '2024'): Promise<Record<string, SleeperProjection> | null> => {
  console.log(`Attempting to fetch Sleeper projections for week ${week}, season ${season}`);
  
  const clientId = 'projections_fetch';
  if (!rateLimiter.isAllowed(clientId, 3, 60000)) {
    throw new Error('Too many projection requests. Please wait a moment before trying again.');
  }

  // Try different potential projection endpoints
  const possibleEndpoints = [
    `https://api.sleeper.app/v1/projections/nfl/regular/${season}/${week}`,
    `https://api.sleeper.app/v1/projections/nfl/${season}/${week}`,
    `https://api.sleeper.app/v1/stats/nfl/regular/${season}/${week}?season_type=regular&position=all&order_by=pts_ppr`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Trying projection endpoint: ${endpoint}`);
      const projections = await cachedFetch<Record<string, SleeperProjection>>(
        endpoint,
        {},
        5 * 60 * 1000 // 5 minutes cache for projections
      );
      
      if (projections && Object.keys(projections).length > 0) {
        console.log(`Successfully fetched projections from: ${endpoint}`);
        return projections;
      }
    } catch (error) {
      console.log(`Failed to fetch from ${endpoint}:`, error);
      continue;
    }
  }

  console.log('No Sleeper projection endpoints available');
  return null;
};