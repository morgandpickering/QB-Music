'use client';

import { useWishlist } from '@/lib/wishlist/WishlistProvider';

/**
 * Save for later.
 *
 * A real toggle button carrying `aria-pressed`, not a heart that changes
 * colour and leaves a screen reader to guess. The label names the product,
 * because on a grid of twenty cards "Save" on its own tells you nothing about
 * which one you just saved.
 *
 * Before hydration it renders in the unsaved state and does nothing. That is
 * correct rather than unfortunate: the server cannot know what is in this
 * browser's storage, and rendering a guess would flip under the reader.
 */
export function WishlistButton({
  productId,
  productName,
  variant = 'icon',
  ground = 'light',
  className = '',
}: {
  productId: string;
  productName: string;
  /** `icon` for the corner of a card, `full` for a product page row. */
  variant?: 'icon' | 'full';
  ground?: 'light' | 'dark';
  className?: string;
}) {
  const { has, toggle, hydrated } = useWishlist();
  const saved = hydrated && has(productId);

  const label = saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`;

  if (variant === 'full') {
    const base =
      ground === 'dark'
        ? 'border-rule-dark text-paper hover:border-brass-light'
        : 'border-rule-light text-ink hover:border-brass-deep';
    return (
      <button
        type="button"
        onClick={() => toggle(productId)}
        aria-pressed={saved}
        className={`inline-flex min-h-12 items-center justify-center gap-2.5 rounded-[var(--radius-xs)] border px-6 font-medium transition-colors ${base} ${className}`}
      >
        <Heart filled={saved} />
        <span>{saved ? 'Saved to wishlist' : 'Add to wishlist'}</span>
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={saved}
      title={saved ? 'Saved to wishlist' : 'Save to wishlist'}
      className={`grid h-11 w-11 place-items-center rounded-[var(--radius-xs)] border transition-colors ${
        saved
          ? 'border-burgundy bg-burgundy text-paper'
          : 'border-rule-light bg-paper/92 text-ink hover:border-ink'
      } ${className}`}
    >
      <Heart filled={saved} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 16.5S3 12.4 3 7.9A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7 2.3c0 4.5-7 8.6-7 8.6Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
