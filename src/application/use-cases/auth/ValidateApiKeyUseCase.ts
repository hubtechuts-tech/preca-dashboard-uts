import { IApiKeyRepository } from '../../../domain/interfaces/repositories/IApiKeyRepository';
import { IApiKeyGenerator } from '../../../domain/interfaces/services/IApiKeyGenerator';
import { ApiKey } from '../../../domain/entities/ApiKey';

export class ValidateApiKeyUseCase {
  constructor(
    private apiKeyRepository: IApiKeyRepository,
    private apiKeyGenerator: IApiKeyGenerator
  ) {}

  async execute(rawKey: string): Promise<ApiKey> {
    // 1. Validate format (must be at least 32 chars)
    if (!rawKey || rawKey.length < 32) {
      throw new Error('Invalid API key format');
    }

    // 2. Hash the key to look it up
    const keyHash = await this.apiKeyGenerator.hash(rawKey);

    // 3. Find key by hash
    const apiKey = await this.apiKeyRepository.findByHash(keyHash);

    if (!apiKey) {
      throw new Error('Invalid API key');
    }

    // 4. Check if active and not expired
    if (!apiKey.isValid()) {
      throw new Error('API key is inactive or expired');
    }

    // 5. Update last used timestamp (fire and forget)
    apiKey.markAsUsed();
    await this.apiKeyRepository.save(apiKey);

    return apiKey;
  }
}
