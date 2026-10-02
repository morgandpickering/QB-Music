import type { Metadata } from 'next';
import Link from 'next/link';
import { CTASection } from '@/components/site/CTASection';
import { Reveal, RevealLines, RevealStagger } from '@/components/ui/Reveal';
import { getBrandSummaries, getCategories } from '@/lib/products/repository';
import { breadcrumbSchema, jsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Brands',
  description:
    'Brands carried at Quattlebaum Music in Searcy, Arkansas — guitars, amplifiers, drums, keyboards, band instruments and pro audio.',
  alternates: { canonical: '/brands' },
};

export default async function BrandsPage() {
  const [brands, categories] = await Promise.all([getBrandSummaries(), getCategories()]);
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  // Grouped by initial, so a long list is scannable rather than a wall.
  const groups = new Map<string, typeof brands>();
  for (const brand of brands) {
    const letter = brand.name[0].toUpperCase();
    const existing = groups.get(letter);
    if (existing) existing.push(brand);
    else groups.set(letter, [brand]);
  }
  const letters = [...groups.keys()];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Brands', path: '/brands' },
            ]),
          ),
        }}
      />

      <header className="bg-ink pb-14 pt-16 text-paper md:pt-24">
        <div className="shell">
          <RevealLines
            as="h1"
            lines={['Brands', 'we carry.']}
            immediate
            delay={80}
            className="max-w-[16ch] text-5xl md:text-6xl"
          />

          <Reveal variant="rise" delay={300} immediate className="mt-7">
            <p className="measure text-lg text-quiet-dark">
              {/*
                Carefully worded. This page lists what we stock — it does not
                claim authorised dealership for any of it, because nobody has
                confirmed those relationships. See PENDING.md before changing
                this sentence.
              */}
              Taken from stock rather than from a wall of logos. If you are after
              something we are not showing, ask — we can usually get it.
            </p>
          </Reveal>

          {letters.length > 4 && (
            <Reveal variant="rise" delay={380} immediate className="mt-9">
              <nav aria-label="Jump to a letter">
                <ul className="flex flex-wrap gap-2">
                  {letters.map((letter) => (
                    <li key={letter}>
                      <a
                        href={`#brands-${letter}`}
                        className="grid h-10 w-10 place-items-center border border-rule-dark text-sm font-medium text-paper/85 transition-colors hover:border-brass-light hover:text-brass-light"
                      >
                        {letter}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </Reveal>
          )}
        </div>
      </header>

      <div className="bg-paper py-16 text-ink on-light md:py-20">
        <div className="shell space-y-14">
          {letters.map((letter) => (
            <section key={letter} id={`brands-${letter}`} className="scroll-mt-40">
              <h2 className="font-display text-3xl text-brass-deep">{letter}</h2>

              <RevealStagger
                as="ul"
                className="mt-6 grid gap-x-6 gap-y-px border-t border-rule-light sm:grid-cols-2 lg:grid-cols-3"
              >
                {(groups.get(letter) ?? []).map((brand, i) => (
                  <li
                    key={brand.slug}
                    className="border-b border-rule-light"
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <Link
                      href={`/shop?brand=${encodeURIComponent(brand.name)}`}
                      className="group flex items-baseline justify-between gap-4 py-5"
                    >
                      <span className="min-w-0">
                        <span className="link-draw block font-display text-xl">
                          {brand.name}
                        </span>
                        <span className="mt-1 block truncate text-sm text-quiet-light">
                          {brand.categories
                            .map((slug) => categoryName.get(slug) ?? slug)
                            .join(', ')}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm tabular-nums text-quiet-light">
                        {brand.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </RevealStagger>
            </section>
          ))}
        </div>
      </div>

      <CTASection
        lines={['Not seeing the brand you want?']}
        lede="We order from far more suppliers than we can keep on the wall. Tell us the make and model and we will tell you what it costs and how long it takes."
        primary={{ href: '/contact?topic=product', label: 'Ask about a brand' }}
        secondary={{ href: '/shop', label: 'Shop everything' }}
      />
    </>
  );
}
