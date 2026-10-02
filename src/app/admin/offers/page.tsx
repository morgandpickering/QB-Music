import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/lib/products/types';
import { getStaffSession } from '@/lib/server/staff';
import { rpc, select } from '@/lib/server/supabase';
import { respondToOffer, signOut } from '../actions';

export const metadata: Metadata = {
  title: 'Offers',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

type Status = 'pending' | 'countered' | 'accepted' | 'declined' | 'expired';

interface OfferEvent {
  id: number;
  event_type: string;
  to_status: Status;
  amount_cents: number | null;
  note: string | null;
  actor: 'customer' | 'staff' | 'system';
  actor_email: string | null;
  created_at: string;
}

interface Offer {
  id: string;
  product_slug: string;
  product_name: string;
  product_condition: string;
  listed_price_cents: number;
  amount_cents: number;
  counter_amount_cents: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  fulfillment: 'pickup' | 'shipping';
  message: string | null;
  status: Status;
  expires_at: string;
  created_at: string;
  offer_events: OfferEvent[];
}

const STATUS_LABEL: Record<Status, string> = {
  pending: 'Waiting for us',
  countered: 'Countered',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

/** Keys set by actions.ts; anything else in ?msg= is ignored, never echoed. */
const OFFER_MESSAGES: Record<string, { text: string; error?: boolean }> = {
  accepted: { text: 'Offer accepted. Contact the buyer to finish the sale; no email was sent.' },
  countered: { text: 'Counter recorded. Contact the buyer with it; no email was sent.' },
  declined: { text: 'Offer declined. Let the buyer know if you want to; no email was sent.' },
  expired: { text: 'That offer had already expired, so nothing was changed. It is now marked expired.', error: true },
  'counter-format': { text: 'Enter the counter amount in dollars, like 420 or 420.00.', error: true },
  'counter-range': { text: 'A counter has to be above their offer and no more than the listed price.', error: true },
  closed: { text: 'That offer has already been answered.', error: true },
  forbidden: { text: 'Your account is not allowed to answer offers.', error: true },
  bad: { text: 'That request was not understood.', error: true },
  failed: { text: 'That did not save. Try again.', error: true },
};

const when = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Chicago',
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

export default async function AdminOffersPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const staff = await getStaffSession();
  if (!staff) redirect('/admin/login');
  const { msg } = await searchParams;
  const auth = { accessToken: staff.accessToken };

  // Sweep anything past its 48 hours before showing the list.
  await rpc('expire_stale_offers', {}, auth);
  const result = await select<Offer[]>(
    'offers?select=*,offer_events(*)&order=created_at.desc&offer_events.order=created_at.asc&limit=300',
    auth,
  );

  const offers = result.ok ? result.data : [];
  const open = offers.filter((o) => o.status === 'pending' || o.status === 'countered');
  const closed = offers.filter((o) => !open.includes(o)).slice(0, 100);
  const notice = msg ? OFFER_MESSAGES[msg] : undefined;

  return (
    <div className="on-light bg-paper py-12 text-ink md:py-16">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule-light pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl">Offers</h1>
            <p className="mt-2 text-[0.9375rem] text-quiet-light">
              Signed in as {staff.email}. Nothing here emails the buyer: contact them yourself.
            </p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-[var(--radius-xs)] border border-rule-light px-5 font-medium transition-colors hover:border-ink"
            >
              Sign out
            </button>
          </form>
        </div>

        {notice && (
          <div
            role={notice.error ? 'alert' : 'status'}
            className={`mt-6 border-l-2 bg-parchment px-5 py-4 ${notice.error ? 'border-danger' : 'border-brass-deep'}`}
          >
            <p className="font-medium">{notice.text}</p>
          </div>
        )}

        {!result.ok && (
          <div role="alert" className="mt-6 border-l-2 border-danger bg-parchment px-5 py-4">
            <p className="font-medium">Offers could not be loaded.</p>
            <p className="mt-1.5 text-[0.9375rem] text-quiet-light">
              {result.error.code === 'PGRST205'
                ? 'The offers tables do not exist yet. Apply supabase/migrations/20260918000000_offers.sql (see PENDING.md).'
                : `Supabase answered ${result.error.status}${result.error.code ? ` (${result.error.code})` : ''}.`}
            </p>
          </div>
        )}

        <section aria-labelledby="open-heading" className="mt-10">
          <h2 id="open-heading" className="font-display text-2xl">
            Open <span className="text-quiet-light">({open.length})</span>
          </h2>
          {open.length === 0 ? (
            <p className="mt-4 text-quiet-light">No open offers.</p>
          ) : (
            <ul className="mt-6 space-y-6">
              {open.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="closed-heading" className="mt-14">
          <h2 id="closed-heading" className="font-display text-2xl">
            Closed <span className="text-quiet-light">({closed.length})</span>
          </h2>
          {closed.length === 0 ? (
            <p className="mt-4 text-quiet-light">Nothing closed yet.</p>
          ) : (
            <ul className="mt-6 space-y-6">
              {closed.map((offer) => (
                <li key={offer.id}>
                  <OfferCard offer={offer} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const isOpen = offer.status === 'pending' || offer.status === 'countered';
  const percent = Math.round((offer.amount_cents / offer.listed_price_cents) * 100);
  const headingId = `offer-${offer.id}-title`;

  return (
    <article
      id={`offer-${offer.id}`}
      aria-labelledby={headingId}
      className="scroll-mt-28 border border-rule-light p-5 md:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 id={headingId} className="font-display text-xl">
          <Link href={`/product/${offer.product_slug}`} className="link-draw">
            {offer.product_name}
          </Link>
        </h3>
        <p className="marker text-brass-deep">
          {STATUS_LABEL[offer.status]} · Ref {offer.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="Offer">
          <span className="tabular-nums">{formatPrice(offer.amount_cents)}</span>{' '}
          <span className="text-quiet-light">({percent}% of {formatPrice(offer.listed_price_cents)})</span>
        </Fact>
        {offer.counter_amount_cents !== null && (
          <Fact label="Our counter">
            <span className="tabular-nums">{formatPrice(offer.counter_amount_cents)}</span>
          </Fact>
        )}
        <Fact label="Buyer">
          {offer.customer_name}
          <br />
          <a href={`mailto:${offer.customer_email}`} className="link-draw break-all">
            {offer.customer_email}
          </a>
          {offer.customer_phone && (
            <>
              <br />
              <a href={`tel:${offer.customer_phone.replace(/[^\d+]/g, '')}`} className="link-draw">
                {offer.customer_phone}
              </a>
            </>
          )}
        </Fact>
        <Fact label="If agreed">{offer.fulfillment === 'shipping' ? 'Wants it shipped' : 'Will collect'}</Fact>
        <Fact label={isOpen ? 'Lapses' : 'Received'}>
          {when.format(new Date(isOpen ? offer.expires_at : offer.created_at))}
        </Fact>
      </dl>

      {offer.message && (
        <blockquote className="measure mt-4 whitespace-pre-line border-l-2 border-rule-light pl-4 text-[0.9375rem]">
          {offer.message}
        </blockquote>
      )}

      <details className="mt-4 text-[0.9375rem]">
        <summary className="min-h-11 cursor-pointer py-2 font-medium">
          History ({offer.offer_events.length})
        </summary>
        <ol className="mt-2 space-y-1.5 text-quiet-light">
          {offer.offer_events.map((event) => (
            <li key={event.id}>
              {when.format(new Date(event.created_at))}: {event.event_type}
              {event.amount_cents !== null && ` at ${formatPrice(event.amount_cents)}`}
              {' by '}
              {event.actor === 'staff' ? event.actor_email : event.actor}
              {event.note && ` — “${event.note}”`}
            </li>
          ))}
        </ol>
      </details>

      {isOpen && (
        <form action={respondToOffer} className="mt-5 border-t border-rule-light pt-5">
          <input type="hidden" name="offerId" value={offer.id} />
          <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
            <div>
              <label htmlFor={`counter-${offer.id}`} className="block text-[0.9375rem] font-medium">
                Counter amount
              </label>
              <input
                id={`counter-${offer.id}`}
                name="counter"
                inputMode="decimal"
                autoComplete="off"
                aria-describedby={`counter-${offer.id}-hint`}
                className="mt-2 h-12 w-full border border-rule-light bg-transparent px-3 text-base focus:border-ink"
              />
              <p id={`counter-${offer.id}-hint`} className="mt-1.5 text-sm text-quiet-light">
                Only used by Counter.
              </p>
            </div>
            <div>
              <label htmlFor={`note-${offer.id}`} className="block text-[0.9375rem] font-medium">
                Note for the record <span className="font-normal text-quiet-light">optional</span>
              </label>
              <input
                id={`note-${offer.id}`}
                name="note"
                maxLength={1000}
                className="mt-2 h-12 w-full border border-rule-light bg-transparent px-3 text-base focus:border-ink"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              name="action"
              value="accept"
              className="min-h-11 rounded-[var(--radius-xs)] bg-ink px-6 font-medium text-paper transition-colors hover:bg-walnut"
            >
              Accept{offer.status === 'countered' ? ' at our counter' : ''}
            </button>
            <button
              type="submit"
              name="action"
              value="counter"
              className="min-h-11 rounded-[var(--radius-xs)] border border-rule-light px-6 font-medium transition-colors hover:border-ink"
            >
              Counter
            </button>
            <button
              type="submit"
              name="action"
              value="decline"
              className="min-h-11 rounded-[var(--radius-xs)] border border-rule-light px-6 font-medium text-danger transition-colors hover:border-danger"
            >
              Decline
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-quiet-light">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
