import { NextResponse } from 'next/server';
import { markFailed, markPaid } from '@/lib/commerce/orders';
import { getPaymentProvider } from '@/lib/payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The only place an order is allowed to become "paid".
 *
 * A browser landing on /order-success proves nothing — a customer can type that
 * URL. Payment is confirmed here, from an event the provider signed, verified
 * cryptographically by `provider.verifyWebhook` against the RAW body.
 *
 * The body is read as text and passed through unparsed for exactly that reason:
 * re-serialising JSON changes the bytes and breaks every signature scheme.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  let result;
  try {
    const provider = getPaymentProvider();
    result = await provider.verifyWebhook(rawBody, request.headers);
  } catch (error) {
    console.error('[webhook] verification threw', error);
    return NextResponse.json({ received: false }, { status: 400 });
  }

  switch (result.status) {
    case 'paid': {
      // markPaid checks the captured amount against our own order total and
      // is idempotent, because providers retry.
      const order = await markPaid(result.orderId, result.sessionId, result.amountPaid);
      if (!order) {
        // Unknown order, or a session id that does not belong to it.
        return NextResponse.json({ received: true }, { status: 202 });
      }
      // TODO: notify the shop (email/POS) once a mail transport is configured.
      return NextResponse.json({ received: true });
    }

    case 'failed': {
      await markFailed(result.orderId, result.sessionId, result.reason);
      return NextResponse.json({ received: true });
    }

    case 'ignored':
    default:
      // Unsigned, unrecognised, or an event type we do not act on. Return 200
      // so the provider stops retrying, but change nothing.
      return NextResponse.json({ received: true });
  }
}
