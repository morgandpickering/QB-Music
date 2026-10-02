import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * The strip directly under the hero: six reasons to buy here rather than from
 * a warehouse in another state.
 *
 * Every one of them is a link to the page that proves it. A benefit strip of
 * inert icons is decoration; this one is navigation that happens to reassure.
 *
 * The icons are drawn here rather than pulled from a library — six line
 * glyphs at 20px do not justify a dependency, and these match the weight of
 * the drawn plates elsewhere on the site.
 */

interface Benefit {
  label: string;
  note: string;
  href: string;
  icon: ReactNode;
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const BENEFITS: Benefit[] = [
  {
    label: 'Locally owned',
    note: 'Same counter, same people',
    href: '/about',
    icon: (
      <>
        <path d="M3 9.5 11 3l8 6.5V19H3V9.5Z" {...stroke} />
        <path d="M8.5 19v-5.5h5V19" {...stroke} />
      </>
    ),
  },
  {
    label: 'Expert advice',
    note: 'We play what we sell',
    href: '/contact',
    icon: (
      <>
        <path d="M3.5 15.5V9a7.5 7.5 0 0 1 15 0v6.5" {...stroke} />
        <path d="M3.5 12.5h2.2a1 1 0 0 1 1 1v3.2a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-4.2ZM18.5 12.5h-2.2a1 1 0 0 0-1 1v3.2a1 1 0 0 0 1 1h1.2a1 1 0 0 0 1-1v-4.2Z" {...stroke} />
      </>
    ),
  },
  {
    label: 'Instrument repairs',
    note: 'Setups, fretwork, electronics',
    href: '/repairs',
    icon: (
      <>
        <path d="m4 18 7.2-7.2" {...stroke} />
        <path d="M13.2 4.4a3.8 3.8 0 0 0 5 5L14 5.2l-.8-.8Z" {...stroke} />
        <path d="m11.2 10.8 6.6 6.6" {...stroke} />
      </>
    ),
  },
  {
    label: 'Music lessons',
    note: 'One-to-one, all ages',
    href: '/lessons',
    icon: (
      <>
        <path d="M8 16.5V5.5l9-1.5v11" {...stroke} />
        <circle cx="5.75" cy="16.5" r="2.25" {...stroke} />
        <circle cx="14.75" cy="15" r="2.25" {...stroke} />
      </>
    ),
  },
  {
    label: 'Free local pickup',
    note: 'Order online, collect in Searcy',
    href: '/policies/shipping',
    icon: (
      <>
        <path d="M3 7h10v9H3zM13 10h3.6l2.4 2.6V16h-6" {...stroke} />
        <circle cx="7" cy="17.5" r="1.6" {...stroke} />
        <circle cx="15.5" cy="17.5" r="1.6" {...stroke} />
      </>
    ),
  },
  {
    label: 'Professional audio',
    note: 'Design, install, and training',
    href: '/pro-audio',
    icon: (
      <>
        <rect x="5.5" y="3" width="11" height="16" rx="1.5" {...stroke} />
        <circle cx="11" cy="13" r="3" {...stroke} />
        <circle cx="11" cy="6.75" r="1.35" {...stroke} />
      </>
    ),
  },
];

export function BenefitStrip() {
  return (
    <section aria-label="Why buy from Quattlebaum" className="border-y border-rule-light bg-parchment on-light">
      <ul className="shell grid grid-cols-2 gap-x-6 gap-y-7 py-9 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-8">
        {BENEFITS.map((benefit) => (
          <li key={benefit.label}>
            <Link
              href={benefit.href}
              className="group flex items-start gap-3 py-1 lg:flex-col lg:gap-2.5"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-brass-deep transition-colors group-hover:text-ink"
              >
                <svg width="22" height="22" viewBox="0 0 22 22">
                  {benefit.icon}
                </svg>
              </span>
              <span className="min-w-0">
                <span className="link-draw block text-sm font-semibold leading-snug">
                  {benefit.label}
                </span>
                <span className="mt-1 block text-xs leading-snug text-quiet-light">
                  {benefit.note}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
