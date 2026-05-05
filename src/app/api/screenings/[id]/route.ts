/**
 * Screening Detail API Route
 *
 * GET /api/screenings/[id] - Get screening by ID
 * PUT /api/screenings/[id] - Update screening status
 * DELETE /api/screenings/[id] - Delete screening
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScreeningController } from '../_controllers/ScreeningController';
import { CreateScreeningUseCase } from '@/application/use-cases/screening/CreateScreeningUseCase';
import { GetScreeningByIdUseCase } from '@/application/use-cases/screening/GetScreeningByIdUseCase';
import { GetScreeningsByPhoneUseCase } from '@/application/use-cases/screening/GetScreeningsByPhoneUseCase';
import { ListScreeningsUseCase } from '@/application/use-cases/screening/ListScreeningsUseCase';
import { UpdateScreeningStatusUseCase } from '@/application/use-cases/screening/UpdateScreeningStatusUseCase';
import { DeleteScreeningUseCase } from '@/application/use-cases/screening/DeleteScreeningUseCase';
import { AddAdditionalEmailUseCase } from '@/application/use-cases/screening/AddAdditionalEmailUseCase';
import { RemoveAdditionalEmailUseCase } from '@/application/use-cases/screening/RemoveAdditionalEmailUseCase';
import { UploadReportUseCase } from '@/application/use-cases/report/UploadReportUseCase';
import { CompleteScreeningUseCase } from '@/application/use-cases/report/CompleteScreeningUseCase';
import { PrismaScreeningRepository } from '@/infrastructure/database/repositories/PrismaScreeningRepository';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { PrismaAdvisorRepository } from '@/infrastructure/database/repositories/PrismaAdvisorRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth, requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';
import { StripeService } from '@/infrastructure/services/StripeService';
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { ConsoleEmailService } from '@/infrastructure/services/ConsoleEmailService';

/**
 * Create controller with all dependencies
 */
function createController(): ScreeningController {
  const screeningRepository = new PrismaScreeningRepository(prisma);
  const serviceRepository = new PrismaServiceCatalogRepository(prisma);
  const userRepository = new PrismaUserRepository(prisma);
  const advisorRepository = new PrismaAdvisorRepository(prisma);
  const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);
  const supabaseStorageService = SupabaseStorageService.getInstance();
  const resendEmailService = process.env.RESEND_API_KEY
    ? new ResendEmailService(process.env.RESEND_API_KEY, process.env.EMAIL_FROM)
    : new ConsoleEmailService();

  const createUseCase = new CreateScreeningUseCase(screeningRepository, serviceRepository, stripeService, userRepository, advisorRepository);
  const getByIdUseCase = new GetScreeningByIdUseCase(screeningRepository);
  const getByPhoneUseCase = new GetScreeningsByPhoneUseCase(screeningRepository);
  const listUseCase = new ListScreeningsUseCase(screeningRepository);
  const updateStatusUseCase = new UpdateScreeningStatusUseCase(screeningRepository);

  const uploadReportUseCase = new UploadReportUseCase(screeningRepository, supabaseStorageService);
  const completeScreeningUseCase = new CompleteScreeningUseCase(
    screeningRepository,
    resendEmailService,
    supabaseStorageService,
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
    advisorRepository,
    serviceRepository
  );
}

/**
 * GET /api/screenings/[id]
 * Get a specific screening by ID
 * Requires authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require authentication
    await requireAuth(request);

    const controller = createController();
    const response = await controller.getById(id);

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
    console.error('Unexpected error in GET /api/screenings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/screenings/[id]
 * Update screening status
 * Requires admin authentication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require SCREENINGS_WRITE permission
    const session = await requirePermission(request, Permission.SCREENINGS_WRITE);

    // Parse request body
    const body = await request.json();

    const controller = createController();
    const response = await controller.updateStatus(id, body, session.userId);

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
    console.error('Unexpected error in PUT /api/screenings/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/screenings/[id]
 * Delete a screening
 * Requires admin authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require SCREENINGS_WRITE permission
    await requirePermission(request, Permission.SCREENINGS_WRITE);

    // Initialize use case
    const screeningRepository = new PrismaScreeningRepository(prisma);
    const deleteScreeningUseCase = new DeleteScreeningUseCase(screeningRepository);

    // Execute deletion
    await deleteScreeningUseCase.execute(id);

    return NextResponse.json(
      { message: 'Screening deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Unexpected error in DELETE /api/screenings/[id]:', error);
    return NextResponse.json({ error: 'Failed to delete screening' }, { status: 500 });
  }
}
