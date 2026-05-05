/**
 * IServiceCatalogRepository Interface
 *
 * Contract for service catalog data access.
 */

import { ServiceCatalog, PersonType } from '../../entities/ServiceCatalog';

export interface IServiceCatalogRepository {
  /**
   * Find a service by its unique ID
   */
  /**
   * Find a service by its unique ID
   */
  findById(id: number): Promise<ServiceCatalog | null>;

  /**
   * Find a service by its code (e.g., "PRECA_BASIC")
   */
  findByCode(code: string): Promise<ServiceCatalog | null>;

  /**
   * Find all active services
   */
  findAllActive(): Promise<ServiceCatalog[]>;

  /**
   * Find active services by person type
   */
  findActiveByPersonType(personType: PersonType): Promise<ServiceCatalog[]>;

  /**
   * Find all services (including inactive)
   */
  findAll(): Promise<ServiceCatalog[]>;

  /**
   * Save a service (create or update)
   */
  save(service: ServiceCatalog): Promise<void>;

  /**
   * Delete a service by ID
   */
  delete(id: number): Promise<void>;

  /**
   * Check if a service code exists
   */
  existsByCode(code: string): Promise<boolean>;
}
