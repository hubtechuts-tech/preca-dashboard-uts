/**
 * Presentation Layer - API Key Controller
 * Orchestrates API key operations and handles HTTP concerns
 */

import { CreateApiKeyUseCase } from '@/application/use-cases/api-key/CreateApiKeyUseCase';
import { ListApiKeysUseCase, ListApiKeysFilters } from '@/application/use-cases/api-key/ListApiKeysUseCase';
import { RevokeApiKeyUseCase } from '@/application/use-cases/api-key/RevokeApiKeyUseCase';
import { DeleteApiKeyUseCase } from '@/application/use-cases/api-key/DeleteApiKeyUseCase';
import { CreateApiKeyDTO, ApiKeyResponseDTO } from '@/application/dto/api-key/ApiKeyDTO';
import {
  ApiKeyNotFoundError,
  ApiKeyValidationError,
  ApiKeyLimitExceededError,
} from '@/domain/errors/ApiKeyErrors';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ApiKeyController {
  constructor(
    private createUseCase: CreateApiKeyUseCase,
    private listUseCase: ListApiKeysUseCase,
    private revokeUseCase: RevokeApiKeyUseCase,
    private deleteUseCase: DeleteApiKeyUseCase
  ) {}

  /**
   * Create a new API key
   */
  async create(request: any, userId: string): Promise<ApiResponse> {
    try {
      const dto = new CreateApiKeyDTO(request);
      const result = await this.createUseCase.execute(dto, userId);

      return {
        success: true,
        data: ApiKeyResponseDTO.fromDomain(result.apiKey, result.rawKey),
        statusCode: 201,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List all API keys for a user
   */
  async list(userId: string, filters?: ListApiKeysFilters): Promise<ApiResponse> {
    try {
      const apiKeys = await this.listUseCase.execute(userId, filters);

      return {
        success: true,
        data: apiKeys.map(key => ApiKeyResponseDTO.fromDomain(key)),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Revoke an API key
   */
  async revoke(keyId: string, userId: string): Promise<ApiResponse> {
    try {
      await this.revokeUseCase.execute(keyId, userId);

      return {
        success: true,
        data: { message: 'API key revoked successfully' },
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete an API key
   */
  async delete(keyId: string, userId: string): Promise<ApiResponse> {
    try {
      await this.deleteUseCase.execute(keyId, userId);

      return {
        success: true,
        data: { message: 'API key deleted successfully' },
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('ApiKeyController error:', error);

    if (error instanceof ApiKeyValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof ApiKeyNotFoundError) {
      return { success: false, error: error.message, statusCode: 404 };
    }

    if (error instanceof ApiKeyLimitExceededError) {
      return { success: false, error: error.message, statusCode: 429 };
    }

    if (error instanceof Error && error.message.startsWith('Unauthorized')) {
      return { success: false, error: error.message, statusCode: 403 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
