/**
 * PrismaCouponRepository
 *
 * Infrastructure layer implementation of ICouponRepository.
 * Maps between Prisma models and domain entities.
 */

import { PrismaClient, coupons_discount_type_enum } from '@prisma/client';
import { ICouponRepository } from '../../../domain/interfaces/repositories/ICouponRepository';
import { Coupon, DiscountType } from '../../../domain/entities/Coupon';

export class PrismaCouponRepository implements ICouponRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Coupon | null> {
    const record = await this.prisma.coupons.findUnique({
      where: { id }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    const record = await this.prisma.coupons.findUnique({
      where: { code: code.toUpperCase() }
    });

    return record ? this.toDomain(record) : null;
  }

  async findByStripeCouponId(stripeCouponId: string): Promise<Coupon | null> {
    const record = await this.prisma.coupons.findUnique({
      where: { stripe_coupon_id: stripeCouponId }
    });

    return record ? this.toDomain(record) : null;
  }

  async findAll(filters?: {
    isActive?: boolean;
    serviceId?: number;
    createdByUserId?: string;
  }): Promise<Coupon[]> {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.is_active = filters.isActive;
    }

    if (filters?.createdByUserId) {
      where.created_by_user_id = filters.createdByUserId;
    }

    // Filter by service ID (array contains)
    if (filters?.serviceId !== undefined) {
      where.applies_to_services = {
        has: filters.serviceId
      };
    }

    const records = await this.prisma.coupons.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return records.map(record => this.toDomain(record));
  }

  async save(coupon: Coupon): Promise<void> {
    const data = this.toPrisma(coupon);

    await this.prisma.coupons.upsert({
      where: { id: coupon.id },
      update: data,
      create: data
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.coupons.delete({
      where: { id }
    });
  }

  async incrementUsageCount(id: string): Promise<void> {
    await this.prisma.coupons.update({
      where: { id },
      data: {
        usage_count: {
          increment: 1
        },
        updated_at: new Date()
      }
    });
  }

  /**
   * Maps Prisma model to domain entity
   */
  private toDomain(record: any): Coupon {
    return Coupon.reconstitute({
      id: record.id,
      code: record.code,
      stripeCouponId: record.stripe_coupon_id,
      discountType: this.mapDiscountTypeToDomain(record.discount_type),
      discountValue: Number(record.discount_value),
      appliesToServices: record.applies_to_services || [],
      description: record.description,
      organizationName: record.organization_name,
      notes: record.notes,
      usageCount: record.usage_count,
      maxRedemptions: record.max_redemptions,
      isActive: record.is_active,
      expiresAt: record.expires_at,
      createdByUserId: record.created_by_user_id,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    });
  }

  /**
   * Maps domain entity to Prisma model
   */
  private toPrisma(coupon: Coupon) {
    return {
      id: coupon.id,
      code: coupon.code,
      stripe_coupon_id: coupon.stripeCouponId,
      discount_type: this.mapDiscountTypeToPrisma(coupon.discountType),
      discount_value: coupon.discountValue,
      applies_to_services: coupon.appliesToServices,
      description: coupon.description,
      organization_name: coupon.organizationName,
      notes: coupon.notes,
      usage_count: coupon.usageCount,
      max_redemptions: coupon.maxRedemptions,
      is_active: coupon.isActive,
      expires_at: coupon.expiresAt,
      created_by_user_id: coupon.createdByUserId,
      created_at: coupon.createdAt,
      updated_at: coupon.updatedAt
    };
  }

  /**
   * Maps database discount type enum to domain enum
   */
  private mapDiscountTypeToDomain(type: string): DiscountType {
    return type === 'percentage' ? DiscountType.PERCENTAGE : DiscountType.FIXED_AMOUNT;
  }

  /**
   * Maps domain discount type enum to database enum
   */
  private mapDiscountTypeToPrisma(type: DiscountType): coupons_discount_type_enum {
    return type === DiscountType.PERCENTAGE ? coupons_discount_type_enum.percentage : coupons_discount_type_enum.fixed_amount;
  }
}
