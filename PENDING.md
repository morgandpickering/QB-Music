# Before this site goes live

Everything here is deliberately unfinished, because finishing it requires
information or credentials I do not have. Nothing on this list is guessed at in
the code — unverified facts are `null` in config and simply do not render, so
the site never publishes an invented phone number or a set of opening hours
nobody checked.

Work through this list and the corresponding UI appears on its own.

---

## 1. Business facts — `src/config/business.ts`

| Field | What it turns on | Status |
| --- | --- | --- |
| `phone` / `phoneDisplay` | Every "call us" link, footer, contact page, order confirmation | **Confirmed** — (501) 268-6694 |
| `email` | Footer email link, and where enquiries get routed | **Missing** |
| `hours` | Opening hours in the footer, homepage, contact page, and `LocalBusiness` schema | **Missing** |
| `foundedYear` | The "N+ Years" counter on the homepage and About page | **Missing** |
| `geo` | Latitude/longitude in `LocalBusiness` schema, for map results | **Missing** |
| `social.*` | Social links in the footer and `sameAs` in schema | **Missing** |

Confirmed and already in use: the name, the telephone number
((501) 268-6694), and the address (101 W. Arch St., Searcy, AR 72143).

Until `hours` is filled in, the site says *"Opening hours are confirmed in
store"* rather than inventing a schedule.

## 2. Photography — `src/lib/images.ts`

**Updated 2026-09-17 — this section previously described the first delivery,
before the user overruled it. See `HANDOFF.md` §0/§-1 for the full record.**

Editorial slots and product images now use real, permissively-licensed demo
photography from Wikimedia Commons wherever an honest, non-misleading match
exists — every candidate photo was visually inspected before wiring in, not
assumed from a filename. Twelve of thirteen category tiles carry a real photo
(`Category.image` in `catalog.ts`); nine specific products (matched by
brand+model, never a different model in the same category) do too; one
product (Epiphone ES-335) carries a 14-image gallery to test the gallery at
real density. `src/components/media/Plate.tsx` — the drawn line-engraving —
remains the **honest fallback** everywhere no licensed photo exists rather
than the finished art direction: it says "no real photo yet" instead of
showing a mismatched one. `/credits` (linked from the footer) attributes
every photo actually in use, since CC BY / CC BY-SA require it.

The homepage hero (`heroWall`) now carries a real demo photo (a semi-hollow
electric guitar, `public/photos/demo/semi-hollow-guitar.jpg`) rather than the
plucked-string canvas effect being the dominant visual — that effect
(`HeroStrings`) is still present but quieted to `opacity-30` behind it,
per the homepage-compression work in `HANDOFF.md` §0. It is explicitly *not*
a photograph of the storefront; nothing in this codebase claims a real photo
of 101 W. Arch St. exists, because none does.

Each slot in `images.ts` still carries a `shot` note briefing what to
photograph and the exact aspect ratio the layout reserves, for whichever of
the following two matter most, when someone can actually shoot them:

- **`heroWall`** — replace the demo photo with the real shopfront on W. Arch
  when that shot exists; drop the file in as `public/photos/storefront.jpg`
  and set `heroWall.src`. No layout shift, because the box is already
  reserved.
- **`community`** — that section is meant to be unmistakably local, and a
  stock image would defeat its entire purpose.

Product photography goes in the `images` array on each product. Re-running
`node scripts/fetch-demo-photos.mjs` may surface more honest matches — 5
slots (`drums-2`, `drumsticks`, `pa-speaker`, `strings`, `lesson`) never
resolved across two prior runs — but do not lower the licence bar in
`ALLOWED` to force one, and inspect every result by eye before wiring it in;
roughly a third of the automated search results on a prior run were
mismatches (a museum display, a painting, sheet music) that were correctly
rejected.

## 3. Services and people — `src/config/services.ts`

**Done:** the eight-person team is in, taken from Quattlebaum's own site —
Bobby Wright (Owner), Caleb Henry (Repairs & sales), Owen Rinner, Sarah Grace
Knabe, Amon Smith, Alyssa Winner, Lilli Barden, and William Baker. Their
photographs are in `public/photos/team/`, normalised to a common square by
`scripts/normalise-team-photos.mjs`. They appear on About, and the five marked
`teaches: true` also appear on Lessons.

