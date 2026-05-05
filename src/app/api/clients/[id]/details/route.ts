/**
 * Client Details API Route
 *
 * GET /api/clients/[id]/details - Get a specific client with full screening list
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientController } from '../../_controllers/ClientController';
import { ListClientsUseCase } from '@/application/use-cases/client/ListClientsUseCase';
import { GetClientByIdUseCase } from '@/application/use-cases/client/GetClientByIdUseCase';
import { GetClientDetailsUseCase } from '@/application/use-cases/client/GetClientDetailsUseCase';
import { PrismaUserRepository } from '@/infrastructure/database/repositories/PrismaUserRepository';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';

/**
 * Create controller with all dependencies
 */
function createController(): ClientController {
  const repository = new PrismaUserRepository(prisma);

  const listUseCase = new ListClientsUseCase(repository);
  const getByIdUseCase = new GetClientByIdUseCase(repository);
  const getDetailsUseCase = new GetClientDetailsUseCase(repository);

  return new ClientController(listUseCase, getByIdUseCase, getDetailsUseCase);
}

/**
 * GET /api/clients/[id]/details
 * Get a specific client with their full screening list and statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth(request);

    const { id } = await params;
    const controller = createController();
    const response = await controller.getDetails(id);

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
    console.error('Unexpected error in GET /api/clients/[id]/details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
