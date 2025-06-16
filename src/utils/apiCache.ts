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
}

export const apiCache = new ApiCache();

// Helper function for cached fetch with rate limiting
export const cachedFetch = async <T>(
  url: string, 
  options?: RequestInit,
  ttl?: number
): Promise<T> => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log(`Cache hit for: ${url}`);
    return cached;
  }
  
  // Check rate limit before making request
  if (!apiCache['checkRateLimit'](url)) {
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }
  
  console.log(`Cache miss for: ${url}`);
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  apiCache.set(cacheKey, data, ttl);
  return data;
};