import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CTASection } from '@/components/site/CTASection';
import { StoreBrowser } from '@/components/store/StoreBrowser';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import { getAllProducts, getBrands, getCategories } from '@/lib/products/repository';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search the Quattlebaum Music catalogue by brand, model, category or stock number.',
  alternates: { canonical: '/search' },
  // A results page per query is not something anybody should land on from a
  // search engine, and indexing them is how a site ends up with ten thousand
  // near-identical pages.
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, products, categories, brands] = await Promise.all([
    searchParams,
    getAllProducts(),
    getCategories(),
    getBrands(),
  ]);

  const term = (q ?? '').trim();

  return (
    <>
      <header className="bg-ink pb-14 pt-16 text-paper md:pt-24">
        <div className="shell">
          <RevealLines
            as="h1"
            lines={term ? [`Results for`, `“${term}”`] : ['Search the shop.']}
            immediate
            delay={80}
            className="max-w-[18ch] text-4xl md:text-5xl"
          />

          <Reveal variant="rise" delay={300} immediate className="mt-7">
            <p className="measure text-lg text-quiet-dark">
              Search by brand, model, category, or the stock number off the tag. Refine
              what comes back with the filters below.
            </p>
          </Reveal>

          <Reveal variant="rise" delay={380} immediate className="mt-7">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-quiet-dark">
              <li>
                <Link href="/shop" className="link-draw hover:text-paper">
                  Browse everything instead
                </Link>
              </li>
              <li>
                <Link href="/brands" className="link-draw hover:text-paper">
                  Browse by brand
                </Link>
              </li>
              <li>
                <Link href="/used" className="link-draw hover:text-paper">
                  Used &amp; vintage
                </Link>
              </li>
            </ul>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-12 text-ink md:py-16">
        <Suspense fallback={<div className="shell text-quiet-light">Searching…</div>}>
          <StoreBrowser
            products={products}
            categories={categories}
            brands={brands}
            heading="Results"
          />
        </Suspense>
      </div>

      <CTASection
        lines={['Still not finding it?']}
        lede="We stock far more than we list online, and we can order most of what we do not. Tell us the make and model."
        primary={{ href: '/contact?topic=product', label: 'Ask us to find it' }}
        secondary={{ href: '/shop', label: 'Shop everything' }}
      />
    </>
  );
}
