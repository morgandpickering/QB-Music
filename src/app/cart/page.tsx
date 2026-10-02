'use client';

import Link from 'next/link';
import { Plate } from '@/components/media/Plate';
import { QuantityStepper } from '@/components/store/QuantityStepper';
import { useCart } from '@/lib/cart/CartProvider';
import { formatPrice } from '@/lib/products/types';

/**
 * The full cart page. The drawer covers the quick case; this is for people who
 * want to sit and look at what they are about to spend.
 *
 * Totals here are indicative and say so — the server re-prices everything at
 * checkout from the product repository.
 */
export default function CartPage() {
  const { items, hydrated, subtotal, count, remove, setQuantity, hasPickupOnlyItem } = useCart();

  return (
    <div className="bg-paper pb-24 pt-16 text-ink on-light md:pt-24">
      <div className="shell">
        <h1 className="text-5xl">Your cart</h1>

        {!hydrated ? (
          <p className="mt-8 text-quiet-light">Loading your cart…</p>
        ) : items.length === 0 ? (
          <div className="mt-10 border-t border-rule-light pt-10">
            <p className="measure text-lg text-quiet-light">
              Nothing in here yet. Have a look through the shop — or come in and play
              something first, which is usually the better order.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center rounded-[var(--radius-xs)] bg-ink px-7 font-medium text-paper transition-colors hover:bg-walnut"
              >
                Browse the shop
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-12 items-center rounded-[var(--radius-xs)] border border-rule-light px-7 font-medium transition-colors hover:border-ink"
              >
                Visit the store
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
            <div>
              <p className="border-b border-rule-light pb-4 text-sm text-quiet-light">
                {count} {count === 1 ? 'item' : 'items'}
              </p>

              <ul className="divide-y divide-rule-light">
                {items.map((item) => (
                  <li key={item.productId} className="flex flex-col gap-5 py-6 sm:flex-row">
                    <Link
                      href={`/product/${item.display.slug}`}
                      className="relative h-32 w-32 shrink-0 overflow-hidden bg-parchment"
                    >
                      <Plate kind={item.display.plate} tone="light" className="h-full w-full" />
                      <span className="sr-only">{item.display.imageAlt}</span>
                    </Link>

                    <div className="flex flex-1 flex-col justify-between gap-4">
                      <div>
                        <p className="text-sm text-quiet-light">{item.display.brand}</p>
                        <h2 className="mt-1">
                          <Link
                            href={`/product/${item.display.slug}`}
                            className="link-draw font-display text-2xl"
                          >
                            {item.display.name}
                          </Link>
                        </h2>
                        <p className="mt-1.5 text-[0.9375rem] text-quiet-light tabular-nums">
                          {formatPrice(item.display.unitAmount)} each
                          {item.display.pickupOnly && <> · collection only</>}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(q) => setQuantity(item.productId, q)}
                          label={`Quantity for ${item.display.brand} ${item.display.name}`}
                        />
                        <div className="flex items-center gap-6">
                          <span className="font-display text-xl tabular-nums">
                            {formatPrice(item.display.unitAmount * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => remove(item.productId)}
                            className="link-draw min-h-11 text-sm text-quiet-light hover:text-danger"
                          >
                            Remove
                            <span className="sr-only">
                              {' '}
                              {item.display.brand} {item.display.name}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/shop" className="link-draw mt-8 inline-block font-medium">
                Keep shopping
              </Link>
            </div>

            <aside className="h-fit bg-parchment p-7 lg:sticky lg:top-28">
              <h2 className="font-display text-2xl">Summary</h2>

              <dl className="mt-6 space-y-3 border-b border-rule-light pb-5">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-quiet-light">
                  <dt>Delivery</dt>
                  <dd>Chosen at checkout</dd>
                </div>
                <div className="flex justify-between text-quiet-light">
                  <dt>Tax</dt>
                  <dd>Worked out at checkout</dd>
                </div>
              </dl>

              <p className="mt-5 text-sm text-quiet-light">
                Prices are confirmed on the next step. Call ahead if you want to be sure
                something is really on hand before you order.
              </p>

              {hasPickupOnlyItem && (
                <p className="mt-4 border-l-2 border-burgundy pl-4 text-sm">
                  Your cart has a collection-only item, so this order is for pickup at
                  the shop in Searcy.
                </p>
              )}

              <Link
                href="/checkout"
                className="mt-7 flex min-h-13 items-center justify-center rounded-[var(--radius-xs)] bg-ink py-4 font-medium text-paper transition-colors hover:bg-walnut"
              >
                Checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
