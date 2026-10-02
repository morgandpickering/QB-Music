import type { Metadata } from 'next';
import { CTASection } from '@/components/site/CTASection';
import { WishlistGrid } from '@/components/store/WishlistGrid';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import { getAllProducts } from '@/lib/products/repository';

export const metadata: Metadata = {
  title: 'Your Wishlist',
  description:
    'Instruments and gear you have saved at Quattlebaum Music. Saved items stay in your browser until you clear them.',
  alternates: { canonical: '/wishlist' },
  // Nothing here is the same for two visitors, so there is nothing to index.
  robots: { index: false, follow: true },
};

export default async function WishlistPage() {
  const products = await getAllProducts();

  return (
    <>
      <header className="bg-ink pb-14 pt-16 text-paper md:pt-24">
        <div className="shell">
          <RevealLines
            as="h1"
            lines={['Your wishlist.']}
            immediate
            delay={80}
            className="max-w-[16ch] text-5xl md:text-6xl"
          />

          <Reveal variant="rise" delay={300} immediate className="mt-7">
            <p className="measure text-lg text-quiet-dark">
              Kept in this browser, on this device, until there is a proper account to
              hang it on. Bring the list in on your phone and we will get the things on
              it down off the wall for you.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-12 text-ink on-light md:py-16">
        <div className="shell">
          <WishlistGrid products={products} />
        </div>
      </div>

      <CTASection
        lines={['Want us to hold one?']}
        lede="Tell us which of these you are serious about and we will put your name on it for a few days."
        primary={{ href: '/contact?topic=product', label: 'Ask us to hold something' }}
        secondary={{ href: '/shop', label: 'Keep shopping' }}
      />
    </>
  );
}
