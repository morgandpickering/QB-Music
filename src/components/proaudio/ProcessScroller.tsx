'use client';

import { useEffect, useRef, useState } from 'react';
import { proAudioStages } from '@/config/services';

/**
 * The four stages of an installation, revealed as you scroll.
 *
 * Built on `position: sticky` plus one IntersectionObserver — no scroll
 * listener, no pinning library, nothing recalculating layout on every frame.
 * The stage list is sticky on the left; each stage's panel activates as it
 * passes the middle of the screen.
 *
 * On small screens, and under reduced motion, this degrades to a plain
 * numbered list that is entirely readable without scrolling anything into a
 * particular position. The sequence is genuinely a sequence, which is the only
 * reason the numbers are here at all.
 */
export function ProcessScroller() {
  const [active, setActive] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const nodes = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(index)) setActive(index);
        }
      },
      // A thin band across the middle of the viewport: whichever panel is
      // crossing it is the current stage.
      { rootMargin: '-48% 0px -48% 0px', threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
      {/* Sticky index. Hidden on mobile, where it would just be clutter. */}
      <div className="hidden lg:col-span-4 lg:block">
        <ol className="sticky top-32 space-y-1">
          {proAudioStages.map((stage, i) => (
            <li key={stage.title}>
              <div
                className={`flex items-baseline gap-4 border-l-2 py-3 pl-5 transition-colors duration-[var(--dur-base)] ${
                  i === active ? 'border-amber text-paper' : 'border-rule-dark text-quiet-dark'
                }`}
              >
                <span className="font-display text-sm tabular-nums opacity-70">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-3xl">{stage.title}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <ol className="lg:col-span-7 lg:col-start-6">
        {proAudioStages.map((stage, i) => (
          <li key={stage.title}>
            <div
              ref={(node) => {
                panelRefs.current[i] = node;
              }}
              data-index={i}
              className="border-t border-rule-dark py-14 first:border-t-0 first:pt-0 lg:py-24"
            >
              <div className="flex items-baseline gap-4 lg:hidden">
                <span className="font-display text-sm tabular-nums text-brass-light">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-3xl">{stage.title}</h3>
              </div>

              <p className="mt-5 font-display text-2xl text-brass-light lg:mt-0 lg:text-3xl">
                {stage.summary}
              </p>
              <p className="measure mt-5 text-lg leading-relaxed text-quiet-dark">
                {stage.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
