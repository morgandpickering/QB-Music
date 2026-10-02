'use client';

import { Dialog as DialogPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Dialog — Radix behaviour, Quattlebaum styling.
 *
 * Installed from the shadcn registry and then restyled: the generated version
 * arrived carrying another design system's greys, radii and shadows, which
 * would have put a second palette in the codebase. What was worth keeping is
 * the part underneath, and it is the reason this file exists rather than the
 * hand-rolled dialogs it replaces:
 *
 *   - focus moves into the dialog on open and returns to the trigger on close
 *   - Tab and Shift+Tab are contained, including around dynamic content
 *   - Escape closes, and the overlay click closes
 *   - the page behind is scroll-locked and marked `aria-hidden`, so a screen
 *     reader cannot wander into it
 *
 * Every one of those was a bug in the versions this replaces. Radix is also
 * the reason the close button can live anywhere in the tree.
 */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;
const DialogTitle = DialogPrimitive.Title;
const DialogDescription = DialogPrimitive.Description;

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-[70] bg-ink/70',
        'data-[state=open]:animate-in data-[state=open]:fade-in-0',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  /** Renders the standard corner close button. Off for the gallery, which
   *  puts its own close control in a toolbar with the image counter. */
  showClose = true,
  /** `paper` (default) for ordinary dialogs; `ink` for the fullscreen
   *  gallery, so the focus ring stays amber-on-dark instead of the
   *  light-ground burgundy. */
  tone = 'paper',
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showClose?: boolean;
  tone?: 'paper' | 'ink';
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-[71] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2',
          tone === 'ink' ? 'bg-ink text-paper' : 'on-light bg-paper text-ink',
          'outline-none',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-[0.98]',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center bg-paper/85 text-ink transition-colors hover:bg-parchment">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                d="M4 4l10 10M14 4L4 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
