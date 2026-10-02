# Deploying to Vercel

Written 2026-10-02. Companion to `PENDING.md` (what is unfinished and why)
and `HANDOFF.md` (what was built). Read the honesty warning at the bottom
before pointing a real domain at this.

---

## What works on Vercel, what does not

| Part of the site | On Vercel today |
| --- | --- |
| Storefront: home, 13 departments, 68 products, search, filters, galleries | Works |
| Wishlist, cart, recently viewed | Works (they live in the visitor's browser) |
| Lessons, repairs, pro-audio, about, contact, credits, policies | Works |
| **Checkout** | **Fails by design** — see step 6 |
| **Make an Offer** | Needs steps 3 and 4; without them it says offers are not being taken online |
| **Contact / newsletter delivery** | Submits, but reaches nobody — no mail provider (PENDING.md §4, §4b) |
| Rate limiting, order storage | Work, but per-instance in memory — see "After launch" |

---

## 1. Put it in git

There was no repository here. If this is the first deploy:

```bash
git init -b main
git add .
git commit -m "Quattlebaum Music site"
```

`.gitignore` already excludes `node_modules`, `.next`, `.vercel` and — the one
that matters — **`.env.local`**. Check it before you push anywhere:

```bash
git ls-files --error-unmatch .env.local
```

That command should FAIL with "did not match any file". If it ever succeeds,
the Supabase secret key is in your repository: do not push, and rotate the key
in the Supabase dashboard.

Then create an empty GitHub repository and push to it. Keep it **private** —
not because the code is secret, but because the catalogue in it is not real
stock (see the warning at the bottom).

## 2. Create the Vercel project

Import the repository at vercel.com/new.

- **Framework preset:** Next.js (detected automatically).
- **Root Directory:** if your repository root is this folder, leave it alone.
  **If you put git at the parent `In Progress` folder instead, set Root
  Directory to `quattlebaum-music`.** That parent holds an older first-pass
  copy of the same site and its own lockfile, and Vercel will build the wrong
  one otherwise.
- Build command, install command and output directory: leave as detected.

Do not deploy yet — set the environment variables first, or the first build
will produce a site with no Supabase and the wrong canonical URL.

## 3. Environment variables

`.env.local` is **not** uploaded by git or by the Vercel CLI. Add these in
Vercel → Settings → Environment Variables (Production, and Preview if you want
previews to work too). Copy the values out of your local `.env.local`.

| Name | Value | Exposed to the browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://your-real-domain` — no trailing slash | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | from `.env.local` | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from `.env.local` (`sb_publishable_…`) | Yes |
| `SUPABASE_SECRET_KEY` | from `.env.local` (`sb_secret_…`) | **No — never add a `NEXT_PUBLIC_` prefix to this** |
| `PAYMENT_WEBHOOK_SECRET` | a long random string | No |
| `PAYMENT_PROVIDER` | see step 6 | No |

`NEXT_PUBLIC_SITE_URL` drives metadata, the sitemap, payment redirects, and
the staff sign-in callback URL. Getting it wrong breaks staff sign-in.

## 4. Supabase, for Make an Offer

Do PENDING.md §4c first — the tables do not exist until someone applies
`supabase/migrations/20260918000000_offers.sql` in the SQL Editor.

Then, in Supabase → Authentication → URL Configuration:

- **Site URL:** `https://your-real-domain`
- **Redirect URLs:** add `https://your-real-domain/admin/auth/callback`
  (keep `http://localhost:3100/admin/auth/callback` for local work)

Staff sign-in emails come from Supabase's built-in mailer, which is rate
limited and meant for testing. For real use, set custom SMTP under
Authentication → Emails.

## 5. Deploy, then check

Deploy, then walk these in the browser:

- `/` and `/shop` load; a product page loads.
- `/robots.txt` and `/sitemap.xml` show your real domain, not localhost.
- `/product/gretsch-g2622-streamliner-used` shows **Make an offer**; submit one.
- `/admin/login` sends a link to `mr.cometwebsites@gmail.com`; the link signs
  you in and `/admin/offers` lists the offer you just made. Decline it.
- View source on any page and search for `sb_secret_` — there must be no match.

The automated suites run against a URL, so they work against the deployed site
too:

```bash
BASE_URL=https://your-real-domain npm run check:links
BASE_URL=https://your-real-domain npm run check:a11y
BASE_URL=https://your-real-domain npm run check:offers
```

`check:commerce` is the exception — it needs the mock payment provider, which
deliberately refuses to run in production. Run that one locally only.

## 6. Checkout — decide before launch

`src/lib/payments/index.ts` throws when `PAYMENT_PROVIDER=mock` and
`NODE_ENV=production`:

> The mock payment provider cannot run in production.

That guard is deliberate: it stops the shop shipping a checkout that pretends
to take money. On Vercel it means `/api/checkout` answers 502 and the cart's
checkout button ends in an error. Three honest ways forward:

1. **Wire a real provider.** Write one file implementing `PaymentProvider`
   next to `src/lib/payments/mock.ts`, add its id to the switch in
   `index.ts`, set `PAYMENT_PROVIDER` and the provider's keys, point its
   webhook at `/api/webhooks/payment`, and delete
   `src/app/checkout/simulate/`. Also needed before real orders: a real order
   store (orders are in memory today), sales tax, and stock decrementing —
   PENDING.md §5.
2. **Turn checkout off for now** and let the site be a catalogue plus Make an
   Offer, with "call the shop" as the way to buy. Say the word and I will do
   this one — it is a small, contained change.
3. **Leave it** and accept that anyone who reaches checkout sees an error.
   Not recommended on a public domain.

## After launch

- **Rate limiting and order storage are in memory**, so on Vercel's serverless
  functions they are per-instance and reset constantly. The offer and enquiry
  throttles are much weaker there than locally. Move them to Vercel KV or
  Upstash Redis; the call sites do not change.
- **Expiring offers** are swept whenever an offer is submitted or
  `/admin/offers` is loaded. If you want it on a timer, PENDING.md §4c has the
  pg_cron line.
- **`/admin` is disallowed in `robots.txt`** and the pages are `noindex`, but
  it is protected by the staff sign-in, not by obscurity.

---

## Before a real domain points here — read this

The catalogue in `src/lib/products/catalog.ts` is **representative seed data,
not Quattlebaum's real stock, and the prices are illustrative.** The site is
honest about the things it cannot know (it never invents opening hours, and it
says plainly where forms do not reach anyone), but a public storefront on the
shop's own domain advertises every one of those 68 instruments at those
prices to real customers.

Before launch, either replace the data source — reimplement `loadProducts`
and `loadCategories` in `src/lib/products/repository.ts` against the real POS
or inventory export, which is the only file that needs to change — or deploy
to a Vercel preview URL and treat it as a demo. The rest of PENDING.md
(opening hours, email address, staff biographies, the five pending policy
pages) is in the same position: real facts, still needed.
