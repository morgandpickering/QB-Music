'use client';

import { useCart } from '@/lib/cart/CartProvider';
import { cartLineFor } from '@/lib/cart/line';
import { canAddToCart, type Product } from '@/lib/products/types';
import { useQuickView } from './QuickView';

/**
 * The shopping controls that sit over the bottom of a card's photograph.
 *
 * Hidden until hover on a pointer device and always visible on touch — the
 * rule lives in globals.css under `.card-actions`, because "reveal on hover"
 * on a phone means "never". They are also revealed by focus, so a keyboard
 * reaches them in the order they appear.
 *
 * Adding from a card is deliberately quantity-one. Anyone buying four of
 * something is on the product page or at the counter.
 *
 * The labels never wrap. Two buttons sharing an 82px half-card at 375px will
 * break "Quick view" across two lines and leave one button taller than its
 * neighbour, so the type steps down on the narrowest cards rather than the
 * row losing its alignment.
 */
export function ProductCardActions({ product }: { product: Product }) {
  const { add, openCart } = useCart();
  const { open } = useQuickView();
  const addable = canAddToCart(product);

  return (
    <div className="card-actions absolute inset-x-0 bottom-0 z-20 flex divide-x divide-rule-light border-t border-rule-light">
      <button
        type="button"
        onClick={() => open(product)}
        className="min-h-11 flex-1 whitespace-nowrap bg-paper/95 px-2 text-2xs font-medium text-ink backdrop-blur-sm transition-colors hover:bg-paper sm:px-3 sm:text-sm"
      >
        Quick view
        <span className="sr-only"> of {product.brand} {product.name}</span>
      </button>

      {product.enquiryOnly ? null : addable ? (
        <button
          type="button"
          onClick={() => {
            add(cartLineFor(product, 1));
            openCart();
          }}
          className="min-h-11 flex-1 whitespace-nowrap bg-ink/95 px-2 text-2xs font-medium text-paper backdrop-blur-sm transition-colors hover:bg-walnut sm:px-3 sm:text-sm"
        >
          Add
          <span className="sr-only"> {product.brand} {product.name} to cart</span>
        </button>
      ) : null}
    </div>
  );
}
