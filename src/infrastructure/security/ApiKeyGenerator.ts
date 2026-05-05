import { IApiKeyGenerator, GeneratedApiKey } from '../../domain/interfaces/services/IApiKeyGenerator';

/**
 * ApiKeyGenerator using Web Crypto API (Edge Runtime compatible)
 *
 * This implementation uses the Web Crypto API instead of Node.js crypto module,
 * making it compatible with Next.js Edge Runtime (middleware).
 */
export class ApiKeyGenerator implements IApiKeyGenerator {
  async generate(prefix: string = 'pk_live_'): Promise<GeneratedApiKey> {
    // Generate 32 bytes of random data using Web Crypto API
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);

    // Convert to hex string (64 chars)
    const randomPart = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Combine prefix and random part
    const rawKey = `${prefix}${randomPart}`;

    // Hash the key using SHA-256
    const keyHash = await this.hash(rawKey);

    return {
      rawKey,
      keyHash,
      keyPrefix: prefix,
    };
  }

  async hash(rawKey: string): Promise<string> {
    // Use Web Crypto API's SHA-256
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;
  }

  async verify(rawKey: string, keyHash: string): Promise<boolean> {
    const computedHash = await this.hash(rawKey);

    // Constant-time comparison
    // Convert both strings to Uint8Arrays for comparison
    const computedBuffer = new TextEncoder().encode(computedHash);
    const storedBuffer = new TextEncoder().encode(keyHash);

    // Check lengths match first
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }

    // Perform constant-time comparison
    let result = 0;
    for (let i = 0; i < computedBuffer.length; i++) {
      result |= computedBuffer[i] ^ storedBuffer[i];
    }

    return result === 0;
  }
}
