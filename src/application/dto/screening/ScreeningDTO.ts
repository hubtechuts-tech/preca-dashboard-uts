/**
 * Screening DTOs
 *
 * Data Transfer Objects for screening operations with validation.
 */

import { ScreeningStatus } from '../../../domain/entities/Screening';
import { PersonType } from '../../../domain/entities/ServiceCatalog';
import { RFC } from '../../../domain/value-objects/RFC';

/**
 * DTO for creating a new screening
 */
export class CreateScreeningDTO {
  serviceId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  formData: Record<string, any>;
  userId?: string; // Optional - for authenticated users
  advisorId?: string;        // Optional advisor ID
  advisorName?: string;      // Fallback if no advisor ID
  advisorPhone?: string;     // Fallback if no advisor ID

  // NEW: Applicant detail fields (optional)
  applicantPersonType?: PersonType;
  applicantLegalRepresentative?: string;
  applicantRFC?: string;
  applicantStreet?: string;
  applicantColony?: string;
  applicantMunicipality?: string;
  applicantState?: string;
  applicantZipCode?: string;

  constructor(data: any) {
    this.serviceId = data.serviceId;
    this.applicantName = data.applicantName;
    this.applicantEmail = data.applicantEmail;
    this.applicantPhone = data.applicantPhone;
    this.formData = data.formData || {};
    this.userId = data.userId;

    // Advisor fields (all optional)
    this.advisorId = data.advisorId;
    this.advisorName = data.advisorName;
    this.advisorPhone = data.advisorPhone;

    // NEW: Applicant detail fields (all optional)
    // Convert string input to PersonType enum
    if (data.applicantPersonType) {
      if (data.applicantPersonType === 'physical' || data.applicantPersonType === 'moral') {
        this.applicantPersonType = data.applicantPersonType as PersonType;
      } else if (data.applicantPersonType === 'PM') {
        this.applicantPersonType = PersonType.MORAL;
      } else if (data.applicantPersonType === 'PFAE') {
        this.applicantPersonType = PersonType.PHYSICAL;
      }
    }

    this.applicantLegalRepresentative = data.applicantLegalRepresentative;
    this.applicantRFC = data.applicantRFC;
    this.applicantStreet = data.applicantStreet;
    this.applicantColony = data.applicantColony;
    this.applicantMunicipality = data.applicantMunicipality;
    this.applicantState = data.applicantState;
    this.applicantZipCode = data.applicantZipCode;

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Service ID validation
    if (!this.serviceId || typeof this.serviceId !== 'string' || this.serviceId.trim().length === 0) {
      errors.push('Service ID is required');
    }

    // Applicant name validation
    if (!this.applicantName || typeof this.applicantName !== 'string' || this.applicantName.trim().length === 0) {
      errors.push('Applicant name is required');
    } else if (this.applicantName.trim().length < 2) {
      errors.push('Applicant name must be at least 2 characters');
    } else if (this.applicantName.trim().length > 200) {
      errors.push('Applicant name must not exceed 200 characters');
    }

    // Applicant email validation
    if (!this.applicantEmail || typeof this.applicantEmail !== 'string' || this.applicantEmail.trim().length === 0) {
      errors.push('Applicant email is required');
    } else if (!this.isValidEmail(this.applicantEmail)) {
      errors.push('Invalid email format');
    }

    // Applicant phone validation (optional but must be valid if provided)
    if (this.applicantPhone) {
      if (typeof this.applicantPhone !== 'string') {
        errors.push('Applicant phone must be a string');
      } else if (this.applicantPhone.trim().length > 0 && this.applicantPhone.trim().length < 10) {
        errors.push('Applicant phone must be at least 10 digits');
      }
    }

    // Form data validation
    if (this.formData && typeof this.formData !== 'object') {
      errors.push('Form data must be an object');
    }

    // Advisor validation (all fields are optional)
    if (this.advisorId) {
      if (typeof this.advisorId !== 'string') {
        errors.push('Advisor ID must be a string');
      }
    }

    if (this.advisorName) {
      if (typeof this.advisorName !== 'string') {
        errors.push('Advisor name must be a string');
      } else if (this.advisorName.trim().length < 2) {
        errors.push('Advisor name must be at least 2 characters');
      } else if (this.advisorName.trim().length > 200) {
        errors.push('Advisor name must not exceed 200 characters');
      }
    }

    if (this.advisorPhone) {
      if (typeof this.advisorPhone !== 'string') {
        errors.push('Advisor phone must be a string');
      } else if (this.advisorPhone.trim().length < 10) {
        errors.push('Advisor phone must be at least 10 digits');
      } else if (this.advisorPhone.trim().length > 20) {
        errors.push('Advisor phone must not exceed 20 characters');
      }
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
        } else if (typeof this.applicantLegalRepresentative !== 'string') {
          errors.push('Legal representative must be a string');
        } else if (this.applicantLegalRepresentative.trim().length < 2) {
          errors.push('Legal representative name must be at least 2 characters');
        } else if (this.applicantLegalRepresentative.trim().length > 200) {
          errors.push('Legal representative name must not exceed 200 characters');
        }
      } else {
        // PFAE should not have legal representative
        if (this.applicantLegalRepresentative) {
          errors.push('Legal representative is only valid for Persona Moral');
        }
      }

