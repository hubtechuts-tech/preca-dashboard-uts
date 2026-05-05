/**
 * Infrastructure Layer - Application Configuration
 * Centralizes environment variable access
 */

export class AppConfig {
  private static instance: AppConfig;

  private constructor() {}

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  get sessionSecret(): string {
    return process.env.SESSION_SECRET || 'dev_session_secret_change_in_production';
  }

  get sessionMaxAge(): number {
    return 60 * 60 * 24 * 7; // 7 days in seconds
  }

  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || '';
  }
}
