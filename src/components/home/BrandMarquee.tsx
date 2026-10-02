import { Marquee } from '@/components/ui/marquee';
import type { BrandSummary } from '@/lib/products/repository';

/**
 * The brand strip.
 *
 * Built on Magic UI's `Marquee` (installed from the registry into
 * `components/ui/marquee.tsx`), restyled to the house palette. Two decisions
 * on top of it are worth knowing about, because both cut against how a
 * marquee usually ships:
 *
 * **It is decorative, and says so.** `Marquee` renders its children four
 * times over to make the loop seamless, which would put every brand into the
 * accessibility tree four times — and a list of links repeated four times is
 * worse than no list. So the strip carries `aria-hidden`, its items are spans
 * rather than links, and the real way in is the A-to-Z index at /brands,
 * linked directly beneath it. Nothing here is reachable only by chasing a
 * moving target.
 *
 * **It stops.** It pauses on hover so a name can actually be read, and
 * `prefers-reduced-motion` stops it outright (see globals.css) — the strip
 * then sits still and scrolls by hand like any other overflow row.
 *
 * The stock count is deliberately absent here and present on /brands: a
 * number you cannot dwell on is not information, it is a speck.
 *
 * Names are set in the display face rather than reproduced as logos: a
 * manufacturer's mark is their property, and a row of them on a shop's
 * homepage reads as a claim of authorised dealership nobody has confirmed.
 */
export function BrandMarquee({ brands }: { brands: BrandSummary[] }) {
  return (
    <div
      aria-hidden="true"
      data-marquee
      className="relative overflow-hidden border-y border-rule-dark"
    >
      <Marquee pauseOnHover className="[--duration:64s] [--gap:0px] py-0">
        {brands.map((brand) => (
          <span
            key={brand.slug}
            className="flex min-h-24 items-center whitespace-nowrap border-r border-rule-dark px-8 font-display text-2xl leading-none text-paper/85"
          >
            {brand.name}
          </span>
        ))}
      </Marquee>

      {/* Fades the strip out at both edges so it reads as continuous rather
          than as a row that has been cut off. One mask, no extra layers. */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, var(--color-ink) 0%, transparent 12%, transparent 88%, var(--color-ink) 100%)',
        }}
      />
    </div>
  );
}
