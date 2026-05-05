/**
 * Security Middleware for Next.js API Routes
 *
 * Provides rate limiting, security headers, and request validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter, RateLimitPresets as RateLimitPresetsImport } from './rate-limiter';

// Re-export RateLimitPresets for convenience
export { RateLimitPresets } from './rate-limiter';

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check common headers for IP address (from proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  if (forwarded) {
    // x-forwarded-for can be comma-separated list of IPs
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback to a default (shouldn't happen in production)
  return 'unknown';
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  config: { limit: number; windowMs: number } = RateLimitPresetsImport.PUBLIC_STRICT
): { limited: boolean; response?: NextResponse } {
  const ip = getClientIp(request);
  const identifier = `ratelimit:${ip}`;

  const isLimited = rateLimiter.isRateLimited(identifier, config.limit, config.windowMs);

  if (isLimited) {
    const resetTime = rateLimiter.getResetTime(identifier);
    const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;

    return {
      limited: true,
      response: NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime?.toString() || '',
          },
        }
      ),
    };
  }

  return { limited: false };
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (restrictive for API endpoints)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'"
  );

  // Permissions Policy (disable unnecessary features)
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return response;
}

/**
 * Validate request content length
 */
export function validateRequestSize(
  request: NextRequest,
  maxSizeBytes: number = 100 * 1024 // 100KB default
): { valid: boolean; response?: NextResponse } {
  const contentLength = request.headers.get('content-length');

  if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'Request payload too large' },
        { status: 413 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Apply CORS headers for public endpoints
 */
export function applyCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  // For public endpoints, you can either:
  // 1. Allow all origins (less secure): response.headers.set('Access-Control-Allow-Origin', '*')
  // 2. Whitelist specific origins (more secure)

  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'https://preca.botia.pro',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all in development
    response.headers.set('Access-Control-Allow-Origin', '*');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}
