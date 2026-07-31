import { cachedFetch, apiCache } from '@/utils/apiCache';
import { rateLimiter } from '@/utils/inputValidation';
import { logger } from '@/utils/logger';
import { CACHE_TTL, RATE_LIMITS, NFL_SEASON } from '@/utils/constants';
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperDraft, SleeperTransaction, SleeperPlayer } from '@/types/sleeper';
import { resolveNflWeek } from '@/utils/nflWeek';

export interface SleeperProjection {
  player_id: string;
  week: number;
  season: string;
  pts_half_ppr?: number;
  pts_ppr?: number;
  pts_std?: number;
  [key: string]: any;
}

/**
 * How many just-completed weeks keep a short cache TTL because pending
 * trades / waivers from them can still settle after `leg` advances.
 */
const WEEKS_STILL_SETTLING = 1;

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
  logger.debug('Fetching league data for ID:', targetLeagueId);

  const clientId = 'league_fetch';
  if (!rateLimiter.isAllowed(clientId, RATE_LIMITS.LEAGUE_FETCH_LIMIT, 60000)) {
    throw new Error('Too many requests. Please wait a moment before trying again.');
  }

  // Fetch league, rosters, and users in parallel
  const [league, rosters, users] = await Promise.all([
    cachedFetch<SleeperLeague>(
      `https://api.sleeper.app/v1/league/${targetLeagueId}`, 
      {}, 
      CACHE_TTL.LONG
    ),
    cachedFetch<SleeperRoster[]>(
      `https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`, 
      {}, 
      CACHE_TTL.MEDIUM
    ),
    cachedFetch<SleeperUser[]>(
      `https://api.sleeper.app/v1/league/${targetLeagueId}/users`, 
      {}, 
      CACHE_TTL.LONG
    )
  ]);

  logger.debug('League data retrieved:', { 
    name: league.name, 
    season: league.season, 
    league_id: league.league_id 
  });

  // Use cached players data from ApiCache
  let players: Record<string, SleeperPlayer>;
  const cachedPlayers = await apiCache.getPlayers();
  
  if (cachedPlayers) {
    logger.debug('Using cached players data from ApiCache');
    players = cachedPlayers;
  } else {
    logger.debug('Fetching fresh players data');
    players = await cachedFetch<Record<string, SleeperPlayer>>(
      'https://api.sleeper.app/v1/players/nfl', 
      {}, 
      CACHE_TTL.DAILY
    );
    void apiCache.setPlayers(players);
  }

  // Fetch transactions across the full season window so league-wide counts
  // (transactions, FAAB activity, manager activity) reflect the entire
  // season rather than just the current 2-week slice. Sleeper exposes
  // transactions per (league_id, week); empty weeks return [] cheaply, all
  // requests run in parallel through cachedFetch (per-league cache prefix),
  // and any single-week failure is isolated by the catch below.
  //
  // Cache TTL is tiered by week: a completed week's transaction log is
  // immutable, so re-fetching week 3 every 2 minutes for the rest of the
  // season is pure waste. Past weeks get a DAILY TTL; only the live week
  // (and any future week, which returns [] anyway) stays SHORT. In
  // steady state this turns ~22 network calls per refresh into ~1.
  //
  // Historical-season history (prior `previous_league_id` rollovers) is
  // still out of scope; that requires walking the chain and is deferred
  // to a future "League History" feature.

  const season = league.season || '2024';
  // Sleeper's own week pointer wins; the calendar estimate is the fallback.
  const effectiveCurrentWeek = resolveNflWeek(league);

  logger.debug(`=== TRANSACTION FETCH DEBUG ===`);
  logger.debug(`League: ${league.name} (ID: ${targetLeagueId})`);
  logger.debug(`Season: ${season}, resolved current week: ${effectiveCurrentWeek}`);

  const weeksToFetch: number[] = [];
  for (let week = NFL_SEASON.MIN_WEEK; week <= NFL_SEASON.MAX_WEEKS; week++) {
    weeksToFetch.push(week);
  }

  // TTL by how settled a week is.
  //
  // A week isn't immutable the instant `leg` advances: a trade created
  // late in week N can sit pending review, and waivers process after
  // rollover, so the week-N endpoint keeps changing for a while. Dropping
  // it straight to a daily TTL would pin the stale pending state for up to
  // 24 hours. The week just gone therefore keeps a short-ish TTL as a
  // grace window; only weeks behind that are treated as settled.
  const ttlForWeek = (week: number): number => {
    if (week >= effectiveCurrentWeek) return CACHE_TTL.SHORT; // live (or future — returns [])
    if (week >= effectiveCurrentWeek - WEEKS_STILL_SETTLING) return CACHE_TTL.MEDIUM;
    return CACHE_TTL.DAILY; // settled — cannot change again
  };

  logger.debug(`Fetching transactions for weeks: ${weeksToFetch.join(', ')}`);

  // Fetch transactions from all weeks in parallel with league-specific cache keys
  const allTransactions = await Promise.all(
    weeksToFetch.map(async (week) => {
      try {
        return await cachedFetch<SleeperTransaction[]>(
          `https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${week}`,
          {},
          ttlForWeek(week),
          `league-${targetLeagueId}`, // League-specific cache prefix
          'low' // Lower priority for background transaction processing
        );
      } catch (error) {
        logger.warn(`Failed to fetch transactions for week ${week}:`, error);
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
  
  logger.debug(`=== TRANSACTION RESULTS ===`);
  logger.debug(`Total transactions found: ${transactions.length}`);
  logger.debug(`Waiver transactions: ${transactions.filter(t => t.type === 'waiver').length}`);
  logger.debug(`Complete waiver transactions: ${transactions.filter(t => t.type === 'waiver' && t.status === 'complete').length}`);
  logger.debug(`Complete waiver transactions with bids: ${transactions.filter(t => t.type === 'waiver' && t.status === 'complete' && t.settings?.waiver_bid).length}`);
  
  // Log recent transactions for debugging
  const recentTransactions = transactions
    .filter(t => t.type === 'waiver' && t.status === 'complete')
    .sort((a, b) => b.created - a.created)
    .slice(0, 5);
  
  logger.debug('Recent waiver transactions:');
  recentTransactions.forEach(t => {
    logger.debug(`- ${t.transaction_id}: ${new Date(t.created).toISOString()}, Bid: $${t.settings?.waiver_bid || 0}`);
  });
  
  
  const drafts = await cachedFetch<SleeperDraft[]>(
    `https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`, 
    {}, 
    CACHE_TTL.LONG
  );
  
  // Fetch draft picks with rate limiting
  const draftPicks: { draft: SleeperDraft; picks: any[] }[] = [];
  if (drafts.length > 0) {
    // Only fetch picks for the most recent draft to reduce API calls
    const mostRecentDraft = drafts[0];


    try {
      const picks = await cachedFetch<any[]>(
        `https://api.sleeper.app/v1/draft/${mostRecentDraft.draft_id}/picks`,
        {},
        CACHE_TTL.LONG
      );
      draftPicks.push({ draft: mostRecentDraft, picks });
    } catch (error) {
      logger.error(`Error fetching picks for draft ${mostRecentDraft.draft_id}:`, error);
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

export const fetchSleeperProjections = async (week: number, season: string = new Date().getFullYear().toString()): Promise<Record<string, SleeperProjection> | null> => {
  logger.debug(`Attempting to fetch Sleeper projections for week ${week}, season ${season}`);
  
  const clientId = 'projections_fetch';
  if (!rateLimiter.isAllowed(clientId, RATE_LIMITS.PROJECTIONS_FETCH_LIMIT, 60000)) {
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
      logger.debug(`Trying projection endpoint: ${endpoint}`);
      const projections = await cachedFetch<Record<string, SleeperProjection>>(
        endpoint,
        {},
        CACHE_TTL.MEDIUM
      );
      
      if (projections && Object.keys(projections).length > 0) {
        logger.debug(`Successfully fetched projections from: ${endpoint}`);
        return projections;
      }
    } catch (error) {
      logger.debug(`Failed to fetch from ${endpoint}:`, error);
      continue;
    }
  }

  logger.debug('No Sleeper projection endpoints available');
  return null;
};
