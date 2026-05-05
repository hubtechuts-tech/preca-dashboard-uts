/**
 * Advisor Details API Route
 *
 * GET /api/admin/advisors/[id]/details - Get a specific advisor with full screening list
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvisorController } from '../../_controllers/AdvisorController';
import { CreateAdvisorUseCase } from '@/application/use-cases/advisor/CreateAdvisorUseCase';
import { ListAdvisorsUseCase } from '@/application/use-cases/advisor/ListAdvisorsUseCase';
import { GetAdvisorByIdUseCase } from '@/application/use-cases/advisor/GetAdvisorByIdUseCase';
import { UpdateAdvisorUseCase } from '@/application/use-cases/advisor/UpdateAdvisorUseCase';
import { DeleteAdvisorUseCase } from '@/application/use-cases/advisor/DeleteAdvisorUseCase';
import { ToggleAdvisorStatusUseCase } from '@/application/use-cases/advisor/ToggleAdvisorStatusUseCase';
import { GetAdvisorDetailsUseCase } from '@/application/use-cases/advisor/GetAdvisorDetailsUseCase';
import { PrismaAdvisorRepository } from '@/infrastructure/database/repositories/PrismaAdvisorRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies
 */
function createController(): AdvisorController {
  const repository = new PrismaAdvisorRepository(prisma);

  const createUseCase = new CreateAdvisorUseCase(repository);
  const listUseCase = new ListAdvisorsUseCase(repository);
  const getByIdUseCase = new GetAdvisorByIdUseCase(repository);
  const updateUseCase = new UpdateAdvisorUseCase(repository);
  const deleteUseCase = new DeleteAdvisorUseCase(repository);
  const toggleStatusUseCase = new ToggleAdvisorStatusUseCase(repository);
  const getDetailsUseCase = new GetAdvisorDetailsUseCase(repository);

  return new AdvisorController(
    createUseCase,
    listUseCase,
    getByIdUseCase,
    updateUseCase,
    deleteUseCase,
    toggleStatusUseCase,
    getDetailsUseCase
  );
}

/**
 * GET /api/admin/advisors/[id]/details
 * Get a specific advisor with their full screening list and statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require ADVISORS_READ permission
    await requirePermission(request, Permission.ADVISORS_READ);

    const { id } = await params;
    const advisorId = parseInt(id, 10);

    if (isNaN(advisorId)) {
      return NextResponse.json({ error: 'Invalid advisor ID' }, { status: 400 });
    }

    const controller = createController();
    const response = await controller.getDetails(advisorId);

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
    console.error('Unexpected error in GET /api/admin/advisors/[id]/details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
