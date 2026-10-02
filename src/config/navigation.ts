/**
 * Site navigation.
 *
 * Everything the header, the mega menus, the mobile drawer, the footer and the
 * sitemap know about links lives here. Adding a page is one entry.
 *
 * Kept out of the client components so server components (Footer, sitemap) can
 * read the real arrays rather than a client-reference proxy.
 *
 * Category hrefs point at `/shop/<slug>` and the slugs must exist in
 * `lib/products/catalog.ts` — `npm run check:links` walks this file and fails
 * if one of them stops resolving.
 */

export interface NavLink {
  href: string;
  label: string;
  /** Optional one-liner, shown in mega menus where there is room for it. */
  note?: string;
}

export interface MegaColumn {
  heading: string;
  links: NavLink[];
}

export interface MegaMenu {
  columns: MegaColumn[];
  /** Brand shortcuts, rendered as a row of chips under the columns. */
  brands?: string[];
  /** The one editorial thing in the panel: a shelf worth pointing at. */
  feature?: {
    href: string;
    label: string;
    blurb: string;
  };
}

export interface NavItem extends NavLink {
  mega?: MegaMenu;
}

/* ------------------------------------------------------------------ */
/* Utility bar                                                         */
/* ------------------------------------------------------------------ */

/** The thin strip above the masthead. Short, practical, mostly service links. */
export const UTILITY_LINKS: NavLink[] = [
  { href: '/lessons', label: 'Lessons' },
  { href: '/repairs', label: 'Repairs' },
  { href: '/pro-audio', label: 'Sound systems' },
  { href: '/contact', label: 'Contact' },
];

/* ------------------------------------------------------------------ */
/* Primary navigation                                                  */
/* ------------------------------------------------------------------ */

