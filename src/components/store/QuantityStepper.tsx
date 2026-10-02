'use client';

import { useId } from 'react';
import { MAX_QUANTITY_PER_LINE } from '@/lib/cart/CartProvider';

/**
 * Quantity control. A real labelled number input with stepper buttons either
 * side, so it works with a keyboard, a screen reader, and a thumb. Both
 * buttons clear 44px.
 */
export function QuantityStepper({
  value,
  onChange,
  label,
  max = MAX_QUANTITY_PER_LINE,
}: {
  value: number;
  onChange: (quantity: number) => void;
  label: string;
  max?: number;
}) {
  // useId, not a slug of the label: the cart drawer and the cart page render a
  // stepper for the same product at the same time, and a label-derived id would
  // collide and point the visible label at the hidden input.
  const id = useId();

  return (
    <div className="inline-flex items-center border border-rule-light">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="grid h-11 w-11 place-items-center transition-colors hover:bg-parchment disabled:opacity-35"
      >
        <span aria-hidden="true">−</span>
        <span className="sr-only">Decrease quantity</span>
      </button>

      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(next)) onChange(next);
        }}
        className="h-11 w-12 border-x border-rule-light bg-transparent text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        className="grid h-11 w-11 place-items-center transition-colors hover:bg-parchment disabled:opacity-35"
      >
        <span aria-hidden="true">+</span>
        <span className="sr-only">Increase quantity</span>
      </button>
    </div>
  );
}
