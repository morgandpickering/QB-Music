'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HeaderSearch } from '@/components/site/HeaderSearch';
import { Wordmark } from '@/components/site/Wordmark';
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { business } from '@/config/business';
import {
  PRIMARY_NAV,
  UTILITY_LINKS,
  type NavItem,
} from '@/config/navigation';
import { useCart } from '@/lib/cart/CartProvider';
import type { SearchEntry } from '@/lib/products/repository';
import { useWishlist } from '@/lib/wishlist/WishlistProvider';

/**
 * The masthead.
 *
 * Three tiers, in the order a shop actually needs them:
 *
 *   1. A utility strip — pickup, telephone, the service pages. The things
 *      somebody is looking for when they are not shopping.
 *   2. The masthead proper — the name, a search field wide enough to be
 *      taken seriously, and the wishlist and cart.
 *   3. Departments, with mega menus.
 *
 * Solid at every scroll position. An earlier version dissolved over the
 * homepage hero, which is a nice trick on a brochure site and the wrong call
 * on a shop: the search field is the most used control on the page and it
 * should not be a guess about what is behind it.
 *
 * Mega panels open on hover and on focus. They carry no `aria-expanded`,
 * because the top-level item is a real link to a real page rather than a
 * button pretending to be one, and they are `inert` while closed so they are
 * never a hidden tab stop.
 */

const CLOSE_DELAY = 120;

