/**
 * Coupon Entity
 *
 * Represents a discount coupon that can be applied to specific services.
 * Following Clean Architecture: NO dependencies on external frameworks.
 */

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount'
}

export interface CouponProps {
  id: string;
  code: string;
  stripeCouponId: string;
  discountType: DiscountType;
  discountValue: number;
  appliesToServices: number[];
  description: string | null;
  organizationName: string | null;
  notes: string | null;
  usageCount: number;
  maxRedemptions: number | null;
  isActive: boolean;
  expiresAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Coupon {
  private constructor(private props: CouponProps) {}

  // Factory method for creating a new coupon
  static create(
    code: string,
    stripeCouponId: string,
    discountType: DiscountType,
    discountValue: number,
    appliesToServices: number[],
    createdByUserId: string,
    description: string | null = null,
    organizationName: string | null = null,
    notes: string | null = null,
    maxRedemptions: number | null = null,
    expiresAt: Date | null = null
  ): Coupon {
    // Business rule: Code must be uppercase and valid format
    if (!code || code.trim().length === 0) {
      throw new Error('Coupon code is required');
    }

    const normalizedCode = code.toUpperCase().trim();

    // Business rule: Code must be between 3 and 50 characters
    if (normalizedCode.length < 3 || normalizedCode.length > 50) {
      throw new Error('Coupon code must be between 3 and 50 characters');
    }

    // Business rule: Discount value must be positive
    if (discountValue <= 0) {
      throw new Error('Discount value must be greater than zero');
    }

    // Business rule: Percentage discount cannot exceed 100%
    if (discountType === DiscountType.PERCENTAGE && discountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%');
    }

    // Business rule: Must apply to at least one service
    if (!appliesToServices || appliesToServices.length === 0) {
      throw new Error('Coupon must apply to at least one service');
    }

    // Business rule: Max redemptions must be positive if set
    if (maxRedemptions !== null && maxRedemptions <= 0) {
      throw new Error('Max redemptions must be greater than zero');
    }

    // Business rule: Expiration date must be in the future
    if (expiresAt && expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    return new Coupon({
      id: crypto.randomUUID(),
      code: normalizedCode,
      stripeCouponId,
      discountType,
      discountValue,
      appliesToServices,
      description,
      organizationName,
      notes,
      usageCount: 0,
      maxRedemptions,
      isActive: true,
      expiresAt,
      createdByUserId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Factory method for reconstituting from database
  static reconstitute(props: CouponProps): Coupon {
    return new Coupon(props);
  }

  // Getters
  get id(): string { return this.props.id; }
  get code(): string { return this.props.code; }
  get stripeCouponId(): string { return this.props.stripeCouponId; }
  get discountType(): DiscountType { return this.props.discountType; }
  get discountValue(): number { return this.props.discountValue; }
  get appliesToServices(): number[] { return [...this.props.appliesToServices]; }
  get description(): string | null { return this.props.description; }
  get organizationName(): string | null { return this.props.organizationName; }
  get notes(): string | null { return this.props.notes; }
  get usageCount(): number { return this.props.usageCount; }
  get maxRedemptions(): number | null { return this.props.maxRedemptions; }
  get isActive(): boolean { return this.props.isActive; }
  get expiresAt(): Date | null { return this.props.expiresAt; }
  get createdByUserId(): string { return this.props.createdByUserId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business methods

  /**
   * Check if coupon can be applied to a specific service
   */
  appliesToService(serviceId: number): boolean {
    return this.props.appliesToServices.includes(serviceId);
  }

  /**
   * Check if coupon is currently valid
   */
  isValid(): boolean {
    // Must be active
    if (!this.props.isActive) {
      return false;
    }

    // Must not be expired
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      return false;
    }

    // Must not exceed max redemptions
    if (this.props.maxRedemptions !== null && this.props.usageCount >= this.props.maxRedemptions) {
      return false;
    }

    return true;
  }

  /**
   * Validate and apply coupon to a service
   */
  validateForService(serviceId: number): { valid: boolean; error?: string } {
    if (!this.isValid()) {
      if (!this.props.isActive) {
        return { valid: false, error: 'This coupon is no longer active' };
      }
      if (this.props.expiresAt && this.props.expiresAt < new Date()) {
        return { valid: false, error: 'This coupon has expired' };
      }
      if (this.props.maxRedemptions !== null && this.props.usageCount >= this.props.maxRedemptions) {
        return { valid: false, error: 'This coupon has reached its maximum number of redemptions' };
      }
      return { valid: false, error: 'This coupon is not valid' };
    }

    if (!this.appliesToService(serviceId)) {
      return { valid: false, error: 'This coupon does not apply to the selected service' };
    }

    return { valid: true };
  }

  /**
   * Increment usage count
   */
  incrementUsage(): void {
    this.props.usageCount += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Deactivate coupon
   */
  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  /**
   * Reactivate coupon
   */
  reactivate(): void {
    // Business rule: Cannot reactivate expired coupons
    if (this.props.expiresAt && this.props.expiresAt < new Date()) {
      throw new Error('Cannot reactivate an expired coupon');
    }

    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  /**
   * Update coupon details
   */
  update(updates: {
    description?: string | null;
    organizationName?: string | null;
    notes?: string | null;
    maxRedemptions?: number | null;
    expiresAt?: Date | null;
  }): void {
    if (updates.description !== undefined) {
      this.props.description = updates.description;
    }

    if (updates.organizationName !== undefined) {
      this.props.organizationName = updates.organizationName;
    }

    if (updates.notes !== undefined) {
      this.props.notes = updates.notes;
    }

    if (updates.maxRedemptions !== undefined) {
      if (updates.maxRedemptions !== null && updates.maxRedemptions <= 0) {
        throw new Error('Max redemptions must be greater than zero');
      }
      this.props.maxRedemptions = updates.maxRedemptions;
    }

    if (updates.expiresAt !== undefined) {
      if (updates.expiresAt && updates.expiresAt <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      this.props.expiresAt = updates.expiresAt;
    }

    this.props.updatedAt = new Date();
  }

  /**
   * Get formatted discount display string
   */
  getDiscountDisplay(): string {
    if (this.props.discountType === DiscountType.PERCENTAGE) {
      return `${this.props.discountValue}%`;
    } else {
      return `$${this.props.discountValue.toFixed(2)} MXN`;
    }
  }

  // Convert to plain object (for serialization)
  toObject(): CouponProps {
    return {
      ...this.props,
      appliesToServices: [...this.props.appliesToServices]
    };
  }
}
