
import { apiCache } from './apiCache';

interface CacheMetadata {
  isCached: boolean;
  lastFetched?: Date;
  cacheKey: string;
}

class EnhancedApiCache {
  private metadata = new Map<string, { lastFetched: Date; ttl: number }>();

  async cachedFetchWithMetadata<T>(
    url: string,
    options?: RequestInit,
    ttl?: number
  ): Promise<{ data: T; metadata: CacheMetadata }> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Check if data exists in cache
    const cached = apiCache.get<T>(cacheKey);
    const cacheInfo = this.metadata.get(cacheKey);
    
    if (cached && cacheInfo) {
      return {
        data: cached,
        metadata: {
          isCached: true,
          lastFetched: cacheInfo.lastFetched,
          cacheKey
        }
      };
    }
    
    // Fetch fresh data
    console.log(`Fetching fresh data for: ${url}`);
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const now = new Date();
    
    // Store in cache
    apiCache.set(cacheKey, data, ttl);
    this.metadata.set(cacheKey, { lastFetched: now, ttl: ttl || 5 * 60 * 1000 });
    
    return {
      data,
      metadata: {
        isCached: false,
        lastFetched: now,
        cacheKey
      }
    };
  }

  getCacheInfo(cacheKey: string) {
    return this.metadata.get(cacheKey);
  }

  clearCache() {
    apiCache.clear();
    this.metadata.clear();
  }
}

export const enhancedApiCache = new EnhancedApiCache();
