/**
 * Application Layer - API Key DTOs
 * Data Transfer Objects for API key operations
 */

import { ApiKeyValidationError } from '../../../domain/errors/ApiKeyErrors';

/**
 * DTO for creating a new API key
 */
export class CreateApiKeyDTO {
  scopes: string[];
  expiresAt: Date | null;

  constructor(data: any) {
    this.scopes = data.scopes || [];
    this.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Validate scopes
    if (!Array.isArray(this.scopes) || this.scopes.length === 0) {
      errors.push('At least one scope is required');
    }

    // Validate expiration date
    if (this.expiresAt && this.expiresAt <= new Date()) {
      errors.push('Expiration date must be in the future');
    }

    if (errors.length > 0) {
      throw new ApiKeyValidationError(errors.join(', '));
    }
  }
}

/**
 * DTO for API key response (safe to return to client)
 */
export class ApiKeyResponseDTO {
  id: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  rawKey?: string; // Only included on creation

  constructor(data: {
    id: string;
    keyPrefix: string;
    scopes: string[];
    isActive: boolean;
    lastUsedAt: Date | null;
    createdAt: Date;
    expiresAt: Date | null;
    rawKey?: string;
  }) {
    this.id = data.id;
    this.keyPrefix = data.keyPrefix;
    this.scopes = data.scopes;
    this.isActive = data.isActive;
    this.lastUsedAt = data.lastUsedAt;
    this.createdAt = data.createdAt;
    this.expiresAt = data.expiresAt;
    this.rawKey = data.rawKey;
  }

  static fromDomain(apiKey: any, rawKey?: string): ApiKeyResponseDTO {
    const safe = apiKey.toSafeObject();
    return new ApiKeyResponseDTO({
      ...safe,
      rawKey,
    });
  }
}

/**
 * DTO for updating an API key
 */
export class UpdateApiKeyDTO {
  scopes?: string[];
  isActive?: boolean;

  constructor(data: any) {
    this.scopes = data.scopes;
    this.isActive = data.isActive;
    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Validate scopes if provided
    if (this.scopes !== undefined) {
      if (!Array.isArray(this.scopes) || this.scopes.length === 0) {
        errors.push('Scopes must be a non-empty array if provided');
      }
    }

    if (errors.length > 0) {
      throw new ApiKeyValidationError(errors.join(', '));
    }
  }

  hasChanges(): boolean {
    return this.scopes !== undefined || this.isActive !== undefined;
  }
}
