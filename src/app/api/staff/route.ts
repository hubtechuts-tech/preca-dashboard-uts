/**
 * Staff Management API Routes
 *
 * GET /api/staff - List all staff members (ADMIN ONLY)
 * POST /api/staff - Create a new staff member (ADMIN ONLY)
 *
 * All endpoints require admin authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { StaffController } from './_controllers/StaffController';
import { CreateStaffUseCase } from '@/application/use-cases/staff/CreateStaffUseCase';
import { UpdateStaffUseCase } from '@/application/use-cases/staff/UpdateStaffUseCase';
import { ListStaffUseCase } from '@/application/use-cases/staff/ListStaffUseCase';
import { GetStaffUseCase } from '@/application/use-cases/staff/GetStaffUseCase';
import { DeleteStaffUseCase } from '@/application/use-cases/staff/DeleteStaffUseCase';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requirePermission } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies
 */
function createController(): StaffController {
  const userRepository = new PrismaUserRepository(prisma);

  const createUseCase = new CreateStaffUseCase(userRepository);
  const updateUseCase = new UpdateStaffUseCase(userRepository);
  const listUseCase = new ListStaffUseCase(userRepository);
  const getUseCase = new GetStaffUseCase(userRepository);
  const deleteUseCase = new DeleteStaffUseCase(userRepository);

  return new StaffController(
    createUseCase,
    updateUseCase,
    listUseCase,
    getUseCase,
    deleteUseCase
  );
}

/**
 * GET /api/staff
 * List all staff members
 * ADMIN ONLY
 */
export async function GET(request: NextRequest) {
  try {
    // Require USERS_READ permission
    await requirePermission(request, Permission.USERS_READ);

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const controller = createController();
    const response = await controller.list({ limit, offset });

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in GET /api/staff:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/staff
 * Create a new staff member
 * ADMIN ONLY
 */
export async function POST(request: NextRequest) {
  try {
    // Require USERS_WRITE permission
    await requirePermission(request, Permission.USERS_WRITE);

    const body = await request.json();

    const controller = createController();
    const response = await controller.create(body);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in POST /api/staff:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