export const PRIMARY_NAV: NavItem[] = [
  {
    href: '/shop',
    label: 'Shop',
    mega: {
      columns: [
        {
          heading: 'Browse',
          links: [
            { href: '/shop', label: 'All products' },
            { href: '/shop?new=1&sort=newest', label: 'New arrivals' },
            { href: '/used', label: 'Used & vintage' },
            { href: '/shop?sale=1', label: 'Reduced' },
          ],
        },
        {
          heading: 'Departments',
          links: [
            { href: '/shop/electric-guitars', label: 'Electric Guitars' },
            { href: '/shop/acoustic-guitars', label: 'Acoustic Guitars' },
            { href: '/shop/drums', label: 'Drums & Percussion' },
            { href: '/shop/keyboards', label: 'Keyboards & Pianos' },
          ],
        },
        {
          heading: 'More',
          links: [
            { href: '/shop/band-instruments', label: 'Band & Orchestra' },
            { href: '/shop/pro-audio', label: 'Pro Audio' },
            { href: '/shop/accessories', label: 'Accessories' },
            { href: '/brands', label: 'Shop by brand' },
          ],
        },
      ],
      feature: {
        href: '/used',
        label: 'Used & unique',
        blurb: 'Trade-ins, one-offs, and the odd thing hanging in the corner.',
      },
    },
  },
  {
    href: '/shop/electric-guitars',
    label: 'Guitars',
    mega: {
      columns: [
        {
          heading: 'Guitars',
          links: [
            { href: '/shop/electric-guitars', label: 'Electric Guitars' },
            { href: '/shop/acoustic-guitars', label: 'Acoustic Guitars' },
            { href: '/shop/classical-guitars', label: 'Classical Guitars' },
            { href: '/shop/ukuleles', label: 'Ukuleles' },
            { href: '/shop/bass', label: 'Bass Guitars' },
          ],
        },
        {
          heading: 'Amps & effects',
          links: [
            { href: '/shop/amplifiers', label: 'Guitar Amps' },
            { href: '/shop/pedals', label: 'Effects & Pedals' },
          ],
        },
        {
          heading: 'Parts & upkeep',
          links: [
            { href: '/shop/accessories?sub=Strings', label: 'Strings' },
            { href: '/shop/accessories', label: 'Cases, stands & cables' },
            { href: '/shop/electric-guitars?condition=used,vintage', label: 'Used Guitars' },
            { href: '/repairs', label: 'Setups & repairs' },
          ],
        },
      ],
      brands: ['Fender', 'Gibson', 'Martin', 'Taylor', 'PRS', 'Squier'],
      feature: {
        href: '/repairs',
        label: 'Every guitar set up in house',
        blurb: 'New or used, it goes across our bench before it goes home with you.',
      },
    },
  },
  { href: '/shop/bass', label: 'Bass' },
  {
    href: '/shop/drums',
    label: 'Drums',
    mega: {
      columns: [
        {
          heading: 'Drums & percussion',
          links: [
            { href: '/shop/drums?sub=Drum+kit', label: 'Drum Kits' },
            { href: '/shop/drums?sub=Snare+drum', label: 'Snare Drums' },
            { href: '/shop/drums?sub=Cymbal', label: 'Cymbals' },
            { href: '/shop/drums?sub=Electronic+kit', label: 'Electronic Kits' },
          ],
        },
        {
          heading: 'Hardware & sticks',
          links: [
            { href: '/shop/drums?sub=Sticks', label: 'Sticks & Brushes' },
            { href: '/shop/drums', label: 'All drums & percussion' },
            { href: '/shop/drums?condition=used,vintage', label: 'Used Drums' },
          ],
        },
      ],
      brands: ['Pearl', 'Zildjian', 'Ludwig', 'Roland', 'Meinl', 'Vic Firth'],
    },
  },
  {
    href: '/shop/keyboards',
    label: 'Keyboards',
    mega: {
      columns: [
        {
          heading: 'Keyboards & pianos',
          links: [
            { href: '/shop/keyboards?sub=Digital+piano', label: 'Digital Pianos' },
            { href: '/shop/keyboards?sub=Stage+keyboard', label: 'Stage Keyboards' },
            { href: '/shop/keyboards?sub=Stage+organ', label: 'Organs' },
            { href: '/shop/keyboards?sub=Portable+keyboard', label: 'Portable Keyboards' },
          ],
        },
        {
          heading: 'Also worth a look',
          links: [
            { href: '/shop/keyboards', label: 'All keyboards' },
            { href: '/lessons', label: 'Piano lessons' },
            { href: '/shop/accessories', label: 'Benches, stands & pedals' },
          ],
        },
      ],
      brands: ['Yamaha', 'Roland', 'Nord', 'Casio', 'Hammond'],
    },
  },
  {
    href: '/shop/band-instruments',
    label: 'Band & Orchestra',
    mega: {
      columns: [
        {
          heading: 'Band & orchestra',
          links: [
            { href: '/shop/band-instruments?sub=Woodwind', label: 'Woodwind' },
            { href: '/shop/band-instruments?sub=Brass', label: 'Brass' },
            { href: '/shop/band-instruments?sub=Strings', label: 'Orchestral Strings' },
            { href: '/shop/band-instruments?sub=Reeds', label: 'Reeds & Supplies' },
          ],
        },
        {
          heading: 'For students',
          links: [
            { href: '/shop/band-instruments', label: 'All band & orchestra' },
            { href: '/repairs', label: 'Instrument service' },
            { href: '/contact?topic=product', label: 'Ask about school orders' },
          ],
        },
      ],
      brands: ['Yamaha', 'Bach', 'Eastman', 'Rico'],
      feature: {
        href: '/repairs',
        label: 'Band instrument service',
        blurb: 'Pads, corks, dents and valve work, done on our own bench.',
      },
    },
  },
  {
    href: '/shop/pro-audio',
    label: 'Pro Audio',
    mega: {
      columns: [
        {
          heading: 'Sound & stage',
          links: [
            { href: '/shop/pro-audio?sub=Powered+speaker', label: 'Powered Speakers' },
            { href: '/shop/pro-audio?sub=Mixing+console', label: 'Mixing Consoles' },
            { href: '/shop/microphones', label: 'Microphones' },
            { href: '/shop/pro-audio?sub=Wireless', label: 'Wireless Systems' },
            { href: '/shop/pro-audio?sub=Monitoring', label: 'In-Ear Monitoring' },
          ],
        },
        {
          heading: 'For organisations',
          links: [
            { href: '/pro-audio', label: 'Installations & system design' },
            { href: '/contact?topic=pro-audio', label: 'Talk to us about a room' },
            { href: '/shop/pro-audio', label: 'All pro audio' },
          ],
        },
      ],
      brands: ['QSC', 'Allen & Heath', 'Yamaha', 'JBL', 'Shure'],
      feature: {
        href: '/pro-audio',
        label: 'Churches, schools & venues',
        blurb: 'We listen to the room first, then design something your volunteers can run.',
      },
    },
  },
  { href: '/shop/accessories', label: 'Accessories' },
  { href: '/used', label: 'Used Gear' },
  { href: '/brands', label: 'Brands' },
  { href: '/lessons', label: 'Lessons' },
  { href: '/repairs', label: 'Repairs' },
  { href: '/about', label: 'About' },
];

