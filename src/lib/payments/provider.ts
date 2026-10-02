/**
 * PAYMENT PROVIDER CONTRACT
 *
 * The site is deliberately not built around Stripe, Square, Shopify, or
 * anyone else. Everything the checkout needs is expressed here; adding a real
 * provider means writing one file that satisfies this interface and pointing
 * `PAYMENT_PROVIDER` at it. No page or component changes.
 *
 * NON-NEGOTIABLES FOR ANY IMPLEMENTATION
 * --------------------------------------
 * 1. Card numbers, CVVs, and raw payment credentials never reach this
 *    application. The provider collects them on its own hosted surface
 *    (Stripe Checkout, Payment Elements, Square Web Payments, etc.).
 * 2. Line item amounts passed to `createCheckoutSession` are computed on the
 *    server from the product repository. The browser never states a price.
 * 3. An order is only marked paid from a cryptographically verified webhook
 *    (`verifyWebhook`). A browser redirect to /order-success is a hint, not
 *    proof of payment.
 */

export type FulfillmentMethod = 'pickup' | 'shipping';

/** A line item after the server has re-priced it. Amounts are integer cents. */
export interface PricedLine {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  quantity: number;
  /** Server-derived unit price in cents. */
  unitAmount: number;
  /** unitAmount * quantity. */
  lineAmount: number;
}

export interface PricedOrder {
  lines: PricedLine[];
  subtotal: number;
  /** Null until a tax engine is configured — see PENDING.md. */
  tax: number | null;
  shipping: number;
  total: number;
  currency: 'usd';
  fulfillment: FulfillmentMethod;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone?: string;
}

export interface CreateSessionInput {
  order: PricedOrder;
  customer: CustomerDetails;
  /** Our own order id, echoed back by the webhook so we can reconcile. */
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  /** Provider's session identifier, stored on the order. */
  sessionId: string;
  /** Where to send the browser to pay. */
  redirectUrl: string;
}

export type WebhookResult =
  | { status: 'paid'; orderId: string; sessionId: string; amountPaid: number }
  | { status: 'failed'; orderId: string; sessionId: string; reason: string }
  | { status: 'ignored' };

export interface PaymentProvider {
  readonly id: string;
  /** True when real credentials are configured and money can actually move. */
  readonly isLive: boolean;

  createCheckoutSession(input: CreateSessionInput): Promise<CheckoutSession>;

  /**
   * Verifies the provider's signature over the raw request body and returns
   * what happened. MUST reject anything it cannot cryptographically verify.
   */
  verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookResult>;
}
