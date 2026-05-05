/**
 * Staff Member API Routes (by ID)
 *
 * GET /api/staff/:id - Get a staff member (ADMIN ONLY)
 * PATCH /api/staff/:id - Update a staff member (ADMIN ONLY)
 * DELETE /api/staff/:id - Delete a staff member (ADMIN ONLY)
 */

import { NextRequest, NextResponse } from 'next/server';
import { StaffController } from '../_controllers/StaffController';
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
 * GET /api/staff/:id
 * Get a staff member by ID
 * ADMIN ONLY
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, Permission.USERS_READ);
    const { id } = await params;

    const controller = createController();
    const response = await controller.get(id);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in GET /api/staff/:id:', error);

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
 * PATCH /api/staff/:id
 * Update a staff member
 * ADMIN ONLY
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, Permission.USERS_WRITE);
    const { id } = await params;

    const body = await request.json();

    const controller = createController();
    const response = await controller.update(id, body);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/staff/:id:', error);

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
 * DELETE /api/staff/:id
 * Delete a staff member
 * ADMIN ONLY
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(request, Permission.USERS_WRITE);
    const { id } = await params;

    const controller = createController();
    const response = await controller.delete(id);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in DELETE /api/staff/:id:', error);

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
