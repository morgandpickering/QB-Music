# Quattlebaum Music — design system

*A modern music store with an old-school soul.*

This records what was actually built and why, so the next person extending the
site makes decisions consistent with it rather than inventing a second style.

---

## The idea

A real shop alternates light and shadow: dark walls hung with instruments,
bright windows, a lit bench at the back. The site is built the same way —
sections alternate between **ink** (dark) and **paper** (light) grounds down
every page. That rhythm, not decoration, is what makes it feel like a place
rather than a template.

One bold thing, quiet everywhere else: the boldness is spent on the **display
typography** and the **plucked-string hero**. Everything around them is
disciplined — hairline rules, no card shadows, no gradient decoration.

## Colour

Defined once in `src/app/globals.css` under `@theme`. Every text pairing below
was measured, not eyeballed.

| Token | Hex | Role | Contrast |
| --- | --- | --- | --- |
| `ink` | `#14100e` | Primary dark ground. A warm near-black — worn case lining, not blue-black | — |
| `walnut` | `#2b211b` | Secondary dark ground, tolex and wood | — |
| `oak` | `#6b4f34` | Natural wood mid-tone | 6.56:1 on paper |
| `paper` | `#f4efe6` | Primary light ground | 16.52:1 on ink |
| `parchment` | `#e5d9c6` | Secondary light ground, sheet music | 13.58:1 on ink |
| `brass` | `#a9803c` | Hardware. Large text and decoration only on light grounds | 3.14:1 on paper |
| `brass-deep` | `#7a5622` | Brass for small text on light | **5.76:1** |
| `brass-light` | `#c3a05a` | Brass for small text on dark | **6.36:1** |
| `amber` | `#e0a93f` | Amp glow. Primary CTA on dark, focus rings, the hero strings | **8.93:1** on ink |
| `burgundy` | `#6b2130` | Form accents, sale marks, focus on light | 9.73:1 on paper |
| `teal` | `#2c5a57` | Restrained functional accent (success) | 6.77:1 on paper |
| `quiet-dark` | `#b9aea0` | Secondary text on dark | **8.67:1** |
| `quiet-light` | `#5e554b` | Secondary text on light | **6.37:1** |

Two brass values exist deliberately. A single mid-brass cannot clear AA against
both paper and ink, and the alternative — using it anyway — fails real readers.

**Colour never carries meaning alone.** Availability, sale status, and form
errors always state the word: "Limited stock", "Reduced by $40.00", "Error:".

## Typography

**Fraunces** (display) — a variable serif with `SOFT` and `WONK` axes, drawn
after early-twentieth-century catalogue and wood-type faces. It has genuine
idiosyncrasy where Playfair merely has elegance, which is right for a shop with
a hand-painted sign. Used at `wght 600`, `SOFT 22`, `WONK 1` for headings; at
`SOFT 60–70` italic for the small `.marker` label and the wordmark's "Music".

**Archivo** (text) — a grotesque built for small sizes and dense information,
so prices, specifications, filters, and form labels stay sharp.

Both are self-hosted through `next/font` — no render-blocking request, no
layout shift, matched fallback metrics.

Scale is fluid (`--text-*`), a minor third at reading sizes opening toward 1.4
at display sizes so headlines genuinely dominate. Body measure is capped at
`62ch` (`.measure`) — under Bringhurst's 80 — and `46ch` for narrow columns.

### Deliberately avoided

Tracked-out all-caps eyebrows above every heading; a single accent-coloured word
in a headline; middot-joined meta strings; numbered `01 / 02 / 03` markers
except where the content genuinely is a sequence (only the Pro Audio process).
`.marker` exists instead — display italic at text size, used only where the
label carries information.

That last rule is enforced, not aspirational. A `.marker` above a heading has to
say something the heading does not: "Repairs & service" above *Keep your
instrument playing its best* earns its place because the heading never names the
service; "Search" above *Results for "fender"* did not, and was deleted. When in
doubt, delete it — the heading carries its own weight.

Facts that belong together but are not a sentence — condition, availability,
collection — are separated by space, never strung together with middle dots.

## The store

The commerce layer was built on top of the system above rather than beside it.

**The masthead is three tiers**, in the order a shop needs them: a utility strip
(pickup, telephone, services), the masthead proper (wordmark, search, wishlist,
cart), and departments with mega menus. It is solid at every scroll position —
an earlier version dissolved over the homepage hero, which is a nice trick on a
brochure site and the wrong call on a shop, because the search field is the most
used control on the page.

