/**
 * Commerce safety checks.
 *
 * Run against a running dev server:
 *
 *   npm run dev
 *   node scripts/check-commerce.mjs
 *
 * These assert the properties that must not silently regress: the server, not
 * the browser, decides what things cost, and an order only becomes paid from a
 * webhook whose signature verifies. Everything else on this site is a page you
 * can look at; this is the part that moves money.
 */

import { createHmac } from 'node:crypto';
import assert from 'node:assert/strict';

/*
 * RUN THIS AGAINST `npm run dev`, NOT `npm start`.
 *
 * The development mock payment provider deliberately refuses to start when
 * NODE_ENV is production — that is the guard stopping the store from ever
 * shipping while pretending to take money — so every checkout call against a
 * production build answers 502 by design, and this suite will report a wall
 * of failures that are the safety feature working.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev-webhook-secret';

/** The Yamaha FG800 in the seed catalogue: $239.99 reduced to $199.99. */
/*
 * Products are addressed by their stock number, which is also their id —
 * see the note in lib/products/catalog.ts. These are stable across edits to
 * the catalogue in a way that a position in an array never was.
 */
const PRODUCT_ID = 'QM-AG-2102'; // Yamaha FG800, reduced to $199.99
const TRUE_PRICE = 19999;

let failures = 0;

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

const post = (path, body, headers = {}) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const validCustomer = { name: 'Test Buyer', email: 'test@example.com' };

async function startOrder(overrides = {}) {
  const response = await post('/api/checkout', {
    items: [{ productId: PRODUCT_ID, quantity: 1 }],
    fulfillment: 'pickup',
    customer: validCustomer,
    ...overrides,
  });
  const body = await response.json();
  // Being rate limited mid-suite would make later assertions pass or fail for
  // the wrong reason, so say so plainly instead.
  assert.notEqual(
    response.status,
    429,
    'checkout rate limit hit while running the suite; wait a minute and re-run',
  );
  return { response, body };
}

console.log(`\nCommerce checks against ${BASE}\n`);

/* ------------------------------------------------------------------ */
/* Pricing authority                                                   */
/* ------------------------------------------------------------------ */

await check('server prices the order from the catalogue', async () => {
  const { response, body } = await startOrder();
  assert.equal(response.status, 200, `expected 200, got ${response.status}`);
  assert.equal(body.total, TRUE_PRICE, `expected ${TRUE_PRICE}, got ${body.total}`);
});

await check('client-supplied prices are ignored', async () => {
  // A hostile client sends every price-shaped field it can think of.
  const { response, body } = await post('/api/checkout', {
    items: [{ productId: PRODUCT_ID, quantity: 1, price: 1, unitAmount: 1, salePrice: 1 }],
    fulfillment: 'pickup',
    customer: validCustomer,
    total: 1,
    subtotal: 1,
  }).then(async (r) => ({ response: r, body: await r.json() }));

  assert.equal(response.status, 200);
  assert.equal(body.total, TRUE_PRICE, `client price leaked through: got ${body.total}`);
});

await check('quantity above the cap is rejected', async () => {
  const { response } = await startOrder({
    items: [{ productId: PRODUCT_ID, quantity: 9999 }],
  });
  assert.equal(response.status, 400, `expected 400, got ${response.status}`);
});

await check('unknown product is rejected', async () => {
  const { response } = await startOrder({
    items: [{ productId: 'does-not-exist', quantity: 1 }],
  });
  assert.equal(response.status, 409, `expected 409, got ${response.status}`);
});

await check('sold-out product cannot be bought', async () => {
  // The Hercules stand has inventory 0 in the seed catalogue.
  const { response } = await startOrder({ items: [{ productId: 'QM-ACC-9103', quantity: 1 }] });
  assert.equal(response.status, 409, `expected 409, got ${response.status}`);
});

await check('enquiry-only item cannot be bought online', async () => {
  // The 1978 Twin Reverb, which is enquiryOnly.
  const { response } = await startOrder({ items: [{ productId: 'QM-AMP-4101', quantity: 1 }] });
  assert.equal(response.status, 409, `expected 409, got ${response.status}`);
});

await check('collection-only item cannot be shipped', async () => {
  // The Pearl kit: pickupOnly.
  const { response } = await startOrder({
    items: [{ productId: 'QM-DRM-6101', quantity: 1 }],
    fulfillment: 'shipping',
  });
  assert.equal(response.status, 409, `expected 409, got ${response.status}`);
});

await check('invalid email is rejected', async () => {
  const { response, body } = await startOrder({
    customer: { name: 'Test', email: 'not-an-email' },
  });
  assert.equal(response.status, 400);
  assert.ok(body.fields, 'expected field-level errors');
});

