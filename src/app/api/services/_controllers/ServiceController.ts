/**
 * ServiceController
 *
 * Presentation layer controller for Service Catalog operations
 * Orchestrates use cases and handles HTTP concerns
 */

import { CreateServiceUseCase } from '@/application/use-cases/service/CreateServiceUseCase';
import { UpdateServiceUseCase } from '@/application/use-cases/service/UpdateServiceUseCase';
import { ListServicesUseCase, ListServicesFilters } from '@/application/use-cases/service/ListServicesUseCase';
import { ListServicesMinimalUseCase, ListServicesMinimalFilters } from '@/application/use-cases/service/ListServicesMinimalUseCase';
import { GetServiceByIdUseCase } from '@/application/use-cases/service/GetServiceByIdUseCase';
import { DeleteServiceUseCase } from '@/application/use-cases/service/DeleteServiceUseCase';
import { UpdateServiceFormSchemaUseCase, ServiceNotFoundError as SchemaServiceNotFoundError } from '@/application/use-cases/service/UpdateServiceFormSchemaUseCase';
import { CreateServiceDTO, UpdateServiceDTO, ServiceResponseDTO, ServiceMinimalDTO, ValidationError } from '@/application/dto/service/ServiceDTO';
import { UpdateServiceFormSchemaDTO, ValidationError as SchemaValidationError } from '@/application/dto/service/UpdateServiceFormSchemaDTO';
import { ServiceNotFoundError, ServiceCodeAlreadyExistsError, StripeIntegrationError } from '@/domain/errors/ServiceErrors';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ServiceController {
  constructor(
    private createServiceUseCase: CreateServiceUseCase,
    private updateServiceUseCase: UpdateServiceUseCase,
    private listServicesUseCase: ListServicesUseCase,
    private listServicesMinimalUseCase: ListServicesMinimalUseCase,
    private getServiceByIdUseCase: GetServiceByIdUseCase,
    private deleteServiceUseCase: DeleteServiceUseCase,
    private updateFormSchemaUseCase?: UpdateServiceFormSchemaUseCase  // NEW: Optional for backward compatibility
  ) {}

  /**
   * Create a new service
   */
  async create(request: any): Promise<ApiResponse> {
    try {
      const dto = new CreateServiceDTO(request);
      const service = await this.createServiceUseCase.execute(dto);

      return {
        success: true,
        data: ServiceResponseDTO.fromDomain(service),
        statusCode: 201
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update an existing service
   */
  async update(serviceId: string, request: any): Promise<ApiResponse> {
    try {
      const dto = new UpdateServiceDTO(request);

      if (!dto.hasChanges()) {
        return {
          success: false,
          error: 'No fields to update',
          statusCode: 400
        };
      }

      const service = await this.updateServiceUseCase.execute(serviceId, dto);

      return {
        success: true,
        data: ServiceResponseDTO.fromDomain(service),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List all services with optional filters
   */
  async list(filters?: ListServicesFilters): Promise<ApiResponse> {
    try {
      const services = await this.listServicesUseCase.execute(filters);

      return {
        success: true,
        data: services.map(service => ServiceResponseDTO.fromDomain(service)),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List services with minimal data (id, name, description, price)
   * Used for API key authenticated endpoints
   */
  async listMinimal(filters?: ListServicesMinimalFilters): Promise<ApiResponse> {
    try {
      const services = await this.listServicesMinimalUseCase.execute(filters);

      return {
        success: true,
        data: services.map(service => ServiceMinimalDTO.fromDomain(service)),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get a service by ID
   */
  async getById(serviceId: string): Promise<ApiResponse> {
    try {
      const service = await this.getServiceByIdUseCase.execute(serviceId);

      return {
        success: true,
        data: ServiceResponseDTO.fromDomain(service),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a service
   */
  async delete(serviceId: string): Promise<ApiResponse> {
    try {
      await this.deleteServiceUseCase.execute(serviceId);

      return {
        success: true,
        data: { message: 'Service deleted successfully' },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update a service's form schema
   * NEW: Dynamic form schema management
   */
  async updateFormSchema(serviceId: string, request: any): Promise<ApiResponse> {
    try {
      if (!this.updateFormSchemaUseCase) {
        return {
          success: false,
          error: 'Form schema management is not available',
          statusCode: 501
        };
      }

      const parsedServiceId = parseInt(serviceId, 10);

      if (isNaN(parsedServiceId)) {
        return {
          success: false,
          error: 'Invalid service ID: must be a valid number',
          statusCode: 400
        };
      }

      const dto = new UpdateServiceFormSchemaDTO({
        serviceId: parsedServiceId,
        formSchema: request.formSchema
      });

      const service = await this.updateFormSchemaUseCase.execute(dto);

      return {
        success: true,
        data: ServiceResponseDTO.fromDomain(service),
        statusCode: 200
      };
    } catch (error) {
      return this.handleFormSchemaError(error);
    }
  }

  /**
   * Error handling for form schema operations
   */
  private handleFormSchemaError(error: unknown): ApiResponse {
    console.error('ServiceController form schema error:', error);

    if (error instanceof SchemaValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof SchemaServiceNotFoundError) {
      return { success: false, error: error.message, statusCode: 404 };
    }

    // Check for domain-level FormSchema validation errors
    if (error instanceof Error && error.message.includes('Form schema')) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }

  /**
   * Error handling
   */
  private handleError(error: unknown): ApiResponse {
    console.error('ServiceController error:', error);

    if (error instanceof ValidationError) {
      return { success: false, error: error.message, statusCode: 400 };
    }

    if (error instanceof ServiceNotFoundError) {
      return { success: false, error: error.message, statusCode: 404 };
    }

    if (error instanceof ServiceCodeAlreadyExistsError) {
      return { success: false, error: error.message, statusCode: 409 };
    }

    if (error instanceof StripeIntegrationError) {
      return { success: false, error: error.message, statusCode: 502 };
    }

    return { success: false, error: 'Internal server error', statusCode: 500 };
  }
}
