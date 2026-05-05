/**
 * DeleteServiceUseCase
 *
 * Deletes a service from the catalog
 * Note: Should check if service has any screenings before deletion
 */

import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { IStripeService } from '../../../domain/interfaces/services/IStripeService';
import { ServiceNotFoundError } from '../../../domain/errors/ServiceErrors';
import { StripeIntegrationError } from '../../../domain/errors/StripeErrors';

export class DeleteServiceUseCase {
  constructor(
    private serviceRepository: IServiceCatalogRepository,
    private stripeService: IStripeService
  ) {}

  async execute(serviceId: string): Promise<void> {
    // Find service
    const service = await this.serviceRepository.findById(Number(serviceId));
    if (!service) {
      throw new ServiceNotFoundError(serviceId);
    }

    // Note: In production, you should check if service has any screenings
    // and prevent deletion if it does. For now, we'll just delete it.

    // CRITICAL: Deactivate in Stripe first (don't delete from Stripe, just deactivate)
    // This ensures the product can't be used for new payment links
    if (service.stripeProductId) {
      try {
        await this.stripeService.deactivateProduct(service.stripeProductId);
      } catch (error) {
        throw new StripeIntegrationError(
          'Failed to deactivate product in Stripe. Service NOT deleted to prevent orphaned Stripe products.',
          error
        );
      }
    }

    // Delete from repository
    await this.serviceRepository.delete(Number(serviceId));
  }
}
