import { IServiceCatalogRepository } from '@/domain/interfaces/repositories/IServiceCatalogRepository';
import { ValidationResult } from '@/domain/value-objects/FormSchema';

/**
 * Use Case: Validate screening form data against a service's form schema
 * Application Layer - Business Logic Orchestration
 *
 * Responsibilities:
 * 1. Retrieve the service and its form schema
 * 2. Validate the submitted form data against the schema
 * 3. Return validation results
 *
 * This use case is used when:
 * - Creating a new screening (validate before saving)
 * - n8n agents submit screening data (validate before processing)
 * - Admin creates screening from dashboard (real-time validation)
 */
export class ValidateScreeningFormDataUseCase {
  constructor(
    private serviceRepository: IServiceCatalogRepository
  ) {}

  async execute(serviceId: number, formData: Record<string, any>): Promise<ValidationResult> {
    // 1. Get service with form schema
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new ServiceNotFoundError(`Service with ID ${serviceId} not found`);
    }

    // 2. If no schema, allow any data (backward compatibility)
    // This ensures existing services without schemas continue to work
    if (!service.formSchema) {
      return {
        valid: true,
        errors: []
      };
    }

    // 3. Validate form data against schema
    const validationResult = service.formSchema.validateFormData(formData);

    return validationResult;
  }
}

/**
 * Domain Error: Service Not Found
 */
export class ServiceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceNotFoundError';
  }
}
