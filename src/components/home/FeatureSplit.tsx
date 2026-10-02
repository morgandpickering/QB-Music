import { Photo } from '@/components/media/Photo';
import { Button } from '@/components/ui/Button';
import { Reveal, RevealLines } from '@/components/ui/Reveal';
import type { ImageSlot } from '@/lib/images';

/**
 * The shape the three service previews share: one photograph, one headline,
 * a short paragraph, one way in. They alternate sides down the page so the
 * homepage does not read as a stack of identical blocks.
 */
export function FeatureSplit({
  kicker,
  lines,
  body,
  image,
  cta,
  flip = false,
  ground = 'light',
  notes,
}: {
  kicker: string;
  lines: React.ReactNode[];
  body: string;
  image: ImageSlot;
  cta: { href: string; label: string };
  flip?: boolean;
  ground?: 'light' | 'dark';
  /** Short supporting points. Set as a list because they are a list. */
  notes?: string[];
}) {
  const quiet = ground === 'dark' ? 'text-quiet-dark' : 'text-quiet-light';
  const accent = ground === 'dark' ? 'text-brass-light' : 'text-brass-deep';
  const rule = ground === 'dark' ? 'border-rule-dark' : 'border-rule-light';

  return (
    <div className="shell grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
      <div className={`lg:col-span-7 ${flip ? 'lg:order-2' : ''}`}>
        <Photo
          src={image.src}
          alt={image.alt}
          plate={image.plate}
          ratio={image.ratio}
          tone={ground}
          sizes="(min-width: 1024px) 58vw, 100vw"
        />
      </div>

      <div className={`lg:col-span-5 ${flip ? 'lg:order-1' : ''}`}>
        <Reveal variant="fade">
          <span className={`marker ${accent}`}>{kicker}</span>
        </Reveal>

        <RevealLines as="h2" lines={lines} className="mt-5 text-4xl md:text-5xl" />

        <Reveal variant="rise" delay={140} className="mt-6">
          <p className={`measure text-lg leading-relaxed ${quiet}`}>{body}</p>
        </Reveal>

        {notes && (
          <Reveal variant="rise" delay={200} className="mt-8">
            <ul className={`divide-y border-y ${rule} ${quiet}`} style={{ borderColor: 'inherit' }}>
              {notes.map((note) => (
                <li key={note} className={`border-t py-3 text-[0.9375rem] first:border-t-0 ${rule}`}>
                  {note}
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        <Reveal variant="rise" delay={260} className="mt-9">
          <Button href={cta.href} ground={ground} variant="outline">
            {cta.label}
          </Button>
        </Reveal>
      </div>
    </div>
  );
}
