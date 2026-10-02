'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Photo } from '@/components/media/Photo';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { filterProducts, SORT_OPTIONS, type SortKey } from '@/lib/products/repository';
import {
  AVAILABILITY_LABEL,
  CONDITION_LABEL,
  availabilityOf,
  effectivePrice,
  formatPrice,
  isOnSale,
  type Availability,
  type Category,
  type Condition,
  type Product,
} from '@/lib/products/types';
import { ProductBadges } from './ProductBadges';
import { ProductCard } from './ProductCard';
import { ProductCardActions } from './ProductCardActions';
import { WishlistButton } from './WishlistButton';

/**
 * The shop floor.
 *
 * Filter state lives in the URL, so any view can be linked, bookmarked and
 * shared, the back button does what it should, and a shop assistant can send
 * somebody a link to exactly the shelf they were describing on the phone.
 *
 * Filtering runs on the already-loaded product list — instant, and no request
 * per keystroke. See the note in `repository.ts` about when that stops being
 * the right call.
 *
 * On desktop the filters sit in a column beside the grid. On mobile they are a
 * proper drawer rather than a squeezed sidebar: full height, one thumb, and a
 * button that says how many items are waiting behind it.
 *
 * No magnetic buttons or cursor effects here. This is where people are trying
 * to buy something.
 */

const CONDITIONS: Condition[] = ['new', 'used', 'vintage'];
const AVAILABILITIES: Availability[] = ['in-stock', 'limited', 'out-of-stock'];
const PAGE_SIZE = 12;
const PRICE_CEILING = 500000;

function readList(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  return raw ? raw.split(',').filter(Boolean) : [];
}

