/**
 * Infrastructure Layer - JWT Session Service Implementation
 * Handles JWT token creation and verification
 */

import { SignJWT, jwtVerify } from 'jose';
import { ISessionService, SessionData } from '../../domain/interfaces/services/ISessionService';
import { AppConfig } from '../config/AppConfig';

export class JWTSessionService implements ISessionService {
  private config: AppConfig;

  constructor(config?: AppConfig) {
    this.config = config || AppConfig.getInstance();
  }

  private getSecretKey(): Uint8Array {
    return new TextEncoder().encode(this.config.sessionSecret);
  }

  async createSessionToken(data: SessionData): Promise<string> {
    const secret = this.getSecretKey();

    const token = await new SignJWT({
      userId: data.userId,
      email: data.email,
      role: data.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    return token;
  }

  async verifySessionToken(token: string): Promise<SessionData> {
    const secret = this.getSecretKey();

    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };
  }
}
