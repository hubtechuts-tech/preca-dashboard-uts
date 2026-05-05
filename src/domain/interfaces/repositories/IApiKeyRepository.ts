/**
 * IApiKeyRepository Interface
 *
 * Contract for API key data access.
 */

import { ApiKey } from '../../entities/ApiKey';

export interface IApiKeyRepository {
  /**
   * Find an API key by its unique ID
   */
  findById(id: string): Promise<ApiKey | null>;

  /**
   * Find an API key by its hash (used for authentication)
   */
  findByHash(keyHash: string): Promise<ApiKey | null>;

  /**
   * Find all API keys for a specific user
   */
  findByUserId(userId: string): Promise<ApiKey[]>;

  /**
   * Find all active API keys for a user
   */
  findActiveByUserId(userId: string): Promise<ApiKey[]>;

  /**
   * Save an API key (create or update)
   */
  save(apiKey: ApiKey): Promise<void>;

  /**
   * Delete an API key by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Revoke all keys for a user
   */
  revokeAllForUser(userId: string): Promise<void>;
}
