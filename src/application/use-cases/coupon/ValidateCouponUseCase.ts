/**
 * ValidateCouponUseCase
 *
 * Validates a coupon for a specific service
 */

import { ICouponRepository } from '../../../domain/interfaces/repositories/ICouponRepository';
import { ValidateCouponDTO } from '../../dto/coupon/CouponDTO';

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  discountType?: string;
  discountValue?: number;
  error?: string;
}

export class ValidateCouponUseCase {
  constructor(private couponRepository: ICouponRepository) {}

  async execute(dto: ValidateCouponDTO): Promise<CouponValidationResult> {
    // Find coupon by code
    const coupon = await this.couponRepository.findByCode(dto.code);

    if (!coupon) {
      return {
        valid: false,
        error: 'Coupon not found'
      };
    }

    // Validate coupon for the service
    const validation = coupon.validateForService(dto.serviceId);

    if (!validation.valid) {
      return {
        valid: false,
        error: validation.error
      };
    }

    return {
      valid: true,
      couponId: coupon.id,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue
    };
  }
}
