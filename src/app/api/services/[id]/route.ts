/**
 * Service API Route (Individual)
 *
 * GET    /api/services/[id]   - Get a service by ID
 * PUT    /api/services/[id]   - Update a service
 * DELETE /api/services/[id]   - Delete a service
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
 * GET /api/services/[id]
 * Get a service by ID (Requires authentication)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication (session or API key)
    await requireAuth(request);

    const { id } = await params;
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
    console.error('Unexpected error in GET /api/services/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/services/[id]
 * Update a service (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require SERVICES_WRITE permission
    await requirePermission(request, Permission.SERVICES_WRITE);

    const { id } = await params;
    const body = await request.json();

    const controller = createController();
    const response = await controller.update(id, body);

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
    console.error('Unexpected error in PUT /api/services/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/services/[id]
 * Delete a service (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require SERVICES_WRITE permission
    await requirePermission(request, Permission.SERVICES_WRITE);

    const { id } = await params;
    const controller = createController();
    const response = await controller.delete(id);

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
    console.error('Unexpected error in DELETE /api/services/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
