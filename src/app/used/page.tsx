import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CTASection } from '@/components/site/CTASection';
import { StoreBrowser } from '@/components/store/StoreBrowser';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import {
  getCategories,
  getUsedProducts,
} from '@/lib/products/repository';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Used & Vintage Gear',
  description:
    'Used instruments, vintage amplifiers, and local trade-ins from Quattlebaum Music in Searcy, Arkansas. Every piece is serviced on our own bench before it goes out.',
  alternates: { canonical: '/used' },
};

export default async function UsedPage() {
  const [products, categories] = await Promise.all([getUsedProducts(), getCategories()]);

  const brands = [...new Set(products.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
  const categoriesWithUsed = categories.filter((c) =>
    products.some((p) => p.category === c.slug),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Used Gear', path: '/used' },
            ]),
          ),
        }}
      />

      <header className="bg-walnut pb-14 pt-16 text-paper md:pt-24">
        <div className="shell">
          <RevealLines
            as="h1"
            lines={['Used & unique.']}
            immediate
            delay={80}
            className="max-w-[16ch] text-5xl md:text-6xl"
          />

          <Reveal variant="rise" delay={300} immediate className="mt-7">
            <p className="measure text-lg text-quiet-dark">
              One-of-a-kind instruments, trade-ins, and gear worth discovering. Most of
              it came over our own counter from players in town, all of it goes across
              the bench before it goes out, and when it is gone it is gone.
            </p>
          </Reveal>

          <Reveal variant="rise" delay={400} immediate className="mt-9">
            <dl className="grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 border-t border-rule-dark pt-7 sm:grid-cols-3">
              <div>
                <dt className="text-sm text-quiet-dark">Every piece</dt>
                <dd className="mt-1 font-display text-lg">Serviced in house</dd>
              </div>
              <div>
                <dt className="text-sm text-quiet-dark">Condition</dt>
                <dd className="mt-1 font-display text-lg">Described honestly</dd>
              </div>
              <div>
                <dt className="text-sm text-quiet-dark">Trade-ins</dt>
                <dd className="mt-1 font-display text-lg">
                  <Link href="/contact?topic=product" className="link-draw">
                    Bring yours in
                  </Link>
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-12 text-ink md:py-16">
        <Suspense fallback={<div className="shell text-quiet-light">Loading…</div>}>
          <StoreBrowser
            products={products}
            categories={categoriesWithUsed}
            brands={brands}
            lockedUsed
            heading="Used & vintage"
          />
        </Suspense>
      </div>

      <CTASection
        lines={['Got something to trade?']}
        lede="Bring it in and we will look at it properly. We would rather give an honest number for something we can sell than a flattering one for something we cannot."
        primary={{ href: '/contact?topic=product', label: 'Ask about a trade' }}
        secondary={{ href: '/repairs', label: 'Repair services' }}
      />
    </>
  );
}
