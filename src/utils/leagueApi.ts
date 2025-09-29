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
  
  // Clear transaction cache for this league to force fresh data
  const { clearLeagueCache } = await import('@/utils/apiCache');
  clearLeagueCache(targetLeagueId);

  const clientId = 'league_fetch';
  if (!rateLimiter.isAllowed(clientId, 10, 60000)) { // Optimized to 10 requests per minute for better performance
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
  
  // Calculate actual current NFL week using the league's season year
  const getCurrentNFLWeek = (leagueSeason: string) => {
    const now = new Date();
    const seasonYear = parseInt(leagueSeason);
    
    // Use the league's season year for season start calculation
    const seasonStart = new Date(seasonYear, 8, 5); // September 5th of the league season
    
    console.log(`Transaction fetch - League season: ${seasonYear}, Season start: ${seasonStart.toDateString()}, Current: ${now.toDateString()}`);
    
    if (now < seasonStart) return 1;
    
    const diffTime = now.getTime() - seasonStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor((diffDays + 2) / 7) + 1;
    
    return Math.min(Math.max(weekNumber, 1), 22);
  };
  
  const season = league.season || '2024';
  const currentNFLWeek = getCurrentNFLWeek(season);
  const leagueWeek = league.settings?.week || 1;
  const effectiveCurrentWeek = Math.max(currentNFLWeek, leagueWeek);
  
  console.log(`=== TRANSACTION FETCH DEBUG ===`);
  console.log(`League: ${league.name} (ID: ${targetLeagueId})`);
  console.log(`Season: ${season}, NFL Week: ${currentNFLWeek}, League Week: ${leagueWeek}, Using Week: ${effectiveCurrentWeek}`);
  
  // Optimize transaction fetching - only fetch current week and previous week for better performance
  const weeksToFetch = [];
  for (let week = Math.max(1, effectiveCurrentWeek - 1); week <= effectiveCurrentWeek; week++) {
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
          2 * 60 * 1000, // 2 minutes cache for more recent data
          `league-${targetLeagueId}`, // League-specific cache prefix
          'low' // Lower priority for background transaction processing
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
  
  console.log(`=== TRANSACTION RESULTS ===`);
  console.log(`Total transactions found: ${transactions.length}`);
  console.log(`Waiver transactions: ${transactions.filter(t => t.type === 'waiver').length}`);
  console.log(`Complete waiver transactions: ${transactions.filter(t => t.type === 'waiver' && t.status === 'complete').length}`);
  console.log(`Complete waiver transactions with bids: ${transactions.filter(t => t.type === 'waiver' && t.status === 'complete' && t.settings?.waiver_bid).length}`);
  
  // Log recent transactions for debugging
  const recentTransactions = transactions
    .filter(t => t.type === 'waiver' && t.status === 'complete')
    .sort((a, b) => b.created - a.created)
    .slice(0, 5);
  
  console.log('Recent waiver transactions:');
  recentTransactions.forEach(t => {
    console.log(`- ${t.transaction_id}: ${new Date(t.created).toISOString()}, Bid: $${t.settings?.waiver_bid || 0}`);
  });
  
  
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