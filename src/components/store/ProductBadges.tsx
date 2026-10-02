import { badgesFor, type Badge, type BadgeTone, type Product } from '@/lib/products/types';

/**
 * Product badges.
 *
 * Every badge is a solid fill rather than a tint or an outline, so the same
 * component is legible sitting on a photograph, on parchment, or on walnut
 * without needing to know which. Every pairing below clears AA, and every
 * badge says a word — none of them mean anything by colour alone.
 *
 * `limit` is the caller's decision. Cards take two; the product page takes
 * the lot. A card wearing five badges is a card nobody reads.
 */

const tones: Record<BadgeTone, string> = {
  sale: 'bg-burgundy text-paper',
  vintage: 'bg-oak text-paper',
  used: 'bg-walnut text-paper',
  new: 'bg-amber text-ink',
  scarce: 'bg-ink text-paper',
  pick: 'bg-brass-deep text-paper',
  trade: 'bg-teal text-paper',
};

export function ProductBadge({ badge }: { badge: Badge }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap px-2 py-1 text-2xs font-semibold uppercase leading-none tracking-[0.07em] ${tones[badge.tone]}`}
    >
      {badge.label}
    </span>
  );
}

export function ProductBadges({
  product,
  limit = 2,
  className = '',
}: {
  product: Product;
  limit?: number;
  className?: string;
}) {
  const badges = badgesFor(product, limit);
  if (badges.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => (
        <li key={badge.label}>
          <ProductBadge badge={badge} />
        </li>
      ))}
    </ul>
  );
}
