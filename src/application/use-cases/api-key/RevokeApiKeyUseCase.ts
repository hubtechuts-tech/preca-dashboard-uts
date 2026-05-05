/**
 * Application Layer - Revoke API Key Use Case
 * Handles revoking (deactivating) an API key
 */

import { IApiKeyRepository } from '../../../domain/interfaces/repositories/IApiKeyRepository';
import { ApiKeyNotFoundError } from '../../../domain/errors/ApiKeyErrors';

export class RevokeApiKeyUseCase {
  constructor(private apiKeyRepository: IApiKeyRepository) {}

  async execute(keyId: string, userId: string): Promise<void> {
    // Find the API key
    const apiKey = await this.apiKeyRepository.findById(keyId);

    if (!apiKey) {
      throw new ApiKeyNotFoundError(keyId);
    }

    // Business rule: User can only revoke their own keys
    if (apiKey.userId !== userId) {
      throw new Error('Unauthorized: Cannot revoke API key belonging to another user');
    }

    // Revoke the key
    apiKey.revoke();

    // Save changes
    await this.apiKeyRepository.save(apiKey);
  }
}
