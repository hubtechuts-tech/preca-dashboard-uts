/**
 * Admin Coupon Detail API Route
 *
 * DELETE /api/admin/coupons/[id] - Delete a coupon (Admin only)
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
 * DELETE /api/admin/coupons/[id]
 * Delete a coupon
 * Requires admin authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Require COUPONS_WRITE permission
    await requirePermission(request, Permission.COUPONS_WRITE);

    const controller = createController();
    const response = await controller.delete(id);

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
    console.error('Unexpected error in DELETE /api/admin/coupons/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
