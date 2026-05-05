/**
 * User Password API Route
 *
 * PUT    /api/user/password       - Update current user password
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '../_controllers/UserController';
import { UpdateProfileUseCase } from '@/application/use-cases/user/UpdateProfileUseCase';
import { UpdatePasswordUseCase } from '@/application/use-cases/user/UpdatePasswordUseCase';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth } from '@/lib/api-auth';

/**
 * Create controller with all dependencies
 */
function createController(): UserController {
  const userRepository = new PrismaUserRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher();

  const updateProfileUseCase = new UpdateProfileUseCase(userRepository);
  const updatePasswordUseCase = new UpdatePasswordUseCase(userRepository, passwordHasher);

  return new UserController(updateProfileUseCase, updatePasswordUseCase);
}

/**
 * PUT /api/user/password
 * Update current user password
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();

    const controller = createController();
    const response = await controller.updatePassword(session.userId, body);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/user/password:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
