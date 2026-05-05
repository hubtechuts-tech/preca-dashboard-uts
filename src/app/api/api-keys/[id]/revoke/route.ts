/**
 * API Key Revoke Route
 *
 * POST /api/api-keys/[id]/revoke - Revoke an API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiKeyController } from '../../_controllers/ApiKeyController';
import { CreateApiKeyUseCase } from '@/application/use-cases/api-key/CreateApiKeyUseCase';
import { ListApiKeysUseCase } from '@/application/use-cases/api-key/ListApiKeysUseCase';
import { RevokeApiKeyUseCase } from '@/application/use-cases/api-key/RevokeApiKeyUseCase';
import { DeleteApiKeyUseCase } from '@/application/use-cases/api-key/DeleteApiKeyUseCase';
import { PrismaApiKeyRepository } from '@/infrastructure/database/repositories/PrismaApiKeyRepository';
import { ApiKeyGenerator } from '@/infrastructure/security/ApiKeyGenerator';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requireAuth, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';

/**
 * Create controller with all dependencies
 */
function createController(): ApiKeyController {
  const repository = new PrismaApiKeyRepository(prisma);
  const generator = new ApiKeyGenerator();

  const createUseCase = new CreateApiKeyUseCase(repository, generator);
  const listUseCase = new ListApiKeysUseCase(repository);
  const revokeUseCase = new RevokeApiKeyUseCase(repository);
  const deleteUseCase = new DeleteApiKeyUseCase(repository);

  return new ApiKeyController(
    createUseCase,
    listUseCase,
    revokeUseCase,
    deleteUseCase
  );
}

/**
 * POST /api/api-keys/[id]/revoke
 * Revoke an API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth(request);

    const { id } = await params;
    const controller = createController();
    const response = await controller.revoke(id, session.userId);

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
    console.error('Unexpected error in POST /api/api-keys/[id]/revoke:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