Still outstanding:

- **Biographies.** Every `bio` is blank. These are real people, so a biography
  has to come from them rather than be written for them. The cards read fine
  without one, and each appears the moment it is filled in.
- **Which instruments each instructor teaches.** Needed before the Lessons page
  can say more than "ask us". Add an `instruments` line per teacher.
- **Two low-resolution portraits.** `bobby-wright.png` and `owen-rinner.png`
  came from 400x400 originals and are upscaled. Higher-resolution versions
  would sharpen them noticeably; re-run the normalise script after replacing.
- **`lessonSubjects`** — confirm which are actually taught, then set
  `confirmed: true`. The page currently says *"ask about"* rather than
  promising any specific lesson.
- **`repairServices`** — same. Confirm the list before it reads as a promise.

No names, roles, or biographies were invented.

## 3b. Customer-service policies — `src/config/policies.ts`

**Shipping, Returns, Store Policies, Privacy Policy and Terms of Service are
all `status: 'pending'`.** Each page renders a visible, labelled notice saying
so, lists what the policy will cover, and points the reader at the telephone.

None of them contain invented legal text, and they must not. A returns window or
a restocking fee is a commitment the shop makes, and a privacy notice that
misdescribes what this site actually does is a legal problem rather than a
placeholder. Get the real wording, put the paragraphs in `body`, set
`status: 'published'`, and the notice is replaced automatically — the pages are
then indexable, which they deliberately are not while pending.

The privacy notice in particular has to describe what is true here: card details
never touch this codebase, the cart and wishlist live in the visitor's own
browser, and enquiries are the only thing sent anywhere.

## 4. Enquiry delivery — `src/app/api/enquiries/route.ts`

**Contact forms validate, rate-limit, and acknowledge — but do not reach a
human yet.** They are logged to the server console.

Connect a transactional mail provider (Resend, Postmark, SES) at the marked
`TODO`, put the API key in a server-only environment variable, and send to
`business.email`. Do not launch the contact page before this is done.

## 4b. Newsletter delivery — `src/app/api/newsletter/route.ts`

Same position as the enquiry form: sign-ups are validated, rate limited,
honeypot-screened and acknowledged, then **logged to the console rather than
added to a list**. Connect a provider at the marked `TODO`, and use a double
opt-in confirmation rather than a silent subscribe. The form in the footer must
not be advertised until this is done.

## 4c. Make an Offer — Supabase setup (added 2026-09-18, quattlebaum-offers-001)

The code is done and checked; **the database is not.** Until step 1 is done,
a valid offer answers "Offers are not being taken online right now. Please
call the shop." and `/admin/offers` says the tables do not exist. Nothing is
stored anywhere in the meantime.

1. **Apply the migration.** Supabase dashboard → SQL Editor → paste all of
   `supabase/migrations/20260918000000_offers.sql` → Run. (Or `supabase link`
   then `supabase db push` with the CLI.) Run it once; it is not idempotent.
   This session could not apply it: there is no database password, `psql`,
   or Supabase CLI on this machine, and the REST keys cannot run DDL.
2. **Check it.** Paste `supabase/tests/offers_smoke.sql` into the SQL Editor
   and run it. It rolls itself back and should end with the notice
   `offers smoke test: all checks passed`.
3. **Allow the sign-in redirect.** Authentication → URL Configuration →
   Redirect URLs: add `http://localhost:3100/admin/auth/callback` and, when
   deployed, `https://<real domain>/admin/auth/callback`. Set Site URL to the
   real domain. Without this, the magic link lands on the Site URL instead
   and sign-in fails with "That sign-in link did not work."
4. **Staff account.** Sign-in creates `mr.cometwebsites@gmail.com` in Supabase
   Auth on first use. If "Allow new users to sign up" is off in the project,
   create that user by hand (Authentication → Users → Add user) first. If
   CAPTCHA protection is on for Auth, staff sign-in will fail: this build does
   not send a CAPTCHA token.
   **Keep "Confirm email" and "Secure email change" ON** (Authentication →
   Providers → Email; both are Supabase defaults) and do not enable other
   sign-in providers that can assert an unverified email. Staff access is
   decided by the email in the Supabase JWT, both in the app and in
   `is_offer_staff()`. With either setting off, someone could sign up as, or
   change their address to, `mr.cometwebsites@gmail.com` without the inbox
   and be treated as staff.
