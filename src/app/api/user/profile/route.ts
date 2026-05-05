/**
 * User Profile API Route
 *
 * GET    /api/user/profile        - Get current user profile
 * PATCH  /api/user/profile        - Update current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '../_controllers/UserController';
import { UpdateProfileUseCase } from '@/application/use-cases/user/UpdateProfileUseCase';
import { UpdatePasswordUseCase } from '@/application/use-cases/user/UpdatePasswordUseCase';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth } from '@/lib/api-auth';
import { UserResponseDTO } from '@/application/dto/user/UserDTO';

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
 * GET /api/user/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request);

    const userRepository = new PrismaUserRepository(prisma);
    const user = await userRepository.findById(session.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(UserResponseDTO.fromDomain(user), { status: 200 });
  } catch (error: any) {
    console.error('Unexpected error in GET /api/user/profile:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/profile
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request);
    const body = await request.json();

    const controller = createController();
    const response = await controller.updateProfile(session.userId, body);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error: any) {
    console.error('Unexpected error in PATCH /api/user/profile:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
