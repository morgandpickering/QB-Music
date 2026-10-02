# Quattlebaum Music

Website for Quattlebaum Music — instruments, lessons, repairs, and professional
audio, from a shop at 101 W. Arch St. in downtown Searcy, Arkansas.

**Read [PENDING.md](PENDING.md) before deploying.** Several things are
deliberately unfinished because they need information or credentials I do not
have, and the site is built so that unverified facts simply do not render rather
than being guessed at.

Design decisions are recorded in [DESIGN.md](DESIGN.md).

## Running it

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` first. The defaults run the store against a
mock payment provider that moves no money and refuses to start in production.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:commerce` | 16 checks on pricing authority and webhook verification (needs a running server) |
| `npm run check:a11y` | Structural accessibility across every route (needs a running server) |
| `npm run check:links` | Crawls every internal link and fails on anything but a 200 (needs a running server) |

The three checks that need a server expect it on port 3100 — `npm run dev -- -p
3100` — or set `BASE_URL`.

Run `check:commerce` against the **dev** server specifically. The mock payment
provider refuses to start under `NODE_ENV=production` — that is the guard
stopping the store from shipping while pretending to take money — so every
checkout call against a production build answers 502 by design.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Zod ·
`clsx` + `tailwind-merge`.

That is the whole dependency list. No animation library, no UI kit, no
carousel, no combobox package — the motion is CSS and one canvas, the shelves
are native scroll-snap, the mobile menu is `<details>`, the dialogs are
hand-built, and the components are the ones this site actually needs.

### Registry components

The project is configured as a shadcn registry client (`components.json`), and
`components/ui/` holds anything installed from a registry. Exactly one thing
is:

| Component | From | Used by |
| --- | --- | --- |
| `marquee` | Magic UI | The homepage brand strip |

`clsx` and `tailwind-merge` exist only so registry components install and
update cleanly against the `cn()` helper they expect at `@/lib/utils`. Nothing
the site wrote itself uses `cn` — those files use template literals.

To add another:

```bash
npx shadcn@latest add @magicui/<name>
# or any registry URL
npx shadcn@latest add "https://magicui.design/r/<name>.json"
```

Registry components land unstyled-for-us. Restyle them to the tokens in
`globals.css` rather than importing a second palette, and check the result
against `prefers-reduced-motion` — most registry motion components do not
handle it, and everything else on this site does.

## How it is organised

```
src/
  app/                    Routes. One folder per URL.
    shop/                 Catalogue, and /shop/[category]
    product/[slug]/       Product detail
    used/ brands/         Used & vintage shelf, brand index
    search/ wishlist/     Results page, saved items
    policies/[slug]/      Shipping, returns, privacy, terms
    api/                  Checkout, payment webhook, enquiries, newsletter
  components/
    media/                Photo + the drawn fallback plates
    home/                 Hero strings, category grid, benefit strip, brand wall
    site/                 SiteHeader, Footer, CartDrawer, MapPanel, search
    store/                ProductCard, StoreBrowser, QuickView, gallery, badges
    ui/                   Section, PageHero, Button, Reveal
    forms/                Field primitives and the shared enquiry form
  config/                 Business facts, navigation, services, policies. Edit these.
  lib/
    products/             The product model, seed catalogue, and repository
    commerce/             Server-side pricing and order records
    payments/             Provider contract + the development mock
    cart/                 Client cart state
    wishlist/             Client wishlist state
    server/               Validation schemas and rate limiting
```

### Routes

`/` · `/shop` · `/shop/[category]` · `/product/[slug]` · `/used` · `/brands` ·
`/search` · `/wishlist` · `/account` · `/lessons` · `/repairs` · `/pro-audio` ·
`/about` · `/contact` · `/cart` · `/checkout` · `/policies/[slug]`

### The rules worth knowing

**One source of truth per thing.** Business facts live in
`config/business.ts`, products in `lib/products/repository.ts`, navigation in
`config/navigation.ts`, policy pages in `config/policies.ts`. Adding a page is
one array entry — the header, the mega menus, the mobile drawer, the footer and
the sitemap all follow, and `npm run check:links` catches a slug that does not
resolve.

**A product's id is its stock number.** `QM-EG-1102` is the number on the tag,
and it is also what the cart, the wishlist, and the checkout API address. An id
that is a position in an array changes meaning when somebody reorders the
catalogue file, silently repointing every saved cart at the wrong instrument.

**The server decides what things cost.** The browser posts product ids and
quantities. It never posts prices, and anything price-shaped arriving from a
client is discarded. `lib/commerce/pricing.ts` recomputes every amount from the
repository, and that is the only figure a payment provider sees.

**An order is only paid when a signed webhook says so.** A browser landing on
`/order-success` proves nothing. `lib/payments/provider.ts` requires every
implementation to verify its webhook cryptographically against the raw body,
and the captured amount is checked against our own total before an order is
marked paid. Both properties are covered by `npm run check:commerce`.

**No card details ever touch this codebase.** There is no card field anywhere in
it, and there should never be one. Payment is collected on the provider's own
hosted surface.

**Unverified is absent.** A `null` in `config/business.ts` means nobody has
confirmed it, so it is omitted from the page *and* from the structured data
rather than published as a guess.

## Connecting a payment provider

1. Write one file next to `src/lib/payments/mock.ts` implementing
   `PaymentProvider`.
2. Add its id to the switch in `src/lib/payments/index.ts`.
3. Set `PAYMENT_PROVIDER`, `PAYMENT_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET`, and
   `NEXT_PUBLIC_PAYMENT_PUBLIC_KEY`.
4. Point the provider's webhook at `/api/webhooks/payment`.
5. Delete `src/app/checkout/simulate/`.

No page or component changes. Only variables prefixed `NEXT_PUBLIC_` reach the
browser; `src/lib/payments/index.ts` imports `server-only`, so importing it from
a client component is a build error rather than a leak.
