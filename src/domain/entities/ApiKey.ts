/**
 * ApiKey Entity
 *
 * Represents an API key for system-to-system authentication (e.g., n8n Agent).
 * Following Clean Architecture: NO dependencies on external frameworks.
 */

export interface ApiKeyProps {
  id: string;
  userId: string;
  keyPrefix: string;  // First 10 chars (e.g., "pk_live_abc")
  keyHash: string;    // Full hashed key for verification
  scopes: string[];   // Permissions (e.g., ['screening:create', 'screening:read'])
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export class ApiKey {
  private constructor(private props: ApiKeyProps) {}

  // Factory method for creating a new API key
  static create(
    userId: string,
    keyHash: string,
    rawKey: string,  // The actual key to extract prefix from
    scopes: string[] = [],
    expiresAt: Date | null = null
  ): ApiKey {
    // Business rule: Key hash must be provided
    if (!keyHash || keyHash.length === 0) {
      throw new Error('Key hash is required');
    }

    // Business rule: Raw key must be at least 32 characters
    if (!rawKey || rawKey.length < 32) {
      throw new Error('Invalid API key format');
    }

    // Business rule: At least one scope is required
    if (scopes.length === 0) {
      throw new Error('At least one scope is required');
    }

    // Business rule: Expiration date must be in the future
    if (expiresAt && expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    return new ApiKey({
      id: crypto.randomUUID(),
      userId,
      keyPrefix: rawKey.substring(0, 10),
      keyHash,
      scopes,
      isActive: true,
      lastUsedAt: null,
      createdAt: new Date(),
      expiresAt
    });
  }

  // Factory method for reconstituting from database
  static reconstitute(props: ApiKeyProps): ApiKey {
    return new ApiKey(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get keyPrefix(): string { return this.props.keyPrefix; }
  get keyHash(): string { return this.props.keyHash; }
  get scopes(): string[] { return [...this.props.scopes]; }
  get isActive(): boolean { return this.props.isActive; }
  get lastUsedAt(): Date | null { return this.props.lastUsedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get expiresAt(): Date | null { return this.props.expiresAt; }

  // Business methods
  hasScope(scope: string): boolean {
    return this.props.scopes.includes(scope);
  }

  hasAnyScope(scopes: string[]): boolean {
    return scopes.some(scope => this.props.scopes.includes(scope));
  }

  hasAllScopes(scopes: string[]): boolean {
    return scopes.every(scope => this.props.scopes.includes(scope));
  }

  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt < new Date();
  }

  isValid(): boolean {
    return this.props.isActive && !this.isExpired();
  }

  markAsUsed(): void {
    this.props.lastUsedAt = new Date();
  }

  revoke(): void {
    this.props.isActive = false;
  }

  activate(): void {
    // Business rule: Cannot activate expired keys
    if (this.isExpired()) {
      throw new Error('Cannot activate an expired key');
    }

    this.props.isActive = true;
  }

  addScope(scope: string): void {
    if (!this.props.scopes.includes(scope)) {
      this.props.scopes.push(scope);
    }
  }

  removeScope(scope: string): void {
    // Business rule: Must have at least one scope
    if (this.props.scopes.length === 1) {
      throw new Error('Cannot remove the last scope');
    }

    this.props.scopes = this.props.scopes.filter(s => s !== scope);
  }

  // Convert to plain object (for serialization)
  toObject(): ApiKeyProps {
    return { ...this.props, scopes: [...this.props.scopes] };
  }

  // Safe representation (without hash)
  toSafeObject(): Omit<ApiKeyProps, 'keyHash'> {
    const { keyHash, ...safe } = this.props;
    return { ...safe, scopes: [...this.props.scopes] };
  }
}
