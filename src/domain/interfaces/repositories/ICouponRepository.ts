/**
 * ICouponRepository Interface
 *
 * Contract for coupon data access.
 */

import { Coupon } from '../../entities/Coupon';

export interface ICouponRepository {
  /**
   * Find a coupon by its unique ID
   */
  findById(id: string): Promise<Coupon | null>;

  /**
   * Find a coupon by its code
   */
  findByCode(code: string): Promise<Coupon | null>;

  /**
   * Find a coupon by Stripe coupon ID
   */
  findByStripeCouponId(stripeCouponId: string): Promise<Coupon | null>;

  /**
   * Find all coupons with optional filters
   */
  findAll(filters?: {
    isActive?: boolean;
    serviceId?: number;
    createdByUserId?: string;
  }): Promise<Coupon[]>;

  /**
   * Save a coupon (create or update)
   */
  save(coupon: Coupon): Promise<void>;

  /**
   * Delete a coupon by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Increment usage count for a coupon
   */
  incrementUsageCount(id: string): Promise<void>;
}
