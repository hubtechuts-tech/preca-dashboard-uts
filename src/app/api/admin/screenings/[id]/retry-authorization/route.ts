/**
 * Presentation Layer - Admin Retry Authorization Route
 *
 * POST /api/admin/screenings/[id]/retry-authorization
 *
 * Allows admins to manually retry sending authorization document to Wee Trust
 * Useful for recovering from:
 * - 504 Gateway Timeouts
 * - Network errors
 * - Temporary Wee Trust API issues
 *
 * Authentication: Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { RetryAuthorizationController } from './_controllers/RetryAuthorizationController';
import { SendAuthorizationDocumentUseCase } from '@/application/use-cases/wee-trust/SendAuthorizationDocumentUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { WeeTrustService } from '@/infrastructure/services/WeeTrustService';
import { PDFFillerService } from '@/infrastructure/services/PDFFillerService';
import { prisma } from '@/infrastructure/database/PrismaClient';

/**
 * Create controller with all dependencies
 * Following Clean Architecture dependency injection pattern
 */
async function createController(): Promise<RetryAuthorizationController> {
  // Infrastructure layer
  const screeningRepository = new PrismaScreeningRepository(prisma);
  const serviceCatalogRepository = new PrismaServiceCatalogRepository(prisma);
  const weeTrustService = new WeeTrustService();
  const pdfFillerService = new PDFFillerService();

  // Application layer
  const sendAuthorizationUseCase = new SendAuthorizationDocumentUseCase(
    screeningRepository,
    weeTrustService,
    pdfFillerService,
    serviceCatalogRepository
  );

  // Presentation layer
  return new RetryAuthorizationController(
    sendAuthorizationUseCase,
    screeningRepository
  );
}

/**
 * POST handler - Retry authorization document sending
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Await params (Next.js 15 requirement)
    const { id } = await params;

    // 2. Verify admin authentication
    const session = await requirePermission(request, Permission.SCREENINGS_WRITE);
    console.log(`[RetryAuthorizationRoute] Admin ${session.email} retrying authorization for screening ${id}`);

    // 3. Create controller
    const controller = await createController();

    // 4. Execute retry
    const response = await controller.retry({
      screeningId: id
    });

    // 4. Return response
    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json(
        {
          error: response.error,
          details: response.details
        },
        { status: response.statusCode }
      );
    }

  } catch (error: any) {
    console.error('[RetryAuthorizationRoute] Unexpected error:', error);

    // Handle authentication errors
    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    if (error.name === 'UnauthorizedError' || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message
      },
      { status: 500 }
    );
  }
}