/* ------------------------------------------------------------------ */
/* Footer                                                              */
/* ------------------------------------------------------------------ */

export const FOOTER_COLUMNS: { heading: string; links: NavLink[] }[] = [
  {
    heading: 'Shop',
    links: [
      { href: '/shop?new=1&sort=newest', label: 'New Arrivals' },
      { href: '/shop/electric-guitars', label: 'Guitars' },
      { href: '/shop/drums', label: 'Drums' },
      { href: '/shop/keyboards', label: 'Keyboards' },
      { href: '/shop/band-instruments', label: 'Band & Orchestra' },
      { href: '/shop/pro-audio', label: 'Pro Audio' },
      { href: '/used', label: 'Used Gear' },
      { href: '/shop/accessories', label: 'Accessories' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { href: '/lessons', label: 'Music Lessons' },
      { href: '/repairs', label: 'Repairs' },
      { href: '/pro-audio', label: 'Sound Systems' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Customer service',
    links: [
      { href: '/policies/shipping', label: 'Shipping' },
      { href: '/policies/returns', label: 'Returns' },
      { href: '/policies/store', label: 'Store Policies' },
      { href: '/policies/privacy', label: 'Privacy Policy' },
      { href: '/policies/terms', label: 'Terms of Service' },
    ],
  },
  {
    heading: 'About',
    links: [
      { href: '/about', label: 'Our Story' },
      { href: '/about#team', label: 'Meet the Team' },
      { href: '/contact', label: 'Visit the Store' },
      { href: '/wishlist', label: 'Your Wishlist' },
      { href: '/credits', label: 'Photo Credits' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Sitemap                                                             */
/* ------------------------------------------------------------------ */

/**
 * Every static route, for the XML sitemap and the mobile drawer's flat list.
 * Category and product routes are appended by `app/sitemap.ts` from the
 * catalogue, so they are never listed twice.
 */
export const STATIC_PAGES: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/used', label: 'Used Gear' },
  { href: '/brands', label: 'Brands' },
  { href: '/lessons', label: 'Lessons' },
  { href: '/repairs', label: 'Repairs & Services' },
  { href: '/pro-audio', label: 'Pro Audio' },
  { href: '/about', label: 'About' },
  { href: '/credits', label: 'Photo Credits' },
  { href: '/contact', label: 'Contact' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/cart', label: 'Cart' },
  { href: '/search', label: 'Search' },
];

export const POLICY_PAGES: NavLink[] = FOOTER_COLUMNS[2].links;

/** Kept for the a11y and sitemap scripts, which walk every reachable page. */
export const ALL_PAGES: NavLink[] = [...STATIC_PAGES, ...POLICY_PAGES];
