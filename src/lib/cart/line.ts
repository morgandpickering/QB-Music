import { effectivePrice, type Product } from '@/lib/products/types';
import type { CartItem } from './CartProvider';

/**
 * Builds the cart line for a product.
 *
 * One function rather than three copies, because the product page, the card's
 * quick-add, and Quick View all put the same thing in the basket and a drift
 * between them would show up as a price that changes depending on where you
 * clicked. The amount here is a *display* snapshot — the server re-prices
 * every line from the repository before a payment session exists.
 */
export function cartLineFor(product: Product, quantity = 1): CartItem {
  return {
    productId: product.id,
    quantity,
    display: {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      unitAmount: effectivePrice(product),
      plate: product.plate,
      image: product.images[0]?.src ?? null,
      imageAlt: product.images[0]?.alt ?? `${product.brand} ${product.name}`,
      pickupOnly: product.pickupOnly,
    },
  };
}
