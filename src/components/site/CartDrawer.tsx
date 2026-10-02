'use client';

import Link from 'next/link';
import { Plate } from '@/components/media/Plate';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useCart } from '@/lib/cart/CartProvider';
import { formatPrice } from '@/lib/products/types';
import { QuantityStepper } from '@/components/store/QuantityStepper';

/**
 * The cart drawer — a Sheet anchored to the right edge. Radix handles focus
 * entry/containment, Escape, background scroll-lock and aria-hidden; see
 * components/ui/sheet.tsx.
 */
export function CartDrawer() {
  const { items, isOpen, closeCart, remove, setQuantity, subtotal, count, opener } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener.current?.focus();
        }}
      >
        <div className="flex items-center justify-between border-b border-rule-light px-6 py-5">
          <SheetTitle asChild>
            <h2 className="font-display text-2xl">
              Your cart
              {count > 0 && <span className="ml-2 text-base opacity-60">({count})</span>}
            </h2>
          </SheetTitle>
          <SheetClose className="grid h-11 w-11 place-items-center rounded-[var(--radius-xs)] transition-colors hover:bg-parchment">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Close cart</span>
          </SheetClose>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="font-display text-xl">Nothing in here yet.</p>
            <p className="measure-narrow text-quiet-light">
              Have a look through the shop, or come in and play something first.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="inline-flex min-h-11 items-center rounded-[var(--radius-xs)] bg-ink px-6 font-medium text-paper transition-colors hover:bg-walnut"
            >
              Browse the shop
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-rule-light overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-5">
                  <Link
                    href={`/product/${item.display.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden bg-parchment"
                  >
                    <Plate kind={item.display.plate} tone="light" className="h-full w-full" />
                    <span className="sr-only">{item.display.imageAlt}</span>
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-quiet-light">{item.display.brand}</p>
                    <Link
                      href={`/product/${item.display.slug}`}
                      onClick={closeCart}
                      className="link-draw block font-medium leading-snug"
                    >
                      {item.display.name}
                    </Link>
                    <p className="mt-1 tabular-nums">
                      {formatPrice(item.display.unitAmount * item.quantity)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QuantityStepper
                        value={item.quantity}
                        onChange={(q) => setQuantity(item.productId, q)}
                        label={`Quantity for ${item.display.brand} ${item.display.name}`}
                      />
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        className="link-draw py-2 text-sm text-quiet-light hover:text-danger"
                      >
                        Remove
                        <span className="sr-only">
                          {' '}
                          {item.display.brand} {item.display.name} from cart
                        </span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-rule-light px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">Subtotal</span>
                <span className="font-display text-2xl tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-2 text-sm text-quiet-light">
                Collection and delivery are chosen at checkout. Tax is worked out there too.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="flex min-h-12 items-center justify-center rounded-[var(--radius-xs)] bg-ink font-medium text-paper transition-colors hover:bg-walnut"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex min-h-12 items-center justify-center rounded-[var(--radius-xs)] border border-rule-light font-medium transition-colors hover:border-ink"
                >
                  View full cart
                </Link>
                <button
                  type="button"
                  onClick={closeCart}
                  className="link-draw mx-auto py-2 text-sm text-quiet-light hover:text-ink"
                >
                  Keep shopping
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
