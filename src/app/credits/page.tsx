import type { Metadata } from 'next';
import Link from 'next/link';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import creditsData from '../../../public/photos/demo/CREDITS.json';

export const metadata: Metadata = {
  title: 'Photo credits',
  description:
    'Attribution for the freely licensed demo photography standing in on this site until real photography of the shop exists.',
  alternates: { canonical: '/credits' },
  robots: { index: false, follow: true },
};

/**
 * Attribution for `public/photos/demo/`.
 *
 * These images are stand-ins for real photography — see the demo notice
 * shown wherever one appears — pulled from Wikimedia Commons by
 * `scripts/fetch-demo-photos.mjs`, permissively licensed only. CC BY and
 * CC BY-SA require attribution as a condition of the licence, not as a
 * courtesy, so this page exists for as long as any of these files do.
 */
export default function CreditsPage() {
  const credits = [...creditsData.credits].sort((a, b) => a.slug.localeCompare(b.slug));

  return (
    <>
      <header className="bg-ink pb-12 pt-16 text-paper md:pt-24">
        <div className="shell">
          <Reveal variant="fade" immediate>
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-quiet-dark">
                <li>
                  <Link href="/" className="link-draw hover:text-paper">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-brass-light">Photo credits</li>
              </ol>
            </nav>
          </Reveal>

          <RevealLines
            as="h1"
            lines={['Photo credits.']}
            immediate
            delay={80}
            className="mt-5 text-4xl md:text-5xl"
          />

          <Reveal variant="rise" delay={220} immediate className="mt-6">
            <p className="measure text-lg leading-relaxed text-quiet-dark">
              Real photography of the shop, staff, and installation work does not exist
              yet, so image slots that would otherwise stay a drawn plate use freely
              licensed stand-in photographs instead — pictures of the kind of instrument
              a listing describes, not of Quattlebaum&rsquo;s own stock. Every one is
              credited here, as its licence requires.
            </p>
          </Reveal>
        </div>
      </header>

      <div className="bg-paper py-16 text-ink on-light md:py-20">
        <div className="shell">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-[0.9375rem]">
              <thead>
                <tr className="border-b border-rule-light text-sm text-quiet-light">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Used for
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Title
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Author
                  </th>
                  <th scope="col" className="py-3 font-semibold">
                    Licence
                  </th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.file} className="border-b border-rule-light">
                    <td className="py-3 pr-4 font-medium">{credit.slug}</td>
                    <td className="py-3 pr-4 text-quiet-light">
                      <a href={credit.source} className="link-draw" target="_blank" rel="noreferrer">
                        {credit.title}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-quiet-light">{credit.author}</td>
                    <td className="py-3 text-quiet-light">{credit.licence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="measure mt-10 text-sm text-quiet-light">
            All sourced from{' '}
            <a
              href="https://commons.wikimedia.org/"
              className="link-draw"
              target="_blank"
              rel="noreferrer"
            >
              Wikimedia Commons
            </a>
            , filtered to public domain, CC0, CC BY, and CC BY-SA licences only. If any of
            these are replaced with Quattlebaum&rsquo;s own photography, this page and{' '}
            <code className="text-[0.875em]">scripts/fetch-demo-photos.mjs</code> should be
            deleted together.
          </p>
        </div>
      </div>
    </>
  );
}
