/**
 * Public Services API Route
 *
 * GET /api/public/services - List active services (NO AUTH REQUIRED)
 *
 * This endpoint is public and returns only active services with minimal data:
 * - id, name, description, price, formSchema
 *
 * Used by the landing page to display available services and their forms
 *
 * Security:
 * - Rate limiting: 30 requests per minute per IP
 * - CORS enabled for public access
 * - Security headers applied
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicServiceController } from './_controllers/PublicServiceController';
import { ListPublicServicesUseCase } from '@/application/use-cases/public/ListPublicServicesUseCase';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { PersonType } from '@/domain/entities/ServiceCatalog';
import {
  applyRateLimit,
  addSecurityHeaders,
  applyCorsHeaders,
  RateLimitPresets,
} from '@/lib/security/middleware';

/**
 * Create controller with dependencies
 */
function createController(): PublicServiceController {
  const repository = new PrismaServiceCatalogRepository(prisma);
  const listUseCase = new ListPublicServicesUseCase(repository);

  return new PublicServiceController(listUseCase);
}

/**
 * GET /api/public/services
 * List active services with optional person type filter
 * NO AUTHENTICATION REQUIRED
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting (30 requests per minute)
    const rateLimitResult = applyRateLimit(request, RateLimitPresets.PUBLIC_MODERATE);
    if (rateLimitResult.limited) {
      return addSecurityHeaders(rateLimitResult.response!);
    }

    const searchParams = request.nextUrl.searchParams;
    const personType = searchParams.get('personType') as PersonType | null;

    const filters = {
      personType: personType || undefined
    };

    const controller = createController();
    const response = await controller.list(filters);

    let jsonResponse: NextResponse;
    if (response.success) {
      jsonResponse = NextResponse.json(response.data, { status: response.statusCode });
    } else {
      jsonResponse = NextResponse.json({ error: response.error }, { status: response.statusCode });
    }

    // Apply security headers and CORS
    const origin = request.headers.get('origin');
    applyCorsHeaders(jsonResponse, origin || undefined);
    addSecurityHeaders(jsonResponse);

    return jsonResponse;
  } catch (error) {
    console.error('Unexpected error in GET /api/public/services:', error);
    const errorResponse = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    return addSecurityHeaders(errorResponse);
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  const origin = request.headers.get('origin');
  applyCorsHeaders(response, origin || undefined);
  return response;
}
