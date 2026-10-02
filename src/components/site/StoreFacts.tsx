import {
  business,
  DAY_LABELS,
  DAY_ORDER,
  directionsUrl,
  formatTime,
} from '@/config/business';

/**
 * Renders business facts, and *only* the ones that have been confirmed.
 *
 * Anything still null in `config/business.ts` is omitted rather than guessed
 * at, so the site never publishes an invented phone number or a set of opening
 * hours nobody checked. Fill the config in and these appear on their own.
 */

export function AddressBlock({ className = '' }: { className?: string }) {
  return (
    <address className={`not-italic ${className}`}>
      <span className="block font-medium">{business.name}</span>
      <span className="block">{business.address.street}</span>
      <span className="block">
        {business.address.city}, {business.address.regionName} {business.address.postalCode}
      </span>
    </address>
  );
}

export function PhoneLink({ className = '' }: { className?: string }) {
  if (!business.phone || !business.phoneDisplay) return null;
  return (
    <a href={`tel:${business.phone}`} className={`link-draw ${className}`}>
      {business.phoneDisplay}
    </a>
  );
}

export function EmailLink({ className = '' }: { className?: string }) {
  if (!business.email) return null;
  return (
    <a href={`mailto:${business.email}`} className={`link-draw ${className}`}>
      {business.email}
    </a>
  );
}

export function DirectionsLink({
  className = '',
  children = 'Get directions',
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`link-draw ${className}`}
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * Opening hours. Falls back to an honest line when the hours have not been
 * confirmed — never to a plausible-looking "Mon–Fri 9–5".
 */
export function HoursTable({ className = '' }: { className?: string }) {
  const { hours } = business;

  if (!hours) {
    return (
      <p className={className}>
        Opening hours are confirmed in store. Call ahead or{' '}
        <DirectionsLink>find us on the map</DirectionsLink> before you set out.
      </p>
    );
  }

  return (
    <dl className={`grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 ${className}`}>
      {DAY_ORDER.map((day) => {
        const value = hours[day];
        return (
          <div key={day} className="contents">
            <dt className="opacity-70">{DAY_LABELS[day]}</dt>
            <dd className="tabular-nums">
              {value ? `${formatTime(value.open)} – ${formatTime(value.close)}` : 'Closed'}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** Social links, shown only for accounts that have been verified. */
export function SocialLinks({ className = '' }: { className?: string }) {
  const entries = Object.entries(business.social).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0,
  );
  if (entries.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 ${className}`}>
      {entries.map(([name, href]) => (
        <li key={name}>
          <a href={href} target="_blank" rel="noopener noreferrer" className="link-draw capitalize">
            {name}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
