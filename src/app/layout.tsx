import type { Metadata } from 'next';
import { Archivo, Fraunces } from 'next/font/google';
import { PlateDefs } from '@/components/media/Plate';
import { CartDrawer } from '@/components/site/CartDrawer';
import { Footer } from '@/components/site/Footer';
import { SiteHeader } from '@/components/site/SiteHeader';
import { QuickViewProvider } from '@/components/store/QuickView';
import { business } from '@/config/business';
import { CartProvider } from '@/lib/cart/CartProvider';
import { getSearchIndex } from '@/lib/products/repository';
import { WishlistProvider } from '@/lib/wishlist/WishlistProvider';
import { jsonLd, localBusinessSchema } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import './globals.css';

/**
 * Typography.
 *
 * Fraunces for display: a variable serif with SOFT and WONK axes, drawn after
 * the wood-type and catalogue faces of the early twentieth century. It has
 * genuine character where Playfair is merely elegant, which suits a shop with
 * a hand-painted sign.
 *
 * Archivo for everything else: a grotesque built for small sizes and dense
 * information, so prices, specifications, and form labels stay sharp.
 *
 * Both are self-hosted by next/font — no render-blocking request to Google, no
 * layout shift, and `display: swap` with a matched fallback.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  // Weight stays variable (required when requesting extra axes), so the whole
  // 100-900 range is available from one file.
  axes: ['SOFT', 'WONK', 'opsz'],
  style: ['normal', 'italic'],
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: ['400', '500', '600'],
  fallback: ['system-ui', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${business.name} — Instruments, Lessons & Sound in Searcy, Arkansas`,
    template: `%s — ${business.name}`,
  },
  description:
    'Quattlebaum Music sells instruments, teaches lessons, repairs what you already own, and installs sound systems, from a shop in downtown Searcy, Arkansas.',
  openGraph: {
    type: 'website',
    siteName: business.name,
    locale: 'en_US',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
};

export const viewport = {
  themeColor: '#14100e',
  // Zoom is never disabled.
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Built once on the server and handed to the header. See HeaderSearch for
  // the note on when this should become an API route instead.
  const searchIndex = await getSearchIndex();

  return (
    // suppressHydrationWarning covers the `js` class the inline script below
    // adds to <html> before React hydrates. It suppresses the warning for this
    // element's own attributes only — never for any of its children.
    <html
      lang="en"
      className={`${fraunces.variable} ${archivo.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        {/*
          Marks the document as scripted before the page paints. Every
          scroll-reveal rule is scoped to `.js`, so if this never runs — no
          JavaScript, a blocked bundle, an old browser — the content is simply
          visible instead of stuck at opacity 0.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
        <script
          type="application/ld+json"
          // Built from config/business.ts — no user input reaches this, and
          // jsonLd() escapes "<" so no value can break out of the tag.
          // Unverified fields are omitted rather than published as guesses.
          dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessSchema()) }}
        />
        {/* One shared set of SVG gradient definitions for every drawn plate. */}
        <PlateDefs />
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              <SiteHeader searchIndex={searchIndex} />
              <main id="main">{children}</main>
              <Footer />
              <CartDrawer />
            </QuickViewProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
