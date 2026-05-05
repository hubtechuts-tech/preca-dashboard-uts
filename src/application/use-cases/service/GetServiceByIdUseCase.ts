/**
 * GetServiceByIdUseCase
 *
 * Retrieves a service by its ID
 */

import { ServiceCatalog } from '../../../domain/entities/ServiceCatalog';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { ServiceNotFoundError } from '../../../domain/errors/ServiceErrors';

export class GetServiceByIdUseCase {
  constructor(private serviceRepository: IServiceCatalogRepository) {}

  async execute(serviceId: string): Promise<ServiceCatalog> {
    const service = await this.serviceRepository.findById(Number(serviceId));

    if (!service) {
      throw new ServiceNotFoundError(serviceId);
    }

    return service;
  }
}
