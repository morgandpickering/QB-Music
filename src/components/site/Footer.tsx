import Link from 'next/link';
import { business } from '@/config/business';
import { FOOTER_COLUMNS } from '@/config/navigation';
import { NewsletterForm } from './NewsletterForm';
import {
  AddressBlock,
  DirectionsLink,
  EmailLink,
  HoursTable,
  PhoneLink,
  SocialLinks,
} from './StoreFacts';
import { Wordmark } from './Wordmark';

/**
 * The footer, which on a shop is a second navigation rather than a legal
 * afterthought — for most visitors it is how they get to Shipping, Returns,
 * and the opening hours.
 *
 * Every link comes from `config/navigation.ts`, so adding a page puts it here
 * without anybody remembering to. Every business fact comes from
 * `config/business.ts` and is omitted when it has not been confirmed.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      {/* ---- Newsletter and address ------------------------------- */}
      <div className="border-b border-rule-dark">
        <div className="shell grid gap-12 py-14 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-16">
          <div>
            <Wordmark size="lg" />
            <p className="measure-narrow mt-5 text-quiet-dark">
              Instruments, lessons, repairs, and sound systems, from a counter in
              downtown Searcy.
            </p>
            <SocialLinks className="mt-6 text-sm text-quiet-dark" />
          </div>

          <div>
            <h2 className="font-sans text-sm font-semibold text-brass-light">Come in</h2>
            <AddressBlock className="mt-4 text-quiet-dark" />
            <div className="mt-4 flex flex-col items-start gap-2 text-quiet-dark">
              <PhoneLink />
              <EmailLink />
              <DirectionsLink />
            </div>
            <div className="mt-5">
              <h3 className="font-sans text-sm font-semibold text-brass-light">
                Opening hours
              </h3>
              <HoursTable className="mt-2 text-sm text-quiet-dark" />
            </div>
          </div>

          <div className="relative">
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* ---- Link columns ----------------------------------------- */}
      <div className="shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {FOOTER_COLUMNS.map((column) => {
          const id = `footer-${column.heading.toLowerCase().replace(/\s+/g, '-')}`;
          return (
            <nav key={column.heading} aria-labelledby={id}>
              <h2 id={id} className="font-sans text-sm font-semibold text-brass-light">
                {column.heading}
              </h2>
              <ul className="mt-5 space-y-2.5 text-[0.9375rem] text-quiet-dark">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="link-draw inline-block py-0.5 transition-colors hover:text-paper"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          );
        })}
      </div>

      {/* ---- Payment and legal ------------------------------------ */}
      <div className="shell border-t border-rule-dark py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-sans text-sm font-semibold text-brass-light">Payment</h2>
            <p className="mt-2 text-sm text-quiet-dark">
              {/*
                No card logos here yet, and deliberately so. Which cards are
                accepted online depends on the payment provider the shop signs
                with, and showing a Visa mark the checkout cannot honour is a
                promise the site would be breaking at the last step. Wire the
                provider up (see PENDING.md) and put its real accepted-methods
                list here.
              */}
              Card payment online once our provider is connected. In store: cash, card,
              and layaway — <Link href="/contact" className="link-draw text-paper">ask at the counter</Link>.
            </p>
          </div>

          <div className="flex flex-col gap-2 text-sm text-quiet-dark lg:items-end">
            <p>
              © {year} {business.legalName}. {business.address.city},{' '}
              {business.address.regionName}.
            </p>
            <p className="marker text-brass-light">{business.tagline}</p>
          </div>
        </div>
      </div>

      {/* Real photography of the shop, staff, and installation work does not
          exist yet — every photo on the site (where one appears at all) is a
          freely licensed stand-in, not a picture of Quattlebaum's own stock.
          See PENDING.md and the /credits page this links to. */}
      <div className="shell border-t border-rule-dark py-4">
        <p className="text-xs text-quiet-dark">
          Photographs on this site are demo imagery, not photographs of Quattlebaum&rsquo;s
          own stock or premises.{' '}
          <Link href="/credits" className="link-draw text-quiet-dark hover:text-paper">
            See photo credits
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
