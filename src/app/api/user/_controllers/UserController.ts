/**
 * Presentation Layer - User Controller
 * Orchestrates user operations between use cases and HTTP
 */

import { UpdateProfileUseCase } from '@/application/use-cases/user/UpdateProfileUseCase';
import { UpdatePasswordUseCase } from '@/application/use-cases/user/UpdatePasswordUseCase';
import { UpdateProfileDTO, UpdatePasswordDTO, UserResponseDTO, ValidationError } from '@/application/dto/user/UserDTO';
import { UserNotFoundError, InvalidPasswordError } from '@/domain/errors/UserErrors';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class UserController {
  constructor(
    private updateProfileUseCase: UpdateProfileUseCase,
    private updatePasswordUseCase: UpdatePasswordUseCase
  ) {}

  /**
   * Update user profile
   */
  async updateProfile(userId: string, request: any): Promise<ApiResponse> {
    try {
      const dto = new UpdateProfileDTO(request);

      if (!dto.hasChanges()) {
        return {
          success: false,
          error: 'No fields to update',
          statusCode: 400
        };
      }

      const user = await this.updateProfileUseCase.execute(userId, dto);

      return {
        success: true,
        data: UserResponseDTO.fromDomain(user),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, request: any): Promise<ApiResponse> {
    try {
      const dto = new UpdatePasswordDTO(request);

      await this.updatePasswordUseCase.execute(userId, dto);

      return {
        success: true,
        data: { message: 'Password updated successfully' },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('UserController error:', error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof UserNotFoundError) {
      return { success: false, error: error.message, statusCode: 404 };
    }

    if (error instanceof InvalidPasswordError) {
      return { success: false, error: error.message, statusCode: 401 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
