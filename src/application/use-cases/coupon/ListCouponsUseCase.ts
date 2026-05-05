/**
 * ListCouponsUseCase
 *
 * Lists all coupons with optional filters
 */

import { ICouponRepository } from '../../../domain/interfaces/repositories/ICouponRepository';
import { Coupon } from '../../../domain/entities/Coupon';

export class ListCouponsUseCase {
  constructor(private couponRepository: ICouponRepository) {}

  async execute(filters?: {
    isActive?: boolean;
    serviceId?: number;
    createdByUserId?: string;
  }): Promise<Coupon[]> {
    return await this.couponRepository.findAll(filters);
  }
}