      // Validate field lengths
      if (this.applicantStreet && typeof this.applicantStreet === 'string' && this.applicantStreet.length > 500) {
        errors.push('Street must not exceed 500 characters');
      }
      if (this.applicantColony && typeof this.applicantColony === 'string' && this.applicantColony.length > 200) {
        errors.push('Colony must not exceed 200 characters');
      }
      if (this.applicantMunicipality && typeof this.applicantMunicipality === 'string' && this.applicantMunicipality.length > 200) {
        errors.push('Municipality must not exceed 200 characters');
      }
      if (this.applicantState && typeof this.applicantState === 'string' && this.applicantState.length > 100) {
        errors.push('State must not exceed 100 characters');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * DTO for updating screening status
 */
export class UpdateScreeningStatusDTO {
  status: ScreeningStatus;
  adminUserId?: string;
  adminNotes?: string;
  reportUrl?: string;

  constructor(data: any) {
    this.status = data.status;
    this.adminUserId = data.adminUserId;
    this.adminNotes = data.adminNotes;
    this.reportUrl = data.reportUrl;

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Status validation
    if (!this.status) {
      errors.push('Status is required');
    } else {
      const validStatuses = Object.values(ScreeningStatus);
      if (!validStatuses.includes(this.status)) {
        errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Report URL validation (required if status is completed)
    if (this.status === ScreeningStatus.COMPLETED && !this.reportUrl) {
      errors.push('Report URL is required when completing a screening');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

/**
 * DTO for marking payment as completed
 */
export class MarkPaymentCompletedDTO {
  stripeSessionId: string;
  paymentAmount: number;

  constructor(data: any) {
    this.stripeSessionId = data.stripeSessionId;
    this.paymentAmount = data.paymentAmount;

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.stripeSessionId || typeof this.stripeSessionId !== 'string') {
      errors.push('Stripe session ID is required');
    }

    if (!this.paymentAmount || typeof this.paymentAmount !== 'number' || this.paymentAmount <= 0) {
      errors.push('Payment amount must be a positive number');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

/**
 * DTO for adding admin notes
 */
export class AddAdminNotesDTO {
  notes: string;
  adminUserId: string;

  constructor(data: any) {
    this.notes = data.notes;
    this.adminUserId = data.adminUserId;

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.notes || typeof this.notes !== 'string' || this.notes.trim().length === 0) {
      errors.push('Notes are required');
    }

    if (!this.adminUserId || typeof this.adminUserId !== 'string') {
      errors.push('Admin user ID is required');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

/**
 * DTO for filtering screenings
 */
export class FilterScreeningsDTO {
  status?: ScreeningStatus;
  userId?: string;
  adminUserId?: string;
  limit?: number;
  offset?: number;

  constructor(data: any) {
    this.status = data.status;
    this.userId = data.userId;
    this.adminUserId = data.adminUserId;
    this.limit = data.limit;
    this.offset = data.offset;

    this.validate();
  }

  private validate(): void {
    const errors: string[] = [];

    // Validate status if provided
    if (this.status) {
      const validStatuses = Object.values(ScreeningStatus);
      if (!validStatuses.includes(this.status)) {
        errors.push(`Invalid status filter. Must be one of: ${validStatuses.join(', ')}`);
      }
    }

    // Validate limit if provided
    if (this.limit !== undefined) {
      if (typeof this.limit !== 'number' || this.limit < 1 || this.limit > 100) {
        errors.push('Limit must be a number between 1 and 100');
      }
    }

    // Validate offset if provided
    if (this.offset !== undefined) {
      if (typeof this.offset !== 'number' || this.offset < 0) {
        errors.push('Offset must be a non-negative number');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}

/**
 * Custom validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
