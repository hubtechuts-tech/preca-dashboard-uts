/**
 * PublicScreeningController
 *
 * Presentation layer controller for public screening operations
 * Returns only payment link for anonymous users
 */

import { CreatePublicScreeningUseCase, FormDataValidationError } from '@/application/use-cases/public/CreatePublicScreeningUseCase';
import {
  CreatePublicScreeningDTO,
  PublicScreeningResponseDTO,
  PublicValidationError,
} from '@/application/dto/public/PublicScreeningDTO';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class PublicScreeningController {
  constructor(private createScreeningUseCase: CreatePublicScreeningUseCase) {}

  /**
   * Create a new screening from public form
   * Returns only the payment link
   */
  async create(request: any): Promise<ApiResponse> {
    try {
      // Validate with DTO
      const dto = new CreatePublicScreeningDTO(request);

      // Execute use case
      const screening = await this.createScreeningUseCase.execute(dto);

      // Return minimal response with payment link only
      return {
        success: true,
        data: PublicScreeningResponseDTO.fromDomain(screening),
        statusCode: 201,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('PublicScreeningController error:', error);

    if (error instanceof PublicValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof FormDataValidationError) {
      return {
        success: false,
        error: error.message,
        statusCode: 400,
        data: {
          validationErrors: error.validationErrors
        }
      };
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('not found')) {
        return { success: false, error: error.message, statusCode: 404 };
      }

      if (error.message.includes('not available') || error.message.includes('not have')) {
        return { success: false, error: error.message, statusCode: 400 };
      }

      return { success: false, error: error.message, statusCode: 400 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
