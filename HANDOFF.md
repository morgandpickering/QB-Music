# HANDOFF — Quattlebaum Music

Updated 2026-09-18 by quattlebaum-offers-001 (Make an Offer). Read this first,
then `PENDING.md` (launch blockers — §4c is the offers setup), `DESIGN.md`
(visual system), and `VERIFICATION.md` (the previous session's check record).

**Section -4 below is the most recent work** (security correction to -3).
Sections -3, -2, -1 and 0–6 are earlier sessions' handoff, left intact
underneath; where they disagree, trust the lower-numbered section.

---

## -4. Security correction (2026-09-18, quattlebaum-offers-001, second pass)

**Status: ready_for_review for everything achievable from this machine. Not
production-secure yet:** the migration is not applied (live check at 22:05:
`GET /rest/v1/offers` → 404 `PGRST205` "Could not find the table", with both
the publishable and the secret key), so the live RLS/grant checks could not
run. Nothing was applied, no email was sent.

**1. Rate limits no longer trust forwarding headers** (Codex's finding).
- `src/lib/server/rate-limit.ts`: new `identityKey(scope, ...parts)` →
  `scope:` + SHA-256 of the trimmed, lower-cased parts (JSON-encoded, so parts
  cannot run together). No raw address is held in memory. The header comment
  now states the in-memory limiter's real ceiling (per process, reset on
  restart, not shared across instances).
- `src/app/api/offers/route.ts`: 5 / 10 min per
  `identityKey('offer', email, product.id)`, checked after schema validation
  and the catalogue lookup (so the id is the server's, not the browser's) and
  **before** the honeypot, so honeypot hits are throttled too. Invalid or
  unknown-product payloads are refused earlier and never reach the database.
- `src/app/admin/actions.ts` `requestStaffLink`: 5 / 15 min per
  `identityKey('staff-link', normalisedEmail)`. Every address is limited the
  same way, so `?error=slow` does not reveal who is staff. `headers()` is no
  longer imported.
- `clientKey()` (forwarding headers) is still used by checkout, enquiries and
  newsletter, outside this task. Its comment now says SPOOFABLE and not to use
  it for anything new. Listed in PENDING.md §4c.
- Still in place as defence in depth: honeypot, the database's
  one-open-per-item unique index and three-open-per-email cap.

**2. Dependency finding, fixed.** `npm audit` on `next@15.5.4` reported 3
critical advisories, among them GHSA-9qr9-h5gf-34mp (RCE in the React flight
protocol, reachable through server actions such as `requestStaffLink` and
`respondToOffer`) and GHSA-p293-qw3h-jr36 (RCE on Windows-hosted servers).
Upgraded to `next@15.5.25`, same minor, pinned exactly (`package.json`,
`package-lock.json`). After: 0 critical. Left, with reasons: `postcss@8.4.31`
nested in Next (high; build-time only, processes this repo's own CSS) and
`sharp@0.34.5` (high, libvips/libheif; only first-party images in `public/`
are optimised, `images.remotePatterns` is empty). Both clear only with Next 16
(a major), not done here.

**3. Secret transport finding, guarded.** This machine has
`NODE_TLS_REJECT_UNAUTHORIZED=0` as a Windows user environment variable (Node
warns on every run). Every Node process, the dev server included, skips TLS
certificate checks, so the secret key goes to Supabase over unverified TLS.
`supabaseConfigured()` now returns false in production when that is set, so a
production server refuses to send the key. Dev cannot be protected by code;
the owner has to remove the variable (PENDING.md §4c step 8). Not changed
here: it is a machine setting.

**4. Security review (the ASSIGNMENT.md list), with evidence.**
- *Secret isolation.* `SUPABASE_SECRET_KEY` is read only in
  `src/lib/server/supabase.ts` (`import 'server-only'`; grep finds no other
  file). After the clean build, a script compared the key's actual value
  (never printed) against every file: 0 hits in `.next/static` (67 files),
  `.next/server/app` (412) and `.next/server/chunks` (16); 0 `sb_secret_` and
  0 `SUPABASE_SECRET_KEY` strings in `.next/static`. `.env.local` values were
  never displayed (names only). `check:offers` also asserts no secret on the
  product page.
- *RLS / grants / append-only (review of the migration SQL).* RLS on all
  three tables; `revoke all` from public, anon, authenticated and
  service_role, then SELECT only to authenticated (policy:
  `is_offer_staff()`) and service_role; `offer_staff` has no policies.
  Function EXECUTE revoked from public/anon/authenticated, then `submit_offer`
  to service_role only (it re-checks the JWT role too) and
  `staff_respond_to_offer` to authenticated (re-checks staff inside). Every
  security-definer function pins `search_path = ''`. `offer_events`:
  UPDATE/DELETE and TRUNCATE triggers raise; the `offers` FK is `on delete
  restrict`; no role has INSERT/UPDATE/DELETE on it. **Live verification:
  blocked** (table absent). The exact non-destructive checks are PENDING.md
  §4c step 7; the rolled-back SQL smoke test is step 2.
- *Exact staff authorisation.* App: `isStaffEmail` = trim + lower-case, then
  `===` the one configured address; `getStaffSession` re-verifies the token
  with Supabase on every request and server action and requires
  `email_confirmed_at`; the callback re-checks the address before setting the
  cookie. Database: `is_offer_staff()` requires role `authenticated` and the
  JWT email to equal a row of `offer_staff`. The dependence on Supabase Auth
  settings ("Confirm email", "Secure email change") is now a documented setup
  requirement (PENDING.md §4c step 4): with those off, the JWT email could be
  claimed without access to the inbox.
- *Legal state transitions.* `offers_guard` freezes every submitted field,
  allows status changes only from pending/countered to countered/accepted/
  declined/expired, and blocks counter/expiry edits outside a transition.
  `staff_respond_to_offer` locks the row, refuses closed offers (`P0001`),
  expires overdue ones instead of acting, and bounds a counter to
  (offer, list]. App side: offer id must match a UUID pattern, action must be
  one of three, the counter goes through `parseDollars`. Floor and ceiling
  come from the server catalogue (`check:offers`: $319.99 refused, $320.00
  passes, $400.00 refused, forged `price`/`listedPrice` ignored) and are
  repeated as table constraints.
- *PII in URLs, logs, errors.* The only two `console.error` calls log a
  status and an error code, never payloads. Redirects carry fixed message
  keys (`?msg=accepted`, `?sent=1`, `?error=slow`) plus the offer UUID as a
  fragment; `/admin/offers` ignores any `msg` not in its fixed table.
  Client-visible errors are fixed strings; database error text is never
  forwarded. Rate-limit keys are hashes.
- *Same-origin protection for staff state changes.* Every staff write is a
  server action. Measured against the dev server, a no-JS form post to the
  staff-link action with `Origin: https://evil.example` → **500**, with
  `Origin: null` → **500**, same origin → 303. The staff cookie is also
  `SameSite=Lax`, `httpOnly`, path `/admin`, so a cross-site POST does not
  carry it. `check:offers` now asserts the cross-origin refusal.
- *SQL note, not changed:* the three-open-per-email cap is count-then-insert,
  so a simultaneous pair could make four. Recorded in PENDING.md.

**5. Regression checks added to `scripts/check-offers.mjs`** (19, was 16).
The helper no longer sends a per-call forged IP; each call gets its own email.
- Six honeypot offers for one email+item, each with a different forged
  `x-forwarded-for` *and* `x-real-ip`, alternating case and whitespace in the
  address → `[200,200,200,200,200,429]`. Honeypot requests write nothing, so
  this stays safe once the migration is applied. Under the old code this
  sequence never reaches 429, since every request got a fresh key.
- Same email on another item, and another email on the same item → 200.
- Six staff-link requests for `staff-link-check-<run>@example.invalid` (not
  staff, so no email is ever sent), each with a new forged IP and alternating
  case → five `?sent=1`, then `?error=slow`.
- Staff-link post with a foreign `Origin` → refused (≥400, not 303).

**Verification (this pass).**
- `npm run typecheck`: clean, before and after the Next upgrade.
- The 3100 dev server (tree started 21:50:59 as `cmd /c npm run dev -- -p 3100
  > .dev-server.log 2>&1`) was stopped before `npm install` and the build.
  `rm -rf .next && npm run build`: exit 0 on Next 15.5.25. The `.next` folder
  was missing straight after that first build (nothing was listening on 3100;
  cause unknown, possibly another process touching this folder, as §-3 also
  noticed), so the build was run again: exit 0, full route table, and the
  secret scan above ran on that output. No source edits after it.
- Dev server restarted with the same command in a hidden window; it reports
  Next 15.5.25 on http://localhost:3100.
- Against it: `check:offers` **19/19**, `check:a11y` **22/22**,
  `check:commerce` **16/16**, `check:links` **102/102**.
- No UI changed in this pass, so keyboard and layout checks from §-3 stand.

**Remaining blockers (external).** Apply the migration and run the smoke test
(PENDING.md §4c steps 1–2), confirm the Auth settings (4), run the live
policy checks (7) and the end-to-end staff path (6), and remove
`NODE_TLS_REJECT_UNAUTHORIZED=0` from the user environment (8).

---

## -3. Fifth session (2026-09-18, quattlebaum-offers-001) — Make an Offer

**Status: ready_for_review, with one external blocker:** the Supabase
migration has to be applied by someone with dashboard access (PENDING.md §4c,
step 1). Until then offers are validated but not stored, and the site says so.

**What it does.** Used and vintage items that are in stock get a "Make an
offer" button under Add to cart (6 products in the seed catalogue; new stock
never shows it). It opens a Radix dialog with the terms first (not a purchase,
no payment, no hold, 48-hour lapse, no confirmation email), then amount, name,
email, optional phone, pickup/shipping (collection-only items show a fixed
"Collection only" instead), optional message, a required terms checkbox, and
a honeypot. Staff sign in at `/admin/login` with a one-time Supabase magic
link (only `mr.cometwebsites@gmail.com` is ever sent one; every address gets
the same answer) and answer offers at `/admin/offers`: accept, counter (amount
above the offer, at most the listed price, resets the 48 hours), or decline,
each with an optional note, each recorded as an event.

**Where the trust boundaries are.**
- The browser sends a slug, an amount string and contact details — nothing
  else is read. `src/app/api/offers/route.ts` looks the product up in the
  server catalogue and `src/lib/offers/rules.ts` decides eligibility, the
  current price (sale price if reduced — the Gretsch is $399.99, so its floor
  is $320.00), the 80% floor, and the list-price ceiling.
- The database repeats it: `offers_minimum_80_percent`, `offers_not_above_list`,
  counter range, 48-hour expiry, one open offer per email per item (partial
  unique index), three open per email, and a guard trigger that freezes the
  submitted facts and only allows pending/countered → countered/accepted/
  declined/expired.
- `offer_events` is append-only (trigger raises on UPDATE/DELETE/TRUNCATE; an
  offer cannot be deleted once it has events). Every write goes through
  security-definer functions that also write the event, so no change can
  skip history: `submit_offer` (secret key only), `staff_respond_to_offer`
  (staff JWT only, staff re-checked inside), `expire_stale_offers`.
- RLS on all three tables. anon: nothing. authenticated: SELECT, narrowed by
  policy to `is_offer_staff()`. service_role: SELECT only — even the secret
  key cannot write rows directly.
- `SUPABASE_SECRET_KEY` is read only in `src/lib/server/supabase.ts`
  (`server-only` import). Checked after the build: no `sb_secret_` string in
  `.next/static`. Its value was never printed; only presence and prefix were
  checked. `.env.local` is gitignored, and there is no git repo here anyway.
- Staff session: httpOnly cookie on `/admin` holding the Supabase access
  token, re-verified with Supabase on every request and every server action,
  address re-checked; the database checks the JWT's email again. One hour,
  no refresh (ponytail note in `src/lib/server/staff.ts`).

**Design choices worth knowing.** No `@supabase/supabase-js`: three REST
calls over `fetch` (a ponytail note in `supabase.ts` names when to switch). The
admin page is plain server-rendered forms and server actions, so it works
without JavaScript; the status message after an action is one of a fixed set
of keys, never echoed text. The dialog restores focus to its opener by hand in
`onCloseAutoFocus`, same as the other five overlays (see §3b for why).

**Files.**
- New: `supabase/migrations/20260918000000_offers.sql`,
  `supabase/tests/offers_smoke.sql`, `src/lib/offers/rules.ts`,
  `src/lib/server/supabase.ts`, `src/lib/server/staff.ts`,
  `src/app/api/offers/route.ts`, `src/components/store/MakeOffer.tsx`,
  `src/app/admin/page.tsx`, `src/app/admin/actions.ts`,
  `src/app/admin/login/page.tsx`, `src/app/admin/auth/callback/route.ts`,
  `src/app/admin/offers/page.tsx`, `scripts/check-offers.mjs`.
- Edited: `src/app/product/[slug]/page.tsx` (renders MakeOffer when
  eligible), `src/lib/server/validation.ts` (`offerSchema`),
  `src/components/forms/Field.tsx` (`inputMode` accepts `decimal`),
  `src/app/robots.ts` (disallow `/admin`), `scripts/check-a11y.mjs` (+ a used
  product page and `/admin/login`), `package.json` (`check:offers`),
  `.env.example` (Supabase variable names, no values), `PENDING.md` (§4c),
  this file.

**Verification (dev server on 3100 unless noted).**
- `npm run typecheck`: clean (re-run after the last edit).
- `npm run build`: clean, with the dev server stopped first. One later edit
  (a wrapper `<div>` on `/admin/login` to stop the form stretching full width)
  was typechecked and browser-checked but not rebuilt.
- `npm run check:offers`: **16/16**. New stock refused (422), unknown slug
  404, $319.99 refused on the amount field, exactly $320.00 passes validation,
  $400.00 (above $399.99) refused, forged `price`/`listedPrice`/`productName`
  ignored both ways, five garbage amounts refused, terms required, shipping on
  the collection-only Twin refused, honeypot answers 200, the 6th request from
  one IP in 10 minutes is 429, `/admin` and `/admin/offers` redirect to login
  with no cookie and with a forged cookie, the auth callback refuses a bare
  code and sets no session cookie, `/admin/login` is noindex, the button shows
  on used stock only, and no secret string reaches the product page. (The
  first run failed one check because the fixture assumed the pre-sale price.
  That was a test bug; the server was right.)
- `npm run check:a11y`: **22/22** (added the Gretsch page and `/admin/login`).
- `npm run check:commerce`: all passed. `npm run check:links`: 102/102.
- Browser, real OS key events: dialog focus lands in the amount field; Tab ×9
  walks amount → name → email → phone → fulfilment → message → terms → Send
  offer → Close and wraps to amount; Shift+Tab from amount wraps to Close; the
  honeypot is skipped; Escape closes and focus returns to "Make an offer"
  (checked at 1440 and 390). Errors: missing terms → alert focused, checkbox
  `aria-invalid`; $300 → "lowest offer … is $320.00" on the amount field,
  wired through `aria-describedby`; a valid $350 reaches Supabase and shows the
  honest 503 message (table not there yet). Loading ("Sending offer…",
  button disabled) and the success state (focus on the "Offer received."
  heading, reference, lapse time, phone) were checked with `fetch` stubbed
  in the page, because the database cannot accept a write yet.
- **Enter/Space activation of the trigger could not be exercised.** This
  session's browser tool delivers Enter/Space as a keydown with an empty
  `key`, and the existing wishlist button (verified by earlier sessions)
  ignores it the same way. The trigger is a native `<button>`, so native
  activation applies, but it was not observed here.
- Layout, `scrollWidth`/`innerWidth`: product page 390/390, 753/768 (scrollbar),
  1425/1440. Dialog open: 390 → 16–374px wide, 34–810px tall, scrolls inside;
  768 → 96–672px, two-column fields; 1440 → 432–1008px. `/admin/login`: input
  350px at 390, 576px at 1440, no overflow. The collection-only Twin shows
  "Collection only" and posts `pickup`; its hint reads "Between $1,440.00 and
  $1,799.99."

**Not verified, and why.** Anything that needs the tables or a signed-in
staff member: a stored offer, the duplicate/limit messages from the database,
the magic link email, the callback exchange, and the rendered
`/admin/offers` list with its accept/counter/decline forms. No link was sent
to the staff address from here, since that emails a real inbox. PENDING.md
§4c steps 2 and 6 cover all of it once the migration is applied.

**Environment notes.** The dev server on 3100 was stopped for the build. When
this session restarted it, a `next dev -p 3100` for this project was already
running again (started 21:50:59, not by this session), so that one was used
for every check. The Browser pane's `preview_start` resolves the parent
folder's `.claude/launch.json` (port 3000, another chat's "quattlebaum"
server), so the pane was opened by URL instead. `scripts/check-offers.mjs`
also gained a duplicated line between two of this session's runs that this
session did not write, possibly another session editing this folder. Worth
knowing if files change unexpectedly.

