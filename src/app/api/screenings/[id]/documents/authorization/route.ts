/**
 * Presentation Layer - Authorization Document Route
 *
 * GET /api/screenings/[id]/documents/authorization
 *
 * Fetches fresh authorization document URL from WeeTrust.
 * This endpoint always returns a fresh, non-expired URL by calling the WeeTrust API.
 *
 * Why this endpoint exists:
 * - WeeTrust returns pre-signed URLs that expire in 6 days
 * - Instead of storing expired URLs, we fetch fresh ones on-demand
 * - This ensures users always get working document links
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthorizationDocumentController } from './_controllers/AuthorizationDocumentController';
import { GetAuthorizationDocumentUseCase } from '@/application/use-cases/wee-trust/GetAuthorizationDocumentUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { WeeTrustService } from '@/infrastructure/services/WeeTrustService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth } from '@/lib/api-auth';

/**
 * Initialize controller with dependencies
 */
async function createController(): Promise<AuthorizationDocumentController> {
  // Infrastructure layer
  const screeningRepository = new PrismaScreeningRepository(prisma);
  const weeTrustService = new WeeTrustService();

  // Application layer
  const getAuthorizationDocumentUseCase = new GetAuthorizationDocumentUseCase(
    screeningRepository,
    weeTrustService
  );

  // Presentation layer
  return new AuthorizationDocumentController(getAuthorizationDocumentUseCase);
}

/**
 * GET - Fetch fresh authorization document URL
 *
 * Returns:
 * - 200: Success with fresh document URL
 * - 401: Unauthorized (no auth token)
 * - 404: Screening or document not found
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication required
    await requireAuth(request);

    // Get screening ID from route params
    const { id: screeningId } = await params;

    // Create controller and execute
    const controller = await createController();
    const response = await controller.getFreshUrl(screeningId);

    // Return response
    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: response.statusCode }
      );
    }
  } catch (error: any) {
    console.error('[GET /api/screenings/[id]/documents/authorization] Unexpected error:', error);

    // Handle authentication errors
    if (error.message === 'Unauthorized' || error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
