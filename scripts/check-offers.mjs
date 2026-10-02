/**
 * Make an Offer checks. Run against the dev server:
 *
 *   npm run dev -- -p 3100
 *   npm run check:offers
 *
 * Asserts the rules that must not regress: only used/vintage items take
 * offers, the 80% floor and listed-price ceiling are decided on the server
 * from the catalogue (client-sent prices are ignored), collection-only items
 * cannot be offered for shipping, the honeypot and rate limit hold (and the
 * limits ignore forged x-forwarded-for / x-real-ip), cross-site server-action
 * posts are refused, and the staff pages refuse anyone without a verified
 * staff session. Nothing here emails anyone: the staff-link checks use an
 * example.invalid address, which is never sent a link.
 *
 * Without the migration applied, a valid offer answers 503 (checked as "got
 * past validation"). Set OFFERS_LIVE=1 once the migration is applied to also
 * write one real offer and check the duplicate guard — that leaves a row in
 * Supabase named "Offer Check", which staff can decline.
 */

import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const LIVE = process.env.OFFERS_LIVE === '1';

// Listed $449.99 but reduced to $399.99: the floor follows the CURRENT price.
const USED = 'gretsch-g2622-streamliner-used'; // used, ships
const MINIMUM = '320.00'; // ceil(39999 * 0.8) = 32000 cents
const NEW_ITEM = 'yamaha-fg800-natural';
const PICKUP_ONLY = 'used-1978-fender-twin-reverb'; // vintage, collection only

let failures = 0;
let emailCounter = 0;
const RUN = Date.now();

async function check(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL  ${name}`);
    console.error(`        ${error.message}`);
  }
}

/** Each call gets its own email, so the (email, product) rate limit only bites where it is tested. */
function offer(overrides = {}, headers = {}) {
  return fetch(`${BASE}/api/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      productSlug: USED,
      amount: MINIMUM,
      name: 'Offer Check',
      email: `offer-check-${RUN}-${++emailCounter}@example.com`,
      fulfillment: 'pickup',
      acceptTerms: 'on',
      ...overrides,
    }),
  });
}

console.log(`\nOffer checks against ${BASE}\n`);

await check('new stock refuses offers', async () => {
  const r = await offer({ productSlug: NEW_ITEM, amount: '199.99' });
  assert.equal(r.status, 422);
});

await check('unknown product is 404', async () => {
  const r = await offer({ productSlug: 'no-such-thing' });
  assert.equal(r.status, 404);
});

await check('one cent under 80% is refused on the amount field', async () => {
  const r = await offer({ amount: '319.99' });
  const body = await r.json();
  assert.equal(r.status, 422);
  assert.ok(body.fields?.amount, 'expected an amount field error');
});

await check('exactly 80% passes validation', async () => {
  const r = await offer({ amount: MINIMUM });
  assert.ok(![400, 404, 422].includes(r.status), `got ${r.status}`);
});

await check('above the listed price is refused', async () => {
  const r = await offer({ amount: '400.00' });
  assert.equal(r.status, 422);
});

await check('client-sent price and product metadata are ignored', async () => {
  // If listedPrice were trusted, $320 would be "above list" and $1 would pass.
  const cheap = await offer({ amount: '1', price: 1, listedPrice: 1, salePrice: 1, productName: 'Anything', condition: 'used' });
  assert.equal(cheap.status, 422, 'a $1 offer got through with a forged price');
  const real = await offer({ amount: MINIMUM, listedPrice: 100, price: 100 });
  assert.ok(![400, 422].includes(real.status), `forged low price changed the decision: ${real.status}`);
});

await check('garbage amounts are refused', async () => {
  for (const amount of ['abc', '-400', '400.001', '1e3', '']) {
    const r = await offer({ amount });
    assert.equal(r.status, 422, `amount ${JSON.stringify(amount)} answered ${r.status}`);
  }
});

await check('terms must be accepted', async () => {
  const r = await offer({ acceptTerms: undefined });
  const body = await r.json();
  assert.equal(r.status, 400);
  assert.ok(body.fields?.acceptTerms);
});

await check('collection-only item cannot be offered for shipping', async () => {
  const r = await offer({ productSlug: PICKUP_ONLY, amount: '1500', fulfillment: 'shipping' });
  const body = await r.json();
  assert.equal(r.status, 422);
  assert.ok(body.fields?.fulfillment);
});

await check('honeypot answers like success', async () => {
  const r = await offer({ website: 'http://spam.example' });
  const body = await r.json();
  assert.equal(r.status, 200);
  assert.equal(body.received, true);
});

