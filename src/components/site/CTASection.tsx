import { Button } from '@/components/ui/Button';
import { HeroStrings } from '@/components/home/HeroStrings';
import { RevealLines, Reveal } from '@/components/ui/Reveal';

/**
 * The closing call on every page. Same shape everywhere, different words, with
 * the string field from the hero brought back at a whisper so the page ends on
 * the note it opened with.
 */
export function CTASection({
  lines,
  lede,
  primary,
  secondary,
}: {
  lines: React.ReactNode[];
  lede?: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ink text-paper">
      <div className="absolute inset-0 opacity-25">
        <HeroStrings />
      </div>

      <div className="shell relative py-24 text-center md:py-32">
        <RevealLines
          as="h2"
          lines={lines}
          className="mx-auto max-w-[20ch] text-4xl md:text-5xl"
        />

        {lede && (
          <Reveal variant="rise" delay={140} className="mt-6">
            <p className="measure mx-auto text-lg text-quiet-dark">{lede}</p>
          </Reveal>
        )}

        <Reveal variant="rise" delay={220} className="mt-10">
          <div className="flex flex-wrap justify-center gap-4">
            <Button href={primary.href} ground="dark" variant="solid" size="lg">
              {primary.label}
            </Button>
            {secondary && (
              <Button href={secondary.href} ground="dark" variant="outline" size="lg">
                {secondary.label}
              </Button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
