/**
 * Services Minimal API Route
 *
 * GET    /api/services/minimal    - List services with minimal data (id, name, description, price)
 *
 * This endpoint requires authentication (session or API key) and returns
 * only essential service information for lightweight API access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServiceController } from '../_controllers/ServiceController';
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
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';

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
  const updateFormSchemaUseCase = new UpdateServiceFormSchemaUseCase(repository);

  return new ServiceController(
    createUseCase,
    updateUseCase,
    listUseCase,
    listMinimalUseCase,
    getByIdUseCase,
    deleteUseCase,
    updateFormSchemaUseCase
  );
}

/**
 * GET /api/services/minimal
 * List services with minimal data (id, name, description, price)
 * Requires authentication (session or API key)
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
    const response = await controller.listMinimal(filters);

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
    console.error('Unexpected error in GET /api/services/minimal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
