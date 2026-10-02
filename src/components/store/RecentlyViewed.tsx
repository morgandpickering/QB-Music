'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Photo } from '@/components/media/Photo';
import type { PlateKind } from '@/lib/products/types';

/**
 * Recently viewed.
 *
 * Kept in this browser and nowhere else — no account, no server, nothing
 * leaves the machine. It is a trail of breadcrumbs for one person comparing
 * three guitars, which is exactly what it should be and nothing more.
 *
 * It deliberately shows no price. These entries are a snapshot taken whenever
 * the product page was last opened, and a stale price shown with confidence is
 * worse than no price at all — the link is one tap from the real one.
 */

const STORAGE_KEY = 'qm.recent.v1';
const MAX = 8;

export interface RecentEntry {
  slug: string;
  name: string;
  brand: string;
  plate: PlateKind;
  image: string | null;
}

function read(): RecentEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Storage is not a trusted input: another tab, an older version of this
    // component, or somebody with the console open could have written it.
    return parsed.filter(
      (entry): entry is RecentEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentEntry).slug === 'string' &&
        typeof (entry as RecentEntry).name === 'string',
    );
  } catch {
    return [];
  }
}

export function RecentlyViewed({ current }: { current: RecentEntry }) {
  const [entries, setEntries] = useState<RecentEntry[]>([]);

  useEffect(() => {
    const previous = read();
    // Show what was seen *before* this page, then record this one.
    setEntries(previous.filter((entry) => entry.slug !== current.slug).slice(0, MAX));

    try {
      const next = [current, ...previous.filter((e) => e.slug !== current.slug)].slice(0, MAX);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private browsing or a full quota. A browsing trail is not worth an error.
    }
  }, [current]);

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed" className="shell border-t border-rule-light pt-10">
      <h2 id="recently-viewed" className="font-sans text-sm font-semibold">
        Recently viewed
      </h2>

      <ul className="rail mt-5 gap-5 [grid-auto-columns:8rem] sm:[grid-auto-columns:9rem]">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link href={`/product/${entry.slug}`} className="group block">
              <div className="overflow-hidden bg-parchment">
                <Photo
                  src={entry.image}
                  alt=""
                  plate={entry.plate}
                  tone="light"
                  ratio="1 / 1"
                  sizes="144px"
                  grain={false}
                  imgClassName="transition-transform duration-[600ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.04] motion-reduce:transform-none"
                />
              </div>
              <p className="mt-2.5 text-xs text-quiet-light">{entry.brand}</p>
              <p className="link-draw mt-0.5 inline-block text-sm leading-snug">{entry.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
