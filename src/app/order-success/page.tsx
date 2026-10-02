import type { Metadata } from 'next';
import Link from 'next/link';
import { ClearCartOnPaid } from '@/components/store/ClearCartOnPaid';
import { AddressBlock, DirectionsLink, HoursTable, PhoneLink } from '@/components/site/StoreFacts';
import { getOrder } from '@/lib/commerce/orders';
import { formatPrice } from '@/lib/products/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order confirmed',
  robots: { index: false, follow: false },
};

/**
 * Confirmation.
 *
 * The status shown here comes from the order record, which is only marked paid
 * by a verified webhook. Landing on this URL does not itself confirm anything,
 * so an order still awaiting its webhook says so honestly rather than
 * congratulating someone on a payment that has not settled.
 */
export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  const order = orderId ? await getOrder(orderId) : null;

  if (!order) {
    return (
      <Shell title="We cannot find that order.">
        <p className="measure text-lg text-quiet-light">
          The link may have expired, or the order was placed from another device. If you
          have a confirmation email, the reference in it will let us find it. Otherwise
          give the shop a call and we will look it up.
        </p>
        <Actions />
      </Shell>
    );
  }

  if (order.status === 'failed') {
    return (
      <Shell title="That payment did not go through.">
        <p className="measure text-lg text-quiet-light">
          {order.failureReason ?? 'The payment was declined.'} Nothing has been charged
          and your cart is still here. Try again, or call the shop and we will take it
          over the phone.
        </p>
        <Actions />
      </Shell>
    );
  }

  if (order.status !== 'paid') {
    return (
      <Shell title="Waiting on the payment.">
        <p className="measure text-lg text-quiet-light">
          Your order is logged as <strong>{order.reference}</strong>, but we have not had
          confirmation from the payment provider yet. This usually takes a few seconds.
          Refresh in a moment — and do not pay twice. If it is still pending in five
          minutes, call us with that reference.
        </p>
        <Actions />
      </Shell>
    );
  }

  const isPickup = order.order.fulfillment === 'pickup';

  return (
    <>
      <ClearCartOnPaid />
      <Shell title="That is booked in.">
        <p className="measure text-lg text-quiet-light">
          Thanks{order.customer.name ? `, ${order.customer.name.split(' ')[0]}` : ''}. We have
          your order and a receipt is on its way to {order.customer.email}.
        </p>

        <div className="mt-10 border-y border-rule-light py-6">
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-quiet-light">Reference</dt>
              <dd className="mt-1 font-display text-2xl">{order.reference}</dd>
            </div>
            <div>
              <dt className="text-sm text-quiet-light">Total paid</dt>
              <dd className="mt-1 font-display text-2xl tabular-nums">
                {formatPrice(order.order.total)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-quiet-light">
                {isPickup ? 'Collection' : 'Delivery'}
              </dt>
              <dd className="mt-1 font-display text-2xl">
                {isPickup ? 'In store' : 'Shipping'}
              </dd>
            </div>
          </dl>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl">What you ordered</h2>
          <ul className="mt-4 divide-y divide-rule-light border-y border-rule-light">
            {order.order.lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-4 py-3.5">
                <span>
                  {line.brand} {line.name}
                  {line.quantity > 1 && (
                    <span className="text-quiet-light"> × {line.quantity}</span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums">{formatPrice(line.lineAmount)}</span>
              </li>
            ))}
          </ul>
        </section>

        {isPickup && (
          <section className="mt-10 bg-parchment p-7">
            <h2 className="font-display text-2xl">Collecting it</h2>
            <p className="measure mt-3 text-quiet-light">
              Quote <strong>{order.reference}</strong> at the counter. We will have it set
              up and ready — give us a few hours before you set off if you are driving in.
            </p>
            <AddressBlock className="mt-5" />
            <div className="mt-3 flex flex-col items-start gap-2">
              <PhoneLink />
              <DirectionsLink />
            </div>
            <HoursTable className="mt-5 text-sm text-quiet-light" />
          </section>
        )}

        <Actions />
      </Shell>
    </>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper pb-24 pt-16 text-ink on-light md:pt-24">
      <div className="shell shell-tight">
        <h1 className="text-5xl">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function Actions() {
  return (
    <div className="mt-12 flex flex-wrap gap-4">
      <Link
        href="/shop"
        className="inline-flex min-h-12 items-center rounded-[var(--radius-xs)] bg-ink px-7 font-medium text-paper transition-colors hover:bg-walnut"
      >
        Back to the shop
      </Link>
      <Link
        href="/contact"
        className="inline-flex min-h-12 items-center rounded-[var(--radius-xs)] border border-rule-light px-7 font-medium transition-colors hover:border-ink"
      >
        Contact the store
      </Link>
    </div>
  );
}
