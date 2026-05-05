/**
 * Presentation Layer - Admin Mark Payment Manual Route
 *
 * POST /api/admin/screenings/[id]/mark-paid
 *
 * Allows admins to manually mark a screening as paid.
 * Requires a reason for audit purposes.
 * After marking as paid, sends authorization document via Wee Trust.
 *
 * Authentication: Admin only
 */

import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { MarkPaidController } from './_controllers/MarkPaidController';
import { MarkPaymentManualUseCase } from '@/application/use-cases/payment/MarkPaymentManualUseCase';
import { SendAuthorizationDocumentUseCase } from '@/application/use-cases/wee-trust/SendAuthorizationDocumentUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { WeeTrustService } from '@/infrastructure/services/WeeTrustService';
import { PDFFillerService } from '@/infrastructure/services/PDFFillerService';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { prisma } from '@/infrastructure/database/PrismaClient';

/**
 * Create controller with all dependencies
 * Following Clean Architecture dependency injection pattern
 */
async function createController(): Promise<MarkPaidController> {
  // Infrastructure layer
  const screeningRepository = new PrismaScreeningRepository(prisma);
  const serviceCatalogRepository = new PrismaServiceCatalogRepository(prisma);
  const weeTrustService = new WeeTrustService();
  const pdfFillerService = new PDFFillerService();
  const emailService = new ResendEmailService(process.env.RESEND_API_KEY || '', process.env.EMAIL_FROM);

  // Application layer - Send authorization use case (for triggering WeeTrust doc)
  const sendAuthorizationUseCase = new SendAuthorizationDocumentUseCase(
    screeningRepository,
    weeTrustService,
    pdfFillerService,
    serviceCatalogRepository
  );

  // Application layer - Mark payment manual use case
  const markPaymentManualUseCase = new MarkPaymentManualUseCase(
    screeningRepository,
    serviceCatalogRepository,
    emailService,
    sendAuthorizationUseCase
  );

  // Presentation layer
  return new MarkPaidController(markPaymentManualUseCase);
}

/**
 * POST handler - Mark screening as paid manually
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
    console.log(`[MarkPaidRoute] Admin ${session.email} (${session.userId}) marking screening ${id} as paid`);

    // 3. Parse request body
    const body = await request.json();

    // 4. Create controller
    const controller = await createController();

    // 5. Execute mark as paid
    const response = await controller.markAsPaid(id, session.userId, body);

    // 6. Return response
    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: response.statusCode }
      );
    }

  } catch (error: any) {
    console.error('[MarkPaidRoute] Unexpected error:', error);

    // Handle authentication errors
    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: 'Acceso denegado - Se requiere acceso de administrador' },
        { status: 403 }
      );
    }

    if (error.name === 'UnauthorizedError' || error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'No autorizado - Por favor inicie sesión' },
        { status: 401 }
      );
    }

    // JSON parse error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Formato de solicitud inválido' },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
