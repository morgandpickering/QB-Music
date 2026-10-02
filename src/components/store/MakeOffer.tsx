'use client';

import { useRef, useState } from 'react';
import { PhoneLink } from '@/components/site/StoreFacts';
import { Field, Select, TextArea } from '@/components/forms/Field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OFFER_EXPIRY_HOURS } from '@/lib/offers/rules';
import { formatPrice } from '@/lib/products/types';

/**
 * Make an Offer, for used and vintage pieces.
 *
 * Only the slug, the amount and contact details are sent — the price shown
 * here is for the shopper's benefit and the server ignores anything like it.
 * An offer is a conversation starter, not a purchase: no payment, no hold on
 * the item, and no automatic email (there is no mail provider yet), which the
 * terms say before anyone types a thing.
 */
export function MakeOffer({
  slug,
  name,
  listedCents,
  minimumCents,
  shippingAllowed,
}: {
  slug: string;
  name: string;
  listedCents: number;
  minimumCents: number;
  shippingAllowed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<{ reference: string; expiresAt: string } | null>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const sentRef = useRef<HTMLHeadingElement>(null);

  function onOpenChange(next: boolean) {
    setOpen(next);
    // Start fresh after a completed offer; keep a half-typed one otherwise.
    if (!next && state === 'sent') {
      setState('idle');
      setReceipt(null);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setFormError(null);
    setFields({});

    const payload = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), productSlug: slug };

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setFormError(result.error ?? 'That did not go through. Try again, or call the shop.');
        setFields(result.fields ?? {});
        setState('idle');
        requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }
      setReceipt({ reference: result.reference, expiresAt: result.expiresAt });
      setState('sent');
      requestAnimationFrame(() => sentRef.current?.focus());
    } catch {
      setFormError('We could not reach the shop. Check your connection, or call us.');
      setState('idle');
      requestAnimationFrame(() => errorRef.current?.focus());
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          ref={opener}
          type="button"
          className="flex min-h-13 w-full items-center justify-center rounded-[var(--radius-xs)] border border-rule-light px-6 py-4 font-medium transition-colors hover:border-ink"
        >
          Make an offer
        </button>
      </DialogTrigger>

      <DialogContent
        onCloseAutoFocus={(event) => {
          // See HANDOFF.md §3b: restore focus by hand, Radix's default is unreliable here.
          event.preventDefault();
          opener.current?.focus();
        }}
        className="max-h-[92dvh] overflow-y-auto p-6 sm:max-w-xl sm:p-8"
      >
        {state === 'sent' && receipt ? (
          <div role="status">
            <DialogTitle ref={sentRef} tabIndex={-1} className="pr-12 font-display text-2xl outline-none">
              Offer received.
            </DialogTitle>
            <DialogDescription className="measure mt-3 text-quiet-light">
              Reference <strong className="font-medium text-ink">{receipt.reference}</strong>. Someone
              at the shop reviews every offer by hand. If we accept or counter, we will contact you
              to finish the sale by phone or in store. This site does not send confirmation emails
              yet, so if you have not heard from us by{' '}
              {new Date(receipt.expiresAt).toLocaleString('en-US', {
                weekday: 'long',
                hour: 'numeric',
                minute: '2-digit',
              })}
              , the offer has lapsed. Call <PhoneLink className="font-medium text-ink" /> any time.
            </DialogDescription>
          </div>
        ) : (
          <>
            <DialogTitle className="pr-12 font-display text-2xl">Make an offer</DialogTitle>
            <DialogDescription className="mt-2 text-quiet-light">
              {name}, listed at {formatPrice(listedCents)}.
            </DialogDescription>

            <div className="mt-5 border-l-2 border-brass-deep bg-parchment px-5 py-4 text-[0.9375rem]">
              <p className="font-medium">How offers work</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-quiet-light">
                <li>An offer is not a purchase. No payment is taken here.</li>
                <li>
                  Staff review offers by hand. If we accept or counter, we contact you to finish the
                  sale by phone or in store.
                </li>
                <li>Making or accepting an offer does not hold the item. It can still sell.</li>
                <li>Offers lapse after {OFFER_EXPIRY_HOURS} hours without an answer.</li>
                <li>No confirmation email is sent. Your details are used only to answer this offer.</li>
              </ul>
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-6">
              {formError && (
                <div
                  ref={errorRef}
                  tabIndex={-1}
                  role="alert"
                  className="mb-6 border-l-2 border-danger bg-parchment px-5 py-4 outline-none"
                >
                  <p className="font-medium">{formError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  name="amount"
                  label="Your offer, in dollars"
                  inputMode="decimal"
                  autoComplete="off"
                  required
                  hint={`Between ${formatPrice(minimumCents)} and ${formatPrice(listedCents)}.`}
                  error={fields.amount}
                  className="sm:col-span-2"
                />
                <Field name="name" label="Your name" autoComplete="name" required error={fields.name} />
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  error={fields.email}
                />
                <Field name="phone" label="Phone" type="tel" autoComplete="tel" error={fields.phone} />
                {shippingAllowed ? (
                  <Select
                    name="fulfillment"
                    label="If we agree"
                    required
                    defaultValue="pickup"
                    options={[
                      { value: 'pickup', label: 'I will collect in Searcy' },
                      { value: 'shipping', label: 'I would want it shipped' },
                    ]}
                    error={fields.fulfillment}
                  />
                ) : (
                  <div>
                    <p className="text-[0.9375rem] font-medium">If we agree</p>
                    <p className="mt-2 text-[0.9375rem] text-quiet-light">
                      Collection only, from the shop in Searcy.
                    </p>
                    <input type="hidden" name="fulfillment" value="pickup" />
                  </div>
                )}
                <TextArea
                  name="message"
                  label="Anything we should know"
                  rows={3}
                  maxLength={1000}
                  error={fields.message}
                  className="sm:col-span-2"
                />
              </div>

              <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
                <label htmlFor="offer-website-field">Leave this empty</label>
                <input id="offer-website-field" name="website" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="mt-6">
                <label className="flex gap-3 text-[0.9375rem]">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    required
                    aria-invalid={fields.acceptTerms ? true : undefined}
                    aria-describedby={fields.acceptTerms ? 'offer-terms-error' : undefined}
                    className="mt-1 h-5 w-5 shrink-0 accent-ink"
                  />
                  <span>I understand an offer is not a purchase and does not hold the item.</span>
                </label>
                {fields.acceptTerms && (
                  <p id="offer-terms-error" className="mt-2 text-sm text-danger">
                    <span className="font-medium">Error:</span> {fields.acceptTerms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={state === 'sending'}
                className="mt-7 min-h-13 w-full rounded-[var(--radius-xs)] bg-ink px-8 py-4 font-medium text-paper transition-colors hover:bg-walnut disabled:opacity-60"
              >
                {state === 'sending' ? 'Sending offer…' : 'Send offer'}
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