5. **Sign-in email.** The magic link is sent by Supabase's built-in auth mailer,
   which is rate limited (a few per hour) and meant for testing. For
   production, set custom SMTP under Authentication → Emails.
6. **End to end.** `OFFERS_LIVE=1 npm run check:offers` writes one real offer
   ("Offer Check", example.com address) and confirms the duplicate guard. Then
   sign in at `/admin/login`, find it, and decline it. That completes the
   live path this session could not exercise.
7. **Live policy checks (not yet done — table absent on 2026-09-18 22:05).**
   With the publishable key only: `GET /rest/v1/offers?select=id`,
   `/offer_events`, `/offer_staff` must answer 401/403 (`42501`), not 200;
   `POST /rest/v1/offers` and `POST /rest/v1/rpc/submit_offer` must be
   refused; `POST /rest/v1/rpc/staff_respond_to_offer` must be refused. With
   the secret key: `GET /rest/v1/offers?limit=0` answers 200, `PATCH
   /rest/v1/offers?id=eq.<uuid-that-does-not-exist>` is refused `42501`. None
   of these send email or write rows. Only after these and step 2 pass can the
   feature be called production-secure.
8. **Unset `NODE_TLS_REJECT_UNAUTHORIZED=0`** on this machine (it is set as a
   Windows *user* environment variable). Every Node process here, including
   the dev server, skips TLS certificate checks, so the Supabase secret key
   travels over unverified TLS in development. The code now refuses to call
   Supabase at all when that is set in production (`supabaseConfigured()` in
   `src/lib/server/supabase.ts`), but it cannot protect dev. This is a machine
   setting; it was reported, not changed.

**Not built, and must not be claimed:**

- **No notifications.** No transactional email provider is configured, so
  nobody is emailed when an offer arrives, and buyers get no email when staff
  accept, counter, or decline. The dialog and admin page both say so. To add:
  pick a provider (Resend, Postmark, SES), put its key in a server-only env
  var, and send from `src/app/api/offers/route.ts` after a successful insert
  and from `respondToOffer` in `src/app/admin/actions.ts` after a decision.
- **No payment, no hold.** An accepted offer is a record of a negotiation.
  Staff contact the buyer to finish the sale; the item stays listed and can
  sell to someone else. Nothing in the cart or checkout knows about offers.
- **Expiry runs on demand, not on a timer.** Offers past 48 hours are marked
  expired whenever someone submits an offer or loads `/admin/offers`, and a
  decision on an expired offer is refused regardless. If an up-to-date status
  is ever needed without that, schedule with pg_cron:
  `select set_config('request.jwt.claims', '{"role":"service_role"}', true), public.expire_stale_offers();`
- **Staff sessions last one hour** (no refresh token). Request a new link after.
- **Changing the staff address** means changing it in two places:
  `OFFER_STAFF_EMAIL` in `src/lib/offers/rules.ts` and the `public.offer_staff`
  table.
- **Abuse limits.** In memory: 5 offers per 10 minutes per (email, item) and
  5 staff sign-in requests per 15 minutes per address, both keyed on a
  SHA-256 of the normalised (trimmed, lower-cased) address plus the catalogue
  product id or a fixed `staff-link` scope. Forwarding headers
  (`x-forwarded-for`, `x-real-ip`) are no longer read by either, and
  `check:offers` proves forged ones do not reset a limit. In the database:
  one open offer per email per item and three open per email in total. Plus
  a honeypot. Limitations, honestly:
  - The in-memory limiter is per process: it resets on restart/deploy and is
    not shared between serverless instances (roughly limit × instances).
  - It limits per identity, not per client. Someone rotating throwaway email
    addresses is not throttled by it; the database's per-email caps do not
    stop that either. Volume limits per client need a trusted client IP
    (a platform firewall such as Vercel's, or a proxy you control that
    overwrites `x-forwarded-for`) or a CAPTCHA. Not built.
  - Address normalisation is trim + lower-case only; `a.b@gmail.com` and
    `ab+x@gmail.com` count as different people.
  - Anyone can use up the staff address's 5 requests, locking staff sign-in
    for up to 15 minutes. Supabase's own OTP limits behave the same way.
  - The three-open-per-email cap is a count-then-insert in `submit_offer`, so
    two exactly simultaneous submissions could leave four open. The
    one-per-item rule is a unique index and has no such gap.
  - The older routes (checkout, enquiries, newsletter) still key on
    `clientKey()`, which reads forwarding headers and is spoofable. Their
    limits are best-effort only; see the comment in
    `src/lib/server/rate-limit.ts`.

