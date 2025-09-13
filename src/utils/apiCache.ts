interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private matchupsTTL = 10 * 60 * 1000; // 10 minutes for matchups (more stable data)
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private maxRequestsPerMinute = 35; // Increased for better user experience

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
    // Don't cache empty matchups arrays (or cache them very briefly)
    if (key.includes('/matchups/') && Array.isArray(data) && data.length === 0) {
      console.log(`⚠️ Not caching empty matchups array for: ${key}`);
      return; // Don't cache empty matchups
    }
    
    // Use longer TTL for matchups data as it's more stable
    const finalTTL = key.includes('/matchups/') ? this.matchupsTTL : ttl;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + finalTTL
    });
  }

  private checkRateLimit(url: string): boolean {
    const now = Date.now();
    const key = new URL(url).hostname;
    const current = this.requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, { count: 1, resetTime: now + 60000 });
      return true;
    }
    
    if (current.count >= this.maxRequestsPerMinute) {
      console.warn(`Rate limit exceeded for ${key}. Please wait.`);
      return false;
    }
    
    current.count++;
    return true;
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
    console.log(`🟢 Cache hit for: ${url} (priority: ${priority}, league-specific: ${!!cachePrefix})`);
    return cached;
  }
  
  // Check rate limit before making request
  if (!apiCache['checkRateLimit'](url)) {
    const errorMsg = `Rate limit exceeded for ${new URL(url).hostname}. Please wait before making more requests.`;
    console.warn(`🔴 ${errorMsg}`);
    
    // For high priority requests (like matchups), retry after a short delay
    if (priority === 'high') {
      console.log(`🔄 Retrying high priority request in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!apiCache['checkRateLimit'](url)) {
        // Try one more time with longer delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (!apiCache['checkRateLimit'](url)) {
          throw new Error(errorMsg);
        }
      }
    } else {
      throw new Error(errorMsg);
    }
  }
  
  console.log(`🔵 Cache miss for: ${url} (priority: ${priority}, league-specific: ${!!cachePrefix})`);
  
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    apiCache.set(cacheKey, data, ttl);
    console.log(`✅ Successfully fetched and cached: ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch: ${url}`, error);
    throw error;
  }
};

// League-specific cache management
export const clearLeagueCache = (leagueId: string): void => {
  apiCache.clearByPattern(`league-${leagueId}`);
  console.log(`Cleared cache for league: ${leagueId}`);
};

// Get cache stats for debugging
export const getCacheStats = () => {
  return {
    size: apiCache['cache'].size,
    requestCounts: Array.from(apiCache['requestCounts'].entries())
  };
};