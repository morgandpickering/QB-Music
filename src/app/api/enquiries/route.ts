import { NextResponse } from 'next/server';
import { clientKey, rateLimit } from '@/lib/server/rate-limit';
import { enquirySchema, fieldErrors } from '@/lib/server/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Contact, lessons, and repair enquiries.
 *
 * Validated and sanitised server-side, rate limited, and honeypot-screened.
 *
 * DELIVERY IS NOT WIRED UP YET. Enquiries are logged and acknowledged; they do
 * not reach a person. Before launch, connect a transport below — see PENDING.md
 * — and set the destination in config/business.ts. Until then this endpoint
 * must not be advertised as a working contact route in production.
 */
export async function POST(request: Request) {
  // Five a minute is generous for a person and useless for a spam script.
  const limit = rateLimit(clientKey(request, 'enquiry'), 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'That is a lot of messages. Give it a minute, or just call the shop.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Have a look at the fields below.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  const enquiry = parsed.data;

  // Honeypot. Answer exactly as we would a real submission so a bot learns
  // nothing from the response.
  if (enquiry.website) {
    return NextResponse.json({ received: true });
  }

  // eslint-disable-next-line no-console -- stands in for the mail transport.
  console.info('[enquiry] received', {
    topic: enquiry.topic,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone || null,
    preferredContact: enquiry.preferredContact,
    instrument: enquiry.instrument || null,
    message: enquiry.message,
    at: new Date().toISOString(),
  });

  /*
   * TODO before launch — deliver the enquiry. For example:
   *
   *   await sendMail({
   *     to: business.email,
   *     replyTo: enquiry.email,
   *     subject: `[${enquiry.topic}] ${enquiry.name}`,
   *     text: renderEnquiry(enquiry),
   *   });
   *
   * Use a provider API key from a server-only environment variable, and never
   * interpolate the message into HTML without escaping it.
   */

  return NextResponse.json({ received: true });
}
