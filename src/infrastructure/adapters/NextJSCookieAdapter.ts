/**
 * Infrastructure Layer - Next.js Cookie Session Adapter
 * Handles cookie storage for session tokens
 */

import { cookies } from 'next/headers';
import { AppConfig } from '../config/AppConfig';

export class NextJSCookieAdapter {
  private config: AppConfig;
  private cookieName: string = 'session';

  constructor(config?: AppConfig) {
    this.config = config || AppConfig.getInstance();
  }

  async setSession(token: string): Promise<void> {
    const cookieStore = await cookies();

    cookieStore.set(this.cookieName, token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      maxAge: this.config.sessionMaxAge,
      path: '/',
    });
  }

  async getSession(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(this.cookieName)?.value;
  }

  async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.cookieName);
  }
}