Mega panels open on hover *and* focus, carry no `aria-expanded` (the top-level
item is a real link to a real page, not a button pretending to be one), and are
`inert` while closed so they are never a hidden tab stop. On mobile the same
structure becomes a drawer built from native `<details>` — that part is still
plain HTML — but the drawer itself, the cart, the mobile filters, quick view,
and the product gallery's fullscreen view are Radix `Dialog`/`Sheet`
(`components/ui/dialog.tsx`, `components/ui/sheet.tsx`, restyled to the house
tokens on install). They replace hand-rolled overlays that each carried their
own partial answer to focus containment, Escape, and scroll-locking; Radix
answers all of it in one place, and correctly.

**Search** matches in the browser against a small index built on the server, so
a suggestion appears on the keystroke. It is a real combobox — arrow keys,
`aria-activedescendant`, Enter opens the highlighted row — and a term that looks
like a stock number matches the SKU first, because somebody typing `QM-EG-1102`
is holding a tag.

**Product cards** are one link, thrown by the title's `::after`, so the wishlist
button and the quick-view controls can sit on top of the card without nesting
interactive elements inside an anchor. The controls are revealed on hover only
where there is a pointer — `@media (hover: hover)` in `globals.css` — because
"reveal on hover" on a phone means "never".

**Badges** are solid fills rather than tints, so one component is legible on a
photograph, on parchment, or on walnut without knowing which. Every pairing
clears AA and every badge says a word. Cards take two; the product page takes
the lot. The limit lives at the call site.

**Shelves** (New Arrivals, Used & Unique) are native scroll containers with snap
points, not a carousel library: they already work with a trackpad, a thumb, a
scrollbar, arrow keys and Tab. The buttons beside them call `scrollBy`. Nothing
auto-advances — a shelf that moves while somebody is reading a price is an
animation that costs a sale.

**Filters live in the URL**, so any view can be linked, bookmarked and shared,
and the back button does what it should. On mobile they are a full-height drawer
with a button that says how many items are waiting behind it.

**The brand strip is set in the display face, not in logos.** A manufacturer's
mark is their property, and a row of them on a shop's homepage reads as a claim
of authorised dealership nobody has confirmed. It is also the only way forty
brands look like one design.

The strip itself is Magic UI's `Marquee`, installed from the registry and
restyled — the one bought-in component in the build. Two things were added to
it, and both are the house rules rather than the component's: it is
`aria-hidden` with non-interactive items, because a marquee repeats its
children four times and a link list repeated four times is worse than none
(the real route in is the A-to-Z index at /brands, linked underneath); and
`prefers-reduced-motion` stops it dead and turns it into an ordinary
horizontal scroller, because everything else here respects that and a strip
that kept moving would be the one thing that did not.

## Layout

One container (`.shell`, max `88rem`, fluid gutter). Asymmetric 12-column grids
throughout — content sits at `col-span-5 / col-start-7`, never a symmetric
half-and-half. The homepage departments are a single-row, horizontally
scrolling strip of round thumbnails (`CategoryStrip`), not the three-row tile
grid (`CategoryGrid`) an earlier version used — that grid put a wall of
imagery between the hero and the first product for sale, which was the
user's main complaint about the first delivery. `CategoryGrid` was deleted
along with it; if a future page wants the tile treatment back (an explicit
span and crop per category, so eleven identical rectangles are not the
answer), it is recoverable from history rather than carried as dead code.

Corners are near-square (`--radius-xs: 2px`). No card shadows anywhere. Borders
are single hairlines, used to separate, never to decorate.

**A grid item with an internal `overflow-x: auto` rail (the product gallery's
thumbnail strip is the case that surfaced this) needs an explicit
`grid-template-columns` on every breakpoint it renders at, not just the
widest one.** `display: grid` with no columns declared gives a single
implicit track sized to content, so a rail meant to scroll internally instead
forces the whole track — and the page — as wide as its unscrolled content.
`src/app/product/[slug]/page.tsx`'s gallery/buy-box grid had this bug below
`lg:` (a base `grid-cols-1` was missing); it read, on a first look, like a
Browser-pane viewport-emulation fault, because the symptom is the same either
way — the layout viewport itself measuring wider than the device. Check
`document.documentElement.scrollWidth` against `window.innerWidth` before
concluding a narrow-viewport rendering problem is tooling rather than a real
missing `minmax(0, ...)` or `grid-cols-*` somewhere in the ancestor chain.

