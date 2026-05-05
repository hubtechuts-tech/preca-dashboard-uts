/**
 * Admin Coupon Validation API Route
 *
 * POST /api/admin/coupons/validate - Validate a coupon code (Admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { CouponController } from '../_controllers/CouponController';
import { CreateCouponUseCase } from '@/application/use-cases/coupon/CreateCouponUseCase';
import { ListCouponsUseCase } from '@/application/use-cases/coupon/ListCouponsUseCase';
import { ValidateCouponUseCase } from '@/application/use-cases/coupon/ValidateCouponUseCase';
import { DeleteCouponUseCase } from '@/application/use-cases/coupon/DeleteCouponUseCase';
import { PrismaCouponRepository } from '@/infrastructure/database/repositories/PrismaCouponRepository';
import { StripeService } from '@/infrastructure/services/StripeService';
import { prisma } from '@/infrastructure/database/PrismaClient';
import { requirePermission, UnauthorizedError, ForbiddenError } from '@/lib/api-auth';
import { Permission } from '@/domain/entities/Permission';

/**
 * Create controller with all dependencies
 */
function createController(): CouponController {
  const couponRepository = new PrismaCouponRepository(prisma);
  const stripeService = new StripeService(process.env.STRIPE_SECRET_KEY!);

  const createUseCase = new CreateCouponUseCase(couponRepository, stripeService);
  const listUseCase = new ListCouponsUseCase(couponRepository);
  const validateUseCase = new ValidateCouponUseCase(couponRepository);
  const deleteUseCase = new DeleteCouponUseCase(couponRepository, stripeService);

  return new CouponController(
    createUseCase,
    listUseCase,
    validateUseCase,
    deleteUseCase
  );
}

/**
 * POST /api/admin/coupons/validate
 * Validate a coupon code for a service
 * Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Require COUPONS_READ permission
    await requirePermission(request, Permission.COUPONS_READ);

    // Parse request body
    const body = await request.json();

    const controller = createController();
    const response = await controller.validate(body);

    if (response.success) {
      return NextResponse.json(response.data, { status: response.statusCode });
    } else {
      return NextResponse.json({ error: response.error }, { status: response.statusCode });
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Unexpected error in POST /api/admin/coupons/validate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
