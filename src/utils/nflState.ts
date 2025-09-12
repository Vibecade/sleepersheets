import { cachedFetch } from '@/utils/apiCache';

export interface NFLState {
  week: number;
  season_type: 'pre' | 'regular' | 'post';
  season: string;
  display_week: number;
  season_start_date: string;
  previous_season: string;
  leg: number;
}

export interface WeekInfo {
  currentNFLWeek: number;
  displayWeek: number;
  seasonType: 'pre' | 'regular' | 'post';
  season: string;
  weekStartDate?: Date;
  isCurrentWeek: boolean;
}

// Cache for NFL state to prevent excessive API calls
let nflStateCache: NFLState | null = null;
let nflStateCacheTimestamp = 0;
const NFL_STATE_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Fetches the current NFL state from Sleeper API
 */
export const fetchNFLState = async (): Promise<NFLState | null> => {
  try {
    // Check cache first
    if (nflStateCache && Date.now() - nflStateCacheTimestamp < NFL_STATE_CACHE_TTL) {
      console.log('Using cached NFL state data');
      return nflStateCache;
    }

    console.log('Fetching fresh NFL state data');
    const nflState = await cachedFetch<NFLState>(
      'https://api.sleeper.app/v1/state/nfl',
      {},
      2 * 60 * 60 * 1000 // 2 hours cache
    );

    if (nflState) {
      nflStateCache = nflState;
      nflStateCacheTimestamp = Date.now();
      console.log('NFL State fetched:', nflState);
      return nflState;
    }
  } catch (error) {
    console.error('Error fetching NFL state:', error);
  }

  return null;
};

/**
 * Gets the current NFL week with Tuesday transition logic
 * @param useTuesdayTransition - If true, advances week on Tuesdays at 00:00:01 UTC
 */
export const getCurrentNFLWeek = async (useTuesdayTransition: boolean = true): Promise<WeekInfo> => {
  const nflState = await fetchNFLState();
  
  if (nflState) {
    let currentWeek = nflState.week;
    let displayWeek = nflState.display_week || currentWeek;
    
    // Apply Tuesday transition logic if enabled
    if (useTuesdayTransition) {
      const now = new Date();
      const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
      const utcHours = now.getUTCHours();
      const utcMinutes = now.getUTCMinutes();
      const utcSeconds = now.getUTCSeconds();
      
      // If it's Tuesday at 00:00:01 UTC or later, OR any day after Tuesday, advance to next week
      const pastTuesdayRollover = utcDay > 2 || 
        (utcDay === 2 && (utcHours > 0 || (utcHours === 0 && utcMinutes > 0) || (utcHours === 0 && utcMinutes === 0 && utcSeconds >= 1)));
      
      if (pastTuesdayRollover) {
        currentWeek = Math.min(currentWeek + 1, 18);
        displayWeek = currentWeek;
      }
    }
    
    return {
      currentNFLWeek: currentWeek,
      displayWeek,
      seasonType: nflState.season_type,
      season: nflState.season,
      isCurrentWeek: true
    };
  }

  // Fallback to estimated calculation if API fails
  console.warn('NFL State API unavailable, using fallback calculation');
  return getFallbackWeekInfo();
};

/**
 * Fallback week calculation when NFL State API is unavailable
 */
const getFallbackWeekInfo = (): WeekInfo => {
  const now = new Date();
  const year = now.getFullYear();
  const seasonStart = new Date(year, 8, 8); // Approximate season start (September 8th)
  
  if (now < seasonStart) {
    return {
      currentNFLWeek: 1,
      displayWeek: 1,
      seasonType: 'pre',
      season: year.toString(),
      isCurrentWeek: true
    };
  }
  
  const diffTime = now.getTime() - seasonStart.getTime();
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  const estimatedWeek = Math.min(Math.max(diffWeeks + 1, 1), 18);
  
  return {
    currentNFLWeek: estimatedWeek,
    displayWeek: estimatedWeek,
    seasonType: 'regular',
    season: year.toString(),
    isCurrentWeek: true
  };
};

/**
 * Gets week information for a specific week number
 */
export const getWeekInfo = async (week: number): Promise<WeekInfo> => {
  const currentWeekInfo = await getCurrentNFLWeek();
  
  return {
    ...currentWeekInfo,
    currentNFLWeek: week,
    displayWeek: week,
    isCurrentWeek: week === currentWeekInfo.currentNFLWeek
  };
};

/**
 * Clears the NFL state cache (useful for testing or manual refresh)
 */
export const clearNFLStateCache = (): void => {
  nflStateCache = null;
  nflStateCacheTimestamp = 0;
};