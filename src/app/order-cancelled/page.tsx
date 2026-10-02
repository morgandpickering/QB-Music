import type { Metadata } from 'next';
import Link from 'next/link';
import { PhoneLink } from '@/components/site/StoreFacts';

export const metadata: Metadata = {
  title: 'Payment cancelled',
  robots: { index: false, follow: false },
};

/**
 * The customer backed out of the payment page, or it declined.
 *
 * Nothing is cleared and nothing is blamed. The cart is exactly where they left
 * it, and the fastest route to a human is on the page.
 */
export default function OrderCancelledPage() {
  return (
    <div className="bg-paper pb-24 pt-16 text-ink on-light md:pt-24">
      <div className="shell shell-tight">
        <h1 className="text-5xl">No payment was taken.</h1>

        <p className="measure mt-6 text-lg text-quiet-light">
          Your cart is still here, exactly as you left it. Pick it back up whenever you
          are ready — or if something about the payment step did not work, call the shop
          and we will take the order that way instead.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/cart"
            className="inline-flex min-h-12 items-center rounded-[var(--radius-xs)] bg-ink px-7 font-medium text-paper transition-colors hover:bg-walnut"
          >
            Back to your cart
          </Link>
          <Link
            href="/shop"
            className="inline-flex min-h-12 items-center rounded-[var(--radius-xs)] border border-rule-light px-7 font-medium transition-colors hover:border-ink"
          >
            Keep shopping
          </Link>
        </div>

        <div className="mt-12 border-t border-rule-light pt-8">
          <h2 className="font-display text-2xl">Rather talk to someone?</h2>
          <p className="measure mt-3 text-quiet-light">
            That is usually quicker anyway.
          </p>
          <div className="mt-4 flex flex-col items-start gap-2">
            <PhoneLink />
            <Link href="/contact" className="link-draw">
              Send us a message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
