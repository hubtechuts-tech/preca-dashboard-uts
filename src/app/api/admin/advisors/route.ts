/**
 * Admin Advisors API Route
 *
 * POST /api/admin/advisors - Create a new advisor (Admin only)
 * GET /api/admin/advisors - List all advisors (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvisorController } from './_controllers/AdvisorController';
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
 * POST /api/admin/advisors
 * Create a new advisor
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require ADVISORS_WRITE permission
    await requirePermission(request, Permission.ADVISORS_WRITE);

    // Parse request body
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
    console.error('Unexpected error in POST /api/admin/advisors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/advisors
 * List all advisors with optional filters
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Require ADVISORS_READ permission
    await requirePermission(request, Permission.ADVISORS_READ);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    const activeOnly = searchParams.get('activeOnly');
    if (activeOnly !== null) {
      filters.activeOnly = activeOnly === 'true';
    }

    const limit = searchParams.get('limit');
    if (limit) {
      filters.limit = parseInt(limit, 10);
    }

    const offset = searchParams.get('offset');
    if (offset) {
      filters.offset = parseInt(offset, 10);
    }

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
    console.error('Unexpected error in GET /api/admin/advisors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
