import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AddressBlock, DirectionsLink, PhoneLink } from '@/components/site/StoreFacts';
import { AddToCart } from '@/components/store/AddToCart';
import { MakeOffer } from '@/components/store/MakeOffer';
import { ProductBadges } from '@/components/store/ProductBadges';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductGallery } from '@/components/store/ProductGallery';
import { RecentlyViewed } from '@/components/store/RecentlyViewed';
import { WishlistButton } from '@/components/store/WishlistButton';
import { Reveal } from '@/components/ui/Reveal';
import { business } from '@/config/business';
import { policies } from '@/config/policies';
import {
  getAllProducts,
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
} from '@/lib/products/repository';
import {
  AVAILABILITY_LABEL,
  CONDITION_LABEL,
  availabilityOf,
  effectivePrice,
  formatPrice,
  isOnSale,
  savingOf,
} from '@/lib/products/types';
import { isOfferEligible, minimumOfferCents, offerPriceOf } from '@/lib/offers/rules';
import { breadcrumbSchema, jsonLd, productSchema } from '@/lib/seo';

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.brand} ${product.name}`;
  return {
    title,
    description: product.shortDescription,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${title} — Quattlebaum Music`,
      description: product.shortDescription,
      type: 'website',
      url: `/product/${product.slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.category),
    getRelatedProducts(product, 4),
  ]);

  const availability = availabilityOf(product);
  const fullName = `${product.brand} ${product.name}`;
  const shippingPolicy = policies.find((p) => p.slug === 'shipping');
  const returnsPolicy = policies.find((p) => p.slug === 'returns');

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(productSchema(product)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
              ...(category ? [{ name: category.name, path: `/shop/${category.slug}` }] : []),
              { name: product.name, path: `/product/${product.slug}` },
            ]),
          ),
        }}
      />

      <div className="bg-paper pt-8 text-ink on-light md:pt-12">
        <div className="shell">
          <nav aria-label="Breadcrumb" className="border-b border-rule-light pb-5">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-quiet-light">
              <li>
                <Link href="/shop" className="link-draw hover:text-ink">
                  Shop
                </Link>
              </li>
              {category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href={`/shop/${category.slug}`} className="link-draw hover:text-ink">
                      {category.name}
                    </Link>
                  </li>
                </>
              )}
              <li aria-hidden="true">/</li>
              <li className="text-ink">{product.name}</li>
            </ol>
          </nav>
        </div>

        {/* ---- Gallery and buy box ------------------------------- */}
        <div className="shell grid grid-cols-1 gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16 lg:py-14 xl:gap-20">
          <ProductGallery images={product.images} plate={product.plate} name={fullName} />

          <div>
            <ProductBadges product={product} limit={4} className="mb-4" />

            <p className="text-sm text-quiet-light">{product.brand}</p>
            <h1 className="mt-1.5 text-3xl md:text-4xl">{product.name}</h1>

            <p className="measure mt-4 leading-relaxed text-quiet-light">
              {product.shortDescription}
            </p>

            <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-3xl tabular-nums">
                {formatPrice(effectivePrice(product))}
              </span>
              {isOnSale(product) && (
                <>
                  <span className="text-lg tabular-nums text-quiet-light line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="marker text-burgundy">
                    Reduced by {formatPrice(savingOf(product))}
                  </span>
                </>
              )}
            </p>

            {/* Status facts as a definition list: never colour alone. */}
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-rule-light py-4 text-[0.9375rem] sm:grid-cols-4 lg:grid-cols-2">
              <div>
                <dt className="text-xs text-quiet-light">Stock number</dt>
                <dd className="mt-0.5 tabular-nums">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-xs text-quiet-light">Condition</dt>
                <dd className="mt-0.5">{CONDITION_LABEL[product.condition]}</dd>
              </div>
              <div>
                <dt className="text-xs text-quiet-light">Availability</dt>
                <dd className="mt-0.5">{AVAILABILITY_LABEL[availability]}</dd>
              </div>
              <div>
                <dt className="text-xs text-quiet-light">Fulfilment</dt>
                <dd className="mt-0.5">
                  {product.pickupOnly ? 'Collection only' : 'Collection or delivery'}
                </dd>
              </div>
            </dl>

            {/*
              No star rating and no review count. The shop has no review system,
              and a row of empty stars is either an invitation to wonder what
              went wrong or, filled in, a lie. Add real reviews and this is
              where they go.
            */}

            <div className="mt-7">
              <AddToCart product={product} />
            </div>

            {isOfferEligible(product) && (
              <div className="mt-4">
                <MakeOffer
                  slug={product.slug}
                  name={fullName}
                  listedCents={offerPriceOf(product)}
                  minimumCents={minimumOfferCents(offerPriceOf(product))}
                  shippingAllowed={product.shippingAvailable && !product.pickupOnly}
                />
              </div>
            )}

            <div className="mt-4">
              <WishlistButton
                productId={product.id}
                productName={fullName}
                variant="full"
                className="w-full"
              />
            </div>

            {/* ---- Reassurance, next to the money ----------------- */}
            <ul className="mt-8 space-y-4 border-t border-rule-light pt-6 text-[0.9375rem]">
              <li className="flex gap-3">
                <Tick />
                <span>
                  <strong className="font-medium">Free local pickup.</strong>{' '}
                  <span className="text-quiet-light">
                    Collect at the counter on W. Arch St., usually the same day, set up
                    and tuned before you take it away.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <Tick />
                <span>
                  <strong className="font-medium">Questions? Call the shop.</strong>{' '}
                  <span className="text-quiet-light">
                    You will get somebody who can walk over and look at this one.
                  </span>{' '}
                  <PhoneLink className="font-medium" />
                </span>
              </li>
              <li className="flex gap-3">
                <Tick />
                <span>
                  <strong className="font-medium">Expert help choosing.</strong>{' '}
                  <span className="text-quiet-light">
                    Tell us what you play and where, and we will tell you honestly
                    whether this is the right one.
                  </span>{' '}
                  <Link
                    href={`/contact?topic=product&item=${encodeURIComponent(product.slug)}`}
                    className="link-draw font-medium"
                  >
                    Ask about this
                  </Link>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ---- The detail below the fold ------------------------- */}
        <div className="shell grid gap-12 border-t border-rule-light py-14 lg:grid-cols-12 lg:gap-16">
          <section className="lg:col-span-7">
            <h2 className="font-display text-2xl">Overview</h2>
            <p className="measure mt-4 leading-relaxed text-quiet-light">{product.description}</p>

            {product.specifications.length > 0 && (
              <>
                <h2 className="mt-12 font-display text-2xl">Specifications</h2>
                <dl className="mt-4 divide-y divide-rule-light border-y border-rule-light">
                  {product.specifications.map((spec) => (
                    <div
                      key={spec.label}
                      className="grid grid-cols-[8rem_1fr] gap-4 py-3 sm:grid-cols-[11rem_1fr]"
                    >
                      <dt className="text-sm text-quiet-light">{spec.label}</dt>
                      <dd className="text-[0.9375rem]">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-sm text-quiet-light">
                  Specifications come from the maker. If one of them matters to your
                  decision, ask us to check the actual instrument before you buy.
                </p>
              </>
            )}
          </section>

          <div className="space-y-10 lg:col-span-4 lg:col-start-9">
            <section className="bg-parchment p-6">
              <h2 className="font-display text-xl">Shipping &amp; pickup</h2>
              <AddressBlock className="mt-4 text-[0.9375rem]" />
              <DirectionsLink className="mt-3 inline-block text-[0.9375rem]" />

              <p className="mt-5 border-t border-rule-light pt-4 text-[0.9375rem] leading-relaxed text-quiet-light">
                {product.pickupOnly
                  ? 'Collection only. This one is either too large, too heavy, or too irreplaceable to put on a truck, and we would rather hand it to you.'
                  : 'Shipping is available on this item. The cost is worked out at checkout.'}
              </p>

              {shippingPolicy && (
                <Link
                  href={`/policies/${shippingPolicy.slug}`}
                  className="link-draw mt-3 inline-block text-[0.9375rem] font-medium"
                >
                  Shipping details
                </Link>
              )}
            </section>

            <section className="border border-rule-light p-6">
              <h2 className="font-display text-xl">Returns</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-quiet-light">
                {/*
                  No invented window, no invented restocking fee. See
                  config/policies.ts — a returns promise is a commitment the
                  shop makes, not one a website makes on its behalf.
                */}
                Our written returns policy is not published yet. Until it is, call{' '}
                {business.name} before you send anything back and we will tell you
                exactly where you stand.
              </p>
              <div className="mt-4 flex flex-col items-start gap-2">
                <PhoneLink className="font-medium" />
                {returnsPolicy && (
                  <Link
                    href={`/policies/${returnsPolicy.slug}`}
                    className="link-draw text-[0.9375rem] font-medium"
                  >
                    Returns page
                  </Link>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-parchment py-16 text-ink on-light md:py-20">
          <div className="shell">
            <Reveal variant="rise">
              <h2 className="font-display text-3xl">You might also look at</h2>
            </Reveal>
            <ul className="mt-9 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {related.map((item) => (
                <li key={item.id}>
                  <ProductCard
                    product={item}
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="bg-paper py-12 text-ink on-light">
        <RecentlyViewed
          current={{
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            plate: product.plate,
            image: product.images[0]?.src ?? null,
          }}
        />
      </div>
    </>
  );
}

function Tick() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-teal"
    >
      <path
        d="m3.5 9.5 3.2 3.2L14.5 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
