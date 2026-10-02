'use client';

import { useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * The site's single entrance device.
 *
 * One IntersectionObserver flips `data-revealed` on; all the animation lives in
 * CSS (globals.css), so there is no animation library and nothing runs on the
 * main thread after the element has arrived. Reduced motion is handled in CSS
 * too — the content still appears, it just does not travel.
 */

/** One observer for the whole document rather than one per element. */
let observer: IntersectionObserver | null = null;
const seen = new WeakSet<Element>();

function getObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target)) continue;
        seen.add(entry.target);
        entry.target.setAttribute('data-revealed', 'true');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );
  return observer;
}

export function useReveal<T extends HTMLElement>(skip = false) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || skip) return;

    const io = getObserver();
    if (!io) {
      // No IntersectionObserver: show everything rather than hide it.
      node.setAttribute('data-revealed', 'true');
      return;
    }
    io.observe(node);
    return () => io.unobserve(node);
  }, [skip]);

  return ref;
}

type RevealVariant = 'lines' | 'rise' | 'fade';

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** Milliseconds of delay before this block starts. */
  delay?: number;
  /**
   * Above the fold. Animates on page load with CSS alone instead of waiting
   * for an observer, so the content is painted even if JavaScript never runs.
   */
  immediate?: boolean;
  as?: ElementType;
  className?: string;
}

export function Reveal({
  children,
  variant = 'rise',
  delay = 0,
  immediate = false,
  as: Tag = 'div',
  className = '',
}: RevealProps) {
  const ref = useReveal<HTMLElement>(immediate);

  if (immediate) {
    return (
      <Tag
        data-reveal-load={variant}
        style={delay ? { animationDelay: `${delay}ms` } : undefined}
        className={className}
      >
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      data-reveal={variant}
      style={delay ? ({ '--reveal-delay': `${delay}ms` } as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Masked headline reveal: each line sits in its own clipping box and rises into
 * it, so the type appears to be pushed up from behind the page rather than
 * faded in. Pass the headline already broken into the lines you want.
 */
export function RevealLines({
  lines,
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 90,
  immediate = false,
}: {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Above the fold: animate on load with CSS, never wait for hydration. */
  immediate?: boolean;
}) {
  const ref = useReveal<HTMLElement>(immediate);

  return (
    <Tag
      ref={immediate ? undefined : ref}
      data-reveal={immediate ? undefined : 'lines'}
      data-reveal-load={immediate ? 'lines' : undefined}
      className={className}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em]">
          <span
            className="block"
            style={
              immediate
                ? { animationDelay: `${delay + i * stagger}ms` }
                : ({ transitionDelay: `${delay + i * stagger}ms` } as React.CSSProperties)
            }
          >
            {line}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Staggered container: direct children fade up one after another. */
export function RevealStagger({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag ref={ref} data-stagger className={className}>
      {children}
    </Tag>
  );
}
