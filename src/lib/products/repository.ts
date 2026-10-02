import { categories as seedCategories, products as seedProducts } from './catalog';
import {
  availabilityOf,
  effectivePrice,
  isOnSale,
  type Availability,
  type Category,
  type Condition,
  type Product,
} from './types';

/**
 * THE ONLY PLACE THE SITE READS PRODUCT DATA.
 *
 * Every function is async so the seed arrays can be replaced by a CMS, a POS
 * export, a Square/Shopify inventory sync, or a database without touching a
 * single component. To swap sources, reimplement the two primitives at the
 * top of this file and leave the derived queries below alone.
 *
 * This module is server-side. Nothing here should be imported into a
 * "use client" component — product data reaches the browser as props.
 */

/* ---- Primitives: reimplement these to change data source --------------- */

async function loadProducts(): Promise<Product[]> {
  return seedProducts;
}

async function loadCategories(): Promise<Category[]> {
  return seedCategories;
}

/* ---- Reads -------------------------------------------------------------- */

export async function getAllProducts(): Promise<Product[]> {
  return loadProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await loadProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

/**
 * Used by checkout to re-price a cart from the authoritative source.
 * The browser sends ids and quantities; it never sends prices.
 */
export async function getProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  const all = await loadProducts();
  const wanted = new Set(ids);
  return new Map(all.filter((p) => wanted.has(p.id)).map((p) => [p.id, p]));
}

/** Only categories that actually have stock listed against them. */
export async function getCategories(): Promise<Category[]> {
  const [cats, all] = await Promise.all([loadCategories(), loadProducts()]);
  const populated = new Set(all.map((p) => p.category));
  return cats.filter((c) => populated.has(c.slug));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await loadCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  const all = await loadProducts();
  return all
    .filter((p) => p.featured && availabilityOf(p) !== 'out-of-stock')
    .slice(0, limit);
}

/** Newest first. Drives the New Arrivals rail and `/shop?sort=newest`. */
export async function getNewArrivals(limit = 8): Promise<Product[]> {
  const all = await loadProducts();
  return all
    .filter((p) => p.newArrival && availabilityOf(p) !== 'out-of-stock')
    .sort(byArrivalDesc)
    .slice(0, limit);
}

/**
 * Used, vintage, and anything traded in over the counter. These are the
 * one-offs — when it is gone it is gone — so sold-out items are dropped
 * rather than left hanging about with a Sold sticker on them.
 */
export async function getUsedProducts(limit = Infinity): Promise<Product[]> {
  const all = await loadProducts();
  return all
    .filter(
      (p) =>
        (p.condition !== 'new' || p.localTrade) && availabilityOf(p) !== 'out-of-stock',
    )
    .sort(byArrivalDesc)
    .slice(0, limit);
}

/** Same category first, then anything sharing the brand. */
export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const all = await loadProducts();
  const pool = all.filter((p) => p.id !== product.id);
  const sameCategory = pool.filter((p) => p.category === product.category);
  const sameBrand = pool.filter((p) => p.category !== product.category && p.brand === product.brand);
  return [...sameCategory, ...sameBrand].slice(0, limit);
}

export async function getBrands(): Promise<string[]> {
  const all = await loadProducts();
  return [...new Set(all.map((p) => p.brand))].sort((a, b) => a.localeCompare(b));
}

export interface BrandSummary {
  name: string;
  slug: string;
  count: number;
  /** The categories this brand appears in, for the brands index. */
  categories: string[];
}

