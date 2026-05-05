/**
 * UpdateServiceUseCase
 *
 * Updates an existing service and optionally updates it in Stripe
 */

import { ServiceCatalog } from '../../../domain/entities/ServiceCatalog';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { IStripeService } from '../../../domain/interfaces/services/IStripeService';
import { ServiceNotFoundError, StripeIntegrationError } from '../../../domain/errors/ServiceErrors';
import { UpdateServiceDTO } from '../../dto/service/ServiceDTO';

export class UpdateServiceUseCase {
  constructor(
    private serviceRepository: IServiceCatalogRepository,
    private stripeService: IStripeService
  ) {}

  async execute(serviceId: string, dto: UpdateServiceDTO): Promise<ServiceCatalog> {
    // Find existing service
    const service = await this.serviceRepository.findById(Number(serviceId));
    if (!service) {
      throw new ServiceNotFoundError(serviceId);
    }

    // Ensure service is linked to Stripe
    if (!service.stripeProductId || !service.stripePriceId) {
      throw new StripeIntegrationError(
        'Service is not linked to Stripe. Cannot update to maintain price sync.'
      );
    }

    // Track what needs to be synced to Stripe
    let needsStripeProductUpdate = false;
    const stripeProductUpdates: any = {};

    // Update service fields in domain
    if (dto.name !== undefined && dto.name !== service.name) {
      service.updateName(dto.name);
      stripeProductUpdates.name = dto.name;
      needsStripeProductUpdate = true;
    }

    if (dto.description !== undefined && dto.description !== service.description) {
      service.updateDescription(dto.description);
      stripeProductUpdates.description = dto.description;
      needsStripeProductUpdate = true;
    }

    if (dto.isActive !== undefined && dto.isActive !== service.isActive) {
      if (dto.isActive) {
        service.activate();
      } else {
        service.deactivate();
      }
      stripeProductUpdates.active = dto.isActive;
      needsStripeProductUpdate = true;
    }

    // NEW: Update requiresApplicantDetails if provided
    if (dto.requiresApplicantDetails !== undefined && dto.requiresApplicantDetails !== service.requiresApplicantDetails) {
      service.setRequiresApplicantDetails(dto.requiresApplicantDetails);
    }

    // CRITICAL: Update price in Stripe ONLY if price actually changed
    if (dto.priceMxn !== undefined && dto.priceMxn !== service.priceMxn) {
      try {
        const newPrice = await this.stripeService.updatePrice(
          service.stripePriceId,
          Math.round(dto.priceMxn * 100) // Convert to cents
        );

        service.updateStripePriceId(newPrice.id);
        service.updatePrice(dto.priceMxn);
      } catch (error) {
        throw new StripeIntegrationError(
          'Failed to update price in Stripe. Price NOT updated in database to prevent mismatch.',
          error
        );
      }
    }

    // CRITICAL: Sync product details to Stripe ONLY if something changed
    if (needsStripeProductUpdate) {
      try {
        await this.stripeService.updateProduct(service.stripeProductId, stripeProductUpdates);
      } catch (error) {
        throw new StripeIntegrationError(
          'Failed to update product in Stripe. Changes NOT saved to maintain sync.',
          error
        );
      }
    }

    // Save updated service
    await this.serviceRepository.save(service);

    return service;
  }
}
