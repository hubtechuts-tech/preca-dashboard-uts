/**
 * Admin Advisor Status API Route
 *
 * PATCH /api/admin/advisors/[id]/status - Toggle advisor status (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvisorController } from '../../_controllers/AdvisorController';
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
 * PATCH /api/admin/advisors/[id]/status
 * Toggle advisor status
 * Requires admin authentication
 */
export async function PATCH(
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
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    const controller = createController();
    const response = await controller.toggleStatus(id, isActive);

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
    console.error('Unexpected error in PATCH /api/admin/advisors/[id]/status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
