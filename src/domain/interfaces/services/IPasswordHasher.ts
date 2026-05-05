/**
 * IPasswordHasher Interface
 *
 * Contract for password hashing and verification.
 * The infrastructure layer will implement this using bcrypt.
 */

export interface IPasswordHasher {
  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  hash(password: string): Promise<string>;

  /**
   * Compare a plain text password with a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if passwords match
   */
  compare(password: string, hash: string): Promise<boolean>;
}
