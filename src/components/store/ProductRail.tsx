'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Product } from '@/lib/products/types';
import { ProductCard } from './ProductCard';

/**
 * A shelf of products you can push along.
 *
 * It is a native scroll container with snap points, not a carousel library.
 * That means it already works with a trackpad, a thumb, a scrollbar, arrow
 * keys, and Tab — four behaviours a JavaScript carousel has to reimplement
 * and usually gets wrong. The buttons are a convenience on top, and they
 * disable themselves at each end rather than wrapping around, because a shelf
 * that silently teleports back to the start loses the reader's place.
 *
 * There is no auto-advance. A shelf that moves on its own while somebody is
 * reading a price is an animation that costs a sale.
 */
export function ProductRail({
  products,
  ground = 'light',
  label,
}: {
  products: Product[];
  ground?: 'light' | 'dark';
  /** Names the region for a screen reader, e.g. "New arrivals". */
  label: string;
}) {
  const rail = useRef<HTMLUListElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const node = rail.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth;
    setAtStart(node.scrollLeft <= 4);
    // 4px of slack: sub-pixel widths mean scrollLeft rarely lands exactly.
    setAtEnd(node.scrollLeft >= max - 4);
  }, []);

  useEffect(() => {
    measure();
    const node = rail.current;
    if (!node) return;
    node.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      node.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const nudge = (direction: 1 | -1) => {
    const node = rail.current;
    if (!node) return;
    // One card plus its gap, whatever that works out to at this width.
    const step = node.firstElementChild?.clientWidth ?? node.clientWidth / 2;
    node.scrollBy({ left: direction * (step + 24), behavior: 'smooth' });
  };

  const buttonTone =
    ground === 'dark'
      ? 'border-rule-dark text-paper hover:border-brass-light hover:text-brass-light'
      : 'border-rule-light text-ink hover:border-brass-deep hover:text-brass-deep';

  return (
    <div>
      <ul
        ref={rail}
        // A scroll container is focusable so a keyboard can scroll it; without
        // a name a screen reader announces an unlabelled scrollable region.
        tabIndex={0}
        role="list"
        aria-label={label}
        className="rail -mx-[var(--rail-bleed,0px)] gap-6 px-[var(--rail-bleed,0px)] py-1 [grid-auto-columns:78%] sm:[grid-auto-columns:44%] lg:[grid-auto-columns:30%] xl:[grid-auto-columns:23%]"
      >
        {products.map((product, i) => (
          <li key={product.id} className="min-w-0">
            <ProductCard
              product={product}
              ground={ground}
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
              priority={i < 2}
            />
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => nudge(-1)}
          disabled={atStart}
          className={`grid h-11 w-11 place-items-center rounded-[var(--radius-xs)] border transition-colors disabled:opacity-35 ${buttonTone}`}
        >
          <Arrow direction="left" />
          <span className="sr-only">Scroll {label} back</span>
        </button>
        <button
          type="button"
          onClick={() => nudge(1)}
          disabled={atEnd}
          className={`grid h-11 w-11 place-items-center rounded-[var(--radius-xs)] border transition-colors disabled:opacity-35 ${buttonTone}`}
        >
          <Arrow direction="right" />
          <span className="sr-only">Scroll {label} forward</span>
        </button>
      </div>
    </div>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M11 3 5 9l6 6' : 'M7 3l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
