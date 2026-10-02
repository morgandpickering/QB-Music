import type { PlateKind } from '@/lib/products/types';

/**
 * PHOTOGRAPHY MANIFEST
 *
 * Every editorial image slot on the site, in one place. Most are still
 * `src: null`, which renders the drawn plate (see components/media/Plate.tsx).
 * A few now carry verified demo photography (see `public/photos/demo/CREDITS.json`)
 * as an honest stand-in until Quattlebaum's own photography exists — never a
 * photo of the actual shop, staff, or premises, and the `alt` text on those
 * says so.
 *
 * TO ADD REAL PHOTOGRAPHY
 * -----------------------
 * Drop the file in `public/photos/`, set `src` to `/photos/<file>`, and keep
 * the `alt` text accurate. Nothing else changes — no component edits, no
 * layout shift, because each slot already declares its aspect ratio.
 *
 * The `shot` note on each entry is a brief for whoever takes the *real*
 * photograph eventually — it describes the target shot, not necessarily
 * whatever demo image the slot currently holds.
 */

export interface ImageSlot {
  src: string | null;
  alt: string;
  plate: PlateKind;
  /** CSS aspect-ratio the layout reserves. Crop to this. */
  ratio: string;
  /** Art direction note for the photographer. Not rendered. */
  shot: string;
}

const slot = (
  alt: string,
  plate: PlateKind,
  ratio: string,
  shot: string,
  /** Demo photography standing in until the real shot exists. Omit for null. */
  src: string | null = null,
): ImageSlot => ({ src, alt, plate, ratio, shot });

export const images = {
  /* ---- Home ---------------------------------------------------------- */
  /**
   * The homepage hero, sitting behind the plucked strings. The eventual goal
   * is the shopfront on West Arch — "this is a real place on a real street"
   * says something no interior or product shot can. Until that photograph
   * exists, this slot uses verified demo instrument photography instead of a
   * null (which would fall back to the drawn plate): a real photograph reads
   * as "photography-led shop" in a way a line engraving does not, and the alt
   * text is honest that it is not a photograph of Quattlebaum's own premises.
   */
  heroWall: slot(
    'A cherry red semi-hollow electric guitar — demonstration photography, not a photograph of the Quattlebaum Music storefront or stock',
    'electric-guitar',
    '16 / 9',
    'The shopfront from across the street, wide enough to include the neighbouring buildings, once a real photograph exists to replace the demo image above.',
    '/photos/demo/semi-hollow-guitar.jpg',
  ),
  heritageStore: slot(
    'The counter at Quattlebaum Music in downtown Searcy',
    'storefront',
    '4 / 5',
    'Portrait. The counter, the till, a wall of picks and strings behind. Someone working, not posed.',
  ),
  heritageDetail: slot(
    'Brass tuning machines on a guitar headstock',
    'accessory',
    '1 / 1',
    'Close macro on hardware — tuners, a bridge, a cymbal edge. Shallow depth of field.',
  ),
  lessons: slot(
    'A lesson in progress in one of the teaching rooms',
    'lesson',
    '3 / 2',
    'A teacher and student mid-lesson, seen from behind or side on. Faces optional, hands matter.',
  ),
  repairs: slot(
    'An instrument on the repair bench, tools laid out beside it',
    'workshop',
    '3 / 2',
    'Overhead of the bench. Files, a soldering iron, a guitar neck clamped. Deliberately dark.',
  ),
  proAudio: slot(
    'A speaker system installed above a church platform',
    'install',
    '3 / 2',
    'A finished install seen from the back of the room. Show the room, not just the box.',
  ),
  community: slot(
    'Local musicians playing in downtown Searcy',
    'community',
    '16 / 9',
    'A real local gig, school band, or downtown event. Crowd in frame. This one must be genuinely local.',
  ),
  storefront: slot(
    'The Quattlebaum Music storefront on W. Arch Street',
    'storefront',
    '3 / 2',
    'The shopfront from across the street, late afternoon, lights on inside.',
  ),

  /* ---- Interior pages -------------------------------------------------- */
  aboutHero: slot(
    'Inside Quattlebaum Music, looking down the length of the shop',
    'storefront',
    '21 / 9',
    'Wide interior. Depth: instruments near, counter far. Shot at opening time before customers arrive.',
  ),
  aboutArchive: slot(
    'An early photograph of the shop',
    'community',
    '4 / 3',
    'Any surviving historic photograph, sign, or newspaper clipping. Scan flat.',
  ),
  lessonsHero: slot(
    'A student and teacher in a lesson room',
    'lesson',
    '21 / 9',
    'Wide, warm, natural light. A room that looks used.',
  ),
  repairsHero: slot(
    'The repair bench under a work lamp',
    'workshop',
    '21 / 9',
    'Dark and close. One pool of lamplight, tools in shadow around it.',
  ),
  repairsDetail: slot(
    'Hands seating a fret on a guitar neck',
    'workshop',
    '1 / 1',
    'Macro on the work itself. Hands in frame.',
  ),
  proAudioHero: slot(
    'A mixing console during a soundcheck',
    'pro-audio',
    '21 / 9',
    'Console in the foreground, an out-of-focus room beyond. Shot during an actual soundcheck.',
  ),
  proAudioRoom: slot(
    'A finished sound system in a school auditorium',
    'install',
    '3 / 2',
    'A room we have worked in, empty, showing the speakers in position.',
  ),
  contactMap: slot(
    'The shopfront at 101 W. Arch St.',
    'storefront',
    '4 / 3',
    'Street-level, so a visitor recognises the door when they arrive.',
  ),
} as const;

export type ImageKey = keyof typeof images;
