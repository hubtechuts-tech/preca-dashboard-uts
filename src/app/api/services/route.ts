/**
 * Services API Route
 *
 * GET    /api/services        - List all services
 * POST   /api/services        - Create a new service
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServiceController } from './_controllers/ServiceController';
import { CreateServiceUseCase } from '@/application/use-cases/service/CreateServiceUseCase';
import { ListServicesUseCase } from '@/application/use-cases/service/ListServicesUseCase';
import { ListServicesMinimalUseCase } from '@/application/use-cases/service/ListServicesMinimalUseCase';
import { UpdateServiceUseCase } from '@/application/use-cases/service/UpdateServiceUseCase';
import { GetServiceByIdUseCase } from '@/application/use-cases/service/GetServiceByIdUseCase';
import { DeleteServiceUseCase } from '@/application/use-cases/service/DeleteServiceUseCase';
import { UpdateServiceFormSchemaUseCase } from '@/application/use-cases/service/UpdateServiceFormSchemaUseCase';
import { PrismaServiceCatalogRepository } from '@/infrastructure/database/repositories/PrismaServiceCatalogRepository';
import { StripeService } from '@/infrastructure/services/StripeService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { PersonType } from '@/domain/entities/ServiceCatalog';
import { requireAuth, requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies
 */
function createController(): ServiceController {
  const repository = new PrismaServiceCatalogRepository(prisma);

  // CRITICAL: Stripe must be configured for service management
  // Services must always be synced with Stripe to prevent payment link price mismatches
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Service management requires Stripe integration.');
  }

  const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY);

  // Create use cases
  const createUseCase = new CreateServiceUseCase(repository, stripeService);
  const updateUseCase = new UpdateServiceUseCase(repository, stripeService);
  const listUseCase = new ListServicesUseCase(repository);
  const listMinimalUseCase = new ListServicesMinimalUseCase(repository);
  const getByIdUseCase = new GetServiceByIdUseCase(repository);
  const deleteUseCase = new DeleteServiceUseCase(repository, stripeService);
  const updateFormSchemaUseCase = new UpdateServiceFormSchemaUseCase(repository);  // NEW

  return new ServiceController(
    createUseCase,
    updateUseCase,
    listUseCase,
    listMinimalUseCase,
    getByIdUseCase,
    deleteUseCase,
    updateFormSchemaUseCase  // NEW
  );
}

/**
 * GET /api/services
 * List all services with optional filters (Requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication (session or API key)
    await requireAuth(request);

    const searchParams = request.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const personType = searchParams.get('personType') as PersonType | null;

    const filters = {
      activeOnly,
      personType: personType || undefined
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
    console.error('Unexpected error in GET /api/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/services
 * Create a new service (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require SERVICES_WRITE permission
    await requirePermission(request, Permission.SERVICES_WRITE);

    const body = await request.json();

    const controller = createController();
    const response = await controller.create(body);

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
    console.error('Unexpected error in POST /api/services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
