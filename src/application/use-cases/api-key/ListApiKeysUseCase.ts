/**
 * Application Layer - List API Keys Use Case
 * Handles listing API keys for a user
 */

import { IApiKeyRepository } from '../../../domain/interfaces/repositories/IApiKeyRepository';
import { ApiKey } from '../../../domain/entities/ApiKey';

export interface ListApiKeysFilters {
  activeOnly?: boolean;
}

export class ListApiKeysUseCase {
  constructor(private apiKeyRepository: IApiKeyRepository) {}

  async execute(userId: string, filters?: ListApiKeysFilters): Promise<ApiKey[]> {
    if (filters?.activeOnly) {
      return await this.apiKeyRepository.findActiveByUserId(userId);
    }

    return await this.apiKeyRepository.findByUserId(userId);
  }
}
