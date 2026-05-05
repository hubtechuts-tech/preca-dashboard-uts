/**
 * Admin Advisor by ID API Route
 *
 * GET /api/admin/advisors/[id] - Get advisor by ID (Admin only)
 * PUT /api/admin/advisors/[id] - Update advisor (Admin only)
 * DELETE /api/admin/advisors/[id] - Delete advisor (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvisorController } from '../_controllers/AdvisorController';
import { CreateAdvisorUseCase } from '@/application/use-cases/advisor/CreateAdvisorUseCase';
import { ListAdvisorsUseCase } from '@/application/use-cases/advisor/ListAdvisorsUseCase';
import { GetAdvisorByIdUseCase } from '@/application/use-cases/advisor/GetAdvisorByIdUseCase';
import { UpdateAdvisorUseCase } from '@/application/use-cases/advisor/UpdateAdvisorUseCase';
import { DeleteAdvisorUseCase } from '@/application/use-cases/advisor/DeleteAdvisorUseCase';
import { ToggleAdvisorStatusUseCase } from '@/application/use-cases/advisor/ToggleAdvisorStatusUseCase';
import { PrismaAdvisorRepository } from '@/infrastructure/database/repositories/PrismaAdvisorRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies
 */
function createController(): AdvisorController {
  const advisorRepository = new PrismaAdvisorRepository(prisma);

  const createUseCase = new CreateAdvisorUseCase(advisorRepository);
  const listUseCase = new ListAdvisorsUseCase(advisorRepository);
  const getByIdUseCase = new GetAdvisorByIdUseCase(advisorRepository);
  const updateUseCase = new UpdateAdvisorUseCase(advisorRepository);
  const deleteUseCase = new DeleteAdvisorUseCase(advisorRepository);
  const toggleStatusUseCase = new ToggleAdvisorStatusUseCase(advisorRepository);

  return new AdvisorController(
    createUseCase,
    listUseCase,
    getByIdUseCase,
    updateUseCase,
    deleteUseCase,
    toggleStatusUseCase
  );
}

/**
 * GET /api/admin/advisors/[id]
 * Get advisor by ID
 * Requires admin authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADVISORS_READ permission
    await requirePermission(request, Permission.ADVISORS_READ);

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid advisor ID' }, { status: 400 });
    }

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
    console.error('Unexpected error in GET /api/admin/advisors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/advisors/[id]
 * Update advisor
 * Requires admin authentication
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADVISORS_WRITE permission
    await requirePermission(request, Permission.ADVISORS_WRITE);

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid advisor ID' }, { status: 400 });
    }

    // Parse request body
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
    console.error('Unexpected error in PUT /api/admin/advisors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/advisors/[id]
 * Delete advisor
 * Requires admin authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADVISORS_WRITE permission
    await requirePermission(request, Permission.ADVISORS_WRITE);

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid advisor ID' }, { status: 400 });
    }

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
    console.error('Unexpected error in DELETE /api/admin/advisors/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
