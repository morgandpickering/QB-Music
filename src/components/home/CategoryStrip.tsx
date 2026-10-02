import Link from 'next/link';
import { Photo } from '@/components/media/Photo';
import type { Category } from '@/lib/products/types';

/**
 * The homepage department strip.
 *
 * Replaces an earlier three-row tile grid that put a wall of imagery between
 * the hero and the first product — a shopper had to scroll past it before
 * seeing anything for sale. This is one row: a thumbnail and a name each,
 * scrolling horizontally rather than stacking, so it costs a few hundred
 * pixels of height on any screen instead of several viewports on a phone.
 */
export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <ul className="rail gap-4 [grid-auto-columns:6.5rem] sm:[grid-auto-columns:7.5rem]">
      {categories.map((category) => (
        <li key={category.slug}>
          <Link href={`/shop/${category.slug}`} className="group block focus-visible:outline-offset-4">
            <div className="relative aspect-square overflow-hidden rounded-full bg-walnut">
              <Photo
                src={category.image?.src ?? null}
                alt=""
                plate={category.plate}
                tone="dark"
                ratio="1 / 1"
                sizes="120px"
                grain={false}
                imgClassName="transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.06] motion-reduce:transform-none"
              />
            </div>
            <p className="link-draw mt-2.5 text-center text-sm font-medium leading-tight">
              {category.name}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
