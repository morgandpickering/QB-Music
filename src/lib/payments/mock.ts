import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  CheckoutSession,
  CreateSessionInput,
  PaymentProvider,
  WebhookResult,
} from './provider';

/**
 * DEVELOPMENT PROVIDER — moves no money.
 *
 * It exists so the whole order flow (cart -> checkout -> redirect -> webhook
 * -> paid order -> confirmation) can be built, demonstrated, and tested before
 * a merchant account exists. It refuses to run outside development.
 *
 * It still verifies its webhook signature with a real HMAC, so the production
 * provider is dropped into a flow that already assumes signatures are checked
 * rather than into one that has to be retrofitted for it.
 */
export function createMockProvider(secret: string): PaymentProvider {
  return {
    id: 'mock',
    isLive: false,

    async createCheckoutSession(input: CreateSessionInput): Promise<CheckoutSession> {
      const sessionId = `mock_cs_${input.orderId}`;
      // A real provider returns its own hosted URL. We send the browser to a
      // local page that stands in for the hosted payment surface.
      const url = new URL('/checkout/simulate', input.successUrl);
      url.searchParams.set('order', input.orderId);
      url.searchParams.set('session', sessionId);
      url.searchParams.set('amount', String(input.order.total));
      return { sessionId, redirectUrl: url.toString() };
    },

    async verifyWebhook(rawBody: string, headers: Headers): Promise<WebhookResult> {
      const signature = headers.get('x-mock-signature');
      if (!signature) return { status: 'ignored' };

      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      const given = Buffer.from(signature, 'utf8');
      const want = Buffer.from(expected, 'utf8');
      if (given.length !== want.length || !timingSafeEqual(given, want)) {
        return { status: 'ignored' };
      }

      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return { status: 'ignored' };
      }

      const event = payload as {
        type?: string;
        orderId?: string;
        sessionId?: string;
        amountPaid?: number;
        reason?: string;
      };

      if (!event.orderId || !event.sessionId) return { status: 'ignored' };

      if (event.type === 'payment.succeeded' && typeof event.amountPaid === 'number') {
        return {
          status: 'paid',
          orderId: event.orderId,
          sessionId: event.sessionId,
          amountPaid: event.amountPaid,
        };
      }
      if (event.type === 'payment.failed') {
        return {
          status: 'failed',
          orderId: event.orderId,
          sessionId: event.sessionId,
          reason: event.reason ?? 'Payment declined',
        };
      }
      return { status: 'ignored' };
    },
  };
}