## Motion

Three devices, and nothing else.

1. **Masked line reveal** — headline lines rise into a clipping box, so type
   looks pushed up from behind the page rather than faded in.
2. **Staggered tiles** — grids reveal in sequence (70ms apart).
3. **The hero strings** — six canvas polylines modelled as genuinely plucked
   strings: the first three harmonics of a standing wave, amplitudes weighted by
   where along the length they were struck, each harmonic decaying on its own
   time constant. The cursor plucks the nearest string; left alone, one is
   touched every few seconds.

**Above the fold never waits for JavaScript.** Hero type animates with pure CSS
keyframes (`[data-reveal-load]`). Below the fold uses one shared
IntersectionObserver, and all of *that* CSS is scoped to `.js` — a class an
inline script adds before first paint — so with no JavaScript at all, nothing is
hidden. An entrance animation must never be the difference between a page and a
blank screen.

Everything respects `prefers-reduced-motion`: content arrives, nothing travels.
The canvas also stops when off-screen, when the tab is hidden, and on
low-powered touch devices, where it paints one static frame.

No GSAP, no Three.js, no framer-motion. The Pro Audio scroll story is
`position: sticky` plus one observer; Three.js would have been 600 KB to draw
six lines.

## Photography

**Real photography, not the drawn plates, is the art direction the user
approved.** An earlier version of this document called the plates "an
intentional art direction" and argued stock photography would "undercut the
entire premise." The user overruled that: a photography-led shop that shows
line engravings instead of instruments reads as unfinished, not intentional.

Where a freely licensed, honestly matching photograph exists, it is used —
category tiles (`Category.image` in `lib/products/types.ts`, set per category
in `catalog.ts`) and a handful of products whose brand and shape genuinely
match a photo pulled from Wikimedia Commons by
`scripts/fetch-demo-photos.mjs`. Every one of those is visually inspected
before wiring in — never assumed from a filename or search query — and
credited on `/credits`, linked from the footer, because CC BY and CC BY-SA
require attribution as a licence condition. Product photography uses
`object-contain` on the card's ground so the complete instrument shows
uncropped; editorial imagery may still use `object-cover`.

The **drawn plate** (`src/components/media/Plate.tsx`) is still the correct
fallback where no honest photograph exists — most of the automated Commons
search results were mismatches (a museum display standing in for a single
instrument, a painting, a sheet-music excerpt, a wrong shape and finish) and
were rejected rather than wired in under false pretences. A plate is not a
grey box; it says "we do not have a real photo of this yet" instead of
showing a photo that is not honest, which is worse. `src/lib/images.ts` lists
every editorial slot with a photographer's brief and the aspect ratio the
layout already reserves, so real photography of the shop itself — when it
exists — drops in with no layout shift and no component changes.

## Accessibility

- Semantic landmarks, one `<h1>` per page, no skipped heading levels — checked
  on every route by `npm run check:a11y`.
- All interactive targets clear 44px.
- Focus is never removed: 2px amber on dark, burgundy on light.
- Labels are always visible and always associated; placeholders are not labels.
- Errors sit beside their field, are announced, and name themselves in words.
- Closed overlays leave the tab order rather than lurking off-screen: the
  desktop mega menus are `inert` while closed (they stay mounted, hidden), and
  the cart, mobile filters, mobile nav, quick view and the gallery fullscreen
  view are Radix `Dialog`/`Sheet` (`components/ui/dialog.tsx`,
  `components/ui/sheet.tsx`), which unmount entirely when closed rather than
  hiding in place.
- The map is click-to-load — no third-party JavaScript or cookies until asked.

## Adding to the site

| To add | Edit |
| --- | --- |
| A page | `src/config/navigation.ts` — header, mobile menu, footer, and sitemap all follow |
| A product or category | `src/lib/products/catalog.ts` (or swap the source in `repository.ts`) |
| A business fact | `src/config/business.ts` — nulls are omitted, never guessed |
| A lesson, service, or person | `src/config/services.ts` |
| A photograph | `src/lib/images.ts`, or a product's `images` array |
| A payment provider | One file implementing `PaymentProvider`, plus one switch case |

Build page sections from `Section` + `SectionHeading`, images from `Photo`,
entrances from `Reveal` / `RevealLines`. If something needs a new colour or a
new spacing value, add a token — do not inline a hex.