export function SiteHeader({ searchIndex }: { searchIndex: SearchEntry[] }) {
  const pathname = usePathname();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);

  const { count, openCart, addPulse, hydrated } = useCart();
  const wishlist = useWishlist();

  const closeTimer = useRef<number | undefined>(undefined);
  const menuToggleRef = useRef<HTMLButtonElement | null>(null);

  /* ---- Mega menu open/close ------------------------------------- */

  const openMega = useCallback((index: number) => {
    window.clearTimeout(closeTimer.current);
    setOpenIndex(index);
  }, []);

  const closeMega = useCallback((immediate = false) => {
    window.clearTimeout(closeTimer.current);
    if (immediate) setOpenIndex(null);
    else closeTimer.current = window.setTimeout(() => setOpenIndex(null), CLOSE_DELAY);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // Any navigation closes everything that was open.
  useEffect(() => {
    setOpenIndex(null);
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMega(true);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openIndex, closeMega]);

  /* ---- Cart badge pulse ----------------------------------------- */

  useEffect(() => {
    if (addPulse === 0) return;
    setPulsing(true);
    const t = window.setTimeout(() => setPulsing(false), 420);
    return () => window.clearTimeout(t);
  }, [addPulse]);

  /* ---- Mobile drawer -------------------------------------------- */
  // A left Sheet. Radix handles focus entry/containment, Escape, background
  // scroll-lock and aria-hidden — see components/ui/sheet.tsx.

  const isActive = (href: string) => {
    const path = href.split('?')[0];
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const wishlistCount = wishlist.hydrated ? wishlist.count : 0;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:bg-amber focus:px-5 focus:py-3 focus:font-medium focus:text-ink"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 bg-ink text-paper">
        {/* ---- Utility strip ---------------------------------------- */}
        <div className="border-b border-rule-dark/70 bg-walnut">
          <div className="shell flex h-9 items-center justify-between gap-6 text-2xs sm:text-xs">
            <p className="flex items-center gap-2 text-quiet-dark">
              <PickupIcon />
              <span>Free local pickup in downtown Searcy</span>
            </p>

            <div className="flex items-center gap-5">
              <ul className="hidden items-center gap-5 md:flex">
                {UTILITY_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="link-draw text-quiet-dark transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              {business.phoneDisplay && business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="font-medium text-brass-light transition-colors hover:text-amber"
                >
                  <span className="hidden sm:inline">Call us: </span>
                  {business.phoneDisplay}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ---- Masthead --------------------------------------------- */}
        <div className="shell flex h-[4.5rem] items-center gap-4 lg:h-20 lg:gap-8">
          <Link
            href="/"
            className="shrink-0 text-paper transition-opacity hover:opacity-80"
            aria-label="Quattlebaum Music, home"
          >
            <Wordmark responsive />
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <HeaderSearch index={searchIndex} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSearchOpen((open) => !open)}
              aria-expanded={mobileSearchOpen}
              aria-controls="mobile-search"
              className="grid h-11 w-11 place-items-center rounded-[var(--radius-xs)] text-paper/85 transition-colors hover:text-paper lg:hidden"
            >
              <SearchIcon />
              <span className="sr-only">{mobileSearchOpen ? 'Close search' : 'Search'}</span>
            </button>

            <Link
              href="/account"
              className="hidden h-11 items-center gap-2 rounded-[var(--radius-xs)] px-3 text-sm text-paper/85 transition-colors hover:text-paper sm:inline-flex"
            >
              <PersonIcon />
              {/* The word is hidden below xl to save room, so the name has to
                  come from somewhere — an icon-only link with no accessible
                  name is a link that announces as "link". */}
              <span className="hidden xl:inline">Account</span>
              <span className="sr-only xl:hidden">Account</span>
            </Link>

            <Link
              href="/wishlist"
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-xs)] px-2 text-sm text-paper/85 transition-colors hover:text-paper xl:px-3"
            >
              <Count value={wishlistCount} tone="quiet">
                <HeartIcon />
              </Count>
              <span aria-hidden="true" className="hidden xl:inline">Wishlist</span>
              <span className="sr-only">
                Wishlist, {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}
              </span>
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-xs)] px-2 text-sm text-paper/85 transition-colors hover:text-paper xl:px-3"
            >
              <Count value={hydrated ? count : 0} tone="loud" pulsing={pulsing}>
                <BagIcon />
              </Count>
              <span aria-hidden="true" className="hidden xl:inline">Cart</span>
              <span className="sr-only">Open cart</span>
            </button>

            {/*
              One status region for the whole header. The cart count changes
              without a navigation — adding from a card, from Quick View, from
              the drawer — so it has to be announced, and it is announced as a
              sentence rather than as a bare number. The wishlist deliberately
              does not get its own: two competing live regions on one bar talk
              over each other, and saving something is a deliberate act whose
              button already reports its own pressed state.
            */}
            <span role="status" aria-atomic="true" className="sr-only">
              {hydrated
                ? `${count} ${count === 1 ? 'item' : 'items'} in your cart`
                : ''}
            </span>

            <button
              ref={menuToggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="grid h-11 w-11 place-items-center rounded-[var(--radius-xs)] text-paper lg:hidden"
            >
              <MenuIcon open={menuOpen} />
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            </button>
          </div>
        </div>

        {/* Mobile search, opened from the masthead. */}
        <div id="mobile-search" hidden={!mobileSearchOpen} className="shell pb-4 lg:hidden">
          <HeaderSearch index={searchIndex} autoFocus />
        </div>

        {/* ---- Departments ------------------------------------------ */}
        <nav
          aria-label="Departments"
          className="relative hidden border-t border-rule-dark/70 lg:block"
          onMouseLeave={() => closeMega()}
        >
          <ul className="shell flex items-center gap-x-6 overflow-x-auto xl:gap-x-8">
            {PRIMARY_NAV.map((item, index) => (
              <li
                key={item.href + item.label}
                className="shrink-0"
                onMouseEnter={() => (item.mega ? openMega(index) : closeMega(true))}
                onFocus={() => (item.mega ? openMega(index) : closeMega(true))}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) closeMega();
                }}
              >
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`flex h-12 items-center whitespace-nowrap text-sm transition-colors ${
                    isActive(item.href)
                      ? 'text-brass-light'
                      : 'text-paper/85 hover:text-paper'
                  }`}
                >
                  {item.label}
                  {item.mega && <Chevron open={openIndex === index} />}
                </Link>

                {item.mega && (
                  <MegaPanel
                    item={item}
                    open={openIndex === index}
                    onClose={() => closeMega(true)}
                  />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* ---- Mobile drawer ------------------------------------------ */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          id="mobile-menu"
          side="left"
          tone="ink"
          className="lg:hidden"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            menuToggleRef.current?.focus();
          }}
        >
          <SheetTitle className="sr-only">Main menu</SheetTitle>
          <div className="flex h-[4.5rem] shrink-0 items-center justify-between border-b border-rule-dark px-5">
            <Wordmark />
            <SheetClose className="grid h-11 w-11 place-items-center text-paper">
              <MenuIcon open />
              <span className="sr-only">Close menu</span>
            </SheetClose>
          </div>

          <nav aria-label="Main, mobile" className="flex-1 overflow-y-auto px-5 py-4">
          <ul>
            {PRIMARY_NAV.map((item) =>
              item.mega ? (
                <li key={item.href + item.label} className="border-b border-rule-dark">
                  {/*
                    A native <details>: keyboard operable, announced as a
                    disclosure, and open/close costs no JavaScript at all.
                  */}
                  <details className="group/d">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-display text-xl text-paper marker:hidden [&::-webkit-details-marker]:hidden">
                      {item.label}
                      <Chevron open={false} className="transition-transform group-open/d:rotate-180" />
                    </summary>

                    <div className="pb-5">
                      <Link
                        href={item.href}
                        className="link-draw mb-3 inline-block text-sm font-medium text-brass-light"
                      >
                        All {item.label}
                      </Link>
                      {item.mega.columns.map((column) => (
                        <div key={column.heading} className="mt-3">
                          <p className="font-sans text-sm font-semibold text-brass-light">
                            {column.heading}
                          </p>
                          <ul className="mt-1">
                            {column.links.map((link) => (
                              <li key={link.href + link.label}>
                                <Link
                                  href={link.href}
                                  className="flex min-h-11 items-center text-[0.9375rem] text-paper/85"
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                </li>
              ) : (
                <li key={item.href + item.label} className="border-b border-rule-dark">
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`flex min-h-14 items-center font-display text-xl ${
                      isActive(item.href) ? 'text-brass-light' : 'text-paper'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-quiet-dark">
            {UTILITY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="link-draw">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/account" className="link-draw">
                Account
              </Link>
            </li>
          </ul>

          {business.phoneDisplay && business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="mt-8 flex min-h-13 items-center justify-center rounded-[var(--radius-xs)] bg-amber px-6 font-medium text-ink"
            >
              Call {business.phoneDisplay}
            </a>
          )}
        </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ------------------------------------------------------------------ */

function MegaPanel({
  item,
  open,
  onClose,
}: {
  item: NavItem;
  open: boolean;
  onClose: () => void;
}) {
  const mega = item.mega;
  if (!mega) return null;

  return (
    <div
      inert={!open}
      className={`absolute inset-x-0 top-full z-40 border-y border-rule-dark bg-ink transition-[opacity,transform] duration-[var(--dur-fast)] ease-[var(--ease-out-soft)] ${
        open
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
    >
      <div className="shell grid gap-x-10 gap-y-8 py-9 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {mega.columns.map((column) => (
              <div key={column.heading}>
                <p className="font-sans text-sm font-semibold text-brass-light">
                  {column.heading}
                </p>
                <ul className="mt-3 space-y-0.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className="link-draw inline-block py-1.5 text-[0.9375rem] text-paper/85 transition-colors hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {mega.brands && (
            <div className="mt-8 border-t border-rule-dark pt-6">
              <p className="font-sans text-sm font-semibold text-brass-light">
                Brands we stock
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {mega.brands.map((brand) => (
                  <li key={brand}>
                    <Link
                      href={`/shop?brand=${encodeURIComponent(brand)}`}
                      onClick={onClose}
                      className="inline-flex min-h-9 items-center border border-rule-dark px-3 text-sm text-paper/85 transition-colors hover:border-brass-light hover:text-brass-light"
                    >
                      {brand}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {mega.feature && (
          <div className="lg:col-span-4 lg:border-l lg:border-rule-dark lg:pl-10">
            <p className="marker text-brass-light">{mega.feature.label}</p>
            <p className="measure-narrow mt-3 text-[0.9375rem] leading-relaxed text-quiet-dark">
              {mega.feature.blurb}
            </p>
            <Link
              href={mega.feature.href}
              onClick={onClose}
              className="link-draw mt-4 inline-block text-[0.9375rem] font-medium text-paper"
            >
              Have a look
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The icon with its count sitting on the corner of it, rather than beside it.
 * Inline counts cost about 26px each, and four controls plus the wordmark do
 * not fit across a 375px masthead with that to spare. The number is decorative
 * here — each control states its own count in its `sr-only` label.
 */
function Count({
  value,
  tone,
  pulsing = false,
  children,
}: {
  value: number;
  tone: 'loud' | 'quiet';
  pulsing?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span className="relative grid place-items-center">
      {children}
      <span
        aria-hidden="true"
        className={`absolute -right-2 -top-1.5 grid h-[1.05rem] min-w-[1.05rem] place-items-center rounded-full px-1 text-2xs font-semibold leading-none tabular-nums transition-transform duration-300 ease-[var(--ease-out-soft)] ${
          value > 0
            ? tone === 'loud'
              ? 'bg-amber text-ink'
              : 'bg-rule-dark text-paper'
            : 'scale-0 bg-transparent text-transparent'
        } ${pulsing ? 'scale-125' : ''}`}
      >
        {value}
      </span>
    </span>
  );
}

/* ---- Icons -------------------------------------------------------- */

function Chevron({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`ml-1.5 transition-transform duration-[var(--dur-fast)] ${
        open ? 'rotate-180' : ''
      } ${className}`}
    >
      <path d="M1.5 3.5 5 7l3.5-3.5" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 16.5c.9-3 3.2-4.5 6-4.5s5.1 1.5 6 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.5S3 12.4 3 7.9A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7 2.3c0 4.5-7 8.6-7 8.6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 6h12l-1 11H5L4 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 8V5.5a2.5 2.5 0 0 1 5 0V8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PickupIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M2 6.5 8 2l6 4.5V14H2V6.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M6.2 9.2 7.6 10.6l2.6-2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d={open ? 'M5 5l12 12' : 'M3 7h16'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d={open ? 'M17 5L5 17' : 'M3 14h16'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