// Honeypot submissions go through the limiter but never reach the database,
// so these write nothing even with the migration applied.
await check('rate limit: sixth offer per email+item is 429 even with a new forged IP each time', async () => {
  const email = `Rate-Limit-${RUN}@Example.com`;
  const statuses = [];
  for (let i = 0; i < 6; i += 1) {
    const forged = `203.0.113.${i + 1}`;
    // Case/whitespace changes must not dodge the key either.
    const address = i % 2 ? ` ${email.toLowerCase()} ` : email;
    const r = await offer(
      { email: address, website: 'http://spam.example' },
      { 'x-forwarded-for': `${forged}, 10.0.0.${i}`, 'x-real-ip': forged },
    );
    statuses.push(r.status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 200, 200, 429]);
});

await check('rate limit is per email+item: a different item or email still gets through', async () => {
  const email = `rate-limit-${RUN}@example.com`;
  const otherItem = await offer({ email, productSlug: PICKUP_ONLY, amount: '1500', website: 'x' });
  assert.equal(otherItem.status, 200);
  const otherEmail = await offer({ website: 'x' });
  assert.equal(otherEmail.status, 200);
});

/** Posts the no-JS staff sign-in form the way a browser would. */
async function staffLink(email, headers = {}) {
  const html = await (await fetch(`${BASE}/admin/login`)).text();
  const actionId = html.match(/name="(\$ACTION_ID_[0-9a-f]+)"/)?.[1];
  assert.ok(actionId, 'no server action id on /admin/login');
  const form = new FormData();
  form.set(actionId, '');
  form.set('email', email);
  return fetch(`${BASE}/admin/login`, {
    method: 'POST',
    body: form,
    redirect: 'manual',
    headers: { origin: new URL(BASE).origin, ...headers },
  });
}

await check('staff link: sixth request per address is refused even with a new forged IP each time', async () => {
  const email = `staff-link-check-${RUN}@example.invalid`; // not staff: no email is ever sent
  const locations = [];
  for (let i = 0; i < 6; i += 1) {
    const forged = `198.51.100.${i + 1}`;
    const r = await staffLink(i % 2 ? email.toUpperCase() : email, { 'x-forwarded-for': forged, 'x-real-ip': forged });
    assert.equal(r.status, 303, `request ${i + 1} answered ${r.status}`);
    locations.push(new URL(r.headers.get('location') ?? '', BASE).search);
  }
  assert.deepEqual(locations, ['?sent=1', '?sent=1', '?sent=1', '?sent=1', '?sent=1', '?error=slow']);
});

await check('staff link: a cross-site post is refused', async () => {
  const r = await staffLink(`csrf-check-${RUN}@example.invalid`, { origin: 'https://evil.example' });
  assert.notEqual(r.status, 303, 'a cross-origin server action was accepted');
  assert.ok(r.status >= 400, `cross-origin post answered ${r.status}`);
});

await check('staff pages redirect without a session', async () => {
  for (const path of ['/admin', '/admin/offers']) {
    const r = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    assert.ok([303, 307, 308].includes(r.status), `${path} answered ${r.status}`);
    assert.match(r.headers.get('location') ?? '', /\/admin\/(login|offers)/);
  }
  const forged = await fetch(`${BASE}/admin/offers`, {
    redirect: 'manual',
    headers: { cookie: 'qm_staff=eyJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6Im1yLmNvbWV0d2Vic2l0ZXNAZ21haWwuY29tIn0.forged' },
  });
  assert.ok([303, 307].includes(forged.status), `forged cookie answered ${forged.status}`);
  assert.match(forged.headers.get('location') ?? '', /\/admin\/login/);
});

await check('auth callback without a code or verifier refuses', async () => {
  const r = await fetch(`${BASE}/admin/auth/callback?code=nope`, { redirect: 'manual' });
  assert.ok([303, 307].includes(r.status));
  assert.match(r.headers.get('location') ?? '', /error=link/);
  assert.equal(/qm_staff=[^;]/.test(r.headers.get('set-cookie') ?? ''), false);
});

await check('login page is noindex', async () => {
  const html = await (await fetch(`${BASE}/admin/login`)).text();
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
});

await check('Make an offer shows on used stock only', async () => {
  const used = await (await fetch(`${BASE}/product/${USED}`)).text();
  const fresh = await (await fetch(`${BASE}/product/${NEW_ITEM}`)).text();
  assert.match(used, />Make an offer</);
  assert.doesNotMatch(fresh, />Make an offer</);
});

await check('no secret reaches the product page', async () => {
  const html = await (await fetch(`${BASE}/product/${USED}`)).text();
  assert.doesNotMatch(html, /sb_secret_|SUPABASE_SECRET_KEY/);
});

if (LIVE) {
  await check('LIVE: offer is stored, duplicate is refused', async () => {
    const email = `offer-check-${Date.now()}@example.com`;
    const first = await offer({ email, amount: '350' });
    const body = await first.json();
    assert.equal(first.status, 200, JSON.stringify(body));
    assert.match(body.reference, /^[0-9A-F]{8}$/);
    const again = await offer({ email, amount: '360' });
    assert.equal(again.status, 409);
  });
}

console.log(failures === 0 ? '\nAll offer checks passed.\n' : `\n${failures} offer check(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
