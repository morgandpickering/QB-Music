import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { OFFER_EXPIRY_HOURS, OFFER_TERMS_VERSION, checkOffer } from '@/lib/offers/rules';
import { getProductBySlug } from '@/lib/products/repository';
import { identityKey, rateLimit } from '@/lib/server/rate-limit';
import { rpc } from '@/lib/server/supabase';
import { fieldErrors, offerSchema } from '@/lib/server/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Make an Offer.
 *
 * The browser sends a product slug, an amount, and contact details. The
 * price, name, condition and eligibility all come from the server catalogue;
 * the 80% floor is checked here and again by the database. Abuse controls:
 * a rate limit keyed on SHA-256(normalised email, catalogue product id) —
 * never on forwarding headers, which the caller controls — a honeypot, one
 * open offer per address per item, and at most three open offers per address
 * (the last two in the database). Payloads that fail the schema or name an
 * unknown product are refused before counting and never reach the database.
 *
 * No email is sent. Nobody is notified automatically — staff see offers in
 * /admin/offers. See PENDING.md §4c.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Have a look at the fields below.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }
  const offer = parsed.data;

  const product = await getProductBySlug(offer.productSlug);
  if (!product) {
    return NextResponse.json({ error: 'That item is not listed any more.' }, { status: 404 });
  }

  // Counted before the honeypot, so honeypot hits are throttled too.
  const limit = rateLimit(identityKey('offer', offer.email, product.id), 5, 10 * 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'That is a lot of offers in a short time. Give it a few minutes, or call the shop.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  // Honeypot: answer like a real submission so a bot learns nothing.
  if (offer.website) {
    return NextResponse.json({
      received: true,
      reference: randomUUID().slice(0, 8).toUpperCase(),
      expiresAt: new Date(Date.now() + OFFER_EXPIRY_HOURS * 3_600_000).toISOString(),
    });
  }

  const check = checkOffer(product, offer.amount);
  if (!check.ok) {
    return NextResponse.json(
      { error: check.message, fields: check.field === 'amount' ? { amount: check.message } : {} },
      { status: 422 },
    );
  }

  if (offer.fulfillment === 'shipping' && (product.pickupOnly || !product.shippingAvailable)) {
    const message = 'This one is collection only.';
    return NextResponse.json({ error: message, fields: { fulfillment: message } }, { status: 422 });
  }

  const result = await rpc<{ id: string; expires_at: string }[]>(
    'submit_offer',
    {
      p_product_id: product.id,
      p_product_slug: product.slug,
      p_product_name: `${product.brand} ${product.name}`,
      p_product_condition: product.condition,
      p_listed_price_cents: check.listedCents,
      p_amount_cents: check.amountCents,
      p_customer_name: offer.name,
      p_customer_email: offer.email,
      p_customer_phone: offer.phone || null,
      p_fulfillment: offer.fulfillment,
      p_message: offer.message || null,
      p_terms_version: OFFER_TERMS_VERSION,
    },
    'service',
  );

  if (!result.ok) {
    const { code, hint, status } = result.error;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'You already have an open offer on this item. We will be in touch about that one.' },
        { status: 409 },
      );
    }
    if (hint === 'open_offer_limit') {
      return NextResponse.json(
        { error: 'You have several offers waiting already. Give us a chance to answer those first.' },
        { status: 409 },
      );
    }
    // Codes only: never log the payload, a key, or the customer's details.
    console.error('[offers] submit failed', { status, code });
    return NextResponse.json(
      { error: 'Offers are not being taken online right now. Please call the shop.' },
      { status: 503 },
    );
  }

  const row = result.data[0];
  return NextResponse.json({
    received: true,
    reference: row.id.slice(0, 8).toUpperCase(),
    expiresAt: row.expires_at,
  });
}