export function StoreBrowser({
  products,
  categories,
  brands,
  /** Set when rendering a category route; hides the category filter. */
  lockedCategory = null,
  /** Set on /used, which is a pre-filtered view of the same catalogue. */
  lockedUsed = false,
  heading = 'Shop',
}: {
  products: Product[];
  categories: Category[];
  brands: string[];
  lockedCategory?: string | null;
  lockedUsed?: boolean;
  heading?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const filtersButtonRef = useRef<HTMLButtonElement | null>(null);

  const search = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey) ?? 'featured';
  const selectedBrands = readList(params, 'brand');
  const selectedConditions = readList(params, 'condition') as Condition[];
  const selectedAvailability = readList(params, 'stock') as Availability[];
  const selectedSubs = readList(params, 'sub');
  const maxPrice = params.get('max') ? Number(params.get('max')) : null;
  const saleOnly = params.get('sale') === '1';
  const newOnly = params.get('new') === '1';

  const [searchDraft, setSearchDraft] = useState(search);
  useEffect(() => setSearchDraft(search), [search]);

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `?${query}` : '?', { scroll: false });
    },
    [params, router],
  );

  const toggleInList = useCallback(
    (key: string, value: string) => {
      const current = readList(params, key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      update({ [key]: next.join(',') });
    },
    [params, update],
  );

  // Debounce the search box so typing does not rewrite history on every key.
  useEffect(() => {
    if (searchDraft === search) return;
    const timer = window.setTimeout(() => update({ q: searchDraft || null }), 250);
    return () => window.clearTimeout(timer);
  }, [searchDraft, search, update]);

  /** Instrument types present in this view — the "sub" filter is per-category. */
  const subcategories = useMemo(() => {
    const pool = lockedCategory
      ? products.filter((p) => p.category === lockedCategory)
      : products;
    return [...new Set(pool.map((p) => p.subcategory).filter((s): s is string => Boolean(s)))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [products, lockedCategory]);

  const results = useMemo(
    () =>
      filterProducts(products, {
        category: lockedCategory,
        brands: selectedBrands,
        conditions: selectedConditions,
        availability: selectedAvailability,
        subcategories: selectedSubs,
        maxPrice,
        search,
        sort,
        usedOnly: lockedUsed,
        saleOnly,
        newOnly,
      }),
    [
      products,
      lockedCategory,
      lockedUsed,
      selectedBrands,
      selectedConditions,
      selectedAvailability,
      selectedSubs,
      maxPrice,
      search,
      sort,
      saleOnly,
      newOnly,
    ],
  );

  // A changed filter means page one again, or "Load more" keeps showing a
  // count from a set that no longer exists.
  useEffect(() => setVisible(PAGE_SIZE), [results.length, sort]);

  const shown = results.slice(0, visible);
  const remaining = results.length - shown.length;

  const activeCount =
    selectedBrands.length +
    selectedConditions.length +
    selectedAvailability.length +
    selectedSubs.length +
    (maxPrice !== null ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    (newOnly ? 1 : 0);

  const clearAll = () =>
    update({
      brand: null,
      condition: null,
      stock: null,
      sub: null,
      max: null,
      sale: null,
      new: null,
      q: null,
    });

  /* ---- Filter panel (rendered twice: sidebar and drawer) --------- */

  const filterPanel = (
    <div className="space-y-8">
      {!lockedCategory && (
        <FilterGroup legend="Category">
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop/${category.slug}`}
                  className="link-draw inline-block py-1 text-[0.9375rem] text-quiet-light hover:text-ink"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      {!lockedUsed && (
        <FilterGroup legend="Show me">
          <div className="space-y-2">
            <CheckRow
              label="New arrivals"
              checked={newOnly}
              onChange={() => update({ new: newOnly ? null : '1' })}
            />
            <CheckRow
              label="Reduced"
              checked={saleOnly}
              onChange={() => update({ sale: saleOnly ? null : '1' })}
            />
          </div>
        </FilterGroup>
      )}

      {subcategories.length > 1 && (
        <FilterGroup legend="Instrument type">
          <div className="space-y-2">
            {subcategories.map((sub) => (
              <CheckRow
                key={sub}
                label={sub}
                checked={selectedSubs.includes(sub)}
                onChange={() => toggleInList('sub', sub)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup legend="Brand">
        <div className="space-y-2">
          {brands.map((brand) => (
            <CheckRow
              key={brand}
              label={brand}
              checked={selectedBrands.includes(brand)}
              onChange={() => toggleInList('brand', brand)}
            />
          ))}
        </div>
      </FilterGroup>

      {!lockedUsed && (
        <FilterGroup legend="Condition">
          <div className="space-y-2">
            {CONDITIONS.map((condition) => (
              <CheckRow
                key={condition}
                label={CONDITION_LABEL[condition]}
                checked={selectedConditions.includes(condition)}
                onChange={() => toggleInList('condition', condition)}
              />
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup legend="Availability">
        <div className="space-y-2">
          {AVAILABILITIES.map((availability) => (
            <CheckRow
              key={availability}
              label={AVAILABILITY_LABEL[availability]}
              checked={selectedAvailability.includes(availability)}
              onChange={() => toggleInList('stock', availability)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup legend="Budget">
        <BudgetSlider
          maxPrice={maxPrice}
          onChange={(value) => update({ max: value === null ? null : String(value) })}
        />
      </FilterGroup>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="link-draw min-h-11 text-[0.9375rem] font-medium"
        >
          Clear {activeCount} {activeCount === 1 ? 'filter' : 'filters'}
        </button>
      )}
    </div>
  );

  return (
    <div className="shell on-light">
      {/* ---- Toolbar ---------------------------------------------- */}
      <div className="flex flex-col gap-4 border-b border-rule-light pb-5 lg:flex-row lg:items-center lg:gap-6">
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="font-display text-2xl">{heading}</h2>
          <p aria-live="polite" className="text-sm text-quiet-light">
            {results.length} {results.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="relative min-w-0 flex-1">
          <label htmlFor="store-search" className="sr-only">
            Search within {heading}
          </label>
          <input
            id="store-search"
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search by brand, model, or stock number"
            className="h-12 w-full border border-rule-light bg-transparent px-4 text-[0.9375rem] placeholder:text-quiet-light/70 focus:border-ink"
          />
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="store-sort" className="shrink-0 text-sm text-quiet-light">
            Sort by
          </label>
          <select
            id="store-sort"
            value={sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="h-12 flex-1 border border-rule-light bg-transparent px-3 text-[0.9375rem] focus:border-ink lg:flex-none"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="hidden items-center border border-rule-light md:flex" role="group" aria-label="Layout">
            <LayoutButton
              active={layout === 'grid'}
              onClick={() => setLayout('grid')}
              label="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" fill="currentColor" />
              </svg>
            </LayoutButton>
            <LayoutButton
              active={layout === 'list'}
              onClick={() => setLayout('list')}
              label="List view"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M2 3h12v2H2zM2 7h12v2H2zM2 11h12v2H2z" fill="currentColor" />
              </svg>
            </LayoutButton>
          </div>

          <button
            ref={filtersButtonRef}
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="h-12 shrink-0 border border-rule-light px-4 text-[0.9375rem] font-medium lg:hidden"
          >
            Filters
            {activeCount > 0 && <span className="ml-1.5 tabular-nums">({activeCount})</span>}
          </button>
        </div>
      </div>

      <div className="grid gap-10 pt-9 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside className="hidden lg:block">
          <h2 className="sr-only">Filters</h2>
          {filterPanel}
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="border-t border-rule-light pt-10">
              <h3 className="font-display text-2xl">Nothing matches that.</h3>
              <p className="measure mt-3 text-quiet-light">
                We keep a lot more in the shop than we list online. Tell us what you are
                after and we will check the back room.
              </p>
              <div className="mt-6 flex flex-wrap gap-6">
                <button type="button" onClick={clearAll} className="link-draw font-medium">
                  Clear the filters
                </button>
                <Link href="/contact?topic=product" className="link-draw font-medium">
                  Ask us about it
                </Link>
              </div>
            </div>
          ) : layout === 'list' ? (
            <ul className="divide-y divide-rule-light border-t border-rule-light">
              {shown.map((product) => (
                <li key={product.id}>
                  <ProductRow product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 2xl:grid-cols-4">
              {shown.map((product, i) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 27vw, 45vw"
                    priority={i < 4}
                  />
                </li>
              ))}
            </ul>
          )}

          {remaining > 0 && (
            <div className="mt-14 flex flex-col items-center gap-4 border-t border-rule-light pt-10">
              <p className="text-sm text-quiet-light">
                Showing {shown.length} of {results.length}
              </p>
              <button
                type="button"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
                className="min-h-13 rounded-[var(--radius-xs)] border border-ink px-10 font-medium transition-colors hover:bg-ink hover:text-paper"
              >
                Load {Math.min(remaining, PAGE_SIZE)} more
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ---- Mobile filter drawer --------------------------------- */}
      {/* A bottom Sheet: Radix handles focus entry/containment, Escape,
          background scroll-lock and aria-hidden — see components/ui/sheet.tsx. */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="bottom"
          className="lg:hidden"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            filtersButtonRef.current?.focus();
          }}
        >
          <div className="flex items-center justify-between border-b border-rule-light px-5 py-4">
            <SheetTitle asChild>
              <h2 className="font-display text-2xl">Filters</h2>
            </SheetTitle>
            <SheetClose className="grid h-11 w-11 place-items-center">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="sr-only">Close filters</span>
            </SheetClose>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">{filterPanel}</div>

          <div className="border-t border-rule-light p-5">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="flex min-h-13 w-full items-center justify-center bg-ink font-medium text-paper"
            >
              Show {results.length} {results.length === 1 ? 'item' : 'items'}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * The list row. Not a squashed card: a wider layout can afford the sentence
 * that says what the thing actually is, which is the only reason to offer a
 * list view at all.
 */
function ProductRow({ product }: { product: Product }) {
  const availability = availabilityOf(product);

  return (
    <article className="group relative grid grid-cols-[6.5rem_1fr] gap-5 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8">
      <div className="relative overflow-hidden bg-parchment">
        <Photo
          src={product.images[0]?.src ?? null}
          alt={product.images[0]?.alt ?? `${product.brand} ${product.name}`}
          plate={product.plate}
          tone="light"
          ratio="1 / 1"
          sizes="(min-width: 640px) 10rem, 6.5rem"
          grain={false}
        />
        {availability !== 'out-of-stock' && <ProductCardActions product={product} />}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className="text-xs tracking-[0.04em] text-quiet-light">{product.brand}</p>
            <h3 className="mt-1 font-display text-xl leading-tight">
              <Link
                href={`/product/${product.slug}`}
                className="after:absolute after:inset-0 after:z-0 focus-visible:outline-offset-4"
              >
                {product.name}
              </Link>
            </h3>
          </div>

          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <p className="text-right tabular-nums">
              <span className={isOnSale(product) ? 'text-brass-deep' : undefined}>
                {formatPrice(effectivePrice(product))}
              </span>
              {isOnSale(product) && (
                <span className="ml-2 text-sm text-quiet-light line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </p>
            <WishlistButton
              productId={product.id}
              productName={`${product.brand} ${product.name}`}
            />
          </div>
        </div>

        <p className="measure mt-2.5 text-sm leading-relaxed text-quiet-light">
          {product.shortDescription}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ProductBadges product={product} limit={3} />
          <p className="flex flex-wrap gap-x-4 text-sm text-quiet-light">
            <span>{AVAILABILITY_LABEL[availability]}</span>
            <span>SKU {product.sku}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function LayoutButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`grid h-12 w-11 place-items-center transition-colors ${
        active ? 'bg-ink text-paper' : 'text-quiet-light hover:text-ink'
      }`}
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

/**
 * The whole filter panel is rendered twice — once as the desktop sidebar and
 * once inside the mobile drawer — so every control inside it must generate its
 * own id rather than hard-coding one, or the two copies collide and the visible
 * label points at the hidden input.
 */
function BudgetSlider({
  maxPrice,
  onChange,
}: {
  maxPrice: number | null;
  onChange: (value: number | null) => void;
}) {
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="block text-sm text-quiet-light">
        Up to {maxPrice !== null ? formatPrice(maxPrice) : 'any price'}
      </label>
      <input
        id={id}
        type="range"
        min={5000}
        max={PRICE_CEILING}
        step={5000}
        value={maxPrice ?? PRICE_CEILING}
        onChange={(event) => {
          const value = Number(event.target.value);
          onChange(value >= PRICE_CEILING ? null : value);
        }}
        className="mt-3 h-11 w-full accent-[var(--color-burgundy)]"
      />
    </>
  );
}

function FilterGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-sans text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-[1.15rem] w-[1.15rem] shrink-0 accent-[var(--color-burgundy)]"
      />
      <span className={checked ? 'font-medium' : 'text-quiet-light'}>{label}</span>
    </label>
  );
}
