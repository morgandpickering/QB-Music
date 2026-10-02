import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CTASection } from '@/components/site/CTASection';
import { StoreBrowser } from '@/components/store/StoreBrowser';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import {
  getAllProducts,
  getBrands,
  getCategories,
  getCategoryBySlug,
} from '@/lib/products/repository';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';

/** Readable URLs like /shop/electric-guitars, generated from the catalogue. */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.name,
    description: `${category.blurb} From Quattlebaum Music, downtown Searcy, Arkansas.`,
    alternates: { canonical: `/shop/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const [category, products, categories, brands] = await Promise.all([
    getCategoryBySlug(slug),
    getAllProducts(),
    getCategories(),
    getBrands(),
  ]);

  if (!category) notFound();

  const inCategory = products.filter((p) => p.category === category.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
              { name: category.name, path: `/shop/${category.slug}` },
            ]),
          ),
        }}
      />

      <header className="bg-ink pb-14 pt-16 text-paper md:pt-24">
        <div className="shell">
          <Reveal variant="fade" immediate>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-quiet-dark">
                <li>
                  <Link href="/shop" className="link-draw hover:text-paper">
                    Shop
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-brass-light">{category.name}</li>
              </ol>
            </nav>
          </Reveal>

          <RevealLines
            as="h1"
            lines={[category.name]}
            immediate
            delay={80}
            className="mt-6 max-w-[16ch] text-5xl md:text-6xl"
          />

          <Reveal variant="rise" delay={300} immediate className="mt-6">
            <p className="measure text-lg text-quiet-dark">{category.blurb}</p>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-12 text-ink md:py-16">
        <Suspense fallback={<div className="shell text-quiet-light">Loading…</div>}>
          <StoreBrowser
            products={inCategory}
            categories={categories}
            brands={[...new Set(inCategory.map((p) => p.brand))].sort()}
            lockedCategory={category.slug}
            heading={category.name}
          />
        </Suspense>

        <div className="shell mt-20 border-t border-rule-light pt-10">
          <h2 className="font-sans text-sm font-semibold">Other departments</h2>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {categories
              .filter((c) => c.slug !== category.slug)
              .map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/shop/${c.slug}`}
                    className="link-draw text-[0.9375rem] text-quiet-light hover:text-ink"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </div>

      <CTASection
        lines={['Want to try it first?']}
        lede="Call ahead and we will have it out and ready to play when you get here."
        primary={{ href: '/contact', label: 'Visit the store' }}
        secondary={{ href: '/shop', label: 'Shop everything' }}
      />
    </>
  );
}
