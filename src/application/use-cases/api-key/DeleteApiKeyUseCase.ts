/**
 * Application Layer - Delete API Key Use Case
 * Handles permanent deletion of an API key
 */

import { IApiKeyRepository } from '../../../domain/interfaces/repositories/IApiKeyRepository';
import { ApiKeyNotFoundError } from '../../../domain/errors/ApiKeyErrors';

export class DeleteApiKeyUseCase {
  constructor(private apiKeyRepository: IApiKeyRepository) {}

  async execute(keyId: string, userId: string): Promise<void> {
    // Find the API key
    const apiKey = await this.apiKeyRepository.findById(keyId);

    if (!apiKey) {
      throw new ApiKeyNotFoundError(keyId);
    }

    // Business rule: User can only delete their own keys
    if (apiKey.userId !== userId) {
      throw new Error('Unauthorized: Cannot delete API key belonging to another user');
    }

    // Delete the key permanently
    await this.apiKeyRepository.delete(keyId);
  }
}
