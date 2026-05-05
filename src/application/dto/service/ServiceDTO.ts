/**
 * Service DTOs
 *
 * Data Transfer Objects for Service Catalog operations
 * Handles validation at the application layer
 */

import { PersonType } from '../../../domain/entities/ServiceCatalog';
import { FormSchemaJSON } from '../../../domain/value-objects/FormSchema';

export class CreateServiceDTO {
  code: string;
  name: string;
  description: string | null;
  priceMxn: number;
  targetPersonType: PersonType;
  requiresApplicantDetails: boolean;  // NEW

  constructor(data: any) {
    this.code = data.code;
    this.name = data.name;
    this.description = data.description || null;
    this.priceMxn = parseFloat(data.priceMxn);
    this.targetPersonType = data.targetPersonType;
    this.requiresApplicantDetails = data.requiresApplicantDetails || false;  // NEW

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Service code is required');
    }

    if (!/^[A-Z0-9_]+$/.test(this.code)) {
      errors.push('Code must be uppercase alphanumeric with underscores (e.g., PRECA_BASIC)');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Service name is required');
    }

    if (!this.priceMxn || isNaN(this.priceMxn)) {
      errors.push('Price is required and must be a valid number');
    }

    if (this.priceMxn <= 0) {
      errors.push('Price must be greater than zero');
    }

    if (!Object.values(PersonType).includes(this.targetPersonType)) {
      errors.push('Target person type must be either "physical" or "moral"');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

export class UpdateServiceDTO {
  name?: string;
  description?: string | null;
  priceMxn?: number;
  targetPersonType?: PersonType;
  isActive?: boolean;
  requiresApplicantDetails?: boolean;  // NEW

  constructor(data: any) {
    this.name = data.name;
    this.description = data.description;
    this.priceMxn = data.priceMxn ? parseFloat(data.priceMxn) : undefined;
    this.targetPersonType = data.targetPersonType;
    this.isActive = data.isActive;
    this.requiresApplicantDetails = data.requiresApplicantDetails;  // NEW

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (this.name !== undefined && this.name.trim().length === 0) {
      errors.push('Service name cannot be empty');
    }

    if (this.priceMxn !== undefined) {
      if (isNaN(this.priceMxn)) {
        errors.push('Price must be a valid number');
      }
      if (this.priceMxn <= 0) {
        errors.push('Price must be greater than zero');
      }
    }

    if (this.targetPersonType !== undefined && !Object.values(PersonType).includes(this.targetPersonType)) {
      errors.push('Target person type must be either "physical" or "moral"');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  hasChanges(): boolean {
    return this.name !== undefined ||
           this.description !== undefined ||
           this.priceMxn !== undefined ||
           this.targetPersonType !== undefined ||
           this.isActive !== undefined ||
           this.requiresApplicantDetails !== undefined;  // NEW
  }
}

export class ServiceResponseDTO {
  id!: number;
  code!: string;
  name!: string;
  description!: string | null;
  priceMxn!: number;
  formattedPrice!: string;
  targetPersonType!: PersonType;
  stripeProductId!: string | null;
  stripePriceId!: string | null;
  isLinkedToStripe!: boolean;
  isActive!: boolean;
  formSchema!: FormSchemaJSON | null;  // Dynamic form schema
  hasFormSchema!: boolean;              // Quick check if schema exists
  requiresApplicantDetails!: boolean;   // NEW: Flag for applicant details requirement
  createdAt!: Date;
  updatedAt!: Date;

  static fromDomain(service: any): ServiceResponseDTO {
    return {
      id: service.id,
      code: service.code,
      name: service.name,
      description: service.description,
      priceMxn: service.priceMxn,
      formattedPrice: service.getFormattedPrice(),
      targetPersonType: service.targetPersonType,
      stripeProductId: service.stripeProductId,
      stripePriceId: service.stripePriceId,
      isLinkedToStripe: service.isLinkedToStripe(),
      isActive: service.isActive,
      formSchema: service.formSchema ? service.formSchema.toJSON() : null,
      hasFormSchema: service.hasFormSchema(),
      requiresApplicantDetails: service.requiresApplicantDetails,  // NEW
      createdAt: service.createdAt,
      updatedAt: service.updatedAt
    };
  }
}

/**
 * Minimal Service Response DTO
 * Used for API endpoints that only need basic service information
 */
export class ServiceMinimalDTO {
  id!: number;
  name!: string;
  description!: string | null;
  price!: number;

  static fromDomain(service: any): ServiceMinimalDTO {
    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: service.priceMxn
    };
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
