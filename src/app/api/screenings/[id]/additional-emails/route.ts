/**
 * Presentation Layer - Additional Emails Route
 *
 * POST   /api/screenings/[id]/additional-emails - Add email to screening
 * DELETE /api/screenings/[id]/additional-emails - Remove email from screening
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScreeningController } from '../../_controllers/ScreeningController';
import { CreateScreeningUseCase } from '@/application/use-cases/screening/CreateScreeningUseCase';
import { GetScreeningByIdUseCase } from '@/application/use-cases/screening/GetScreeningByIdUseCase';
import { GetScreeningsByPhoneUseCase } from '@/application/use-cases/screening/GetScreeningsByPhoneUseCase';
import { ListScreeningsUseCase } from '@/application/use-cases/screening/ListScreeningsUseCase';
import { UpdateScreeningStatusUseCase } from '@/application/use-cases/screening/UpdateScreeningStatusUseCase';
import { AddAdditionalEmailUseCase } from '@/application/use-cases/screening/AddAdditionalEmailUseCase';
import { RemoveAdditionalEmailUseCase } from '@/application/use-cases/screening/RemoveAdditionalEmailUseCase';
import { UploadReportUseCase } from '@/application/use-cases/report/UploadReportUseCase';
import { CompleteScreeningUseCase } from '@/application/use-cases/report/CompleteScreeningUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { PrismaAdvisorRepository } from '@/infrastructure/database/repositories/PrismaAdvisorRepository';
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { ConsoleEmailService } from '@/infrastructure/services/ConsoleEmailService';
import { StripeService } from '@/infrastructure/services/StripeService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth, requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies
 */
function createController(): ScreeningController {
  const screeningRepository = new PrismaScreeningRepository(prisma);
  const serviceRepository = new PrismaServiceCatalogRepository(prisma);
  const userRepository = new PrismaUserRepository(prisma);
  const advisorRepository = new PrismaAdvisorRepository(prisma);
  const fileStorageService = SupabaseStorageService.getInstance();
  const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);

  const emailService = process.env.RESEND_API_KEY
    ? new ResendEmailService(process.env.RESEND_API_KEY || '', process.env.EMAIL_FROM)
    : new ConsoleEmailService();

  const createUseCase = new CreateScreeningUseCase(screeningRepository, serviceRepository, stripeService, userRepository, advisorRepository);
  const getByIdUseCase = new GetScreeningByIdUseCase(screeningRepository);
  const getByPhoneUseCase = new GetScreeningsByPhoneUseCase(screeningRepository);
  const listUseCase = new ListScreeningsUseCase(screeningRepository);
  const updateStatusUseCase = new UpdateScreeningStatusUseCase(screeningRepository);
  const uploadReportUseCase = new UploadReportUseCase(screeningRepository, fileStorageService);
  const completeScreeningUseCase = new CompleteScreeningUseCase(
    screeningRepository,
    emailService,
    fileStorageService,
    advisorRepository
  );
  const addAdditionalEmailUseCase = new AddAdditionalEmailUseCase(screeningRepository);
  const removeAdditionalEmailUseCase = new RemoveAdditionalEmailUseCase(screeningRepository);

  return new ScreeningController(
    createUseCase,
    getByIdUseCase,
    getByPhoneUseCase,
    listUseCase,
    updateStatusUseCase,
    uploadReportUseCase,
    completeScreeningUseCase,
    addAdditionalEmailUseCase,
    removeAdditionalEmailUseCase,
    advisorRepository
  );
}

/**
 * POST /api/screenings/[id]/additional-emails
 * Add an email to the screening's additional recipients
 * Requires admin authentication
 *
 * Body: { email: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Require admin authentication
    await requirePermission(request, Permission.SCREENINGS_WRITE);

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const controller = createController();
    const response = await controller.addAdditionalEmail(id, email);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in POST /api/screenings/[id]/additional-emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/screenings/[id]/additional-emails
 * Remove an email from the screening's additional recipients
 * Requires admin authentication
 *
 * Body: { email: string }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Require admin authentication
    await requirePermission(request, Permission.SCREENINGS_WRITE);

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    const controller = createController();
    const response = await controller.removeAdditionalEmail(id, email);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in DELETE /api/screenings/[id]/additional-emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
