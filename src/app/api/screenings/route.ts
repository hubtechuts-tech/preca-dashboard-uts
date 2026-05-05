/**
 * Screenings API Route
 *
 * POST /api/screenings - Create a new screening
 * GET /api/screenings - List screenings with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { ScreeningController } from './_controllers/ScreeningController';
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
import { StripeService } from '@/infrastructure/services/StripeService';
import { SupabaseStorageService } from '@/infrastructure/services/SupabaseStorageService';
import { ResendEmailService } from '@/infrastructure/services/ResendEmailService';
import { ConsoleEmailService } from '@/infrastructure/services/ConsoleEmailService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';

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

  const createUseCase = new CreateScreeningUseCase(
    screeningRepository,
    serviceRepository,
    stripeService,
    userRepository,
    advisorRepository
  );
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
    advisorRepository
  );
}

/**
 * POST /api/screenings
 * Create a new screening request
 * Supports both API key authentication (for n8n Agent) and session authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Get user from authentication (optional - can be anonymous)
    // Get user from authentication
    const session = await requireAuth(request);
    const userId = session.userId;

    const controller = createController();
    const response = await controller.create(body, userId);

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
    console.error('Unexpected error in POST /api/screenings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/screenings
 * List screenings with optional filters
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication for listing screenings
    await requireAuth(request);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      userId: searchParams.get('userId') || undefined,
      adminUserId: searchParams.get('adminUserId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    const controller = createController();
    const response = await controller.list(filters);

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
    console.error('Unexpected error in GET /api/screenings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
