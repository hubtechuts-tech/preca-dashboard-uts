/**
 * StaffController
 *
 * Presentation layer controller for staff management operations
 * All operations require admin role
 */

import { CreateStaffUseCase } from '@/application/use-cases/staff/CreateStaffUseCase';
import { UpdateStaffUseCase } from '@/application/use-cases/staff/UpdateStaffUseCase';
import { ListStaffUseCase } from '@/application/use-cases/staff/ListStaffUseCase';
import { GetStaffUseCase } from '@/application/use-cases/staff/GetStaffUseCase';
import { DeleteStaffUseCase } from '@/application/use-cases/staff/DeleteStaffUseCase';
import {
  CreateStaffDTO,
  UpdateStaffDTO,
  StaffResponseDTO,
  StaffListResponseDTO,
  ValidationError,
} from '@/application/dto/staff/StaffDTO';
import {
  EmailAlreadyExistsError,
  StaffUserNotFoundError,
  CannotModifyAdminPermissionsError,
} from '@/domain/errors/PermissionErrors';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class StaffController {
  constructor(
    private createUseCase: CreateStaffUseCase,
    private updateUseCase: UpdateStaffUseCase,
    private listUseCase: ListStaffUseCase,
    private getUseCase: GetStaffUseCase,
    private deleteUseCase: DeleteStaffUseCase
  ) {}

  /**
   * Create a new staff member
   */
  async create(request: any): Promise<ApiResponse> {
    try {
      const dto = new CreateStaffDTO(request);
      const staff = await this.createUseCase.execute(dto);

      return {
        success: true,
        data: StaffResponseDTO.fromDomain(staff),
        statusCode: 201,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a staff member
   */
  async update(staffId: string, request: any): Promise<ApiResponse> {
    try {
      const dto = new UpdateStaffDTO(request);

      if (!dto.hasUpdates()) {
        return {
          success: false,
          error: 'No updates provided',
          statusCode: 400,
        };
      }

      const staff = await this.updateUseCase.execute(staffId, dto);

      return {
        success: true,
        data: StaffResponseDTO.fromDomain(staff),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List all staff members
   */
  async list(filters?: { limit?: number; offset?: number }): Promise<ApiResponse> {
    try {
      const staff = await this.listUseCase.execute(filters);

      return {
        success: true,
        data: StaffListResponseDTO.create(staff, staff.length),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a single staff member
   */
  async get(staffId: string): Promise<ApiResponse> {
    try {
      const staff = await this.getUseCase.execute(staffId);

      return {
        success: true,
        data: StaffResponseDTO.fromDomain(staff),
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a staff member
   */
  async delete(staffId: string): Promise<ApiResponse> {
    try {
      await this.deleteUseCase.execute(staffId);

      return {
        success: true,
        data: { message: 'Staff member deleted successfully' },
        statusCode: 200,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('StaffController error:', error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof EmailAlreadyExistsError) {
      return { success: false, error: error.message, statusCode: 409 };
    }

    if (error instanceof StaffUserNotFoundError) {
      return { success: false, error: error.message, statusCode: 404 };
    }

    if (error instanceof CannotModifyAdminPermissionsError) {
      return { success: false, error: error.message, statusCode: 403 };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
