import type { Product } from '@/lib/products/types';
import { availabilityOf, effectivePrice } from '@/lib/products/types';

/**
 * Make an Offer — the business rules, in one place.
 *
 * Pure and dependency-free, so the product page (to show the minimum), the
 * API route (to enforce it), and scripts/check-offers.mjs all agree. The
 * database repeats the 80% floor and the 48-hour window as constraints — see
 * supabase/migrations/20260918000000_offers.sql.
 */

export const OFFER_STAFF_EMAIL = 'mr.cometwebsites@gmail.com';
export const OFFER_EXPIRY_HOURS = 48;
/** Bump when the wording in MakeOffer's terms changes; stored on every offer. */
export const OFFER_TERMS_VERSION = '2026-09-18';

/** Used and vintage one-offs only, and only while one is listed. */
export function isOfferEligible(product: Product): boolean {
  return (
    (product.condition === 'used' || product.condition === 'vintage') &&
    availabilityOf(product) !== 'out-of-stock'
  );
}

/** 80% of the listed price, rounded up to the cent. Integer maths only. */
export function minimumOfferCents(listedCents: number): number {
  return Math.ceil((listedCents * 4) / 5);
}

export function offerPriceOf(product: Product): number {
  return effectivePrice(product);
}

/** "$1,234.5" / "1234.50" / "1234" -> cents; anything else -> null. */
export function parseDollars(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(cleaned);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
}

export type OfferCheck =
  | { ok: true; amountCents: number; listedCents: number }
  | { ok: false; field: 'amount' | 'product'; message: string };

/** The whole server-side price decision. `product` comes from the catalogue. */
export function checkOffer(product: Product, amountInput: string): OfferCheck {
  if (!isOfferEligible(product)) {
    return { ok: false, field: 'product', message: 'Offers are not open on this item.' };
  }
  const listedCents = offerPriceOf(product);
  const amountCents = parseDollars(amountInput);
  if (amountCents === null || amountCents <= 0) {
    return { ok: false, field: 'amount', message: 'Enter an amount in dollars, like 350 or 350.00.' };
  }
  if (amountCents > listedCents) {
    return {
      ok: false,
      field: 'amount',
      message: 'That is more than the listed price. You can buy it at the listed price instead.',
    };
  }
  const minimum = minimumOfferCents(listedCents);
  if (amountCents < minimum) {
    return {
      ok: false,
      field: 'amount',
      message: `The lowest offer we can consider on this one is ${(minimum / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}.`,
    };
  }
  return { ok: true, amountCents, listedCents };
}
