'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The three facts under the heritage section.
 *
 * A numeric figure counts up once, the first time it is seen, then never
 * animates again. Under reduced motion it simply appears at its final value.
 * A figure whose number has not been confirmed is passed as text instead, so
 * the section still reads properly without inventing a statistic.
 */

export interface Figure {
  /** Counted up when present. */
  value?: number;
  suffix?: string;
  /** Used instead of `value` for facts that are not numbers. */
  text?: string;
  label: string;
}

export function Figures({ items }: { items: Figure[] }) {
  return (
    <dl className="grid gap-10 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="border-t border-rule-dark pt-5">
          <dd className="font-display text-4xl leading-none md:text-5xl">
            {typeof item.value === 'number' ? (
              <CountUp to={item.value} suffix={item.suffix} />
            ) : (
              item.text
            )}
          </dd>
          <dt className="mt-3 text-sm text-quiet-dark">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(to);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || started) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(to);
      setStarted(true);
      return;
    }

    setShown(0);

    // Held out here so the effect cleanup can cancel it. A cleanup returned
    // from inside the observer callback is discarded, and the loop would keep
    // running after the component unmounted.
    let raf = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setStarted(true);

        const duration = 1100;
        const begin = performance.now();

        const tick = (now: number) => {
          const t = Math.min(1, (now - begin) / duration);
          // Ease out so it settles rather than stops dead.
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(Math.round(eased * to));
          if (t < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, started]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown}
      {suffix}
    </span>
  );
}
