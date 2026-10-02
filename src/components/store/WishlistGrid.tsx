'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import type { Product } from '@/lib/products/types';
import { useWishlist } from '@/lib/wishlist/WishlistProvider';
import { ProductCard } from './ProductCard';

/**
 * The saved list.
 *
 * The page is handed the whole catalogue and picks out what this browser has
 * saved, so a saved item always shows today's price and today's stock. The
 * alternative — storing a copy of the product when it was saved — quietly
 * shows somebody a price from six months ago, which is the worst possible
 * moment to be wrong.
 *
 * Anything saved and then withdrawn from sale simply is not here. Rather than
 * leave that silent, the page says how many are missing.
 */
export function WishlistGrid({ products }: { products: Product[] }) {
  const { ids, hydrated, clear, count } = useWishlist();

  const { saved, missing } = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const found = ids.map((id) => byId.get(id)).filter((p): p is Product => Boolean(p));
    return { saved: found, missing: ids.length - found.length };
  }, [ids, products]);

  // Before hydration the browser's storage has not been read. Showing "empty"
  // here would be a lie that corrects itself a moment later.
  if (!hydrated) {
    return (
      <p className="text-quiet-light" aria-live="polite">
        Loading your saved items…
      </p>
    );
  }

  if (count === 0) {
    return (
      <div className="border-t border-rule-light pt-10">
        <h2 className="font-display text-2xl">Nothing saved yet.</h2>
        <p className="measure mt-3 text-quiet-light">
          The heart on any product saves it here, so you can think about it, compare a
          few, or show somebody at the counter what you have been looking at. Saved
          items stay in this browser.
        </p>
        <div className="mt-7 flex flex-wrap gap-6">
          <Link href="/shop" className="link-draw font-medium">
            Start browsing the shop
          </Link>
          <Link href="/used" className="link-draw font-medium">
            Have a look at used gear
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule-light pb-5">
        <p aria-live="polite" className="text-sm text-quiet-light">
          {saved.length} {saved.length === 1 ? 'item' : 'items'} saved
          {missing > 0 && <>, and {missing} no longer listed</>}
        </p>
        <button type="button" onClick={clear} className="link-draw min-h-11 text-sm font-medium">
          Clear the list
        </button>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 2xl:grid-cols-4">
        {saved.map((product, i) => (
          <li key={product.id}>
            <ProductCard
              product={product}
              sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 27vw, 45vw"
              priority={i < 4}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
