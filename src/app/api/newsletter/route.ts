import { NextResponse } from 'next/server';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';
import { fieldErrors, newsletterSchema } from '@/lib/server/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Newsletter sign-ups.
 *
 * DELIVERY IS NOT WIRED UP YET. Addresses are validated, rate limited and
 * acknowledged, then logged — they do not reach a mailing list. Connect a
 * provider at the TODO below before this is advertised anywhere; see
 * PENDING.md.
 *
 * Note what is *not* here: no name, no interests, no tracking pixel. An email
 * address is the whole requirement, and collecting more of somebody's data
 * than the job needs is how a small shop ends up with a breach to disclose.
 */
export async function POST(request: Request) {
  const limit = rateLimit(clientKey(request, 'newsletter'), 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Give it a minute and try again.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Have a look at the field below.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  // Honeypot: answer exactly as we would a real sign-up, so a bot learns
  // nothing from the response.
  if (parsed.data.website) {
    return NextResponse.json({ received: true });
  }

  // eslint-disable-next-line no-console -- stands in for the list provider.
  console.info('[newsletter] signup', {
    email: parsed.data.email,
    at: new Date().toISOString(),
  });

  /*
   * TODO before launch — add the address to the real list, with a
   * double opt-in confirmation rather than a silent subscribe.
   */

  return NextResponse.json({ received: true });
}
