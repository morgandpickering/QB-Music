import 'server-only';
import { createMockProvider } from './mock';
import type { PaymentProvider } from './provider';

/**
 * Resolves the configured payment provider.
 *
 * WIRING A REAL PROVIDER
 * ----------------------
 * 1. Add a file next to `mock.ts` implementing `PaymentProvider`.
 * 2. Add its id to the switch below.
 * 3. Set the environment variables in `.env.local` (see `.env.example`):
 *
 *      PAYMENT_PROVIDER=stripe
 *      PAYMENT_SECRET_KEY=sk_live_...
 *      PAYMENT_WEBHOOK_SECRET=whsec_...
 *      NEXT_PUBLIC_PAYMENT_PUBLIC_KEY=pk_live_...
 *
 * Only the NEXT_PUBLIC_ key is ever allowed into the browser bundle. The
 * `server-only` import at the top of this file makes importing it from a
 * client component a build error rather than a leak.
 */

let cached: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cached) return cached;

  const id = process.env.PAYMENT_PROVIDER ?? 'mock';
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  switch (id) {
    /*
     * case 'stripe': {
     *   assertConfigured(process.env.PAYMENT_SECRET_KEY, 'PAYMENT_SECRET_KEY');
     *   assertConfigured(webhookSecret, 'PAYMENT_WEBHOOK_SECRET');
     *   cached = createStripeProvider(process.env.PAYMENT_SECRET_KEY!, webhookSecret!);
     *   break;
     * }
     */
    case 'mock': {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'The mock payment provider cannot run in production. Set PAYMENT_PROVIDER to a real provider before deploying a store that takes money.',
        );
      }
      cached = createMockProvider(webhookSecret ?? 'dev-webhook-secret');
      break;
    }
    default:
      throw new Error(`Unknown PAYMENT_PROVIDER "${id}".`);
  }

  return cached;
}

/** True when the store can actually take a payment. Drives store UI copy. */
export function isCheckoutLive(): boolean {
  try {
    return getPaymentProvider().isLive;
  } catch {
    return false;
  }
}
