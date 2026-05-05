/**
 * CouponController
 *
 * Presentation layer controller for coupon operations
 */

import { CreateCouponUseCase } from '@/application/use-cases/coupon/CreateCouponUseCase';
import { ListCouponsUseCase } from '@/application/use-cases/coupon/ListCouponsUseCase';
import { ValidateCouponUseCase } from '@/application/use-cases/coupon/ValidateCouponUseCase';
import { DeleteCouponUseCase } from '@/application/use-cases/coupon/DeleteCouponUseCase';
import { CreateCouponDTO, ValidateCouponDTO, ValidationError } from '@/application/dto/coupon/CouponDTO';

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
}

export class CouponController {
  constructor(
    private createCouponUseCase: CreateCouponUseCase,
    private listCouponsUseCase: ListCouponsUseCase,
    private validateCouponUseCase: ValidateCouponUseCase,
    private deleteCouponUseCase: DeleteCouponUseCase
  ) {}

  /**
   * Create a new coupon
   */
  async create(request: any, userId: string): Promise<ApiResponse> {
    try {
      const dto = new CreateCouponDTO(request);
      const coupon = await this.createCouponUseCase.execute(dto, userId);

      return {
        success: true,
        data: {
          id: coupon.id,
          code: coupon.code,
          stripeCouponId: coupon.stripeCouponId,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountDisplay: coupon.getDiscountDisplay(),
          appliesToServices: coupon.appliesToServices,
          description: coupon.description,
          organizationName: coupon.organizationName,
          notes: coupon.notes,
          usageCount: coupon.usageCount,
          maxRedemptions: coupon.maxRedemptions,
          isActive: coupon.isActive,
          expiresAt: coupon.expiresAt,
          createdAt: coupon.createdAt
        },
        statusCode: 201
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * List all coupons with optional filters
   */
  async list(filters?: {
    isActive?: boolean;
    serviceId?: number;
    createdByUserId?: string;
  }): Promise<ApiResponse> {
    try {
      const coupons = await this.listCouponsUseCase.execute(filters);

      return {
        success: true,
        data: coupons.map(coupon => ({
          id: coupon.id,
          code: coupon.code,
          stripeCouponId: coupon.stripeCouponId,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountDisplay: coupon.getDiscountDisplay(),
          appliesToServices: coupon.appliesToServices,
          description: coupon.description,
          organizationName: coupon.organizationName,
          notes: coupon.notes,
          usageCount: coupon.usageCount,
          maxRedemptions: coupon.maxRedemptions,
          isActive: coupon.isActive,
          isValid: coupon.isValid(),
          expiresAt: coupon.expiresAt,
          createdByUserId: coupon.createdByUserId,
          createdAt: coupon.createdAt,
          updatedAt: coupon.updatedAt
        })),
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Validate a coupon for a service
   */
  async validate(request: any): Promise<ApiResponse> {
    try {
      const dto = new ValidateCouponDTO(request);
      const result = await this.validateCouponUseCase.execute(dto);

      if (!result.valid) {
        return {
          success: false,
          error: result.error,
          statusCode: 400
        };
      }

      return {
        success: true,
        data: {
          valid: result.valid,
          couponId: result.couponId,
          discountType: result.discountType,
          discountValue: result.discountValue
        },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Delete a coupon
   */
  async delete(couponId: string): Promise<ApiResponse> {
    try {
      await this.deleteCouponUseCase.execute(couponId);

      return {
        success: true,
        data: { message: 'Coupon deleted successfully' },
        statusCode: 200
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Handle errors and map to appropriate HTTP responses
   */
  private handleError(error: unknown): ApiResponse {
    console.error('CouponController error:', error);

    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        statusCode: 400
      };
    }

    if (error instanceof Error) {
      // Check for specific error messages
      if (error.message.includes('already exists')) {
        return {
          success: false,
          error: error.message,
          statusCode: 409
        };
      }

      if (error.message.includes('not found')) {
        return {
          success: false,
          error: error.message,
          statusCode: 404
        };
      }

      return {
        success: false,
        error: error.message,
        statusCode: 400
      };
    }

    return {
      success: false,
      error: 'Internal server error',
      statusCode: 500
    };
  }
}
