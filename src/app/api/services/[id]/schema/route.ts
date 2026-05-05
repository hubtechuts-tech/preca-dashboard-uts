/**
 * Service Form Schema API Route
 *
 * PATCH /api/services/[id]/schema - Update service form schema (Admin only)
 *
 * This route allows admins to define or update the dynamic form schema
 * for a service, which determines what fields are collected during
 * screening creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServiceController } from '../../_controllers/ServiceController';
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
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies including form schema use case
 */
function createController(): ServiceController {
  const repository = new PrismaServiceCatalogRepository(prisma);

  // Stripe service (required for other service operations)
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
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
    updateFormSchemaUseCase  // NEW: Include form schema use case
  );
}

/**
 * PATCH /api/services/[id]/schema
 * Update a service's form schema (Admin only)
 *
 * Request body:
 * {
 *   "formSchema": {
 *     "version": "1.0",
 *     "fields": [
 *       {
 *         "id": "field_001",
 *         "name": "nombre_completo",
 *         "label": "Nombre completo",
 *         "type": "text",
 *         "required": true,
 *         "order": 1
 *       }
 *     ]
 *   }
 * }
 *
 * Response:
 * {
 *   "id": "1",
 *   "code": "PRECA_BASIC",
 *   "name": "Precalificación Básica",
 *   "formSchema": { ... },
 *   "hasFormSchema": true,
 *   ...
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require SERVICES_WRITE permission - only users with permission can update form schemas
    await requirePermission(request, Permission.SERVICES_WRITE);

    const { id } = await params;
    const body = await request.json();

    const controller = createController();
    const response = await controller.updateFormSchema(id, body);

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
    console.error('Unexpected error in PATCH /api/services/[id]/schema:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
