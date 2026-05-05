/**
 * DeleteCouponUseCase
 *
 * Deletes a coupon from both database and Stripe
 */

import { ICouponRepository } from '../../../domain/interfaces/repositories/ICouponRepository';
import { StripeService } from '../../../infrastructure/services/StripeService';

export class DeleteCouponUseCase {
  constructor(
    private couponRepository: ICouponRepository,
    private stripeService: StripeService
  ) {}

  async execute(couponId: string): Promise<void> {
    // Find coupon
    const coupon = await this.couponRepository.findById(couponId);

    if (!coupon) {
      throw new Error('Coupon not found');
    }

    // Delete from Stripe first
    try {
      await this.stripeService.deleteCoupon(coupon.stripeCouponId);
    } catch (error: any) {
      // If coupon doesn't exist in Stripe, that's okay - continue with DB deletion
      if (error.code !== 'resource_missing') {
        throw new Error(`Failed to delete coupon from Stripe: ${error.message}`);
      }
    }

    // Delete from database
    await this.couponRepository.delete(couponId);
  }
}
