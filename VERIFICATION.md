# Verification report — quattlebaum-corrections-002

Written 2026-09-17. Read-only record of what was checked this session and the
exact results. No screenshot image files are attached — see "Screenshot
artifacts" below for why, and what's here instead.

---

## Automated checks (dev server, port 3100)

Run twice: once after the copy/PENDING/DESIGN edits, once after a clean
`npm run build` (dev stopped first, restarted after, per the standing
warning — dev and build share `.next` and conflict if run together).

| Check | Result |
| --- | --- |
| `npm run typecheck` | Clean |
| `npm run build` | Clean, 107 pages |
| `npm run check:links` | 102/102 internal URLs, no broken links |
| `npm run check:a11y` | 20/20 routes pass (structural only — headings, labels, alt text, landmarks; not a substitute for the manual keyboard checks below) |
| `npm run check:commerce` | 16/16, run against the dev server (the mock payment provider refuses to run under `NODE_ENV=production` by design) |

## Gallery grid-overflow bug — root cause and fix

**Finding:** `src/app/product/[slug]/page.tsx`'s gallery/buy-box grid had no
base `grid-template-columns` below the `lg:` breakpoint. A bare `display:
grid` with no columns declared sizes its one implicit column to fit its
content's max intrinsic width. The gallery's thumbnail `.rail`
(`overflow-x: auto`, meant to scroll internally) doesn't get a `min-width: 0`
constraint from a track sized that way, so on any product with several
thumbnails the whole grid column — and the page — is forced as wide as the
unscrolled strip. This was previously misdiagnosed as a Browser-pane
viewport-emulation fault, because the symptom looks identical either way:
the layout viewport measuring wider than the requested device width.

**Fix:** one class, line 120 — `grid` → `grid grid-cols-1` (the `lg:` override
already had its own explicit columns and was unaffected).

**Verification — `document.documentElement.scrollWidth` vs `window.innerWidth`,
real interaction, not assumed:**

| Product | Images | 390px | 768px | 1440px |
| --- | --- | --- | --- | --- |
| `epiphone-es-335-figured` | 14 (worst case) | 390 / 390 | 753 / 768 | 1425 / 1440 |
| `audio-technica-at2020` | 1 | 390 / 390 | 753 / 768 | 1425 / 1440 |
| `gibson-les-paul-standard-50s-tobacco-burst` | 0 (plate) | 390 / 390 | 753 / 768 | 1425 / 1440 |
| `squier-affinity-jazz-bass` | — | 390 / 390 | — | — |
| `allen-heath-sq-5-digital-mixer` | — | 390 / 390 | — | — |
| `shure-sm58` | — | 390 / 390 | — | — |

