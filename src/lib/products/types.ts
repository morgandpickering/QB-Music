/**
 * The canonical product model.
 *
 * Every price on this site is an integer number of CENTS. Money never touches
 * a float, and the client is never the authority on what something costs —
 * see `lib/commerce/pricing.ts`, which re-prices every cart line from this
 * model on the server before a payment session is created.
 */

export type Condition = 'new' | 'used' | 'vintage';

export type Availability = 'in-stock' | 'limited' | 'out-of-stock';

export type PlateKind =
  | 'electric-guitar'
  | 'acoustic-guitar'
  | 'bass'
  | 'amplifier'
  | 'pedal'
  | 'keyboard'
  | 'drums'
  | 'band'
  | 'pro-audio'
  | 'microphone'
  | 'accessory'
  | 'storefront'
  | 'workshop'
  | 'lesson'
  | 'community'
  | 'install';

export interface ProductImage {
  /** Path to real photography. `null` until a photo is supplied — the UI
   *  falls back to the drawn plate rather than a broken or stock image. */
  src: string | null;
  /** Always required, even for the fallback. Describes the instrument. */
  alt: string;
  width?: number;
  height?: number;
}

export interface SpecEntry {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  /** Shop-floor stock number. Printed on the tag, searchable, shown on the
   *  product page — it is how someone phones up and asks about one thing. */
  sku: string;
  slug: string;
  name: string;
  brand: string;
  /** Slug of a `Category`. */
  category: string;
  subcategory: string | null;
  /** One sentence. Used in Quick View, search suggestions, and meta tags. */
  shortDescription: string;
  description: string;
  /** Integer cents. */
  price: number;
  /** Integer cents, or null when not on sale. */
  salePrice: number | null;
  condition: Condition;
  /** Units on hand. `availability` is derived from this — one source of truth. */
  inventory: number;
  pickupOnly: boolean;
  shippingAvailable: boolean;
  /** First image is the card face; a second, if present, is revealed on hover. */
  images: ProductImage[];
  /** Drives the drawn fallback art when `images[n].src` is null. */
  plate: PlateKind;
  /**
   * Free-form attributes. Deliberately not a fixed shape: a saxophone has a
   * bore and a lay, a guitar has a fingerboard radius, a mixer has a channel
   * count. Nothing guitar-specific is hard-coded into the model.
   */
  specifications: SpecEntry[];
  /** Loose keywords — materials, uses, nicknames. Searched, never displayed. */
  tags: string[];
  featured: boolean;
  /** Surfaces in New Arrivals and earns the NEW badge. Set by hand rather than
   *  computed from a date, so the server and the browser can never disagree. */
  newArrival: boolean;
  /** Someone on the counter staff put their name to it. */
  staffPick: boolean;
  /** Came in over the counter from a local player, rather than a distributor. */
  localTrade: boolean;
  /** Sort key for "Newest first". ISO `YYYY-MM-DD`. */
  arrivedAt: string;
  /** High-value or one-off pieces surface "Ask about this instrument"
   *  instead of a bare Add to cart. */
  enquiryOnly?: boolean;
}

export type CategoryGroup =
  | 'guitars'
  | 'drums'
  | 'keys'
  | 'band'
  | 'audio'
  | 'accessories';

export interface Category {
  slug: string;
  name: string;
  /** Short editorial line used on the homepage grid and the category header. */
  blurb: string;
  plate: PlateKind;
  /** Controls tile size in the homepage editorial grid. */
  weight: 'lead' | 'major' | 'minor';
  /** Which department it hangs in. Drives the header's mega menus. */
  group: CategoryGroup;
  /** Demo photography for the tile, or `null` to keep the drawn plate — see
   *  `public/photos/demo/CREDITS.json` for licensing on every non-null src. */
  image: { src: string; alt: string } | null;
}

/* ------------------------------------------------------------------ */
/* Derivations                                                         */
/* ------------------------------------------------------------------ */

export const LIMITED_STOCK_THRESHOLD = 2;

export function availabilityOf(product: Product): Availability {
  if (product.inventory <= 0) return 'out-of-stock';
  if (product.inventory <= LIMITED_STOCK_THRESHOLD) return 'limited';
  return 'in-stock';
}

/** The price a customer actually pays, in cents. */
export function effectivePrice(product: Product): number {
  return product.salePrice ?? product.price;
}

export function isOnSale(product: Product): boolean {
  return product.salePrice !== null && product.salePrice < product.price;
}

export function savingOf(product: Product): number {
  return isOnSale(product) ? product.price - (product.salePrice as number) : 0;
}

export function canAddToCart(product: Product): boolean {
  return !product.enquiryOnly && availabilityOf(product) !== 'out-of-stock';
}

/** Second photograph, revealed on card hover. Null when only one exists. */
export function hoverImage(product: Product): ProductImage | null {
  return product.images[1] ?? null;
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

/** Cents -> "$1,299.00". */
export function formatPrice(cents: number): string {
  return currency.format(cents / 100);
}

/** Labels carry a word, never colour alone — see the a11y notes in DESIGN.md. */
export const AVAILABILITY_LABEL: Record<Availability, string> = {
  'in-stock': 'In stock',
  limited: 'Limited stock',
  'out-of-stock': 'Out of stock',
};

export const CONDITION_LABEL: Record<Condition, string> = {
  new: 'New',
  used: 'Used',
  vintage: 'Vintage',
};

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone = 'sale' | 'used' | 'vintage' | 'new' | 'scarce' | 'pick' | 'trade';

export interface Badge {
  label: string;
  tone: BadgeTone;
}

/**
 * Badges, in the order a shopper cares about them.
 *
 * Everything a product *could* claim is computed here, and the caller takes
 * however many it has room for — cards take two, the product page takes the
 * lot. A card wearing five badges is a card nobody reads, which is why the
 * limit lives at the call site rather than being argued about per component.
 *
 * Every badge says a word. None of them rely on their colour to mean anything.
 */
export function badgesFor(product: Product, limit = Infinity): Badge[] {
  const badges: Badge[] = [];

  if (isOnSale(product)) badges.push({ label: 'Sale', tone: 'sale' });
  if (product.condition === 'vintage') badges.push({ label: 'Vintage', tone: 'vintage' });
  else if (product.condition === 'used') badges.push({ label: 'Used', tone: 'used' });
  else if (product.newArrival) badges.push({ label: 'New in', tone: 'new' });

  if (product.localTrade) badges.push({ label: 'Local trade', tone: 'trade' });
  if (product.inventory === 1) badges.push({ label: 'Only 1 left', tone: 'scarce' });
  if (product.staffPick) badges.push({ label: 'Staff pick', tone: 'pick' });

  return badges.slice(0, limit);
}
