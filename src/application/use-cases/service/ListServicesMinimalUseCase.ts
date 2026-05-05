/**
 * ListServicesMinimalUseCase
 *
 * Retrieves services with minimal data (id, name, description, price)
 * Used for API key authenticated endpoints
 */

import { ServiceCatalog, PersonType } from '../../../domain/entities/ServiceCatalog';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';

export interface ListServicesMinimalFilters {
  activeOnly?: boolean;
  personType?: PersonType;
}

export class ListServicesMinimalUseCase {
  constructor(private serviceRepository: IServiceCatalogRepository) {}

  async execute(filters?: ListServicesMinimalFilters): Promise<ServiceCatalog[]> {
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
