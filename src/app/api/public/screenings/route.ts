/**
 * Public Screenings API Route
 *
 * POST /api/public/screenings - Create screening (NO AUTH REQUIRED)
 *
 * This endpoint is public and allows anonymous users to create screening requests
 * from the landing page. Returns ONLY the payment link URL.
 *
 * The full screening details are kept private and only accessible via authenticated endpoints.
 *
 * Security:
 * - Rate limiting: 10 requests per minute per IP (strict)
 * - Request size limit: 100KB
 * - Input sanitization and validation
 * - CORS enabled for public access
 * - Security headers applied
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicScreeningController } from './_controllers/PublicScreeningController';
import { CreatePublicScreeningUseCase } from '@/application/use-cases/public/CreatePublicScreeningUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { PrismaAdvisorRepository } from '@/infrastructure/database/repositories/PrismaAdvisorRepository';
import { StripeService } from '@/infrastructure/services/StripeService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import {
  applyRateLimit,
  addSecurityHeaders,
  applyCorsHeaders,
  validateRequestSize,
  RateLimitPresets,
} from '@/lib/security/middleware';

/**
 * Create controller with all dependencies
 */
function createController(): PublicScreeningController {
  const screeningRepository = new PrismaScreeningRepository(prisma);
  const serviceRepository = new PrismaServiceCatalogRepository(prisma);
  const userRepository = new PrismaUserRepository(prisma);
  const advisorRepository = new PrismaAdvisorRepository(prisma);
  const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);

  const createUseCase = new CreatePublicScreeningUseCase(
    screeningRepository,
    serviceRepository,
    stripeService,
    userRepository,
    advisorRepository
  );

  return new PublicScreeningController(createUseCase);
}

/**
 * POST /api/public/screenings
 * Create a new screening request from landing page
 * NO AUTHENTICATION REQUIRED
 *
 * Request body:
 * {
 *   "serviceId": "1",
 *   "applicantName": "Juan Pérez García",
 *   "applicantEmail": "juan.perez@example.com",
 *   "applicantPhone": "+52 55 1234 5678",
 *   "advisorId": "123",                    // Optional: Advisor ID (recommended)
 *   "advisorName": "María López",          // Optional: Fallback if no advisor ID
 *   "advisorPhone": "+52 55 9876 5432",    // Optional: Fallback if no advisor ID
 *   "formData": {
 *     "direccion": "Calle Principal 123",
 *     "ciudad": "Ciudad de México"
 *   }
 * }
 *
 * Response:
 * {
 *   "paymentLinkUrl": "https://buy.stripe.com/test_xxx"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting (10 requests per minute)
    const rateLimitResult = applyRateLimit(request, RateLimitPresets.PUBLIC_STRICT);
    if (rateLimitResult.limited) {
      return addSecurityHeaders(rateLimitResult.response!);
    }

    // Validate request size (max 100KB)
    const sizeValidation = validateRequestSize(request, 100 * 1024);
    if (!sizeValidation.valid) {
      return addSecurityHeaders(sizeValidation.response!);
    }

    const body = await request.json();

    const controller = createController();
    const response = await controller.create(body);

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
    console.error('Unexpected error in POST /api/public/screenings:', error);
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
