import type { ReactNode } from 'react';
import { Photo } from '@/components/media/Photo';
import type { ImageSlot } from '@/lib/images';
import { Reveal, RevealLines } from './Reveal';

/**
 * The hero every page except the homepage uses, so the interior of the site
 * holds together: a dark title block, then a wide photographic band that bleeds
 * to both edges. The homepage gets its own treatment — it is the one place
 * worth spending a set piece on.
 */
export function PageHero({
  kicker,
  lines,
  lede,
  image,
  actions,
  tone = 'ink',
}: {
  kicker: string;
  lines: ReactNode[];
  lede?: ReactNode;
  image?: ImageSlot;
  actions?: ReactNode;
  tone?: 'ink' | 'walnut';
}) {
  const ground = tone === 'ink' ? 'bg-ink' : 'bg-walnut';

  return (
    <header className={`${ground} text-paper`}>
      <div className="shell pt-16 pb-16 md:pt-24 md:pb-20">
        <Reveal variant="fade" immediate>
          <span className="marker text-brass-light">{kicker}</span>
        </Reveal>

        <RevealLines
          as="h1"
          lines={lines}
          immediate
          delay={80}
          className="mt-6 max-w-[18ch] text-5xl md:text-6xl"
        />

        {lede && (
          <Reveal variant="rise" delay={320} immediate className="mt-8">
            <p className="measure text-lg leading-relaxed text-quiet-dark">{lede}</p>
          </Reveal>
        )}

        {actions && (
          <Reveal variant="rise" delay={440} immediate className="mt-10">
            <div className="flex flex-wrap gap-4">{actions}</div>
          </Reveal>
        )}
      </div>

      {image && (
        <Photo
          src={image.src}
          alt={image.alt}
          plate={image.plate}
          ratio={image.ratio}
          tone="dark"
          sizes="100vw"
          priority
          className="w-full"
        />
      )}
    </header>
  );
}
