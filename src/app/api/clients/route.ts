/**
 * Clients API Route
 *
 * GET /api/clients - List all clients with stats
 * GET /api/clients?q=query - Search clients by name, email, or phone
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClientController } from './_controllers/ClientController';
import { ListClientsUseCase } from '@/application/use-cases/client/ListClientsUseCase';
import { GetClientByIdUseCase } from '@/application/use-cases/client/GetClientByIdUseCase';
import { GetClientDetailsUseCase } from '@/application/use-cases/client/GetClientDetailsUseCase';
import { SearchClientsUseCase } from '@/application/use-cases/client/SearchClientsUseCase';
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
  const searchUseCase = new SearchClientsUseCase(repository);

  return new ClientController(listUseCase, getByIdUseCase, getDetailsUseCase, searchUseCase);
}

/**
 * GET /api/clients
 * List all clients with their screening statistics
 * GET /api/clients?q=query - Search clients by name, email, or phone
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth(request);

    const controller = createController();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    // If query param is present, use search
    if (query) {
      const response = await controller.search(query);
      if (response.success) {
        return NextResponse.json(response.data, { status: response.statusCode });
      } else {
        return NextResponse.json({ error: response.error }, { status: response.statusCode });
      }
    }

    // Otherwise, list all clients
    const response = await controller.list();

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
    console.error('Unexpected error in GET /api/clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