---

## -2. Fourth session (2026-09-17, quattlebaum-corrections-002) — honesty audit, keyboard containment, gallery fix verified everywhere

**Status: ready_for_review.** Five concrete gaps named by the task, all
closed. Full detail, including every measured number, is in
`VERIFICATION.md` — this section is the short version.

1. **Inventory/availability copy audit.** `src/app/page.tsx`'s New Arrivals
   lede ("Recently arrived stock. Call ahead if you want to make sure one is
   still on the floor.") asserted real-time physical inventory for what is
   representative seed data — the same honesty problem the second session
   fixed elsewhere, missed here. Found and fixed five more instances of the
   identical pattern: `shop/page.tsx` and `shop/[category]/page.tsx` meta
   descriptions ("in stock at Quattlebaum Music"), the CTASection at the
   bottom of every category page ("Everything here is on the floor in
   Searcy"), `used/page.tsx`'s meta description and hero copy ("before it
   goes on the floor"), and `cart/page.tsx`'s checkout disclosure ("what is
   actually on the shelf"). All reworded to invite a real phone call instead
   of asserting a real-time physical state the site has no way to know.
2. **`PENDING.md` and `DESIGN.md` reconciled.** `PENDING.md`'s Photography
   section still described the first-delivery state (every slot a drawn
   plate, hero behind the strings) as current. Rewritten to match what's
   actually in the codebase — real demo photos where honest, drawn plate as
   the fallback, the hero photo, the quieted `HeroStrings` effect, Radix
   overlays, and a pointer to the grid-overflow root cause below.
3. **Grid-overflow bug verified across products, not just the ES-335
   fixture.** The one open item from the previous session — misdiagnosed as
   a Browser-pane viewport bug — is a real one-class CSS bug (missing base
   `grid-cols-1` on the product page's grid, see §-1). This session confirmed
   the fix holds on 6 products spanning 0/1/14-image galleries, at 390,
   768, and 1440px. See `VERIFICATION.md` for the table.
4. **Full real-key Tab/Shift+Tab containment for cart, mobile nav, and
   mobile filters** (previously only Escape+focus-return had been checked
   for these three; gallery fullscreen and Quick View already had the full
   walk from the previous session). All three pass: 9, 19, and 118 real
   focusable stops respectively, contained and correctly wrapping in both
   directions. Also specifically audited Quick View's keyboard
   discoverability, since its trigger is hover-revealed by design — found it
   was already correctly wired (`.card-actions:focus-within` in
   `globals.css` reveals it on real keyboard focus, confirmed live via
   computed style, not just read in the CSS) and made no change.
5. **`VERIFICATION.md` added** (project root) with every number above in
   full, reproducible form. No screenshot image files were saved — this
   session's Browser pane has no way to write a captured screenshot to disk,
   and no headless-capture library (Playwright/Puppeteer) is installed;
   adding one was out of scope for "do not broaden the project." See that
   file's "Screenshot artifacts" section for the two concrete options if
   persisted images are wanted.

Re-ran `typecheck`, `build` (dev stopped/restarted around it), `check:links`,
`check:a11y`, `check:commerce` after all of the above — unchanged: clean,
107 pages, 102/102, 20/20, 16/16.

**Not done:** no new photography, no re-run of the fetch script (nothing
called for it), no changes to Quick View, gallery arrow keys, or anything
else already verified in §-1 — this session only touched what the five
named gaps required.

---

## -1. Third session (2026-09-17, scheduled/unattended) — verification, and one real bug found

This was a verification-focused continuation, not a rebuild: everything in
section 0's task list (photography, Radix overlays, homepage compression,
honesty fixes, the gallery fixture, DESIGN.md) checked out as already done.
The dev server was confirmed serving the right project (`h1` reads "Your
local music store. Built for musicians.") and all three automated checks were
re-run clean against it: `check:links` 102/102, `check:a11y` 20/20,
`check:commerce` 16/16. `npm run typecheck` and `npm run build` (dev stopped
first, restarted after) were both clean, 107 pages.

**The one open item from session 0 — "390px viewport emulation is broken in
this Browser pane" — was not a tool bug.** It was a real, reproducible layout
bug on the product page, previously misdiagnosed. Root cause: `src/app/product/[slug]/page.tsx`'s
gallery/buy-box grid (`<div className="shell grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] ...">`)
had no base `grid-template-columns` below the `lg:` breakpoint. A bare
`display: grid` with no explicit columns lets the single implicit column size
to its content's max intrinsic width; the gallery's thumbnail `.rail`
(`overflow-x: auto`, meant to scroll internally) doesn't get a `min-width: 0`
constraint from a track sized that way, so on any product with more than a
couple of thumbnails — the ES-335's 14-image fixture is exactly the case that
exposed it — the whole grid column, and the page with it, is forced as wide
as the unscrolled thumbnail strip. At 390px that reads as `window.innerWidth`
ballooning to ~1296 (mobile Chrome expands the layout viewport to fit
overflowing content); at 768px it shows as a horizontal scrollbar with
`document.documentElement.scrollWidth` at 1314 against a 768 viewport.
Homepage and shop don't have this grid, which is why they always measured
correctly and only the product/gallery page was affected.

**Fix:** added the missing base column — `grid` → `grid grid-cols-1` — one
class, `src/app/product/[slug]/page.tsx` line 120. Confirmed after the fix:
`document.documentElement.scrollWidth` matches `window.innerWidth` exactly at
390, 768, and 1440 on the ES-335 page. This also means the gallery fullscreen
dialog, previously "not screenshotted, blocked" at 390px, is now captured
cleanly — full-bleed image, prev/next arrows, `1/14` counter, close button,
all correct. Re-ran `check:links`/`check:a11y`/`check:commerce` after the fix
and after a clean rebuild: unchanged, still 102/102, 20/20, 16/16.

**Other verification done this session, with real interaction (not just DOM
reads):**
- Screenshots at 390×844 confirmed correct for: homepage, shop, mobile nav
  drawer, mobile filters drawer, cart drawer (with a real item added via a
  real click), and the product gallery (both the page and its fullscreen
  dialog, both previously blocked).
- Quick View → Add to cart → cart drawer opening with the new line, tested at
  768px (Quick View is intentionally hover-revealed, `@media (hover: hover)`
  per DESIGN.md, so it's tested at a non-touch width, not 390).
- Cart quantity `+` confirmed to update both the line subtotal and the cart
  total ($699.99 → $1,399.98 → cart total $3,999.97); `Remove` on both lines
  confirmed to return the cart to its empty state.
- Search by SKU (`QM-AMP-4101`) confirmed to return exactly the one matching
  product.
- Wishlist: saved an item from the search results page, then did a full page
  navigation (not just SPA state) to `/wishlist` — item was still there after
  the client finished reading `localStorage` ("Loading your saved items…"
  briefly, then the saved item). Confirms persistence, not just in-memory
  state.
- Gallery fullscreen at 390px: `ArrowRight` advances the counter (1/14 →
  2/14); `Escape` closes and returns focus to the button that opened it
  (confirmed via `document.activeElement`, not assumed).

**Files changed this session:** `src/app/product/[slug]/page.tsx` (one class
added, line 120). `HANDOFF.md` (this section).

**Not done, and why:** no new photography work, no further honesty-copy
changes, no DESIGN.md changes — none were needed; everything section 0
already did checked out on inspection. Did not attempt the 5 still-unresolved
image slots (`drums-2`, `drumsticks`, `pa-speaker`, `strings`, `lesson`) or
re-run the Commons fetch — nothing about this session's task called for it
and PENDING.md's guidance (don't lower the licence bar to force a match)
still stands.

---

## 0. Second continuation session — what changed

The user came back with five specific corrections to the first session's
work, all addressed:

1. **The hero was still `src: null`.** Despite the homepage visibly showing a
   photograph (`app/page.tsx` renders `images.heroWall`), the manifest entry
   itself in `lib/images.ts` had never been set — an oversight, not a
   deliberate choice. It now carries `/photos/demo/semi-hollow-guitar.jpg`
   (the same verified, already-credited photo used for the Epiphone ES-335
   and the electric-guitars category tile). The `alt` text was rewritten to
   describe what is actually shown — a semi-hollow electric guitar — and
   explicitly states it is *not* a photograph of the storefront or premises,
   rather than the old alt text's factually wrong claim about "the
   Quattlebaum Music storefront on W. Arch Street." The `shot` brief (for
   whoever eventually photographs the real storefront) is preserved
   separately, since it describes a future target shot, not the current demo
   image. See `lib/images.ts` and the updated comment block above `heroWall`.

2. **New Arrivals photographic coverage — checked, not expanded.** The 8
   products the homepage rail actually shows were read directly off the
   rendered page (Walrus Audio Slö reverb, Guild P-240 Memoir Parlour, Rode
   PodMic USB, Epiphone ES-335 Figured, TC Electronic PolyTune 3, Kala
   KA-SCG Concert Ukulele, Ludwig Supraphonic LM400 Snare, Vox AC15C1), then
   each was checked against all 33 downloaded demo photos for an honest,
   non-mismatching match. Only the ES-335 has one — it already did, from the
   first session. **No further match exists without misrepresenting a
   specific branded model**, and none was forced in:
   - Kala KA-SCG (spruce top, natural wood) — the only ukulele photo on hand
     is a vintage maroon pearloid-bodied instrument. Wrong material and
     colour for a solid-spruce product page; would read as "not what I
     ordered."
   - Vox AC15C1 — the only amp photo shows a boutique amp with "DUMBLE" and
     "Overdrive Special" printed on its own front panel. Putting that photo
     on a Vox listing states an outright wrong brand.
   - Walrus reverb, Rode PodMic, TC Electronic tuner, Ludwig snare — no
     photo of any of these exists in the downloaded set at all (the pedal
     photo on hand is a Tube Screamer, already used for the actual TS9; the
     mic photos on hand are already used for the SM58 and AT2020).
   - Guild P-240 *Memoir Parlour* — reconsidered specifically because
     "parlour" names an exact small body shape. The one unused acoustic
     photo (on a couch) reads as an OM/Grand-Auditorium body, not a parlour.
     Left unmatched rather than gamble on a body-shape claim in the
     product's own name.

   This is a real, checked answer, not an omission — the honest amount of
   *further* coverage available for the products currently visible in New
   Arrivals is zero, beyond what the first session already did.

3. **Gallery screenshots at 390 / 768 / 1440 — 768 and 1440 done, 390
   blocked.** See §4 below for the specific, reproducible tool blocker
   (mobile-width viewport emulation is currently broken in this Browser pane)
   and what was tried before concluding that.

4. **Tab/Shift+Tab containment — redone with real native key input.** The
   first session's containment claim rested on counting focusable elements
   and trusting Radix; it explicitly flagged that it had not walked Tab
   key-by-key. This session did, using `computer{action:"key"}` (a real,
   OS-level key event through the browser's own input pipeline — not
   `element.dispatchEvent(new KeyboardEvent(...))`, which is untrusted and
   does not drive native focus-cycling). Confirmed on both the gallery
   fullscreen dialog (3 focusable elements: Close, Previous, Next — Tab×3
   cycles back to Close; Shift+Tab from Close wraps to Next) and Quick View
   (6 focusable elements — Tab×6 cycles back to Close; Shift+Tab from Close
   wraps to the wishlist button). Both stayed inside the dialog at every
   step (`dialog.contains(document.activeElement)` checked after each real
   key press, not assumed).

5. **Contact and newsletter forms now disclose before, not just after,
   submission.** `EnquiryForm.tsx` and `NewsletterForm.tsx` each got a
   notice placed as the first thing in the form (before the topic selector /
   before the email field), stating plainly that the form does not reach the
   shop or add to a real list, with a working `tel:` link
   (`tel:+15012686694`) right there. Confirmed by reading the DOM that the
   notice element precedes the first form field in document order, not just
   visually. The post-submit messages from the first session are unchanged
   underneath this — someone who ignores the upfront notice and submits
   anyway still gets the honest result message, just no longer as the
   *first* time they learn the form doesn't work.

All five verified against the dev server; see the updated §4 for exact
results. `npm run typecheck`, `npm run build` (stopped/restarted dev around
it, per the standing warning), `check:links`, `check:a11y`, and
`check:commerce` were all re-run clean after these changes — same counts as
the first session (102/102, 20/20, 16/16).

---

## 1. The project directory

**Work here, and only here:**

```
C:\Users\Morgan\Desktop\In Progress\quattlebaum-music
```

**Do NOT edit `C:\Users\Morgan\Desktop\In Progress\src\...`** — that is the older
first-pass copy of the same site. It must stay untouched.

Dev server: `npm run dev -- -p 3100` → http://localhost:3100.
Confirm you have the right one: the current homepage `<h1>` reads
**"Your local music store. Built for musicians."** The old copy reads "Find your sound."

There is no git repository in this directory (`git status` reports "not a git
repository"). If you want version history, that has to be set up deliberately —
it was not present at the start of this session either.

---

## 2. What the user asked for (unchanged from the previous handoff)

A complete, modern, **photography-led, ecommerce-first** website for Quattlebaum
Music, 101 W. Arch St., Searcy AR 72143, **(501) 268-6694**. The user's
correction to the first delivery, addressed this session:

1. Replace drawn SVG plates with real, permitted demo photography where honest;
   make category and product imagery data-driven; products uncropped.
2. Compress the homepage so shopping is not buried.
3. Use the MCP-installed Radix primitives for real accessibility improvements.
4. Fix interaction and honesty gaps.
5. Verify the rendered result with real browser and keyboard testing.

**The brief outranks `DESIGN.md`.** DESIGN.md has been updated this session to
match — see its Photography and Layout sections, which previously described
the drawn plates as the finished art direction. That claim is corrected.

---

## 3. What this session did

### 3a. Demo photography — fetched and individually inspected

Ran `scripts/fetch-demo-photos.mjs` twice (Commons throttles hard; the script
is resumable). **33 of 38 wanted images downloaded**, all permissively
licensed. The remaining 5 (`drums-2`, `drumsticks`, `pa-speaker`, `strings`,
`lesson`) never returned a licensed match — they stay on the drawn plate.

**Every one of the 33 downloaded images was opened with the Read tool and
looked at**, not assumed from its filename or search query. Roughly half were
genuine, honest matches; the rest were rejected as mismatches the automated
Commons search returned and should not be wired into the site:

- `electric-guitar-3.jpg` — a wall of autographed guitars and event lanyards,
  not a clean Les Paul.
- `acoustic-guitar-2.jpg` — a flamenco guitarist's portrait, not a steel-string.
- `amplifier-2.jpg` — two buskers in a park; the amp is incidental.
- `pedal-2.jpg` — a retail pedal-wall display with SALE signage.
- `keyboard-1.jpg` — too blurry to be usable.
- `snare-drum.jpg` — turned out to be sheet music notation, not a photograph.
- `cymbal.jpg` — turned out to be a labelled clip-art drum-kit diagram.
- `trumpet.jpg` — a museum wall of antique brass instruments.
- `violin.jpg` — a Bouguereau religious painting (a violin appears in it).
- `cable.jpg` — a vintage electronics/synthesizer museum display.
- `shop-interior-2.jpg` — an antique music-box museum room, not a shop.
- `band.jpg` — an aerial photo of Tivoli Gardens, Copenhagen. No band, no people.

None of these are referenced anywhere in the code. This is worth knowing if
someone re-runs the fetch script and is tempted to wire in whatever it finds —
about a third of an automated Commons search on instrument keywords is a
flat mismatch, and it has to be checked by eye every time.

**What was used, and where:**

- `Category.image` (new field, `lib/products/types.ts`) is set per department
  in `catalog.ts` for 12 of 13 categories (accessories has no honest generic
  photo and stays on the plate). `CategoryGrid.tsx` — which hard-coded
  `src={null}` — is deleted; the homepage now uses `CategoryStrip.tsx`, which
  reads `category.image`.
- Nine specific products get a verified, non-misleading photo, matched by
  brand+model or at minimum body shape (see the `image:` comments beside each
  in `catalog.ts`): the Epiphone ES-335 (real semi-hollow), the Cordoba C5
  classical, the Squier Affinity Jazz Bass, the Ibanez TS9 (the photo is
  literally an Ibanez Tube Screamer), the Yamaha YCL-255 clarinet (Yamaha
  clarinet pictured), the Yamaha MG12XU mixer (Yamaha console pictured, model
  differs — said so in the code comment), and the Shure SM58 / Audio-Technica
  AT2020 microphones.
- Every other product keeps its drawn plate rather than reach for a
  same-category photo that would misrepresent a specific named model (e.g. no
  guitar photo was used for a different guitar model — body shape is too
  visually diagnostic for that to be honest).
- One product, the Epiphone ES-335, was given a 14-image gallery (1 real photo
  + 13 honestly-labelled drawn-plate angles — "Headstock, front", "Serial
  number", etc.) to test the gallery at the density a real shoot produces, per
  the brief's request for a 10–20 image fixture.
- `/credits` (new page) renders `public/photos/demo/CREDITS.json` — title,
  author, licence, source link, keyed to what it's used for. Linked from the
  footer, which also now carries a one-line demo-imagery disclosure.

### 3b. Interaction — hand-rolled overlays replaced with Radix

All five hand-rolled dialog/drawer implementations the brief called out are
now `components/ui/dialog.tsx` / `components/ui/sheet.tsx` (Radix, restyled to
house tokens, installed and partially wired by the previous session):

- **QuickView** → `Dialog`
- **CartDrawer** → `Sheet side="right"`
- **StoreBrowser mobile filters** → `Sheet side="bottom"`
- **SiteHeader mobile nav** → `Sheet side="left"` (previously a full-screen
  `<details>`-adjacent takeover with `hidden`, not actually a Radix or even a
  slide-in panel — now a proper edge drawer with a backdrop)
- **ProductGallery fullscreen** → `Dialog showClose={false}`

Every hand-rolled focus trap, `inert` toggle, and manual `document.body.style.overflow`
lock was deleted along with the overlay it belonged to.

**Important correctness note for whoever continues this:** Radix's own
automatic focus-return-to-opener did **not** reliably fire in testing for any
of these five overlays when the trigger is a plain controlled button rather
than a `<DialogTrigger>`/`<SheetTrigger>` (confirmed by direct testing — Escape
closed the dialog correctly, but `document.activeElement` landed on `<body>`,
not the button that opened it). Every one of the five now passes an explicit
`onCloseAutoFocus` that calls `.preventDefault()` and focuses a tracked
opener ref by hand. Removing that ref-based restore and trusting Radix's
default will silently regress keyboard users' focus back to `<body>` on
close — verify this specifically if you touch any of these five files again.

`ProductGallery`'s thumbnail strip also now moves focus, not just selection,
when the arrow keys move between thumbnails (`components/store/ProductGallery.tsx`,
the `focusOnChange` ref) — previously arrow keys changed which image was shown
but left focus behind on the tab that was no longer selected.

Product imagery (`ProductCard`, `ProductGallery` main + thumbnails, `QuickView`)
now renders with `fit="contain"` (new prop on `components/media/Photo.tsx`) so
the complete instrument shows uncropped, as the brief required. Category and
editorial imagery keeps `fit="cover"` (the default).

### 3c. Homepage compression

- Hero: `min-h-[78svh] lg:min-h-[86svh]` → `min-h-[52svh] lg:min-h-[58svh]`.
- `HeroStrings` quieted from `opacity-90` to `opacity-30` rather than removed —
  it is still the one bold motion device DESIGN.md documents, just no longer
  competing with the merchandise below it.
- The three-row `CategoryGrid` tile block (between the hero and New Arrivals)
  is replaced by `CategoryStrip` — one horizontally-scrolling row of round
  thumbnails, all 13 departments, a few hundred pixels tall on any screen
  instead of several viewports on a phone.
- New Arrivals section tightened from `pad="normal"` to `pad="tight"`.
- **Measured result:** the first New Arrivals product card sits **2.12
  desktop viewport heights** down at 1280×800, and **2.01 viewport heights**
  down at 390×844 (mobile). Measured via `getBoundingClientRect()` on the
  first `<article>` inside the New Arrivals rail, not eyeballed.

### 3d. Honesty fixes

- `app/page.tsx` — "Everything below is in the building" (New Arrivals lede)
  removed; replaced with copy that does not assert real-time physical
  inventory. "Brands on the floor" → "Brands we carry" (same reasoning).
- `app/shop/page.tsx` — found the same "is in the building" claim in the shop
  hero copy while working the New Arrivals fix; reworded it too, since it is
  the identical honesty problem the brief flagged elsewhere.
- `app/brands/page.tsx` — h1 "Brands on the floor." → "Brands we carry.";
  body copy no longer asserts "what is in the building right now."
- `components/forms/EnquiryForm.tsx` and `components/site/NewsletterForm.tsx`
  — the success states no longer imply the message reached a person or the
  address joined a list. Both now say plainly that this is a demo build,
  the submission was recorded but not delivered/added, and give the phone
  number as the real channel. (The forms still validate, rate-limit, and
  honeypot-screen as before — only the claim made after submitting changed.)
- `/credits` page + footer disclosure — see 3a above.

### 3e. DESIGN.md

Photography section rewritten: no longer claims the drawn plates are the
finished art direction; documents what was actually used, why the rest was
rejected, and the `fit="contain"`/`object-cover` rule. Layout section's
`CategoryGrid` reference corrected to `CategoryStrip` (the grid component was
deleted, not just superseded). Accessibility section's "closed drawers are
inert" bullet corrected — that is only still true of the desktop mega menu;
the five converted overlays unmount via Radix instead.

---

## 4. Verification actually performed, with real numbers

- `npm run typecheck` — clean.
- `npm run build` — clean, 107 pages generated, `/credits` among them.
  **Do not run this while the dev server is on the same port/`.next`** — it
  broke the dev server once this session (`ENOENT ... routes-manifest.json`)
  exactly as the previous handoff warned; stop dev, build, restart dev.
- `npm run check:links` (dev server, port 3100) — **102/102 internal URLs, no
  broken links.**
- `npm run check:a11y` (dev server) — **20/20 routes pass**, structural only
  (headings, labels, alt text, landmarks) — this does not replace the
  keyboard/browser testing below, and is described that way deliberately.
- `npm run check:commerce` (dev server, **not** production — the mock payment
  provider refuses to run under `NODE_ENV=production` by design) —
  **16/16 checks pass.**
- Screenshots taken at 390 / 768 / 1280px (1280 substituted for 1440 — see the
  rendering-artifact note below) for: homepage, shop, product page, and the
  cart drawer, mobile filters, mobile nav, and quick view overlays in their
  open state. The `/credits` page was also captured.
  **Gallery fullscreen dialog: 768×1024 and 1440×900 captured this session**
  (both render correctly — full-bleed, `object-contain`, prev/next arrows,
  counter, close button all in place). **390×844 could not be captured** —
  see the blocker below.
- **A specific, reproducible tool blocker: mobile-width viewport emulation is
  currently broken in this session's Browser pane.** Requesting any custom
  width under roughly 700px (tried 390×844, 375×812, 500×700) or the
  `mobile`/`tablet` presets applies the *device* emulation correctly
  (`navigator.userAgent` genuinely switches to an Android Chrome UA) but
  reports the wrong `window.innerWidth`/`innerHeight` to the page — e.g.
  requesting 390×844 yields `window.innerWidth === 1296`,
  `window.innerHeight === 2805` (consistently ~3.32× the requested size).
  Widths ≥768 apply correctly and exactly. Ruled out before concluding this
  was a genuine tool limitation rather than something fixable: tried a brand
  new tab, tried closing and reopening the Browser pane entirely
  (`preview_start` from scratch), tried the `mobile` preset instead of a
  custom size, tried after fronting the tab with `tabs_select`, tried on a
  different page. All reproduced the identical ~3.32× (or, at 500×700,
  ~2.6×) scale-up. Oddly, 390×844 screenshots of *other* pages (homepage,
  mobile nav, quick view, mobile filters) worked correctly earlier in the
  first session — so this looks like it regressed in this environment
  between sessions rather than being permanently broken; worth simply
  retrying in a future session rather than assuming it will always fail.
- **Real keyboard/focus testing, with real native key input, not JS
  dispatch:** for all five converted overlays (cart, mobile filters, mobile
  nav, quick view, gallery fullscreen), confirmed by direct interaction:
  opening moves focus into the panel, Escape closes it, and focus returns to
  the exact element that opened it (`document.activeElement === opener`,
  checked after each close, not assumed). This session additionally walked
  **Tab and Shift+Tab key-by-key using `computer{action:"key"}`** — a real
  OS-level key event through the browser's own input pipeline, not
  `element.dispatchEvent(new KeyboardEvent(...))` (which is untrusted and
  does not drive native focus-cycling, and was all the first session could
  manage). Confirmed on the gallery fullscreen dialog (3 elements: Tab×3
  cycles Close→Previous→Next→Close; Shift+Tab from Close wraps to Next) and
  Quick View (6 elements: Tab×6 cycles fully back to Close; Shift+Tab from
  Close wraps to the wishlist button), with `dialog.contains(document.activeElement)`
  checked true after every single press. Gallery thumbnail ArrowRight/ArrowLeft
  confirmed to move both `aria-selected` and real DOM focus together. Skip
  link confirmed present (`<a href="#main">Skip to content</a>`).
- **Functional testing, via real interaction, not just reading the code:**
  search by SKU (`QM-AMP-4101` → the one matching product), by brand
  (`fender` → 5 results), and by name (`stratocaster` → 2 results); filter by
  brand+condition combined with sort=price-asc (4 results, confirmed strictly
  ascending by reading the rendered prices); wishlist toggle confirmed to
  persist across a full page reload via `localStorage`; add-to-cart confirmed
  to open the cart drawer; quantity stepper confirmed to update both the
  displayed quantity and the line subtotal; remove confirmed to return the
  cart to its empty state.
- **One false alarm worth recording** so nobody re-chases it: a check for
  duplicate product cards initially found what looked like every product
  rendered twice in the DOM. This is not a bug — it is a `hidden` React 19
  streaming-SSR template artifact (`<div id="S:1" hidden>`) that Next.js
  legitimately leaves in the tree after swapping streamed Suspense content
  into place. `offsetParent !== null` filters it out; do not "fix" it.
- **A genuine screenshot-tooling quirk, not a site bug:** at exactly 1440×900
  viewport emulation in this environment's Browser pane, a scrolled screenshot
  sometimes rendered a large blank strip above the header. Direct DOM
  measurement (`getBoundingClientRect()`, `position: sticky`, `top: 0`)
  confirmed the header was correctly pinned throughout; the blank strip did
  not reflect real layout. 1280×900 rendered correctly and was used for the
  desktop screenshots instead. If you hit this again, trust `getBoundingClientRect()`
  over the screenshot.

### Not done — say so plainly

- Photography of the actual shop, staff, or installation work does not exist
  and was not fabricated. Every real photo used is Commons stock explicitly
  standing in for "the kind of thing," disclosed as such — including the
  hero background as of this session.
- Gallery fullscreen dialog at 390px was not screenshotted — blocked by the
  viewport-emulation tool issue described above, not a site bug. 768 and
  1440 were both captured and both correct.
- No commit was made — there is no git repository in this directory to commit
  to. If version control is wanted, that is a decision for whoever runs this
  next, not something this session should have started unasked.

---

## 5. Known problems carried forward, plus anything new

- Everything in the previous handoff's "Known problems" that is not
  superseded above still applies: the 21st.dev MCP scope/API-key note, the
  `NODE_TLS_REJECT_UNAUTHORIZED=0` machine-wide setting, shadcn components
  arriving with a foreign palette that must be restyled on install.
- `public/photos/demo/guitar-case.jpg` (the Mono M80 gig bag reference photo)
  has a competing brand's website name printed on the bag itself
  ("tribal-planet.com"). It was deliberately **not** wired into the M80
  Vertigo Guitar Case product listing for that reason — it would read as an
  unrelated business's watermark on this shop's product page. It remains
  unused; do not wire it in without cropping or re-sourcing.
- 5 image slots (`drums-2`, `drumsticks`, `pa-speaker`, `strings`, `lesson`)
  never resolved to a licensed photo across two fetch runs. Re-running
  `node scripts/fetch-demo-photos.mjs` again may eventually find them —
  Commons search results vary run to run — but do not lower the licence bar
  in `ALLOWED` in the script to force a match.

---

## 6. MCP research (carried forward from the previous handoff, not redone)

| Tool called | Result |
| --- | --- |
| `magicui listRegistryItems` | 78 items reviewed |
| `magicui getRegistryItem` marquee, progressive-blur | marquee **adopted** (brand strip); progressive-blur **rejected** |
| `shadcn view_items_in_registries` dialog/sheet/command | dialog + sheet **adopted** (this session finished wiring them in); `command`/cmdk **rejected** |
| `21st search` (gallery, product card) | 10 candidates shortlisted, none retrieved |
| `21st search` (mega menu, autocomplete) | 8 candidates; all rejected |
| `21st get_component` #9311 Product Image Card | **rejected after reading the code** — no real tablist, hijacks `window` arrow keys, no lightbox/zoom, 7 npm deps |

This session did not call any new MCP tools — the dialog/sheet primitives
were already installed; the work was wiring them into the five overlays.
