/**
 * Presentation Layer - Auth Controller
 * Orchestrates authentication flow between use cases and adapters
 */

import { LoginUseCase } from '@/application/use-cases/auth/LoginUseCase';
import { LoginDTO, ValidationError } from '@/application/dto/auth/LoginDTO';
import { ISessionService } from '@/domain/interfaces/services/ISessionService';
import { NextJSCookieAdapter } from '@/infrastructure/adapters/NextJSCookieAdapter';
import {
  InvalidCredentialsError,
  UserInactiveError,
  InvalidLoginMethodError
} from '@/domain/errors/AuthErrors';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  data?: {
    id: string;
    email: string;
    role: string;
    fullName: string | null;
  };
  error?: string;
  statusCode: number;
}

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private sessionService: ISessionService,
    private cookieAdapter: NextJSCookieAdapter
  ) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      // 1. Validate input using DTO
      const loginDTO = new LoginDTO(request.email, request.password);

      // 2. Execute login use case
      const user = await this.loginUseCase.execute(loginDTO.email, loginDTO.password);

      // 3. Create session token
      const token = await this.sessionService.createSessionToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // 4. Set session cookie
      await this.cookieAdapter.setSession(token);

      // 5. Return success response
      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        statusCode: 200,
      };
    } catch (error) {
      // Map domain errors to HTTP responses
      return this.handleError(error);
    }
  }

  private handleError(error: unknown): LoginResponse {
    // Only log unexpected errors (not validation or auth errors)
    if (
      !(error instanceof ValidationError) &&
      !(error instanceof InvalidCredentialsError) &&
      !(error instanceof UserInactiveError) &&
      !(error instanceof InvalidLoginMethodError)
    ) {
      console.error('Unexpected login error:', error);
    }

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
      };
    }

    if (error instanceof InvalidCredentialsError) {
      return {
        success: false,
        error: error.message,
        statusCode: 401,
      };
    }

    if (error instanceof UserInactiveError) {
      return {
        success: false,
        error: error.message,
        statusCode: 403,
      };
    }

    if (error instanceof InvalidLoginMethodError) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
      };
    }

    // Unknown error
    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    };
  }
}
