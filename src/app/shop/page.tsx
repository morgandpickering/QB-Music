import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CTASection } from '@/components/site/CTASection';
import { StoreBrowser } from '@/components/store/StoreBrowser';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import { getAllProducts, getBrands, getCategories } from '@/lib/products/repository';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Shop All Instruments & Gear',
  description:
    'Guitars, basses, amplifiers, drums, keyboards, pro audio, and accessories from Quattlebaum Music in Searcy, Arkansas. Collect in store or have it shipped.',
  alternates: { canonical: '/shop' },
};

export default async function StorePage() {
  const [products, categories, brands] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getBrands(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
            ]),
          ),
        }}
      />

      <header className="bg-ink pb-14 pt-16 text-paper md:pt-24">
        <div className="shell">
          <RevealLines
            as="h1"
            lines={['Find something', 'worth playing.']}
            immediate
            delay={80}
            className="max-w-[16ch] text-5xl md:text-6xl"
          />
          <Reveal variant="rise" delay={320} immediate className="mt-8">
            <p className="measure text-lg text-quiet-dark">
              Everything we stock, in one place. If you do not see it, ask — we can
              usually get it, and we would rather you played it first.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-12 text-ink md:py-16">
        <Suspense fallback={<StoreLoading />}>
          <StoreBrowser
            products={products}
            categories={categories}
            brands={brands}
            heading="Shop"
          />
        </Suspense>
      </div>

      <CTASection
        lines={['Not sure what you need?']}
        lede="Tell us what you play, where you play it, and roughly what you want to spend. We will point you at three things instead of thirty."
        primary={{ href: '/contact?topic=product', label: 'Ask us a question' }}
        secondary={{ href: '/lessons', label: 'Start lessons' }}
      />
    </>
  );
}

function StoreLoading() {
  return (
    <div className="shell">
      <p className="text-quiet-light">Loading the shop…</p>
    </div>
  );
}
