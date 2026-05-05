/**
 * CreateServiceUseCase
 *
 * Creates a new service in the catalog and optionally in Stripe
 */

import { ServiceCatalog } from '../../../domain/entities/ServiceCatalog';
import { IServiceCatalogRepository } from '../../../domain/interfaces/repositories/IServiceCatalogRepository';
import { IStripeService } from '../../../domain/interfaces/services/IStripeService';
import { ServiceCodeAlreadyExistsError, StripeIntegrationError } from '../../../domain/errors/ServiceErrors';
import { CreateServiceDTO } from '../../dto/service/ServiceDTO';

export class CreateServiceUseCase {
  constructor(
    private serviceRepository: IServiceCatalogRepository,
    private stripeService: IStripeService
  ) { }

  async execute(dto: CreateServiceDTO): Promise<ServiceCatalog> {
    // Check if service code already exists
    const existingService = await this.serviceRepository.findByCode(dto.code);
    if (existingService) {
      throw new ServiceCodeAlreadyExistsError(dto.code);
    }

    // CRITICAL: Always create in Stripe to ensure price sync
    // Payment links are generated from Stripe, so this must never be skipped
    let stripeProductId: string;
    let stripePriceId: string;

    try {
      const { product, price } = await this.stripeService.createProductWithPrice(
        {
          name: dto.name,
          description: dto.description,
          active: true,
          metadata: {
            service_code: dto.code,
            target_person_type: dto.targetPersonType
          }
        },
        Math.round(dto.priceMxn * 100), // Convert to cents
        'mxn'
      );

      stripeProductId = product.id;
      stripePriceId = price.id;
    } catch (error) {
      throw new StripeIntegrationError(
        'Failed to create product in Stripe. Service NOT created to prevent price mismatch.',
        error
      );
    }

    // Create domain entity
    const service = ServiceCatalog.create(
      dto.code,
      dto.name,
      dto.priceMxn,
      dto.targetPersonType,
      dto.description,
      stripeProductId,
      stripePriceId,
      null,  // formSchema
      null,  // reportSchema
      dto.requiresApplicantDetails
    );

    // Save to repository
    await this.serviceRepository.save(service);

    return service;
  }
}
