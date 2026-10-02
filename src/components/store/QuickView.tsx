'use client';

import Link from 'next/link';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Photo } from '@/components/media/Photo';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/lib/cart/CartProvider';
import { cartLineFor } from '@/lib/cart/line';
import {
  AVAILABILITY_LABEL,
  CONDITION_LABEL,
  availabilityOf,
  canAddToCart,
  effectivePrice,
  formatPrice,
  isOnSale,
  savingOf,
  type Product,
} from '@/lib/products/types';
import { ProductBadges } from './ProductBadges';
import { QuantityStepper } from './QuantityStepper';
import { WishlistButton } from './WishlistButton';

/**
 * Quick View.
 *
 * One dialog for the whole page rather than one per card: a grid of forty
 * products should not ship forty hidden dialogs, and only one can ever be
 * open. Cards call `open(product)` and hand over the product they already
 * have, so opening costs no request and no navigation.
 *
 * It is deliberately not the product page in a box. It answers "is this the
 * one?" — picture, price, stock, a sentence, and a way to buy it — and hands
 * off to the real page for specifications and the full gallery.
 */

interface QuickViewContextValue {
  open: (product: Product) => void;
  close: () => void;
  product: Product | null;
}

const QuickViewContext = createContext<QuickViewContextValue | null>(null);

export function QuickViewProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Product | null>(null);
  // Whatever was focused when the dialog opened, so closing can return focus
  // there explicitly — Radix's own restore was unreliable for a dialog with
  // no <DialogTrigger> in testing, so this is a deliberate belt-and-braces.
  const opener = useRef<HTMLElement | null>(null);

  const open = useCallback((next: Product) => {
    opener.current = document.activeElement as HTMLElement | null;
    setProduct(next);
  }, []);
  const close = useCallback(() => setProduct(null), []);

  const value = useMemo(() => ({ open, close, product }), [open, close, product]);

  return (
    <QuickViewContext.Provider value={value}>
      {children}
      <QuickViewDialog product={product} onClose={close} opener={opener} />
    </QuickViewContext.Provider>
  );
}

export function useQuickView(): QuickViewContextValue {
  const ctx = useContext(QuickViewContext);
  if (!ctx) throw new Error('useQuickView must be used inside <QuickViewProvider>.');
  return ctx;
}

/* ------------------------------------------------------------------ */

function QuickViewDialog({
  product,
  onClose,
  opener,
}: {
  product: Product | null;
  onClose: () => void;
  opener: React.RefObject<HTMLElement | null>;
}) {
  const { add, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const isOpen = product !== null;

  // A new product means a fresh quantity — otherwise opening a second card
  // inherits "3" from the first one.
  useEffect(() => setQuantity(1), [product?.id]);

  // Keep showing the last product while the dialog animates closed, rather
  // than the content going blank a beat before the panel itself is gone.
  const [shown, setShown] = useState<Product | null>(null);
  useEffect(() => {
    if (product) setShown(product);
  }, [product]);

  const availability = shown ? availabilityOf(shown) : 'in-stock';
  const maxQuantity = shown ? Math.min(shown.inventory, 10) : 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showClose={false}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          opener.current?.focus();
        }}
        className="max-h-[92dvh] w-full overflow-y-auto p-0 sm:max-w-3xl"
      >
        <DialogClose className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center bg-paper/85 text-ink">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M4 4l10 10M14 4L4 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Close quick view</span>
        </DialogClose>

        {shown && (
          <div className="grid sm:grid-cols-2">
            <div className="relative bg-parchment">
              <Photo
                src={shown.images[0]?.src ?? null}
                alt={shown.images[0]?.alt ?? `${shown.brand} ${shown.name}`}
                plate={shown.plate}
                tone="light"
                ratio="1 / 1"
                sizes="(min-width: 640px) 24rem, 100vw"
                fit="contain"
                grain={false}
              />
              <ProductBadges product={shown} limit={3} className="absolute left-3 top-3" />
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <p className="text-xs tracking-[0.04em] text-quiet-light">{shown.brand}</p>
              <DialogTitle asChild>
                <h2 className="mt-1.5 font-display text-2xl leading-tight">{shown.name}</h2>
              </DialogTitle>

              <p className="mt-4 flex items-baseline gap-3 tabular-nums">
                <span className="text-xl">{formatPrice(effectivePrice(shown))}</span>
                {isOnSale(shown) && (
                  <>
                    <span className="text-sm text-quiet-light line-through">
                      {formatPrice(shown.price)}
                    </span>
                    <span className="text-sm text-burgundy">
                      Reduced by {formatPrice(savingOf(shown))}
                    </span>
                  </>
                )}
              </p>

              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-quiet-light">
                <span>{CONDITION_LABEL[shown.condition]}</span>
                <span>{AVAILABILITY_LABEL[availability]}</span>
                <span className="whitespace-nowrap">SKU {shown.sku}</span>
              </p>

              <p className="mt-5 text-[0.9375rem] leading-relaxed text-quiet-light">
                {shown.shortDescription}
              </p>

              <div className="mt-auto pt-7">
                {shown.enquiryOnly ? (
                  <Link
                    href={`/contact?topic=product&item=${encodeURIComponent(shown.slug)}`}
                    className="flex min-h-12 w-full items-center justify-center rounded-[var(--radius-xs)] bg-ink px-6 font-medium text-paper transition-colors hover:bg-walnut"
                  >
                    Ask about this instrument
                  </Link>
                ) : availability === 'out-of-stock' ? (
                  <p className="border-t border-rule-light pt-5 font-medium">
                    Sold out. Ask us and we will tell you how long another would take.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <QuantityStepper
                      value={quantity}
                      onChange={(q) => setQuantity(Math.min(Math.max(q, 1), maxQuantity))}
                      label={`Quantity of ${shown.brand} ${shown.name}`}
                      max={maxQuantity}
                    />
                    <button
                      type="button"
                      disabled={!canAddToCart(shown)}
                      onClick={() => {
                        add(cartLineFor(shown, quantity));
                        onClose();
                        openCart();
                      }}
                      className="min-h-12 flex-1 rounded-[var(--radius-xs)] bg-ink px-6 font-medium text-paper transition-colors hover:bg-walnut disabled:opacity-50"
                    >
                      Add to cart
                    </button>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link
                    href={`/product/${shown.slug}`}
                    className="link-draw font-medium"
                    onClick={onClose}
                  >
                    View full details
                  </Link>
                  <WishlistButton
                    productId={shown.id}
                    productName={`${shown.brand} ${shown.name}`}
                    variant="icon"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
