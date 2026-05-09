import { RATE_LIMIT_WINDOWS } from './constants';
import { logger } from '@/utils/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate limiter for API requests
 */
export class RateLimiter {
  private requestCounts = new Map<string, RateLimitEntry>();

  /**
   * Check if a request is allowed based on rate limits
   * @param url - The URL to check
   * @param maxRequests - Maximum number of requests allowed
   * @returns true if the request is allowed, false otherwise
   */
  checkLimit(url: string, maxRequests: number): boolean {
    const now = Date.now();
    const key = new URL(url).hostname;
    const current = this.requestCounts.get(key);
    
    if (!current || now > current.resetTime) {
      this.requestCounts.set(key, { 
        count: 1, 
        resetTime: now + RATE_LIMIT_WINDOWS.ONE_MINUTE 
      });
      return true;
    }
    
    if (current.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${key}. Please wait.`);
      return false;
    }
    
    current.count++;
    return true;
  }

  /**
   * Clear rate limit data for a specific host
   */
  clear(url?: string): void {
    if (url) {
      const key = new URL(url).hostname;
      this.requestCounts.delete(key);
    } else {
      this.requestCounts.clear();
    }
  }

  /**
   * Get current rate limit stats
   */
  getStats(): Array<[string, RateLimitEntry]> {
    return Array.from(this.requestCounts.entries());
  }
}

export const rateLimiter = new RateLimiter();
