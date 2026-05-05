/**
 * IApiKeyGenerator Interface
 *
 * Contract for generating and hashing API keys.
 */

export interface GeneratedApiKey {
  rawKey: string;    // The actual key to show to the user (only once)
  keyHash: string;   // The hashed version to store in database
  keyPrefix: string; // First 10 characters for display
}

export interface IApiKeyGenerator {
  /**
   * Generate a new API key
   * @param prefix - Optional prefix (e.g., "pk_live_", "sk_test_")
   * @returns Object with raw key, hash, and prefix
   */
  generate(prefix?: string): Promise<GeneratedApiKey>;

  /**
   * Hash an existing API key
   * @param rawKey - The plain text API key
   * @returns Hashed version
   */
  hash(rawKey: string): Promise<string>;

  /**
   * Verify a raw key against its hash
   * @param rawKey - The plain text API key
   * @param keyHash - The stored hash
   * @returns True if they match
   */
  verify(rawKey: string, keyHash: string): Promise<boolean>;
}
