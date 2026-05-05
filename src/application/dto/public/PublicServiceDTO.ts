/**
 * Public Service DTOs
 *
 * Minimal DTOs for public-facing service endpoints
 * Only exposes data needed for the landing page form
 */

import { ServiceCatalog, PersonType } from '../../../domain/entities/ServiceCatalog';

/**
 * Public response DTO for service listing
 * Only includes: id, name, description, price, formSchema
 */
export class PublicServiceResponseDTO {
  id!: number;
  name!: string;
  description!: string | null;
  priceMxn!: number;
  formattedPrice!: string;
  formSchema!: any;
  requiresApplicantDetails!: boolean;
  targetPersonType!: PersonType;

  static fromDomain(service: ServiceCatalog): PublicServiceResponseDTO {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      priceMxn: service.priceMxn,
      formattedPrice: service.getFormattedPrice(),
      formSchema: service.formSchema || null,
      requiresApplicantDetails: service.requiresApplicantDetails,
      targetPersonType: service.targetPersonType,
    };
  }
}