(format: `scrollWidth / innerWidth`; the ~15px gap at 768/1440 is the
browser's own scrollbar reservation, not overflow.) All six clean. Before the
fix, the ES-335 page measured 1296/2805 at a requested 390×844 and
1314-wide `scrollWidth` against a 768 viewport — see `HANDOFF.md` §-1 and
`DESIGN.md`'s Layout section for the full writeup.

## Keyboard containment — real OS-level key events (`computer{action:"key"}`), not `dispatchEvent`

Every overlay below: opening moves focus in, `Tab`/`Shift+Tab` stay inside
the dialog at every single stop (`dialog.contains(document.activeElement)`
checked after each press, not assumed), the sequence wraps in both
directions, `Escape` closes it, and focus returns to the exact element that
opened it (`document.activeElement === opener`, checked, not assumed).

| Overlay | Focusable stops | Full-cycle wrap checked | Notes |
| --- | --- | --- | --- |
| Cart drawer (empty) | 2 | Yes, both directions | — |
| Cart drawer (1 item) | 9 real stops (10th, the disabled decrease-quantity button at qty 1, is correctly skipped by native Tab — not a bug) | Yes | Confirmed the "missing" stop was `disabled`, not a leak |
| Mobile nav drawer | 19 | Yes, both directions | Department sub-links live inside closed native `<details>`; Tab correctly skips their contents while closed, exactly as native `<details>` should behave |
| Mobile filters drawer | 118 (12 category links + 105 checkboxes/selects + close/submit) | Yes, both directions, exact count confirmed (118 `Tab` presses via the `repeat` key parameter lands exactly back on "Close filters") | Checked at 3 waypoints (13, 113, 118 presses) rather than every single checkbox — a uniform list of native checkboxes inside one Radix trap, not 118 independent risks |
| Gallery fullscreen (ES-335, 14 images) | 3 | Yes, both directions | Also: `ArrowRight`/`ArrowLeft` step the image and update the `1 / 14` counter |
| Quick View | 6 | Previously confirmed (prior session) | Not re-walked this session; nothing touched it |

**Quick View keyboard discoverability, audited specifically because the
button is visually hover-revealed:** `.card-actions` in `globals.css` already
has `.card-actions:focus-within { transform: translateY(0); opacity: 1 }`
alongside the hover rule. Confirmed live, not just read in the CSS: focusing
the Quick View button (a real DOM focus, which is what real `Tab` navigation
produces) sets the container's computed `opacity` to `1` and `transform` to
identity — the control becomes visually visible at exactly the moment a
keyboard user reaches it, same as it does on hover. No fix was needed here;
this was already correctly implemented, and no change was made to it.

## Functional checks (real interaction)

- Cart: quantity `+` on a $699.99 item updated the line to $1,399.98 and the
  cart total to $3,999.97 (with a second item in the cart); `Remove` on both
  lines returned the cart to its empty state.
- Search by SKU (`QM-AMP-4101`) returned exactly the one matching product.
- Wishlist: saved an item, did a full page navigation to `/wishlist` (not
  just in-app state), and the item was still there once the client finished
  reading `localStorage`.
- Quick View → Add to cart → cart drawer opening with the new line, at 768px.

## Screenshot artifacts

No `.png`/`.jpg` files were saved under the project. This session's Browser
pane tooling can display and let me inspect live screenshots, but has no
option to write the captured image to disk, and no headless-browser capture
library (Playwright, Puppeteer) is installed in this project to generate
them independently — installing one would be a real, undiscussed dependency
addition and was out of scope for "do not broaden the project." What's here
instead, and is arguably more useful for regression tracking, is the
reproducible numeric evidence above (`scrollWidth`/`innerWidth` pairs, exact
Tab-count wraps) — every row can be re-run and re-checked by anyone, unlike a
static image.

If actual image files are wanted, the concrete options are: (a) approve
adding Playwright as a dev dependency so a script can capture and save PNGs
headlessly, or (b) I open each URL/state in the Browser pane during a live
session and you view it there directly (already done for all the states
listed above, just not persisted as files).

## Files changed this session

- `src/app/page.tsx` — New Arrivals lede (dropped the "on the floor" /
  "recently arrived" real-inventory claim)
- `src/app/shop/page.tsx` — meta description (dropped "in stock at")
- `src/app/shop/[category]/page.tsx` — meta description, and the bottom
  CTASection lede (dropped "everything here is on the floor")
- `src/app/used/page.tsx` — meta description and hero body copy (dropped
  "before it goes on the floor")
- `src/app/cart/page.tsx` — checkout disclosure copy (dropped "what is
  actually on the shelf")
- `src/app/product/[slug]/page.tsx` — the one-class grid-overflow fix
- `PENDING.md` — Photography section rewritten to match what's actually in
  the codebase (was still describing the first-delivery drawn-plates-only
  state)
- `DESIGN.md` — added the grid-overflow root-cause note to the Layout section
- `HANDOFF.md` — new §-1 recording this session
- `VERIFICATION.md` — this file (new)

## Remaining launch dependencies (unchanged, external, not part of this task)

Business hours/email/social links, real staff biographies, enquiry/newsletter
email delivery, a real payment provider, a real inventory source, and 5 photo
slots that never resolved to a licensed Commons match. All pre-existing, all
in `PENDING.md`, none touched this session.
