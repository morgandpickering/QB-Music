import Link from 'next/link';
import { Photo } from '@/components/media/Photo';
import {
  AVAILABILITY_LABEL,
  CONDITION_LABEL,
  availabilityOf,
  effectivePrice,
  formatPrice,
  hoverImage,
  isOnSale,
  type Product,
} from '@/lib/products/types';
import { ProductBadges } from './ProductBadges';
import { ProductCardActions } from './ProductCardActions';
import { WishlistButton } from './WishlistButton';

/**
 * A product card.
 *
 * The photograph does the work; the type underneath answers the three
 * questions a shopper actually has — what is it, what does it cost, can I
 * have it — and the controls stay out of the way until wanted.
 *
 * The whole card is one link, thrown by the title's `::after`, so buttons can
 * sit on top of it without nesting interactive elements inside an anchor.
 * That is the only reliable way to have a clickable card *and* a working
 * wishlist button in the corner of it.
 *
 * Availability is never signalled by colour alone; the word is always there.
 */
export function ProductCard({
  product,
  ground = 'light',
  sizes = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw',
  priority = false,
  /** Off for dense grids where a row of hovering buttons would be noise. */
  actions = true,
}: {
  product: Product;
  ground?: 'light' | 'dark';
  sizes?: string;
  priority?: boolean;
  actions?: boolean;
}) {
  const availability = availabilityOf(product);
  const soldOut = availability === 'out-of-stock';
  const quiet = ground === 'dark' ? 'text-quiet-dark' : 'text-quiet-light';
  const accent = ground === 'dark' ? 'text-brass-light' : 'text-brass-deep';
  const second = hoverImage(product);

  return (
    <article className="group relative flex h-full flex-col">
      <div
        className={`relative overflow-hidden ${ground === 'dark' ? 'bg-walnut' : 'bg-parchment'}`}
      >
        <Photo
          src={product.images[0]?.src ?? null}
          alt={product.images[0]?.alt ?? `${product.brand} ${product.name}`}
          plate={product.plate}
          tone={ground}
          ratio="4 / 5"
          sizes={sizes}
          priority={priority}
          fit="contain"
          grain={false}
          imgClassName={`transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.035] motion-reduce:transform-none ${
            second ? 'group-hover:opacity-0' : ''
          }`}
        />

        {/* The second photograph, if the shop has taken one. Decorative: the
            first image already carries the description. */}
        {second && (
          <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-[600ms] ease-[var(--ease-out-soft)] group-hover:opacity-100">
            <Photo
              src={second.src}
              alt=""
              plate={product.plate}
              tone={ground}
              sizes={sizes}
              fit="contain"
              grain={false}
              fill
            />
          </div>
        )}

        <ProductBadges
          product={product}
          limit={2}
          className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-4.5rem)]"
        />

        <div className="absolute right-3 top-3 z-20">
          <WishlistButton
            productId={product.id}
            productName={`${product.brand} ${product.name}`}
          />
        </div>

        {soldOut ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-ink/55">
            <span className="marker bg-paper px-4 py-1.5 text-ink">Sold</span>
          </div>
        ) : (
          actions && <ProductCardActions product={product} />
        )}
      </div>

      <div className="flex grow flex-col pt-4">
        <p className={`text-xs tracking-[0.04em] ${quiet}`}>{product.brand}</p>

        <h3 className="mt-1.5 font-display text-xl leading-tight">
          <Link
            href={`/product/${product.slug}`}
            className="after:absolute after:inset-0 after:z-0 focus-visible:outline-offset-4"
          >
            {product.name}
          </Link>
        </h3>

        <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5 tabular-nums">
          <span className={isOnSale(product) ? accent : undefined}>
            {formatPrice(effectivePrice(product))}
          </span>
          {isOnSale(product) && (
            <>
              <span className={`text-sm line-through ${quiet}`}>
                {formatPrice(product.price)}
              </span>
              <span className="sr-only">reduced from {formatPrice(product.price)}</span>
            </>
          )}
        </p>

        {/* Three facts, set apart by space rather than strung together with
            middle dots. They are separate answers, not one sentence. */}
        <p className={`mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-sm ${quiet}`}>
          <span>{CONDITION_LABEL[product.condition]}</span>
          <span className={availability === 'limited' ? accent : undefined}>
            {AVAILABILITY_LABEL[availability]}
          </span>
          {product.pickupOnly && <span>Collection only</span>}
        </p>
      </div>
    </article>
  );
}
