import 'server-only';
import { getProductsByIds } from '@/lib/products/repository';
import { availabilityOf, effectivePrice } from '@/lib/products/types';
import type { FulfillmentMethod, PricedLine, PricedOrder } from '@/lib/payments/provider';

/**
 * THE PRICING AUTHORITY.
 *
 * The browser sends product ids and quantities. It does not send prices, and
 * anything price-shaped arriving from a client is discarded here. Every amount
 * that reaches a payment provider is computed in this file from the product
 * repository.
 */

/** Flat-rate shipping in cents. Replace with a carrier quote when required. */
export const FLAT_SHIPPING_CENTS = 1495;
/** Orders at or above this ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 19900;
/** Guard against a hostile or buggy client asking for 10,000 guitars. */
export const MAX_QUANTITY_PER_LINE = 10;

export interface RequestedLine {
  productId: string;
  quantity: number;
}

export type PricingFailure =
  | { code: 'empty'; message: string }
  | { code: 'unknown-product'; message: string; productId: string }
  | { code: 'out-of-stock'; message: string; productId: string }
  | { code: 'insufficient-stock'; message: string; productId: string; available: number }
  | { code: 'enquiry-only'; message: string; productId: string }
  | { code: 'pickup-only'; message: string; productId: string };

export type PricingResult =
  | { ok: true; order: PricedOrder }
  | { ok: false; error: PricingFailure };

export async function priceOrder(
  requested: RequestedLine[],
  fulfillment: FulfillmentMethod,
): Promise<PricingResult> {
  if (requested.length === 0) {
    return { ok: false, error: { code: 'empty', message: 'Your cart is empty.' } };
  }

  // Collapse duplicate ids so a repeated line cannot slip past the stock check.
  const wanted = new Map<string, number>();
  for (const line of requested) {
    wanted.set(line.productId, (wanted.get(line.productId) ?? 0) + line.quantity);
  }

  const found = await getProductsByIds([...wanted.keys()]);
  const lines: PricedLine[] = [];

  for (const [productId, quantity] of wanted) {
    const product = found.get(productId);

    if (!product) {
      return {
        ok: false,
        error: {
          code: 'unknown-product',
          productId,
          message: 'One of the items in your cart is no longer listed.',
        },
      };
    }

    if (product.enquiryOnly) {
      return {
        ok: false,
        error: {
          code: 'enquiry-only',
          productId,
          message: `${product.brand} ${product.name} is sold in person. Get in touch and we will hold it for you.`,
        },
      };
    }

    if (availabilityOf(product) === 'out-of-stock') {
      return {
        ok: false,
        error: {
          code: 'out-of-stock',
          productId,
          message: `${product.brand} ${product.name} has sold out.`,
        },
      };
    }

    // Reject rather than silently trim. Duplicate lines are summed above, so a
    // cart can exceed the cap even when each line is within it, and quietly
    // charging for fewer than were asked for is the one outcome a customer
    // cannot see happening.
    if (quantity > MAX_QUANTITY_PER_LINE) {
      return {
        ok: false,
        error: {
          code: 'insufficient-stock',
          productId,
          available: MAX_QUANTITY_PER_LINE,
          message: `We can only take ${MAX_QUANTITY_PER_LINE} of the ${product.brand} ${product.name} in one online order. Call the shop for more.`,
        },
      };
    }

    if (quantity > product.inventory) {
      return {
        ok: false,
        error: {
          code: 'insufficient-stock',
          productId,
          available: product.inventory,
          message: `We have ${product.inventory} of the ${product.brand} ${product.name} left.`,
        },
      };
    }

    if (fulfillment === 'shipping' && (product.pickupOnly || !product.shippingAvailable)) {
      return {
        ok: false,
        error: {
          code: 'pickup-only',
          productId,
          message: `${product.brand} ${product.name} is collection only from the shop in Searcy.`,
        },
      };
    }

    const unitAmount = effectivePrice(product);
    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      quantity,
      unitAmount,
      lineAmount: unitAmount * quantity,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.lineAmount, 0);
  const shipping =
    fulfillment === 'pickup' || subtotal >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_CENTS;

  return {
    ok: true,
    order: {
      lines,
      subtotal,
      // Arkansas sales tax is not calculated yet — see PENDING.md. Null renders
      // as "calculated at checkout" rather than as a confident $0.00.
      tax: null,
      shipping,
      total: subtotal + shipping,
      currency: 'usd',
      fulfillment,
    },
  };
}
