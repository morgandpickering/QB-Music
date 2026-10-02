'use client';

import { useEffect } from 'react';
import { useCart } from '@/lib/cart/CartProvider';

/**
 * Empties the cart once an order is confirmed paid.
 *
 * Rendered only by the confirmation page, and only when the server says the
 * order is paid, so abandoning the payment step leaves the cart intact.
 */
export function ClearCartOnPaid() {
  const { clear, hydrated } = useCart();

  useEffect(() => {
    if (hydrated) clear();
  }, [hydrated, clear]);

  return null;
}
