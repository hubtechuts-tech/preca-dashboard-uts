/**
 * StripeService
 *
 * Infrastructure layer implementation of IStripeService
 * Handles all Stripe Product and Price operations
 */

import Stripe from 'stripe';
import {
  IStripeService,
  StripeProductData,
  StripePriceData,
  StripeProduct,
  StripePrice
} from '../../domain/interfaces/services/IStripeService';

export class StripeService implements IStripeService {
  private stripe: Stripe;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-11-17.clover'
    });
  }

  async createProduct(data: StripeProductData): Promise<StripeProduct> {
    const product = await this.stripe.products.create({
      name: data.name,
      description: data.description || undefined,
      active: data.active,
      metadata: data.metadata || {}
    });

    return this.mapToStripeProduct(product);
  }

  async createPrice(data: StripePriceData): Promise<StripePrice> {
    const price = await this.stripe.prices.create({
      currency: data.currency.toLowerCase(),
      unit_amount: data.unitAmount,
      product: data.productId,
      metadata: data.metadata || {}
    });

    return this.mapToStripePrice(price);
  }

  async createProductWithPrice(
    productData: StripeProductData,
    priceAmount: number,
    currency: string = 'mxn'
  ): Promise<{ product: StripeProduct; price: StripePrice }> {
    // Create product with default price
    const product = await this.stripe.products.create({
      name: productData.name,
      description: productData.description || undefined,
      active: productData.active,
      metadata: productData.metadata || {},
      default_price_data: {
        currency: currency.toLowerCase(),
        unit_amount: priceAmount
      }
    });

    // Retrieve the default price
    const priceId = product.default_price as string;
    const price = await this.stripe.prices.retrieve(priceId);

    return {
      product: this.mapToStripeProduct(product),
      price: this.mapToStripePrice(price)
    };
  }

  async updateProduct(productId: string, data: Partial<StripeProductData>): Promise<StripeProduct> {
    const updateData: Stripe.ProductUpdateParams = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || undefined;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const product = await this.stripe.products.update(productId, updateData);

    return this.mapToStripeProduct(product);
  }

  async updatePrice(priceId: string, newAmount: number): Promise<StripePrice> {
    // Get the old price to extract product and currency
    const oldPrice = await this.stripe.prices.retrieve(priceId);

    // Create new price with updated amount
    const newPrice = await this.stripe.prices.create({
      currency: oldPrice.currency,
      unit_amount: newAmount,
      product: oldPrice.product as string,
      metadata: oldPrice.metadata
    });

    // Update product's default price to the new one
    await this.stripe.products.update(oldPrice.product as string, {
      default_price: newPrice.id
    });

    // Now we can safely deactivate the old price since it's no longer the default
    await this.stripe.prices.update(priceId, { active: false });

    return this.mapToStripePrice(newPrice);
  }

  async getProduct(productId: string): Promise<StripeProduct | null> {
    try {
      const product = await this.stripe.products.retrieve(productId);
      return this.mapToStripeProduct(product);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  async getPrice(priceId: string): Promise<StripePrice | null> {
    try {
      const price = await this.stripe.prices.retrieve(priceId);
      return this.mapToStripePrice(price);
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  async listProducts(active?: boolean): Promise<StripeProduct[]> {
    const params: Stripe.ProductListParams = {
      limit: 100
    };

    if (active !== undefined) {
      params.active = active;
    }

    const products = await this.stripe.products.list(params);

    return products.data.map(product => this.mapToStripeProduct(product));
  }

  async deactivateProduct(productId: string): Promise<StripeProduct> {
    const product = await this.stripe.products.update(productId, {
      active: false
    });

    return this.mapToStripeProduct(product);
  }

  async activateProduct(productId: string): Promise<StripeProduct> {
    const product = await this.stripe.products.update(productId, {
      active: true
    });

    return this.mapToStripeProduct(product);
  }

  async createPaymentLink(params: {
    priceId: string;
    quantity?: number;
    metadata?: Record<string, string>;
    afterCompletionType?: 'hosted_confirmation' | 'redirect';
    afterCompletionUrl?: string;
    allowPromotionCodes?: boolean;
  }): Promise<{ url: string; id: string }> {
    const paymentLinkParams: Stripe.PaymentLinkCreateParams = {
      line_items: [
        {
          price: params.priceId,
          quantity: params.quantity || 1,
        },
      ],
      metadata: params.metadata || {},
      allow_promotion_codes: params.allowPromotionCodes || false,
    };

    // Add after_completion configuration
    if (params.afterCompletionType === 'redirect' && params.afterCompletionUrl) {
      paymentLinkParams.after_completion = {
        type: 'redirect',
        redirect: {
          url: params.afterCompletionUrl,
        },
      };
    } else {
      paymentLinkParams.after_completion = {
        type: 'hosted_confirmation',
      };
    }

    const paymentLink = await this.stripe.paymentLinks.create(paymentLinkParams);

    return {
      url: paymentLink.url,
      id: paymentLink.id,
    };
  }

  async getPaymentLink(paymentLinkId: string): Promise<{ id: string; metadata: Record<string, string> } | null> {
    try {
      const paymentLink = await this.stripe.paymentLinks.retrieve(paymentLinkId);

      return {
        id: paymentLink.id,
        metadata: paymentLink.metadata,
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Map Stripe Product to our domain interface
   */
  private mapToStripeProduct(product: Stripe.Product): StripeProduct {
    return {
      id: product.id,
      name: product.name,
      description: product.description || null,
      active: product.active,
      defaultPriceId: typeof product.default_price === 'string' ? product.default_price : product.default_price?.id || null,
      metadata: product.metadata,
      created: product.created,
      updated: product.updated || product.created
    };
  }

  /**
   * Map Stripe Price to our domain interface
   */
  private mapToStripePrice(price: Stripe.Price): StripePrice {
    return {
      id: price.id,
      productId: typeof price.product === 'string' ? price.product : price.product.id,
      currency: price.currency,
      unitAmount: price.unit_amount || 0,
      active: price.active,
      metadata: price.metadata
    };
  }

  // =====================================================
  // COUPON METHODS
  // =====================================================

  /**
   * Create a coupon in Stripe
   */
  async createCoupon(params: {
    id?: string;
    percentOff?: number;
    amountOff?: number;
    currency?: string;
    duration: 'forever' | 'once' | 'repeating';
    durationInMonths?: number;
    maxRedemptions?: number;
    redeemBy?: number;
    name?: string;
    metadata?: Record<string, string>;
  }): Promise<{ id: string; percentOff: number | null; amountOff: number | null }> {
    const couponParams: Stripe.CouponCreateParams = {
      duration: params.duration,
      metadata: params.metadata || {}
    };

    if (params.id) {
      couponParams.id = params.id;
    }

    if (params.name) {
      couponParams.name = params.name;
    }

    if (params.percentOff) {
      couponParams.percent_off = params.percentOff;
    } else if (params.amountOff && params.currency) {
      couponParams.amount_off = params.amountOff;
      couponParams.currency = params.currency.toLowerCase();
    }

    if (params.durationInMonths) {
      couponParams.duration_in_months = params.durationInMonths;
    }

    if (params.maxRedemptions) {
      couponParams.max_redemptions = params.maxRedemptions;
    }

    if (params.redeemBy) {
      couponParams.redeem_by = params.redeemBy;
    }

    const coupon = await this.stripe.coupons.create(couponParams);

    return {
      id: coupon.id,
      percentOff: coupon.percent_off || null,
      amountOff: coupon.amount_off || null
    };
  }

  /**
   * Get a coupon from Stripe
   */
  async getCoupon(couponId: string): Promise<{
    id: string;
    percentOff: number | null;
    amountOff: number | null;
    currency: string | null;
    valid: boolean;
  } | null> {
    try {
      const coupon = await this.stripe.coupons.retrieve(couponId);

      return {
        id: coupon.id,
        percentOff: coupon.percent_off || null,
        amountOff: coupon.amount_off || null,
        currency: coupon.currency || null,
        valid: coupon.valid
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete a coupon from Stripe
   */
  async deleteCoupon(couponId: string): Promise<void> {
    await this.stripe.coupons.del(couponId);
  }

  /**
   * Create a promotion code for a coupon
   */
  async createPromotionCode(params: {
    couponId: string;
    code: string;
    maxRedemptions?: number;
    expiresAt?: number;
  }): Promise<{ id: string; code: string }> {
    const promoCodeParams: Stripe.PromotionCodeCreateParams = {
      promotion: {
        type: 'coupon',
        coupon: params.couponId
      },
      code: params.code
    };

    if (params.maxRedemptions) {
      promoCodeParams.max_redemptions = params.maxRedemptions;
    }

    if (params.expiresAt) {
      promoCodeParams.expires_at = params.expiresAt;
    }

    const promotionCode = await this.stripe.promotionCodes.create(promoCodeParams);

    return {
      id: promotionCode.id,
      code: promotionCode.code
    };
  }

  /**
   * Validate a coupon code
   */
  async validateCoupon(couponId: string): Promise<boolean> {
    try {
      const coupon = await this.stripe.coupons.retrieve(couponId);
      return coupon.valid;
    } catch (error) {
      return false;
    }
  }
}
