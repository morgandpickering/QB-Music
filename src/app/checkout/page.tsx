'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Field } from '@/components/forms/Field';
import { useCart } from '@/lib/cart/CartProvider';
import { formatPrice } from '@/lib/products/types';

/**
 * Checkout.
 *
 * This page collects who you are and how you want the thing. It never touches
 * payment details: it posts ids and quantities to /api/checkout, the server
 * prices the order, and the customer is handed to the payment provider's own
 * surface. No card field has ever existed in this codebase and none should.
 *
 * Collection is the default. Quattlebaum is a shop people drive to.
 */
export default function CheckoutPage() {
  const { items, hydrated, subtotal, hasPickupOnlyItem, clear } = useCart();
  const [fulfillment, setFulfillment] = useState<'pickup' | 'shipping'>('pickup');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  // A collection-only item forces collection, and says so rather than
  // silently failing on the server.
  useEffect(() => {
    if (hasPickupOnlyItem) setFulfillment('pickup');
  }, [hasPickupOnlyItem]);

  const estimatedShipping = useMemo(() => {
    if (fulfillment === 'pickup') return 0;
    return subtotal >= 19900 ? 0 : 1495;
  }, [fulfillment, subtotal]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFields({});

    const data = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Note what is not here: no prices. The server decides those.
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          fulfillment,
          customer: {
            name: String(data.get('name') ?? ''),
            email: String(data.get('email') ?? ''),
            phone: String(data.get('phone') ?? ''),
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setFormError(payload.error ?? 'Something went wrong. Try again.');
        setFields(payload.fields ?? {});
        setSubmitting(false);
        return;
      }

      // The cart is cleared by the confirmation page once payment is confirmed,
      // not here — a customer who abandons the payment page keeps their cart.
      window.location.assign(payload.redirectUrl);
    } catch {
      setFormError('We could not reach the shop. Check your connection and try again.');
      setSubmitting(false);
    }
  }

  if (hydrated && items.length === 0) {
    return (
      <div className="bg-paper pb-24 pt-16 text-ink on-light md:pt-24">
        <div className="shell shell-tight">
          <h1 className="text-5xl">Checkout</h1>
          <p className="measure mt-6 text-lg text-quiet-light">
            There is nothing in your cart to check out.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex min-h-12 items-center rounded-[var(--radius-xs)] bg-ink px-7 font-medium text-paper transition-colors hover:bg-walnut"
          >
            Browse the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper pb-24 pt-16 text-ink on-light md:pt-24">
      <div className="shell">
        <h1 className="text-5xl">Checkout</h1>

        <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <div className="space-y-10">
            {formError && (
              <div role="alert" className="border-l-2 border-danger bg-parchment px-5 py-4">
                <p className="font-medium">{formError}</p>
              </div>
            )}

            <fieldset>
              <legend className="font-display text-2xl">How do you want it?</legend>

              <div className="mt-5 space-y-3">
                <FulfillmentChoice
                  value="pickup"
                  checked={fulfillment === 'pickup'}
                  onChange={() => setFulfillment('pickup')}
                  title="Collect from the shop"
                  detail="Pick up at Quattlebaum Music in downtown Searcy. Usually ready the same day, set up and tuned before you take it."
                  price="Free"
                />
                <FulfillmentChoice
                  value="shipping"
                  checked={fulfillment === 'shipping'}
                  onChange={() => setFulfillment('shipping')}
                  disabled={hasPickupOnlyItem}
                  title="Ship it to me"
                  detail={
                    hasPickupOnlyItem
                      ? 'Not available — one of the items in your cart is collection only.'
                      : 'Shipped across the US. Free on orders over $199.'
                  }
                  price={estimatedShipping === 0 ? 'Free' : formatPrice(1495)}
                />
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-display text-2xl">Who is it for?</legend>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Field
                  name="name"
                  label="Name"
                  autoComplete="name"
                  required
                  error={fields['customer.name']}
                  className="sm:col-span-2"
                />
                <Field
                  name="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  hint="We send the receipt and the collection details here."
                  error={fields['customer.email']}
                />
                <Field
                  name="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  hint="Optional. Handy if we need to ask something about the order."
                  error={fields['customer.phone']}
                />
              </div>
            </fieldset>

            <p className="measure text-sm text-quiet-light">
              Payment is taken on the next screen, on our payment provider&rsquo;s own
              secure page. Card details are never entered on this site and never
              reach our servers.
            </p>
          </div>

          <aside className="h-fit bg-parchment p-7 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl">Your order</h2>

            <ul className="mt-5 space-y-3 border-b border-rule-light pb-5 text-[0.9375rem]">
              {items.map((item) => (
                <li key={item.productId} className="flex justify-between gap-4">
                  <span>
                    {item.display.brand} {item.display.name}
                    {item.quantity > 1 && <span className="text-quiet-light"> × {item.quantity}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatPrice(item.display.unitAmount * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2.5">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>{fulfillment === 'pickup' ? 'Collection' : 'Shipping'}</dt>
                <dd className="tabular-nums">
                  {estimatedShipping === 0 ? 'Free' : formatPrice(estimatedShipping)}
                </dd>
              </div>
              <div className="flex justify-between text-quiet-light">
                <dt>Tax</dt>
                <dd>Added at payment</dd>
              </div>
            </dl>

            <p className="mt-5 border-t border-rule-light pt-4 text-sm text-quiet-light">
              Final prices are confirmed by the shop before payment is taken.
            </p>

            <button
              type="submit"
              disabled={submitting || !hydrated}
              className="mt-6 flex min-h-13 w-full items-center justify-center rounded-[var(--radius-xs)] bg-ink py-4 font-medium text-paper transition-colors hover:bg-walnut disabled:opacity-60"
            >
              {submitting ? 'Taking you to payment…' : 'Continue to payment'}
            </button>

            <Link href="/cart" className="link-draw mt-5 block text-center text-sm text-quiet-light">
              Back to cart
            </Link>
          </aside>
        </form>
      </div>
    </div>
  );
}

function FulfillmentChoice({
  value,
  checked,
  onChange,
  title,
  detail,
  price,
  disabled = false,
}: {
  value: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  detail: string;
  price: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-4 border p-5 transition-colors ${
        checked ? 'border-ink bg-parchment' : 'border-rule-light'
      } ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}
    >
      <input
        type="radio"
        name="fulfillment"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-[1.15rem] w-[1.15rem] shrink-0 accent-[var(--color-burgundy)]"
      />
      <span className="flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="font-medium">{title}</span>
          <span className="text-[0.9375rem] tabular-nums">{price}</span>
        </span>
        <span className="mt-1.5 block text-sm text-quiet-light">{detail}</span>
      </span>
    </label>
  );
}
