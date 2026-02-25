import { CACHE_TTL, RATE_LIMITS, RATE_LIMIT_WINDOWS } from './constants';
import { rateLimiter } from './rateLimiter';
import type { SleeperPlayer } from '@/types/sleeper';
import { logger } from './logger';
import {
  getPersistentCacheValue,
  removePersistentCacheValue,
  setPersistentCacheValue,
} from './persistentCache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

const PLAYERS_CACHE_KEY = 'nfl-players-v1';

/**
 * Unified API cache for all data including players
 */
class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = CACHE_TTL.MEDIUM;
  private matchupsTTL = CACHE_TTL.MEDIUM;
  private playersHydrated = false;
  private playersHydrationPromise: Promise<void> | null = null;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    // Don't cache empty matchups arrays
    if (key.includes('/matchups/') && Array.isArray(data) && data.length === 0) {
      logger.debug(`⚠️ Not caching empty matchups array for: ${key}`);
      return;
    }
    
    // Use longer TTL for matchups data as it's more stable
    const finalTTL = key.includes('/matchups/') ? this.matchupsTTL : ttl;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + finalTTL
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear specific cache entries by URL pattern
  clearByPattern(pattern: string): void {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all league data except players
  clearLeagueDataExceptPlayers(leagueId: string): void {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(leagueId) && !key.includes('/players/nfl')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private async hydratePlayersFromPersistentCache(): Promise<void> {
    if (this.playersHydrated) {
      return;
    }

    if (!this.playersHydrationPromise) {
      this.playersHydrationPromise = (async () => {
        try {
          const storedEntry = await getPersistentCacheValue<
            CacheEntry<Record<string, SleeperPlayer>>
          >(PLAYERS_CACHE_KEY);

          if (!storedEntry) {
            return;
          }

          if (Date.now() > storedEntry.expiry) {
            await removePersistentCacheValue(PLAYERS_CACHE_KEY);
            return;
          }

          this.cache.set(PLAYERS_CACHE_KEY, storedEntry);
        } catch (error) {
          logger.warn('Failed to hydrate players cache from persistent storage:', error);
        }
      })().finally(() => {
        this.playersHydrated = true;
        this.playersHydrationPromise = null;
      });
    }

    await this.playersHydrationPromise;
  }

  public async warmPlayersCache(): Promise<void> {
    await this.hydratePlayersFromPersistentCache();
  }

  /**
   * Get players data from cache (in-memory first, then persistent cache).
   */
  public async getPlayers(): Promise<Record<string, SleeperPlayer> | null> {
    const inMemoryEntry = this.cache.get(PLAYERS_CACHE_KEY);
    if (inMemoryEntry) {
      if (Date.now() <= inMemoryEntry.expiry) {
        return inMemoryEntry.data;
      }
      this.cache.delete(PLAYERS_CACHE_KEY);
    }

    await this.hydratePlayersFromPersistentCache();

    const hydratedEntry = this.cache.get(PLAYERS_CACHE_KEY);
    if (!hydratedEntry || Date.now() > hydratedEntry.expiry) {
      return null;
    }

    return hydratedEntry.data;
  }

  /**
   * Set players data in cache and persist across reloads.
   */
  public async setPlayers(data: Record<string, SleeperPlayer>): Promise<void> {
    const entry: CacheEntry<Record<string, SleeperPlayer>> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_TTL.DAILY,
    };

    this.cache.set(PLAYERS_CACHE_KEY, entry);
    this.playersHydrated = true;

    try {
      await setPersistentCacheValue(PLAYERS_CACHE_KEY, entry);
    } catch (error) {
      logger.warn('Failed to persist players cache:', error);
    }
  }
}

export const apiCache = new ApiCache();

// Helper function for cached fetch with rate limiting and league-specific caching
export const cachedFetch = async <T>(
  url: string, 
  options?: RequestInit,
  ttl?: number,
  cachePrefix?: string,
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<T> => {
  const baseKey = `${url}-${JSON.stringify(options)}`;
  const cacheKey = cachePrefix ? `${cachePrefix}-${baseKey}` : baseKey;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    logger.debug(`🟢 Cache hit for: ${url} (priority: ${priority}, league-specific: ${!!cachePrefix})`);
    return cached;
  }
  
  // Check rate limit before making request
  if (!rateLimiter.checkLimit(url, RATE_LIMITS.MAX_REQUESTS_PER_MINUTE)) {
    const errorMsg = `Rate limit exceeded for ${new URL(url).hostname}. Please wait before making more requests.`;
    logger.warn(`🔴 ${errorMsg}`);
    
    // For high priority requests (like matchups), retry after a short delay
    if (priority === 'high') {
      logger.debug(`🔄 Retrying high priority request in ${RATE_LIMIT_WINDOWS.RETRY_DELAY_SHORT}ms...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOWS.RETRY_DELAY_SHORT));
      if (!rateLimiter.checkLimit(url, RATE_LIMITS.MAX_REQUESTS_PER_MINUTE)) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WINDOWS.RETRY_DELAY_LONG));
        if (!rateLimiter.checkLimit(url, RATE_LIMITS.MAX_REQUESTS_PER_MINUTE)) {
          throw new Error(errorMsg);
        }
      }
    } else {
      throw new Error(errorMsg);
    }
  }
  
  logger.debug(`🔵 Cache miss for: ${url} (priority: ${priority}, league-specific: ${!!cachePrefix})`);
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data, ttl);
    logger.debug(`✅ Successfully fetched and cached: ${url}`);
    return data;
  } catch (error) {
    logger.error(`❌ Failed to fetch: ${url}`, error);
    throw error;
  }
};

// League-specific cache management
export const clearLeagueCache = (leagueId: string): void => {
  apiCache.clearByPattern(`league-${leagueId}`);
  logger.debug(`Cleared cache for league: ${leagueId}`);
};

/**
 * Get cache stats for debugging
 */
export const getCacheStats = () => {
  return {
    size: apiCache['cache'].size,
    rateLimitStats: rateLimiter.getStats()
  };
};
