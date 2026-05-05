/**
 * Application Layer - Create API Key Use Case
 * Handles creation of new API keys
 */

import { IApiKeyRepository } from '../../../domain/interfaces/repositories/IApiKeyRepository';
import { IApiKeyGenerator } from '../../../domain/interfaces/services/IApiKeyGenerator';
import { ApiKey } from '../../../domain/entities/ApiKey';
import { CreateApiKeyDTO } from '../../dto/api-key/ApiKeyDTO';
import { ApiKeyLimitExceededError } from '../../../domain/errors/ApiKeyErrors';

const MAX_KEYS_PER_USER = 10;

export class CreateApiKeyUseCase {
  constructor(
    private apiKeyRepository: IApiKeyRepository,
    private apiKeyGenerator: IApiKeyGenerator
  ) {}

  async execute(dto: CreateApiKeyDTO, userId: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
    // Business rule: Check if user has reached the limit
    const existingKeys = await this.apiKeyRepository.findByUserId(userId);
    if (existingKeys.length >= MAX_KEYS_PER_USER) {
      throw new ApiKeyLimitExceededError(MAX_KEYS_PER_USER);
    }

    // Generate a new API key
    const generated = await this.apiKeyGenerator.generate('preca_');

    // Create API key entity
    const apiKey = ApiKey.create(
      userId,
      generated.keyHash,
      generated.rawKey,
      dto.scopes,
      dto.expiresAt
    );

    // Save to repository
    await this.apiKeyRepository.save(apiKey);

    // Return both the entity and the raw key (only time we return it)
    return { apiKey, rawKey: generated.rawKey };
  }
}
