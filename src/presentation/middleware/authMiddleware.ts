import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Auth Middleware - Edge Runtime Compatible
 *
 * IMPORTANT: This middleware runs on Edge runtime and cannot use Prisma.
 * - Session cookies: Validated here (jose is Edge-compatible)
 * - API keys: NOT validated here - handled by requireAuth in API routes
 */

// Rate Limiting Configuration
const RATE_LIMIT_DURATION_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_DURATION = 100; // Max 100 requests per minute per IP

// In-memory store for request counts
const ipRequestCounts = new Map<string, { count: number; timer: NodeJS.Timeout | undefined }>();

export async function authMiddleware(request: NextRequest) {
  // Rate Limiting Logic
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const current = ipRequestCounts.get(ip) || { count: 0, timer: undefined };

  current.count++;
  ipRequestCounts.set(ip, current);

  if (current.count > MAX_REQUESTS_PER_DURATION) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  if (!current.timer) {
    current.timer = setTimeout(() => {
      ipRequestCounts.delete(ip);
    }, RATE_LIMIT_DURATION_MS);
  }

  // 1. Check for API Key (Bearer Token)
  // API keys are validated in API routes via requireAuth(), not here
  // because Prisma cannot run on Edge runtime
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Pass through - API route will validate
    return NextResponse.next();
  }

  // 2. Check for Session Cookie (Human Users)
  const sessionCookie = request.cookies.get('session');

  if (sessionCookie) {
    try {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET || 'dev_session_secret_change_in_production');
      const { payload } = await jwtVerify(sessionCookie.value, secret);

      // Add user info to headers for downstream handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Session cookie verification failed:', error);
      // If verification fails, redirect to login or return unauthorized
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }
  } else {
    // If no sessionCookie and no API key, redirect to login if accessing protected route
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
  ],
};
