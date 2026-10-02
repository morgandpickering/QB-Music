/**
 * Single source of truth for every business fact on the site.
 *
 * HOW TO USE THIS FILE
 * --------------------
 * Anything typed `| null` is NOT yet verified. The site is built so that a
 * null value is *omitted* from the page and from structured data rather than
 * guessed at, so nothing here will ever publish a phone number, an opening
 * time, or a founding year that nobody confirmed.
 *
 * Fill these in and the corresponding UI appears automatically. See
 * PENDING.md for the full launch checklist.
 */

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** 24h "HH:MM" strings, or `null` for closed. */
export interface DayHours {
  open: string;
  close: string;
}

export type HoursTable = Record<DayKey, DayHours | null>;

export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const DAY_ORDER: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const business = {
  name: 'Quattlebaum Music',
  /** Used in <title> and structured data. */
  legalName: 'Quattlebaum Music',
  tagline: 'A modern music store with an old-school soul.',

  address: {
    street: '101 W. Arch St.',
    city: 'Searcy',
    region: 'AR',
    regionName: 'Arkansas',
    postalCode: '72143',
    country: 'US',
  },

  /* ---- Verify before launch -------------------------------------------- */

  /** E.164 for `tel:` links. Confirmed. */
  phone: '+15012686694' as string | null,
  /** Human-readable form. Confirmed. */
  phoneDisplay: '(501) 268-6694' as string | null,
  /** Where contact-form submissions should be routed. */
  email: null as string | null,

  /** Opening hours. Leave a day `null` for closed; leave the whole table
   *  `null` until the real hours are confirmed. */
  hours: null as HoursTable | null,

  /** Year the store opened. Drives the "N+ Years" figure on the homepage. */
  foundedYear: null as number | null,

  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    youtube: null as string | null,
  },

  /** Latitude/longitude, for LocalBusiness structured data. */
  geo: null as { lat: number; lng: number } | null,
} as const;

/* ------------------------------------------------------------------------ */
/* Derived helpers — safe to compute from the confirmed address alone.       */
/* ------------------------------------------------------------------------ */

export const addressLines = [
  business.name,
  business.address.street,
  `${business.address.city}, ${business.address.regionName} ${business.address.postalCode}`,
];

const addressQuery = encodeURIComponent(
  `${business.name}, ${business.address.street}, ${business.address.city}, ${business.address.region} ${business.address.postalCode}`,
);

/** Opens turn-by-turn directions in the visitor's map app of choice. */
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${addressQuery}`;

/** Keyless embed. Only loaded after the visitor asks for it — see MapPanel. */
export const mapEmbedUrl = `https://www.google.com/maps?q=${addressQuery}&output=embed`;

/** Years in business, or null while `foundedYear` is unconfirmed. */
export function yearsInBusiness(now = new Date()): number | null {
  if (business.foundedYear === null) return null;
  return now.getFullYear() - business.foundedYear;
}

/** Formats an "HH:MM" string as "9:00 AM". */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
