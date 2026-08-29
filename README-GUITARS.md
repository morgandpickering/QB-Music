# Guitars Catalog Page — Going Live

`guitars.html` is a working demo: real layout, fake inventory, fake "Buy Now"
links. Here's what to do to make it real.

## 1. Replace the four sample listings

Each guitar is one `.product-card` block in `guitars.html`. Duplicate the
block for every real instrument you want listed, and for each one update:

- The photo — replace the `<div class="product-photo">...</div>` placeholder
  with `<img src="..." alt="...">` of the real instrument (a plain phone
  photo on a clean background works fine).
- `<h3>` — the guitar's name/model
- `.product-spec` — a one-line description (wood, pickups, condition, etc.)
- `.product-price` — the price
- `.product-badge` — "In Stock", "Only 1 Left", "Sold", etc.

Delete `guitars.html`'s `.notice-banner` div once the listings are real —
it's only there to mark this as a demo.

## 2. Connect a real payment method per listing

Pick **one** of these per guitar, based on what you already use (or want to
start using). None of them require you to build or host a checkout —
you paste a link, the provider handles the actual charge.

### Stripe Payment Links (recommended if you don't already use something else)
1. Create a free account at stripe.com and verify your business/bank details.
2. Dashboard → Payment Links → add a product with the guitar's name, price,
   and photo.
3. Stripe gives you a URL like `https://buy.stripe.com/xxxxxxxx`.
4. In `guitars.html`, replace that card's `<a href="#" class="btn btn-buy
   btn-stripe">` href with that URL.

### Square Online Checkout Links
1. If you already take Square in-store, you already have an account.
2. Square Dashboard → Items → add the guitar, then Online → Checkout Links
   to generate a purchase link for that item.
3. Swap it into the matching `btn-square` button's `href`.

### PayPal Buy Now Buttons
1. In your PayPal Business account: Pay & Get Paid → PayPal Buttons →
   Buy Now.
2. Set the item name and price, generate the button, and copy the payment
   URL it gives you (not the embed code — just the URL is enough for a
   plain link).
3. Swap it into the matching `btn-paypal` button's `href`.

### No online payment yet
Leave (or copy) the "Call to Reserve" pattern — a plain `tel:` link — for
any item you're not ready to sell online. That's a legitimate permanent
choice too, not just a placeholder; plenty of stores keep high-value or
one-of-a-kind instruments as call/in-store-only.

## 3. A note on inventory accuracy

None of the three payment options above check your in-store stock — if a
guitar sells in person, the online listing and buy button will still work
until you edit the page. For a handful of items, updating `guitars.html` by
hand when something sells is realistic. If the catalog grows past ~15–20
items or turns over quickly, that manual upkeep becomes the real bottleneck
— at that point it's worth moving to a platform with built-in inventory
sync (Shopify, Square Online Store, BigCommerce) instead of hand-edited
HTML.
