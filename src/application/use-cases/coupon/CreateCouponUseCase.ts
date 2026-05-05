/**
 * CreateCouponUseCase
 *
 * Creates a coupon in both Stripe and the database
 */

import { ICouponRepository } from '../../../domain/interfaces/repositories/ICouponRepository';
import { Coupon, DiscountType } from '../../../domain/entities/Coupon';
import { CreateCouponDTO } from '../../dto/coupon/CouponDTO';
import { StripeService } from '../../../infrastructure/services/StripeService';

export class CreateCouponUseCase {
  constructor(
    private couponRepository: ICouponRepository,
    private stripeService: StripeService
  ) {}

  async execute(dto: CreateCouponDTO, createdByUserId: string): Promise<Coupon> {
    // Check if coupon code already exists
    const existingCoupon = await this.couponRepository.findByCode(dto.code);
    if (existingCoupon) {
      throw new Error(`Coupon with code ${dto.code} already exists`);
    }

    // Create coupon in Stripe
    const stripeCouponParams: any = {
      id: dto.code,
      name: dto.description || dto.code,
      metadata: {
        organization: dto.organizationName || '',
        services: dto.appliesToServices.join(',')
      }
    };

    // Set discount type and duration
    if (dto.discountType === DiscountType.PERCENTAGE) {
      stripeCouponParams.percentOff = dto.discountValue;
      stripeCouponParams.duration = 'forever'; // Percentage coupons can use forever
    } else {
      stripeCouponParams.amountOff = Math.round(dto.discountValue * 100); // Convert to cents
      stripeCouponParams.currency = 'mxn';
      stripeCouponParams.duration = 'once'; // Fixed amount coupons must use once or repeating
    }

    // Set max redemptions if provided
    if (dto.maxRedemptions) {
      stripeCouponParams.maxRedemptions = dto.maxRedemptions;
    }

    // Set expiration if provided
    if (dto.expiresAt) {
      stripeCouponParams.redeemBy = Math.floor(dto.expiresAt.getTime() / 1000);
    }

    let stripeCoupon;
    try {
      stripeCoupon = await this.stripeService.createCoupon(stripeCouponParams);
    } catch (error: any) {
      if (error.code === 'resource_already_exists') {
        throw new Error(`Coupon with code ${dto.code} already exists in Stripe`);
      }
      throw new Error(`Failed to create coupon in Stripe: ${error.message}`);
    }

    // Create promotion code so customers can use this code at checkout
    try {
      await this.stripeService.createPromotionCode({
        couponId: stripeCoupon.id,
        code: dto.code,
        maxRedemptions: dto.maxRedemptions ?? undefined,
        expiresAt: dto.expiresAt ? Math.floor(dto.expiresAt.getTime() / 1000) : undefined
      });
    } catch (error: any) {
      // Rollback: Delete coupon if promotion code creation fails
      try {
        await this.stripeService.deleteCoupon(stripeCoupon.id);
      } catch (rollbackError) {
        console.error('Failed to rollback Stripe coupon:', rollbackError);
      }
      throw new Error(`Failed to create promotion code in Stripe: ${error.message}`);
    }

    // Create coupon entity
    const coupon = Coupon.create(
      dto.code,
      stripeCoupon.id,
      dto.discountType,
      dto.discountValue,
      dto.appliesToServices,
      createdByUserId,
      dto.description,
      dto.organizationName,
      dto.notes,
      dto.maxRedemptions,
      dto.expiresAt
    );

    // Save to database
    try {
      await this.couponRepository.save(coupon);
    } catch (error) {
      // Rollback: Delete from Stripe if database save fails
      try {
        await this.stripeService.deleteCoupon(stripeCoupon.id);
      } catch (rollbackError) {
        console.error('Failed to rollback Stripe coupon:', rollbackError);
      }
      throw error;
    }

    return coupon;
  }
}
