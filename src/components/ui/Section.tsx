import Link from 'next/link';
import type { ReactNode } from 'react';
import { Reveal, RevealLines } from './Reveal';

/**
 * Section scaffolding. Two grounds — paper and ink — alternating down a page
 * the way light and shadow alternate in a shop.
 */

type Ground = 'paper' | 'parchment' | 'ink' | 'walnut';

const grounds: Record<Ground, string> = {
  paper: 'bg-paper text-ink on-light',
  parchment: 'bg-parchment text-ink on-light',
  ink: 'bg-ink text-paper',
  walnut: 'bg-walnut text-paper',
};

export function Section({
  children,
  ground = 'paper',
  className = '',
  id,
  /** Vertical rhythm. `tight` for stacked sections, `loose` for set pieces. */
  pad = 'normal',
}: {
  children: ReactNode;
  ground?: Ground;
  className?: string;
  id?: string;
  pad?: 'tight' | 'normal' | 'loose';
}) {
  const padding = {
    tight: 'py-16 md:py-20',
    normal: 'py-20 md:py-28 lg:py-32',
    loose: 'py-24 md:py-36 lg:py-44',
  }[pad];

  return (
    <section id={id} className={`${grounds[ground]} ${padding} ${className}`}>
      {children}
    </section>
  );
}

/**
 * A section heading. The optional `kicker` is only ever used where it carries
 * real information — a category, a stage, a place — never as decoration above
 * every block.
 */
export function SectionHeading({
  lines,
  kicker,
  lede,
  link,
  as = 'h2',
  align = 'left',
  className = '',
  headingClassName = 'text-4xl md:text-5xl',
}: {
  lines: ReactNode[];
  kicker?: string;
  lede?: ReactNode;
  link?: { href: string; label: string };
  as?: 'h1' | 'h2' | 'h3';
  align?: 'left' | 'center';
  className?: string;
  headingClassName?: string;
}) {
  const alignment = align === 'center' ? 'text-center items-center mx-auto' : '';

  return (
    <div className={`flex flex-col ${alignment} ${className}`}>
      {kicker && (
        <Reveal variant="fade" className="mb-5">
          <span className="marker text-brass-deep">{kicker}</span>
        </Reveal>
      )}

      <RevealLines as={as} lines={lines} className={headingClassName} />

      {lede && (
        <Reveal variant="rise" delay={140} className="mt-6">
          <p className={`measure text-lg leading-relaxed opacity-80 ${align === 'center' ? 'mx-auto' : ''}`}>
            {lede}
          </p>
        </Reveal>
      )}

      {link && (
        <Reveal variant="rise" delay={220} className="mt-8">
          <Link href={link.href} className="link-draw inline-block text-base font-medium">
            {link.label}
          </Link>
        </Reveal>
      )}
    </div>
  );
}

/** Hairline divider that carries a label, used to mark a shift in subject. */
export function LabelledRule({
  label,
  tone = 'light',
  className = '',
}: {
  label: string;
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const rule = tone === 'dark' ? 'bg-rule-dark' : 'bg-rule-light';
  const text = tone === 'dark' ? 'text-brass-light' : 'text-brass-deep';
  return (
    <div className={`flex items-center gap-5 ${className}`}>
      <span className={`marker shrink-0 ${text}`}>{label}</span>
      <span className={`h-px flex-1 ${rule}`} aria-hidden="true" />
    </div>
  );
}
