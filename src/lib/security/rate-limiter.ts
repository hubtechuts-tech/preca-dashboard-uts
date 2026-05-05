/**
 * In-Memory Rate Limiter
 *
 * Simple rate limiting for public endpoints
 * Uses sliding window algorithm
 *
 * NOTE: This is a basic implementation. For production with multiple instances,
 * consider using Redis-based rate limiting (e.g., upstash/ratelimit)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param limit - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(identifier: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.store.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return false;
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return true;
    }

    // Increment count
    entry.count++;
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemaining(identifier: string, limit: number): number {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return limit;
    }
    return Math.max(0, limit - entry.count);
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number | null {
    const entry = this.store.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }
    return entry.resetTime;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configuration presets
 */
export const RateLimitPresets = {
  // Strict limits for public endpoints (60 requests per minute)
  PUBLIC_STRICT: {
    limit: 60,
    windowMs: 60 * 1000, // 1 minute
  },
  // Moderate limits for public endpoints (120 requests per minute)
  PUBLIC_MODERATE: {
    limit: 120,
    windowMs: 60 * 1000, // 1 minute
  },
  // Generous limits for authenticated endpoints (300 requests per minute)
  AUTHENTICATED: {
    limit: 300,
    windowMs: 60 * 1000, // 1 minute
  },
};
