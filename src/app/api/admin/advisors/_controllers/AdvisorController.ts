/**
 * AdvisorController
 *
 * Presentation layer controller for advisor operations
 */

import { CreateAdvisorUseCase } from '@/application/use-cases/advisor/CreateAdvisorUseCase';
import { ListAdvisorsUseCase } from '@/application/use-cases/advisor/ListAdvisorsUseCase';
import { GetAdvisorByIdUseCase } from '@/application/use-cases/advisor/GetAdvisorByIdUseCase';
import { UpdateAdvisorUseCase } from '@/application/use-cases/advisor/UpdateAdvisorUseCase';
import { DeleteAdvisorUseCase } from '@/application/use-cases/advisor/DeleteAdvisorUseCase';
import { ToggleAdvisorStatusUseCase } from '@/application/use-cases/advisor/ToggleAdvisorStatusUseCase';
import { GetAdvisorDetailsUseCase } from '@/application/use-cases/advisor/GetAdvisorDetailsUseCase';
import { GetTopAdvisorsUseCase } from '@/application/use-cases/advisor/GetTopAdvisorsUseCase';
import { CreateAdvisorDTO, UpdateAdvisorDTO, ValidationError } from '@/application/dto/advisor/AdvisorDTO';
import { AdvisorDetailsDTOMapper } from '@/application/dto/advisor/AdvisorDetailsDTO';
import { AdvisorStatsDTOMapper } from '@/application/dto/advisor/AdvisorStatsDTO';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

export class AdvisorController {
  constructor(
    private createAdvisorUseCase: CreateAdvisorUseCase,
    private listAdvisorsUseCase: ListAdvisorsUseCase,
    private getAdvisorByIdUseCase: GetAdvisorByIdUseCase,
    private updateAdvisorUseCase: UpdateAdvisorUseCase,
    private deleteAdvisorUseCase: DeleteAdvisorUseCase,
    private toggleAdvisorStatusUseCase: ToggleAdvisorStatusUseCase,
    private getAdvisorDetailsUseCase?: GetAdvisorDetailsUseCase,
    private getTopAdvisorsUseCase?: GetTopAdvisorsUseCase
  ) {}

  /**
   * Create a new advisor
   */
  async create(request: any): Promise<ApiResponse> {
    try {
      const dto = new CreateAdvisorDTO(request);
      const advisor = await this.createAdvisorUseCase.execute(dto);

      return {
        success: true,
        data: {
          id: advisor.id,
          name: advisor.name,
          email: advisor.email,
          phoneNumber: advisor.phoneNumber,
          isActive: advisor.isActive,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt
        },
        statusCode: 201
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List all advisors with optional filters
   */
  async list(filters?: {
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse> {
    try {
      const advisors = await this.listAdvisorsUseCase.execute(filters);

      return {
        success: true,
        data: advisors.map(advisor => ({
          id: advisor.id,
          name: advisor.name,
          email: advisor.email,
          phoneNumber: advisor.phoneNumber,
          isActive: advisor.isActive,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt
        })),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get an advisor by ID
   */
  async getById(id: number): Promise<ApiResponse> {
    try {
      const advisor = await this.getAdvisorByIdUseCase.execute(id);

      return {
        success: true,
        data: {
          id: advisor.id,
          name: advisor.name,
          email: advisor.email,
          phoneNumber: advisor.phoneNumber,
          isActive: advisor.isActive,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt
        },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update an advisor
   */
  async update(id: number, request: any): Promise<ApiResponse> {
    try {
      const dto = new UpdateAdvisorDTO(request);
      const advisor = await this.updateAdvisorUseCase.execute(id, dto);

      return {
        success: true,
        data: {
          id: advisor.id,
          name: advisor.name,
          email: advisor.email,
          phoneNumber: advisor.phoneNumber,
          isActive: advisor.isActive,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt
        },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete an advisor
   */
  async delete(id: number): Promise<ApiResponse> {
    try {
      await this.deleteAdvisorUseCase.execute(id);

      return {
        success: true,
        data: { message: 'Advisor deleted successfully' },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Toggle advisor status (activate/deactivate)
   */
  async toggleStatus(id: number, isActive: boolean): Promise<ApiResponse> {
    try {
      const advisor = await this.toggleAdvisorStatusUseCase.execute(id, isActive);

      return {
        success: true,
        data: {
          id: advisor.id,
          name: advisor.name,
          email: advisor.email,
          phoneNumber: advisor.phoneNumber,
          isActive: advisor.isActive,
          createdAt: advisor.createdAt,
          updatedAt: advisor.updatedAt
        },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get advisor details with screenings
   */
  async getDetails(advisorId: number): Promise<ApiResponse> {
    try {
      if (!this.getAdvisorDetailsUseCase) {
        return { success: false, error: 'Advisor details not configured', statusCode: 500 };
      }

      const advisorDetails = await this.getAdvisorDetailsUseCase.execute(advisorId);

      return {
        success: true,
        data: AdvisorDetailsDTOMapper.fromDomain(advisorDetails),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get top advisors by screening count
   */
  async getTopStats(limit: number = 5): Promise<ApiResponse> {
    try {
      if (!this.getTopAdvisorsUseCase) {
        return { success: false, error: 'Top advisors stats not configured', statusCode: 500 };
      }

      const topAdvisors = await this.getTopAdvisorsUseCase.execute(limit);

      return {
        success: true,
        data: AdvisorStatsDTOMapper.fromDomainList(topAdvisors),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and map to appropriate HTTP responses
   */
  private handleError(error: unknown): ApiResponse {
    console.error('AdvisorController error:', error);

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        statusCode: 400
      };
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;

      // P2002: Unique constraint violation
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0] || 'campo';
        let fieldName = 'campo';

        if (field === 'email') fieldName = 'correo electrónico';
        else if (field === 'phone_number') fieldName = 'número de teléfono';

        return {
          success: false,
          error: `Ya existe un asesor con este ${fieldName}`,
          statusCode: 409
        };
      }

      // P2003: Foreign key constraint violation
      if (prismaError.code === 'P2003') {
        return {
          success: false,
          error: 'No se puede eliminar este asesor porque tiene solicitudes asociadas. Primero debe desactivarlo o reasignar las solicitudes.',
          statusCode: 409
        };
      }

      // P2025: Record not found
      if (prismaError.code === 'P2025') {
        return {
          success: false,
          error: 'Asesor no encontrado',
          statusCode: 404
        };
      }
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('already exists')) {
        return {
          success: false,
          error: error.message,
          statusCode: 409
        };
      }

      if (error.message.includes('not found')) {
        return {
          success: false,
          error: error.message,
          statusCode: 404
        };
      }

      return {
        success: false,
        error: error.message,
        statusCode: 400
      };
    }

    return {
      success: false,
      error: 'Error interno del servidor',
      statusCode: 500
    };
  }
}
