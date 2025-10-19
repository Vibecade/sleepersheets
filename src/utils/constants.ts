/**
 * Application-wide constants
 */

// Cache TTL (Time To Live) values in milliseconds
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000,     // 5 minutes - standard cache duration
  LONG: 10 * 60 * 1000,      // 10 minutes - for relatively stable data
  DAILY: 24 * 60 * 60 * 1000 // 24 hours - for rarely changing data
} as const;

// Rate limiting configuration
export const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 50,
  LEAGUE_FETCH_LIMIT: 10,
  PROJECTIONS_FETCH_LIMIT: 3
} as const;

// NFL Season configuration
export const NFL_SEASON = {
  MAX_WEEKS: 22,
  MIN_WEEK: 1,
  SEASON_START_MONTH: 8, // September (0-indexed)
  SEASON_START_DAY: 5
} as const;

// Query configuration
export const QUERY_CONFIG = {
  RETRY_COUNT: 2,
  REFETCH_ON_WINDOW_FOCUS: false,
  REFETCH_ON_MOUNT: false,
  REFETCH_ON_RECONNECT: true
} as const;

// Rate limiting time windows
export const RATE_LIMIT_WINDOWS = {
  ONE_MINUTE: 60000,
  RETRY_DELAY_SHORT: 2000,
  RETRY_DELAY_LONG: 3000
} as const;
