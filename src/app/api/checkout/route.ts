import { NextResponse } from 'next/server';
import { attachSession, createOrder } from '@/lib/commerce/orders';
import { priceOrder } from '@/lib/commerce/pricing';
import { getPaymentProvider } from '@/lib/payments';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';
import { checkoutSchema, fieldErrors } from '@/lib/server/validation';
import { absoluteUrl } from '@/lib/site';

export const runtime = 'nodejs';
/** Never cached: this creates orders. */
export const dynamic = 'force-dynamic';

/**
 * Starts a checkout.
 *
 * The browser sends product ids, quantities, a fulfilment choice, and who to
 * contact. It does NOT send prices — `priceOrder` recomputes every amount from
 * the product repository, and that is the only figure the payment provider ever
 * sees. A customer who edits their cart in devtools changes what they see on
 * their own screen and nothing else.
 */
export async function POST(request: Request) {
  // Generous on purpose: a household, an office, or a school all share one
  // public IP, and rate limiting must never stop a real customer buying
  // something. This is here to blunt scripted abuse, not to ration checkouts.
  const limit = rateLimit(clientKey(request, 'checkout'), 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Check the details below.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const { items, fulfillment, customer } = parsed.data;

  // Authoritative pricing. Also enforces stock, collection-only, and
  // enquiry-only rules server-side rather than trusting the UI to have.
  const priced = await priceOrder(items, fulfillment);
  if (!priced.ok) {
    return NextResponse.json(
      { error: priced.error.message, code: priced.error.code },
      { status: 409 },
    );
  }

  const order = await createOrder(priced.order, customer);

  try {
    const provider = getPaymentProvider();
    const session = await provider.createCheckoutSession({
      order: priced.order,
      customer,
      orderId: order.id,
      successUrl: absoluteUrl(`/order-success?order=${order.id}`),
      cancelUrl: absoluteUrl(`/order-cancelled?order=${order.id}`),
    });

    // Recorded before we reply to the browser. A provider can deliver the
    // payment webhook before this request finishes, and markPaid refuses any
    // event whose session id does not match the order — so if this write landed
    // late, a genuinely paid order would be stuck awaiting payment forever.
    await attachSession(order.id, session.sessionId);

    return NextResponse.json({
      orderId: order.id,
      reference: order.reference,
      redirectUrl: session.redirectUrl,
      total: priced.order.total,
    });
  } catch (error) {
    // Never leak provider internals or key configuration to the client.
    console.error('[checkout] provider error', error);
    return NextResponse.json(
      { error: 'We could not start the payment. Give us a call and we will sort it out.' },
      { status: 502 },
    );
  }
}
