import Image from 'next/image';
import { RevealStagger } from '@/components/ui/Reveal';
import type { StaffMember } from '@/config/services';

/**
 * The team.
 *
 * The diamond portrait is Quattlebaum's own — it is how the shop already
 * presents its people, and keeping it is the difference between a redesign and
 * a replacement. The source PNGs carry the diamond as an alpha mask, so no CSS
 * clipping is needed; `normalise-team-photos.mjs` squares them all to 720px so
 * every portrait lands identically in the grid.
 *
 * Roles are set in the display italic rather than the tracked-out all-caps of
 * the old site, which keeps them legible at small sizes and consistent with
 * every other label here.
 */
export function TeamGrid({
  people,
  ground = 'light',
}: {
  people: StaffMember[];
  ground?: 'light' | 'dark';
}) {
  const quiet = ground === 'dark' ? 'text-quiet-dark' : 'text-quiet-light';
  const accent = ground === 'dark' ? 'text-brass-light' : 'text-brass-deep';

  return (
    <RevealStagger
      as="ul"
      className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-10 md:grid-cols-3 lg:grid-cols-4"
    >
      {people.map((person, i) => (
        <li
          key={person.name}
          className="group text-center"
          style={{ '--i': i } as React.CSSProperties}
        >
          <div className="relative mx-auto aspect-square w-full max-w-[15rem]">
            {person.photo ? (
              <Image
                src={person.photo}
                alt={`${person.name}, ${person.role} at Quattlebaum Music`}
                fill
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                className="object-contain transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out-soft)] group-hover:scale-[1.04] motion-reduce:transform-none"
              />
            ) : (
              // No photograph yet: a plain diamond holds the space so the grid
              // does not collapse around them.
              <div
                aria-hidden="true"
                className={`absolute inset-[14%] rotate-45 ${
                  ground === 'dark' ? 'bg-walnut' : 'bg-parchment'
                }`}
              />
            )}
          </div>

          <h3 className="mt-5 font-display text-xl leading-tight">{person.name}</h3>
          <p className={`marker mt-1.5 ${accent}`}>{person.role}</p>

          {person.bio && (
            <p className={`mx-auto mt-3 max-w-[24ch] text-sm ${quiet}`}>{person.bio}</p>
          )}
        </li>
      ))}
    </RevealStagger>
  );
}
