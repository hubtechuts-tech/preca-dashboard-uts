/**
 * Domain Layer - Session Service Interface
 * Defines how sessions are created and managed
 */

export interface SessionData {
  userId: string;
  email: string;
  role: string;
}

export interface ISessionService {
  /**
   * Creates a session token for the given user data
   * @param data - User session data
   * @returns Promise<string> - JWT token
   */
  createSessionToken(data: SessionData): Promise<string>;

  /**
   * Verifies and decodes a session token
   * @param token - JWT token
   * @returns Promise<SessionData> - Decoded session data
   */
  verifySessionToken(token: string): Promise<SessionData>;
}
