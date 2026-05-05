import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from './presentation/middleware/authMiddleware';

/**
 * Global Middleware for Preca Application
 *
 * Handles:
 * 1. CORS for API routes (allows n8n and external integrations)
 * 2. Authentication for protected routes (delegates to authMiddleware)
 * 3. Public routes (health check, webhooks)
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ============================================
  // CORS Configuration for API Routes
  // ============================================
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ];

    // Public endpoints that don't need CORS checks
    const publicEndpoints = [
      '/api/health',
      '/api/webhooks/stripe',
      '/api/webhooks/wee-trust',
      '/api/public/',
    ];

    const isPublicEndpoint = publicEndpoints.some(endpoint => pathname.startsWith(endpoint));

    // Handle OPTIONS preflight request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400', // 24 hours
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Public endpoints (webhooks, health) - skip auth, add CORS
    if (isPublicEndpoint) {
      const response = NextResponse.next();

      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      }

      return response;
    }

    // Protected API routes - apply auth middleware
    const authResponse = await authMiddleware(request);

    // Add CORS headers to auth response
    if (origin && allowedOrigins.includes(origin)) {
      authResponse.headers.set('Access-Control-Allow-Origin', origin);
      authResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      authResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      authResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    return authResponse;
  }

  // ============================================
  // Dashboard Routes - Apply Auth Middleware
  // ============================================
  if (pathname.startsWith('/dashboard')) {
    return authMiddleware(request);
  }

  // ============================================
  // All Other Routes - Pass Through
  // ============================================
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
};
