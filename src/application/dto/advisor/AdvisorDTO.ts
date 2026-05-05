/**
 * Advisor DTOs
 *
 * Data Transfer Objects for advisor operations
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * DTO for creating an advisor
 */
export class CreateAdvisorDTO {
  name: string;
  email: string;
  phoneNumber: string;

  constructor(data: any) {
    // Validate and assign name
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new ValidationError('Advisor name is required');
    }

    const trimmedName = data.name.trim();
    if (trimmedName.length < 2) {
      throw new ValidationError('Advisor name must be at least 2 characters');
    }
    if (trimmedName.length > 200) {
      throw new ValidationError('Advisor name must not exceed 200 characters');
    }
    this.name = trimmedName;

    // Validate and assign email
    if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
      throw new ValidationError('Advisor email is required');
    }
    const trimmedEmail = data.email.trim().toLowerCase();
    if (!this.isValidEmail(trimmedEmail)) {
      throw new ValidationError('Invalid email format');
    }
    this.email = trimmedEmail;

    // Validate and assign phone number
    if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || data.phoneNumber.trim().length === 0) {
      throw new ValidationError('Advisor phone number is required');
    }
    const trimmedPhone = data.phoneNumber.trim();
    if (trimmedPhone.length < 10) {
      throw new ValidationError('Advisor phone number must be at least 10 digits');
    }
    if (trimmedPhone.length > 20) {
      throw new ValidationError('Advisor phone number must not exceed 20 characters');
    }
    this.phoneNumber = trimmedPhone;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * DTO for updating an advisor
 */
export class UpdateAdvisorDTO {
  email?: string;
  phoneNumber?: string;

  constructor(data: any) {
    // Validate email if provided
    if (data.email !== undefined) {
      if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
        throw new ValidationError('Email cannot be empty if provided');
      }
      const trimmedEmail = data.email.trim().toLowerCase();
      if (!this.isValidEmail(trimmedEmail)) {
        throw new ValidationError('Invalid email format');
      }
      this.email = trimmedEmail;
    }

    // Validate phone number if provided
    if (data.phoneNumber !== undefined) {
      if (!data.phoneNumber || typeof data.phoneNumber !== 'string' || data.phoneNumber.trim().length === 0) {
        throw new ValidationError('Phone number cannot be empty if provided');
      }
      const trimmedPhone = data.phoneNumber.trim();
      if (trimmedPhone.length < 10) {
        throw new ValidationError('Phone number must be at least 10 digits');
      }
      if (trimmedPhone.length > 20) {
        throw new ValidationError('Phone number must not exceed 20 characters');
      }
      this.phoneNumber = trimmedPhone;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * DTO for advisor response
 */
export interface AdvisorResponseDTO {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
