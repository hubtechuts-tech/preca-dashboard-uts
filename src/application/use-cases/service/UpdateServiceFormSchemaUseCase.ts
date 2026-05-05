import { IServiceCatalogRepository } from '@/domain/interfaces/repositories/IServiceCatalogRepository';
import { ServiceCatalog } from '@/domain/entities/ServiceCatalog';
import { FormSchema } from '@/domain/value-objects/FormSchema';
import { UpdateServiceFormSchemaDTO } from '@/application/dto/service/UpdateServiceFormSchemaDTO';

/**
 * Use Case: Update a service's form schema
 * Application Layer - Business Logic Orchestration
 *
 * Responsibilities:
 * 1. Find the service by ID
 * 2. Validate the form schema structure
 * 3. Update the service with the new schema
 * 4. Persist the changes
 */
export class UpdateServiceFormSchemaUseCase {
  constructor(
    private serviceRepository: IServiceCatalogRepository
  ) {}

  async execute(dto: UpdateServiceFormSchemaDTO): Promise<ServiceCatalog> {
    // 1. Find service
    const service = await this.serviceRepository.findById(dto.serviceId);
    if (!service) {
      throw new ServiceNotFoundError(`Service with ID ${dto.serviceId} not found`);
    }

    // 2. Create FormSchema value object (validates structure)
    // This will throw an error if the schema is invalid
    const formSchema = FormSchema.fromJSON(dto.formSchema);

    // 3. Update service with new form schema (mutates entity)
    service.updateFormSchema(formSchema);

    // 4. Save to repository
    await this.serviceRepository.save(service);

    // 5. Return the updated service
    return service;
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
