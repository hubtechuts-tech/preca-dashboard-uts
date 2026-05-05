/**
 * ListPublicServicesUseCase
 *
 * Public endpoint to list active services
 * Returns only active services with minimal data for landing page
 */

import { ServiceCatalog, PersonType } from '../../../domain/entities/ServiceCatalog';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';

export interface ListPublicServicesFilters {
  personType?: PersonType;
}

export class ListPublicServicesUseCase {
  constructor(private serviceRepository: IServiceCatalogRepository) {}

  async execute(filters?: ListPublicServicesFilters): Promise<ServiceCatalog[]> {
    // Always filter by active services for public endpoint
    if (filters?.personType) {
      return await this.serviceRepository.findActiveByPersonType(filters.personType);
    }

    // Return all active services
    return await this.serviceRepository.findAllActive();
  }
}