/* ------------------------------------------------------------------ */
/* Webhook verification                                                */
/* ------------------------------------------------------------------ */

const sign = (payload) => createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');

async function orderStatus(orderId) {
  // The confirmation page is the only public read of an order. Paid orders
  // render their reference; unpaid ones say they are waiting.
  const html = await fetch(`${BASE}/order-success?order=${orderId}`).then((r) => r.text());
  if (html.includes('That is booked in')) return 'paid';
  if (html.includes('did not go through')) return 'failed';
  if (html.includes('Waiting on the payment')) return 'awaiting-payment';
  return 'unknown';
}

await check('unsigned webhook does not mark an order paid', async () => {
  const { body } = await startOrder();
  const event = JSON.stringify({
    type: 'payment.succeeded',
    orderId: body.orderId,
    sessionId: `mock_cs_${body.orderId}`,
    amountPaid: body.total,
  });

  await post('/api/webhooks/payment', event); // no signature header
  assert.equal(await orderStatus(body.orderId), 'awaiting-payment');
});

await check('badly signed webhook does not mark an order paid', async () => {
  const { body } = await startOrder();
  const event = JSON.stringify({
    type: 'payment.succeeded',
    orderId: body.orderId,
    sessionId: `mock_cs_${body.orderId}`,
    amountPaid: body.total,
  });

  await post('/api/webhooks/payment', event, { 'x-mock-signature': sign('something else') });
  assert.equal(await orderStatus(body.orderId), 'awaiting-payment');
});

await check('correctly signed webhook marks the order paid', async () => {
  const { body } = await startOrder();
  const event = JSON.stringify({
    type: 'payment.succeeded',
    orderId: body.orderId,
    sessionId: `mock_cs_${body.orderId}`,
    amountPaid: body.total,
  });

  await post('/api/webhooks/payment', event, { 'x-mock-signature': sign(event) });
  assert.equal(await orderStatus(body.orderId), 'paid');
});

await check('signed webhook paying the wrong amount does not confirm the order', async () => {
  const { body } = await startOrder();
  const event = JSON.stringify({
    type: 'payment.succeeded',
    orderId: body.orderId,
    sessionId: `mock_cs_${body.orderId}`,
    amountPaid: 1, // one cent for a $199.99 guitar
  });

  await post('/api/webhooks/payment', event, { 'x-mock-signature': sign(event) });
  assert.equal(await orderStatus(body.orderId), 'failed');
});

await check('a webhook for another order\'s session is ignored', async () => {
  const a = await startOrder();
  const b = await startOrder();
  const event = JSON.stringify({
    type: 'payment.succeeded',
    orderId: a.body.orderId,
    sessionId: `mock_cs_${b.body.orderId}`, // mismatched session
    amountPaid: a.body.total,
  });

  await post('/api/webhooks/payment', event, { 'x-mock-signature': sign(event) });
  assert.equal(await orderStatus(a.body.orderId), 'awaiting-payment');
});

/* ------------------------------------------------------------------ */
/* Enquiries                                                           */
/* ------------------------------------------------------------------ */

await check('enquiry rejects a missing message', async () => {
  const response = await post('/api/enquiries', {
    topic: 'general',
    name: 'Test',
    email: 'test@example.com',
    message: '',
  });
  assert.equal(response.status, 400);
});

await check('honeypot is accepted silently, not rejected', async () => {
  const response = await post('/api/enquiries', {
    topic: 'general',
    name: 'Bot',
    email: 'bot@example.com',
    message: 'spam',
    website: 'http://spam.example',
  });
  const body = await response.json();
  // Must look exactly like a successful submission. A 400 naming `website`
  // would tell a spam script which field is the trap.
  assert.equal(response.status, 200, `expected 200, got ${response.status}`);
  assert.deepEqual(body, { received: true });
});

await check('enquiry rate limit engages', async () => {
  const send = () =>
    post('/api/enquiries', {
      topic: 'general',
      name: 'Test',
      email: 'test@example.com',
      message: 'Checking the rate limiter.',
    });

  let sawLimit = false;
  for (let i = 0; i < 10; i += 1) {
    const response = await send();
    if (response.status === 429) {
      sawLimit = true;
      break;
    }
  }
  assert.ok(sawLimit, 'expected a 429 within 10 rapid submissions');
});

console.log(
  failures === 0
    ? '\nAll commerce checks passed.\n'
    : `\n${failures} check(s) failed.\n`,
);
process.exit(failures === 0 ? 0 : 1);
