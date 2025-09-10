interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private requestCounts = new Map<string, { count: number; resetTime: number }>();
  private maxRequestsPerMinute = 10; // Reduced from unlimited

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
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
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
  cachePrefix?: string
): Promise<T> => {
  const baseKey = `${url}-${JSON.stringify(options)}`;
  const cacheKey = cachePrefix ? `${cachePrefix}-${baseKey}` : baseKey;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log(`Cache hit for: ${url} (league-specific: ${!!cachePrefix})`);
    return cached;
  }
  
  // Check rate limit before making request
  if (!apiCache['checkRateLimit'](url)) {
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }
  
  console.log(`Cache miss for: ${url} (league-specific: ${!!cachePrefix})`);
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  apiCache.set(cacheKey, data, ttl);
  return data;
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