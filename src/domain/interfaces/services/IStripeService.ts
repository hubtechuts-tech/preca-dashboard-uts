/**
 * IStripeService Interface
 *
 * Contract for Stripe integration operations
 * Domain layer defines the contract, infrastructure layer implements it
 */

export interface StripeProductData {
  name: string;
  description: string | null;
  active: boolean;
  metadata?: Record<string, string>;
}

export interface StripePriceData {
  currency: string;
  unitAmount: number;  // Amount in cents (e.g., 29900 for $299.00 MXN)
  productId: string;
  metadata?: Record<string, string>;
}

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  defaultPriceId: string | null;
  metadata: Record<string, string>;
  created: number;
  updated: number;
}

export interface StripePrice {
  id: string;
  productId: string;
  currency: string;
  unitAmount: number;
  active: boolean;
  metadata: Record<string, string>;
}

export interface IStripeService {
  /**
   * Create a new product in Stripe
   */
  createProduct(data: StripeProductData): Promise<StripeProduct>;

  /**
   * Create a new price for a product
   */
  createPrice(data: StripePriceData): Promise<StripePrice>;

  /**
   * Create a product with its default price
   */
  createProductWithPrice(
    productData: StripeProductData,
    priceAmount: number,
    currency: string
  ): Promise<{ product: StripeProduct; price: StripePrice }>;

  /**
   * Update an existing product
   */
  updateProduct(productId: string, data: Partial<StripeProductData>): Promise<StripeProduct>;

  /**
   * Update a price (by deactivating and creating new one)
   */
  updatePrice(priceId: string, newAmount: number): Promise<StripePrice>;

  /**
   * Retrieve a product by ID
   */
  getProduct(productId: string): Promise<StripeProduct | null>;

  /**
   * Retrieve a price by ID
   */
  getPrice(priceId: string): Promise<StripePrice | null>;

  /**
   * List all products
   */
  listProducts(active?: boolean): Promise<StripeProduct[]>;

  /**
   * Deactivate a product
   */
  deactivateProduct(productId: string): Promise<StripeProduct>;

  /**
   * Activate a product
   */
  activateProduct(productId: string): Promise<StripeProduct>;

  /**
   * Create a payment link (reusable URL for payments)
   */
  createPaymentLink(params: {
    priceId: string;
    quantity?: number;
    metadata?: Record<string, string>;
    afterCompletionType?: 'hosted_confirmation' | 'redirect';
    afterCompletionUrl?: string;
    allowPromotionCodes?: boolean;
  }): Promise<{ url: string; id: string }>;

  /**
   * Retrieve a payment link by ID
   */
  getPaymentLink(paymentLinkId: string): Promise<{ id: string; metadata: Record<string, string> } | null>;
}