export function brandSlug(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Every brand with how much of it is on the floor, alphabetically. */
export async function getBrandSummaries(): Promise<BrandSummary[]> {
  const all = await loadProducts();
  const map = new Map<string, BrandSummary>();

  for (const product of all) {
    const existing = map.get(product.brand);
    if (existing) {
      existing.count += 1;
      if (!existing.categories.includes(product.category)) {
        existing.categories.push(product.category);
      }
    } else {
      map.set(product.brand, {
        name: product.brand,
        slug: brandSlug(product.brand),
        count: 1,
        categories: [product.category],
      });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The payload the header search box works against.
 *
 * Deliberately small — enough to draw a suggestion row and nothing more — so
 * the whole catalogue can be handed to the browser once instead of firing a
 * request per keystroke. Past a few hundred products, swap this for an API
 * route that queries the database and returns the same shape.
 */
export interface SearchEntry {
  id: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  category: string;
  price: number;
  salePrice: number | null;
  plate: Product['plate'];
  image: string | null;
  imageAlt: string;
  /** Pre-lowercased haystack, so the browser never re-derives it per keystroke. */
  haystack: string;
}

export async function getSearchIndex(): Promise<SearchEntry[]> {
  const all = await loadProducts();
  return all.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    sku: p.sku,
    category: p.category,
    price: p.price,
    salePrice: p.salePrice,
    plate: p.plate,
    image: p.images[0]?.src ?? null,
    imageAlt: p.images[0]?.alt ?? `${p.brand} ${p.name}`,
    haystack:
      `${p.brand} ${p.name} ${p.sku} ${p.subcategory ?? ''} ${p.category} ${p.tags.join(' ')} ${p.shortDescription}`.toLowerCase(),
  }));
}

/* ---- Filtering ---------------------------------------------------------- */

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'name-asc', label: 'Name, A to Z' },
];

export interface ProductFilters {
  category?: string | null;
  brands?: string[];
  conditions?: Condition[];
  availability?: Availability[];
  subcategories?: string[];
  minPrice?: number | null;
  maxPrice?: number | null;
  search?: string;
  sort?: SortKey;
  /** Restricts to the used/vintage/trade-in shelf. */
  usedOnly?: boolean;
  /** Restricts to items marked as new arrivals. */
  newOnly?: boolean;
  /** Restricts to items currently reduced. */
  saleOnly?: boolean;
}

function byArrivalDesc(a: Product, b: Product): number {
  return b.arrivedAt.localeCompare(a.arrivedAt);
}

/**
 * Pure, shared by the server (initial render) and the client (interactive
 * filtering), so both always agree on what a filter means.
 *
 * ponytail: linear scan. Correct and instant for a few hundred products;
 * push filtering into the database query once the catalogue outgrows that.
 */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const {
    category = null,
    brands = [],
    conditions = [],
    availability = [],
    subcategories = [],
    minPrice = null,
    maxPrice = null,
    search = '',
    sort = 'featured',
    usedOnly = false,
    newOnly = false,
    saleOnly = false,
  } = filters;

  const needle = search.trim().toLowerCase();

  const matched = products.filter((p) => {
    if (category && p.category !== category) return false;
    if (brands.length > 0 && !brands.includes(p.brand)) return false;
    if (conditions.length > 0 && !conditions.includes(p.condition)) return false;
    if (availability.length > 0 && !availability.includes(availabilityOf(p))) return false;
    if (subcategories.length > 0 && !subcategories.includes(p.subcategory ?? '')) return false;
    if (usedOnly && p.condition === 'new' && !p.localTrade) return false;
    if (newOnly && !p.newArrival) return false;
    if (saleOnly && !isOnSale(p)) return false;

    const price = effectivePrice(p);
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;

    if (needle) {
      const haystack =
        `${p.brand} ${p.name} ${p.sku} ${p.subcategory ?? ''} ${p.tags.join(' ')} ${p.description}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  return sortProducts(matched, sort);
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const out = [...products];
  switch (sort) {
    case 'newest':
      return out.sort(byArrivalDesc);
    case 'price-asc':
      return out.sort((a, b) => effectivePrice(a) - effectivePrice(b));
    case 'price-desc':
      return out.sort((a, b) => effectivePrice(b) - effectivePrice(a));
    case 'name-asc':
      return out.sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));
    case 'featured':
    default:
      // Featured first, then in-stock ahead of sold out, then alphabetical.
      return out.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const aOut = availabilityOf(a) === 'out-of-stock';
        const bOut = availabilityOf(b) === 'out-of-stock';
        if (aOut !== bOut) return aOut ? 1 : -1;
        return `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`);
      });
  }
}
