/**
 * PublicServiceController
 *
 * Presentation layer controller for public service operations
 * Returns minimal data needed for landing page forms
 */

import { ListPublicServicesUseCase, ListPublicServicesFilters } from '@/application/use-cases/public/ListPublicServicesUseCase';
import { PublicServiceResponseDTO } from '@/application/dto/public/PublicServiceDTO';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class PublicServiceController {
  constructor(private listServicesUseCase: ListPublicServicesUseCase) {}

  /**
   * List active services with minimal data
   */
  async list(filters?: ListPublicServicesFilters): Promise<ApiResponse> {
    try {
      const services = await this.listServicesUseCase.execute(filters);

      return {
        success: true,
        data: services.map(service => PublicServiceResponseDTO.fromDomain(service)),
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
    console.error('PublicServiceController error:', error);

    if (error instanceof Error) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
