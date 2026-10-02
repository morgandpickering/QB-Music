'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/lib/cart/CartProvider';
import {
  availabilityOf,
  canAddToCart,
  effectivePrice,
  type Product,
} from '@/lib/products/types';
import { QuantityStepper } from './QuantityStepper';

/**
 * Add to cart, or — for a one-off vintage amp or a console that wants a
 * conversation — the honest alternative. A shop should not pretend a single
 * 1978 Twin is a thing you buy with one click.
 */
export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const availability = availabilityOf(product);

  if (product.enquiryOnly) {
    return (
      <div className="border-t border-rule-light pt-6">
        <Link
          href={`/contact?topic=product&item=${encodeURIComponent(product.slug)}`}
          className="flex min-h-13 w-full items-center justify-center rounded-[var(--radius-xs)] bg-ink px-6 py-4 font-medium text-paper transition-colors hover:bg-walnut"
        >
          Ask about this instrument
        </Link>
        <p className="mt-4 text-sm text-quiet-light">
          One of a kind, so we sell it face to face. Tell us you are interested and we
          will hold it while you arrange a visit.
        </p>
      </div>
    );
  }

  if (availability === 'out-of-stock') {
    return (
      <div className="border-t border-rule-light pt-6">
        <p className="font-medium">Sold out.</p>
        <p className="mt-2 text-sm text-quiet-light">
          We can often get another. Ask and we will tell you how long it would take.
        </p>
        <Link
          href={`/contact?topic=product&item=${encodeURIComponent(product.slug)}`}
          className="mt-5 inline-flex min-h-12 items-center rounded-[var(--radius-xs)] border border-rule-light px-6 font-medium transition-colors hover:border-ink"
        >
          Ask about this
        </Link>
      </div>
    );
  }

  const maxQuantity = Math.min(product.inventory, 10);

  return (
    <div className="border-t border-rule-light pt-6">
      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper
          value={quantity}
          onChange={(q) => setQuantity(Math.min(q, maxQuantity))}
          label={`Quantity of ${product.brand} ${product.name}`}
          max={maxQuantity}
        />

        <button
          type="button"
          disabled={!canAddToCart(product)}
          onClick={() =>
            add({
              productId: product.id,
              quantity,
              display: {
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                unitAmount: effectivePrice(product),
                plate: product.plate,
                image: product.images[0]?.src ?? null,
                imageAlt: product.images[0]?.alt ?? `${product.brand} ${product.name}`,
                pickupOnly: product.pickupOnly,
              },
            })
          }
          className="min-h-13 flex-1 rounded-[var(--radius-xs)] bg-ink px-8 py-4 font-medium text-paper transition-colors hover:bg-walnut disabled:opacity-50"
        >
          Add to cart
        </button>
      </div>

      <p className="mt-4 text-sm text-quiet-light">
        {product.pickupOnly
          ? 'Collection only, from the shop at 101 W. Arch St. in downtown Searcy.'
          : 'Collect in Searcy, or have it shipped. You choose at checkout.'}
      </p>
    </div>
  );
}
