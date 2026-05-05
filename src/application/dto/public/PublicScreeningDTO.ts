/**
 * Public Screening DTOs
 *
 * DTOs for public-facing screening creation endpoint
 * Only returns payment link for anonymous users
 */

import { Screening } from '../../../domain/entities/Screening';
import { PersonType } from '../../../domain/entities/ServiceCatalog';
import { RFC } from '../../../domain/value-objects/RFC';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizePhone,
  sanitizeObject,
  isValidPositiveInteger,
} from '../../../lib/security/sanitize';

/**
 * DTO for creating a screening from public form
 */
export class CreatePublicScreeningDTO {
  serviceId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  formData: Record<string, any>;
  advisorId?: string;        // Optional advisor ID
  advisorName?: string;      // Fallback if no advisor ID
  advisorPhone?: string;     // Fallback if no advisor ID

  // NEW: Applicant detail fields (optional)
  applicantPersonType?: PersonType;
  applicantLegalRepresentative?: string;
  applicantRFC?: string;  // String input, will be validated and converted to RFC value object
  applicantStreet?: string;
  applicantColony?: string;
  applicantMunicipality?: string;
  applicantState?: string;
  applicantZipCode?: string;

  constructor(data: any) {
    // Sanitize inputs before assignment
    this.serviceId = data.serviceId ? String(data.serviceId).trim() : '';
    this.applicantName = data.applicantName ? sanitizeString(data.applicantName) : '';
    this.applicantEmail = data.applicantEmail ? sanitizeEmail(data.applicantEmail) : '';
    this.applicantPhone = data.applicantPhone ? sanitizePhone(data.applicantPhone) : undefined;

    // Advisor fields (all optional)
    this.advisorId = data.advisorId ? String(data.advisorId).trim() : undefined;
    this.advisorName = data.advisorName ? sanitizeString(data.advisorName) : undefined;
    this.advisorPhone = data.advisorPhone ? sanitizePhone(data.advisorPhone) : undefined;

    // NEW: Applicant detail fields (all optional)
    // Convert string input to PersonType enum
    if (data.applicantPersonType) {
      if (data.applicantPersonType === 'physical' || data.applicantPersonType === 'moral') {
        this.applicantPersonType = data.applicantPersonType as PersonType;
      } else if (data.applicantPersonType === 'PM') {
        // Support legacy 'PM' input by converting to enum
        this.applicantPersonType = PersonType.MORAL;
      } else if (data.applicantPersonType === 'PFAE') {
        // Support legacy 'PFAE' input by converting to enum
        this.applicantPersonType = PersonType.PHYSICAL;
      } else {
        this.applicantPersonType = undefined;
      }
    }

    this.applicantLegalRepresentative = data.applicantLegalRepresentative
      ? sanitizeString(data.applicantLegalRepresentative)
      : undefined;
    this.applicantRFC = data.applicantRFC
      ? sanitizeString(data.applicantRFC).toUpperCase()
      : undefined;
    this.applicantStreet = data.applicantStreet
      ? sanitizeString(data.applicantStreet)
      : undefined;
    this.applicantColony = data.applicantColony
      ? sanitizeString(data.applicantColony)
      : undefined;
    this.applicantMunicipality = data.applicantMunicipality
      ? sanitizeString(data.applicantMunicipality)
      : undefined;
    this.applicantState = data.applicantState
      ? sanitizeString(data.applicantState)
      : undefined;
    this.applicantZipCode = data.applicantZipCode
      ? sanitizeString(data.applicantZipCode)
      : undefined;

    // Sanitize formData object
    try {
      this.formData = data.formData ? sanitizeObject(data.formData) : {};
    } catch (error) {
      throw new PublicValidationError(
        error instanceof Error ? error.message : 'Invalid form data structure'
      );
    }

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Service ID validation - must be a valid positive integer
    if (!this.serviceId || this.serviceId.length === 0) {
      errors.push('Service ID is required');
    } else if (!isValidPositiveInteger(this.serviceId)) {
      errors.push('Service ID must be a valid positive number');
    }

    // Applicant name validation
    if (!this.applicantName || this.applicantName.length === 0) {
      errors.push('Applicant name is required');
    } else if (this.applicantName.length < 2) {
      errors.push('Applicant name must be at least 2 characters');
    } else if (this.applicantName.length > 200) {
      errors.push('Applicant name must not exceed 200 characters');
    }

    // Applicant email validation
    if (!this.applicantEmail || this.applicantEmail.length === 0) {
      errors.push('Applicant email is required');
    } else if (!this.isValidEmail(this.applicantEmail)) {
      errors.push('Invalid email format');
    } else if (this.applicantEmail.length > 255) {
      errors.push('Email must not exceed 255 characters');
    }

    // Applicant phone validation (optional but must be valid if provided)
    if (this.applicantPhone) {
      if (this.applicantPhone.length > 0 && this.applicantPhone.length < 10) {
        errors.push('Applicant phone must be at least 10 characters');
      } else if (this.applicantPhone.length > 20) {
        errors.push('Applicant phone must not exceed 20 characters');
      }
    }

    // Advisor validation (all fields are optional)
    if (this.advisorId) {
      // If advisor ID is provided, validate it's a positive integer
      if (!isValidPositiveInteger(this.advisorId)) {
        errors.push('Advisor ID must be a valid positive number');
      }
    }

    // Validate advisor name if provided
    if (this.advisorName) {
      if (this.advisorName.length < 2) {
        errors.push('Advisor name must be at least 2 characters');
      }
      if (this.advisorName.length > 200) {
        errors.push('Advisor name must not exceed 200 characters');
      }
    }

    // Validate advisor phone if provided
    if (this.advisorPhone) {
      if (this.advisorPhone.length < 10) {
        errors.push('Advisor phone must be at least 10 characters');
      }
      if (this.advisorPhone.length > 20) {
        errors.push('Advisor phone must not exceed 20 characters');
      }
    }

    // Form data validation - already sanitized in constructor
    if (this.formData && typeof this.formData !== 'object') {
      errors.push('Form data must be an object');
    }

    // NEW: Validate applicant details if provided
    if (this.applicantPersonType) {
      // Validate person type enum
      if (this.applicantPersonType !== PersonType.PHYSICAL &&
          this.applicantPersonType !== PersonType.MORAL) {
        errors.push('Person type must be either physical or moral');
      }

      // If person type is provided, validate RFC and address
      if (!this.applicantRFC) {
        errors.push('RFC is required when person type is specified');
      } else {
        // Validate RFC format
        if (!RFC.isValid(this.applicantRFC, this.applicantPersonType)) {
          const expectedLength = this.applicantPersonType === PersonType.MORAL ? 12 : 13;
          const displayType = this.applicantPersonType === PersonType.MORAL ? 'PM' : 'PFAE';
          errors.push(`RFC must be ${expectedLength} characters for ${displayType}`);
        }
      }

      // Validate address fields if person type is provided
      if (!this.applicantStreet) errors.push('Street is required when person type is specified');
      if (!this.applicantColony) errors.push('Colony is required when person type is specified');
      if (!this.applicantMunicipality) errors.push('Municipality is required when person type is specified');
      if (!this.applicantState) errors.push('State is required when person type is specified');
      if (!this.applicantZipCode) {
        errors.push('Zip code is required when person type is specified');
      } else if (!/^\d{5}$/.test(this.applicantZipCode)) {
        errors.push('Zip code must be 5 digits');
      }

      // Validate legal representative for PM
      if (this.applicantPersonType === PersonType.MORAL) {
        if (!this.applicantLegalRepresentative) {
          errors.push('Legal representative is required for Persona Moral');
        } else if (this.applicantLegalRepresentative.length < 2) {
          errors.push('Legal representative name must be at least 2 characters');
        } else if (this.applicantLegalRepresentative.length > 200) {
          errors.push('Legal representative name must not exceed 200 characters');
        }
      } else {
        // PFAE should not have legal representative
        if (this.applicantLegalRepresentative) {
          errors.push('Legal representative is only valid for Persona Moral');
        }
      }

      // Validate field lengths
      if (this.applicantStreet && this.applicantStreet.length > 500) {
        errors.push('Street must not exceed 500 characters');
      }
      if (this.applicantColony && this.applicantColony.length > 200) {
        errors.push('Colony must not exceed 200 characters');
      }
      if (this.applicantMunicipality && this.applicantMunicipality.length > 200) {
        errors.push('Municipality must not exceed 200 characters');
      }
      if (this.applicantState && this.applicantState.length > 100) {
        errors.push('State must not exceed 100 characters');
      }
    }

    if (errors.length > 0) {
      throw new PublicValidationError(errors.join(', '));
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Minimal response DTO for public screening creation
 * Only returns the payment link
 */
export class PublicScreeningResponseDTO {
  paymentLinkUrl!: string;

  static fromDomain(screening: Screening): PublicScreeningResponseDTO {
    if (!screening.paymentLinkUrl) {
      throw new Error('Payment link URL is required');
    }

    return {
      paymentLinkUrl: screening.paymentLinkUrl,
    };
  }
}

/**
 * Custom validation error for public endpoints
 */
export class PublicValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicValidationError';
  }
}
