/**
 * ListServicesUseCase
 *
 * Retrieves all services or filters by active status
 */

import { ServiceCatalog, PersonType } from '../../../domain/entities/ServiceCatalog';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';

export interface ListServicesFilters {
  activeOnly?: boolean;
  personType?: PersonType;
}

export class ListServicesUseCase {
  constructor(private serviceRepository: IServiceCatalogRepository) {}

  async execute(filters?: ListServicesFilters): Promise<ServiceCatalog[]> {
    // If filtering by person type and active
    if (filters?.personType && filters?.activeOnly) {
      return await this.serviceRepository.findActiveByPersonType(filters.personType);
    }

    // If filtering by active only
    if (filters?.activeOnly) {
      return await this.serviceRepository.findAllActive();
    }

    // Return all services
    return await this.serviceRepository.findAll();
  }
}
