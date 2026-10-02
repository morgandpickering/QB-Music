import { createHmac } from 'node:crypto';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getOrder } from '@/lib/commerce/orders';
import { formatPrice } from '@/lib/products/types';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

/**
 * DEVELOPMENT ONLY — stands in for the payment provider's hosted page.
 *
 * A real provider owns this step: the customer leaves the site, enters card
 * details on the provider's domain, and the provider signs a webhook back to
 * us. This page fakes exactly that shape — including signing the webhook — so
 * the rest of the flow is built against the real contract rather than a
 * shortcut that would have to be unpicked later.
 *
 * Delete this route when a real provider is connected.
 */
export default async function SimulatePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; session?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { order: orderId, session: sessionId } = await searchParams;
  if (!orderId || !sessionId) notFound();

  const order = await getOrder(orderId);
  if (!order) notFound();

  async function settle(formData: FormData) {
    'use server';
    const outcome = String(formData.get('outcome'));
    const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev-webhook-secret';

    const event = JSON.stringify(
      outcome === 'succeed'
        ? {
            type: 'payment.succeeded',
            orderId,
            sessionId,
            amountPaid: order!.order.total,
          }
        : {
            type: 'payment.failed',
            orderId,
            sessionId,
            reason: 'Card declined (simulated)',
          },
    );

    const signature = createHmac('sha256', secret).update(event).digest('hex');

    await fetch(absoluteUrl('/api/webhooks/payment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mock-signature': signature },
      body: event,
    });

    redirect(
      outcome === 'succeed'
        ? `/order-success?order=${orderId}`
        : `/order-cancelled?order=${orderId}`,
    );
  }

  return (
    <div className="bg-paper pb-24 pt-16 text-ink on-light md:pt-24">
      <div className="shell shell-tight">
        <p className="marker text-burgundy">Development stand-in</p>
        <h1 className="mt-4 text-4xl">Simulated payment page</h1>

        <p className="measure mt-6 text-quiet-light">
          A real payment provider would collect card details here, on its own domain.
          This page exists so the order flow can be tested end to end before a merchant
          account exists. It signs and posts the same webhook a real provider would.
        </p>

        <dl className="mt-8 space-y-2 border-y border-rule-light py-5">
          <div className="flex justify-between">
            <dt className="text-quiet-light">Reference</dt>
            <dd className="font-medium">{order.reference}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-quiet-light">Amount</dt>
            <dd className="font-medium tabular-nums">{formatPrice(order.order.total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-quiet-light">Fulfilment</dt>
            <dd className="font-medium">
              {order.order.fulfillment === 'pickup' ? 'Collection in Searcy' : 'Shipping'}
            </dd>
          </div>
        </dl>

        <form action={settle} className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            name="outcome"
            value="succeed"
            className="min-h-13 rounded-[var(--radius-xs)] bg-ink px-7 py-4 font-medium text-paper transition-colors hover:bg-walnut"
          >
            Simulate a successful payment
          </button>
          <button
            type="submit"
            name="outcome"
            value="fail"
            className="min-h-13 rounded-[var(--radius-xs)] border border-rule-light px-7 py-4 font-medium transition-colors hover:border-ink"
          >
            Simulate a decline
          </button>
        </form>

        <Link href="/cart" className="link-draw mt-8 inline-block text-sm text-quiet-light">
          Back to cart
        </Link>
      </div>
    </div>
  );
}
