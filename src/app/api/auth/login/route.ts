/**
 * Presentation Layer - Login Route
 * Thin HTTP layer that delegates to AuthController
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthController } from '../_controllers/AuthController';
import { LoginUseCase } from '@/application/use-cases/auth/LoginUseCase';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { JWTSessionService } from '@/infrastructure/security/JWTSessionService';
import { NextJSCookieAdapter } from '@/infrastructure/adapters/NextJSCookieAdapter';
import { prisma } from '@/infrastructure/database/PrismaClient';

// Initialize dependencies (could be moved to a factory or DI container)
function createAuthController(): AuthController {
  // Create infrastructure implementations
  const userRepository = new PrismaUserRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher();
  const sessionService = new JWTSessionService();
  const cookieAdapter = new NextJSCookieAdapter();

  // Create use case
  const loginUseCase = new LoginUseCase(userRepository, passwordHasher);

  // Return controller with all dependencies
  return new AuthController(loginUseCase, sessionService, cookieAdapter);
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Create controller and execute login
    const authController = createAuthController();
    const response = await authController.login(body);

    // Return HTTP response
    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json(
        { error: response.error },
        { status: response.statusCode }
      );
    }
  } catch (error) {
    console.error('Unexpected error in login route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
