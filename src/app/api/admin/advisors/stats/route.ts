/**
 * Advisor Stats API Route
 *
 * GET /api/admin/advisors/stats - Get top advisors by screening count
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvisorController } from '../_controllers/AdvisorController';
import { CreateAdvisorUseCase } from '@/application/use-cases/advisor/CreateAdvisorUseCase';
import { ListAdvisorsUseCase } from '@/application/use-cases/advisor/ListAdvisorsUseCase';
import { GetAdvisorByIdUseCase } from '@/application/use-cases/advisor/GetAdvisorByIdUseCase';
import { UpdateAdvisorUseCase } from '@/application/use-cases/advisor/UpdateAdvisorUseCase';
import { DeleteAdvisorUseCase } from '@/application/use-cases/advisor/DeleteAdvisorUseCase';
import { ToggleAdvisorStatusUseCase } from '@/application/use-cases/advisor/ToggleAdvisorStatusUseCase';
import { GetTopAdvisorsUseCase } from '@/application/use-cases/advisor/GetTopAdvisorsUseCase';
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
  const getTopAdvisorsUseCase = new GetTopAdvisorsUseCase(repository);

  return new AdvisorController(
    createUseCase,
    listUseCase,
    getByIdUseCase,
    updateUseCase,
    deleteUseCase,
    toggleStatusUseCase,
    undefined,
    getTopAdvisorsUseCase
  );
}

/**
 * GET /api/admin/advisors/stats
 * Get top advisors by screening count
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADVISORS_READ permission
    await requirePermission(request, Permission.ADVISORS_READ);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const controller = createController();
    const response = await controller.getTopStats(limit);

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
    console.error('Unexpected error in GET /api/admin/advisors/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
