/**
 * Coupon DTOs
 *
 * Data Transfer Objects for coupon operations
 */

import { DiscountType } from '../../../domain/entities/Coupon';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * DTO for creating a coupon
 */
export class CreateCouponDTO {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  appliesToServices: number[];
  description: string | null;
  organizationName: string | null;
  notes: string | null;
  maxRedemptions: number | null;
  expiresAt: Date | null;

  constructor(data: any) {
    // Validate and assign code
    if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
      throw new ValidationError('Coupon code is required');
    }
    this.code = data.code.trim().toUpperCase();

    if (this.code.length < 3 || this.code.length > 50) {
      throw new ValidationError('Coupon code must be between 3 and 50 characters');
    }

    // Validate discount type
    if (!data.discountType || !Object.values(DiscountType).includes(data.discountType)) {
      throw new ValidationError('Valid discount type is required (percentage or fixed_amount)');
    }
    this.discountType = data.discountType;

    // Validate discount value
    if (!data.discountValue || typeof data.discountValue !== 'number' || data.discountValue <= 0) {
      throw new ValidationError('Discount value must be a positive number');
    }
    if (this.discountType === DiscountType.PERCENTAGE && data.discountValue > 100) {
      throw new ValidationError('Percentage discount cannot exceed 100%');
    }
    this.discountValue = data.discountValue;

    // Validate applies to services
    if (!data.appliesToServices || !Array.isArray(data.appliesToServices) || data.appliesToServices.length === 0) {
      throw new ValidationError('At least one service must be selected');
    }
    // Ensure all are numbers
    if (!data.appliesToServices.every((id: any) => typeof id === 'number')) {
      throw new ValidationError('All service IDs must be numbers');
    }
    this.appliesToServices = data.appliesToServices;

    // Optional fields
    this.description = data.description?.trim() || null;
    this.organizationName = data.organizationName?.trim() || null;
    this.notes = data.notes?.trim() || null;

    // Validate max redemptions
    if (data.maxRedemptions !== undefined && data.maxRedemptions !== null) {
      if (typeof data.maxRedemptions !== 'number' || data.maxRedemptions <= 0) {
        throw new ValidationError('Max redemptions must be a positive number');
      }
      this.maxRedemptions = data.maxRedemptions;
    } else {
      this.maxRedemptions = null;
    }

    // Validate expiration date
    if (data.expiresAt) {
      const expiresAt = new Date(data.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        throw new ValidationError('Invalid expiration date');
      }
      if (expiresAt <= new Date()) {
        throw new ValidationError('Expiration date must be in the future');
      }
      this.expiresAt = expiresAt;
    } else {
      this.expiresAt = null;
    }
  }
}

/**
 * DTO for updating a coupon
 */
export class UpdateCouponDTO {
  description?: string | null;
  organizationName?: string | null;
  notes?: string | null;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
  isActive?: boolean;

  constructor(data: any) {
    if (data.description !== undefined) {
      this.description = data.description?.trim() || null;
    }

    if (data.organizationName !== undefined) {
      this.organizationName = data.organizationName?.trim() || null;
    }

    if (data.notes !== undefined) {
      this.notes = data.notes?.trim() || null;
    }

    if (data.maxRedemptions !== undefined && data.maxRedemptions !== null) {
      if (typeof data.maxRedemptions !== 'number' || data.maxRedemptions <= 0) {
        throw new ValidationError('Max redemptions must be a positive number');
      }
      this.maxRedemptions = data.maxRedemptions;
    }

    if (data.expiresAt !== undefined) {
      if (data.expiresAt) {
        const expiresAt = new Date(data.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          throw new ValidationError('Invalid expiration date');
        }
        if (expiresAt <= new Date()) {
          throw new ValidationError('Expiration date must be in the future');
        }
        this.expiresAt = expiresAt;
      } else {
        this.expiresAt = null;
      }
    }

    if (data.isActive !== undefined) {
      if (typeof data.isActive !== 'boolean') {
        throw new ValidationError('isActive must be a boolean');
      }
      this.isActive = data.isActive;
    }
  }
}

/**
 * DTO for validating a coupon
 */
export class ValidateCouponDTO {
  code: string;
  serviceId: number;

  constructor(data: any) {
    if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
      throw new ValidationError('Coupon code is required');
    }
    this.code = data.code.trim().toUpperCase();

    if (!data.serviceId || typeof data.serviceId !== 'number') {
      throw new ValidationError('Service ID is required and must be a number');
    }
    this.serviceId = data.serviceId;
  }
}