## 5. Payments

The store is built provider-agnostic. To take real money:

1. Choose a provider and write one file implementing `PaymentProvider`
   (`src/lib/payments/provider.ts`) next to `mock.ts`.
2. Add its id to the switch in `src/lib/payments/index.ts`.
3. Set the environment variables from `.env.example`:
   `PAYMENT_PROVIDER`, `PAYMENT_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET`,
   `NEXT_PUBLIC_PAYMENT_PUBLIC_KEY`.
4. Point the provider's webhook at `/api/webhooks/payment`.
5. Delete `src/app/checkout/simulate/` — the development stand-in.

The mock provider **refuses to run in production**, so the store cannot
accidentally ship pretending to take payments.

Also required before real orders:

- **Accepted payment methods.** The footer says card payment arrives with the
  provider rather than showing card logos, because a Visa mark the checkout
  cannot honour is a promise broken at the last step. Put the provider's real
  accepted-methods list there once it exists.

- **Order storage.** `src/lib/commerce/orders.ts` keeps orders in memory. They
  do not survive a restart and do not span instances. Replace the store with a
  database before a single real order exists. The interface is deliberately
  small — four functions.
- **Sales tax.** `priceOrder` returns `tax: null`, which renders as "worked out
  at checkout". Wire up a tax calculation, or have the payment provider do it.
- **Stock decrementing.** Nothing reduces inventory when an order is paid. Hook
  that into the webhook handler alongside the POS.
- **Order notification.** The webhook has a `TODO` where the shop should be
  told an order came in.

## 6. Inventory source — `src/lib/products/repository.ts`

The catalogue in `src/lib/products/catalog.ts` is **representative seed data,
not Quattlebaum's real stock**, and prices are illustrative.

Reimplement `loadProducts` and `loadCategories` against the real source (POS
export, Square, Shopify, a CMS, or a database). Nothing outside that file reads
the seed arrays, so no component changes.

Note also: filtering runs over the full product list in the browser. That is
fast and correct up to a few hundred products; past that, push filtering into
the database query.

## 6b. Customer accounts

There is no sign-in, and `/account` says so plainly rather than showing a login
box that cannot log anybody in. The cart, the wishlist and the recently-viewed
trail all live in the visitor's own browser today.

When accounts are built, three providers are the only things that change:
`lib/cart/CartProvider.tsx`, `lib/wishlist/WishlistProvider.tsx`, and the small
storage block in `components/store/RecentlyViewed.tsx`. Swap their storage calls
for API calls and every button on the site already works. `/account` becomes the
dashboard and nothing else moves.

## 7. Deployment

- Set `NEXT_PUBLIC_SITE_URL` to the real origin. Metadata, the sitemap, and
  payment redirect URLs all derive from it.
- Verify `/robots.txt` and `/sitemap.xml`.
- The rate limiter is per-instance and in-memory. On more than one instance,
  move it to Redis or the platform's own limiter.
- **On this machine only:** `NODE_TLS_REJECT_UNAUTHORIZED=0` is set at the user
  level, which disables TLS certificate verification for every Node process
  including npm installs. Unrelated to this project, but worth clearing.

---

## What is done and tested

- Full order flow: cart → checkout → payment session → signed webhook →
  confirmed order.
- `npm run check:commerce` — 16 checks covering server-side pricing authority,
  stock and fulfilment rules, and webhook signature verification.
- `npm run check:a11y` — structural accessibility across all 22 routes.
- `npm run check:offers` — 16 checks on Make an Offer: eligibility, the 80%
  floor from the server price, forged client prices ignored, honeypot, rate
  limit, and staff pages refusing anyone without a verified session.
- `npm run check:links` — crawls every internal link on the site (101 URLs) and
  fails on anything that does not answer 200.
- `npm run typecheck` and `npm run build` both clean.

Note that the two checks needing a running server expect it on **port 3100**
(`npm run dev -- -p 3100`), or set `BASE_URL`.
