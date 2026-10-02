'use client';

import { Dialog as SheetPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Sheet — a dialog anchored to an edge. Radix behaviour, Quattlebaum styling.
 *
 * Used for the cart, the mobile filters and the mobile navigation. All three
 * were previously hand-built panels that stayed mounted and were hidden with
 * `inert` plus a transform, which meant each one had its own partial answer to
 * focus, Escape and scroll-locking, and the closed panel still occupied
 * layout — the cart drawer was widening the document on phones.
 *
 * Radix unmounts the panel when closed and handles all of it in one place.
 *
 * `side` controls the edge. The bottom sheet is what the filters use on a
 * phone, because a thumb reaches the bottom of a screen and not the top.
 */

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

const sides = {
  right:
    'inset-y-0 right-0 h-full w-full max-w-[27rem] border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left: 'inset-y-0 left-0 h-full w-full max-w-[22rem] border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  bottom:
    'inset-x-0 bottom-0 max-h-[88dvh] border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  top: 'inset-x-0 top-0 max-h-[88dvh] border-b data-[state=open]:slide-in-from-top data-[state=closed]:slide-out-to-top',
} as const;

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-[70] bg-ink/60',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = 'right',
  /** `ink` for navigation, `paper` for the cart and the filters. */
  tone = 'paper',
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: keyof typeof sides;
  tone?: 'paper' | 'ink';
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        className={cn(
          'fixed z-[71] flex flex-col outline-none',
          'transition ease-[var(--ease-out-soft)] data-[state=closed]:duration-200 data-[state=open]:duration-300',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
          tone === 'ink'
            ? 'border-rule-dark bg-ink text-paper'
            : 'on-light border-rule-light bg-paper text-ink',
          sides[side],
          className,
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
