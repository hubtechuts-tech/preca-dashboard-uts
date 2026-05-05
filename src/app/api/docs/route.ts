/**
 * Scalar API Documentation Route
 *
 * Provides interactive API documentation using Scalar
 * Protected route: Requires authentication
 */

import { ApiReference } from '@scalar/nextjs-api-reference';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';

const config = {
  url: '/api/openapi.json',
  theme: 'purple',
  layout: 'modern',
  showSidebar: true,
} as const;

const apiReferenceHandler = ApiReference(config);

export async function GET(request: NextRequest) {
  try {
    // Only allow in development environment
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return NextResponse.json(
        { error: 'API documentation is not available in production' },
        { status: 404 }
      );
    }

    // Require authentication in development
    await requireAuth(request);

    // If authenticated, serve the docs
    return apiReferenceHandler();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in GET /api/docs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
