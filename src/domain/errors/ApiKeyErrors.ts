/**
 * Domain Layer - API Key Errors
 * Business-specific errors for API key operations
 */

export class ApiKeyNotFoundError extends Error {
  constructor(id: string) {
    super(`API Key with id ${id} not found`);
    this.name = 'ApiKeyNotFoundError';
  }
}

export class ApiKeyInvalidError extends Error {
  constructor(message: string = 'Invalid API key') {
    super(message);
    this.name = 'ApiKeyInvalidError';
  }
}

export class ApiKeyExpiredError extends Error {
  constructor() {
    super('API key has expired');
    this.name = 'ApiKeyExpiredError';
  }
}

export class ApiKeyRevokedError extends Error {
  constructor() {
    super('API key has been revoked');
    this.name = 'ApiKeyRevokedError';
  }
}

export class ApiKeyLimitExceededError extends Error {
  constructor(limit: number) {
    super(`Maximum number of API keys (${limit}) exceeded`);
    this.name = 'ApiKeyLimitExceededError';
  }
}

export class ApiKeyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyValidationError';
  }
}
