'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Photo } from '@/components/media/Photo';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { PlateKind, ProductImage } from '@/lib/products/types';

/**
 * Product gallery.
 *
 * A guitar photographed properly has fifteen or twenty shots of it — front,
 * back, headstock, serial, every ding — so the thumbnail strip scrolls rather
 * than wrapping into a block that pushes the price below the fold. The strip
 * is a real tablist, so a keyboard moves through it with arrow keys.
 *
 * Two ways to look closer, because they suit different people: hovering the
 * main image magnifies the spot under the pointer, and clicking it opens a
 * fullscreen view with the arrow keys wired up. The magnifier is off for
 * touch (where there is no pointer to follow) and for anyone who has asked
 * for reduced motion.
 */

const ZOOM = 2.1;

export function ProductGallery({
  images,
  plate,
  name,
}: {
  images: ProductImage[];
  plate: PlateKind;
  name: string;
}) {
  const shots = images.length > 0 ? images : [{ src: null, alt: name }];
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [origin, setOrigin] = useState<string | null>(null);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  // Set by the arrow-key handler so the effect below knows to move focus,
  // not just scroll — a click already focuses its own button.
  const focusOnChange = useRef(false);

  const safeIndex = Math.min(index, shots.length - 1);
  const active = shots[safeIndex];

  const step = useCallback(
    (delta: number) => setIndex((i) => (i + delta + shots.length) % shots.length),
    [shots.length],
  );

  /* ---- Magnifier ------------------------------------------------- */

  const onMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  /* ---- Lightbox -------------------------------------------------- */
  // Escape, focus entry/return, and background scroll-lock are Radix's job
  // (see components/ui/dialog.tsx); only the arrow-key stepping is ours.

  const onLightboxKey = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
  };

  // Keep the selected thumbnail in view when the arrow keys move it, and move
  // focus along with it — a roving tablist should never leave focus behind
  // on a tab that is no longer selected.
  useEffect(() => {
    const strip = stripRef.current;
    const tab = strip?.children[safeIndex];
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focusOnChange.current) {
      focusOnChange.current = false;
      (tab as HTMLElement | undefined)?.focus();
    }
  }, [safeIndex]);

  const onThumbKey = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusOnChange.current = true;
      step(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusOnChange.current = true;
      step(-1);
    }
  };

  return (
    <div>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setLightbox(true)}
        onMouseMove={onMove}
        onMouseLeave={() => setOrigin(null)}
        className="group relative block w-full cursor-zoom-in overflow-hidden bg-parchment"
      >
        <Photo
          src={active.src}
          alt={active.alt}
          plate={plate}
          tone="light"
          ratio="4 / 5"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority
          fit="contain"
          grain={false}
          imgClassName="transition-transform duration-[var(--dur-base)] ease-out motion-reduce:transform-none"
        />

        {/* The magnifier is a second copy of the image scaled about the
            cursor. Painting it over the first avoids fighting the layout. */}
        {origin && active.src && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-parchment bg-no-repeat opacity-0 transition-opacity duration-200 group-hover:opacity-100 lg:block"
            style={{
              backgroundImage: `url(${active.src})`,
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: origin,
            }}
          />
        )}

        <span className="pointer-events-none absolute bottom-3 right-3 bg-ink/80 px-3 py-1.5 text-xs font-medium text-paper">
          {shots.length > 1 ? `${safeIndex + 1} / ${shots.length} · ` : ''}Tap to enlarge
        </span>
      </button>

      {shots.length > 1 && (
        <div
          ref={stripRef}
          role="tablist"
          aria-label={`More views of ${name}`}
          onKeyDown={onThumbKey}
          className="rail mt-4 gap-3 [grid-auto-columns:5rem]"
        >
          {shots.map((shot, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              // Only the selected tab is in the tab order; the arrow keys move
              // between them, which is how a tablist is meant to behave.
              tabIndex={i === safeIndex ? 0 : -1}
              aria-label={shot.alt}
              onClick={() => setIndex(i)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden bg-parchment transition-opacity ${
                i === safeIndex
                  ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper'
                  : 'opacity-65 hover:opacity-100'
              }`}
            >
              <Photo
                src={shot.src}
                alt=""
                plate={plate}
                tone="light"
                ratio="1 / 1"
                sizes="80px"
                fit="contain"
                grain={false}
              />
            </button>
          ))}
        </div>
      )}

      {/* ---- Fullscreen ------------------------------------------- */}
      {/* Radix Dialog: focus entry/containment, Escape, background scroll
          lock and aria-hidden are handled by components/ui/dialog.tsx. Only
          the arrow-key stepping between images is ours. */}
      <Dialog open={lightbox} onOpenChange={setLightbox}>
        <DialogContent
          showClose={false}
          tone="ink"
          onKeyDown={onLightboxKey}
          // Belt-and-braces: explicit rather than trusting Radix's default
          // restore, which was unreliable for a plain controlled trigger
          // (no <DialogTrigger>) in testing.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
          }}
          className="inset-0 left-0 top-0 h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 border-none bg-ink/95"
        >
          <DialogTitle className="sr-only">
            {name}, image {safeIndex + 1} of {shots.length}
          </DialogTitle>
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-paper">
              <p className="text-sm tabular-nums text-quiet-dark">
                {safeIndex + 1} / {shots.length}
              </p>
              <DialogClose className="grid h-11 w-11 place-items-center text-paper">
                <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="sr-only">Close full screen</span>
              </DialogClose>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
              {shots.length > 1 && (
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="absolute left-3 z-10 grid h-12 w-12 place-items-center border border-rule-dark bg-ink/70 text-paper transition-colors hover:border-brass-light"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M11 3 5 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">Previous image</span>
                </button>
              )}

              <div className="h-full max-h-full w-full max-w-4xl">
                <div className="relative h-full w-full">
                  <Photo
                    src={active.src}
                    alt={active.alt}
                    plate={plate}
                    tone="dark"
                    sizes="100vw"
                    grain={false}
                    fill
                    imgClassName="object-contain"
                  />
                </div>
              </div>

              {shots.length > 1 && (
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="absolute right-3 z-10 grid h-12 w-12 place-items-center border border-rule-dark bg-ink/70 text-paper transition-colors hover:border-brass-light"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">Next image</span>
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
